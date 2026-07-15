package com.tpmp.testprep.service.support;

import com.tpmp.testprep.entity.support.SqlData;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
 * 따옴표 종류(작은따옴표 · 큰따옴표 · 모바일 IME 타이포그래피 따옴표 ‘ ’ “ ”)는 모두 작은따옴표로
 * 통일하여 비교하므로 {@code 과목코드='DB'} 와 {@code 과목코드="DB"} 는 동일하게 취급된다.
 *
 * <p>위 Set 비교(multiSetMatch)가 실패하면, 느슨한 폴백으로 양쪽 문자열의 괄호 부연·
 * 공백·콤마·슬래시를 모두 제거한 뒤 동등 비교한다. 이는 사용자가 구분자 없이
 * 답을 나열한 경우(예: "1. pwd 2. ls 3. cd 4. cp" ↔ 정답 "1. pwd / 2. ls / 3. cd / 4. cp")를
 * 정답 처리하기 위함이다. 폴백은 정규화 후 어느 한쪽이라도 빈 문자열이면 적용하지 않는다.
 * 또한 콤마·슬래시가 전혀 없어도 {@code 1.}·{@code 2)} 등 번호 매김으로만 항목을 나열한
 * 정답(예: "1. FCFS 2. SJF 3. SRT")은 Set 비교 단계에서부터 번호 매김을 구분자로 인식해
 * 항목별로 분리한다(소수점은 영향 없음).
 *
 * <p>CODE 유형은 콤마가 코드 문법의 일부일 수 있으므로 절대 분리하지 않고
 * 통문자열 비교한다. 단, 줄 끝 trailing 공백·CRLF 차이·앞뒤 빈 줄은 정규화하여
 * 무시한다. 줄 내부 연속 공백(들여쓰기)은 정답의 일부이므로 절대 건드리지 않는다.
 * 엄격 비교가 실패하면, 구조 구분자({@code : , ; { } [ ] ( )}) 주변의 가로 공백 차이만
 * 무시하는 느슨 폴백을 추가로 적용한다(줄바꿈은 보존).
 *
 * <p>MULTIPLE_CHOICE·OX 는 기존과 동일하게 trim·equalsIgnoreCase 비교한다.
 *
 * <p>SQL 유형 중 "실행 결과를 쓰시오"류 문항(문항의 {@code SqlData.expectedResult}가 존재)은
 * 위 dispatch 경로를 타지 않고 별도의 {@link #isSqlResultTableCorrect(SqlData.SqlExpectedResult, String)}
 * 로 채점한다 — 호출부(UserQuizService)가 옵션 유무·expectedResult 존재 여부를 먼저 판단해 분기한다.
 *
 * <p><b>대체 정답({@code ||})</b> — DB에 저장된 정답 문자열에 {@code " || "}(공백-파이프 2개-공백,
 * 공백은 없어도 됨) 구분자로 여러 후보를 나열하면, 그중 어느 하나와만 일치해도 정답으로
 * 인정한다(예: {@code "팩토리 메서드 || 팩토리 메소드 || factory method"}). 콤마·슬래시 다중값
 * 비교(위 SHORT_ANSWER 단락 — 모든 값을 다 입력해야 정답)와는 완전히 별도의 상위 계층으로,
 * {@code isCorrect} 3-인자·4-인자 오버로드 진입부에서 정답 문자열을 이 구분자로 먼저 분리한 뒤
 * 각 대체 정답에 대해 기존 유형별·보기 채점 로직을 동일하게 적용한다(하나라도 true면 true).
 * 대체 정답이 1개뿐이면(즉 {@code ||}가 없으면) 기존과 완전히 동일하게 동작한다. 사용자 답안은
 * 분리하지 않으므로, 사용자가 {@code ||}를 실제로 입력한 경우는 리터럴 문자로 취급된다. 단일
 * {@code |} 문자(SQL 결과 테이블 셀 구분자 등)는 이 구분자와 무관하며 전혀 영향받지 않는다.
 */
public final class AnswerGrader {

    private AnswerGrader() {}

    /**
     * 채점 결과를 반환한다. correctAnswer에 {@code ||} 대체 정답 구분자가 있으면(클래스 javadoc
     * "대체 정답" 참고) 각 후보에 대해 {@link #isCorrectSingle(String, String, String)}을 적용해
     * 하나라도 true면 true를 반환한다.
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
        for (String alternative : splitAlternatives(correctAnswer)) {
            if (isCorrectSingle(questionType, alternative, userAnswer)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 대체 정답 분리 없이 단일 정답 문자열 기준으로 채점하는 유형별 dispatch 본체.
     * {@link #isCorrect(String, String, String)}이 {@code ||} 대체 정답 각 후보마다 호출한다.
     */
    private static boolean isCorrectSingle(String questionType, String correctAnswer, String userAnswer) {
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
            if (normalizeCode(correctAnswer).equalsIgnoreCase(normalizeCode(userAnswer))) {
                return true;
            }
            // 느슨 폴백: 구조 구분자(: , ; { } [ ] ( )) 주변의 가로 공백(스페이스·탭) 차이를
            // 무시하고 비교한다. 코드 트레이싱 출력값에서 콜론·콤마 뒤 공백 유무 등 표기
            // 차이를 흡수하기 위함(예: "{2:1, 4:3}" ↔ "{2: 1, 4: 3}"). 줄바꿈은 보존하므로
            // 줄 구조·들여쓰기는 그대로 검사된다.
            return normalizeCodeLoose(correctAnswer).equalsIgnoreCase(normalizeCodeLoose(userAnswer));
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
     * options가 있는 경우도 correctAnswer에 {@code ||} 대체 정답 구분자가 있으면(클래스 javadoc
     * "대체 정답" 참고) 각 후보에 대해 빈칸 순서 비교를 적용해 하나라도 true면 true를 반환한다.
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
            for (String alternative : splitAlternatives(correctAnswer)) {
                if (isCorrectWithOptionsSingle(alternative, userAnswer, options)) {
                    return true;
                }
            }
            return false;
        }
        return isCorrect(questionType, correctAnswer, userAnswer);
    }

    /**
     * 대체 정답 분리 없이 단일 정답 문자열 기준으로 빈칸 순서 비교를 수행하는 본체.
     * {@link #isCorrect(String, String, String, List)}이 {@code ||} 대체 정답 각 후보마다 호출한다.
     */
    private static boolean isCorrectWithOptionsSingle(String correctAnswer, String userAnswer, List<String> options) {
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

    /**
     * SQL "결과 테이블(컬럼×튜플)" 정답 채점.
     *
     * <p>사용자 답안을 줄바꿈(CRLF/CR/LF 모두 허용)으로 행 분리(공백 행 제거)한 뒤, 각 행을
     * {@code |}로 셀 분리한다. 셀은 trim → 소문자화 → 연속 공백 단일화로 정규화하며, 정규화된
     * 셀이 숫자로 파싱되면 수치로 재정규화하므로 "3.0"과 "3"은 동일하게 취급되고, "null"
     * 문자열은 대소문자 무시로 동치 처리된다(소문자화가 이미 포함하므로 별도 처리 불필요).
     *
     * <p>사용자 행 수가 {@code expected.rows().size()}와 다르거나, 어느 한 행이라도 셀 수가
     * {@code expected.columns().size()}와 다르면 즉시 오답이다. {@code orderedRows=true}면
     * 위치별로 정규화된 행을 순서대로 비교하고, {@code false}면 정규화된 행을 canonical 키로
     * 만들어 다중집합(중복 행 카운트 포함) 비교한다.
     *
     * <p>알려진 한계: 셀 값 자체에 {@code |} 문자가 포함되면 셀 분리가 왜곡된다(등록 화면에서
     * 경고 문구로 안내).
     *
     * @param expected   관리자가 등록한 결과 테이블 정답(null이면 이 메서드를 호출하면 안 됨)
     * @param userAnswer 사용자가 제출한 결과 테이블 문자열(행=줄바꿈, 셀={@code |} 구분)
     * @return 정답이면 true, expected·userAnswer가 null이거나 형식이 다르면 false
     */
    public static boolean isSqlResultTableCorrect(SqlData.SqlExpectedResult expected, String userAnswer) {
        if (expected == null || userAnswer == null) {
            return false;
        }
        List<String> expectedColumns = expected.columns();
        List<List<String>> expectedRows = expected.rows();
        if (expectedColumns == null || expectedColumns.isEmpty() || expectedRows == null || expectedRows.isEmpty()) {
            return false;
        }
        int columnCount = expectedColumns.size();

        String normalizedInput = userAnswer.replace("\r\n", "\n").replace("\r", "\n");
        List<String> userLines = Arrays.stream(normalizedInput.split("\n"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
        if (userLines.size() != expectedRows.size()) {
            return false;
        }

        List<List<String>> userRows = new ArrayList<>();
        for (String line : userLines) {
            String[] cells = line.split("\\|", -1);
            if (cells.length != columnCount) {
                return false;
            }
            userRows.add(Arrays.asList(cells));
        }

        List<List<String>> normalizedExpected = normalizeSqlRows(expectedRows);
        List<List<String>> normalizedUser = normalizeSqlRows(userRows);

        if (expected.orderedRows()) {
            return normalizedExpected.equals(normalizedUser);
        }
        return toCanonicalMultiset(normalizedExpected).equals(toCanonicalMultiset(normalizedUser));
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * 정답 문자열을 {@code ||} 대체 정답 구분자(클래스 javadoc "대체 정답" 참고) 기준으로 분리한다.
     * 정규식 {@code \s*\|\|\s*}로 split → 각 항목 trim → 빈 항목 제거. {@code ||}가 없으면
     * (구분자가 매치되지 않으면) 원문 전체를 유일한 원소로 하는 1개짜리 리스트를 반환하므로,
     * 이 경우 호출부의 동작은 기존과 완전히 동일하다. correctAnswer가 null이면 빈 리스트.
     */
    private static List<String> splitAlternatives(String correctAnswer) {
        if (correctAnswer == null) {
            return List.of();
        }
        return Arrays.stream(correctAnswer.split("\\s*\\|\\|\\s*"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    /**
     * options가 null이거나 비어있지 않고, trim 후 비어있지 않은 항목이 1개 이상 존재하면 true.
     * (예: {@code ["", "", "", ""]} 은 false)
     * UserQuizService가 SQL 결과 테이블 채점 분기 여부를 판단할 때도 재사용하므로 public.
     */
    public static boolean hasMeaningfulOptions(List<String> options) {
        if (options == null || options.isEmpty()) {
            return false;
        }
        return options.stream().anyMatch(o -> o != null && !o.trim().isEmpty());
    }

    /**
     * 콤마·슬래시가 없어도 "1. A 2. B 3. C" 처럼 번호 매김({@code 1.}·{@code 2)} …)으로만
     * 나열된 정답을 항목별로 분리할 수 있도록, 열거 마커(문자열 선두 또는 공백 뒤의 1~2자리
     * 숫자 + {@code .}/{@code )} + 공백 1개 이상)를 슬래시 구분자로 치환한다. 소수점(3.14·11.75)
     * 이나 항목 내부 숫자는 "숫자 + 구두점 + 공백" 조건에 해당하지 않으므로 영향받지 않는다.
     * (예: "1. FCFS 2. SJF 3. SRT" → "/FCFS /SJF /SRT" → split 후 [FCFS, SJF, SRT])
     */
    private static String enumerationToSeparators(String raw) {
        return raw.replaceAll("(^|\\s)\\d{1,2}[.)]\\s+", "$1/");
    }

    /**
     * options 채점(빈칸별 순서 비교) 전용 토큰화. 콤마·슬래시로 분리 후 각 토큰을 trim만
     * 적용하고 빈 토큰은 제거한다. Set이 아닌 순서 보존 List를 반환한다.
     */
    private static List<String> tokenizeOrdered(String raw) {
        if (raw == null) {
            return List.of();
        }
        return Arrays.stream(enumerationToSeparators(raw).split("[,/]"))
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
     * CODE 느슨 폴백 정규화: {@link #normalizeCode(String)} 결과에서 구조 구분자
     * ({@code : , ; { } [ ] ( )}) 주변의 가로 공백(스페이스·탭)만 제거한다. 줄바꿈(\n)은
     * {@code [ \t]}에 포함되지 않으므로 줄 구조가 보존되고, 딕셔너리·리스트 출력의
     * 콜론/콤마 뒤 공백 표기 차이만 흡수한다.
     */
    private static String normalizeCodeLoose(String s) {
        return normalizeCode(s).replaceAll("[ \\t]*([:,;{}\\[\\]()])[ \\t]*", "$1");
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
        return Arrays.stream(enumerationToSeparators(raw).split("[,/]"))
                .map(AnswerGrader::normalizeToken)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    /**
     * 단일 토큰 정규화: trim → 소문자화 → 따옴표 종류 통일(작은따옴표로) → 내부 연속 공백을
     * 단일 공백으로 축약 → 말미 괄호 부연 설명 제거(예: "워터링 홀 (Watering Hole)" → "워터링 홀")
     * → 재-trim.
     */
    private static String normalizeToken(String raw) {
        String s = raw.trim().toLowerCase();
        s = normalizeQuotes(s);
        s = s.replaceAll("\\s+", " ");
        s = s.replaceAll("\\s*\\([^)]*\\)\\s*$", "");
        return s.trim();
    }

    /**
     * 큰따옴표({@code "})와 모바일 IME 타이포그래피 따옴표(‘ ’ “ ”)를 모두 작은따옴표({@code '})로
     * 통일한다. SHORT_ANSWER · SCHEDULING · SQL 텍스트 정답 채점에서 따옴표 종류 차이를 무시하기
     * 위함이다(예: {@code 과목코드='DB'} ↔ {@code 과목코드="DB"}). CODE 유형(통문자열 비교)과
     * options 채점({@link #normalizeOptionToken(String)})에는 적용하지 않는다.
     */
    private static String normalizeQuotes(String s) {
        return s.replaceAll("[\"“”‘’]", "'");
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
        s = normalizeQuotes(s);
        s = s.replaceAll("\\([^)]*\\)", "");
        s = s.replaceAll("[\\s,/]", "");
        return s;
    }

    // -----------------------------------------------------------------------
    // SQL 결과 테이블(expectedResult) 채점 전용 helper
    // -----------------------------------------------------------------------

    /**
     * canonical 다중집합 키를 만들 때 셀 사이에 넣는 구분자(U+0001, 제어문자) — 명시적 이스케이프
     * 상수로 선언한다. 사용자가 정상적으로 입력할 수 없는 문자이므로 셀 경계가 뭉개지지 않는다
     * (예: 행 ["12","3"]과 ["1","23"]을 구분자 없이 이어붙이면 둘 다 "123"이 되어 서로 다른 행이
     * 같은 키로 충돌할 수 있다 — 반드시 이 상수를 통해서만 join한다).
     */
    private static final String CANONICAL_ROW_DELIMITER = "\u0001";

    /** 행 목록의 각 셀을 {@link #normalizeSqlCell(String)}로 정규화한 새 행 목록을 반환한다. */
    private static List<List<String>> normalizeSqlRows(List<List<String>> rows) {
        return rows.stream()
                .map(row -> row.stream().map(AnswerGrader::normalizeSqlCell).collect(Collectors.toList()))
                .collect(Collectors.toList());
    }

    /**
     * 이미 정규화된 행 목록을 canonical 문자열(셀을 {@link #CANONICAL_ROW_DELIMITER}로 join)
     * → 등장 횟수 맵으로 변환한다. 다중집합(중복 행 허용) 비교에 사용한다.
     */
    private static Map<String, Integer> toCanonicalMultiset(List<List<String>> normalizedRows) {
        Map<String, Integer> counts = new HashMap<>();
        for (List<String> row : normalizedRows) {
            String key = String.join(CANONICAL_ROW_DELIMITER, row);
            counts.merge(key, 1, Integer::sum);
        }
        return counts;
    }

    /**
     * SQL 결과 테이블 셀 정규화: trim → 소문자화 → 연속 공백 단일화 → 숫자로 파싱 가능하면
     * {@code Double} 재정규화(예: "3.0"·"3"·"03" 모두 "3.0"으로 통일되어 수치 동치 처리됨).
     */
    private static String normalizeSqlCell(String raw) {
        if (raw == null) {
            return "";
        }
        String s = raw.trim().toLowerCase();
        s = s.replaceAll("\\s+", " ");
        Double numeric = tryParseDouble(s);
        return numeric != null ? String.valueOf(numeric) : s;
    }

    private static Double tryParseDouble(String s) {
        if (s.isEmpty()) {
            return null;
        }
        try {
            return Double.parseDouble(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
