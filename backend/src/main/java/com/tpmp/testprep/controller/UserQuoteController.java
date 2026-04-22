package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.QuoteResponse;
import com.tpmp.testprep.service.QuoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user/quotes")
@RequiredArgsConstructor
public class UserQuoteController {

    private final QuoteService quoteService;

    @GetMapping("/random")
    public ResponseEntity<ApiResponse<QuoteResponse>> getRandom() {
        return quoteService.getRandom()
                .map(q -> ResponseEntity.ok(ApiResponse.success(q)))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.success(null)));
    }
}
