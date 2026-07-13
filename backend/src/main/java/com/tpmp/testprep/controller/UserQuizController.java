package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.CheckRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.CheckResult;
import com.tpmp.testprep.dto.response.DomainMasterResponse;
import com.tpmp.testprep.dto.response.QuizQuestionView;
import com.tpmp.testprep.service.UserQuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    /** 카테고리별 랜덤 퀴즈 문항 (기본 10개)
     *  categoryId: 미전달(null)이면 카테고리 구분 없는 전체 랜덤 출제 — AI 커스텀 통합 카드 전용 진입이며,
     *              서비스 계층에서 source='AI_CUSTOM'이 아니면 오류를 반환한다.
     *  language: CODE 유형 문항 대상 프로그래밍 언어 필터(java/python/c 등). 미전달·"ALL"이면 전체 반환
     *  source: 문항 출처 필터("EXAM"/"AI_CUSTOM"). 미전달·"ALL"·정의되지 않은 값이면 전체 반환 */
    @GetMapping("/questions")
    public ResponseEntity<ApiResponse<List<QuizQuestionView>>> getQuizQuestions(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) String source) {
        return ResponseEntity.ok(ApiResponse.success(userQuizService.getQuizQuestions(categoryId, limit, language, source)));
    }

    /** 퀴즈 정답 확인 (단건 채점 + 이력 저장) */
    @PostMapping("/check")
    public ResponseEntity<ApiResponse<CheckResult>> checkAnswer(
            @RequestBody CheckRequest request,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(userQuizService.checkAnswer(request, email)));
    }

    /** 사용자가 복습 표시(북마크)한 문항 전체 (재풀이 모드용, 정답 미노출) */
    @GetMapping("/bookmarked-questions")
    public ResponseEntity<ApiResponse<List<QuizQuestionView>>> getBookmarkedQuestions(
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(userQuizService.getBookmarkedQuestions(email)));
    }
}
