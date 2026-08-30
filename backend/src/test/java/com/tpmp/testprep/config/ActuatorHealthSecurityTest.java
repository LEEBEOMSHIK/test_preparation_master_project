package com.tpmp.testprep.config;

import com.tpmp.testprep.security.jwt.JwtTokenProvider;
import com.tpmp.testprep.security.oauth2.CustomOAuth2UserService;
import com.tpmp.testprep.security.oauth2.OAuth2AuthenticationSuccessHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(
        classes = ActuatorHealthSecurityTest.TestApplication.class,
        properties = {
                "app.cors.allowed-origins=http://localhost:3000",
                "app.oauth2.frontend-redirect-uri=http://localhost:3000/auth/oauth/callback",
                "spring.datasource.url=jdbc:h2:mem:actuator-health;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
                "spring.datasource.driver-class-name=org.h2.Driver",
                "spring.jpa.hibernate.ddl-auto=none"
        }
)
@AutoConfigureMockMvc
class ActuatorHealthSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomOAuth2UserService customOAuth2UserService;

    @MockBean
    private OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    @MockBean
    private ClientRegistrationRepository clientRegistrationRepository;

    @Test
    void anonymousRequestCanReadHealthStatus() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void legacyApiPrefixedPathIsNotPublic() throws Exception {
        mockMvc.perform(get("/api/actuator/health"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void actuatorRootIsNotPublic() throws Exception {
        mockMvc.perform(get("/actuator"))
                .andExpect(status().isUnauthorized());
    }

    @SpringBootConfiguration
    @EnableAutoConfiguration
    @Import(SecurityConfig.class)
    static class TestApplication {
    }
}
