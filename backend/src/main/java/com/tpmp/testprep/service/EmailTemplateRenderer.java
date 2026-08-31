package com.tpmp.testprep.service;

import com.tpmp.testprep.entity.EmailTemplate;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Attribute;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.TextNode;
import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public final class EmailTemplateRenderer {

    private static final int MAX_SUBJECT_LENGTH = 200;
    private static final int MAX_HTML_LENGTH = 100_000;
    private static final String DETAIL_URL_NAME = "inquiryDetailUrl";
    private static final String DETAIL_URL_TOKEN = "{{inquiryDetailUrl}}";
    private static final String LINK_PLACEHOLDER = "https://tpmp.invalid/TPMP_LINK_TOKEN";
    private static final Pattern TOKEN_PATTERN = Pattern.compile("\\{\\{([A-Za-z][A-Za-z0-9]*)}}");
    private static final Pattern TOKEN_CANDIDATE_PATTERN = Pattern.compile("\\{\\{[^{}]*}}", Pattern.DOTALL);
    private static final List<AllowedVariable> INQUIRY_STATUS_VARIABLES = List.of(
            new AllowedVariable("{{recipientName}}", "recipientName", "문의자 이름", "문의자 표시 이름"),
            new AllowedVariable("{{inquiryId}}", "inquiryId", "문의 번호", "문의 식별자"),
            new AllowedVariable("{{inquiryTitle}}", "inquiryTitle", "문의 제목", "문의 제목"),
            new AllowedVariable("{{inquiryType}}", "inquiryType", "접수 유형", "접수 유형 표시명"),
            new AllowedVariable("{{statusLabel}}", "statusLabel", "처리 상태", "변경 상태 표시명"),
            new AllowedVariable(DETAIL_URL_TOKEN, DETAIL_URL_NAME, "문의 상세 URL", "사용자 문의 상세 URL"),
            new AllowedVariable("{{serviceName}}", "serviceName", "서비스 이름", "서비스 이름 TPMP")
    );
    private static final Set<String> INQUIRY_STATUS_VARIABLE_NAMES = Set.of(
            "recipientName", "inquiryId", "inquiryTitle", "inquiryType",
            "statusLabel", DETAIL_URL_NAME, "serviceName"
    );
    private static final PolicyFactory HTML_POLICY = new HtmlPolicyBuilder()
            .allowElements("p", "br", "h1", "h2", "h3", "strong", "b", "em", "i", "u", "s",
                    "blockquote", "ul", "ol", "li", "table", "thead", "tbody", "tr", "th", "td", "a")
            .allowAttributes("href")
            .matching((elementName, attributeName, value) -> hasHttpProtocol(value) ? value : null)
            .onElements("a")
            .allowAttributes("title").onElements("a")
            .allowUrlProtocols("http", "https")
            .toFactory();

    private final String publicHost;

    public EmailTemplateRenderer(@Value("${app.public-url:http://localhost:3000}") String publicUrl) {
        this.publicHost = parsePublicHost(publicUrl);
    }

    public PreparedTemplate prepare(EmailTemplate.Scope scope, String subjectTemplate, String htmlBody) {
        validateTemplateContent(subjectTemplate, htmlBody);
        validateTokens(scope, subjectTemplate);
        validateTokens(scope, htmlBody);

        ProtectedHtml protectedHtml = protectHtmlTokens(htmlBody);
        String sanitized = HTML_POLICY.sanitize(protectedHtml.html());
        String restored = restoreTokens(sanitized, protectedHtml.tokens());
        validateTokens(scope, restored);
        return new PreparedTemplate(subjectTemplate, restored, toText(restored));
    }

    public RenderedEmail render(EmailTemplate.Scope scope, String subjectTemplate,
                                String sanitizedHtmlBody, Map<String, String> variables) {
        PreparedTemplate prepared = prepare(scope, subjectTemplate, sanitizedHtmlBody);
        validateVariableValues(scope, variables);

        String subject = replaceTokens(prepared.subjectTemplate(), variables, false);
        validateRenderedSubject(subject);
        String renderedHtml = replaceTokens(prepared.sanitizedHtmlBody(), variables, true);
        String finalHtml = HTML_POLICY.sanitize(renderedHtml);
        return new RenderedEmail(subject, finalHtml, toText(finalHtml));
    }

    public List<AllowedVariable> getAllowedVariables(EmailTemplate.Scope scope) {
        requireInquiryStatusScope(scope);
        return INQUIRY_STATUS_VARIABLES;
    }

    private void validateTemplateContent(String subjectTemplate, String htmlBody) {
        if (subjectTemplate == null || subjectTemplate.isBlank()
                || htmlBody == null || htmlBody.isBlank()
                || subjectTemplate.length() > MAX_SUBJECT_LENGTH
                || htmlBody.length() > MAX_HTML_LENGTH
                || containsHeaderNewline(subjectTemplate)) {
            throw invalidContent("이메일 템플릿 내용이 올바르지 않습니다.");
        }
    }

    private void validateRenderedSubject(String subject) {
        if (subject.isBlank() || subject.length() > MAX_SUBJECT_LENGTH || containsHeaderNewline(subject)) {
            throw invalidContent("이메일 제목이 올바르지 않습니다.");
        }
    }

    private void validateTokens(EmailTemplate.Scope scope, String template) {
        Set<String> allowedNames = allowedVariableNames(scope);
        Matcher candidateMatcher = TOKEN_CANDIDATE_PATTERN.matcher(template);
        StringBuilder withoutCandidates = new StringBuilder();
        while (candidateMatcher.find()) {
            String candidate = candidateMatcher.group();
            Matcher tokenMatcher = TOKEN_PATTERN.matcher(candidate);
            if (!tokenMatcher.matches() || !allowedNames.contains(tokenMatcher.group(1))) {
                throw invalidVariable("허용되지 않은 이메일 템플릿 변수가 포함되어 있습니다.");
            }
            candidateMatcher.appendReplacement(withoutCandidates, "");
        }
        candidateMatcher.appendTail(withoutCandidates);
        if (withoutCandidates.indexOf("{{") >= 0 || withoutCandidates.indexOf("}}") >= 0) {
            throw invalidVariable("올바르지 않은 이메일 템플릿 변수 형식입니다.");
        }
    }

    private ProtectedHtml protectHtmlTokens(String htmlBody) {
        if (htmlBody.contains(LINK_PLACEHOLDER)) {
            throw invalidContent("이메일 HTML에 예약된 값이 포함되어 있습니다.");
        }

        Document document = Jsoup.parseBodyFragment(htmlBody);
        document.outputSettings().prettyPrint(false);
        String parsedHtml = document.body().html();
        if (parsedHtml.contains(LINK_PLACEHOLDER)) {
            throw invalidContent("이메일 HTML에 예약된 값이 포함되어 있습니다.");
        }
        Map<String, String> protectedTokens = new LinkedHashMap<>();
        int tokenIndex = 0;

        for (Element element : document.body().getAllElements()) {
            for (Attribute attribute : new ArrayList<>(element.attributes().asList())) {
                if (!containsTemplateToken(attribute.getValue())) {
                    continue;
                }
                if (!"a".equals(element.normalName())
                        || !"href".equalsIgnoreCase(attribute.getKey())
                        || !DETAIL_URL_TOKEN.equals(attribute.getValue())) {
                    throw invalidVariable("HTML 속성에는 문의 상세 URL 변수만 사용할 수 있습니다.");
                }
                element.attr(attribute.getKey(), LINK_PLACEHOLDER);
            }

            for (TextNode textNode : element.textNodes()) {
                ProtectedText protectedText = protectTextTokens(textNode.getWholeText(), parsedHtml,
                        protectedTokens, tokenIndex);
                textNode.text(protectedText.text());
                tokenIndex = protectedText.nextIndex();
            }
        }

        String protectedBody = document.body().html();
        protectedTokens.put(LINK_PLACEHOLDER, DETAIL_URL_TOKEN);
        return new ProtectedHtml(protectedBody, protectedTokens);
    }

    private ProtectedText protectTextTokens(String text, String originalHtml,
                                             Map<String, String> protectedTokens, int startIndex) {
        Matcher matcher = TOKEN_PATTERN.matcher(text);
        StringBuffer protectedText = new StringBuffer();
        int tokenIndex = startIndex;
        while (matcher.find()) {
            String placeholder;
            do {
                placeholder = "TPMP_TOKEN_" + tokenIndex++;
            } while (originalHtml.contains(placeholder) || protectedTokens.containsKey(placeholder));
            protectedTokens.put(placeholder, matcher.group());
            matcher.appendReplacement(protectedText, Matcher.quoteReplacement(placeholder));
        }
        matcher.appendTail(protectedText);
        return new ProtectedText(protectedText.toString(), tokenIndex);
    }

    private String restoreTokens(String html, Map<String, String> protectedTokens) {
        String restored = html;
        for (Map.Entry<String, String> token : protectedTokens.entrySet()) {
            restored = restored.replace(token.getKey(), token.getValue());
        }
        return restored;
    }

    private void validateVariableValues(EmailTemplate.Scope scope, Map<String, String> variables) {
        if (variables == null) {
            throw invalidVariable("이메일 템플릿 변수 값이 누락되었습니다.");
        }
        for (String variableName : allowedVariableNames(scope)) {
            if (!variables.containsKey(variableName) || variables.get(variableName) == null) {
                throw invalidVariable("이메일 템플릿 변수 값이 누락되었습니다.");
            }
        }
        validateDetailUrl(variables.get(DETAIL_URL_NAME));
    }

    private void validateDetailUrl(String detailUrl) {
        try {
            URI uri = new URI(detailUrl);
            if (!hasHttpProtocol(detailUrl) || uri.getHost() == null
                    || !publicHost.equals(uri.getHost().toLowerCase(Locale.ROOT))) {
                throw invalidVariable("문의 상세 URL이 올바르지 않습니다.");
            }
        } catch (URISyntaxException exception) {
            throw invalidVariable("문의 상세 URL이 올바르지 않습니다.");
        }
    }

    private String replaceTokens(String template, Map<String, String> variables, boolean escapeHtml) {
        Matcher matcher = TOKEN_PATTERN.matcher(template);
        StringBuffer rendered = new StringBuffer();
        while (matcher.find()) {
            String value = variables.get(matcher.group(1));
            String replacement = escapeHtml ? HtmlUtils.htmlEscape(value, "UTF-8") : value;
            matcher.appendReplacement(rendered, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(rendered);
        return rendered.toString();
    }

    private Set<String> allowedVariableNames(EmailTemplate.Scope scope) {
        requireInquiryStatusScope(scope);
        return INQUIRY_STATUS_VARIABLE_NAMES;
    }

    private void requireInquiryStatusScope(EmailTemplate.Scope scope) {
        if (scope != EmailTemplate.Scope.INQUIRY_STATUS) {
            throw invalidVariable("지원하지 않는 이메일 템플릿 범위입니다.");
        }
    }

    private static boolean hasHttpProtocol(String value) {
        try {
            String scheme = new URI(value).getScheme();
            return scheme != null && ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme));
        } catch (URISyntaxException exception) {
            return false;
        }
    }

    private static String parsePublicHost(String publicUrl) {
        try {
            URI uri = new URI(publicUrl);
            if (!hasHttpProtocol(publicUrl) || uri.getHost() == null) {
                throw new IllegalArgumentException("app.public-url must be an absolute HTTP(S) URL");
            }
            return uri.getHost().toLowerCase(Locale.ROOT);
        } catch (URISyntaxException exception) {
            throw new IllegalArgumentException("app.public-url must be an absolute HTTP(S) URL", exception);
        }
    }

    private static boolean containsHeaderNewline(String value) {
        return value.indexOf('\r') >= 0 || value.indexOf('\n') >= 0;
    }

    private static boolean containsTemplateToken(String value) {
        return value.contains("{{") || value.contains("}}");
    }

    private static String toText(String html) {
        return Jsoup.parse(html).text();
    }

    private static EmailTemplateRenderingException invalidVariable(String safeMessage) {
        return new EmailTemplateRenderingException(
                EmailTemplateRenderingException.Reason.INVALID_VARIABLE, safeMessage);
    }

    private static EmailTemplateRenderingException invalidContent(String safeMessage) {
        return new EmailTemplateRenderingException(
                EmailTemplateRenderingException.Reason.INVALID_CONTENT, safeMessage);
    }

    public record PreparedTemplate(String subjectTemplate, String sanitizedHtmlBody, String textBody) {
    }

    public record RenderedEmail(String subject, String htmlBody, String textBody) {
    }

    public record AllowedVariable(String token, String name, String label, String description) {
    }

    private record ProtectedHtml(String html, Map<String, String> tokens) {
    }

    private record ProtectedText(String text, int nextIndex) {
    }
}
