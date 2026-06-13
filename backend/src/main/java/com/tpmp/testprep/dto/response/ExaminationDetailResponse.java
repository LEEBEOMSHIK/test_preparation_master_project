package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.Examination;
import com.tpmp.testprep.entity.Question;

import java.util.List;

public record ExaminationDetailResponse(
        Long id,
        String title,
        Long examPaperId,
        String examPaperTitle,
        String categoryName,
        Integer timeLimit,
        List<ExaminationQuestionView> questions
) {
    public static ExaminationDetailResponse of(Examination e, List<Question> questions) {
        return new ExaminationDetailResponse(
                e.getId(),
                e.getTitle(),
                e.getExamPaper().getId(),
                e.getExamPaper().getTitle(),
                e.getCategory() != null ? e.getCategory().getName() : null,
                e.getTimeLimit(),
                questions.stream().map(ExaminationQuestionView::from).toList()
        );
    }
}
