package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.KeywordTagBulkRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.KeywordTagResponse;
import com.tpmp.testprep.service.KeywordTagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/keyword-tags")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminKeywordTagController {

    private final KeywordTagService keywordTagService;

    /** 키워드·도메인 태그 일괄 저장 (upsert) */
    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> saveBulk(
            @RequestBody KeywordTagBulkRequest request) {
        int saved = keywordTagService.saveBulk(request);
        return ResponseEntity.ok(ApiResponse.success(Map.of("saved", saved)));
    }

    /** 태그 검색 — type: KEYWORD | DOMAIN */
    @GetMapping
    public ResponseEntity<ApiResponse<List<KeywordTagResponse>>> search(
            @RequestParam String type,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(ApiResponse.success(keywordTagService.search(type, q)));
    }
}
