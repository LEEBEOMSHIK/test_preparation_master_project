package com.tpmp.testprep.service;

import com.tpmp.testprep.entity.EmailTemplate;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EmailTemplateRendererTest {

    private final EmailTemplateRenderer renderer = new EmailTemplateRenderer("https://tpmp.example");

    @Test
    void prepareRejectsUnknownVariableAndHeaderNewline() {
        assertThatThrownBy(() -> renderer.prepare(EmailTemplate.Scope.INQUIRY_STATUS,
                "제목 {{unknown}}", "<p>본문</p>"))
                .isInstanceOf(EmailTemplateRenderingException.class)
                .extracting("reason").isEqualTo(EmailTemplateRenderingException.Reason.INVALID_VARIABLE);
        assertThatThrownBy(() -> renderer.prepare(EmailTemplate.Scope.INQUIRY_STATUS,
                "제목\r\nBcc: attacker@example.com", "<p>본문</p>"))
                .isInstanceOf(EmailTemplateRenderingException.class);
    }

    @Test
    void prepareRemovesExecutableContentAndBuildsTextFallback() {
        var prepared = renderer.prepare(EmailTemplate.Scope.INQUIRY_STATUS, "제목",
                "<p onclick=\"alert(1)\">안내</p><script>alert(1)</script><img src=\"https://evil/x\">");

        assertThat(prepared.sanitizedHtmlBody()).isEqualTo("<p>안내</p>");
        assertThat(prepared.textBody()).isEqualTo("안내");
    }

    @Test
    void renderEscapesVariablesAndAllowsOnlyServerDetailUrl() {
        Map<String, String> values = validValues();
        values.put("recipientName", "<Admin>");
        values.put("inquiryTitle", "<b>제목</b>");

        var rendered = renderer.render(EmailTemplate.Scope.INQUIRY_STATUS,
                "{{inquiryTitle}}", "<p>{{recipientName}}</p><a href=\"{{inquiryDetailUrl}}\">보기</a>", values);

        assertThat(rendered.subject()).isEqualTo("<b>제목</b>");
        assertThat(rendered.htmlBody()).contains("&lt;Admin&gt;").doesNotContain("<Admin>");
        assertThat(rendered.htmlBody()).contains("https://tpmp.example/user/inquiries/7");
        assertThat(rendered.textBody()).isEqualTo("<Admin> 보기");
    }

    @Test
    void getAllowedVariablesReturnsTheSevenInquiryVariablesInDesignOrder() {
        assertThat(renderer.getAllowedVariables(EmailTemplate.Scope.INQUIRY_STATUS))
                .extracting(EmailTemplateRenderer.AllowedVariable::name)
                .containsExactly("recipientName", "inquiryId", "inquiryTitle", "inquiryType",
                        "statusLabel", "inquiryDetailUrl", "serviceName");
        assertThat(renderer.getAllowedVariables(EmailTemplate.Scope.INQUIRY_STATUS))
                .extracting(EmailTemplateRenderer.AllowedVariable::token)
                .containsExactly("{{recipientName}}", "{{inquiryId}}", "{{inquiryTitle}}", "{{inquiryType}}",
                        "{{statusLabel}}", "{{inquiryDetailUrl}}", "{{serviceName}}");
    }

    @Test
    void prepareRejectsBlankAndOversizedContent() {
        assertInvalidContent(() -> renderer.prepare(EmailTemplate.Scope.INQUIRY_STATUS, " ", "<p>본문</p>"));
        assertInvalidContent(() -> renderer.prepare(EmailTemplate.Scope.INQUIRY_STATUS, "제목", " "));
        assertInvalidContent(() -> renderer.prepare(EmailTemplate.Scope.INQUIRY_STATUS, "가".repeat(201), "<p>본문</p>"));
        assertInvalidContent(() -> renderer.prepare(EmailTemplate.Scope.INQUIRY_STATUS, "제목", "가".repeat(100_001)));
    }

    @Test
    void preparePreservesTextTokensButAllowsOnlyDetailUrlInHref() {
        var prepared = renderer.prepare(EmailTemplate.Scope.INQUIRY_STATUS,
                "{{serviceName}} 안내", "<p>{{recipientName}}</p><a href=\"{{inquiryDetailUrl}}\">보기</a>");

        assertThat(prepared.sanitizedHtmlBody())
                .isEqualTo("<p>{{recipientName}}</p><a href=\"{{inquiryDetailUrl}}\">보기</a>");
        assertThatThrownBy(() -> renderer.prepare(EmailTemplate.Scope.INQUIRY_STATUS, "제목",
                "<a href=\"{{recipientName}}\">보기</a>"))
                .isInstanceOf(EmailTemplateRenderingException.class)
                .extracting("reason").isEqualTo(EmailTemplateRenderingException.Reason.INVALID_VARIABLE);
        assertThatThrownBy(() -> renderer.prepare(EmailTemplate.Scope.INQUIRY_STATUS, "제목",
                "<p title=\"{{recipientName}}\">본문</p>"))
                .isInstanceOf(EmailTemplateRenderingException.class)
                .extracting("reason").isEqualTo(EmailTemplateRenderingException.Reason.INVALID_VARIABLE);
    }

    @Test
    void prepareRejectsTemplateExpressionsOutsideTheFixedTokenGrammar() {
        assertThatThrownBy(() -> renderer.prepare(EmailTemplate.Scope.INQUIRY_STATUS,
                "제목 {{recipient_name}}", "<p>본문</p>"))
                .isInstanceOf(EmailTemplateRenderingException.class)
                .extracting("reason").isEqualTo(EmailTemplateRenderingException.Reason.INVALID_VARIABLE);
        assertInvalidVariable(() -> renderer.prepare(EmailTemplate.Scope.INQUIRY_STATUS,
                "제목", "<p>&#123;&#123;unknown&#125;&#125;</p>"));
    }

    @Test
    void prepareRejectsAnEncodedCollisionWithTheReservedLinkPlaceholder() {
        assertInvalidContent(() -> renderer.prepare(EmailTemplate.Scope.INQUIRY_STATUS, "제목",
                "<p>https&#58;//tpmp.invalid/TPMP_LINK_TOKEN</p>"
                        + "<a href=\"{{inquiryDetailUrl}}\">보기</a>"));
    }

    @Test
    void renderRequiresAllSevenValuesAndRejectsUnsafeDetailUrls() {
        Map<String, String> missingValue = validValues();
        missingValue.remove("statusLabel");
        assertInvalidVariable(() -> renderer.render(EmailTemplate.Scope.INQUIRY_STATUS,
                "제목", "<p>{{statusLabel}}</p>", missingValue));

        Map<String, String> externalHost = validValues();
        externalHost.put("inquiryDetailUrl", "https://evil.example/user/inquiries/7");
        assertInvalidVariable(() -> renderer.render(EmailTemplate.Scope.INQUIRY_STATUS,
                "제목", "<a href=\"{{inquiryDetailUrl}}\">보기</a>", externalHost));

        Map<String, String> executableProtocol = validValues();
        executableProtocol.put("inquiryDetailUrl", "javascript:alert(1)");
        assertInvalidVariable(() -> renderer.render(EmailTemplate.Scope.INQUIRY_STATUS,
                "제목", "<a href=\"{{inquiryDetailUrl}}\">보기</a>", executableProtocol));
    }

    @Test
    void renderRejectsHeaderNewlineIntroducedByAValueAndSanitizesAgain() {
        Map<String, String> values = validValues();
        values.put("inquiryTitle", "정상\nBcc: attacker@example.com");
        assertInvalidContent(() -> renderer.render(EmailTemplate.Scope.INQUIRY_STATUS,
                "{{inquiryTitle}}", "<p>본문</p>", values));

        values.put("inquiryTitle", "정상");
        var rendered = renderer.render(EmailTemplate.Scope.INQUIRY_STATUS,
                "제목", "<p onclick=\"alert(1)\">본문</p><script>alert(1)</script>", values);
        assertThat(rendered.htmlBody()).isEqualTo("<p>본문</p>");
    }

    private Map<String, String> validValues() {
        return new HashMap<>(Map.of(
                "recipientName", "관리자",
                "inquiryId", "7",
                "inquiryTitle", "제목",
                "inquiryType", "버그 신고",
                "statusLabel", "처리 완료",
                "inquiryDetailUrl", "https://tpmp.example/user/inquiries/7",
                "serviceName", "TPMP"));
    }

    private void assertInvalidContent(Runnable invocation) {
        assertThatThrownBy(invocation::run)
                .isInstanceOf(EmailTemplateRenderingException.class)
                .extracting("reason").isEqualTo(EmailTemplateRenderingException.Reason.INVALID_CONTENT);
    }

    private void assertInvalidVariable(Runnable invocation) {
        assertThatThrownBy(invocation::run)
                .isInstanceOf(EmailTemplateRenderingException.class)
                .extracting("reason").isEqualTo(EmailTemplateRenderingException.Reason.INVALID_VARIABLE);
    }
}
