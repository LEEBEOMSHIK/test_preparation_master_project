package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.response.EmailTemplateBindingResponse;
import com.tpmp.testprep.entity.EmailTemplate;
import com.tpmp.testprep.entity.EmailTemplateBinding;
import com.tpmp.testprep.entity.EmailTemplateEvent;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.EmailTemplateBindingRepository;
import com.tpmp.testprep.repository.EmailTemplateRepository;
import com.tpmp.testprep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmailTemplateBindingService {

    private static final String NOT_CONFIGURED_REASON = "템플릿 미설정";
    private static final String INACTIVE_REASON = "연결된 이메일 템플릿이 비활성 상태입니다.";

    private final EmailTemplateRepository templateRepository;
    private final EmailTemplateBindingRepository bindingRepository;
    private final UserRepository userRepository;

    public List<EmailTemplateBindingResponse> getAllBindings() {
        Map<EmailTemplateEvent, EmailTemplateBinding> bindings = new EnumMap<>(EmailTemplateEvent.class);
        for (EmailTemplateBinding binding : bindingRepository.findAllByOrderByEventCodeAsc()) {
            bindings.put(binding.getEventCode(), binding);
        }
        return List.of(EmailTemplateEvent.values()).stream()
                .map(event -> toResponse(event, bindings.get(event)))
                .toList();
    }

    @Transactional
    public EmailTemplateBindingResponse bind(String eventCode, Long templateId, String adminEmail) {
        EmailTemplateEvent event = findEvent(eventCode);
        EmailTemplate template = templateRepository.findActiveForUpdate(templateId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMAIL_TEMPLATE_NOT_FOUND));
        if (!template.isActive()) {
            throw new BusinessException(ErrorCode.EMAIL_TEMPLATE_INVALID_CONTENT);
        }
        if (template.getScope() != event.getScope()) {
            throw new BusinessException(ErrorCode.EMAIL_TEMPLATE_SCOPE_MISMATCH);
        }

        User admin = findAdmin(adminEmail);
        EmailTemplateBinding binding = bindingRepository.findByEventCode(event)
                .map(existing -> {
                    existing.changeTemplate(template, admin);
                    return existing;
                })
                .orElseGet(() -> EmailTemplateBinding.create(event, template, admin));
        bindingRepository.save(binding);
        return toResponse(event, binding);
    }

    @Transactional
    public EmailTemplateBindingResponse unbind(String eventCode) {
        EmailTemplateEvent event = findEvent(eventCode);
        bindingRepository.findByEventCode(event).ifPresent(bindingRepository::delete);
        return toResponse(event, null);
    }

    private EmailTemplateEvent findEvent(String eventCode) {
        return EmailTemplateEvent.fromCode(eventCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMAIL_TEMPLATE_EVENT_NOT_FOUND));
    }

    private User findAdmin(String email) {
        return userRepository.findByEmail(email)
                .filter(user -> user.getRole() == User.Role.ADMIN)
                .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN));
    }

    private EmailTemplateBindingResponse toResponse(EmailTemplateEvent event,
                                                    EmailTemplateBinding binding) {
        if (binding == null) {
            return new EmailTemplateBindingResponse(
                    event,
                    event.getLabel(),
                    event.getScope(),
                    null,
                    null,
                    null,
                    false,
                    false,
                    NOT_CONFIGURED_REASON);
        }

        EmailTemplate template = binding.getTemplate();
        boolean sendable = template.isActive();
        return new EmailTemplateBindingResponse(
                event,
                event.getLabel(),
                event.getScope(),
                template.getId(),
                template.getName(),
                template.isActive(),
                true,
                sendable,
                sendable ? null : INACTIVE_REASON);
    }
}
