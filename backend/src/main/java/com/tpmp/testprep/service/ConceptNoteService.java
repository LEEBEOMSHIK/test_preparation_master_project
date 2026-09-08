package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.ConceptNoteRequest;
import com.tpmp.testprep.dto.response.ConceptNoteResponse;
import com.tpmp.testprep.entity.ConceptNote;
import com.tpmp.testprep.entity.Question;
import com.tpmp.testprep.entity.QuestionBank;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.ConceptNoteRepository;
import com.tpmp.testprep.repository.QuestionBankRepository;
import com.tpmp.testprep.repository.QuestionRepository;
import com.tpmp.testprep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConceptNoteService {

    private final ConceptNoteRepository conceptNoteRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final QuestionBankRepository questionBankRepository;

    public Page<ConceptNoteResponse> getMyNotes(String email, Pageable pageable) {
        return getMyNotes(email, null, pageable);
    }

    public Page<ConceptNoteResponse> getMyNotes(String email, String keyword, Pageable pageable) {
        User user = findUser(email);
        String kw = StringUtils.hasText(keyword)
                ? keyword.trim().replace("!", "!!").replace("%", "!%").replace("_", "!_")
                : null;
        return conceptNoteRepository.searchOwnedByTitle(user.getId(), kw, stablePage(pageable))
                .map(ConceptNoteResponse::from);
    }

    public ConceptNoteResponse getMyNote(Long id, String email) {
        ConceptNote note = findNoteWithRelations(id);
        checkOwner(note, email);
        return ConceptNoteResponse.from(note);
    }

    @Transactional
    public ConceptNoteResponse create(ConceptNoteRequest request, String email) {
        User user = findUser(email);
        Question question = request.questionId() != null
                ? questionRepository.findById(request.questionId()).orElse(null)
                : null;
        QuestionBank questionBank = request.questionBankId() != null
                ? questionBankRepository.findById(request.questionBankId()).orElse(null)
                : null;
        ConceptNote note = ConceptNote.builder()
                .user(user)
                .title(request.title())
                .content(request.content())
                .isPublic(request.isPublic())
                .question(question)
                .questionBank(questionBank)
                .build();
        return ConceptNoteResponse.from(conceptNoteRepository.save(note));
    }

    @Transactional
    public ConceptNoteResponse update(Long id, ConceptNoteRequest request, String email) {
        ConceptNote note = findNoteWithRelations(id);
        checkOwner(note, email);
        note.update(request.title(), request.content(), request.isPublic());
        return ConceptNoteResponse.from(note);
    }

    @Transactional
    public void delete(Long id, String email) {
        ConceptNote note = findNote(id);
        checkOwner(note, email);
        conceptNoteRepository.delete(note);
    }

    // ── Public Explore ───────────────────────────────────────────────────────

    public Page<ConceptNoteResponse> getPublicNotes(String keyword, Pageable pageable) {
        String kw = StringUtils.hasText(keyword) ? keyword : null;
        return conceptNoteRepository.findPublicByTitle(kw, stablePage(pageable))
                .map(note -> ConceptNoteResponse.from(note, true));
    }

    public ConceptNoteResponse getPublicNote(Long id, String requestEmail) {
        ConceptNote note = conceptNoteRepository.findByIdWithUser(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CONCEPT_NOTE_NOT_FOUND));
        // 공개 컨텍스트이므로 본인 조회 분기를 포함해 모두 닉네임으로 응답 (의도된 동작)
        if (note.getUser().getEmail().equals(requestEmail)) {
            return ConceptNoteResponse.from(note, true);
        }
        if (!note.isPublic()) {
            throw new BusinessException(ErrorCode.CONCEPT_NOTE_NOT_FOUND);
        }
        return ConceptNoteResponse.from(note, true);
    }

    private Pageable stablePage(Pageable pageable) {
        if (pageable.isUnpaged()) return pageable;
        Sort sort = pageable.getSort().isSorted() ? pageable.getSort() : Sort.by(Sort.Direction.DESC, "updatedAt");
        if (sort.getOrderFor("id") == null) sort = sort.and(Sort.by(Sort.Direction.DESC, "id"));
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    public Page<ConceptNoteResponse> adminGetAll(Pageable pageable) {
        return conceptNoteRepository.findAllWithRelations(pageable).map(ConceptNoteResponse::from);
    }

    @Transactional
    public ConceptNoteResponse adminTogglePublic(Long id) {
        ConceptNote note = findNoteWithRelations(id);
        note.setPublic(!note.isPublic());
        return ConceptNoteResponse.from(note);
    }

    @Transactional
    public void adminDelete(Long id) {
        conceptNoteRepository.delete(findNote(id));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    private ConceptNote findNote(Long id) {
        return conceptNoteRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CONCEPT_NOTE_NOT_FOUND));
    }

    /** question/questionBank까지 함께 로드 */
    private ConceptNote findNoteWithRelations(Long id) {
        return conceptNoteRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CONCEPT_NOTE_NOT_FOUND));
    }

    private void checkOwner(ConceptNote note, String email) {
        if (!note.getUser().getEmail().equals(email)) {
            throw new BusinessException(ErrorCode.CONCEPT_NOTE_ACCESS_DENIED);
        }
    }
}
