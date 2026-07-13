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
import com.tpmp.testprep.entity.support.SqlData;
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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

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
        validateSqlData(request);
        validateBody(request);
        Long adminId = resolveAdminId(adminEmail);
        DomainSlave category = resolveCategory(request.categoryId());
        DomainSlave examType = resolveCategory(request.examTypeId());
        Integer questionNo = resolveQuestionNo(request, null);
        QuestionBank qb = QuestionBank.builder()
                .title(request.title())
                .examYear(request.examYear())
                .examRound(request.examRound())
                .questionNo(questionNo)
                .content(request.content())
                .instruction(request.instruction())
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
                .sqlData(request.sqlData())
                .createdByUno(adminId)
                .build();
        return QuestionBankResponse.from(questionBankRepository.save(qb));
    }

    /** 문항 일괄 등록 */
    @Transactional
    public int createQuestionsBulk(QuestionBankBulkRequest bulkRequest, String adminEmail) {
        bulkRequest.questions().forEach(this::validateSchedulingData);
        bulkRequest.questions().forEach(this::validateSqlData);
        bulkRequest.questions().forEach(this::validateBody);
        Long adminId = resolveAdminId(adminEmail);
        List<QuestionBankRequest> requests = bulkRequest.questions();
        List<Integer> questionNos = resolveQuestionNosForBulk(requests);
        List<QuestionBank> entities = new ArrayList<>();
        for (int i = 0; i < requests.size(); i++) {
            QuestionBankRequest req = requests.get(i);
            entities.add(QuestionBank.builder()
                        .title(req.title())
                        .examYear(req.examYear())
                        .examRound(req.examRound())
                        .questionNo(questionNos.get(i))
                        .content(req.content())
                        .instruction(req.instruction())
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
                        .sqlData(req.sqlData())
                        .createdByUno(adminId)
                        .build());
        }
        questionBankRepository.saveAll(entities);
        return entities.size();
    }

    /** 문항 수정 */
    @Transactional
    public QuestionBankResponse updateQuestion(Long id, QuestionBankRequest request, String adminEmail) {
        validateSchedulingData(request);
        validateSqlData(request);
        validateBody(request);
        Long adminId = resolveAdminId(adminEmail);
        DomainSlave category = resolveCategory(request.categoryId());
        DomainSlave examType = resolveCategory(request.examTypeId());
        QuestionBank qb = findActive(id);
        Integer questionNo = resolveQuestionNo(request, id);
        qb.update(request.title(), request.examYear(), request.examRound(), questionNo,
                  request.content(), request.questionType(),
                  category, examType,
                  request.options(), request.answer(),
                  request.code(), request.language(),
                  request.explanation(),
                  request.aiKeywords(), request.aiDomains(),
                  request.aiDifficulty(), request.aiSummary(),
                  request.schedulingData(),
                  request.sqlData(),
                  request.instruction(),
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

    private Integer resolveQuestionNo(QuestionBankRequest request, Long excludeQuestionId) {
        validateQuestionNoPositive(request.questionNo());
        if (request.questionNo() != null) {
            validateQuestionNoDuplicate(request, excludeQuestionId);
            return request.questionNo();
        }
        QuestionNoGroup group = resolveGroupOrNull(request);
        if (group == null) {
            return null;
        }
        return loadNextQuestionNo(group);
    }

    private List<Integer> resolveQuestionNosForBulk(List<QuestionBankRequest> requests) {
        Map<QuestionNoGroup, Set<Integer>> usedNumbersByGroup = new HashMap<>();
        Set<QuestionNoKey> explicitKeys = new HashSet<>();

        for (QuestionBankRequest request : requests) {
            validateQuestionNoPositive(request.questionNo());
            QuestionNoGroup group = resolveGroupOrNull(request);
            if (request.questionNo() == null || group == null) {
                continue;
            }

            QuestionNoKey key = new QuestionNoKey(group, request.questionNo());
            if (!explicitKeys.add(key)) {
                throw new BusinessException(ErrorCode.QUESTION_NO_DUPLICATE);
            }
            validateQuestionNoDuplicate(request, null);
            usedNumbersByGroup.computeIfAbsent(group, unused -> new HashSet<>()).add(request.questionNo());
        }

        Map<QuestionNoGroup, Integer> nextAutoNumberByGroup = new HashMap<>();
        List<Integer> resolved = new ArrayList<>();
        for (QuestionBankRequest request : requests) {
            if (request.questionNo() != null) {
                resolved.add(request.questionNo());
                continue;
            }
            QuestionNoGroup group = resolveGroupOrNull(request);
            if (group == null) {
                resolved.add(null);
                continue;
            }

            Set<Integer> usedNumbers = usedNumbersByGroup.computeIfAbsent(group, unused -> new HashSet<>());
            int nextNumber = nextAutoNumberByGroup.computeIfAbsent(group, this::loadNextQuestionNo);
            while (usedNumbers.contains(nextNumber)) {
                nextNumber++;
            }
            resolved.add(nextNumber);
            usedNumbers.add(nextNumber);
            nextAutoNumberByGroup.put(group, nextNumber + 1);
        }
        return resolved;
    }

    /**
     * 문항번호 자동 채번 그룹 판정. 두 그룹 중 하나에 해당하면 그룹을, 아니면 null을 반환한다.
     * <ul>
     *   <li>기출 그룹: examTypeId·examYear·examRound 모두 존재</li>
     *   <li>AI 커스텀 그룹: examYear·examRound 모두 null이고 categoryId가 존재
     *       (한쪽만 null인 어중간한 경우는 어느 그룹에도 속하지 않아 자동 채번하지 않는다)</li>
     * </ul>
     */
    private QuestionNoGroup resolveGroupOrNull(QuestionBankRequest request) {
        if (hasCompleteQuestionNoGroup(request)) {
            return QuestionNoGroup.examGroup(request);
        }
        if (isAiCustomGroup(request)) {
            return QuestionNoGroup.aiCustomGroup(request);
        }
        return null;
    }

    private int loadNextQuestionNo(QuestionNoGroup group) {
        Integer maxQuestionNo = group.aiCustom()
                ? questionBankRepository.findMaxAiCustomQuestionNo(group.categoryId())
                : questionBankRepository.findMaxQuestionNo(group.examTypeId(), group.examYear(), group.examRound());
        return (maxQuestionNo == null ? 0 : maxQuestionNo) + 1;
    }

    private void validateQuestionNoPositive(Integer questionNo) {
        if (questionNo != null && questionNo <= 0) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
    }

    private void validateQuestionNoDuplicate(QuestionBankRequest request, Long excludeQuestionId) {
        if (request.questionNo() == null) {
            return;
        }
        if (hasCompleteQuestionNoGroup(request)) {
            boolean exists = excludeQuestionId == null
                    ? questionBankRepository.existsActiveQuestionNo(
                        request.examTypeId(), request.examYear(), request.examRound(), request.questionNo())
                    : questionBankRepository.existsActiveQuestionNoExcludingId(
                        excludeQuestionId, request.examTypeId(), request.examYear(), request.examRound(), request.questionNo());
            if (exists) {
                throw new BusinessException(ErrorCode.QUESTION_NO_DUPLICATE);
            }
            return;
        }
        if (isAiCustomGroup(request)) {
            boolean exists = excludeQuestionId == null
                    ? questionBankRepository.existsActiveAiCustomQuestionNo(request.categoryId(), request.questionNo())
                    : questionBankRepository.existsActiveAiCustomQuestionNoExcludingId(
                        excludeQuestionId, request.categoryId(), request.questionNo());
            if (exists) {
                throw new BusinessException(ErrorCode.QUESTION_NO_DUPLICATE);
            }
        }
    }

    private boolean hasCompleteQuestionNoGroup(QuestionBankRequest request) {
        return request.examTypeId() != null && request.examYear() != null && request.examRound() != null;
    }

    /**
     * AI 커스텀 문항번호 채번 그룹 판정. examYear·examRound 둘 다 null이고 categoryId가 있을 때만 해당.
     * (기출/AI 커스텀 분류 기준인 "examYear·examRound 모두 null"과 동일 기준을 사용한다.)
     */
    private boolean isAiCustomGroup(QuestionBankRequest request) {
        return request.examYear() == null && request.examRound() == null && request.categoryId() != null;
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

    /**
     * SQL 유형 문항의 SQL 데이터 정합성 검증.
     * <ul>
     *   <li>questionType == SQL 인데 sqlData 가 없으면 오류</li>
     *   <li>테이블 목록이 비어있으면 오류</li>
     *   <li>테이블의 rows가 존재할 때, 각 행의 셀 수가 columns 개수와 다르면 오류</li>
     *   <li>expectedResult(결과 테이블 정답)가 있으면: columns 비어있으면 오류, rows 비어있으면
     *       오류(0행 정답은 지원하지 않음), 각 행의 셀 수가 columns 개수와 다르면 오류</li>
     * </ul>
     * 등록(단건/일괄) · 수정 3개 경로 모두에서 호출한다.
     */
    private void validateSqlData(QuestionBankRequest request) {
        if (request.questionType() != QuestionBank.QuestionType.SQL) {
            return;
        }
        SqlData data = request.sqlData();
        if (data == null || data.tables() == null || data.tables().isEmpty()) {
            throw new BusinessException(ErrorCode.SQL_DATA_INVALID);
        }
        for (SqlData.SqlTable table : data.tables()) {
            if (table.rows() == null || table.rows().isEmpty()) {
                continue;
            }
            int columnCount = table.columns().size();
            boolean invalidRow = table.rows().stream().anyMatch(row -> row.size() != columnCount);
            if (invalidRow) {
                throw new BusinessException(ErrorCode.SQL_DATA_INVALID);
            }
        }
        validateSqlExpectedResult(data.expectedResult());
    }

    /**
     * SQL 결과 테이블 정답(expectedResult) 정합성 검증. expectedResult가 없으면(선택 필드) 통과.
     * columns 비어있으면 오류, rows 비어있으면 오류(0행 정답은 범위 제외), 각 행의 셀 수가
     * columns 개수와 다르면 오류.
     */
    private void validateSqlExpectedResult(SqlData.SqlExpectedResult expected) {
        if (expected == null) {
            return;
        }
        if (expected.columns() == null || expected.columns().isEmpty()) {
            throw new BusinessException(ErrorCode.SQL_DATA_INVALID);
        }
        if (expected.rows() == null || expected.rows().isEmpty()) {
            throw new BusinessException(ErrorCode.SQL_DATA_INVALID);
        }
        int columnCount = expected.columns().size();
        boolean invalidRow = expected.rows().stream()
                .anyMatch(row -> row == null || row.size() != columnCount);
        if (invalidRow) {
            throw new BusinessException(ErrorCode.SQL_DATA_INVALID);
        }
    }

    /**
     * 발문(instruction)·문항 내용(content) 필수 규칙 검증.
     * 둘 다 선택 필드이지만, 적어도 하나는 값이 있어야 한다(둘 다 blank면 저장 거부).
     * 등록(단건/일괄) · 수정 3개 경로 모두에서 호출한다.
     */
    private void validateBody(QuestionBankRequest request) {
        boolean instructionBlank = request.instruction() == null || request.instruction().isBlank();
        boolean contentBlank = request.content() == null || request.content().isBlank();
        if (instructionBlank && contentBlank) {
            throw new BusinessException(ErrorCode.QUESTION_BODY_REQUIRED);
        }
    }

    /**
     * 문항번호 자동 채번 그룹 키. 기출 그룹(examTypeId+examYear+examRound)과 AI 커스텀 그룹(categoryId)을
     * {@code aiCustom} 플래그로 함께 표현한다 — 두 그룹은 채번 방식(조회 쿼리)만 다르고 나머지 처리 흐름은 동일하다.
     */
    private record QuestionNoGroup(Long examTypeId, Integer examYear, Integer examRound, Long categoryId, boolean aiCustom) {
        private static QuestionNoGroup examGroup(QuestionBankRequest request) {
            return new QuestionNoGroup(request.examTypeId(), request.examYear(), request.examRound(), null, false);
        }

        private static QuestionNoGroup aiCustomGroup(QuestionBankRequest request) {
            return new QuestionNoGroup(null, null, null, request.categoryId(), true);
        }
    }

    private record QuestionNoKey(QuestionNoGroup group, Integer questionNo) {}
}
