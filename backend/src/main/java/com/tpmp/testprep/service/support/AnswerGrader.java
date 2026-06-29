package com.tpmp.testprep.service.support;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 문항 유형별 채점 공통 헬퍼.
 *
 * <p>SHORT_ANSWER 에서 정답·사용자 답안 모두 콤마로 구분된 복수 정답을 지원한다.
 * 콤마 분리 후 토큰을 trim·소문자화하여 Set 비교하므로 순서와 공백 차이는 무시된다.
 *
 * <p>CODE 유형은 콤마가 코드 문법의 일부일 수 있으므로 절대 분리하지 않고
 * 기존과 동일하게 통문자열 equalsIgnoreCase 비교한다.
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
        if ("SHORT_ANSWER".equals(questionType)) {
            return multiSetMatch(correctAnswer, userAnswer);
        }
        // MULTIPLE_CHOICE, OX, CODE — 통문자열 비교
        return correctAnswer.trim().equalsIgnoreCase(userAnswer.trim());
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

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
