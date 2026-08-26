package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.PatchNoteResponse;
import com.tpmp.testprep.service.PatchNoteService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserPatchNoteControllerTest {

    @Mock
    private PatchNoteService patchNoteService;

    @Test
    void getPublished_returnsPublishedPatchNotePage() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<PatchNoteResponse> page = new PageImpl<>(List.of(response()), pageable, 1);
        when(patchNoteService.getPublished(pageable)).thenReturn(page);
        UserPatchNoteController controller = new UserPatchNoteController(patchNoteService);

        ResponseEntity<?> result = controller.getPublished(pageable);

        assertThat(result.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(result.getBody()).isNotNull();
        verify(patchNoteService).getPublished(pageable);
    }

    private PatchNoteResponse response() {
        return new PatchNoteResponse(1L, "패치노트", "1.0.0", "<p>내용</p>", true,
                null, null, null);
    }
}
