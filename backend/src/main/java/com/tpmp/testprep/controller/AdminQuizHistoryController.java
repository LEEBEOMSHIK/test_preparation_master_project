package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.PagedResponse;
import com.tpmp.testprep.dto.response.QuizDomainStatResponse;
import com.tpmp.testprep.dto.response.QuizHistoryResponse;
import com.tpmp.testprep.service.QuizHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/quiz-history")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminQuizHistoryController {

    private final QuizHistoryService quizHistoryService;

    @GetMapping
    public ApiResponse<PagedResponse<QuizHistoryResponse>> getQuizHistories(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "name") String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ApiResponse.success(quizHistoryService.getQuizHistories(keyword, type, from, to, pageable));
    }

    @GetMapping("/domain-stats")
    public ApiResponse<List<QuizDomainStatResponse>> getDomainStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.success(quizHistoryService.getDomainStats(from, to));
    }
}
