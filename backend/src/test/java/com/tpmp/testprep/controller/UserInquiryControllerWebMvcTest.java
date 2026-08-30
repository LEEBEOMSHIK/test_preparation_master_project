package com.tpmp.testprep.controller;

import com.tpmp.testprep.config.SecurityConfig;
import com.tpmp.testprep.dto.request.InquiryUpdateRequest;
import com.tpmp.testprep.dto.response.InquiryDetailResponse;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = UserInquiryController.class,
        properties = {
                "app.cors.allowed-origins=http://localhost:3000",
                "app.oauth2.frontend-redirect-uri=http://localhost:3000/auth/oauth/callback"
        })
@Import(SecurityConfig.class)
class UserInquiryControllerWebMvcTest {

    private static final String INQUIRY_PATH = "/api/user/inquiries/41";

    @Autowired
    private MockMvc mockMvc;

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
    void anonymousUser_cannotUpdateInquiry() throws Exception {
        mockMvc.perform(put(INQUIRY_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequestJson()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void authenticatedUser_updatesInquiryWithPrincipalAndRequestValues() throws Exception {
        when(inquiryService.update(eq(41L), any(InquiryUpdateRequest.class), eq("member@tpmp.test")))
                .thenReturn(detailResponse());

        mockMvc.perform(put(INQUIRY_PATH)
                        .with(authenticatedUser())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequestJson()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("OK"))
                .andExpect(jsonPath("$.data.id").value(41))
                .andExpect(jsonPath("$.data.title").value("수정한 문의"));

        ArgumentCaptor<InquiryUpdateRequest> requestCaptor = ArgumentCaptor.forClass(InquiryUpdateRequest.class);
        verify(inquiryService).update(eq(41L), requestCaptor.capture(), eq("member@tpmp.test"));
        InquiryUpdateRequest request = requestCaptor.getValue();
        assertEquals("수정한 문의", request.title());
        assertEquals("수정한 본문", request.content());
        assertEquals("GENERAL_INQUIRY", request.requestType().name());
        assertEquals("frontend", request.targetArea());
        assertEquals("문의 상세", request.detailLocation());
    }

    @Test
    void blankPayload_returnsBadRequest() throws Exception {
        mockMvc.perform(put(INQUIRY_PATH)
                        .with(authenticatedUser())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "",
                                  "content": "",
                                  "requestType": null
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));
    }

    @Test
    void invalidRequestType_returnsBadRequest() throws Exception {
        mockMvc.perform(put(INQUIRY_PATH)
                        .with(authenticatedUser())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "수정한 문의",
                                  "content": "수정한 본문",
                                  "requestType": "UNKNOWN"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));
    }

    private String validRequestJson() {
        return """
                {
                  "title": "수정한 문의",
                  "content": "수정한 본문",
                  "requestType": "GENERAL_INQUIRY",
                  "targetArea": "frontend",
                  "detailLocation": "문의 상세"
                }
                """;
    }

    private RequestPostProcessor authenticatedUser() {
        return authentication(new UsernamePasswordAuthenticationToken("member@tpmp.test", null,
                AuthorityUtils.createAuthorityList("ROLE_USER")));
    }

    private InquiryDetailResponse detailResponse() {
        return new InquiryDetailResponse(41L, "수정한 문의", "수정한 본문", "GENERAL_INQUIRY",
                "frontend", "문의 상세", "PENDING", List.of(), List.of(), LocalDateTime.of(2026, 8, 31, 9, 0),
                7L, "회원");
    }
}
