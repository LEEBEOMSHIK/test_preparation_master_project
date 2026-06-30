package com.tpmp.testprep.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tpmp.testprep.ai.LlmTextProvider;
import com.tpmp.testprep.dto.request.QuestionRegenerateRequest;
import com.tpmp.testprep.dto.response.QuestionAnalysisResponse;
import com.tpmp.testprep.dto.response.QuestionRegenerateResponse;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionAnalysisService {

    private final LlmTextProvider llmTextProvider;
    private final ObjectMapper objectMapper;

    // ── 키워드·도메인 분석 ──────────────────────────────────────────────────────────

    public QuestionAnalysisResponse analyze(String htmlContent) {
        String plainText = stripHtml(htmlContent);
        if (plainText.isBlank()) throw new BusinessException(ErrorCode.INVALID_INPUT);

        String text = llmTextProvider.call(buildAnalyzePrompt(plainText), 1024);
        text = text.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```\\s*", "").trim();
        try {
            return objectMapper.readValue(text, QuestionAnalysisResponse.class);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.AI_ANALYSIS_FAILED);
        }
    }

    // ── 문제 재구성 ────────────────────────────────────────────────────────────────

    public QuestionRegenerateResponse regenerate(QuestionRegenerateRequest request) {
        String prompt = buildRegeneratePrompt(request);
        String text = llmTextProvider.call(prompt, 2048);
        String html = Arrays.stream(text.split("\\n{2,}"))
                .map(p -> "<p>" + p.strip().replace("\n", "<br>") + "</p>")
                .collect(Collectors.joining());
        return new QuestionRegenerateResponse(html.isBlank() ? "<p>" + text + "</p>" : html);
    }

    // ── 공통 헬퍼 ─────────────────────────────────────────────────────────────────

    private String stripHtml(String html) {
        return html.replaceAll("<[^>]+>", " ")
                   .replaceAll("&[a-zA-Z0-9#]+;", " ")
                   .replaceAll("\\s+", " ")
                   .trim();
    }

    private String buildAnalyzePrompt(String content) {
        return """
                다음 시험 문제를 분석하여 JSON 형식으로만 응답하세요.

                문제:
                %s

                아래 형식으로 분석 결과를 반환하세요:
                {
                  "keywords": ["핵심 키워드 5~8개"],
                  "domains": ["주제 도메인 1~3개 (예: 데이터베이스, 네트워크, 알고리즘, 운영체제, 보안, 자료구조, 소프트웨어공학 등)"],
                  "difficulty": "하 또는 중 또는 상",
                  "summary": "문제 핵심 내용 1~2문장 요약"
                }

                JSON만 반환하고 다른 텍스트는 절대 포함하지 마세요.
                """.formatted(content);
    }

    private String buildRegeneratePrompt(QuestionRegenerateRequest req) {
        boolean hasOriginal = req.originalContent() != null && !req.originalContent().isBlank();
        String originalSection = hasOriginal
                ? "\n참고할 원본 문제:\n" + stripHtml(req.originalContent()) + "\n"
                : "";
        String requirement = hasOriginal
                ? "원본 문제와 같은 형식·난이도를 유지하되 내용은 다르게 작성하세요"
                : "주어진 키워드와 도메인을 활용하여 새로운 문제를 만들어주세요";

        return """
                다음 정보를 바탕으로 새로운 시험 문제를 작성해주세요.

                핵심 키워드: %s
                도메인: %s
                난이도: %s
                %s
                요구사항:
                - %s
                - 같은 개념을 다른 각도에서 묻는 새로운 문제를 만들어주세요
                - 문제 본문만 작성하고 번호, 보기(①②③), 정답은 포함하지 마세요
                """.formatted(
                String.join(", ", req.keywords()),
                String.join(", ", req.domains()),
                req.difficulty(),
                originalSection,
                requirement
        );
    }
}
