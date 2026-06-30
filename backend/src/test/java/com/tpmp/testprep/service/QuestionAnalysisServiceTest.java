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

        QuestionAnalysisResponse result = service.analyze("<p>스택과 큐의 차이를 설명하시오.</p>");

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

        QuestionAnalysisResponse result = service.analyze("<p>OSI 7계층을 설명하시오.</p>");

        assertThat(result.keywords()).contains("OSI", "7계층");
        assertThat(result.domains()).containsExactly("네트워크");
        assertThat(result.difficulty()).isEqualTo("하");
    }

    @Test
    @DisplayName("analyze_invalidJson: 유효하지 않은 JSON 반환 시 AI_ANALYSIS_FAILED 예외")
    void analyze_invalidJson() {
        when(llmTextProvider.call(anyString(), anyInt())).thenReturn("not json");

        assertThatThrownBy(() -> service.analyze("<p>문제 내용</p>"))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.AI_ANALYSIS_FAILED));
    }

    @Test
    @DisplayName("analyze_blankInput: 빈 HTML 입력 시 INVALID_INPUT 예외, LLM 미호출")
    void analyze_blankInput() {
        assertThatThrownBy(() -> service.analyze("<p></p>"))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_INPUT));

        verify(llmTextProvider, never()).call(anyString(), anyInt());
    }

    @Test
    @DisplayName("analyze_blankInput_emptyString: 빈 문자열 입력 시 INVALID_INPUT 예외, LLM 미호출")
    void analyze_blankInput_emptyString() {
        assertThatThrownBy(() -> service.analyze(""))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_INPUT));

        verify(llmTextProvider, never()).call(anyString(), anyInt());
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
                        null
                )
        );

        assertThat(result.content()).contains("<p>첫 번째 단락 내용입니다.</p>");
        assertThat(result.content()).contains("<p>두 번째 단락 내용입니다.</p>");
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
                        null
                )
        );

        assertThat(result.content()).isEqualTo("<p>단일 줄 문제입니다.</p>");
    }
}
