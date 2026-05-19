package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.ExamHistoryResponse;
import com.tpmp.testprep.dto.response.PagedResponse;
import com.tpmp.testprep.service.ExamHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/exam-history")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminExamHistoryController {

    private final ExamHistoryService examHistoryService;

    @GetMapping
    public ApiResponse<PagedResponse<ExamHistoryResponse>> getExamHistories(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "name") String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "takenAt"));
        return ApiResponse.success(examHistoryService.getExamHistories(keyword, type, from, to, pageable));
    }
}
