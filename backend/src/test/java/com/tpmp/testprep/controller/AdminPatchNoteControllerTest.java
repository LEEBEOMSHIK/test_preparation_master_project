package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.PatchNotePublicationRequest;
import com.tpmp.testprep.dto.request.PatchNoteRequest;
import com.tpmp.testprep.dto.response.PatchNoteResponse;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
class AdminPatchNoteControllerTest {

    private static final String ADMIN_EMAIL = "admin@tpmp.com";

    @Mock
    private PatchNoteService patchNoteService;

    @Test
    void adminEndpoints_delegateCrudAndPublicationRequestsWithPrincipalEmail() {
        Pageable pageable = PageRequest.of(0, 10);
        PatchNoteResponse patchNote = response();
        PatchNoteRequest request = new PatchNoteRequest("패치노트", "1.0.0", "<p>내용</p>", true);
        PatchNotePublicationRequest publicationRequest = new PatchNotePublicationRequest(false);
        when(patchNoteService.adminGetAll(pageable)).thenReturn(new PageImpl<>(List.of(patchNote), pageable, 1));
        when(patchNoteService.adminGetOne(1L)).thenReturn(patchNote);
        when(patchNoteService.create(request, ADMIN_EMAIL)).thenReturn(patchNote);
        when(patchNoteService.update(1L, request, ADMIN_EMAIL)).thenReturn(patchNote);
        when(patchNoteService.updatePublication(1L, publicationRequest, ADMIN_EMAIL)).thenReturn(patchNote);
        AdminPatchNoteController controller = new AdminPatchNoteController(patchNoteService);

        ResponseEntity<?> all = controller.getAll(pageable);
        ResponseEntity<?> one = controller.getOne(1L);
        ResponseEntity<?> created = controller.create(request, ADMIN_EMAIL);
        ResponseEntity<?> updated = controller.update(1L, request, ADMIN_EMAIL);
        ResponseEntity<?> publicationUpdated = controller.updatePublication(1L, publicationRequest, ADMIN_EMAIL);
        ResponseEntity<?> deleted = controller.delete(1L, ADMIN_EMAIL);

        assertThat(all.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(one.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(updated.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(publicationUpdated.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(deleted.getStatusCode().is2xxSuccessful()).isTrue();
        verify(patchNoteService).adminGetAll(pageable);
        verify(patchNoteService).adminGetOne(1L);
        verify(patchNoteService).create(request, ADMIN_EMAIL);
        verify(patchNoteService).update(1L, request, ADMIN_EMAIL);
        verify(patchNoteService).updatePublication(1L, publicationRequest, ADMIN_EMAIL);
        verify(patchNoteService).delete(1L, ADMIN_EMAIL);
    }

    @Test
    void adminController_requiresAdminRole() {
        PreAuthorize preAuthorize = AdminPatchNoteController.class.getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value()).isEqualTo("hasRole('ADMIN')");
    }

    @Test
    void getAll_usesPageSizeTenWhenParametersAreOmitted() throws Exception {
        when(patchNoteService.adminGetAll(any(Pageable.class))).thenAnswer(invocation ->
                new PageImpl<PatchNoteResponse>(List.of(), invocation.getArgument(0), 0));

        mockMvc().perform(get("/api/admin/patch-notes"))
                .andExpect(status().isOk());

        Pageable pageable = capturedPageable();
        assertThat(pageable.getPageNumber()).isZero();
        assertThat(pageable.getPageSize()).isEqualTo(10);
    }

    @Test
    void getAll_normalizesNegativePageAndCapsOversizedPageSize() throws Exception {
        when(patchNoteService.adminGetAll(any(Pageable.class))).thenAnswer(invocation ->
                new PageImpl<PatchNoteResponse>(List.of(), invocation.getArgument(0), 0));

        mockMvc().perform(get("/api/admin/patch-notes")
                        .param("page", "-3")
                        .param("size", "999"))
                .andExpect(status().isOk());

        Pageable pageable = capturedPageable();
        assertThat(pageable.getPageNumber()).isZero();
        assertThat(pageable.getPageSize()).isEqualTo(50);
    }

    @Test
    void getAll_normalizesNonPositivePageSizeToDefault() throws Exception {
        when(patchNoteService.adminGetAll(any(Pageable.class))).thenAnswer(invocation ->
                new PageImpl<PatchNoteResponse>(List.of(), invocation.getArgument(0), 0));

        mockMvc().perform(get("/api/admin/patch-notes")
                        .param("page", "-3")
                        .param("size", "0"))
                .andExpect(status().isOk());

        Pageable pageable = capturedPageable();
        assertThat(pageable.getPageNumber()).isZero();
        assertThat(pageable.getPageSize()).isEqualTo(10);
    }

    private MockMvc mockMvc() {
        return MockMvcBuilders.standaloneSetup(new AdminPatchNoteController(patchNoteService))
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
    }

    private Pageable capturedPageable() {
        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(patchNoteService).adminGetAll(captor.capture());
        return captor.getValue();
    }

    private PatchNoteResponse response() {
        return new PatchNoteResponse(1L, "패치노트", "1.0.0", "<p>내용</p>", true,
                null, null, null);
    }
}
