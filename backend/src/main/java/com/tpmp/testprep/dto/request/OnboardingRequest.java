package com.tpmp.testprep.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record OnboardingRequest(
        @NotNull List<String> examTypes
) {}
