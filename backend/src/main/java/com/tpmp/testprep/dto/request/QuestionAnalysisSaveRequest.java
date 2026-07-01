package com.tpmp.testprep.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * 문항 AI 분석 결과 즉시 저장 요청 DTO.
 * PATCH /api/admin/questions/{id}/analysis 에서 사용.
 */
public record QuestionAnalysisSaveRequest(
        @NotNull(message = "키워드 목록은 필수입니다.")
        List<String> keywords,

        @NotNull(message = "도메인 목록은 필수입니다.")
        List<String> domains,

        @NotBlank(message = "난이도는 필수입니다.")
        String difficulty,

        String summary
) {}
