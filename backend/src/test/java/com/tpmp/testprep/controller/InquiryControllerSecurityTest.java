package com.tpmp.testprep.controller;

import com.tpmp.testprep.config.SecurityConfig;
import com.tpmp.testprep.dto.response.InquiryNotificationSettingsResponse;
import com.tpmp.testprep.security.jwt.JwtTokenProvider;
import com.tpmp.testprep.security.oauth2.CustomOAuth2UserService;
import com.tpmp.testprep.security.oauth2.OAuth2AuthenticationSuccessHandler;
import com.tpmp.testprep.service.InquiryEmailService;
import com.tpmp.testprep.service.InquiryNotificationSettingsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {
        AdminInquiryNotificationController.class,
        AdminInquiryEmailDeliveryController.class
})
@Import(SecurityConfig.class)
@TestPropertySource(properties = {
        "app.cors.allowed-origins=http://localhost:3000",
        "app.oauth2.frontend-redirect-uri=http://localhost:3000/auth/oauth/callback"
})
class InquiryControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private InquiryNotificationSettingsService settingsService;

    @MockBean
    private InquiryEmailService emailService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomOAuth2UserService customOAuth2UserService;

    @MockBean
    private OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    @BeforeEach
    void setUpResponses() {
        InquiryNotificationSettingsResponse settings =
                new InquiryNotificationSettingsResponse(false, List.of());
        when(settingsService.get()).thenReturn(settings);
        when(settingsService.update(any())).thenReturn(settings);
        when(emailService.getDeliveries(isNull(), isNull(), any(Pageable.class)))
                .thenReturn(Page.empty());
    }

    @Test
    void anonymousRequestsReceiveUnauthorizedForEveryNotificationAdminApi() throws Exception {
        mockMvc.perform(get("/api/admin/inquiry-notification-settings"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/admin/inquiry-notification-settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":false,\"recipientEmails\":[]}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/inquiry-email-deliveries"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/admin/inquiry-email-deliveries/91/retry"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void userRequestsReceiveForbiddenForEveryNotificationAdminApi() throws Exception {
        mockMvc.perform(get("/api/admin/inquiry-notification-settings")
                        .with(user("user@tpmp.test").roles("USER")))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/admin/inquiry-notification-settings")
                        .with(user("user@tpmp.test").roles("USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":false,\"recipientEmails\":[]}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/inquiry-email-deliveries")
                        .with(user("user@tpmp.test").roles("USER")))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/admin/inquiry-email-deliveries/91/retry")
                        .with(user("user@tpmp.test").roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanUseSettingsDeliveryAndRetryApisThroughSecurityFilterChain() throws Exception {
        mockMvc.perform(get("/api/admin/inquiry-notification-settings")
                        .with(user("admin@tpmp.test").roles("ADMIN")))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/admin/inquiry-notification-settings")
                        .with(user("admin@tpmp.test").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":false,\"recipientEmails\":[]}"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/admin/inquiry-email-deliveries")
                        .with(user("admin@tpmp.test").roles("ADMIN")))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/admin/inquiry-email-deliveries/91/retry")
                        .with(user("admin@tpmp.test").roles("ADMIN")))
                .andExpect(status().isOk());

        verify(emailService).retry(91L);
    }
}
