package com.tpmp.testprep.dto.response;

import java.util.List;

public record ExamQuestionSyncPreviewResponse(
        Long examId,
        boolean activeSession,
        List<Item> items
) {
    public record Item(
            Long questionId,
            int seq,
            Long linkedSourceQuestionBankId,
            Long candidateSourceQuestionBankId,
            String linkStatus,
            String syncStatus,
            List<String> changedFields,
            boolean answerChanged,
            List<String> risks
    ) {}
}
