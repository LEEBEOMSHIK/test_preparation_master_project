package com.tpmp.testprep.dto.request;

import com.tpmp.testprep.entity.Exam;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ExamCreateWithQuestionsRequest(
        @NotBlank(message = "시험 제목은 필수입니다.") String title,
        @NotNull(message = "문항 순서 방식은 필수입니다.") Exam.QuestionMode questionMode,
        @NotEmpty(message = "문항을 하나 이상 선택해야 합니다.") List<@Valid QuestionRequest> questions
) {
    public ExamCreateRequest toExamCreateRequest() {
        return new ExamCreateRequest(title, questionMode);
    }
}
