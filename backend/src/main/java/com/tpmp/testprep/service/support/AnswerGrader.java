package com.tpmp.testprep.service.support;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 문항 유형별 채점 공통 헬퍼.
 *
 * <p>SHORT_ANSWER 에서 정답·사용자 답안 모두 콤마로 구분된 복수 정답을 지원한다.
 * 콤마 분리 후 토큰을 trim·소문자화하여 Set 비교하므로 순서와 공백 차이는 무시된다.
 * SCHEDULING 유형도 정답을 관리자가 수동으로 입력하며(자동 계산 없음) SHORT_ANSWER와
 * 동일하게 콤마 다중값 비교로 채점한다.
 *
 * <p>CODE 유형은 콤마가 코드 문법의 일부일 수 있으므로 절대 분리하지 않고
 * 통문자열 비교한다. 단, 줄 끝 trailing 공백·CRLF 차이·앞뒤 빈 줄은 정규화하여
 * 무시한다. 줄 내부 연속 공백(들여쓰기)은 정답의 일부이므로 절대 건드리지 않는다.
 *
 * <p>MULTIPLE_CHOICE·OX 는 기존과 동일하게 trim·equalsIgnoreCase 비교한다.
 */
public final class AnswerGrader {

    private AnswerGrader() {}

    /**
     * 채점 결과를 반환한다.
     *
     * @param questionType  문항 유형 이름 (QuestionBank.QuestionType 또는 Question.QuestionType 의 name())
     * @param correctAnswer DB에 저장된 정답 문자열
     * @param userAnswer    사용자가 제출한 답안 문자열
     * @return 정답이면 true, 오답·null·빈 값이면 false
     */
    public static boolean isCorrect(String questionType, String correctAnswer, String userAnswer) {
        if (correctAnswer == null || userAnswer == null) {
            return false;
        }
        // SHORT_ANSWER, SCHEDULING — 콤마 다중 정답 Set 비교 (SCHEDULING은 자동 계산 없이 수동 정답을 동일 방식으로 채점)
        if ("SHORT_ANSWER".equals(questionType) || "SCHEDULING".equals(questionType)) {
            return multiSetMatch(correctAnswer, userAnswer);
        }
        if ("CODE".equals(questionType)) {
            // CODE 정규화 비교:
            // - CRLF→LF, 단독 CR→LF
            // - 각 줄 끝 trailing 공백 제거
            // - 전체 앞뒤 빈 줄/공백 제거
            // - 줄 내부 연속 공백(들여쓰기)은 건드리지 않음
            return normalizeCode(correctAnswer).equalsIgnoreCase(normalizeCode(userAnswer));
        }
        // MULTIPLE_CHOICE, OX — 통문자열 비교
        return correctAnswer.trim().equalsIgnoreCase(userAnswer.trim());
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * CODE 유형 정규화 (보수안):
     * <ol>
     *   <li>CRLF → LF, 단독 CR → LF</li>
     *   <li>각 줄 끝 trailing 공백 제거 (stripTrailing)</li>
     *   <li>전체 앞뒤 빈 줄·공백 제거 (strip)</li>
     * </ol>
     * 줄 내부 연속 공백(들여쓰기)은 정답의 일부이므로 절대 건드리지 않는다.
     */
    private static String normalizeCode(String s) {
        // 1. CRLF → LF, 단독 CR → LF
        String normalized = s.replace("\r\n", "\n").replace("\r", "\n");
        // 2. 각 줄 끝 trailing 공백 제거
        String[] lines = normalized.split("\n", -1);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < lines.length; i++) {
            sb.append(lines[i].stripTrailing());
            if (i < lines.length - 1) {
                sb.append('\n');
            }
        }
        // 3. 전체 앞뒤 빈 줄/공백 제거
        return sb.toString().strip();
    }

    /**
     * 양쪽 문자열을 콤마로 분리 → 토큰 trim·소문자화 → 빈 토큰 제거 → Set 동일성 검사.
     * 두 Set이 비어있거나 크기가 다르면 false.
     */
    private static boolean multiSetMatch(String correctAnswer, String userAnswer) {
        Set<String> correct = tokenize(correctAnswer);
        Set<String> user    = tokenize(userAnswer);
        return !correct.isEmpty() && !user.isEmpty() && correct.equals(user);
    }

    private static Set<String> tokenize(String raw) {
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }
}
