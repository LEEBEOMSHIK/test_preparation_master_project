package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.ExamSummaryResponse;
import com.tpmp.testprep.entity.Exam;
import com.tpmp.testprep.entity.Question;
import com.tpmp.testprep.repository.QuestionRepository;
import com.tpmp.testprep.service.ExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/user/exams")
@RequiredArgsConstructor
public class UserExamController {

    private final ExamService examService;
    private final QuestionRepository questionRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ExamSummaryResponse>>> getExams(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(examService.getExams(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExamDetailView>> getExamDetail(@PathVariable Long id) {
        Exam exam = examService.getExamDetail(id);
        List<Question> questions = new java.util.ArrayList<>(exam.getQuestions());
        if (exam.getQuestionMode() == Exam.QuestionMode.RANDOM) {
            Collections.shuffle(questions);
        }
        return ResponseEntity.ok(ApiResponse.success(ExamDetailView.of(exam, questions)));
    }

    public record ExamDetailView(Long id, String title, String questionMode, List<QuestionView> questions) {
        public static ExamDetailView of(Exam exam, List<Question> questions) {
            return new ExamDetailView(
                    exam.getId(),
                    exam.getTitle(),
                    exam.getQuestionMode().name(),
                    questions.stream().map(QuestionView::from).toList()
            );
        }
    }

    public record QuestionView(Long id, int seq, String content, String questionType, List<String> options) {
        public static QuestionView from(Question q) {
            return new QuestionView(q.getId(), q.getSeq(), q.getContent(),
                    q.getQuestionType().name(), q.getOptions());
        }
    }

    /** 시험 제출 및 채점 */
    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<SubmitResult>> submitExam(
            @PathVariable Long id,
            @RequestBody Map<Long, String> answers) {

        List<Question> questions = questionRepository.findByExamIdOrderBySeqAsc(id);
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

    public record SubmitResult(int total, int correct, int score) {}
}
