package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.QuestionAnalysisSaveRequest;
import com.tpmp.testprep.dto.request.QuestionBankBulkRequest;
import com.tpmp.testprep.dto.request.QuestionBankRequest;
import com.tpmp.testprep.dto.response.QuestionBankResponse;
import com.tpmp.testprep.entity.Attachment;
import com.tpmp.testprep.entity.DomainSlave;
import com.tpmp.testprep.entity.QuestionBank;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.entity.support.SchedulingData;
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
        validateSchedulingData(request);
        Long adminId = resolveAdminId(adminEmail);
        DomainSlave category = resolveCategory(request.categoryId());
        DomainSlave examType = resolveCategory(request.examTypeId());
        QuestionBank qb = QuestionBank.builder()
                .title(request.title())
                .examYear(request.examYear())
                .examRound(request.examRound())
                .content(request.content())
                .questionType(request.questionType())
                .category(category)
                .examType(examType)
                .options(request.options())
                .answer(request.answer())
                .code(request.code())
                .language(request.language())
                .explanation(request.explanation())
                .aiKeywords(request.aiKeywords())
                .aiDomains(request.aiDomains())
                .aiDifficulty(request.aiDifficulty())
                .aiSummary(request.aiSummary())
                .schedulingData(request.schedulingData())
                .createdByUno(adminId)
                .build();
        return QuestionBankResponse.from(questionBankRepository.save(qb));
    }

    /** 문항 일괄 등록 */
    @Transactional
    public int createQuestionsBulk(QuestionBankBulkRequest bulkRequest, String adminEmail) {
        bulkRequest.questions().forEach(this::validateSchedulingData);
        Long adminId = resolveAdminId(adminEmail);
        List<QuestionBank> entities = bulkRequest.questions().stream()
                .map(req -> QuestionBank.builder()
                        .title(req.title())
                        .examYear(req.examYear())
                        .examRound(req.examRound())
                        .content(req.content())
                        .questionType(req.questionType())
                        .category(resolveCategory(req.categoryId()))
                        .examType(resolveCategory(req.examTypeId()))
                        .options(req.options())
                        .answer(req.answer())
                        .code(req.code())
                        .language(req.language())
                        .explanation(req.explanation())
                        .aiKeywords(req.aiKeywords())
                        .aiDomains(req.aiDomains())
                        .aiDifficulty(req.aiDifficulty())
                        .aiSummary(req.aiSummary())
                        .schedulingData(req.schedulingData())
                        .createdByUno(adminId)
                        .build())
                .toList();
        questionBankRepository.saveAll(entities);
        return entities.size();
    }

    /** 문항 수정 */
    @Transactional
    public QuestionBankResponse updateQuestion(Long id, QuestionBankRequest request, String adminEmail) {
        validateSchedulingData(request);
        Long adminId = resolveAdminId(adminEmail);
        DomainSlave category = resolveCategory(request.categoryId());
        DomainSlave examType = resolveCategory(request.examTypeId());
        QuestionBank qb = findActive(id);
        qb.update(request.title(), request.examYear(), request.examRound(),
                  request.content(), request.questionType(),
                  category, examType,
                  request.options(), request.answer(),
                  request.code(), request.language(),
                  request.explanation(),
                  request.aiKeywords(), request.aiDomains(),
                  request.aiDifficulty(), request.aiSummary(),
                  request.schedulingData(),
                  adminId);
        return QuestionBankResponse.from(qb);
    }

    /**
     * AI 분석 결과 즉시 저장 (재분석 시 덮어쓰기).
     * 수정 화면에서 "분석 시작" → 성공 시 호출. 문항의 ai_* 4개 컬럼만 갱신한다.
     */
    @Transactional
    public QuestionBankResponse saveAnalysis(Long id, QuestionAnalysisSaveRequest req, String adminEmail) {
        Long adminId = resolveAdminId(adminEmail);
        QuestionBank qb = findActive(id);
        qb.updateAnalysis(req.keywords(), req.domains(), req.difficulty(), req.summary(), adminId);
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
        if (categoryId == null) return null;
        return domainSlaveRepository.findById(categoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));
    }

    /**
     * SCHEDULING 유형 문항의 스케줄링 데이터 정합성 검증.
     * <ul>
     *   <li>questionType == SCHEDULING 인데 schedulingData 가 없으면 오류</li>
     *   <li>RR 알고리즘인데 timeQuantum 이 없거나 0 이하이면 오류</li>
     *   <li>PRIORITY 계열 알고리즘인데 프로세스 중 priority 가 비어있는 행이 있으면 오류</li>
     * </ul>
     * 등록(단건/일괄) · 수정 3개 경로 모두에서 호출한다.
     */
    private void validateSchedulingData(QuestionBankRequest request) {
        if (request.questionType() != QuestionBank.QuestionType.SCHEDULING) {
            return;
        }
        SchedulingData data = request.schedulingData();
        if (data == null) {
            throw new BusinessException(ErrorCode.SCHEDULING_DATA_INVALID);
        }
        if (data.algorithm() == SchedulingData.SchedulingAlgorithm.RR
                && (data.timeQuantum() == null || data.timeQuantum() <= 0)) {
            throw new BusinessException(ErrorCode.SCHEDULING_DATA_INVALID);
        }
        boolean isPriorityAlgorithm =
                data.algorithm() == SchedulingData.SchedulingAlgorithm.PRIORITY_NON_PREEMPTIVE
                || data.algorithm() == SchedulingData.SchedulingAlgorithm.PRIORITY_PREEMPTIVE;
        if (isPriorityAlgorithm
                && data.processes().stream().anyMatch(p -> p.priority() == null)) {
            throw new BusinessException(ErrorCode.SCHEDULING_DATA_INVALID);
        }
    }
}
