package com.tpmp.testprep.dto.request;

import java.util.List;

public record QuestionRegenerateRequest(
        List<String> keywords,
        List<String> domains,
        String difficulty,
        String originalContent,
        String questionType,
        String originalCode,
        String language
) {}
