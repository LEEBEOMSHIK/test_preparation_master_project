package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.PatchNotePublicationRequest;
import com.tpmp.testprep.dto.request.PatchNoteRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.PatchNoteResponse;
import com.tpmp.testprep.service.PatchNoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/patch-notes")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminPatchNoteController {

    private final PatchNoteService patchNoteService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PatchNoteResponse>>> getAll(
            @PageableDefault(size = PatchNotePageable.DEFAULT_SIZE) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                patchNoteService.adminGetAll(PatchNotePageable.normalize(pageable))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PatchNoteResponse>> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(patchNoteService.adminGetOne(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PatchNoteResponse>> create(
            @Valid @RequestBody PatchNoteRequest request,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(patchNoteService.create(request, email)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PatchNoteResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody PatchNoteRequest request,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(patchNoteService.update(id, request, email)));
    }

    @PatchMapping("/{id}/publication")
    public ResponseEntity<ApiResponse<PatchNoteResponse>> updatePublication(
            @PathVariable Long id,
            @Valid @RequestBody PatchNotePublicationRequest request,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(patchNoteService.updatePublication(id, request, email)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        patchNoteService.delete(id, email);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
