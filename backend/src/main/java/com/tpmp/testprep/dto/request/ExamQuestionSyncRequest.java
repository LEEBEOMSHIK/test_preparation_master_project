package com.tpmp.testprep.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ExamQuestionSyncRequest(
        @NotEmpty List<@Valid Selection> selections,
        boolean applyAnswers,
        String answerConfirmation
) {
    public static final String ANSWER_CONFIRMATION = "정답 동기화";

    public record Selection(
            @NotNull Long questionId,
            @NotNull Long sourceQuestionBankId
    ) {}
}
