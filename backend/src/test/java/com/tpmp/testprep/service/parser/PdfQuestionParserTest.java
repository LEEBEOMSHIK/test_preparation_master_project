package com.tpmp.testprep.service.parser;

import com.tpmp.testprep.entity.Question;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * PdfQuestionParser 순수 단위 테스트 (Spring 컨텍스트 없음).
 */
class PdfQuestionParserTest {

    private PdfQuestionParser parser;

    @BeforeEach
    void setUp() {
        parser = new PdfQuestionParser();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 빈 입력
    // ─────────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("null 입력 → 빈 리스트 반환")
    void parse_null_returnsEmpty() {
        assertThat(parser.parse(null)).isEmpty();
    }

    @Test
    @DisplayName("빈 문자열 입력 → 빈 리스트 반환")
    void parse_blank_returnsEmpty() {
        assertThat(parser.parse("   \n  ")).isEmpty();
    }

    @Test
    @DisplayName("문항번호 패턴 없음 → 빈 리스트 반환")
    void parse_noBoundary_returnsEmpty() {
        String text = "이것은 그냥 문단입니다.\n답도 없고 번호도 없습니다.";
        assertThat(parser.parse(text)).isEmpty();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 보기 유형별 파싱
    // ─────────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("원문자 보기(①②③④) → MULTIPLE_CHOICE, options 4개")
    void parse_circleOptions_multipleChoice() {
        String text =
                "1. 다음 중 올바른 것은?\n" +
                "① 사과\n" +
                "② 배\n" +
                "③ 포도\n" +
                "④ 딸기\n" +
                "정답: ②\n";

        List<ParsedQuestion> result = parser.parse(text);

        assertThat(result).hasSize(1);
        ParsedQuestion pq = result.get(0);
        assertThat(pq.questionType()).isEqualTo(Question.QuestionType.MULTIPLE_CHOICE);
        assertThat(pq.options()).hasSize(4);
        assertThat(pq.options()).containsExactly("사과", "배", "포도", "딸기");
    }

    @Test
    @DisplayName("괄호형 보기((1)(2)(3)) → MULTIPLE_CHOICE, options 3개")
    void parse_parenNumOptions_multipleChoice() {
        String text =
                "2. 올바른 데이터 구조는?\n" +
                "(1) 스택\n" +
                "(2) 큐\n" +
                "(3) 힙\n" +
                "정답: (1)\n";

        List<ParsedQuestion> result = parser.parse(text);

        assertThat(result).hasSize(1);
        ParsedQuestion pq = result.get(0);
        assertThat(pq.questionType()).isEqualTo(Question.QuestionType.MULTIPLE_CHOICE);
        assertThat(pq.options()).hasSize(3);
        assertThat(pq.options()).containsExactly("스택", "큐", "힙");
    }

    @Test
    @DisplayName("닫힌괄호형 보기(1) 2) 3)) → MULTIPLE_CHOICE, options 3개")
    void parse_closedParenOptions_multipleChoice() {
        String text =
                "3. 네트워크 계층 프로토콜은?\n" +
                "1) IP\n" +
                "2) TCP\n" +
                "3) HTTP\n" +
                "정답: 1)\n";

        List<ParsedQuestion> result = parser.parse(text);

        assertThat(result).hasSize(1);
        ParsedQuestion pq = result.get(0);
        assertThat(pq.questionType()).isEqualTo(Question.QuestionType.MULTIPLE_CHOICE);
        assertThat(pq.options()).hasSize(3);
    }

    @Test
    @DisplayName("보기 없는 주관식 → SHORT_ANSWER, options null 또는 빈 리스트")
    void parse_noOptions_shortAnswer() {
        String text =
                "4. 정규화의 목적을 서술하시오.\n" +
                "정답: 데이터 중복 최소화\n";

        List<ParsedQuestion> result = parser.parse(text);

        assertThat(result).hasSize(1);
        ParsedQuestion pq = result.get(0);
        assertThat(pq.questionType()).isEqualTo(Question.QuestionType.SHORT_ANSWER);
        assertThat(pq.options() == null || pq.options().isEmpty()).isTrue();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 정답/해설 라벨 추출
    // ─────────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("정답/해설 라벨 정상 추출")
    void parse_answerAndExplanation_extracted() {
        String text =
                "5. TCP와 UDP의 차이점은?\n" +
                "정답: TCP는 연결지향\n" +
                "해설: TCP는 신뢰성을 보장하며 3-way handshake를 사용한다.\n";

        List<ParsedQuestion> result = parser.parse(text);

        assertThat(result).hasSize(1);
        ParsedQuestion pq = result.get(0);
        assertThat(pq.answer()).isEqualTo("TCP는 연결지향");
        assertThat(pq.explanation()).contains("TCP는 신뢰성을 보장");
    }

    @Test
    @DisplayName("정답/해설 라벨 없음 → answer·explanation null")
    void parse_noLabels_nullAnswerAndExplanation() {
        String text = "6. 다음 빈칸에 알맞은 말을 쓰시오.\n____는 데이터를 순서대로 처리한다.\n";

        List<ParsedQuestion> result = parser.parse(text);

        assertThat(result).hasSize(1);
        ParsedQuestion pq = result.get(0);
        assertThat(pq.answer()).isNull();
        assertThat(pq.explanation()).isNull();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 문항번호 패턴 — 문 N.
    // ─────────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("'문 N.' 패턴 문항번호 인식")
    void parse_munPattern_recognized() {
        String text =
                "문 1. 운영체제의 역할을 쓰시오.\n" +
                "정답: 자원 관리\n";

        List<ParsedQuestion> result = parser.parse(text);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).content()).contains("운영체제의 역할");
    }

    @Test
    @DisplayName("'제N문' 패턴 문항번호 인식")
    void parse_jePattern_recognized() {
        String text =
                "제1문 데이터베이스 정규화 단계를 나열하시오.\n" +
                "정답: 1NF, 2NF, 3NF\n";

        List<ParsedQuestion> result = parser.parse(text);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).answer()).isEqualTo("1NF, 2NF, 3NF");
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 다수 문항 분리
    // ─────────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("문항 2개 이상 → 개수대로 분리")
    void parse_multipleQuestions_splitCorrectly() {
        String text =
                "1. 첫 번째 문항입니다.\n" +
                "① 선택지 A\n" +
                "② 선택지 B\n" +
                "정답: ①\n" +
                "\n" +
                "2. 두 번째 문항입니다.\n" +
                "정답: 없음\n" +
                "\n" +
                "3. 세 번째 문항입니다.\n" +
                "① 가\n" +
                "② 나\n" +
                "③ 다\n";

        List<ParsedQuestion> result = parser.parse(text);

        assertThat(result).hasSize(3);
        // 첫 번째: MULTIPLE_CHOICE
        assertThat(result.get(0).questionType()).isEqualTo(Question.QuestionType.MULTIPLE_CHOICE);
        // 두 번째: SHORT_ANSWER (보기 없음)
        assertThat(result.get(1).questionType()).isEqualTo(Question.QuestionType.SHORT_ANSWER);
        // 세 번째: MULTIPLE_CHOICE
        assertThat(result.get(2).questionType()).isEqualTo(Question.QuestionType.MULTIPLE_CHOICE);
        assertThat(result.get(2).options()).hasSize(3);
    }

    @Test
    @DisplayName("CRLF 포함 텍스트도 정상 파싱")
    void parse_crlfLineEnding_handledCorrectly() {
        String text = "1. CRLF 테스트 문항\r\n① 가\r\n② 나\r\n정답: ①\r\n";

        List<ParsedQuestion> result = parser.parse(text);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).questionType()).isEqualTo(Question.QuestionType.MULTIPLE_CHOICE);
        assertThat(result.get(0).options()).hasSize(2);
    }
}
