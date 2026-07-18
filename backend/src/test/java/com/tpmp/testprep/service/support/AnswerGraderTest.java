package com.tpmp.testprep.service.support;

import com.tpmp.testprep.entity.support.SqlData;
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
    // SHORT_ANSWER — 확장 열거 마커 (ㄱ.·①·a.) + 괄호 대체 표기
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("SHORT_ANSWER: 한글 자모 마커(ㄱ.·ㄴ.) 정답 + 마커 없는 사용자 입력 — 정답")
    void shortAnswer_jamoMarker_userWithoutMarker_correct() {
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER", "ㄱ. Bridge / ㄴ. Observer", "Bridge, Observer"
        )).isTrue();
    }

    @Test
    @DisplayName("SHORT_ANSWER: 한글 자모 마커 정답 — 일부만 입력하면 오답 유지")
    void shortAnswer_jamoMarker_partialInput_incorrect() {
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER", "ㄱ. Bridge / ㄴ. Observer", "Bridge"
        )).isFalse();
    }

    @Test
    @DisplayName("SHORT_ANSWER: 원문자 마커(①~⑤) 정답 + 마커 없는 사용자 입력 — 정답")
    void shortAnswer_circledNumberMarker_userWithoutMarker_correct() {
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER",
            "① CONSTRAINT / ② FOREIGN / ③ TEAM_ID / ④ REFERENCES / ⑤ TEAM_ID2",
            "CONSTRAINT, FOREIGN, TEAM_ID, REFERENCES, TEAM_ID2"
        )).isTrue();
    }

    @Test
    @DisplayName("SHORT_ANSWER: 라틴 문자 마커(a.·b.) 정답 + 값 내부 슬래시(CIDR) — 정답")
    void shortAnswer_latinMarker_slashInsideValue_correct() {
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER",
            "a. 192.168.10.0/23 / b. 192.168.12.0/23",
            "192.168.10.0/23, 192.168.12.0/23"
        )).isTrue();
    }

    @Test
    @DisplayName("SHORT_ANSWER: 라틴 마커 + CIDR — 프리픽스 길이가 다르면 오답 유지")
    void shortAnswer_latinMarker_wrongCidrPrefix_incorrect() {
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER",
            "a. 192.168.10.0/23 / b. 192.168.12.0/23",
            "192.168.10.0/24, 192.168.12.0/24"
        )).isFalse();
    }

    @Test
    @DisplayName("SHORT_ANSWER: 마커 뒤 공백이 없으면 본문 표기(a.b, i.e.)는 분리하지 않음")
    void shortAnswer_letterDotWithoutSpace_notTreatedAsMarker() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "a.b", "a.b")).isTrue();
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "a.b", "a, b")).isFalse();
    }

    @Test
    @DisplayName("SHORT_ANSWER: 괄호 대체 표기 — 정답 '본체(약어)'에 본체·약어 어느 쪽을 입력해도 정답")
    void shortAnswer_parentheticalAlternative_eitherAccepted() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "비동기 균형 모드(ABM)", "ABM")).isTrue();
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "비동기 균형 모드(ABM)", "비동기 균형 모드")).isTrue();
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "비동기 균형 모드(ABM)", "NRM")).isFalse();
    }

    @Test
    @DisplayName("SHORT_ANSWER: 괄호 대체 표기 — 다중 정답에서 본체·약어 혼용 입력 — 정답")
    void shortAnswer_parentheticalAlternative_multiValue_mixed_correct() {
        String correct = "1. 정보 프레임(정보) / 2. 감독 프레임(감독) / 3. 비번호 프레임(비번호)"
                + " / 4. 비동기 균형 모드(ABM) / 5. 비동기 응답 모드(ARM)";
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER", correct, "정보 프레임, 감독 프레임, 비번호 프레임, ABM, ARM"
        )).isTrue();
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER", correct, "정보, 감독, 비번호, 비동기 균형 모드, 비동기 응답 모드"
        )).isTrue();
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER", correct, "정보 프레임, 감독 프레임, 비번호 프레임, ABM, NRM"
        )).isFalse();
    }

    @Test
    @DisplayName("SHORT_ANSWER: 괄호 대체 표기 — 1:1 매칭이므로 같은 표기를 두 빈칸에 재사용할 수 없음")
    void shortAnswer_parentheticalAlternative_backtracking_oneToOne() {
        // 정답 [ {a,b}, {b} ] 에 사용자 [b, a] — b를 {b}에, a를 {a,b}에 배정해야만 성립(백트래킹 검증)
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "a(b) / b", "b, a")).isTrue();
        // 사용자 [b, b] 는 중복 제거되어 개수 불일치 → 오답
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "a(b) / b", "b, b")).isFalse();
    }

    // -----------------------------------------------------------------------
    // SHORT_ANSWER — 괄호 숫자 마커 ((1)·(2) …) — HIST-20260718-001
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("괄호 숫자 마커: 정답 4개 항목 + 마커 없는 사용자 콤마 입력 — 정답 (id 28 실측)")
    void shortAnswer_parenNumberMarker_userWithoutMarker_correct() {
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER", "(1) ㄷ / (2) ㅁ / (3) ㅅ / (4) ㄱ", "ㄷ,ㅁ,ㅅ,ㄱ"
        )).isTrue();
    }

    @Test
    @DisplayName("괄호 숫자 마커: 슬래시 구분 사용자 입력도 정답 (id 28 실측)")
    void shortAnswer_parenNumberMarker_userSlashSeparated_correct() {
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER", "(1) ㄷ / (2) ㅁ / (3) ㅅ / (4) ㄱ", "ㄷ / ㅁ / ㅅ / ㄱ"
        )).isTrue();
    }

    @Test
    @DisplayName("괄호 숫자 마커: 정답 3개 항목 — 정답 (id 32 실측)")
    void shortAnswer_parenNumberMarker_threeItems_correct() {
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER", "(1) ㅁ / (2) ㄴ / (3) ㄹ", "ㅁ,ㄴ,ㄹ"
        )).isTrue();
    }

    @Test
    @DisplayName("괄호 숫자 마커: 영문 약어 항목 — 정답")
    void shortAnswer_parenNumberMarker_englishAbbreviation_correct() {
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER", "(1) ARP / (2) RARP", "ARP, RARP"
        )).isTrue();
    }

    @Test
    @DisplayName("괄호 숫자 마커: 일부만 입력하면 오답 유지")
    void shortAnswer_parenNumberMarker_partialInput_incorrect() {
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER", "(1) ㄷ / (2) ㅁ / (3) ㅅ / (4) ㄱ", "ㄷ,ㅁ,ㅅ"
        )).isFalse();
    }

    @Test
    @DisplayName("괄호 숫자 마커: 순서가 달라도(콤마 다중값 Set 비교) 정답")
    void shortAnswer_parenNumberMarker_reversedOrder_correct() {
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER", "(1) ㄷ / (2) ㅁ / (3) ㅅ / (4) ㄱ", "ㄱ,ㅅ,ㅁ,ㄷ"
        )).isTrue();
    }

    @Test
    @DisplayName("괄호 숫자 마커: SCHEDULING·SQL 유형도 동일하게 인식")
    void parenNumberMarker_schedulingAndSql_correct() {
        String correct = "(1) FCFS / (2) SJF";
        assertThat(AnswerGrader.isCorrect("SCHEDULING", correct, "FCFS, SJF")).isTrue();
        assertThat(AnswerGrader.isCorrect("SQL", correct, "FCFS, SJF")).isTrue();
    }

    @Test
    @DisplayName("괄호 숫자 마커 회귀 방지: 말미 괄호 대체 표기는 여전히 마커로 오분리되지 않음")
    void parenNumberMarker_regression_trailingParentheticalAlternativeStillWorks() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "비동기 균형 모드(ABM)", "ABM")).isTrue();
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "비동기 균형 모드(ABM)", "비동기 균형 모드")).isTrue();
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "대칭키(DES)", "DES")).isTrue();
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "대칭키(DES)", "대칭키")).isTrue();
    }

    @Test
    @DisplayName("괄호 숫자 마커 회귀 방지: 함수 표기 f(x)·좌표 (3,4)는 마커로 오분리되지 않음")
    void parenNumberMarker_regression_functionAndCoordinateNotSplit() {
        // f(x) — 괄호 안이 숫자가 아니므로 애초에 대상 아님, 통문자열 그대로 비교되어 일치해야 정답
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "f(x)", "f(x)")).isTrue();
        // (3,4) — 괄호 안이 "숫자,숫자" 형태(닫는 괄호 직전이 순수 1~2자리 숫자가 아님)라 마커 아님
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "(3,4)", "(3,4)")).isTrue();
    }

    @Test
    @DisplayName("괄호 숫자 마커 회귀 방지: 기존 숫자·자모·라틴·원문자 마커는 그대로 동작")
    void parenNumberMarker_regression_existingMarkersUnaffected() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "1. FCFS 2. SJF", "FCFS,SJF")).isTrue();
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER", "ㄱ. Bridge / ㄴ. Observer", "Bridge, Observer"
        )).isTrue();
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER",
            "① CONSTRAINT / ② FOREIGN / ③ TEAM_ID / ④ REFERENCES / ⑤ TEAM_ID2",
            "CONSTRAINT, FOREIGN, TEAM_ID, REFERENCES, TEAM_ID2"
        )).isTrue();
    }

    // -----------------------------------------------------------------------
    // 실사용 2025년 2회 11·19·20번 — 명시적 대체답, dash, 구분자 직후 숫자 마커
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("2025년 2회 11번: canonical 경로와 기존 콤마·파이프 경로 표기를 대체 정답으로 인정")
    void shortAnswer_q11_explicitPathAlternatives_correct() {
        String correct = "1-2-3-4-5-6-7, 1-2-4-5-6-1"
                + " || 1,2,3,4,5,6,7 | 1,2,4,5,6,1";
        assertThat(AnswerGrader.isCorrect(
                "SHORT_ANSWER", correct, "1-2-3-4-5-6-7, 1-2-4-5-6-1")).isTrue();
        assertThat(AnswerGrader.isCorrect(
                "SHORT_ANSWER", correct, "1,2,3,4,5,6,7 | 1,2,4,5,6,1")).isTrue();
        assertThat(AnswerGrader.isCorrect(
                "SHORT_ANSWER", correct, "1-2-3-4-5-6-7")).isFalse();
        assertThat(AnswerGrader.isCorrect(
                "SHORT_ANSWER", correct, "1-2-4-5-6-1, 1-2-3-4-5-6-7")).isFalse();
        assertThat(AnswerGrader.isCorrect(
                "SHORT_ANSWER", correct, "1-2-3-4-5-6-7, 1-2-4-5-1")).isFalse();
        assertThat(AnswerGrader.isCorrect(
                "SHORT_ANSWER", correct, "1,2,3,4,5,6,7 | 1")).isFalse();
        assertThat(AnswerGrader.isCorrect(
                "SHORT_ANSWER", correct, "1,2,4,5,6,1 | 1,2,3,4,5,6,7")).isFalse();
        assertThat(AnswerGrader.isCorrect(
                "SHORT_ANSWER", correct, "1,2,3,4,5,6,7 | 1,2,4,5,1")).isFalse();
    }

    @Test
    @DisplayName("2025년 2회 19번: 영문 단어 사이 하이픈·대시는 공백과 동치")
    void shortAnswer_q19_englishWordDash_correct() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "SYN Flooding", "SYN-Flooding")).isTrue();
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "SYN Flooding", "SYN–Flooding")).isTrue();
    }

    @Test
    @DisplayName("2025년 2회 20번: 콤마 직후 숫자 마커를 제거해 실제 답안을 채점")
    void shortAnswer_q20_markerImmediatelyAfterComma_correct() {
        String correct = "1. TTL,2. 부장, 3. 대리, 4. 과장, 5. 차장";
        assertThat(AnswerGrader.isCorrect(
                "SHORT_ANSWER", correct, "TTL, 부장, 대리, 과장, 차장")).isTrue();
        assertThat(AnswerGrader.isCorrect(
                "SHORT_ANSWER",
                "1.TTL,2.부장,3.대리,4.과장,5.차장",
                "TTL, 부장, 대리, 과장, 차장")).isTrue();
    }

    @Test
    @DisplayName("다중값: 슬래시 직후 숫자 마커를 세 유형에서 동일하게 인식")
    void multiValue_markerImmediatelyAfterSlash_allTypes_correct() {
        String correct = "1. TTL/2. 부장/3) 대리";
        String user = "TTL, 부장, 대리";
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", correct, user)).isTrue();
        assertThat(AnswerGrader.isCorrect("SCHEDULING", correct, user)).isTrue();
        assertThat(AnswerGrader.isCorrect("SQL", correct, user)).isTrue();
    }

    @Test
    @DisplayName("dash 정규화 오탐 방지: 숫자·수식 하이픈과 무구분 영문은 보존")
    void dashNormalization_strictNonMatches() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "1-2", "1 2")).isFalse();
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "SYNFlooding", "SYN Flooding")).isFalse();
    }

    @Test
    @DisplayName("열거 정규화 오탐 방지: 소수·IP·Q20 다른 항목은 오답")
    void enumerationNormalization_strictNonMatches() {
        assertThat(AnswerGrader.isCorrect("SCHEDULING", "11.75", "1175")).isFalse();
        assertThat(AnswerGrader.isCorrect(
                "SHORT_ANSWER", "192.168.10.0/23", "192.168.10.0/24")).isFalse();
        assertThat(AnswerGrader.isCorrect(
                "SHORT_ANSWER",
                "1. TTL,2. 부장, 3. 대리, 4. 과장, 5. 차장",
                "TTL, 부장, 대리, 과장, 사원")).isFalse();
    }

    // -----------------------------------------------------------------------
    // CODE — 콤마 분리 금지, 통문자열 비교
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("CODE: 구조 구분자(콤마) 주변 공백 차이는 느슨 폴백으로 정답 처리")
    void code_delimiterSpacingDiff_correct() {
        // 10b44a5 — 구조 구분자(: , ; { } [ ] ( )) 주변 가로 공백만 무시하는 느슨 폴백 정책
        assertThat(AnswerGrader.isCorrect("CODE", "a,b", "a, b")).isTrue();
    }

    @Test
    @DisplayName("CODE: 콤마 다중값 분리를 하지 않음 — 순서가 다르면 오답")
    void code_commaSeparatedNotSplit_orderMatters_incorrect() {
        // SHORT_ANSWER였다면 순서 무관 정답이지만 CODE는 통문자열 비교이므로 오답
        assertThat(AnswerGrader.isCorrect("CODE", "a,b", "b,a")).isFalse();
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

    @Test
    @DisplayName("CODE: 따옴표 종류 차이는 정규화 대상이 아니므로 여전히 오답")
    void code_quoteStyleDiff_stillIncorrect() {
        assertThat(AnswerGrader.isCorrect("CODE", "print('a')", "print(\"a\")")).isFalse();
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
    // SHORT_ANSWER · SCHEDULING · SQL — 따옴표 종류 차이 무시 (정규화 강화)
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("SQL: 정답은 작은따옴표, 사용자는 큰따옴표를 써도 정답")
    void sql_quoteStyleDiff_straightDoubleVsSingle_correct() {
        assertThat(AnswerGrader.isCorrect("SQL", "과목코드='DB'", "과목코드=\"DB\"")).isTrue();
    }

    @Test
    @DisplayName("SQL: 모바일 IME 타이포그래피 따옴표(‘ ’)를 써도 정답")
    void sql_quoteStyleDiff_typographicQuote_correct() {
        assertThat(AnswerGrader.isCorrect("SQL", "과목코드='DB'", "과목코드=’DB’")).isTrue();
    }

    @Test
    @DisplayName("SHORT_ANSWER: 따옴표 종류 차이는 무시하고 정답 인정")
    void shortAnswer_quoteStyleDiff_correct() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "'DB'", "\"DB\"")).isTrue();
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

    // -----------------------------------------------------------------------
    // 4-인자 오버로드 — 괄호 숫자 접두("(1) ") 정답 (options 경로, normalizeOptionToken) — HIST-20260718-001
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("빈칸 순서 비교: 괄호 숫자 접두 정답(보기 번호) + 번호 입력 — 정답")
    void withOptions_ordered_parenNumberPrefixAnswer_numberInput_correct() {
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER", "(1) 2 / (2) 4", "2,4", PWD_OPTIONS
        )).isTrue();
    }

    @Test
    @DisplayName("빈칸 순서 비교: 괄호 숫자 접두 정답(보기 텍스트) + 텍스트 입력 — 정답")
    void withOptions_ordered_parenNumberPrefixAnswer_textInput_correct() {
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER", "(1) pwd / (2) ls", "pwd, ls", PWD_OPTIONS
        )).isTrue();
    }

    @Test
    @DisplayName("빈칸 순서 비교: 괄호 숫자 접두 정답(보기 번호) + 번호↔텍스트 혼용 입력 — 정답")
    void withOptions_ordered_parenNumberPrefixAnswer_mixedInput_correct() {
        // 정답 (1)=4번(pwd), (2)=1번(ls) — 사용자가 첫 빈칸은 번호, 둘째 빈칸은 텍스트로 입력해도 정답
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER", "(1) 4 / (2) 1", "4, ls", PWD_OPTIONS
        )).isTrue();
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER", "(1) 4 / (2) 1", "pwd, 1", PWD_OPTIONS
        )).isTrue();
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER", "(1) 4 / (2) 1", "1, 4", PWD_OPTIONS
        )).isFalse();
    }

    @Test
    @DisplayName("빈칸 순서 비교: 괄호 숫자 접두 정답 + 순서 틀린 입력 — 오답")
    void withOptions_ordered_parenNumberPrefixAnswer_wrongOrder_incorrect() {
        assertThat(AnswerGrader.isCorrect(
            "SHORT_ANSWER", "(1) pwd / (2) ls", "ls, pwd", PWD_OPTIONS
        )).isFalse();
    }

    // -----------------------------------------------------------------------
    // 대체 정답 (||) — 여러 후보 중 하나만 일치해도 정답
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("대체 정답: SHORT_ANSWER — 여러 후보 중 하나와 일치하면 정답")
    void alternatives_shortAnswer_oneMatches_correct() {
        String correct = "팩토리 메서드 || 팩토리 메소드 || factory method";
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", correct, "팩토리 메소드")).isTrue();
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", correct, "factory method")).isTrue();
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", correct, "Factory Method")).isTrue();
    }

    @Test
    @DisplayName("대체 정답: SHORT_ANSWER — 모든 후보와 불일치하면 오답")
    void alternatives_shortAnswer_noneMatches_incorrect() {
        String correct = "팩토리 메서드 || 팩토리 메소드 || factory method";
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", correct, "싱글턴")).isFalse();
    }

    @Test
    @DisplayName("대체 정답: CODE — 후보 코드 중 하나와 일치하면 정답")
    void alternatives_code_oneMatches_correct() {
        String correct = "return a + b; || return b + a;";
        assertThat(AnswerGrader.isCorrect("CODE", correct, "return b + a;")).isTrue();
        assertThat(AnswerGrader.isCorrect("CODE", correct, "return a - b;")).isFalse();
    }

    @Test
    @DisplayName("대체 정답: 단일 파이프(|) 그룹은 개수·순서를 보존해 비교")
    void alternatives_singlePipe_preservesGroupStructure() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "a | b", "a")).isFalse();
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "a | b", "a | b")).isTrue();
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "a | b", "b | a")).isFalse();
    }

    @Test
    @DisplayName("대체 정답: 후보가 1개뿐이면(구분자 없음) 기존과 완전히 동일하게 동작")
    void alternatives_singleCandidate_sameAsLegacy() {
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "정답", "정답")).isTrue();
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "정답", "오답")).isFalse();
    }

    @Test
    @DisplayName("대체 정답: 콤마 다중값 조합 — 후보 중 하나가 전부 일치하면 정답")
    void alternatives_withCommaGroups_correct() {
        String correct = "a, b || c, d";
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", correct, "b, a")).isTrue();
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", correct, "d, c")).isTrue();
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", correct, "a, c")).isFalse();
    }

    @Test
    @DisplayName("대체 정답: 4-인자(options 있음) — 후보 중 하나의 번호와 일치하면 정답")
    void alternatives_withOptions_oneMatches_correct() {
        List<String> options = Arrays.asList("보기1", "보기2", "보기3");
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "1 || 3", "3", options)).isTrue();
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "1 || 3", "2", options)).isFalse();
    }

    // -----------------------------------------------------------------------
    // 대체 정답 구분자 사용 안 함 플래그 (disableAlternativeAnswer) — HIST-20260718-002
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("플래그 ON: 코드 조건 정답의 || 논리 OR가 대체 정답으로 분리되지 않고 통째로 채점됨(id 35 실측)")
    void disableAlternativeAnswer_codeConditionWithLogicalOr_treatedAsSingleAnswer() {
        String correct = "① int a = 0 / ② a < m || b[a] < x / ③ b[a] < 0 / ④ b[a] = -b[a]; / ⑤ a++; / ⑥ return 1; / ⑦ ③ → ④ → ⑤ → ② → ⑥";
        // 플래그 ON — 정답 그대로 입력하면 정답 처리(||가 대체 정답 구분자로 쪼개지지 않음)
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", correct, correct, true)).isTrue();
        // 대체 정답 중 하나(예: "int a = 0")만 입력하면 플래그 ON에서는 오답이어야 함
        // (플래그 OFF였다면 ||로 쪼개져 부분 일치가 정답으로 오인될 위험이 있는 대비 케이스)
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", correct, "int a = 0", true)).isFalse();
    }

    @Test
    @DisplayName("플래그 OFF(기본값): 기존과 동일하게 || 를 대체 정답 구분자로 해석 (회귀)")
    void disableAlternativeAnswer_defaultFalse_legacyBehaviorUnchanged() {
        String correct = "팩토리 메서드 || 팩토리 메소드 || factory method";
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", correct, "factory method")).isTrue();
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", correct, "factory method", false)).isTrue();
    }

    @Test
    @DisplayName("플래그 ON이어도 단일 파이프(|) 그룹·콤마 다중값 로직은 영향받지 않음(회귀)")
    void disableAlternativeAnswer_doesNotAffectSinglePipeOrMultiValueLogic() {
        // 단일 | 그룹 구조는 그대로 순서 보존 비교
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "a | b", "a | b", true)).isTrue();
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "a | b", "b | a", true)).isFalse();
        // 콤마 다중값 Set 비교(순서 무관)도 그대로 동작
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "정답, test", "test, 정답", true)).isTrue();
    }

    @Test
    @DisplayName("플래그 ON + CODE 유형: 통문자열 비교가 그대로 적용되고 || 는 분리되지 않음")
    void disableAlternativeAnswer_code_treatsPipePipeAsLiteral() {
        String correct = "if (a < m || b[a] < x) return true;";
        assertThat(AnswerGrader.isCorrect("CODE", correct, correct, true)).isTrue();
        assertThat(AnswerGrader.isCorrect("CODE", correct, "if (a < m) return true;", true)).isFalse();
    }

    @Test
    @DisplayName("플래그 ON + 4-인자(options 있음): || 대체 정답 분리 없이 빈칸 순서 비교")
    void disableAlternativeAnswer_withOptions_singleCandidateOrderedCompare() {
        List<String> options = Arrays.asList("보기1", "보기2", "보기3");
        // 플래그 ON이면 "1 || 3"을 대체 정답 후보로 분리하지 않고 원문 그대로 토큰화하므로
        // 사용자가 "1"만 입력하면(정답 원문과 다름) 오답 처리된다.
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "1 || 3", "1", options, true)).isFalse();
        assertThat(AnswerGrader.isCorrect("SHORT_ANSWER", "1 || 3", "3", options, false)).isTrue();
    }

    // -----------------------------------------------------------------------
    // isSqlResultTableCorrect — SQL 결과 테이블(컬럼×튜플) 정답 채점
    // -----------------------------------------------------------------------

    private static SqlData.SqlExpectedResult expectedResult(List<String> columns, List<List<String>> rows, boolean orderedRows) {
        return new SqlData.SqlExpectedResult(columns, rows, orderedRows);
    }

    @Test
    @DisplayName("SQL 결과 테이블: orderedRows=false — 행 순서가 달라도 원소가 같으면 정답")
    void sqlResultTable_unordered_reversedRows_correct() {
        SqlData.SqlExpectedResult expected = expectedResult(
                List.of("id", "name"),
                List.of(List.of("1", "Alice"), List.of("2", "Bob")),
                false);
        String userAnswer = "2 | Bob\n1 | Alice";
        assertThat(AnswerGrader.isSqlResultTableCorrect(expected, userAnswer)).isTrue();
    }

    @Test
    @DisplayName("SQL 결과 테이블: orderedRows=true인데 순서가 뒤바뀌면 오답")
    void sqlResultTable_ordered_reversedRows_incorrect() {
        SqlData.SqlExpectedResult expected = expectedResult(
                List.of("id", "name"),
                List.of(List.of("1", "Alice"), List.of("2", "Bob")),
                true);
        String userAnswer = "2 | Bob\n1 | Alice";
        assertThat(AnswerGrader.isSqlResultTableCorrect(expected, userAnswer)).isFalse();
    }

    @Test
    @DisplayName("SQL 결과 테이블: orderedRows=true이고 순서까지 일치하면 정답")
    void sqlResultTable_ordered_sameOrder_correct() {
        SqlData.SqlExpectedResult expected = expectedResult(
                List.of("id", "name"),
                List.of(List.of("1", "Alice"), List.of("2", "Bob")),
                true);
        String userAnswer = "1 | Alice\n2 | Bob";
        assertThat(AnswerGrader.isSqlResultTableCorrect(expected, userAnswer)).isTrue();
    }

    @Test
    @DisplayName("SQL 결과 테이블: 셀 수가 컬럼 수와 다르면 오답")
    void sqlResultTable_cellCountMismatch_incorrect() {
        SqlData.SqlExpectedResult expected = expectedResult(
                List.of("id", "name"),
                List.of(List.of("1", "Alice")),
                false);
        String userAnswer = "1 | Alice | extra";
        assertThat(AnswerGrader.isSqlResultTableCorrect(expected, userAnswer)).isFalse();
    }

    @Test
    @DisplayName("SQL 결과 테이블: 행 수가 다르면 오답")
    void sqlResultTable_rowCountMismatch_incorrect() {
        SqlData.SqlExpectedResult expected = expectedResult(
                List.of("id"),
                List.of(List.of("1"), List.of("2")),
                false);
        String userAnswer = "1";
        assertThat(AnswerGrader.isSqlResultTableCorrect(expected, userAnswer)).isFalse();
    }

    @Test
    @DisplayName("SQL 결과 테이블: 숫자 동치 — 3.0과 3은 같은 값으로 처리")
    void sqlResultTable_numericEquivalence_correct() {
        SqlData.SqlExpectedResult expected = expectedResult(
                List.of("avg"),
                List.of(List.of("3.0")),
                false);
        assertThat(AnswerGrader.isSqlResultTableCorrect(expected, "3")).isTrue();
    }

    @Test
    @DisplayName("SQL 결과 테이블: NULL 문자열은 대소문자 무시 동치")
    void sqlResultTable_nullCaseInsensitive_correct() {
        SqlData.SqlExpectedResult expected = expectedResult(
                List.of("dept"),
                List.of(List.of("NULL")),
                false);
        assertThat(AnswerGrader.isSqlResultTableCorrect(expected, "null")).isTrue();
    }

    @Test
    @DisplayName("SQL 결과 테이블: orderedRows=false — 중복 행도 다중집합으로 정확히 비교")
    void sqlResultTable_unordered_duplicateRows_correct() {
        SqlData.SqlExpectedResult expected = expectedResult(
                List.of("dept"),
                List.of(List.of("IT"), List.of("IT"), List.of("HR")),
                false);
        // 정답과 동일한 다중집합 (IT 2개, HR 1개) — 순서만 다름
        assertThat(AnswerGrader.isSqlResultTableCorrect(expected, "HR\nIT\nIT")).isTrue();
        // 다중집합이 다르면(IT 1개, HR 2개) 오답
        assertThat(AnswerGrader.isSqlResultTableCorrect(expected, "HR\nHR\nIT")).isFalse();
    }

    @Test
    @DisplayName("SQL 결과 테이블: orderedRows=false — 셀 경계가 다르면 이어붙인 값이 같아도 오답 (다중집합 키 충돌 방지 회귀)")
    void sqlResultTable_unordered_cellBoundaryCollision_incorrect() {
        // 정답 행 ["12", "3"] — 셀을 구분자 없이 이어붙이면 "123"이 되어
        // 사용자가 실수로 입력한 ["1", "23"](역시 이어붙이면 "123")과 같은 키로 오판될 수 있다.
        // 셀 사이에 사람이 입력할 수 없는 구분자를 써서 키를 만들어야 이 충돌을 방지한다.
        SqlData.SqlExpectedResult expected = expectedResult(
                List.of("a", "b"),
                List.of(List.of("12", "3")),
                false);
        assertThat(AnswerGrader.isSqlResultTableCorrect(expected, "1 | 23")).isFalse();
        // 회귀 확인: 정확히 일치하는 셀 경계는 여전히 정답이어야 함
        assertThat(AnswerGrader.isSqlResultTableCorrect(expected, "12 | 3")).isTrue();
    }

    @Test
    @DisplayName("SQL 결과 테이블: 공백·대소문자 정규화 후 일치하면 정답")
    void sqlResultTable_whitespaceAndCaseNormalization_correct() {
        SqlData.SqlExpectedResult expected = expectedResult(
                List.of("name"),
                List.of(List.of("Alice   Smith")),
                false);
        assertThat(AnswerGrader.isSqlResultTableCorrect(expected, "  alice smith  ")).isTrue();
    }

    @Test
    @DisplayName("SQL 결과 테이블: expected가 null이면 오답")
    void sqlResultTable_nullExpected_false() {
        assertThat(AnswerGrader.isSqlResultTableCorrect(null, "1 | Alice")).isFalse();
    }

    @Test
    @DisplayName("SQL 결과 테이블: userAnswer가 null이면 오답")
    void sqlResultTable_nullUserAnswer_false() {
        SqlData.SqlExpectedResult expected = expectedResult(List.of("id"), List.of(List.of("1")), false);
        assertThat(AnswerGrader.isSqlResultTableCorrect(expected, null)).isFalse();
    }
}
