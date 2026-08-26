package com.tpmp.testprep.controller;

import com.tpmp.testprep.config.SecurityConfig;
import com.tpmp.testprep.dto.response.PatchNoteResponse;
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
}
