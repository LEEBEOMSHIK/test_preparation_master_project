package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.ExamCreateRequest;
import com.tpmp.testprep.dto.request.QuestionRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.ExamSummaryResponse;
import com.tpmp.testprep.entity.Exam;
import com.tpmp.testprep.service.ExamService;
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

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/exams")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminExamController {

    private final ExamService examService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ExamSummaryResponse>>> getExams(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(examService.getExams(pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExamSummaryResponse>> createExam(
            @Valid @RequestBody ExamCreateRequest request,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(examService.createExam(request, email)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ExamSummaryResponse>> updateExam(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String title = body.get("title");
        Exam.QuestionMode mode = body.containsKey("questionMode")
                ? Exam.QuestionMode.valueOf(body.get("questionMode")) : null;
        return ResponseEntity.ok(ApiResponse.success(examService.updateExam(id, title, mode)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExam(@PathVariable Long id) {
        examService.deleteExam(id);
        return ResponseEntity.ok(ApiResponse.success());
    }

    @PostMapping("/{id}/questions")
    public ResponseEntity<ApiResponse<Void>> addQuestion(
            @PathVariable Long id,
            @Valid @RequestBody QuestionRequest request) {
        examService.addQuestion(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success());
    }

    @PostMapping("/{id}/questions/bulk")
    public ResponseEntity<ApiResponse<Void>> addQuestionsBulk(
            @PathVariable Long id,
            @RequestBody List<@Valid QuestionRequest> requests) {
        examService.addQuestionsBulk(id, requests);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success());
    }

    @PostMapping(value = "/{id}/questions/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Integer>>> uploadQuestions(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file) {
        int imported = examService.uploadQuestionsFromFile(id, file);
        return ResponseEntity.ok(ApiResponse.success(Map.of("imported", imported)));
    }
}
