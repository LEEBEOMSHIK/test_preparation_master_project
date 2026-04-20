package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.ConceptNoteRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.ConceptNoteResponse;
import com.tpmp.testprep.service.ConceptNoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user/concepts")
@RequiredArgsConstructor
public class UserConceptNoteController {

    private final ConceptNoteService conceptNoteService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ConceptNoteResponse>>> getMyNotes(
            Pageable pageable,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(conceptNoteService.getMyNotes(email, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ConceptNoteResponse>> getMyNote(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(conceptNoteService.getMyNote(id, email)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ConceptNoteResponse>> create(
            @Valid @RequestBody ConceptNoteRequest request,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(conceptNoteService.create(request, email)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ConceptNoteResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ConceptNoteRequest request,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(conceptNoteService.update(id, request, email)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        conceptNoteService.delete(id, email);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
