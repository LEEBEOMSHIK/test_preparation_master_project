package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.QuoteRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.QuoteResponse;
import com.tpmp.testprep.service.QuoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/quotes")
@RequiredArgsConstructor
public class AdminQuoteController {

    private final QuoteService quoteService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<QuoteResponse>>> getAll(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(quoteService.getAll(pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<QuoteResponse>> create(@Valid @RequestBody QuoteRequest request) {
        return ResponseEntity.ok(ApiResponse.success(quoteService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<QuoteResponse>> update(
            @PathVariable Long id, @Valid @RequestBody QuoteRequest request) {
        return ResponseEntity.ok(ApiResponse.success(quoteService.update(id, request)));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<QuoteResponse>> toggleUseYn(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(quoteService.toggleUseYn(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        quoteService.delete(id);
        return ResponseEntity.ok(ApiResponse.success());
    }
}
