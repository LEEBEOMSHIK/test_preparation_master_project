package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.ConceptNoteResponse;
import com.tpmp.testprep.service.ConceptNoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/concepts")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminConceptNoteController {

    private final ConceptNoteService conceptNoteService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ConceptNoteResponse>>> getAll(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(conceptNoteService.adminGetAll(pageable)));
    }

    @PatchMapping("/{id}/toggle-public")
    public ResponseEntity<ApiResponse<ConceptNoteResponse>> togglePublic(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(conceptNoteService.adminTogglePublic(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        conceptNoteService.adminDelete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
