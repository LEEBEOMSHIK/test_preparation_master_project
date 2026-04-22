package com.tpmp.testprep.dto.request;

import com.tpmp.testprep.entity.Exam;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ExamCreateRequest(
        @NotBlank(message = "시험 제목은 필수입니다.")
        @Size(max = 200, message = "시험 제목은 200자를 초과할 수 없습니다.")
        String title,

        @NotNull(message = "문항 순서 방식은 필수입니다.")
        Exam.QuestionMode questionMode
) {}
