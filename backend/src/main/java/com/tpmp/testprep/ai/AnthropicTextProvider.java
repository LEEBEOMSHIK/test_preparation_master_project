package com.tpmp.testprep.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Component
@ConditionalOnProperty(name = "app.ai.provider", havingValue = "anthropic")
@RequiredArgsConstructor
public class AnthropicTextProvider implements LlmTextProvider {

    @Value("${app.anthropic.api-key:}")
    private String apiKey;

    @Value("${app.anthropic.model:claude-haiku-4-5-20251001}")
    private String model;

    private final ObjectMapper objectMapper;

    @Override
    public String call(String prompt, int maxTokens) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new BusinessException(ErrorCode.AI_SERVICE_UNAVAILABLE);
        }
        try {
            Map<String, Object> body = Map.of(
                    "model", model,
                    "max_tokens", maxTokens,
                    "messages", List.of(Map.of("role", "user", "content", prompt))
            );
            String raw = RestClient.create()
                    .post()
                    .uri("https://api.anthropic.com/v1/messages")
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);
            JsonNode root = objectMapper.readTree(raw);
            return root.path("content").get(0).path("text").asText().trim();
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.AI_ANALYSIS_FAILED);
        }
    }
}
