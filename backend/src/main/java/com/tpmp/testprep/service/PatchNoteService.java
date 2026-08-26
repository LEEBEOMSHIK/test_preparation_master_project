package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.PatchNotePublicationRequest;
import com.tpmp.testprep.dto.request.PatchNoteRequest;
import com.tpmp.testprep.dto.response.PatchNoteResponse;
import com.tpmp.testprep.entity.PatchNote;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.PatchNoteRepository;
import com.tpmp.testprep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.util.HtmlUtils;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PatchNoteService {

    private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]*>");

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
        return PatchNoteResponse.from(patchNoteRepository.save(patchNote));
    }

    @Transactional
    public PatchNoteResponse update(Long id, PatchNoteRequest request, String adminEmail) {
        validateVisibleContent(request.content());
        Long adminId = resolveAdminId(adminEmail);
        PatchNote patchNote = findActive(id);
        patchNote.update(request.title(), request.version(), request.content(), adminId);
        patchNote.changePublication(request.published(), adminId);
        return PatchNoteResponse.from(patchNote);
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
        String withoutTags = HTML_TAG_PATTERN.matcher(content).replaceAll("");
        String visibleText = HtmlUtils.htmlUnescape(withoutTags).replace('\u00A0', ' ');
        if (!StringUtils.hasText(visibleText)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
    }
}
