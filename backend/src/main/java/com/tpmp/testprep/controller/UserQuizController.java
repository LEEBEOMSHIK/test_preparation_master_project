package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.CheckRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.CheckResult;
import com.tpmp.testprep.dto.response.DomainMasterResponse;
import com.tpmp.testprep.dto.response.QuizQuestionView;
import com.tpmp.testprep.service.UserQuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/quiz")
@RequiredArgsConstructor
public class UserQuizController {

    private final UserQuizService userQuizService;

    /** 퀴즈 카테고리 목록 (문제 유형 / 시험 유형 도메인만 반환)
     *  examTypeIds: 쉼표 구분 시험 유형 슬레이브 ID — 전달 시 해당 유형 문항이 있는 문제 유형만 반환 */
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<DomainMasterResponse>>> getCategories(
            @RequestParam(required = false) String examTypeIds) {
        return ResponseEntity.ok(ApiResponse.success(userQuizService.getCategories(examTypeIds)));
    }

    /** 카테고리별 랜덤 퀴즈 문항 (기본 10개) */
    @GetMapping("/questions")
    public ResponseEntity<ApiResponse<List<QuizQuestionView>>> getQuizQuestions(
            @RequestParam Long categoryId,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.success(userQuizService.getQuizQuestions(categoryId, limit)));
    }

    /** 퀴즈 정답 확인 (단건 채점) */
    @PostMapping("/check")
    public ResponseEntity<ApiResponse<CheckResult>> checkAnswer(@RequestBody CheckRequest request) {
        return ResponseEntity.ok(ApiResponse.success(userQuizService.checkAnswer(request)));
    }
}
