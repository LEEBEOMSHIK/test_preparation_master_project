package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.DomainMasterResponse;
import com.tpmp.testprep.dto.response.DomainSlaveResponse;
import com.tpmp.testprep.dto.response.QuestionBankResponse;
import com.tpmp.testprep.entity.DomainMaster;
import com.tpmp.testprep.entity.QuestionBank;
import com.tpmp.testprep.repository.DomainMasterRepository;
import com.tpmp.testprep.repository.QuestionBankRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user/quiz")
@RequiredArgsConstructor
public class UserQuizController {

    private final DomainMasterRepository domainMasterRepository;
    private final QuestionBankRepository questionBankRepository;

    /** 퀴즈 카테고리 목록 (문제 유형 / 시험 유형 도메인만 반환)
     *  examTypeIds: 쉼표 구분 시험 유형 슬레이브 ID — 전달 시 해당 유형 문항이 있는 문제 유형만 반환 */
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<DomainMasterResponse>>> getCategories(
            @RequestParam(required = false) String examTypeIds) {

        List<Long> examTypeIdList = null;
        if (examTypeIds != null && !examTypeIds.isBlank()) {
            examTypeIdList = Arrays.stream(examTypeIds.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Long::parseLong)
                    .collect(Collectors.toList());
        }

        List<String> quizMasterNames = List.of("문제 유형", "시험 유형");
        List<DomainMaster> allMasters = domainMasterRepository.findAllWithSlaves().stream()
                .filter(m -> quizMasterNames.contains(m.getName()))
                .toList();

        Set<Long> allowedCategoryIds = null;
        if (examTypeIdList != null && !examTypeIdList.isEmpty()) {
            allowedCategoryIds = new HashSet<>(
                    questionBankRepository.findDistinctCategoryIdsByExamTypeIds(examTypeIdList));
        }
        final Set<Long> finalAllowedIds = allowedCategoryIds;

        List<DomainMasterResponse> result = allMasters.stream()
                .map(m -> {
                    if (finalAllowedIds != null && "QUESTION_TYPE".equals(m.getCode())) {
                        List<DomainSlaveResponse> filtered = m.getSlaves().stream()
                                .filter(s -> finalAllowedIds.contains(s.getId()))
                                .map(DomainSlaveResponse::from)
                                .toList();
                        return new DomainMasterResponse(m.getId(), m.getCode(), m.getName(), filtered);
                    }
                    return DomainMasterResponse.from(m);
                })
                .toList();

        return ResponseEntity.ok(ApiResponse.success(result));
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
                .filter(q -> "N".equals(q.getDelYn()))
                .orElseThrow();
        boolean correct = qb.getAnswer() != null
                && qb.getAnswer().trim().equalsIgnoreCase(request.userAnswer().trim());
        return ResponseEntity.ok(ApiResponse.success(
                new CheckResult(correct, qb.getAnswer(), qb.getExplanation())));
    }

    // ── View records ────────────────────────────────────────────────────────

    public record QuizQuestionView(
            Long id, String content, String questionType,
            List<String> options, String code, String language,
            Integer examYear, Integer examRound) {

        public static QuizQuestionView from(QuestionBank qb) {
            return new QuizQuestionView(
                    qb.getId(), qb.getContent(), qb.getQuestionType().name(),
                    qb.getOptions(), qb.getCode(), qb.getLanguage(),
                    qb.getExamYear(), qb.getExamRound());
        }
    }

    public record CheckRequest(Long questionId, String userAnswer) {}

    public record CheckResult(boolean correct, String answer, String explanation) {}
}
