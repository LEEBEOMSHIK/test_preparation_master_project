package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.BookmarkToggleRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.BookmarkQuestionResponse;
import com.tpmp.testprep.service.UserQuestionBookmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user/bookmarks")
@RequiredArgsConstructor
public class UserQuestionBookmarkController {

    private final UserQuestionBookmarkService bookmarkService;

    /** 북마크 토글 — bookmarked: true(추가됨) / false(해제됨) */
    @PostMapping("/toggle")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> toggle(
            @AuthenticationPrincipal String email,
            @RequestBody BookmarkToggleRequest request) {
        boolean bookmarked = bookmarkService.toggle(email, request.questionBankId());
        return ResponseEntity.ok(ApiResponse.success(Map.of("bookmarked", bookmarked)));
    }

    /** 북마크 목록 조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<BookmarkQuestionResponse>>> getBookmarks(
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(bookmarkService.getBookmarks(email)));
    }

    /** 북마크된 questionBankId 목록만 반환 (퀴즈 화면 별 표시용) */
    @GetMapping("/ids")
    public ResponseEntity<ApiResponse<List<Long>>> getBookmarkedIds(
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(bookmarkService.getBookmarkedQuestionBankIds(email)));
    }
}
