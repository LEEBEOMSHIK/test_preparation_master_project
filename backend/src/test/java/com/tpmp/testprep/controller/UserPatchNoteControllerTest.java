package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.PatchNoteResponse;
import com.tpmp.testprep.dto.response.PatchNoteItemResponse;
import com.tpmp.testprep.entity.PatchNoteItem;
import com.tpmp.testprep.service.PatchNoteService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

    @Test
    void getPublished_keepsNestedItemsInServiceResponseOrder() {
        Pageable pageable = PageRequest.of(0, 10);
        PatchNoteResponse patchNote = new PatchNoteResponse(1L, "패치노트", "v1.2.0", "<p>내용</p>", true,
                null, null, null, List.of(
                new PatchNoteItemResponse(11L, PatchNoteItem.ItemType.ADD, "기능 추가", 0),
                new PatchNoteItemResponse(12L, PatchNoteItem.ItemType.FIX, "버그 수정", 1)));
        when(patchNoteService.getPublished(pageable)).thenReturn(new PageImpl<>(List.of(patchNote), pageable, 1));

        ResponseEntity<?> result = new UserPatchNoteController(patchNoteService).getPublished(pageable);

        @SuppressWarnings("unchecked")
        com.tpmp.testprep.dto.response.ApiResponse<Page<PatchNoteResponse>> body =
                (com.tpmp.testprep.dto.response.ApiResponse<Page<PatchNoteResponse>>) result.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getData().getContent().get(0).items()).extracting("displayOrder")
                .containsExactly(0, 1);
    }

    @Test
    void getPublished_preservesLegacyEtcFallbackItem() {
        Pageable pageable = PageRequest.of(0, 10);
        PatchNoteResponse legacy = new PatchNoteResponse(2L, "기존 패치노트", "1.0.0", "<p>기존 본문</p>", true,
                null, null, null, List.of(
                new PatchNoteItemResponse(null, PatchNoteItem.ItemType.ETC, "기존 본문", 0)));
        when(patchNoteService.getPublished(pageable)).thenReturn(new PageImpl<>(List.of(legacy), pageable, 1));

        ResponseEntity<?> result = new UserPatchNoteController(patchNoteService).getPublished(pageable);

        @SuppressWarnings("unchecked")
        com.tpmp.testprep.dto.response.ApiResponse<Page<PatchNoteResponse>> body =
                (com.tpmp.testprep.dto.response.ApiResponse<Page<PatchNoteResponse>>) result.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getData().getContent().get(0).items().get(0).itemType())
                .isEqualTo(PatchNoteItem.ItemType.ETC);
    }

    @Test
    void getPublished_usesPageSizeTenWhenParametersAreOmitted() throws Exception {
        when(patchNoteService.getPublished(any(Pageable.class))).thenAnswer(invocation ->
                new PageImpl<PatchNoteResponse>(List.of(), invocation.getArgument(0), 0));

        mockMvc().perform(get("/api/user/patch-notes"))
                .andExpect(status().isOk());

        Pageable pageable = capturedPageable();
        assertThat(pageable.getPageNumber()).isZero();
        assertThat(pageable.getPageSize()).isEqualTo(10);
    }

    @Test
    void getPublished_normalizesNegativePageAndCapsOversizedPageSize() throws Exception {
        when(patchNoteService.getPublished(any(Pageable.class))).thenAnswer(invocation ->
                new PageImpl<PatchNoteResponse>(List.of(), invocation.getArgument(0), 0));

        mockMvc().perform(get("/api/user/patch-notes")
                        .param("page", "-3")
                        .param("size", "999"))
                .andExpect(status().isOk());

        Pageable pageable = capturedPageable();
        assertThat(pageable.getPageNumber()).isZero();
        assertThat(pageable.getPageSize()).isEqualTo(50);
    }

    @Test
    void getPublished_normalizesNonPositivePageSizeToDefault() throws Exception {
        when(patchNoteService.getPublished(any(Pageable.class))).thenAnswer(invocation ->
                new PageImpl<PatchNoteResponse>(List.of(), invocation.getArgument(0), 0));

        mockMvc().perform(get("/api/user/patch-notes")
                        .param("page", "-3")
                        .param("size", "0"))
                .andExpect(status().isOk());

        Pageable pageable = capturedPageable();
        assertThat(pageable.getPageNumber()).isZero();
        assertThat(pageable.getPageSize()).isEqualTo(10);
    }

    private MockMvc mockMvc() {
        return MockMvcBuilders.standaloneSetup(new UserPatchNoteController(patchNoteService))
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
    }

    private Pageable capturedPageable() {
        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(patchNoteService).getPublished(captor.capture());
        return captor.getValue();
    }

    private PatchNoteResponse response() {
        return new PatchNoteResponse(1L, "패치노트", "1.0.0", "<p>내용</p>", true,
                null, null, null);
    }
}
