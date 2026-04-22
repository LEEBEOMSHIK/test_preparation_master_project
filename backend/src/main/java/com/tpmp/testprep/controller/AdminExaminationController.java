package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.ExaminationCreateRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.ExaminationResponse;
import com.tpmp.testprep.service.ExaminationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/examinations")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminExaminationController {

    private final ExaminationService examinationService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ExaminationResponse>>> getExaminations(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(examinationService.getExaminations(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExaminationResponse>> getExamination(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(examinationService.getExamination(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExaminationResponse>> createExamination(
            @Valid @RequestBody ExaminationCreateRequest request,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(examinationService.createExamination(request, email)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ExaminationResponse>> updateExamination(
            @PathVariable Long id,
            @Valid @RequestBody ExaminationCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(examinationService.updateExamination(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExamination(@PathVariable Long id) {
        examinationService.deleteExamination(id);
        return ResponseEntity.ok(ApiResponse.success());
    }
}
