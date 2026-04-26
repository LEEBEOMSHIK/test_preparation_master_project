package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.QuestionBankBulkRequest;
import com.tpmp.testprep.dto.request.QuestionBankRequest;
import com.tpmp.testprep.dto.response.QuestionBankResponse;
import com.tpmp.testprep.entity.Attachment;
import com.tpmp.testprep.entity.DomainSlave;
import com.tpmp.testprep.entity.QuestionBank;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.DomainSlaveRepository;
import com.tpmp.testprep.repository.QuestionBankRepository;
import com.tpmp.testprep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestionBankService {

    private final QuestionBankRepository questionBankRepository;
    private final UserRepository userRepository;
    private final DomainSlaveRepository domainSlaveRepository;
    private final AttachmentService attachmentService;

    /** 삭제되지 않은 문항 목록 조회 (페이징) */
    public Page<QuestionBankResponse> getQuestions(Pageable pageable) {
        return questionBankRepository.findAllByDelYn("N", pageable)
                .map(QuestionBankResponse::from);
    }

    /** 문항 단건 조회 */
    public QuestionBankResponse getQuestion(Long id) {
        return QuestionBankResponse.from(findActive(id));
    }

    /** 문항 단건 등록 */
    @Transactional
    public QuestionBankResponse createQuestion(QuestionBankRequest request, String adminEmail) {
        Long adminId = resolveAdminId(adminEmail);
        DomainSlave category = resolveCategory(request.categoryId());
        QuestionBank qb = QuestionBank.builder()
                .content(request.content())
                .questionType(request.questionType())
                .category(category)
                .options(request.options())
                .answer(request.answer())
                .code(request.code())
                .language(request.language())
                .explanation(request.explanation())
                .createdByUno(adminId)
                .build();
        return QuestionBankResponse.from(questionBankRepository.save(qb));
    }

    /** 문항 일괄 등록 */
    @Transactional
    public int createQuestionsBulk(QuestionBankBulkRequest bulkRequest, String adminEmail) {
        Long adminId = resolveAdminId(adminEmail);
        List<QuestionBank> entities = bulkRequest.questions().stream()
                .map(req -> QuestionBank.builder()
                        .content(req.content())
                        .questionType(req.questionType())
                        .category(resolveCategory(req.categoryId()))
                        .options(req.options())
                        .answer(req.answer())
                        .code(req.code())
                        .language(req.language())
                        .explanation(req.explanation())
                        .createdByUno(adminId)
                        .build())
                .toList();
        questionBankRepository.saveAll(entities);
        return entities.size();
    }

    /** 문항 수정 */
    @Transactional
    public QuestionBankResponse updateQuestion(Long id, QuestionBankRequest request, String adminEmail) {
        Long adminId = resolveAdminId(adminEmail);
        DomainSlave category = resolveCategory(request.categoryId());
        QuestionBank qb = findActive(id);
        qb.update(request.content(), request.questionType(),
                  category,
                  request.options(), request.answer(),
                  request.code(), request.language(),
                  request.explanation(), adminId);
        return QuestionBankResponse.from(qb);
    }

    /** 문항 소프트 삭제 */
    @Transactional
    public void deleteQuestion(Long id, String adminEmail) {
        Long adminId = resolveAdminId(adminEmail);
        QuestionBank qb = findActive(id);
        qb.softDelete(adminId);
    }

    /** 문항 이미지 업로드 — 첨부파일 테이블에 기록 후 URL 반환 */
    @Transactional
    public String uploadImage(MultipartFile image) {
        Attachment attachment = attachmentService.saveImage(image, Attachment.RefType.QUESTION_BANK);
        return attachment.getFileUrl();
    }

    // ── private helpers ────────────────────────────────────────────────────────

    private QuestionBank findActive(Long id) {
        QuestionBank qb = questionBankRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.EXAM_NOT_FOUND));
        if ("Y".equals(qb.getDelYn())) {
            throw new BusinessException(ErrorCode.EXAM_NOT_FOUND);
        }
        return qb;
    }

    private Long resolveAdminId(String email) {
        User admin = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        return admin.getId();
    }

    private DomainSlave resolveCategory(Long categoryId) {
        return domainSlaveRepository.findById(categoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));
    }
}
