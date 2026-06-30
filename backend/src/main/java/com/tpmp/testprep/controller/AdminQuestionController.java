package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.QuestionAnalysisRequest;
import com.tpmp.testprep.dto.request.QuestionBankBulkRequest;
import com.tpmp.testprep.dto.request.QuestionBankRequest;
import com.tpmp.testprep.dto.request.QuestionRegenerateRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.QuestionAnalysisResponse;
import com.tpmp.testprep.dto.response.QuestionBankResponse;
import com.tpmp.testprep.dto.response.QuestionRegenerateResponse;
import com.tpmp.testprep.service.QuestionAnalysisService;
import com.tpmp.testprep.service.QuestionBankService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/questions")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminQuestionController {

    private final QuestionBankService questionBankService;
    private final QuestionAnalysisService questionAnalysisService;

    /** 문항 목록 조회 (페이징) */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<QuestionBankResponse>>> getQuestions(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(questionBankService.getQuestions(pageable)));
    }

    /** 문항 단건 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuestionBankResponse>> getQuestion(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(questionBankService.getQuestion(id)));
    }

    /** 문항 단건 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<QuestionBankResponse>> createQuestion(
            @Valid @RequestBody QuestionBankRequest request,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(questionBankService.createQuestion(request, email)));
    }

    /** 문항 일괄 등록 */
    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> createQuestionsBulk(
            @Valid @RequestBody QuestionBankBulkRequest request,
            @AuthenticationPrincipal String email) {
        int created = questionBankService.createQuestionsBulk(request, email);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(Map.of("created", created)));
    }

    /** 문항 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<QuestionBankResponse>> updateQuestion(
            @PathVariable Long id,
            @Valid @RequestBody QuestionBankRequest request,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(questionBankService.updateQuestion(id, request, email)));
    }

    /** 문항 이미지 업로드 — 반환값: { url: "/uploads/images/uuid.ext" } */
    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(
            @RequestPart("image") MultipartFile image) {
        String url = questionBankService.uploadImage(image);
        return ResponseEntity.ok(ApiResponse.success(Map.of("url", url)));
    }

    /** 문항 AI 키워드·도메인 분석 */
    @PostMapping("/analyze")
    public ResponseEntity<ApiResponse<QuestionAnalysisResponse>> analyze(
            @Valid @RequestBody QuestionAnalysisRequest request) {
        return ResponseEntity.ok(ApiResponse.success(questionAnalysisService.analyze(request.content(), request.code(), request.language())));
    }

    /** 문항 AI 재구성 (키워드 기반 새 문제 생성) */
    @PostMapping("/regenerate")
    public ResponseEntity<ApiResponse<QuestionRegenerateResponse>> regenerate(
            @RequestBody QuestionRegenerateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(questionAnalysisService.regenerate(request)));
    }

    /** 문항 삭제 (소프트 삭제) */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        questionBankService.deleteQuestion(id, email);
        return ResponseEntity.ok(ApiResponse.success());
    }
}
