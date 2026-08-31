package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.response.EmailTemplateTestSendResponse;
import com.tpmp.testprep.entity.EmailTemplate;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.UserRepository;
import com.tpmp.testprep.service.EmailTemplateRenderer.RenderedEmail;
import jakarta.mail.BodyPart;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailTemplateTestMailSenderTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailTemplateRenderer renderer;

    @Mock
    private JavaMailSender mailSender;

    private EmailTemplateTestMailSender sender;

    @BeforeEach
    void setUp() {
        sender = new EmailTemplateTestMailSender(
                userRepository,
                renderer,
                mailSender,
                "noreply@tpmp.com",
                "http://localhost:3000");
    }

    @Test
    void recipientComesFromAuthenticatedAdminAndMimeBodyIsRendered() throws Exception {
        MimeMessage mimeMessage = new MimeMessage((Session) null);
        when(userRepository.findByEmail("admin@tpmp.com")).thenReturn(Optional.of(admin()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(renderer.render(eq(EmailTemplate.Scope.INQUIRY_STATUS), eq("저장 제목"),
                eq("<p>저장 본문</p>"), anyMap()))
                .thenReturn(new RenderedEmail("렌더 제목", "<p>렌더 HTML</p>", "렌더 평문"));

        EmailTemplateTestSendResponse result = sender.send(template(true), "admin@tpmp.com");

        verify(mailSender).send(mimeMessage);
        assertThat(mimeMessage.getAllRecipients()).extracting(Object::toString)
                .containsExactly("admin@tpmp.com");
        assertThat(mimeMessage.getSubject()).isEqualTo("렌더 제목");
        assertThat(textParts(mimeMessage)).contains("렌더 평문", "<p>렌더 HTML</p>");
        assertThat(result.recipientMasked()).isEqualTo("a***@tpmp.com");
    }

    @Test
    void inactiveTemplateCanBeTestedByCurrentAdmin() {
        when(userRepository.findByEmail("admin@tpmp.com")).thenReturn(Optional.of(admin()));
        when(mailSender.createMimeMessage()).thenReturn(new MimeMessage((Session) null));
        when(renderer.render(any(), any(), any(), anyMap()))
                .thenReturn(new RenderedEmail("제목", "<p>본문</p>", "본문"));

        assertThatCode(() -> sender.send(template(false), "admin@tpmp.com"))
                .doesNotThrowAnyException();
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void smtpFailureMapsToBadGatewayBusinessError() {
        MimeMessage mimeMessage = new MimeMessage((Session) null);
        when(userRepository.findByEmail("admin@tpmp.com")).thenReturn(Optional.of(admin()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(renderer.render(any(), any(), any(), anyMap()))
                .thenReturn(new RenderedEmail("제목", "<p>본문</p>", "본문"));
        doThrow(new MailSendException("SMTP credentials must not escape"))
                .when(mailSender).send(mimeMessage);

        assertThatThrownBy(() -> sender.send(template(true), "admin@tpmp.com"))
                .isInstanceOfSatisfying(BusinessException.class,
                        exception -> assertThat(exception.getErrorCode())
                                .isEqualTo(ErrorCode.EMAIL_TEMPLATE_TEST_SEND_FAILED));
    }

    @Test
    void nonAdminDatabaseUserCannotReceiveTestMail() {
        User user = User.builder()
                .email("admin@tpmp.com")
                .password("encoded")
                .name("일반 사용자")
                .role(User.Role.USER)
                .build();
        when(userRepository.findByEmail("admin@tpmp.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> sender.send(template(true), "admin@tpmp.com"))
                .isInstanceOfSatisfying(BusinessException.class,
                        exception -> assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.FORBIDDEN));
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    private List<String> textParts(Part part) throws Exception {
        List<String> values = new ArrayList<>();
        Object content = part.getContent();
        if (content instanceof Multipart multipart) {
            for (int index = 0; index < multipart.getCount(); index++) {
                BodyPart bodyPart = multipart.getBodyPart(index);
                values.addAll(textParts(bodyPart));
            }
        } else if (part.isMimeType("text/*")) {
            values.add(content.toString());
        }
        return values;
    }

    private EmailTemplate template(boolean active) {
        EmailTemplate template = EmailTemplate.create(
                "테스트 템플릿",
                EmailTemplate.Scope.INQUIRY_STATUS,
                "저장 제목",
                "<p>저장 본문</p>",
                "저장 본문",
                active,
                null,
                admin());
        ReflectionTestUtils.setField(template, "id", 11L);
        return template;
    }

    private User admin() {
        User admin = User.builder()
                .email("admin@tpmp.com")
                .password("encoded")
                .name("관리자")
                .role(User.Role.ADMIN)
                .build();
        ReflectionTestUtils.setField(admin, "id", 7L);
        return admin;
    }
}
