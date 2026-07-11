package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.QuestionBankRequest;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * QuestionBankService — SCHEDULING·SQL 유형 신설에 따른 validateSchedulingData·validateSqlData 검증 단위 테스트.
 * createQuestion(단건 등록) 경로를 통해 private 검증 로직을 간접 검증한다.
 */
@ExtendWith(MockitoExtension.class)
class QuestionBankServiceTest {

    @Mock private QuestionBankRepository questionBankRepository;
    @Mock private UserRepository userRepository;
    @Mock private DomainSlaveRepository domainSlaveRepository;
    @Mock private AttachmentService attachmentService;
    @Mock private User adminUser;
    @Mock private DomainSlave categorySlave;
    @Mock private DomainSlave examTypeSlave;

    private QuestionBankService service;

    private static final String ADMIN_EMAIL = "admin@tpmp.com";

    @BeforeEach
    void setUp() {
        service = new QuestionBankService(questionBankRepository, userRepository, domainSlaveRepository, attachmentService);
        lenient().when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));
        lenient().when(adminUser.getId()).thenReturn(1L);
        lenient().when(domainSlaveRepository.findById(10L)).thenReturn(Optional.of(categorySlave));
        lenient().when(domainSlaveRepository.findById(20L)).thenReturn(Optional.of(examTypeSlave));
        lenient().when(questionBankRepository.save(any(QuestionBank.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    private QuestionBankRequest requestOf(QuestionBank.QuestionType type, SchedulingData schedulingData) {
        return new QuestionBankRequest(
                "제목", null, null, null, "문항 내용", null, type, 10L, 20L,
                null, "정답", null, null, null,
                null, null, null, null,
                schedulingData, null
        );
    }

    private QuestionBankRequest requestOfSql(SqlData sqlData) {
        return new QuestionBankRequest(
                "제목", null, null, null, "문항 내용", null, QuestionBank.QuestionType.SQL, 10L, 20L,
                null, "정답", null, null, null,
                null, null, null, null,
                null, sqlData
        );
    }

    /** 발문(instruction)·문항 내용(content) 필수 규칙 검증 전용 헬퍼 — SHORT_ANSWER 유형, schedulingData 없음 */
    private QuestionBankRequest bodyRequestOf(String content, String instruction) {
        return new QuestionBankRequest(
                "제목", null, null, null, content, instruction, QuestionBank.QuestionType.SHORT_ANSWER, 10L, 20L,
                null, "정답", null, null, null,
                null, null, null, null,
                null, null
        );
    }

    private QuestionBankRequest questionNoRequest(Integer questionNo, Integer examYear, Integer examRound) {
        return new QuestionBankRequest(
                "제목", examYear, examRound, questionNo, "문항 내용", null,
                QuestionBank.QuestionType.SHORT_ANSWER, 10L, 20L,
                null, "정답", null, null, null,
                null, null, null, null,
                null, null
        );
    }

    // ── SCHEDULING 유형 검증 ─────────────────────────────────────────────────

    @Test
    @DisplayName("SCHEDULING: schedulingData가 null이면 SCHEDULING_DATA_INVALID 예외")
    void schedulingData_null_throws() {
        QuestionBankRequest req = requestOf(QuestionBank.QuestionType.SCHEDULING, null);

        assertThatThrownBy(() -> service.createQuestion(req, ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.SCHEDULING_DATA_INVALID));
    }

    @Test
    @DisplayName("SCHEDULING: RR 알고리즘인데 timeQuantum이 없으면 예외")
    void schedulingData_rrWithoutTimeQuantum_throws() {
        SchedulingData data = new SchedulingData(
                SchedulingData.SchedulingAlgorithm.RR, null,
                List.of(new SchedulingData.ProcessRow("P1", 0, 5, null)));
        QuestionBankRequest req = requestOf(QuestionBank.QuestionType.SCHEDULING, data);

        assertThatThrownBy(() -> service.createQuestion(req, ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.SCHEDULING_DATA_INVALID));
    }

    @Test
    @DisplayName("SCHEDULING: RR 알고리즘 + timeQuantum 0 이하이면 예외")
    void schedulingData_rrWithZeroTimeQuantum_throws() {
        SchedulingData data = new SchedulingData(
                SchedulingData.SchedulingAlgorithm.RR, 0,
                List.of(new SchedulingData.ProcessRow("P1", 0, 5, null)));
        QuestionBankRequest req = requestOf(QuestionBank.QuestionType.SCHEDULING, data);

        assertThatThrownBy(() -> service.createQuestion(req, ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.SCHEDULING_DATA_INVALID));
    }

    @Test
    @DisplayName("SCHEDULING: PRIORITY_NON_PREEMPTIVE인데 일부 프로세스 priority 누락 시 예외")
    void schedulingData_priorityMissing_throws() {
        SchedulingData data = new SchedulingData(
                SchedulingData.SchedulingAlgorithm.PRIORITY_NON_PREEMPTIVE, null,
                List.of(
                        new SchedulingData.ProcessRow("P1", 0, 5, 1),
                        new SchedulingData.ProcessRow("P2", 1, 3, null)));
        QuestionBankRequest req = requestOf(QuestionBank.QuestionType.SCHEDULING, data);

        assertThatThrownBy(() -> service.createQuestion(req, ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.SCHEDULING_DATA_INVALID));
    }

    @Test
    @DisplayName("SCHEDULING: FCFS + 유효한 프로세스 목록이면 정상 저장되고 schedulingData가 그대로 반영")
    void schedulingData_valid_savesSuccessfully() {
        SchedulingData data = new SchedulingData(
                SchedulingData.SchedulingAlgorithm.FCFS, null,
                List.of(
                        new SchedulingData.ProcessRow("P1", 0, 5, null),
                        new SchedulingData.ProcessRow("P2", 2, 3, null)));
        QuestionBankRequest req = requestOf(QuestionBank.QuestionType.SCHEDULING, data);

        service.createQuestion(req, ADMIN_EMAIL);

        ArgumentCaptor<QuestionBank> captor = ArgumentCaptor.forClass(QuestionBank.class);
        verify(questionBankRepository).save(captor.capture());
        assertThat(captor.getValue().getSchedulingData()).isEqualTo(data);
        assertThat(captor.getValue().getQuestionType()).isEqualTo(QuestionBank.QuestionType.SCHEDULING);
    }

    @Test
    @DisplayName("SCHEDULING: RR + 유효한 timeQuantum이면 정상 저장")
    void schedulingData_validRR_savesSuccessfully() {
        SchedulingData data = new SchedulingData(
                SchedulingData.SchedulingAlgorithm.RR, 4,
                List.of(new SchedulingData.ProcessRow("P1", 0, 5, null)));
        QuestionBankRequest req = requestOf(QuestionBank.QuestionType.SCHEDULING, data);

        service.createQuestion(req, ADMIN_EMAIL);

        verify(questionBankRepository).save(any(QuestionBank.class));
    }

    // ── 회귀 확인: SCHEDULING이 아닌 유형은 schedulingData 검증을 타지 않음 ──────

    @Test
    @DisplayName("SHORT_ANSWER: schedulingData가 없어도 예외 없이 정상 저장 (회귀 확인)")
    void nonScheduling_withoutSchedulingData_savesSuccessfully() {
        QuestionBankRequest req = requestOf(QuestionBank.QuestionType.SHORT_ANSWER, null);

        service.createQuestion(req, ADMIN_EMAIL);

        verify(questionBankRepository).save(any(QuestionBank.class));
    }

    // ── SQL 유형 검증 ────────────────────────────────────────────────────────

    @Test
    @DisplayName("SQL: sqlData가 null이면 SQL_DATA_INVALID 예외")
    void sqlData_null_throws() {
        QuestionBankRequest req = requestOfSql(null);

        assertThatThrownBy(() -> service.createQuestion(req, ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.SQL_DATA_INVALID));
    }

    @Test
    @DisplayName("SQL: 테이블 목록이 비어있으면 SQL_DATA_INVALID 예외")
    void sqlData_emptyTables_throws() {
        QuestionBankRequest req = requestOfSql(new SqlData(List.of()));

        assertThatThrownBy(() -> service.createQuestion(req, ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.SQL_DATA_INVALID));
    }

    @Test
    @DisplayName("SQL: 행의 셀 수가 컬럼 수와 다르면 SQL_DATA_INVALID 예외")
    void sqlData_rowLengthMismatch_throws() {
        SqlData data = new SqlData(List.of(new SqlData.SqlTable(
                "employees",
                List.of(new SqlData.SqlColumn("id", "INT", true), new SqlData.SqlColumn("name", "VARCHAR(50)", false)),
                List.of(List.of("1", "Alice", "extra")))));
        QuestionBankRequest req = requestOfSql(data);

        assertThatThrownBy(() -> service.createQuestion(req, ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.SQL_DATA_INVALID));
    }

    @Test
    @DisplayName("SQL: 유효한 테이블·컬럼·행이면 정상 저장되고 sqlData가 그대로 반영")
    void sqlData_valid_savesSuccessfully() {
        SqlData data = new SqlData(List.of(new SqlData.SqlTable(
                "employees",
                List.of(new SqlData.SqlColumn("id", "INT", true), new SqlData.SqlColumn("name", "VARCHAR(50)", false)),
                List.of(List.of("1", "Alice")))));
        QuestionBankRequest req = requestOfSql(data);

        service.createQuestion(req, ADMIN_EMAIL);

        ArgumentCaptor<QuestionBank> captor = ArgumentCaptor.forClass(QuestionBank.class);
        verify(questionBankRepository).save(captor.capture());
        assertThat(captor.getValue().getSqlData()).isEqualTo(data);
        assertThat(captor.getValue().getQuestionType()).isEqualTo(QuestionBank.QuestionType.SQL);
    }

    @Test
    @DisplayName("SQL: rows가 없으면(선택) 검증을 통과하고 정상 저장")
    void sqlData_withoutRows_savesSuccessfully() {
        SqlData data = new SqlData(List.of(new SqlData.SqlTable(
                "employees",
                List.of(new SqlData.SqlColumn("id", "INT", true)),
                null)));
        QuestionBankRequest req = requestOfSql(data);

        service.createQuestion(req, ADMIN_EMAIL);

        verify(questionBankRepository).save(any(QuestionBank.class));
    }

    // ── SQL 결과 테이블 정답(expectedResult) 검증 ──────────────────────────────

    @Test
    @DisplayName("SQL: expectedResult의 컬럼 목록이 비어있으면 SQL_DATA_INVALID 예외")
    void sqlExpectedResult_emptyColumns_throws() {
        SqlData.SqlExpectedResult expected = new SqlData.SqlExpectedResult(
                List.of(), List.of(List.of("1")), false);
        SqlData data = new SqlData(List.of(new SqlData.SqlTable(
                "employees",
                List.of(new SqlData.SqlColumn("id", "INT", true)),
                null)), expected);
        QuestionBankRequest req = requestOfSql(data);

        assertThatThrownBy(() -> service.createQuestion(req, ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.SQL_DATA_INVALID));
    }

    @Test
    @DisplayName("SQL: expectedResult의 행이 비어있으면 SQL_DATA_INVALID 예외 (0행 정답 미지원)")
    void sqlExpectedResult_emptyRows_throws() {
        SqlData.SqlExpectedResult expected = new SqlData.SqlExpectedResult(
                List.of("id"), List.of(), false);
        SqlData data = new SqlData(List.of(new SqlData.SqlTable(
                "employees",
                List.of(new SqlData.SqlColumn("id", "INT", true)),
                null)), expected);
        QuestionBankRequest req = requestOfSql(data);

        assertThatThrownBy(() -> service.createQuestion(req, ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.SQL_DATA_INVALID));
    }

    @Test
    @DisplayName("SQL: expectedResult의 행 길이가 컬럼 수와 다르면 SQL_DATA_INVALID 예외")
    void sqlExpectedResult_rowLengthMismatch_throws() {
        SqlData.SqlExpectedResult expected = new SqlData.SqlExpectedResult(
                List.of("id", "name"), List.of(List.of("1", "Alice", "extra")), false);
        SqlData data = new SqlData(List.of(new SqlData.SqlTable(
                "employees",
                List.of(new SqlData.SqlColumn("id", "INT", true), new SqlData.SqlColumn("name", "VARCHAR(50)", false)),
                null)), expected);
        QuestionBankRequest req = requestOfSql(data);

        assertThatThrownBy(() -> service.createQuestion(req, ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.SQL_DATA_INVALID));
    }

    @Test
    @DisplayName("SQL: 유효한 expectedResult이면 정상 저장되고 sqlData에 그대로 반영")
    void sqlExpectedResult_valid_savesSuccessfully() {
        SqlData.SqlExpectedResult expected = new SqlData.SqlExpectedResult(
                List.of("id", "name"), List.of(List.of("1", "Alice")), true);
        SqlData data = new SqlData(List.of(new SqlData.SqlTable(
                "employees",
                List.of(new SqlData.SqlColumn("id", "INT", true), new SqlData.SqlColumn("name", "VARCHAR(50)", false)),
                List.of(List.of("1", "Alice")))), expected);
        QuestionBankRequest req = requestOfSql(data);

        service.createQuestion(req, ADMIN_EMAIL);

        ArgumentCaptor<QuestionBank> captor = ArgumentCaptor.forClass(QuestionBank.class);
        verify(questionBankRepository).save(captor.capture());
        assertThat(captor.getValue().getSqlData()).isEqualTo(data);
        assertThat(captor.getValue().getSqlData().expectedResult()).isEqualTo(expected);
    }

    // ── 회귀 확인: SQL이 아닌 유형은 sqlData 검증을 타지 않음 ──────────────────

    @Test
    @DisplayName("SHORT_ANSWER: sqlData가 없어도 예외 없이 정상 저장 (회귀 확인)")
    void nonSql_withoutSqlData_savesSuccessfully() {
        QuestionBankRequest req = requestOf(QuestionBank.QuestionType.SHORT_ANSWER, null);

        service.createQuestion(req, ADMIN_EMAIL);

        verify(questionBankRepository).save(any(QuestionBank.class));
    }

    // ── 문항번호 자동 부여 ───────────────────────────────────────────────────

    @Test
    @DisplayName("문항번호: 명시 번호가 없고 시험 그룹이 완전하면 첫 번호를 자동 부여")
    void createQuestion_withoutQuestionNoAndCompleteExamGroup_assignsFirstQuestionNo() {
        QuestionBankRequest req = new QuestionBankRequest(
                "제목", 2024, 1, null, "문항 내용", null, QuestionBank.QuestionType.SHORT_ANSWER, 10L, 20L,
                null, "정답", null, null, null,
                null, null, null, null,
                null, null
        );

        service.createQuestion(req, ADMIN_EMAIL);

        ArgumentCaptor<QuestionBank> captor = ArgumentCaptor.forClass(QuestionBank.class);
        verify(questionBankRepository).save(captor.capture());
        assertThat(readQuestionNo(captor.getValue())).isEqualTo(1);
    }

    @Test
    @DisplayName("문항번호: 관리자가 명시한 번호를 우선 저장")
    void createQuestion_withExplicitQuestionNo_savesExplicitQuestionNo() {
        QuestionBankRequest req = questionNoRequest(7, 2024, 1);

        service.createQuestion(req, ADMIN_EMAIL);

        ArgumentCaptor<QuestionBank> captor = ArgumentCaptor.forClass(QuestionBank.class);
        verify(questionBankRepository).save(captor.capture());
        assertThat(captor.getValue().getQuestionNo()).isEqualTo(7);
    }

    @Test
    @DisplayName("문항번호: 활성 문항의 동일 시험 그룹/번호가 있으면 등록 거부")
    void createQuestion_withDuplicateQuestionNo_throws() {
        QuestionBankRequest req = questionNoRequest(7, 2024, 1);
        when(questionBankRepository.existsActiveQuestionNo(20L, 2024, 1, 7)).thenReturn(true);

        assertThatThrownBy(() -> service.createQuestion(req, ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.QUESTION_NO_DUPLICATE));
        verify(questionBankRepository, never()).save(any(QuestionBank.class));
    }

    @Test
    @DisplayName("문항번호: 수정 시 자기 자신은 중복 검사에서 제외")
    void updateQuestion_sameQuestionNoOnSameEntity_savesSuccessfully() {
        QuestionBank existing = QuestionBank.builder()
                .title("기존")
                .examYear(2024)
                .examRound(1)
                .questionNo(7)
                .content("기존 문항")
                .questionType(QuestionBank.QuestionType.SHORT_ANSWER)
                .category(categorySlave)
                .examType(examTypeSlave)
                .createdByUno(1L)
                .build();
        QuestionBankRequest req = questionNoRequest(7, 2024, 1);
        when(questionBankRepository.findById(99L)).thenReturn(Optional.of(existing));
        when(questionBankRepository.existsActiveQuestionNoExcludingId(99L, 20L, 2024, 1, 7)).thenReturn(false);

        service.updateQuestion(99L, req, ADMIN_EMAIL);

        assertThat(existing.getQuestionNo()).isEqualTo(7);
    }

    @Test
    @DisplayName("문항번호: 일괄 등록 자동 번호는 같은 그룹에서 max+1부터 순차 부여")
    void createQuestionsBulk_withoutQuestionNo_assignsSequentialQuestionNos() {
        QuestionBankRequest first = questionNoRequest(null, 2024, 1);
        QuestionBankRequest second = questionNoRequest(null, 2024, 1);
        when(questionBankRepository.findMaxQuestionNo(20L, 2024, 1)).thenReturn(3);

        service.createQuestionsBulk(new com.tpmp.testprep.dto.request.QuestionBankBulkRequest(List.of(first, second)), ADMIN_EMAIL);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<QuestionBank>> captor = ArgumentCaptor.forClass(List.class);
        verify(questionBankRepository).saveAll(captor.capture());
        assertThat(captor.getValue())
                .extracting(QuestionBank::getQuestionNo)
                .containsExactly(4, 5);
    }

    @Test
    @DisplayName("문항번호: 일괄 등록 요청 내부의 명시 번호 중복은 등록 거부")
    void createQuestionsBulk_withDuplicateExplicitQuestionNoInRequest_throws() {
        QuestionBankRequest first = questionNoRequest(7, 2024, 1);
        QuestionBankRequest second = questionNoRequest(7, 2024, 1);

        assertThatThrownBy(() -> service.createQuestionsBulk(
                        new com.tpmp.testprep.dto.request.QuestionBankBulkRequest(List.of(first, second)),
                        ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.QUESTION_NO_DUPLICATE));
        verify(questionBankRepository, never()).saveAll(any());
    }

    // ── 발문(instruction)·문항 내용(content) 필수 규칙 검증 ─────────────────────

    @Test
    @DisplayName("발문·내용: content가 blank이고 instruction이 있으면 정상 저장 (CODE·스케줄링처럼 내용 없이 발문만 등록 가능)")
    void content_blank_withInstruction_savesSuccessfully() {
        QuestionBankRequest req = bodyRequestOf("", "다음 설명을 보고 알맞은 용어를 작성하시오.");

        service.createQuestion(req, ADMIN_EMAIL);

        ArgumentCaptor<QuestionBank> captor = ArgumentCaptor.forClass(QuestionBank.class);
        verify(questionBankRepository).save(captor.capture());
        // 엔티티 저장 시 DB NOT NULL 제약 때문에 null 대신 빈 문자열로 coalesce된다.
        assertThat(captor.getValue().getContent()).isEmpty();
    }

    @Test
    @DisplayName("발문·내용: 둘 다 blank이면 QUESTION_BODY_REQUIRED 예외")
    void content_and_instruction_bothBlank_throws() {
        QuestionBankRequest req = bodyRequestOf("  ", null);

        assertThatThrownBy(() -> service.createQuestion(req, ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.QUESTION_BODY_REQUIRED));
    }

    @Test
    @DisplayName("발문·내용: content가 있고 instruction이 blank이면 정상 저장 (기존 회귀 확인)")
    void content_present_withBlankInstruction_savesSuccessfully() {
        QuestionBankRequest req = bodyRequestOf("문항 내용입니다.", "");

        service.createQuestion(req, ADMIN_EMAIL);

        verify(questionBankRepository).save(any(QuestionBank.class));
    }

    private Integer readQuestionNo(QuestionBank questionBank) {
        try {
            return (Integer) QuestionBank.class.getMethod("getQuestionNo").invoke(questionBank);
        } catch (ReflectiveOperationException e) {
            throw new AssertionError("QuestionBank.questionNo getter가 구현되어야 합니다.", e);
        }
    }
}
