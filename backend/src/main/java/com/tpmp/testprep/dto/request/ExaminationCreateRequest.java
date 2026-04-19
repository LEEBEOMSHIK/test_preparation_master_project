package com.tpmp.testprep.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ExaminationCreateRequest(
        @NotBlank(message = "시험 제목은 필수입니다.")
        @Size(max = 200, message = "시험 제목은 200자를 초과할 수 없습니다.")
        String title,

        @NotNull(message = "시험지를 선택해주세요.")
        Long examPaperId,

        @NotNull(message = "시험 유형을 선택해주세요.")
        Long categoryId,

        @NotNull(message = "시험 시간을 선택해주세요.")
        Integer timeLimit
) {}
