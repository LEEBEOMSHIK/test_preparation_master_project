package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.ExaminationResponse;
import com.tpmp.testprep.entity.Exam;
import com.tpmp.testprep.entity.Examination;
import com.tpmp.testprep.entity.Question;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.ExaminationRepository;
import com.tpmp.testprep.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user/examinations")
@RequiredArgsConstructor
public class UserExaminationController {

    private final ExaminationRepository examinationRepository;
    private final QuestionRepository questionRepository;

    /** 시험 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ExaminationResponse>>> getExaminations(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                examinationRepository.findAllWithDetails(pageable).map(ExaminationResponse::from)
        ));
    }

    /** 시험 상세 (문항 포함) */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExaminationDetailView>> getExaminationDetail(@PathVariable Long id) {
        Examination examination = examinationRepository.findByIdWithPaper(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.EXAMINATION_NOT_FOUND));

        Exam paper = examination.getExamPaper();
        List<Question> questions = new ArrayList<>(
                questionRepository.findByExamIdOrderBySeqAsc(paper.getId())
        );
        if (paper.getQuestionMode() == Exam.QuestionMode.RANDOM) {
            Collections.shuffle(questions);
        }
        return ResponseEntity.ok(ApiResponse.success(ExaminationDetailView.of(examination, questions)));
    }

    /** 시험 제출 및 채점 */
    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<SubmitResult>> submitExam(
            @PathVariable Long id,
            @RequestBody Map<Long, String> answers) {

        Examination examination = examinationRepository.findByIdWithPaper(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.EXAMINATION_NOT_FOUND));

        List<Question> questions = questionRepository.findByExamIdOrderBySeqAsc(
                examination.getExamPaper().getId()
        );
        int total = questions.size();
        int correct = 0;
        for (Question q : questions) {
            String userAnswer = answers.get(q.getId());
            if (userAnswer != null && q.getAnswer() != null
                    && userAnswer.trim().equalsIgnoreCase(q.getAnswer().trim())) {
                correct++;
            }
        }
        int score = total > 0 ? (int) Math.round(correct * 100.0 / total) : 0;
        return ResponseEntity.ok(ApiResponse.success(new SubmitResult(total, correct, score)));
    }

    public record ExaminationDetailView(
            Long id,
            String title,
            Long examPaperId,
            String examPaperTitle,
            String categoryName,
            Integer timeLimit,
            List<QuestionView> questions
    ) {
        public static ExaminationDetailView of(Examination e, List<Question> questions) {
            return new ExaminationDetailView(
                    e.getId(),
                    e.getTitle(),
                    e.getExamPaper().getId(),
                    e.getExamPaper().getTitle(),
                    e.getCategory() != null ? e.getCategory().getName() : null,
                    e.getTimeLimit(),
                    questions.stream().map(QuestionView::from).toList()
            );
        }
    }

    public record QuestionView(Long id, int seq, String content, String questionType,
                               List<String> options, String code, String language) {
        public static QuestionView from(Question q) {
            return new QuestionView(q.getId(), q.getSeq(), q.getContent(),
                    q.getQuestionType().name(), q.getOptions(), q.getCode(), q.getLanguage());
        }
    }

    public record SubmitResult(int total, int correct, int score) {}
}
