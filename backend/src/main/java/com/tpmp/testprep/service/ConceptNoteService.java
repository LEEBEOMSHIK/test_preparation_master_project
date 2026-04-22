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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConceptNoteService {

    private final ConceptNoteRepository conceptNoteRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final QuestionBankRepository questionBankRepository;

    public Page<ConceptNoteResponse> getMyNotes(String email, Pageable pageable) {
        User user = findUser(email);
        return conceptNoteRepository.findByUserIdWithRelations(user.getId(), pageable)
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
