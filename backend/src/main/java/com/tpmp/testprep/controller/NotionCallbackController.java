package com.tpmp.testprep.controller;

import com.tpmp.testprep.service.NotionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

/**
 * Notion OAuth 콜백 — 브라우저 top-level redirect로 진입(인증 헤더 없음)하므로
 * SecurityConfig에서 permitAll 처리하고, 사용자 식별은 state 토큰으로 수행한다.
 */
@Slf4j
@RestController
@RequestMapping("/api/notion")
@RequiredArgsConstructor
public class NotionCallbackController {

    private final NotionService notionService;

    @GetMapping("/callback")
    public ResponseEntity<Void> callback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error) {
        String redirect;
        try {
            if (error != null || code == null) {
                redirect = notionService.failureRedirect();
            } else {
                notionService.handleCallback(code, state);
                redirect = notionService.successRedirect();
            }
        } catch (Exception e) {
            log.warn("[Notion] 콜백 처리 실패: {}", e.getMessage());
            redirect = notionService.failureRedirect();
        }
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(redirect)).build();
    }
}
