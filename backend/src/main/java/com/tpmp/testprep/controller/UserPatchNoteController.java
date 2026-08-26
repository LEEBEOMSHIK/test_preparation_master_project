package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.PatchNoteResponse;
import com.tpmp.testprep.service.PatchNoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user/patch-notes")
@RequiredArgsConstructor
public class UserPatchNoteController {

    private final PatchNoteService patchNoteService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PatchNoteResponse>>> getPublished(
            @PageableDefault(size = PatchNotePageable.DEFAULT_SIZE) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                patchNoteService.getPublished(PatchNotePageable.normalize(pageable))));
    }
}
