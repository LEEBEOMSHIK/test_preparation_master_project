package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.NotionExportResponse;
import com.tpmp.testprep.dto.response.NotionStatusResponse;
import com.tpmp.testprep.service.NotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Notion 연동 — 인증 사용자용 엔드포인트 (상태/인가URL/해제/내보내기).
 * OAuth 콜백은 비인증 접근이므로 별도 컨트롤러(NotionCallbackController)에서 처리한다.
 */
@RestController
@RequestMapping("/api/user/notion")
@RequiredArgsConstructor
public class NotionController {

    private final NotionService notionService;

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<NotionStatusResponse>> status(
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(notionService.getStatus(email)));
    }

    @GetMapping("/authorize-url")
    public ResponseEntity<ApiResponse<Map<String, String>>> authorizeUrl(
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("url", notionService.buildAuthorizeUrl(email))));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> disconnect(
            @AuthenticationPrincipal String email) {
        notionService.disconnect(email);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/export/{noteId}")
    public ResponseEntity<ApiResponse<NotionExportResponse>> export(
            @PathVariable Long noteId,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(notionService.exportNote(noteId, email)));
    }
}
