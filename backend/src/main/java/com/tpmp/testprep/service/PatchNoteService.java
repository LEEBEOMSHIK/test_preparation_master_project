package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.PatchNotePublicationRequest;
import com.tpmp.testprep.dto.request.PatchNoteItemRequest;
import com.tpmp.testprep.dto.request.PatchNoteRequest;
import com.tpmp.testprep.dto.response.PatchNoteResponse;
import com.tpmp.testprep.entity.PatchNote;
import com.tpmp.testprep.entity.PatchNoteItem;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.PatchNoteRepository;
import com.tpmp.testprep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.util.HtmlUtils;

import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PatchNoteService {

    private static final Pattern NON_RENDERED_ELEMENT_PATTERN = Pattern.compile(
            "(?is)<\\s*(script|style|template)\\b[^>]*>.*?</\\s*\\1\\s*>");
    private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]*>");
    private static final Pattern INVISIBLE_CHARACTER_PATTERN = Pattern.compile(
            "[\\p{Cf}\\p{Zs}\\u034F\\u115F\\u1160\\u180B-\\u180D\\u3164\\uFE00-\\uFE0F\\uFFA0]");
    private static final Pattern VERSION_PATTERN = Pattern.compile("^v\\d+\\.\\d+\\.\\d+$");
    private static final Pattern VERSION_CONSTRAINT_PATTERN = Pattern.compile(
            "(?<![a-z0-9_])ux_patch_notes_version_active(?![a-z0-9_])");

    private final PatchNoteRepository patchNoteRepository;
    private final UserRepository userRepository;

    public Page<PatchNoteResponse> getPublished(Pageable pageable) {
        return patchNoteRepository
                .findByDelYnAndUseYnAndPublishedYnOrderByPublishedDtDescIdDesc("N", "Y", "Y", pageable)
                .map(PatchNoteResponse::from);
    }

    public Page<PatchNoteResponse> adminGetAll(Pageable pageable) {
        return patchNoteRepository.findByDelYnOrderByModifiedDtDescIdDesc("N", pageable)
                .map(PatchNoteResponse::from);
    }

    public PatchNoteResponse adminGetOne(Long id) {
        return PatchNoteResponse.from(findActive(id));
    }

    @Transactional
    public PatchNoteResponse create(PatchNoteRequest request, String adminEmail) {
        validateVisibleContent(request.content());
        validateVersionAndItems(request);
        if (patchNoteRepository.existsByVersionAndDelYn(request.version(), "N")) {
            throw new BusinessException(ErrorCode.PATCH_NOTE_VERSION_DUPLICATE);
        }
        Long adminId = resolveAdminId(adminEmail);
        PatchNote patchNote = PatchNote.builder()
                .title(request.title())
                .version(request.version())
                .content(request.content())
                .createdByUno(adminId)
                .build();
        if (request.published()) {
            patchNote.changePublication(true, adminId);
        }
        if (request.items() != null) {
            patchNote.replaceItems(toItems(request.items(), adminId), adminId);
        }
        return savePatchNote(patchNote);
    }

    @Transactional
    public PatchNoteResponse update(Long id, PatchNoteRequest request, String adminEmail) {
        validateVisibleContent(request.content());
        validateVersionAndItems(request);
        if (patchNoteRepository.existsByVersionAndDelYnAndIdNot(request.version(), "N", id)) {
            throw new BusinessException(ErrorCode.PATCH_NOTE_VERSION_DUPLICATE);
        }
        Long adminId = resolveAdminId(adminEmail);
        PatchNote patchNote = findActive(id);
        patchNote.update(request.title(), request.version(), request.content(), adminId);
        patchNote.changePublication(request.published(), adminId);
        if (request.items() != null) {
            patchNote.replaceItems(toItems(request.items(), adminId), adminId);
        }
        return savePatchNote(patchNote);
    }

    @Transactional
    public PatchNoteResponse updatePublication(Long id, PatchNotePublicationRequest request, String adminEmail) {
        Long adminId = resolveAdminId(adminEmail);
        PatchNote patchNote = findActive(id);
        patchNote.changePublication(request.published(), adminId);
        return PatchNoteResponse.from(patchNote);
    }

    @Transactional
    public void delete(Long id, String adminEmail) {
        Long adminId = resolveAdminId(adminEmail);
        findActive(id).softDelete(adminId);
    }

    private PatchNote findActive(Long id) {
        return patchNoteRepository.findByIdAndDelYn(id, "N")
                .orElseThrow(() -> new BusinessException(ErrorCode.PATCH_NOTE_NOT_FOUND));
    }

    private Long resolveAdminId(String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return admin.getId();
    }

    private void validateVisibleContent(String content) {
        String withoutNonRenderedElements = NON_RENDERED_ELEMENT_PATTERN.matcher(content).replaceAll("");
        String withoutTags = HTML_TAG_PATTERN.matcher(withoutNonRenderedElements).replaceAll("");
        String unescapedText = HtmlUtils.htmlUnescape(withoutTags);
        String visibleText = INVISIBLE_CHARACTER_PATTERN.matcher(unescapedText).replaceAll("");
        if (!StringUtils.hasText(visibleText)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
    }

    private void validateVersionAndItems(PatchNoteRequest request) {
        // Null means a legacy request that predates versioned child items.
        if (request.items() == null) {
            return;
        }
        if (!VERSION_PATTERN.matcher(request.version()).matches() || request.items().isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        for (PatchNoteItemRequest item : request.items()) {
            if (item == null || item.itemType() == null || item.displayOrder() == null
                    || item.displayOrder() < 0 || !isPlainSummary(item.summary())) {
                throw new BusinessException(ErrorCode.INVALID_INPUT);
            }
        }
    }

    private boolean isPlainSummary(String summary) {
        return StringUtils.hasText(summary)
                && summary.length() <= 200
                && !HTML_TAG_PATTERN.matcher(summary).find();
    }

    private List<PatchNoteItem> toItems(List<PatchNoteItemRequest> requests, Long adminId) {
        return requests.stream()
                .map(item -> PatchNoteItem.builder()
                        .itemType(item.itemType())
                        .summary(item.summary().trim())
                        .displayOrder(item.displayOrder())
                        .createdByUno(adminId)
                        .build())
                .toList();
    }

    private PatchNoteResponse savePatchNote(PatchNote patchNote) {
        try {
            return PatchNoteResponse.from(patchNoteRepository.saveAndFlush(patchNote));
        } catch (DataIntegrityViolationException exception) {
            if (isVersionConstraintViolation(exception)) {
                throw new BusinessException(ErrorCode.PATCH_NOTE_VERSION_DUPLICATE);
            }
            throw exception;
        }
    }

    private boolean isVersionConstraintViolation(DataIntegrityViolationException exception) {
        for (Throwable cause = exception; cause != null; cause = cause.getCause()) {
            String message = cause.toString().toLowerCase();
            if (VERSION_CONSTRAINT_PATTERN.matcher(message).find()) {
                return true;
            }
        }
        return false;
    }
}
