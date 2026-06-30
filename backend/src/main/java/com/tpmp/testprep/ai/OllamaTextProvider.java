package com.tpmp.testprep.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.Map;

@Component
@ConditionalOnProperty(name = "app.ai.provider", havingValue = "ollama", matchIfMissing = true)
@RequiredArgsConstructor
public class OllamaTextProvider implements LlmTextProvider {

    @Value("${app.ai.ollama.base-url:http://localhost:11434}")
    private String baseUrl;

    @Value("${app.ai.ollama.model:qwen2.5:7b}")
    private String model;

    private final ObjectMapper objectMapper;

    private static final RestClient REST_CLIENT;

    static {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(120));
        REST_CLIENT = RestClient.builder().requestFactory(factory).build();
    }

    @Override
    public String call(String prompt, int maxTokens) {
        try {
            Map<String, Object> body = Map.of(
                    "model", model,
                    "prompt", prompt,
                    "stream", false,
                    "options", Map.of("num_predict", maxTokens)
            );
            String raw = REST_CLIENT
                    .post()
                    .uri(baseUrl + "/api/generate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);
            JsonNode root = objectMapper.readTree(raw);
            JsonNode responseNode = root.path("response");
            if (responseNode.isMissingNode() || responseNode.isNull()) {
                throw new BusinessException(ErrorCode.AI_ANALYSIS_FAILED);
            }
            return responseNode.asText().trim();
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.AI_ANALYSIS_FAILED);
        }
    }
}
