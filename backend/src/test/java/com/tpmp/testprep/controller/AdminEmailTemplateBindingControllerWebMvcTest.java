package com.tpmp.testprep.controller;

import com.tpmp.testprep.config.SecurityConfig;
import com.tpmp.testprep.dto.response.EmailTemplateBindingResponse;
import com.tpmp.testprep.entity.EmailTemplate;
import com.tpmp.testprep.entity.EmailTemplateEvent;
import com.tpmp.testprep.security.jwt.JwtTokenProvider;
import com.tpmp.testprep.security.oauth2.CustomOAuth2UserService;
import com.tpmp.testprep.security.oauth2.OAuth2AuthenticationSuccessHandler;
import com.tpmp.testprep.service.EmailTemplateBindingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = AdminEmailTemplateBindingController.class,
        properties = {
                "app.cors.allowed-origins=http://localhost:3000",
                "app.oauth2.frontend-redirect-uri=http://localhost:3000/auth/oauth/callback"
        })
@Import(SecurityConfig.class)
class AdminEmailTemplateBindingControllerWebMvcTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private EmailTemplateBindingService service;

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
    void getReturnsFixedThreeEventRows() throws Exception {
        List<EmailTemplateBindingResponse> responses = Arrays.stream(EmailTemplateEvent.values())
                .map(this::unconfigured)
                .toList();
        when(service.getAllBindings()).thenReturn(responses);

        mvc.perform(get("/api/admin/email-template-bindings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(3))
                .andExpect(jsonPath("$.data[1].eventCode").value("INQUIRY_COMPLETED"));
    }

    @Test
    @WithMockUser(username = "admin@tpmp.com", roles = "ADMIN")
    void putBindsTemplateFromValidatedBody() throws Exception {
        when(service.bind("INQUIRY_COMPLETED", 1L, "admin@tpmp.com"))
                .thenReturn(configured(EmailTemplateEvent.INQUIRY_COMPLETED));

        mvc.perform(put("/api/admin/email-template-bindings/INQUIRY_COMPLETED")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"templateId\":1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.configured").value(true));
        verify(service).bind("INQUIRY_COMPLETED", 1L, "admin@tpmp.com");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteUnbindsEvent() throws Exception {
        when(service.unbind("INQUIRY_COMPLETED"))
                .thenReturn(unconfigured(EmailTemplateEvent.INQUIRY_COMPLETED));

        mvc.perform(delete("/api/admin/email-template-bindings/INQUIRY_COMPLETED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.configured").value(false));
        verify(service).unbind("INQUIRY_COMPLETED");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void unknownEventReturnsNormalizedNotFound() throws Exception {
        mvc.perform(delete("/api/admin/email-template-bindings/UNKNOWN_EVENT"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("EMAIL_TEMPLATE_EVENT_NOT_FOUND"));
        verify(service, never()).unbind("UNKNOWN_EVENT");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void nullTemplateIdReturnsValidationError() throws Exception {
        mvc.perform(put("/api/admin/email-template-bindings/INQUIRY_COMPLETED")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"templateId\":null}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));
    }

    private EmailTemplateBindingResponse configured(EmailTemplateEvent event) {
        return new EmailTemplateBindingResponse(
                event,
                event.getLabel(),
                event.getScope(),
                1L,
                "템플릿",
                true,
                true,
                true,
                null);
    }

    private EmailTemplateBindingResponse unconfigured(EmailTemplateEvent event) {
        return new EmailTemplateBindingResponse(
                event,
                event.getLabel(),
                EmailTemplate.Scope.INQUIRY_STATUS,
                null,
                null,
                null,
                false,
                false,
                "템플릿 미설정");
    }
}
