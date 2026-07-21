package com.tpmp.testprep.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UserExamApplicationRequest(
        Long examInfoId,               // 연결할 시험 정보 (nullable — 자유 입력 시 null)
        @NotBlank @Size(max = 200) String examName,
        LocalDate applicationDate,     // 접수일, nullable
        LocalDate examDate,            // 시험일, nullable
        @Size(max = 300) String memo   // 메모, nullable
) {}
