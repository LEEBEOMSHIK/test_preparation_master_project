package com.tpmp.testprep.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ConceptNoteRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank String content,
        boolean isPublic,
        Long questionId,     // 시험 문항 연결 (nullable)
        Long questionBankId  // 퀴즈 문항 연결 (nullable)
) {}
