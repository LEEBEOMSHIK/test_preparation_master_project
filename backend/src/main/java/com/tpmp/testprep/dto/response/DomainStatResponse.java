package com.tpmp.testprep.dto.response;

public record DomainStatResponse(
        String domainName,
        long totalQuestions,
        long correctCount,
        double correctRate
) {}
