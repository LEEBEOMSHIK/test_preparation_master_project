package com.tpmp.testprep.service.support;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 문항 유형별 채점 공통 헬퍼.
 *
 * <p>보기(options)가 존재하면 유형과 무관하게 "빈칸 순서대로" 채점한다. 문제 본문에 빈칸이
 * 여러 개 있고 각 빈칸을 보기에서 찾아 답하는 형식을 지원하기 위해, 정답·사용자 답안을 각각
 * 콤마·슬래시로 분리한 뒤 같은 위치(순서)의 토큰끼리 비교한다(순서 보존 — Set 아님). 토큰 수가
 * 다르면 오답이며, 전 위치가 일치해야만 정답(부분 점수 없음)이다. 각 토큰은 보기 번호(1-based
 * 인덱스)와 보기 텍스트를 상호 인정한다 — 예: 정답 "4"와 사용자 입력 "pwd"가 4번 보기 텍스트라면
 * 동일하게 취급한다. 같은 보기 번호를 여러 위치에 중복 지정할 수 있다.
 * 알려진 한계: 보기 텍스트 자체에 콤마/슬래시가 포함되면 분리가 왜곡될 수 있음 — 이 경우
 * 번호로 입력해야 한다.
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
     * <p>options에 유효한(trim 후 비어있지 않은) 항목이 1개 이상 있으면, 문항 유형과 무관하게
     * "빈칸 순서대로" 채점한다. 정답·사용자 답안을 각각 콤마(,)·슬래시(/)로 분리해 순서를
     * 보존한 토큰 리스트를 만들고(빈 토큰 제거), 두 리스트의 토큰 수가 다르면 즉시 오답이다.
     * 같은 위치의 토큰끼리 {@link #tokenEquals(String, String, List)} 로 비교하며, 각 토큰은
     * 선행 열거 접두("1. ", "2) " 등)를 제거한 뒤 1..options.size() 범위의 순수 숫자면 그
     * 위치의 보기 텍스트로, 아니면 정규화된 원문 그대로 취급해 번호·보기 텍스트를 상호
     * 인정한다. 전 위치가 일치해야만 정답(부분 점수 없음)이며, 같은 보기 번호를 여러 위치에
     * 중복 지정하는 것도 허용한다. options가 없으면 기존
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
            List<String> correctTokens = tokenizeOrdered(correctAnswer);
            List<String> userTokens    = tokenizeOrdered(userAnswer);
            if (correctTokens.isEmpty() || userTokens.isEmpty() || correctTokens.size() != userTokens.size()) {
                return false;
            }
            for (int i = 0; i < correctTokens.size(); i++) {
                if (!tokenEquals(correctTokens.get(i), userTokens.get(i), options)) {
                    return false;
                }
            }
            return true;
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
     * options 채점(빈칸별 순서 비교) 전용 토큰화. 콤마·슬래시로 분리 후 각 토큰을 trim만
     * 적용하고 빈 토큰은 제거한다. Set이 아닌 순서 보존 List를 반환한다.
     */
    private static List<String> tokenizeOrdered(String raw) {
        if (raw == null) {
            return List.of();
        }
        return Arrays.stream(raw.split("[,/]"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    /**
     * options 채점용 단일 토큰 정규화: trim → 소문자화 → 내부 연속 공백 단일화 → 선행 열거
     * 접두(예: "1. ", "2) ") 제거 → 재trim. SHORT_ANSWER용 {@link #normalizeToken(String)}과
     * 달리 괄호 부연 설명은 건드리지 않고, 대신 열거 접두를 제거한다는 점이 다르다.
     */
    private static String normalizeOptionToken(String raw) {
        String s = raw.trim().toLowerCase();
        s = s.replaceAll("\\s+", " ");
        s = s.replaceAll("^\\d+\\s*[.)]\\s*", "");
        return s.trim();
    }

    /**
     * 단일 토큰을 options 기준으로 "정규화된 비교 가능 형태"로 변환한다. 정규화 결과가
     * 1..options.size() 범위의 순수 숫자면 해당 보기 텍스트(동일 정규화 적용)로 치환하고,
     * 아니면 정규화된 원문을 그대로 반환한다.
     */
    private static String resolveOptionToken(String raw, List<String> options) {
        String normalized = normalizeOptionToken(raw);
        if (normalized.matches("^\\d+$")) {
            int n = Integer.parseInt(normalized);
            if (n >= 1 && n <= options.size()) {
                return normalizeOptionToken(options.get(n - 1));
            }
        }
        return normalized;
    }

    /**
     * 같은 위치의 정답·사용자 토큰이 동일한 보기를 가리키는지 비교한다(번호↔보기 텍스트
     * 상호 인정).
     */
    private static boolean tokenEquals(String correctTok, String userTok, List<String> options) {
        return resolveOptionToken(correctTok, options).equals(resolveOptionToken(userTok, options));
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
