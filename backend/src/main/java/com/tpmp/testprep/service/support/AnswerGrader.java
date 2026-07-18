package com.tpmp.testprep.service.support;

import com.tpmp.testprep.entity.support.SqlData;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
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
 * 콤마·슬래시 분리 후 토큰을 trim·소문자화·공백 축약하여 순서 무관(집합적) 비교하므로
 * 순서·공백 차이는 무시된다. 말미의 괄호 부연 설명은 <b>대체 표기</b>로 상호 인정한다 —
 * 정답 토큰이 "비동기 균형 모드(ABM)"이면 사용자가 "비동기 균형 모드" 또는 "ABM" 중
 * 무엇을 입력해도 그 토큰과 일치로 처리한다(사용자 토큰의 괄호도 동일하게 해석).
 * SCHEDULING · SQL 유형도 정답을 관리자가 수동으로 입력하며(자동 계산·SQL 실행 없음)
 * SHORT_ANSWER와 동일하게 다중값 비교로 채점한다.
 * 따옴표 종류(작은따옴표 · 큰따옴표 · 모바일 IME 타이포그래피 따옴표 ‘ ’ “ ”)는 모두 작은따옴표로
 * 통일하여 비교하므로 {@code 과목코드='DB'} 와 {@code 과목코드="DB"} 는 동일하게 취급된다.
 *
 * <p>위 Set 비교(multiSetMatch)가 실패하고 양쪽 중 하나에 열거 마커가 있으면, 느슨한 폴백으로 양쪽 문자열의 괄호 부연·
 * 공백·콤마·슬래시를 모두 제거한 뒤 동등 비교한다. 이는 사용자가 구분자 없이
 * 답을 나열한 경우(예: "1. pwd 2. ls 3. cd 4. cp" ↔ 정답 "1. pwd / 2. ls / 3. cd / 4. cp")를
 * 정답 처리하기 위함이다. 폴백은 정규화 후 어느 한쪽이라도 빈 문자열이면 적용하지 않는다.
 * 또한 콤마·슬래시가 전혀 없어도 {@code 1.}·{@code 2)} 등 번호 매김으로만 항목을 나열한
 * 정답(예: "1. FCFS 2. SJF 3. SRT")은 Set 비교 단계에서부터 번호 매김을 구분자로 인식해
 * 항목별로 분리한다(소수점은 영향 없음). 일반 단일 구문에는 이 폴백을 적용하지 않아
 * {@code SYNFlooding}과 {@code SYN Flooding}을 서로 다른 답으로 유지한다.
 *
 * <p><b>열거 마커 확장</b> — SHORT_ANSWER · SCHEDULING · SQL 의 다중값 비교와 느슨 폴백에서는
 * 숫자 번호 매김({@code 1.}·{@code 2)}) 외에 한글 자모({@code ㄱ.}·{@code ㄴ)}), 라틴 단일
 * 문자({@code a.}·{@code b)}), 원문자({@code ①}~{@code ⑳}, 뒤따르는 구두점·공백 불필요)도
 * 항목 구분 마커로 인식해 제거한다. 예: 정답 "ㄱ. Bridge / ㄴ. Observer"에 사용자
 * "Bridge, Observer"는 정답이고, 정답 "a. 192.168.10.0/23 / b. 192.168.12.0/23"에 사용자
 * "192.168.10.0/23, 192.168.12.0/23"도 정답이다(CIDR의 {@code /}는 양쪽에서 동일하게
 * 분리되므로 결과가 대칭이다). 자모·라틴 마커는 뒤에 공백이 있어야 마커로 취급하므로
 * "a.b"·"i.e." 같은 본문 표기는 영향받지 않는다. 숫자 마커는 문자열 시작·공백뿐 아니라
 * 콤마·슬래시 직후({@code ,2. }·{@code /3) })도 인식한다. 번호 뒤 공백이 없어도
 * 비숫자 본문이 바로 시작되면({@code 1.TTL}) 마커로 보되, 다음 문자가 숫자인
 * {@code 11.75} 같은 소수는 제외한다. 괄호 숫자 마커({@code (1)}·{@code (2)} …)도 문자열
 * 시작·공백·콤마·슬래시 직후에 오면 동일하게 항목 구분 마커로 인식한다(예: 정답
 * "(1) ㄷ / (2) ㅁ / (3) ㅅ / (4) ㄱ"에 사용자 "ㄷ,ㅁ,ㅅ,ㄱ"은 정답). 말미 괄호 부연 표기
 * ({@code 비동기 균형 모드(ABM)})나 {@code f(x)}처럼 괄호 안이 숫자만이 아니거나 시작·공백·
 * 콤마·슬래시 직후가 아니면 이 마커로 인식하지 않으므로 서로 충돌하지 않는다. options
 * 채점(빈칸 순서 비교)은 프론트엔드 {@code lib/answer.ts}와 규칙을 동기화해야 하므로 기존
 * 숫자 마커·괄호 숫자 마커만 유지한다.
 * 영문자 사이의 하이픈·일반 dash는 단일 공백으로 정규화해 {@code SYN-Flooding}과
 * {@code SYN Flooding}을 동치로 보되, 숫자·수식의 하이픈은 보존한다.
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
 * 분리하지 않으므로, 사용자가 {@code ||}를 실제로 입력한 경우는 리터럴 문자로 취급된다.
 * SHORT_ANSWER 계열의 단일 {@code |}는 경로/그룹 경계로 인식하며, 그룹 수·그룹 순서와 각
 * 그룹 내부 콤마/슬래시 토큰 순서가 모두 같아야 정답이다. 이 구조 비교는 일반 Set 비교보다
 * 먼저 수행해 서로 다른 경로에 반복된 노드가 중복 제거되는 오탐을 막는다. 콤마로 구분된
 * 숫자-하이픈 경로 목록도 동일하게 경로 수·경로 순서·노드 순서를 보존한다.
 *
 * <p><b>대체 정답 구분자 사용 안 함 플래그(disableAlternativeAnswer)</b> — 문항의 정답에
 * 코드 조건(예: {@code a < m || b[a] < x})처럼 논리 OR로서의 {@code ||}가 포함되는 경우,
 * 위 "대체 정답" 분리 규칙이 이를 오인해 채점·표시를 그르친다. 문항별 boolean 플래그
 * {@code disableAlternativeAnswer}가 true인 문항은 {@code isCorrect}의 boolean 파라미터
 * 오버로드({@link #isCorrect(String, String, String, boolean)},
 * {@link #isCorrect(String, String, String, List, boolean)})를 통해 {@code ||} 분리를
 * 건너뛰고 정답 문자열 전체를 단일 후보로 채점한다. 단일 {@code |} 그룹 로직(위 문단)·
 * 콤마/슬래시 다중값 비교·CODE·options 채점 등 나머지 규칙에는 영향을 주지 않는다.
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
        return isCorrect(questionType, correctAnswer, userAnswer, false);
    }

    /**
     * 채점 결과를 반환한다. {@code disableAlternativeAnswer}가 true면(문항별
     * "대체 정답(||) 구분자 사용 안 함" 플래그) correctAnswer를 {@code ||}로 분리하지 않고
     * 정답 전체를 단일 후보로 채점한다 — 코드 조건 정답(예: {@code a < m || b[a] < x})의
     * {@code ||}가 코드의 논리 OR인 경우 대체 정답 구분자로 오인되는 것을 방지하기 위함이다.
     * false면(기본값) 기존과 동일하게 {@code ||}를 대체 정답 구분자로 해석한다.
     *
     * @param questionType  문항 유형 이름 (QuestionBank.QuestionType 또는 Question.QuestionType 의 name())
     * @param correctAnswer DB에 저장된 정답 문자열
     * @param userAnswer    사용자가 제출한 답안 문자열
     * @param disableAlternativeAnswer true면 {@code ||} 대체 정답 분리를 하지 않음
     * @return 정답이면 true, 오답·null·빈 값이면 false
     */
    public static boolean isCorrect(String questionType, String correctAnswer, String userAnswer,
                                     boolean disableAlternativeAnswer) {
        if (correctAnswer == null || userAnswer == null) {
            return false;
        }
        if (disableAlternativeAnswer) {
            return isCorrectSingle(questionType, correctAnswer, userAnswer);
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
            if (containsSinglePipe(correctAnswer) || containsSinglePipe(userAnswer)) {
                return orderedPipeGroupsMatch(correctAnswer, userAnswer);
            }
            if (isOrderedHyphenPathList(correctAnswer) || isOrderedHyphenPathList(userAnswer)) {
                return orderedHyphenPathListMatch(correctAnswer, userAnswer);
            }
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
        return isCorrect(questionType, correctAnswer, userAnswer, options, false);
    }

    /**
     * 채점 결과를 반환한다 (보기 유무에 따라 채점 방식을 분기 + 문항별
     * "대체 정답(||) 구분자 사용 안 함" 플래그 반영).
     *
     * <p>{@code disableAlternativeAnswer}가 true면 options 경로에서도 correctAnswer를
     * {@code ||}로 분리하지 않고 정답 전체를 단일 후보로 빈칸 순서 비교한다. options가 없는
     * 경우는 {@link #isCorrect(String, String, String, boolean)} 3-인자+플래그 오버로드로
     * 위임하여 동일한 플래그 의미를 유지한다.
     *
     * @param questionType  문항 유형 이름 (options가 없을 때만 사용)
     * @param correctAnswer DB에 저장된 정답 문자열
     * @param userAnswer    사용자가 제출한 답안 문자열
     * @param options       문항 보기 목록 (없으면 null 또는 빈 리스트)
     * @param disableAlternativeAnswer true면 {@code ||} 대체 정답 분리를 하지 않음
     * @return 정답이면 true, 오답·null·빈 값이면 false
     */
    public static boolean isCorrect(String questionType, String correctAnswer, String userAnswer,
                                     List<String> options, boolean disableAlternativeAnswer) {
        if (hasMeaningfulOptions(options)) {
            if (correctAnswer == null || userAnswer == null) {
                return false;
            }
            if (disableAlternativeAnswer) {
                return isCorrectWithOptionsSingle(correctAnswer, userAnswer, options);
            }
            for (String alternative : splitAlternatives(correctAnswer)) {
                if (isCorrectWithOptionsSingle(alternative, userAnswer, options)) {
                    return true;
                }
            }
            return false;
        }
        return isCorrect(questionType, correctAnswer, userAnswer, disableAlternativeAnswer);
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
     *
     * <p>options 채점(빈칸 순서 비교)이 사용한다 — 프론트엔드 {@code lib/answer.ts}의
     * 정규화 규칙과 동기화가 필요하므로 여기는 숫자 마커만 인식한다.
     */
    private static String enumerationToSeparators(String raw) {
        return raw.replaceAll("(^|\\s)\\d{1,2}[.)]\\s+", "$1/");
    }

    /**
     * SHORT_ANSWER 계열(다중값 Set 비교·느슨 폴백) 전용 확장 열거 마커 치환. 숫자 마커에
     * 더해 다음도 항목 구분 마커로 인식해 슬래시 구분자로 치환한다(클래스 javadoc
     * "열거 마커 확장" 참고).
     * <ul>
     *   <li>한글 자모 + 구두점 + 공백: {@code ㄱ. }·{@code ㄴ) }</li>
     *   <li>라틴 단일 문자 + 구두점 + 공백: {@code a. }·{@code B) } — 공백이 반드시 뒤따라야
     *       하므로 "a.b"·"i.e." 같은 본문 표기는 영향받지 않는다</li>
     *   <li>원문자 {@code ①}~{@code ⑳}: 구두점·공백 없이도 마커로 취급 ("①CONSTRAINT" 포함)</li>
     *   <li>괄호 숫자 {@code (1)}~{@code (20)}: 문자열 시작 또는 공백·콤마·슬래시 직후에 오는
     *       {@code (1~2자리 숫자)}(뒤 공백 선택)를 마커로 취급. 말미 괄호 부연 표기(예:
     *       {@code 대칭키(DES)})는 앞에 시작·공백·콤마·슬래시가 아닌 문자(본문)가 오므로
     *       이 규칙에 걸리지 않는다</li>
     * </ul>
     */
    private static String extendedEnumerationToSeparators(String raw) {
        return raw.replaceAll("(^|[\\s,/])\\d{1,2}[.)](?:\\s+|(?=[^\\d\\s]))", "$1/")
                .replaceAll("(^|[\\s,/])[ㄱ-ㅎA-Za-z][.)]\\s+", "$1/")
                .replaceAll("(^|[\\s,/])[①-⑳][.)]?\\s*", "$1/")
                .replaceAll("(^|[\\s,/])\\(\\d{1,2}\\)\\s*", "$1/");
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
     * 접두(예: "(1) ", "1. ", "2) ") 제거 → 재trim. SHORT_ANSWER용 {@link #normalizeToken(String)}과
     * 달리 괄호 부연 설명은 건드리지 않고, 대신 열거 접두를 제거한다는 점이 다르다. 괄호 숫자
     * 접두({@code (1)})를 먼저 제거한 뒤 일반 숫자 접두({@code 1.}·{@code 1)})를 제거하므로
     * 두 표기 모두 동일하게 처리된다. 프론트엔드 {@code lib/answer.ts}의
     * {@code normalizeOptionToken}과 반드시 동일한 규칙을 유지해야 한다.
     */
    private static String normalizeOptionToken(String raw) {
        String s = raw.trim().toLowerCase();
        s = s.replaceAll("\\s+", " ");
        s = s.replaceAll("^\\(\\d+\\)\\s*", "");
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
     * 양쪽 문자열을 확장 열거 마커 처리 후 콤마·슬래시로 분리 → 토큰별 대체 표기 집합
     * (본체 + 말미 괄호 내용) 생성 → 중복 제거 → 개수가 같고 "정답 토큰 ↔ 사용자 토큰"의
     * 1:1 완전 매칭(교집합 존재 시 매칭 가능)이 존재하면 true. 괄호 없는 토큰끼리는
     * 단일 원소 집합의 교집합 검사가 곧 동등 비교이므로 기존 Set 동일성 검사와 같다.
     */
    private static boolean multiSetMatch(String correctAnswer, String userAnswer) {
        List<Set<String>> correct = tokenizeVariantGroups(correctAnswer);
        List<Set<String>> user    = tokenizeVariantGroups(userAnswer);
        if (correct.isEmpty() || user.isEmpty() || correct.size() != user.size()) {
            return false;
        }
        return hasPerfectMatching(correct, user, 0, new boolean[user.size()], new int[]{MATCHING_STEP_LIMIT});
    }

    /** 대체 정답 구분자 {@code ||}가 아닌 단일 pipe가 포함됐는지 확인한다. */
    private static final Pattern SINGLE_PIPE = Pattern.compile("(?<!\\|)\\|(?!\\|)");

    private static boolean containsSinglePipe(String raw) {
        return SINGLE_PIPE.matcher(raw).find();
    }

    /** 콤마로 구분된 숫자-하이픈 경로가 2개 이상인지 판별한다. */
    private static final Pattern HYPHEN_PATH = Pattern.compile("\\s*\\d+(?:\\s*-\\s*\\d+)+\\s*");

    private static boolean isOrderedHyphenPathList(String raw) {
        String[] paths = raw.split(",", -1);
        return paths.length > 1 && Arrays.stream(paths).allMatch(path -> HYPHEN_PATH.matcher(path).matches());
    }

    /** 콤마로 나열한 하이픈 경로의 경로 수·경로 순서·노드 순서를 모두 보존한다. */
    private static boolean orderedHyphenPathListMatch(String correctAnswer, String userAnswer) {
        if (!isOrderedHyphenPathList(correctAnswer) || !isOrderedHyphenPathList(userAnswer)) {
            return false;
        }
        String[] correctPaths = correctAnswer.split(",", -1);
        String[] userPaths = userAnswer.split(",", -1);
        if (correctPaths.length != userPaths.length) {
            return false;
        }
        for (int index = 0; index < correctPaths.length; index++) {
            if (!correctPaths[index].replaceAll("\\s+", "")
                    .equals(userPaths[index].replaceAll("\\s+", ""))) {
                return false;
            }
        }
        return true;
    }

    /**
     * 단일 pipe로 나뉜 그룹과 각 그룹 내부 콤마/슬래시 토큰을 모두 순서 보존 비교한다.
     * 어느 그룹도 비어 있을 수 없으며, 토큰은 기존 괄호 대체·dash·공백 정규화를 재사용한다.
     */
    private static boolean orderedPipeGroupsMatch(String correctAnswer, String userAnswer) {
        if (!containsSinglePipe(correctAnswer) || !containsSinglePipe(userAnswer)) {
            return false;
        }
        String[] correctGroups = SINGLE_PIPE.split(correctAnswer, -1);
        String[] userGroups = SINGLE_PIPE.split(userAnswer, -1);
        if (correctGroups.length != userGroups.length) {
            return false;
        }
        for (int groupIndex = 0; groupIndex < correctGroups.length; groupIndex++) {
            List<String> correctTokens = tokenizeOrdered(correctGroups[groupIndex]);
            List<String> userTokens = tokenizeOrdered(userGroups[groupIndex]);
            if (correctTokens.isEmpty() || userTokens.isEmpty() || correctTokens.size() != userTokens.size()) {
                return false;
            }
            for (int tokenIndex = 0; tokenIndex < correctTokens.size(); tokenIndex++) {
                Set<String> correctVariants = tokenVariants(correctTokens.get(tokenIndex));
                Set<String> userVariants = tokenVariants(userTokens.get(tokenIndex));
                if (correctVariants.isEmpty() || userVariants.isEmpty()
                        || Collections.disjoint(correctVariants, userVariants)) {
                    return false;
                }
            }
        }
        return true;
    }

    /** 완전 매칭 백트래킹 탐색 상한 — 비정상적으로 크거나 악의적인 입력에서의 폭주 방지. */
    private static final int MATCHING_STEP_LIMIT = 100_000;

    /**
     * 콤마·슬래시(및 확장 열거 마커) 분리 후 각 토큰을 {@link #tokenVariants(String)} 집합으로
     * 변환하고, 빈 집합 제거·동일 집합 중복 제거한 순서 보존 목록을 반환한다.
     */
    private static List<Set<String>> tokenizeVariantGroups(String raw) {
        List<Set<String>> groups = new ArrayList<>();
        for (String token : extendedEnumerationToSeparators(raw).split("[,/]")) {
            Set<String> variants = tokenVariants(token);
            if (!variants.isEmpty() && !groups.contains(variants)) {
                groups.add(variants);
            }
        }
        return groups;
    }

    /** 토큰 말미의 괄호 부연/대체 표기: 그룹 1이 괄호 내용. */
    private static final Pattern TRAILING_PARENTHETICAL = Pattern.compile("\\s*\\(([^)]*)\\)\\s*$");
    private static final Pattern ENUMERATION_MARKER = Pattern.compile(
            "(^|[\\s,/])\\d{1,2}[.)](?:\\s+|(?=[^\\d\\s]))"
                    + "|(^|[\\s,/])[ㄱ-ㅎA-Za-z][.)]\\s+"
                    + "|(^|[\\s,/])[①-⑳][.)]?\\s*"
                    + "|(^|[\\s,/])\\(\\d{1,2}\\)\\s*");
    private static final Pattern ENGLISH_WORD_DASH = Pattern.compile(
            "(?<=[A-Za-z])[-‐‑‒–—−](?=[A-Za-z])");

    /**
     * 단일 토큰을 "인정 가능한 표기 집합"으로 변환한다. trim → 소문자화 → 따옴표 통일 →
     * 연속 공백 축약 후, 말미 괄호가 있으면 {본체, 괄호 내용} 두 표기를 모두 인정하고
     * 없으면 토큰 자체 1개만 담는다(예: "비동기 균형 모드(ABM)" → {"비동기 균형 모드", "abm"}).
     */
    private static Set<String> tokenVariants(String rawToken) {
        String s = rawToken.trim().toLowerCase();
        s = normalizeQuotes(s);
        s = normalizeEnglishWordDash(s);
        s = s.replaceAll("\\s+", " ").trim();
        Set<String> variants = new LinkedHashSet<>();
        Matcher m = TRAILING_PARENTHETICAL.matcher(s);
        if (m.find()) {
            String base = s.substring(0, m.start()).trim();
            String parenthetical = m.group(1).trim();
            if (!base.isEmpty()) {
                variants.add(base);
            }
            if (!parenthetical.isEmpty()) {
                variants.add(parenthetical);
            }
        } else if (!s.isEmpty()) {
            variants.add(s);
        }
        return variants;
    }

    /**
     * 정답 토큰 그룹(idx번째부터)과 아직 사용되지 않은 사용자 토큰 그룹 사이에 1:1 완전
     * 매칭이 존재하는지 백트래킹으로 검사한다. 두 그룹은 표기 집합의 교집합이 있으면 매칭
     * 가능하다. remainingSteps 소진 시 false(실사용 답안 규모에서는 도달하지 않음).
     */
    private static boolean hasPerfectMatching(List<Set<String>> correct, List<Set<String>> user,
                                              int idx, boolean[] used, int[] remainingSteps) {
        if (idx == correct.size()) {
            return true;
        }
        for (int j = 0; j < user.size(); j++) {
            if (used[j] || remainingSteps[0] <= 0) {
                continue;
            }
            remainingSteps[0]--;
            if (Collections.disjoint(correct.get(idx), user.get(j))) {
                continue;
            }
            used[j] = true;
            if (hasPerfectMatching(correct, user, idx + 1, used, remainingSteps)) {
                return true;
            }
            used[j] = false;
        }
        return false;
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

    /** 영문 단어 사이의 하이픈·대시만 단어 경계 공백으로 정규화한다. 숫자·수식 하이픈은 보존한다. */
    private static String normalizeEnglishWordDash(String s) {
        return ENGLISH_WORD_DASH.matcher(s).replaceAll(" ");
    }

    /**
     * 느슨 폴백 비교: 양쪽 중 하나에 열거 마커가 있을 때만 소문자화 → 괄호 부연 설명 전부 제거 → 확장 열거 마커
     * (숫자·자모·라틴·원문자) 제거 → 공백·콤마·슬래시 전부 제거한 뒤 동등 비교한다.
     * 두 정규화 결과 중 하나라도 빈 문자열이면 false.
     * 숫자·마침표는 보존하므로 "11.75" 같은 숫자 정답에는 영향이 없다.
     */
    private static boolean looseEqualsIgnoringPunctuation(String correctAnswer, String userAnswer) {
        // 공백을 전부 제거하는 느슨 비교는 열거 답안에만 허용한다. 일반 구문에서
        // "SYNFlooding"과 "SYN Flooding" 같은 서로 다른 표기를 오인하지 않게 한다.
        if (!hasEnumerationMarker(correctAnswer) && !hasEnumerationMarker(userAnswer)) {
            return false;
        }
        String correct = normalizeLoose(correctAnswer);
        String user    = normalizeLoose(userAnswer);
        return !correct.isEmpty() && !user.isEmpty() && correct.equals(user);
    }

    private static boolean hasEnumerationMarker(String raw) {
        return ENUMERATION_MARKER.matcher(raw).find();
    }

    private static String normalizeLoose(String raw) {
        String s = raw.toLowerCase();
        s = normalizeQuotes(s);
        s = normalizeEnglishWordDash(s);
        s = s.replaceAll("\\([^)]*\\)", "");
        s = extendedEnumerationToSeparators(s);
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
