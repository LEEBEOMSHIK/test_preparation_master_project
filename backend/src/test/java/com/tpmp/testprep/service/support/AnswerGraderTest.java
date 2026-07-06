package com.tpmp.testprep.service.support;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

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
    @DisplayName("SCHEDULING: 단일 정답 불일치")
    void scheduling_singleToken_incorrect() {
        assertThat(AnswerGrader.isCorrect("SCHEDULING", "17", "20")).isFalse();
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
}
