package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.ExamInfoRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.ExamInfoResponse;
import com.tpmp.testprep.service.ExamInfoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/exam-info")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminExamInfoController {

    private final ExamInfoService examInfoService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ExamInfoResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(examInfoService.getAllForAdmin()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExamInfoResponse>> create(
            @Valid @RequestBody ExamInfoRequest request) {
        return ResponseEntity.ok(ApiResponse.success(examInfoService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ExamInfoResponse>> update(
            @PathVariable Long id, @Valid @RequestBody ExamInfoRequest request) {
        return ResponseEntity.ok(ApiResponse.success(examInfoService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        examInfoService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
