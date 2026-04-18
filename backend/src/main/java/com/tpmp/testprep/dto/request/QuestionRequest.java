package com.tpmp.testprep.dto.request;

import com.tpmp.testprep.entity.Question;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record QuestionRequest(
        @NotBlank(message = "문항 내용은 필수입니다.") String content,
        @NotNull(message = "문항 유형은 필수입니다.") Question.QuestionType questionType,
        List<String> options,
        @NotBlank(message = "정답은 필수입니다.") String answer,
        String explanation
) {}
