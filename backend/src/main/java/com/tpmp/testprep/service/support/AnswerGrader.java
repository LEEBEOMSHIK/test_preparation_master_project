package com.tpmp.testprep.service.support;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 문항 유형별 채점 공통 헬퍼.
 *
 * <p>보기(options)가 존재하면 유형과 무관하게 번호(인덱스) 문자열 비교로 채점한다.
 *
 * <p>SHORT_ANSWER 에서 정답·사용자 답안 모두 콤마/슬래시로 구분된 복수 정답을 지원한다.
 * 콤마·슬래시 분리 후 토큰을 trim·소문자화·공백 축약하고, 말미의 괄호 부연 설명
 * (예: "워터링 홀 (Watering Hole)" → "워터링 홀")을 제거하여 Set 비교하므로
 * 순서·공백·부연설명 차이는 무시된다. SCHEDULING · SQL 유형도 정답을 관리자가 수동으로
 * 입력하며(자동 계산·SQL 실행 없음) SHORT_ANSWER와 동일하게 다중값 비교로 채점한다.
 *
 * <p>위 Set 비교(multiSetMatch)가 실패하면, 느슨한 폴백으로 양쪽 문자열의 괄호 부연·
 * 공백·콤마·슬래시를 모두 제거한 뒤 동등 비교한다. 이는 사용자가 구분자 없이
 * 답을 나열한 경우(예: "1. pwd 2. ls 3. cd 4. cp" ↔ 정답 "1. pwd / 2. ls / 3. cd / 4. cp")를
 * 정답 처리하기 위함이다. 폴백은 정규화 후 어느 한쪽이라도 빈 문자열이면 적용하지 않는다.
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
        // SHORT_ANSWER, SCHEDULING, SQL — 콤마·슬래시 다중 정답 Set 비교
        // (SCHEDULING·SQL은 자동 계산·SQL 실행 없이 수동 정답을 동일 방식으로 채점)
        if ("SHORT_ANSWER".equals(questionType) || "SCHEDULING".equals(questionType) || "SQL".equals(questionType)) {
            if (multiSetMatch(correctAnswer, userAnswer)) {
                return true;
            }
            // 느슨 폴백: 구분자·괄호 부연·공백 차이를 모두 무시한 전체 문자열 동등 비교
            return looseEqualsIgnoringPunctuation(correctAnswer, userAnswer);
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

    /**
     * 채점 결과를 반환한다 (보기 유무에 따라 채점 방식을 분기).
     *
     * <p>options에 유효한(trim 후 비어있지 않은) 항목이 1개 이상 있으면, 문항 유형과
     * 무관하게 사용자가 입력한 보기 번호(인덱스) 문자열을 정답과 trim·대소문자 무시로
     * 비교한다(MULTIPLE_CHOICE 채점과 동일 경로). options가 없으면 기존
     * {@link #isCorrect(String, String, String)} 3-인자 오버로드로 위임하여
     * 유형별 채점 로직(SHORT_ANSWER 다중정답, CODE 정규화 비교 등)을 그대로 따른다.
     *
     * @param questionType  문항 유형 이름 (options가 없을 때만 사용)
     * @param correctAnswer DB에 저장된 정답 문자열
     * @param userAnswer    사용자가 제출한 답안 문자열
     * @param options       문항 보기 목록 (없으면 null 또는 빈 리스트)
     * @return 정답이면 true, 오답·null·빈 값이면 false
     */
    public static boolean isCorrect(String questionType, String correctAnswer, String userAnswer, List<String> options) {
        if (hasMeaningfulOptions(options)) {
            if (correctAnswer == null || userAnswer == null) {
                return false;
            }
            return correctAnswer.trim().equalsIgnoreCase(userAnswer.trim());
        }
        return isCorrect(questionType, correctAnswer, userAnswer);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * options가 null이거나 비어있지 않고, trim 후 비어있지 않은 항목이 1개 이상 존재하면 true.
     * (예: {@code ["", "", "", ""]} 은 false)
     */
    private static boolean hasMeaningfulOptions(List<String> options) {
        if (options == null || options.isEmpty()) {
            return false;
        }
        return options.stream().anyMatch(o -> o != null && !o.trim().isEmpty());
    }

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
     * 양쪽 문자열을 콤마·슬래시로 분리 → 토큰 정규화(trim·소문자화·공백 축약·괄호 부연 제거)
     * → 빈 토큰 제거 → Set 동일성 검사. 두 Set이 비어있거나 다르면 false.
     */
    private static boolean multiSetMatch(String correctAnswer, String userAnswer) {
        Set<String> correct = tokenize(correctAnswer);
        Set<String> user    = tokenize(userAnswer);
        return !correct.isEmpty() && !user.isEmpty() && correct.equals(user);
    }

    private static Set<String> tokenize(String raw) {
        return Arrays.stream(raw.split("[,/]"))
                .map(AnswerGrader::normalizeToken)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    /**
     * 단일 토큰 정규화: trim → 소문자화 → 내부 연속 공백을 단일 공백으로 축약
     * → 말미 괄호 부연 설명 제거(예: "워터링 홀 (Watering Hole)" → "워터링 홀") → 재-trim.
     */
    private static String normalizeToken(String raw) {
        String s = raw.trim().toLowerCase();
        s = s.replaceAll("\\s+", " ");
        s = s.replaceAll("\\s*\\([^)]*\\)\\s*$", "");
        return s.trim();
    }

    /**
     * 느슨 폴백 비교: 양쪽 문자열을 소문자화 → 괄호 부연 설명 전부 제거 → 공백·콤마·슬래시
     * 전부 제거한 뒤 동등 비교한다. 두 정규화 결과 중 하나라도 빈 문자열이면 false.
     * 숫자·마침표는 보존하므로 "11.75" 같은 숫자 정답에는 영향이 없다.
     */
    private static boolean looseEqualsIgnoringPunctuation(String correctAnswer, String userAnswer) {
        String correct = normalizeLoose(correctAnswer);
        String user    = normalizeLoose(userAnswer);
        return !correct.isEmpty() && !user.isEmpty() && correct.equals(user);
    }

    private static String normalizeLoose(String raw) {
        String s = raw.toLowerCase();
        s = s.replaceAll("\\([^)]*\\)", "");
        s = s.replaceAll("[\\s,/]", "");
        return s;
    }
}
