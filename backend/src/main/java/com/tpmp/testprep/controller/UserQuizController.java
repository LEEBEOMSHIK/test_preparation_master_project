package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.DomainMasterResponse;
import com.tpmp.testprep.dto.response.QuestionBankResponse;
import com.tpmp.testprep.entity.QuestionBank;
import com.tpmp.testprep.repository.DomainMasterRepository;
import com.tpmp.testprep.repository.QuestionBankRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/quiz")
@RequiredArgsConstructor
public class UserQuizController {

    private final DomainMasterRepository domainMasterRepository;
    private final QuestionBankRepository questionBankRepository;

    /** 퀴즈 카테고리 목록 (문제 유형 / 시험 유형 도메인만 반환) */
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<DomainMasterResponse>>> getCategories() {
        List<String> quizMasterNames = List.of("문제 유형", "시험 유형");
        List<DomainMasterResponse> masters = domainMasterRepository.findAllWithSlaves().stream()
                .filter(m -> quizMasterNames.contains(m.getName()))
                .map(DomainMasterResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(masters));
    }

    /** 카테고리별 랜덤 퀴즈 문항 (기본 10개) */
    @GetMapping("/questions")
    public ResponseEntity<ApiResponse<List<QuizQuestionView>>> getQuizQuestions(
            @RequestParam Long categoryId,
            @RequestParam(defaultValue = "10") int limit) {

        List<QuestionBank> questions = questionBankRepository.findRandomByCategory(categoryId, Math.min(limit, 30));
        List<QuizQuestionView> views = questions.stream().map(QuizQuestionView::from).toList();
        return ResponseEntity.ok(ApiResponse.success(views));
    }

    /** 퀴즈 정답 확인 (단건 채점) */
    @PostMapping("/check")
    public ResponseEntity<ApiResponse<CheckResult>> checkAnswer(@RequestBody CheckRequest request) {
        QuestionBank qb = questionBankRepository.findById(request.questionId())
                .orElseThrow();
        boolean correct = qb.getAnswer() != null
                && qb.getAnswer().trim().equalsIgnoreCase(request.userAnswer().trim());
        return ResponseEntity.ok(ApiResponse.success(
                new CheckResult(correct, qb.getAnswer(), qb.getExplanation())));
    }

    // ── View records ────────────────────────────────────────────────────────

    public record QuizQuestionView(
            Long id, String content, String questionType,
            List<String> options, String code, String language) {

        public static QuizQuestionView from(QuestionBank qb) {
            return new QuizQuestionView(
                    qb.getId(), qb.getContent(), qb.getQuestionType().name(),
                    qb.getOptions(), qb.getCode(), qb.getLanguage());
        }
    }

    public record CheckRequest(Long questionId, String userAnswer) {}

    public record CheckResult(boolean correct, String answer, String explanation) {}
}
