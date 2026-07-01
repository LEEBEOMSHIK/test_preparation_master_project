package com.tpmp.testprep.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tpmp.testprep.ai.LlmTextProvider;
import com.tpmp.testprep.dto.request.QuestionRegenerateRequest;
import com.tpmp.testprep.dto.response.QuestionAnalysisResponse;
import com.tpmp.testprep.dto.response.QuestionRegenerateResponse;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QuestionAnalysisServiceTest {

    @Mock
    private LlmTextProvider llmTextProvider;

    private QuestionAnalysisService service;

    @BeforeEach
    void setUp() {
        service = new QuestionAnalysisService(llmTextProvider, new ObjectMapper());
    }

    // ── analyze ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("analyze_success: 유효 JSON 반환 시 QuestionAnalysisResponse 정상 매핑")
    void analyze_success() {
        String json = """
                {
                  "keywords": ["스택", "큐"],
                  "domains": ["자료구조"],
                  "difficulty": "중",
                  "summary": "스택과 큐의 차이를 묻는 문제입니다."
                }
                """;
        when(llmTextProvider.call(anyString(), anyInt())).thenReturn(json);

        QuestionAnalysisResponse result = service.analyze("<p>스택과 큐의 차이를 설명하시오.</p>", null, null);

        assertThat(result.keywords()).containsExactly("스택", "큐");
        assertThat(result.domains()).containsExactly("자료구조");
        assertThat(result.difficulty()).isEqualTo("중");
        assertThat(result.summary()).isEqualTo("스택과 큐의 차이를 묻는 문제입니다.");
    }

    @Test
    @DisplayName("analyze_jsonFence: ```json 펜스 감싸인 응답도 정상 파싱")
    void analyze_jsonFence() {
        String fenced = """
                ```json
                {
                  "keywords": ["OSI", "7계층"],
                  "domains": ["네트워크"],
                  "difficulty": "하",
                  "summary": "OSI 7계층을 설명하는 문제입니다."
                }
                ```
                """;
        when(llmTextProvider.call(anyString(), anyInt())).thenReturn(fenced);

        QuestionAnalysisResponse result = service.analyze("<p>OSI 7계층을 설명하시오.</p>", null, null);

        assertThat(result.keywords()).contains("OSI", "7계층");
        assertThat(result.domains()).containsExactly("네트워크");
        assertThat(result.difficulty()).isEqualTo("하");
    }

    @Test
    @DisplayName("analyze_invalidJson: 유효하지 않은 JSON 반환 시 AI_ANALYSIS_FAILED 예외")
    void analyze_invalidJson() {
        when(llmTextProvider.call(anyString(), anyInt())).thenReturn("not json");

        assertThatThrownBy(() -> service.analyze("<p>문제 내용</p>", null, null))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.AI_ANALYSIS_FAILED));
    }

    @Test
    @DisplayName("analyze_blankInput: 빈 HTML 입력 시 INVALID_INPUT 예외, LLM 미호출")
    void analyze_blankInput() {
        assertThatThrownBy(() -> service.analyze("<p></p>", null, null))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_INPUT));

        verify(llmTextProvider, never()).call(anyString(), anyInt());
    }

    @Test
    @DisplayName("analyze_blankInput_emptyString: 빈 문자열 입력 시 INVALID_INPUT 예외, LLM 미호출")
    void analyze_blankInput_emptyString() {
        assertThatThrownBy(() -> service.analyze("", null, null))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_INPUT));

        verify(llmTextProvider, never()).call(anyString(), anyInt());
    }

    @Test
    @DisplayName("analyze_withCode: 코드가 stripHtml 없이 프롬프트에 원본 포함")
    void analyze_withCode_includesCodeInPrompt() {
        String json = """
                {
                  "keywords": ["제네릭", "리스트"],
                  "domains": ["프로그래밍"],
                  "difficulty": "중",
                  "summary": "코드 출력 결과를 묻는 문제입니다."
                }
                """;
        ArgumentCaptor<String> promptCaptor = ArgumentCaptor.forClass(String.class);
        when(llmTextProvider.call(promptCaptor.capture(), anyInt())).thenReturn(json);

        String code = "List<Integer> list = new ArrayList<>();\nSystem.out.println(\"<hi>\");";
        service.analyze("<p>아래 코드의 출력은?</p>", code, "java");

        String prompt = promptCaptor.getValue();
        // 코드 특수문자(< >)가 stripHtml에 훼손되지 않고 원본 그대로 포함되어야 함
        assertThat(prompt).contains(code);
        assertThat(prompt).contains("java");
    }

    // ── regenerate ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("regenerate_success: 두 단락(빈 줄 구분) 반환 시 <p> 두 개 생성")
    void regenerate_success() {
        when(llmTextProvider.call(anyString(), anyInt()))
                .thenReturn("첫 번째 단락 내용입니다.\n\n두 번째 단락 내용입니다.");

        QuestionRegenerateResponse result = service.regenerate(
                new QuestionRegenerateRequest(
                        List.of("알고리즘", "정렬"),
                        List.of("자료구조"),
                        "중",
                        null,
                        null,
                        null,
                        null
                )
        );

        assertThat(result.content()).contains("<p>첫 번째 단락 내용입니다.</p>");
        assertThat(result.content()).contains("<p>두 번째 단락 내용입니다.</p>");
        assertThat(result.code()).isNull();
        assertThat(result.answer()).isNull();
    }

    @Test
    @DisplayName("regenerate_singleLine: 단일 줄 반환 시 <p>로 감싸짐")
    void regenerate_singleLine() {
        when(llmTextProvider.call(anyString(), anyInt()))
                .thenReturn("단일 줄 문제입니다.");

        QuestionRegenerateResponse result = service.regenerate(
                new QuestionRegenerateRequest(
                        List.of("데이터베이스"),
                        List.of("데이터베이스"),
                        "상",
                        null,
                        null,
                        null,
                        null
                )
        );

        assertThat(result.content()).isEqualTo("<p>단일 줄 문제입니다.</p>");
        assertThat(result.code()).isNull();
        assertThat(result.answer()).isNull();
    }

    // ── regenerateCode ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("regenerateCode_success: 유효 JSON 반환 시 content/code/answer 정상 매핑")
    void regenerateCode_success() {
        String json = """
                {
                  "content": "아래 코드의 실행 결과를 쓰시오.",
                  "code": "print(1 + 2 * 3)",
                  "answer": "7"
                }
                """;
        when(llmTextProvider.call(anyString(), anyInt())).thenReturn(json);

        QuestionRegenerateResponse result = service.regenerate(
                new QuestionRegenerateRequest(
                        List.of("연산자", "우선순위"),
                        List.of("Python"),
                        "하",
                        "<p>기존 문제</p>",
                        "CODE",
                        "x = 1 + 2",
                        "python"
                )
        );

        assertThat(result.content()).isEqualTo("<p>아래 코드의 실행 결과를 쓰시오.</p>");
        assertThat(result.code()).isEqualTo("print(1 + 2 * 3)");
        assertThat(result.answer()).isEqualTo("7");
    }

    @Test
    @DisplayName("regenerateCode_jsonFence: ```json 펜스 포함 응답도 정상 파싱")
    void regenerateCode_jsonFence() {
        String fenced = """
                ```json
                {
                  "content": "다음 코드의 출력을 쓰시오.",
                  "code": "for i in range(3): print(i)",
                  "answer": "0\\n1\\n2"
                }
                ```
                """;
        when(llmTextProvider.call(anyString(), anyInt())).thenReturn(fenced);

        QuestionRegenerateResponse result = service.regenerate(
                new QuestionRegenerateRequest(
                        List.of("반복문"),
                        List.of("Python"),
                        "하",
                        null,
                        "CODE",
                        null,
                        "python"
                )
        );

        assertThat(result.content()).contains("다음 코드의 출력을 쓰시오.");
        assertThat(result.code()).isEqualTo("for i in range(3): print(i)");
    }

    @Test
    @DisplayName("regenerateCode_invalidJson: 비-JSON 응답 시 AI_ANALYSIS_FAILED 예외")
    void regenerateCode_invalidJson() {
        when(llmTextProvider.call(anyString(), anyInt())).thenReturn("비-JSON 텍스트");

        assertThatThrownBy(() -> service.regenerate(
                new QuestionRegenerateRequest(
                        List.of("반복문"),
                        List.of("Python"),
                        "하",
                        null,
                        "CODE",
                        null,
                        "python"
                )
        ))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.AI_ANALYSIS_FAILED));
    }
}
