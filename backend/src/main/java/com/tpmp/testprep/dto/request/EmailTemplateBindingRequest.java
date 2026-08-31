package com.tpmp.testprep.dto.request;

import jakarta.validation.constraints.NotNull;

public record EmailTemplateBindingRequest(@NotNull Long templateId) {
}
