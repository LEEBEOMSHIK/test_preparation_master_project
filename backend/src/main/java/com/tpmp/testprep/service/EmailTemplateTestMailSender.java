package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.response.EmailTemplateTestSendResponse;
import com.tpmp.testprep.entity.EmailTemplate;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.UserRepository;
import com.tpmp.testprep.service.EmailTemplateRenderer.RenderedEmail;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
public class EmailTemplateTestMailSender {

    private final UserRepository userRepository;
    private final EmailTemplateRenderer renderer;
    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String publicUrl;

    public EmailTemplateTestMailSender(UserRepository userRepository,
                                       EmailTemplateRenderer renderer,
                                       JavaMailSender mailSender,
                                       @Value("${app.mail.from-address:}") String fromAddress,
                                       @Value("${app.public-url:http://localhost:3000}") String publicUrl) {
        this.userRepository = userRepository;
        this.renderer = renderer;
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.publicUrl = stripTrailingSlash(publicUrl);
    }

    public EmailTemplateTestSendResponse send(EmailTemplate template, String adminEmail) {
        User admin = findAdmin(adminEmail);
        String recipientMasked = maskEmail(admin.getEmail());
        RenderedEmail rendered = render(template, sampleVariables(admin));

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(admin.getEmail());
            helper.setSubject(rendered.subject());
            helper.setText(rendered.textBody(), rendered.htmlBody());
            if (fromAddress != null && !fromAddress.isBlank()) {
                helper.setFrom(fromAddress);
            }
            mailSender.send(message);
            LocalDateTime sentAt = LocalDateTime.now();
            log.info("Email template test send: adminId={}, templateId={}, recipient={}, success={}",
                    admin.getId(), template.getId(), recipientMasked, true);
            return new EmailTemplateTestSendResponse(recipientMasked, sentAt);
        } catch (MessagingException | MailException exception) {
            log.warn("Email template test send: adminId={}, templateId={}, recipient={}, success={}",
                    admin.getId(), template.getId(), recipientMasked, false);
            throw new BusinessException(ErrorCode.EMAIL_TEMPLATE_TEST_SEND_FAILED);
        }
    }

    private User findAdmin(String email) {
        return userRepository.findByEmail(email)
                .filter(user -> user.getRole() == User.Role.ADMIN)
                .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN));
    }

    private RenderedEmail render(EmailTemplate template, Map<String, String> variables) {
        try {
            return renderer.render(
                    template.getScope(),
                    template.getSubjectTemplate(),
                    template.getHtmlBody(),
                    variables);
        } catch (EmailTemplateRenderingException exception) {
            ErrorCode errorCode = exception.getReason()
                    == EmailTemplateRenderingException.Reason.INVALID_VARIABLE
                    ? ErrorCode.EMAIL_TEMPLATE_INVALID_VARIABLE
                    : ErrorCode.EMAIL_TEMPLATE_INVALID_CONTENT;
            throw new BusinessException(errorCode);
        }
    }

    private Map<String, String> sampleVariables(User admin) {
        Map<String, String> variables = new LinkedHashMap<>();
        variables.put("recipientName", admin.getName());
        variables.put("inquiryId", "1001");
        variables.put("inquiryTitle", "테스트 문의 제목");
        variables.put("inquiryType", "일반 문의");
        variables.put("statusLabel", "처리 완료");
        variables.put("inquiryDetailUrl", publicUrl + "/user/inquiries/1001");
        variables.put("serviceName", "TPMP");
        return variables;
    }

    private static String maskEmail(String email) {
        int atIndex = email.indexOf('@');
        if (atIndex <= 0) {
            return "***";
        }
        return email.substring(0, 1) + "***" + email.substring(atIndex);
    }

    private static String stripTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
