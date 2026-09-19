package com.tpmp.testprep.controller;

import com.tpmp.testprep.config.SecurityConfig;
import com.tpmp.testprep.dto.response.PatchNoteResponse;
import com.tpmp.testprep.dto.response.PatchNoteItemResponse;
import com.tpmp.testprep.entity.PatchNoteItem;
import com.tpmp.testprep.security.jwt.JwtTokenProvider;
import com.tpmp.testprep.security.oauth2.CustomOAuth2UserService;
import com.tpmp.testprep.security.oauth2.OAuth2AuthenticationSuccessHandler;
import com.tpmp.testprep.service.PatchNoteService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = AdminPatchNoteController.class,
        properties = {
                "app.cors.allowed-origins=http://localhost:3000",
                "app.oauth2.frontend-redirect-uri=http://localhost:3000/auth/oauth/callback"
        })
@Import(SecurityConfig.class)
class AdminPatchNoteControllerWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PatchNoteService patchNoteService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomOAuth2UserService customOAuth2UserService;

    @MockBean
    private OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    @MockBean
    private ClientRegistrationRepository clientRegistrationRepository;

    @Test
    void unauthenticatedUser_cannotAccessAdminPatchNotes() throws Exception {
        mockMvc.perform(get("/api/admin/patch-notes"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void userRole_cannotAccessAdminPatchNotes() throws Exception {
        mockMvc.perform(get("/api/admin/patch-notes")
                        .with(user("user@tpmp.com").roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminRole_canAccessAdminPatchNotes() throws Exception {
        when(patchNoteService.adminGetAll(any(Pageable.class))).thenReturn(
                new PageImpl<PatchNoteResponse>(List.of(), PageRequest.of(0, 10), 0));

        mockMvc.perform(get("/api/admin/patch-notes")
                        .with(user("admin@tpmp.com").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void invalidCreateRequest_returnsBadRequestThroughValidationChain() throws Exception {
        mockMvc.perform(post("/api/admin/patch-notes")
                        .with(user("admin@tpmp.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "",
                                  "version": "",
                                  "content": "",
                                  "published": null
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));
    }

    @Test
    void invalidNestedItemRequest_returnsBadRequestThroughValidationChain() throws Exception {
        mockMvc.perform(post("/api/admin/patch-notes")
                        .with(user("admin@tpmp.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "패치노트",
                                  "version": "v1.2.0",
                                  "content": "<p>본문</p>",
                                  "published": false,
                                  "items": [{"itemType":"ADD","summary":"기능 추가","displayOrder":-1}]
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));
    }

    @Test
    void concurrentVersionConstraintViolation_returnsPatchNoteDuplicateError() throws Exception {
        when(patchNoteService.create(any(), any()))
                .thenThrow(new DataIntegrityViolationException("ux_patch_notes_version_active"));

        mockMvc.perform(post("/api/admin/patch-notes")
                        .with(user("admin@tpmp.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "패치노트",
                                  "version": "v1.2.0",
                                  "content": "<p>본문</p>",
                                  "published": false,
                                  "items": [{"itemType":"ADD","summary":"기능 추가","displayOrder":0}]
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("PATCH_NOTE_VERSION_DUPLICATE"));
    }

    @Test
    void create_returnsNestedPatchItems() throws Exception {
        PatchNoteResponse response = new PatchNoteResponse(1L, "패치노트", "v1.2.0", "<p>본문</p>", false,
                null, null, null, List.of(
                new PatchNoteItemResponse(11L, PatchNoteItem.ItemType.ADD, "기능 추가", 0),
                new PatchNoteItemResponse(12L, PatchNoteItem.ItemType.FIX, "버그 수정", 1)));
        when(patchNoteService.create(any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/admin/patch-notes")
                        .with(user("admin@tpmp.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "패치노트",
                                  "version": "v1.2.0",
                                  "content": "<p>본문</p>",
                                  "published": false,
                                  "items": [{"itemType":"ADD","summary":"기능 추가","displayOrder":0}]
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.items[0].itemType").value("ADD"))
                .andExpect(jsonPath("$.data.items[1].displayOrder").value(1));
    }
}
