package com.tpmp.testprep.service;

import com.tpmp.testprep.config.DefaultEmailTemplateCatalog;
import com.tpmp.testprep.dto.request.EmailTemplateCreateRequest;
import com.tpmp.testprep.dto.request.EmailTemplatePreviewRequest;
import com.tpmp.testprep.dto.request.EmailTemplateUpdateRequest;
import com.tpmp.testprep.dto.response.EmailTemplateDetailResponse;
import com.tpmp.testprep.dto.response.EmailTemplatePreviewResponse;
import com.tpmp.testprep.dto.response.EmailTemplateReferenceResponse;
import com.tpmp.testprep.dto.response.EmailTemplateSummaryResponse;
import com.tpmp.testprep.dto.response.EmailTemplateTestSendResponse;
import com.tpmp.testprep.dto.response.EmailTemplateVariableResponse;
import com.tpmp.testprep.entity.EmailTemplate;
import com.tpmp.testprep.entity.EmailTemplateBinding;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.EmailTemplateBindingRepository;
import com.tpmp.testprep.repository.EmailTemplateRepository;
import com.tpmp.testprep.repository.UserRepository;
import com.tpmp.testprep.service.EmailTemplateRenderer.AllowedVariable;
import com.tpmp.testprep.service.EmailTemplateRenderer.PreparedTemplate;
import com.tpmp.testprep.service.EmailTemplateRenderer.RenderedEmail;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class EmailTemplateService {

    private final EmailTemplateRepository templateRepository;
    private final EmailTemplateBindingRepository bindingRepository;
    private final UserRepository userRepository;
    private final EmailTemplateRenderer renderer;
    private final DefaultEmailTemplateCatalog catalog;
    private final EmailTemplateTestMailSender testMailSender;
    private final String publicUrl;

    public EmailTemplateService(EmailTemplateRepository templateRepository,
                                EmailTemplateBindingRepository bindingRepository,
                                UserRepository userRepository,
                                EmailTemplateRenderer renderer,
                                DefaultEmailTemplateCatalog catalog,
                                EmailTemplateTestMailSender testMailSender,
                                @Value("${app.public-url:http://localhost:3000}") String publicUrl) {
        this.templateRepository = templateRepository;
        this.bindingRepository = bindingRepository;
        this.userRepository = userRepository;
        this.renderer = renderer;
        this.catalog = catalog;
        this.testMailSender = testMailSender;
        this.publicUrl = stripTrailingSlash(publicUrl);
    }

    public Page<EmailTemplateSummaryResponse> getAll(String keyword, EmailTemplate.Scope scope,
                                                      Boolean active, Pageable pageable) {
        String normalizedKeyword = keyword == null || keyword.isBlank() ? null : keyword.trim();
        return templateRepository.search(normalizedKeyword, scope, active, pageable)
                .map(this::toSummary);
    }

    public EmailTemplateDetailResponse getOne(Long id) {
        return toDetail(findTemplate(id));
    }

    @Transactional
    public EmailTemplateDetailResponse create(EmailTemplateCreateRequest request, String adminEmail) {
        User admin = findAdmin(adminEmail);
        PreparedTemplate prepared = prepare(request.scope(), request.subjectTemplate(), request.htmlBody());
        EmailTemplate template = templateRepository.save(EmailTemplate.create(
                request.name(),
                request.scope(),
                prepared.subjectTemplate(),
                prepared.sanitizedHtmlBody(),
                prepared.textBody(),
                request.active(),
                null,
                admin));
        return toDetail(template);
    }

    @Transactional
    public EmailTemplateDetailResponse update(Long id, EmailTemplateUpdateRequest request, String adminEmail) {
        EmailTemplate template = findTemplateForUpdate(id);
        PreparedTemplate prepared = prepare(
                template.getScope(), request.subjectTemplate(), request.htmlBody());
        template.update(
                request.name(),
                prepared.subjectTemplate(),
                prepared.sanitizedHtmlBody(),
                prepared.textBody(),
                request.active(),
                findAdmin(adminEmail));
        return toDetail(template);
    }

    @Transactional
    public EmailTemplateDetailResponse cloneTemplate(Long id, String adminEmail) {
        EmailTemplate source = findTemplate(id);
        EmailTemplate clone = templateRepository.save(
                source.duplicate(source.getName() + " 복사본", findAdmin(adminEmail)));
        return toDetail(clone);
    }

    @Transactional
    public EmailTemplateDetailResponse resetDefault(Long id, String adminEmail) {
        EmailTemplate template = findTemplateForUpdate(id);
        DefaultEmailTemplateCatalog.Definition definition = catalog.definitions().stream()
                .filter(candidate -> candidate.systemKey().equals(template.getSystemKey()))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));
        PreparedTemplate prepared = prepare(
                template.getScope(), definition.subjectTemplate(), definition.htmlBody());
        template.reset(
                definition.name(),
                prepared.subjectTemplate(),
                prepared.sanitizedHtmlBody(),
                prepared.textBody(),
                findAdmin(adminEmail));
        return toDetail(template);
    }

    @Transactional
    public void delete(Long id, String adminEmail) {
        EmailTemplate template = findTemplateForUpdate(id);
        List<EmailTemplateReferenceResponse> references = findReferences(id);
        if (!references.isEmpty()) {
            throw new BusinessException(ErrorCode.EMAIL_TEMPLATE_IN_USE, references);
        }
        template.softDelete(findAdmin(adminEmail));
    }

    public EmailTemplatePreviewResponse preview(EmailTemplatePreviewRequest request) {
        PreparedTemplate prepared = prepare(request.scope(), request.subjectTemplate(), request.htmlBody());
        RenderedEmail rendered = render(
                request.scope(), prepared.subjectTemplate(), prepared.sanitizedHtmlBody(), sampleVariables());
        return new EmailTemplatePreviewResponse(
                prepared.sanitizedHtmlBody(),
                rendered.subject(),
                rendered.htmlBody(),
                rendered.textBody(),
                !request.htmlBody().equals(prepared.sanitizedHtmlBody()));
    }

    public EmailTemplateTestSendResponse testSend(Long id, String adminEmail) {
        return testMailSender.send(findTemplate(id), adminEmail);
    }

    private EmailTemplate findTemplate(Long id) {
        return templateRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMAIL_TEMPLATE_NOT_FOUND));
    }

    private EmailTemplate findTemplateForUpdate(Long id) {
        return templateRepository.findActiveForUpdate(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMAIL_TEMPLATE_NOT_FOUND));
    }

    private User findAdmin(String email) {
        return userRepository.findByEmail(email)
                .filter(user -> user.getRole() == User.Role.ADMIN)
                .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN));
    }

    private PreparedTemplate prepare(EmailTemplate.Scope scope, String subject, String htmlBody) {
        try {
            return renderer.prepare(scope, subject, htmlBody);
        } catch (EmailTemplateRenderingException exception) {
            throw renderingBusinessException(exception);
        }
    }

    private RenderedEmail render(EmailTemplate.Scope scope, String subject, String htmlBody,
                                 Map<String, String> variables) {
        try {
            return renderer.render(scope, subject, htmlBody, variables);
        } catch (EmailTemplateRenderingException exception) {
            throw renderingBusinessException(exception);
        }
    }

    private BusinessException renderingBusinessException(EmailTemplateRenderingException exception) {
        ErrorCode errorCode = exception.getReason() == EmailTemplateRenderingException.Reason.INVALID_VARIABLE
                ? ErrorCode.EMAIL_TEMPLATE_INVALID_VARIABLE
                : ErrorCode.EMAIL_TEMPLATE_INVALID_CONTENT;
        return new BusinessException(errorCode);
    }

    private EmailTemplateSummaryResponse toSummary(EmailTemplate template) {
        List<EmailTemplateReferenceResponse> references = findReferences(template.getId());
        return new EmailTemplateSummaryResponse(
                template.getId(),
                template.getName(),
                template.getScope(),
                template.isActive(),
                template.getSystemKey() != null,
                references.size(),
                references,
                references.isEmpty(),
                template.getUpdatedAt());
    }

    private EmailTemplateDetailResponse toDetail(EmailTemplate template) {
        List<EmailTemplateReferenceResponse> references = findReferences(template.getId());
        return new EmailTemplateDetailResponse(
                template.getId(),
                template.getName(),
                template.getScope(),
                template.getSubjectTemplate(),
                template.getHtmlBody(),
                template.getTextBody(),
                template.isActive(),
                template.getSystemKey() != null,
                references.size(),
                references,
                references.isEmpty(),
                renderer.getAllowedVariables(template.getScope()).stream()
                        .map(this::toVariable)
                        .toList(),
                template.getCreatedAt(),
                template.getUpdatedAt());
    }

    private List<EmailTemplateReferenceResponse> findReferences(Long templateId) {
        return bindingRepository.findAllByTemplateId(templateId).stream()
                .map(EmailTemplateBinding::getEventCode)
                .sorted(Comparator.comparing(Enum::name))
                .map(event -> new EmailTemplateReferenceResponse(event, event.getLabel()))
                .toList();
    }

    private EmailTemplateVariableResponse toVariable(AllowedVariable variable) {
        return new EmailTemplateVariableResponse(
                variable.token(), variable.name(), variable.label(), variable.description());
    }

    private Map<String, String> sampleVariables() {
        Map<String, String> variables = new LinkedHashMap<>();
        variables.put("recipientName", "홍길동");
        variables.put("inquiryId", "1001");
        variables.put("inquiryTitle", "샘플 문의 제목");
        variables.put("inquiryType", "일반 문의");
        variables.put("statusLabel", "처리 완료");
        variables.put("inquiryDetailUrl", publicUrl + "/user/inquiries/1001");
        variables.put("serviceName", "TPMP");
        return variables;
    }

    private static String stripTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
