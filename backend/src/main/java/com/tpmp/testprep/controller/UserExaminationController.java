package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.ExaminationDetailResponse;
import com.tpmp.testprep.dto.response.ExaminationResponse;
import com.tpmp.testprep.dto.response.ExaminationSubmitResponse;
import com.tpmp.testprep.service.UserExaminationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user/examinations")
@RequiredArgsConstructor
public class UserExaminationController {

    private final UserExaminationService userExaminationService;

    /** 시험 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ExaminationResponse>>> getExaminations(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                userExaminationService.getExaminations(pageable)
        ));
    }

    /** 시험 상세 (문항 포함) */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExaminationDetailResponse>> getExaminationDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                userExaminationService.getExaminationDetail(id)
        ));
    }

    /** 시험 제출 및 채점 */
    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<ExaminationSubmitResponse>> submitExam(
            @PathVariable Long id,
            @RequestBody Map<Long, String> answers,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(
                userExaminationService.submitExam(id, answers, email)
        ));
    }

}
