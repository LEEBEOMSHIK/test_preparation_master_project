package com.tpmp.testprep.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record QuestionBankBulkRequest(
        @NotEmpty(message = "등록할 문항이 없습니다.")
        List<@Valid QuestionBankRequest> questions
) {}
