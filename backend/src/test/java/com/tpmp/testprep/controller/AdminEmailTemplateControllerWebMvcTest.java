package com.tpmp.testprep.controller;

import com.tpmp.testprep.config.SecurityConfig;
import com.tpmp.testprep.dto.request.EmailTemplateCreateRequest;
import com.tpmp.testprep.dto.request.EmailTemplatePreviewRequest;
import com.tpmp.testprep.dto.request.EmailTemplateUpdateRequest;
import com.tpmp.testprep.dto.response.EmailTemplateDetailResponse;
import com.tpmp.testprep.dto.response.EmailTemplatePreviewResponse;
import com.tpmp.testprep.dto.response.EmailTemplateSummaryResponse;
import com.tpmp.testprep.dto.response.EmailTemplateTestSendResponse;
import com.tpmp.testprep.entity.EmailTemplate;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.security.jwt.JwtTokenProvider;
import com.tpmp.testprep.security.oauth2.CustomOAuth2UserService;
import com.tpmp.testprep.security.oauth2.OAuth2AuthenticationSuccessHandler;
import com.tpmp.testprep.service.EmailTemplateService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = AdminEmailTemplateController.class,
        properties = {
                "app.cors.allowed-origins=http://localhost:3000",
                "app.oauth2.frontend-redirect-uri=http://localhost:3000/auth/oauth/callback"
        })
@Import(SecurityConfig.class)
class AdminEmailTemplateControllerWebMvcTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private EmailTemplateService service;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomOAuth2UserService customOAuth2UserService;

    @MockBean
    private OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    @MockBean
    private ClientRegistrationRepository clientRegistrationRepository;

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllForwardsFiltersAndPageable() throws Exception {
        when(service.getAll(eq("완료"), eq(EmailTemplate.Scope.INQUIRY_STATUS), eq(true), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(summary()), PageRequest.of(0, 10), 1));

        mvc.perform(get("/api/admin/email-templates")
                        .param("keyword", "완료")
                        .param("scope", "INQUIRY_STATUS")
                        .param("active", "true")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].name").value("완료"));

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(service).getAll(eq("완료"), eq(EmailTemplate.Scope.INQUIRY_STATUS), eq(true),
                pageableCaptor.capture());
        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(10);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getOneReturnsDetail() throws Exception {
        when(service.getOne(1L)).thenReturn(detail());

        mvc.perform(get("/api/admin/email-templates/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    @WithMockUser(username = "admin@tpmp.com", roles = "ADMIN")
    void createReturnsSanitizedDetail() throws Exception {
        when(service.create(any(EmailTemplateCreateRequest.class), eq("admin@tpmp.com")))
                .thenReturn(detail());

        mvc.perform(post("/api/admin/email-templates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreateJson()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("완료"));
    }

    @Test
    @WithMockUser(username = "admin@tpmp.com", roles = "ADMIN")
    void updateForwardsPrincipalAndPayload() throws Exception {
        when(service.update(eq(1L), any(EmailTemplateUpdateRequest.class), eq("admin@tpmp.com")))
                .thenReturn(detail());

        mvc.perform(put("/api/admin/email-templates/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"완료","subjectTemplate":"제목","htmlBody":"<p>본문</p>","active":true}
                                """))
                .andExpect(status().isOk());
        verify(service).update(eq(1L), any(EmailTemplateUpdateRequest.class), eq("admin@tpmp.com"));
    }

    @Test
    @WithMockUser(username = "admin@tpmp.com", roles = "ADMIN")
    void cloneAndResetForwardPrincipal() throws Exception {
        when(service.cloneTemplate(1L, "admin@tpmp.com")).thenReturn(detail());
        when(service.resetDefault(1L, "admin@tpmp.com")).thenReturn(detail());

        mvc.perform(post("/api/admin/email-templates/1/clone"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/admin/email-templates/1/reset-default"))
                .andExpect(status().isOk());
        verify(service).cloneTemplate(1L, "admin@tpmp.com");
        verify(service).resetDefault(1L, "admin@tpmp.com");
    }

    @Test
    @WithMockUser(username = "admin@tpmp.com", roles = "ADMIN")
    void deleteReturnsDetailedConflict() throws Exception {
        org.mockito.Mockito.doThrow(new BusinessException(
                        ErrorCode.EMAIL_TEMPLATE_IN_USE,
                        List.of(new com.tpmp.testprep.dto.response.EmailTemplateReferenceResponse(
                                com.tpmp.testprep.entity.EmailTemplateEvent.INQUIRY_COMPLETED, "처리 완료"))))
                .when(service).delete(1L, "admin@tpmp.com");

        mvc.perform(delete("/api/admin/email-templates/1"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("EMAIL_TEMPLATE_IN_USE"))
                .andExpect(jsonPath("$.error.details[0].eventCode").value("INQUIRY_COMPLETED"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void previewReturnsServerRenderedContent() throws Exception {
        when(service.preview(any(EmailTemplatePreviewRequest.class))).thenReturn(
                new EmailTemplatePreviewResponse(
                        "<p>정화</p>", "샘플 제목", "<p>샘플</p>", "샘플", true));

        mvc.perform(post("/api/admin/email-templates/preview")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"scope":"INQUIRY_STATUS","subjectTemplate":"제목","htmlBody":"<p>본문</p>"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unsafeContentRemoved").value(true));
    }

    @Test
    @WithMockUser(username = "admin@tpmp.com", roles = "ADMIN")
    void testSendHasNoRecipientInput() throws Exception {
        when(service.testSend(1L, "admin@tpmp.com")).thenReturn(
                new EmailTemplateTestSendResponse(
                        "a***@tpmp.com", LocalDateTime.of(2026, 8, 31, 12, 0)));

        mvc.perform(post("/api/admin/email-templates/1/test-send"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.recipientMasked").value("a***@tpmp.com"));
        verify(service).testSend(1L, "admin@tpmp.com");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void invalidCreatePayloadReturnsValidationError() throws Exception {
        mvc.perform(post("/api/admin/email-templates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"","scope":null,"subjectTemplate":"","htmlBody":"","active":true}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void userCannotReadTemplates() throws Exception {
        mvc.perform(get("/api/admin/email-templates"))
                .andExpect(status().isForbidden());
    }

    private String validCreateJson() {
        return """
                {"name":"완료","scope":"INQUIRY_STATUS","subjectTemplate":"제목","htmlBody":"<p>본문</p>","active":true}
                """;
    }

    private EmailTemplateSummaryResponse summary() {
        return new EmailTemplateSummaryResponse(
                1L,
                "완료",
                EmailTemplate.Scope.INQUIRY_STATUS,
                true,
                false,
                0,
                List.of(),
                true,
                LocalDateTime.of(2026, 8, 31, 10, 0));
    }

    private EmailTemplateDetailResponse detail() {
        return new EmailTemplateDetailResponse(
                1L,
                "완료",
                EmailTemplate.Scope.INQUIRY_STATUS,
                "제목",
                "<p>정화 본문</p>",
                "정화 본문",
                true,
                false,
                0,
                List.of(),
                true,
                List.of(),
                LocalDateTime.of(2026, 8, 31, 9, 0),
                LocalDateTime.of(2026, 8, 31, 10, 0));
    }
}
