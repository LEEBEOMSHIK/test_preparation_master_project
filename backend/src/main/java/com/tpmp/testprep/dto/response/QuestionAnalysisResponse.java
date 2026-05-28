package com.tpmp.testprep.dto.response;

import java.util.List;

public record QuestionAnalysisResponse(
        List<String> keywords,
        List<String> domains,
        String difficulty,
        String summary
) {}
