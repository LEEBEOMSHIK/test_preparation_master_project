package com.tpmp.testprep.controller;

import com.tpmp.testprep.config.SecurityConfig;
import com.tpmp.testprep.dto.request.InquiryStatusUpdateRequest;
import com.tpmp.testprep.dto.response.InquiryDetailResponse;
import com.tpmp.testprep.dto.response.InquiryStatusEmailOutcome;
import com.tpmp.testprep.dto.response.InquiryStatusUpdateResponse;
import com.tpmp.testprep.security.jwt.JwtTokenProvider;
import com.tpmp.testprep.security.oauth2.CustomOAuth2UserService;
import com.tpmp.testprep.security.oauth2.OAuth2AuthenticationSuccessHandler;
import com.tpmp.testprep.service.InquiryService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = AdminInquiryController.class,
        properties = {
                "app.cors.allowed-origins=http://localhost:3000",
                "app.oauth2.frontend-redirect-uri=http://localhost:3000/auth/oauth/callback"
        })
@Import(SecurityConfig.class)
class AdminInquiryControllerWebMvcTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private InquiryService inquiryService;

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
    void statusUpdateWithoutMessageReturnsEmailOutcome() throws Exception {
        when(inquiryService.updateStatus(eq(41L), any(InquiryStatusUpdateRequest.class)))
                .thenReturn(new InquiryStatusUpdateResponse(
                        detailResponse(),
                        InquiryStatusEmailOutcome.QUEUED,
                        "상태 변경 안내 이메일을 발송 대기열에 등록했습니다.",
                        null));

        mvc.perform(patch("/api/admin/inquiries/41/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"COMPLETED\",\"sendEmail\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.inquiry.status").value("COMPLETED"))
                .andExpect(jsonPath("$.data.emailOutcome").value("QUEUED"))
                .andExpect(jsonPath("$.data.emailMessage")
                        .value("상태 변경 안내 이메일을 발송 대기열에 등록했습니다."))
                .andExpect(jsonPath("$.data.templateSettingsUrl").doesNotExist());

        ArgumentCaptor<InquiryStatusUpdateRequest> requestCaptor =
                ArgumentCaptor.forClass(InquiryStatusUpdateRequest.class);
        verify(inquiryService).updateStatus(eq(41L), requestCaptor.capture());
        assertThat(requestCaptor.getValue().status().name()).isEqualTo("COMPLETED");
        assertThat(requestCaptor.getValue().sendEmail()).isTrue();
    }

    private InquiryDetailResponse detailResponse() {
        return new InquiryDetailResponse(
                41L, "기능 요청", "내용", "FEATURE_REQUEST", null, null,
                "COMPLETED", List.of(), List.of(), LocalDateTime.of(2026, 8, 31, 9, 0),
                7L, "회원");
    }
}
