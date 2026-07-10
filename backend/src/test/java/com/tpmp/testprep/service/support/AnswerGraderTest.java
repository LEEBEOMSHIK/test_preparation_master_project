package com.tpmp.testprep.service.support;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * AnswerGrader 단위 테스트 (Spring 컨텍스트 없음).
 */
class AnswerGraderTest {

    // -----------------------------------------------------------------------
    // SHORT_ANSWER — 복수 정답 (콤마 분리)
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("SHORT_ANSWER: 순서가 달라도 원소가 같으면 정답")
    void shortAnswer_reversedOrder_correct() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "정답, test", "test, 정답")).isTrue();
    }

    @Test
    @DisplayName("SHORT_ANSWER: 원소 개수가 다르면 오답")
    void shortAnswer_differentSize_incorrect() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "정답", "정답, test")).isFalse();
    }

    @Test
    @DisplayName("SHORT_ANSWER: 공백 차이는 무시")
    void shortAnswer_whitespaceVariation_correct() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "정답,test", "정답, test")).isTrue();
    }

    @Test
    @DisplayName("SHORT_ANSWER: 대소문자 차이는 무시")
    void shortAnswer_caseInsensitive_correct() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "ABC, def", "abc, DEF")).isTrue();
    }

    @Test
    @DisplayName("SHORT_ANSWER: 단일 정답 — 기존 동작 유지")
    void shortAnswer_singleToken_correct() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "정답", "정답")).isTrue();
    }

    @Test
    @DisplayName("SHORT_ANSWER: 단일 정답 불일치")
    void shortAnswer_singleToken_incorrect() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "정답", "오답")).isFalse();
    }

    @Test
    @DisplayName("SHORT_ANSWER: correctAnswer가 null이면 false")
    void shortAnswer_nullCorrect_false() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", null, "정답")).isFalse();
    }

    @Test
    @DisplayName("SHORT_ANSWER: userAnswer가 null이면 false")
    void shortAnswer_nullUser_false() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "정답", null)).isFalse();
    }

    @Test
    @DisplayName("SHORT_ANSWER: 빈 문자열 입력이면 false")
    void shortAnswer_emptyStrings_false() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "", "")).isFalse();
    }

    @Test
    @DisplayName("SHORT_ANSWER: 콤마만 있는 빈 토큰 입력이면 false")
    void shortAnswer_onlyCommas_false() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", ",,,", ",,,")).isFalse();
    }

    // -----------------------------------------------------------------------
    // SHORT_ANSWER — 괄호 부연 설명 제거 (정규화 강화)
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("SHORT_ANSWER: 정답에 괄호 부연이 있어도 사용자가 본체만 입력하면 정답")
    void shortAnswer_parenthesisInCorrect_userWithoutParenthesis_correct() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "워터링 홀 (Watering Hole)", "워터링 홀")).isTrue();
    }

    @Test
    @DisplayName("SHORT_ANSWER: 사용자 답안에 괄호 부연이 있어도 정답 본체와 일치하면 정답")
    void shortAnswer_parenthesisInUser_correctWithoutParenthesis_correct() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "ㄹ", "ㄹ (스캐어웨어)")).isTrue();
    }

    @Test
    @DisplayName("SHORT_ANSWER: 슬래시 구분자도 콤마와 동일하게 다중 정답으로 인식")
    void shortAnswer_slashSeparator_correct() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "pwd/ls", "ls, pwd")).isTrue();
    }

    // -----------------------------------------------------------------------
    // SHORT_ANSWER — 느슨 폴백 (구분자 없이 나열)
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("SHORT_ANSWER: 느슨 폴백 — 정답은 슬래시 구분, 사용자는 공백만으로 나열해도 정답")
    void shortAnswer_looseFallback_noSeparatorInUser_correct() {
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER",
            "1. pwd / 2. ls / 3. cd / 4. cp",
            "1. pwd 2. ls 3. cd 4. cp"
        )).isTrue();
    }

    @Test
    @DisplayName("SHORT_ANSWER: 느슨 폴백 오탐 방지 — 완전히 다른 답은 여전히 오답")
    void shortAnswer_looseFallback_differentAnswer_incorrect() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "a", "b")).isFalse();
    }

    @Test
    @DisplayName("SHORT_ANSWER: 느슨 폴백 오탐 방지 — 정답 중 일부만 입력하면 오답 유지")
    void shortAnswer_looseFallback_partialInput_incorrect() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "사과, 배", "사과")).isFalse();
    }

    // -----------------------------------------------------------------------
    // CODE — 콤마 분리 금지, 통문자열 비교
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("CODE: 공백 차이는 불일치 — 통문자열 비교이므로 분리 안 함")
    void code_commaSeparatedNotSplit_incorrect() {
        // "a,b" vs "a, b" — 공백 차이로 불일치여야 함
        assertThat(AnswerGrader.isCorrect("CODE", "a,b", "a, b")).isFalse();
    }

    @Test
    @DisplayName("CODE: 완전 동일하면 정답")
    void code_exactMatch_correct() {
        assertThat(AnswerGrader.isCorrect("CODE", "a,b", "a,b")).isTrue();
    }

    @Test
    @DisplayName("CODE: 대소문자만 다르면 정답 (equalsIgnoreCase)")
    void code_caseInsensitive_correct() {
        assertThat(AnswerGrader.isCorrect("CODE", "Return X", "return x")).isTrue();
    }

    // ── 정규화 케이스 (보수안 검증) ─────────────────────────────────────────

    @Test
    @DisplayName("CODE: 줄 끝 공백 차이는 정답으로 처리")
    void code_trailingSpaceDiff_correct() {
        String correct = "def foo():  \n    return 1";
        String user    = "def foo():\n    return 1";
        assertThat(AnswerGrader.isCorrect("CODE", correct, user)).isTrue();
    }

    @Test
    @DisplayName("CODE: CRLF vs LF 줄바꿈 차이는 정답으로 처리")
    void code_crlfVsLf_correct() {
        String correct = "def foo():\r\n    return 1";
        String user    = "def foo():\n    return 1";
        assertThat(AnswerGrader.isCorrect("CODE", correct, user)).isTrue();
    }

    @Test
    @DisplayName("CODE: 앞뒤 빈 줄 차이는 정답으로 처리")
    void code_leadingTrailingBlankLines_correct() {
        String correct = "\n\ndef foo():\n    return 1\n\n";
        String user    = "def foo():\n    return 1";
        assertThat(AnswerGrader.isCorrect("CODE", correct, user)).isTrue();
    }

    @Test
    @DisplayName("CODE: 중간(내부) 빈 줄 차이는 오답 (앞뒤만 trim, 내부 줄 차이는 유지)")
    void code_innerBlankLineDiff_incorrect() {
        String correct = "def foo():\n    return 1";
        String user    = "def foo():\n\n    return 1";
        assertThat(AnswerGrader.isCorrect("CODE", correct, user)).isFalse();
    }

    @Test
    @DisplayName("CODE: 들여쓰기(줄 내부 연속 스페이스) 차이는 오답 (보수안 핵심)")
    void code_indentationDiff_incorrect() {
        String correct = "def foo():\n    return 1";   // 스페이스 4칸
        String user    = "def foo():\n  return 1";    // 스페이스 2칸
        assertThat(AnswerGrader.isCorrect("CODE", correct, user)).isFalse();
    }

    @Test
    @DisplayName("CODE: CRLF + 줄끝공백 + 앞뒤빈줄 복합 차이는 정답으로 처리")
    void code_complexNormalization_correct() {
        String correct = "\r\ndef foo():  \r\n    return 1  \r\n\r\n";
        String user    = "def foo():\n    return 1";
        assertThat(AnswerGrader.isCorrect("CODE", correct, user)).isTrue();
    }

    // -----------------------------------------------------------------------
    // SCHEDULING — SHORT_ANSWER와 동일한 콤마 다중값 비교 라우팅
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("SCHEDULING: 순서가 달라도 원소가 같으면 정답 (SHORT_ANSWER와 동일 라우팅)")
    void scheduling_reversedOrder_correct() {
        assertThat(AnswerGrader.isCorrect("SCHEDULING", "P1, P3", "P3, P1")).isTrue();
    }

    @Test
    @DisplayName("SCHEDULING: 원소 개수가 다르면 오답")
    void scheduling_differentSize_incorrect() {
        assertThat(AnswerGrader.isCorrect("SCHEDULING", "P1", "P1, P2")).isFalse();
    }

    @Test
    @DisplayName("SCHEDULING: 느슨 폴백 — 구분자 없이 나열해도 정답 (SHORT_ANSWER와 동일 라우팅)")
    void scheduling_looseFallback_noSeparatorInUser_correct() {
        assertThat(AnswerGrader.isCorrect("SCHEDULING", "1. pwd / 2. ls", "1. pwd 2. ls")).isTrue();
    }

    @Test
    @DisplayName("SCHEDULING: 단일 정답 불일치")
    void scheduling_singleToken_incorrect() {
        assertThat(AnswerGrader.isCorrect("SCHEDULING", "17", "20")).isFalse();
    }

    // -----------------------------------------------------------------------
    // SQL — SHORT_ANSWER와 동일한 콤마 다중값 비교 라우팅
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("SQL: 순서가 달라도 원소가 같으면 정답 (SHORT_ANSWER와 동일 라우팅)")
    void sql_reversedOrder_correct() {
        assertThat(AnswerGrader.isCorrect("SQL", "Alice, Bob", "Bob, Alice")).isTrue();
    }

    @Test
    @DisplayName("SQL: 원소 개수가 다르면 오답")
    void sql_differentSize_incorrect() {
        assertThat(AnswerGrader.isCorrect("SQL", "Alice", "Alice, Bob")).isFalse();
    }

    @Test
    @DisplayName("SQL: 대소문자·공백 차이는 무시")
    void sql_whitespaceAndCase_correct() {
        assertThat(AnswerGrader.isCorrect("SQL", "SELECT name FROM t", "select name from t")).isTrue();
    }

    @Test
    @DisplayName("SQL: 단일 정답 불일치")
    void sql_singleToken_incorrect() {
        assertThat(AnswerGrader.isCorrect("SQL", "Alice", "Bob")).isFalse();
    }

    // -----------------------------------------------------------------------
    // MULTIPLE_CHOICE
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("MULTIPLE_CHOICE: 일치하면 정답")
    void multipleChoice_match_correct() {
        assertThat(AnswerGrader.isCorrect("MULTIPLE_CHOICE", "1", "1")).isTrue();
    }

    @Test
    @DisplayName("MULTIPLE_CHOICE: 불일치하면 오답")
    void multipleChoice_mismatch_incorrect() {
        assertThat(AnswerGrader.isCorrect("MULTIPLE_CHOICE", "1", "2")).isFalse();
    }

    // -----------------------------------------------------------------------
    // OX
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("OX: O 일치하면 정답")
    void ox_match_correct() {
        assertThat(AnswerGrader.isCorrect("OX", "O", "O")).isTrue();
    }

    @Test
    @DisplayName("OX: 불일치하면 오답")
    void ox_mismatch_incorrect() {
        assertThat(AnswerGrader.isCorrect("OX", "O", "X")).isFalse();
    }

    // -----------------------------------------------------------------------
    // 4-인자 오버로드 — 보기(options) 존재 시 유형 무관 번호 비교
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("4-인자: SHORT_ANSWER + options 있음 — 번호(인덱스) 문자열 비교로 채점")
    void withOptions_shortAnswer_indexCompare_correct() {
        List<String> options = Arrays.asList("보기1", "보기2", "보기3");
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "2", "2", options)).isTrue();
    }

    @Test
    @DisplayName("4-인자: SHORT_ANSWER + options 있음 — 번호 불일치는 오답 (콤마 다중정답 로직 미적용)")
    void withOptions_shortAnswer_indexMismatch_incorrect() {
        List<String> options = Arrays.asList("보기1", "보기2", "보기3");
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "2", "3", options)).isFalse();
    }

    @Test
    @DisplayName("4-인자: CODE + options 있음 — 코드 정규화 비교가 아닌 번호 비교로 채점")
    void withOptions_code_indexCompare_notCodeNormalization() {
        List<String> options = Arrays.asList("def foo():\n    return 1", "def bar():\n    return 2");
        // 코드 정규화 비교였다면 아래는 통과하지 않아야 하지만, options 존재 시 번호 비교이므로 정답 처리
        assertThat(AnswerGrader.isCorrect("CODE", "1", "1", options)).isTrue();
        assertThat(AnswerGrader.isCorrect("CODE", "1", "2", options)).isFalse();
    }

    @Test
    @DisplayName("4-인자: OX + options 있음 — 유형 무관 핵심 케이스, 번호 비교로 채점")
    void withOptions_ox_indexCompare_typeIgnored() {
        List<String> options = Arrays.asList("참", "거짓");
        assertThat(AnswerGrader.isCorrect("OX", "1", "1", options)).isTrue();
        assertThat(AnswerGrader.isCorrect("OX", "1", "2", options)).isFalse();
    }

    @Test
    @DisplayName("4-인자: options가 빈 배열이면 기존 3-인자와 동일 동작 (SHORT_ANSWER 다중정답 로직 적용)")
    void withOptions_emptyList_fallsBackToLegacyBehavior() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "정답, test", "test, 정답", Collections.emptyList())).isTrue();
    }

    @Test
    @DisplayName("4-인자: options가 전부 공백 문자열이면 기존 3-인자와 동일 동작")
    void withOptions_blankOnlyList_fallsBackToLegacyBehavior() {
        List<String> blankOptions = Arrays.asList("", "  ", null);
        assertThat(AnswerGrader.isCorrect("OX", "O", "O", blankOptions)).isTrue();
        assertThat(AnswerGrader.isCorrect("OX", "O", "X", blankOptions)).isFalse();
    }

    @Test
    @DisplayName("4-인자: options가 null이면 기존 3-인자와 동일 동작")
    void withOptions_nullList_fallsBackToLegacyBehavior() {
        assertThat(AnswerGrader.isCorrect("MULTIPLE_CHOICE", "1", "1", null)).isTrue();
    }

    // -----------------------------------------------------------------------
    // 4-인자 오버로드 — 빈칸 순서 비교(신규 규칙): 번호↔텍스트 상호 인정, 중복 허용
    // -----------------------------------------------------------------------

    private static final List<String> PWD_OPTIONS = Arrays.asList("ls", "cd", "cp", "pwd");

    @Test
    @DisplayName("빈칸 순서 비교: 단일 번호 정답 회귀 — 일치")
    void withOptions_ordered_singleNumber_correct() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "2", "2", PWD_OPTIONS)).isTrue();
    }

    @Test
    @DisplayName("빈칸 순서 비교: 단일 번호 정답 회귀 — 불일치")
    void withOptions_ordered_singleNumber_incorrect() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "2", "3", PWD_OPTIONS)).isFalse();
    }

    @Test
    @DisplayName("빈칸 순서 비교: 단일 번호 정답에 보기 텍스트로 입력해도 정답")
    void withOptions_ordered_singleNumber_textInput_correct() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "2", "cd", PWD_OPTIONS)).isTrue();
    }

    @Test
    @DisplayName("빈칸 순서 비교: 빈칸 4개 정순 — 정답")
    void withOptions_ordered_fourBlanks_correctOrder() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "4,1,2,3", "4,1,2,3", PWD_OPTIONS)).isTrue();
    }

    @Test
    @DisplayName("빈칸 순서 비교: 빈칸 4개 + 공백 포함 — 정답")
    void withOptions_ordered_fourBlanks_withSpaces_correct() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "4,1,2,3", "4, 1, 2, 3", PWD_OPTIONS)).isTrue();
    }

    @Test
    @DisplayName("빈칸 순서 비교: 빈칸 4개 순서 틀림 — 오답")
    void withOptions_ordered_fourBlanks_wrongOrder_incorrect() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "4,1,2,3", "1,4,2,3", PWD_OPTIONS)).isFalse();
    }

    @Test
    @DisplayName("빈칸 순서 비교: 번호↔텍스트 혼용 — 정답")
    void withOptions_ordered_mixedNumberAndText_correct() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "4,1,2,3", "pwd, ls, cd, cp", PWD_OPTIONS)).isTrue();
    }

    @Test
    @DisplayName("빈칸 순서 비교: 기존 데이터 호환 — 열거 접두 포함 정답 + 번호 입력 — 정답")
    void withOptions_ordered_legacyEnumeratedAnswer_numberInput_correct() {
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER", "1. pwd / 2. ls / 3. cd / 4. cp", "4,1,2,3", PWD_OPTIONS
        )).isTrue();
    }

    @Test
    @DisplayName("빈칸 순서 비교: 기존 데이터 호환 — 열거 접두 포함 정답 + 텍스트 입력 — 정답")
    void withOptions_ordered_legacyEnumeratedAnswer_textInput_correct() {
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER", "1. pwd / 2. ls / 3. cd / 4. cp", "pwd,ls,cd,cp", PWD_OPTIONS
        )).isTrue();
    }

    @Test
    @DisplayName("빈칸 순서 비교: 기존 데이터 호환 — 같은 정답에 순서만 다른 번호 입력은 오답")
    void withOptions_ordered_legacyEnumeratedAnswer_wrongOrderNumbers_incorrect() {
        // 정답 순서: pwd, ls, cd, cp / 사용자 입력 "1,2,3,4" → options 기준 ls, cd, cp, pwd 로 해석되어 불일치
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER", "1. pwd / 2. ls / 3. cd / 4. cp", "1,2,3,4", PWD_OPTIONS
        )).isFalse();
    }

    @Test
    @DisplayName("빈칸 순서 비교: 중복 정답 허용 — 동일 순서면 정답")
    void withOptions_ordered_duplicateAnswers_correct() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "2,2,1", "2,2,1", PWD_OPTIONS)).isTrue();
    }

    @Test
    @DisplayName("빈칸 순서 비교: 중복 정답 허용 — 순서가 다르면 오답")
    void withOptions_ordered_duplicateAnswers_wrongOrder_incorrect() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "2,2,1", "2,1,2", PWD_OPTIONS)).isFalse();
    }

    @Test
    @DisplayName("빈칸 순서 비교: 토큰 수 불일치 — 오답")
    void withOptions_ordered_tokenCountMismatch_incorrect() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "4,1,2,3", "4,1,2", PWD_OPTIONS)).isFalse();
    }
}
