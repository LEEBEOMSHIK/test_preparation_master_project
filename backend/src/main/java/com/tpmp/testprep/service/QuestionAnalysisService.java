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

    public QuestionAnalysisResponse analyze(String htmlContent, String code, String language) {
        String plainText = stripHtml(htmlContent);
        if (plainText.isBlank()) throw new BusinessException(ErrorCode.INVALID_INPUT);

        String text = llmTextProvider.call(buildAnalyzePrompt(plainText, code, language), 1024);
        text = text.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```\\s*", "").trim();
        try {
            return objectMapper.readValue(text, QuestionAnalysisResponse.class);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.AI_ANALYSIS_FAILED);
        }
    }

    // ── 문제 재구성 ────────────────────────────────────────────────────────────────

    public QuestionRegenerateResponse regenerate(QuestionRegenerateRequest request) {
        if ("CODE".equals(request.questionType())) {
            return regenerateCode(request);
        }
        return regenerateText(request);
    }

    private QuestionRegenerateResponse regenerateText(QuestionRegenerateRequest request) {
        String prompt = buildRegeneratePrompt(request);
        String text = llmTextProvider.call(prompt, 1024);
        String html = Arrays.stream(text.split("\\n{2,}"))
                .map(p -> "<p>" + p.strip().replace("\n", "<br>") + "</p>")
                .collect(Collectors.joining());
        return new QuestionRegenerateResponse(
                html.isBlank() ? "<p>" + text + "</p>" : html,
                null,
                null
        );
    }

    private QuestionRegenerateResponse regenerateCode(QuestionRegenerateRequest request) {
        String prompt = buildRegenerateCodePrompt(request);
        String text = llmTextProvider.call(prompt, 1536);
        text = text.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```\\s*", "").trim();
        try {
            CodeRegenResult parsed = objectMapper.readValue(text, CodeRegenResult.class);
            String contentHtml = "<p>" + (parsed.content() != null ? parsed.content() : "") + "</p>";
            return new QuestionRegenerateResponse(contentHtml, parsed.code(), parsed.answer());
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.AI_ANALYSIS_FAILED);
        }
    }

    private record CodeRegenResult(String content, String code, String answer) {}

    // ── 공통 헬퍼 ─────────────────────────────────────────────────────────────────

    private String stripHtml(String html) {
        return html.replaceAll("<[^>]+>", " ")
                   .replaceAll("&[a-zA-Z0-9#]+;", " ")
                   .replaceAll("\\s+", " ")
                   .trim();
    }

    private String buildAnalyzePrompt(String content, String code, String language) {
        boolean hasCode = code != null && !code.isBlank();
        String langLabel = (language != null && !language.isBlank()) ? language : "코드";
        // code는 stripHtml 없이 원본 그대로 삽입 (< > 등 코드 특수문자 보존)
        String codeSection = hasCode
                ? ("\n\n[코드 (" + langLabel + ")]\n" + code)
                : "";
        return """
                다음 시험 문제를 분석하여 JSON 형식으로만 응답하세요.

                문제:
                %s%s

                아래 형식으로 분석 결과를 반환하세요:
                {
                  "keywords": ["핵심 키워드 5~8개"],
                  "domains": ["주제 도메인 1~3개 (예: 데이터베이스, 네트워크, 알고리즘, 운영체제, 보안, 자료구조, 소프트웨어공학 등)"],
                  "difficulty": "하 또는 중 또는 상",
                  "summary": "문제 핵심 내용 1~2문장 요약"
                }

                JSON만 반환하고 다른 텍스트는 절대 포함하지 마세요.
                """.formatted(content, codeSection);
    }

    private String buildRegenerateCodePrompt(QuestionRegenerateRequest req) {
        String langLabel = (req.language() != null && !req.language().isBlank()) ? req.language() : "코드";
        boolean hasOriginalCode = req.originalCode() != null && !req.originalCode().isBlank();
        boolean hasOriginalContent = req.originalContent() != null && !req.originalContent().isBlank();

        String originalSection = hasOriginalCode
                ? "\n[원본 코드]\n" + req.originalCode() + "\n"
                : "";
        String originalContentSection = hasOriginalContent
                ? "\n[원본 문제 설명]\n" + stripHtml(req.originalContent()) + "\n"
                : "";

        String requirement = hasOriginalCode
                ? "원본 문제와 같은 형식·난이도를 유지하되 코드 내용은 다르게 작성하세요"
                : "주어진 키워드와 도메인을 활용하여 새로운 코드 문제를 만들어주세요";

        return """
                주어진 정보를 참고해 같은 언어(%s)로 유사 난이도의 새 코드 문제를 만들어라.

                핵심 키워드: %s
                도메인: %s
                난이도: %s
                %s%s
                요구사항:
                - %s
                - code: 실행 가능한 코드(들여쓰기 포함)
                - content: 문제 설명(코드 자체 미포함, 예: '아래 코드의 실행 결과를 쓰시오')
                - answer: 코드의 예상 출력/정답(plain text)

                - code는 20줄 이내로 간결하게, content는 1~2문장, answer는 짧게 작성하세요

                반드시 JSON만 반환: {"content":"...","code":"...","answer":"..."} — 다른 텍스트 금지
                """.formatted(
                langLabel,
                String.join(", ", req.keywords()),
                String.join(", ", req.domains()),
                req.difficulty(),
                originalSection,
                originalContentSection,
                requirement
        );
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
                - 문제는 간결하게 3~4문장 이내로 작성하세요
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
