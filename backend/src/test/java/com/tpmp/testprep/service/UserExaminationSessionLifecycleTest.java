package com.tpmp.testprep.service;

import com.tpmp.testprep.entity.Exam;
import com.tpmp.testprep.entity.ExamHistory;
import com.tpmp.testprep.entity.ExamHistoryDetail;
import com.tpmp.testprep.entity.ExamSession;
import com.tpmp.testprep.entity.Examination;
import com.tpmp.testprep.entity.Question;
import com.tpmp.testprep.entity.QuestionBank;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.entity.support.SqlData;
import com.tpmp.testprep.dto.response.ExaminationSubmitResponse;
import com.tpmp.testprep.dto.response.QuestionResultResponse;
import com.tpmp.testprep.repository.ExamHistoryDetailRepository;
import com.tpmp.testprep.repository.ExamHistoryRepository;
import com.tpmp.testprep.repository.ExamRepository;
import com.tpmp.testprep.repository.ExamSessionRepository;
import com.tpmp.testprep.repository.ExaminationRepository;
import com.tpmp.testprep.repository.QuestionRepository;
import com.tpmp.testprep.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserExaminationSessionLifecycleTest {

    @Mock private ExaminationRepository examinationRepository;
    @Mock private QuestionRepository questionRepository;
    @Mock private UserRepository userRepository;
    @Mock private ExamHistoryRepository examHistoryRepository;
    @Mock private ExamRepository examRepository;
    @Mock private ExamHistoryDetailRepository examHistoryDetailRepository;
    @Mock private ExamSessionRepository examSessionRepository;
    @Mock private Examination examination;
    @Mock private Exam exam;
    @Mock private User user;
    @Mock private ExamSession session;
    @Mock private Question question;
    @Mock private QuestionBank sourceQuestionBank;

    private UserExaminationService service;

    @BeforeEach
    void setUp() {
        service = new UserExaminationService(
                examinationRepository, questionRepository, userRepository, examHistoryRepository,
                examRepository, examHistoryDetailRepository, examSessionRepository);
    }

    @Test
    void startExamLocksPaperBeforeReadingOrCreatingSession() {
        when(examinationRepository.findByIdWithPaper(7L)).thenReturn(Optional.of(examination));
        when(examination.getExamPaper()).thenReturn(exam);
        when(exam.getId()).thenReturn(1L);
        when(examRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(exam));
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(user.getId()).thenReturn(2L);
        when(examSessionRepository.findByUser_IdAndExamination_Id(2L, 7L)).thenReturn(Optional.of(session));
        when(session.getStartedAt()).thenReturn(LocalDateTime.now());
        when(session.getExamination()).thenReturn(examination);
        when(examination.getId()).thenReturn(7L);
        when(examination.getTimeLimit()).thenReturn(10);

        service.startExam(7L, "user@test.com", false);

        InOrder order = inOrder(examRepository, examSessionRepository);
        order.verify(examRepository).findByIdForUpdate(1L);
        order.verify(examSessionRepository).findByUser_IdAndExamination_Id(2L, 7L);
    }

    @Test
    void successfulSubmitDeletesSessionInSameFlow() {
        when(examinationRepository.findByIdWithPaper(7L)).thenReturn(Optional.of(examination));
        when(examination.getExamPaper()).thenReturn(exam);
        when(exam.getId()).thenReturn(1L);
        when(questionRepository.findByExamIdOrderBySeqAscWithCategory(1L)).thenReturn(List.of());
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(user.getId()).thenReturn(2L);
        when(examHistoryRepository.save(any(ExamHistory.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.submitExam(7L, Map.of(), "user@test.com");

        verify(examSessionRepository).deleteByUser_IdAndExamination_Id(2L, 7L);
    }

    @Test
    void submitGradesSqlExpectedResultAndKeepsStructuredSnapshot() {
        SqlData sqlData = new SqlData(
                List.of(),
                new SqlData.SqlExpectedResult(
                        List.of("id", "name"),
                        List.of(List.of("1", "Alice"), List.of("2", "Bob")),
                        false));
        when(examinationRepository.findByIdWithPaper(7L)).thenReturn(Optional.of(examination));
        when(examination.getExamPaper()).thenReturn(exam);
        when(exam.getId()).thenReturn(1L);
        when(questionRepository.findByExamIdOrderBySeqAscWithCategory(1L)).thenReturn(List.of(question));
        when(question.getId()).thenReturn(10L);
        when(question.getSeq()).thenReturn(1);
        when(question.getContent()).thenReturn("SQL 실행 결과를 쓰시오.");
        when(question.getQuestionType()).thenReturn(Question.QuestionType.SQL);
        when(question.getSqlData()).thenReturn(sqlData);
        when(question.getAnswer()).thenReturn("id | name\n1 | Alice\n2 | Bob");
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(user.getId()).thenReturn(2L);
        when(examHistoryRepository.save(any(ExamHistory.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ExaminationSubmitResponse response = service.submitExam(
                7L, Map.of(10L, "2 | Bob\n1 | Alice"), "user@test.com");

        assertThat(response.correct()).isEqualTo(1);
        assertThat(response.results().get(0).sqlData()).isEqualTo(sqlData);
    }

    @Test
    void submitReturnsSourceTitleAndStoresSameSnapshot() {
        when(examinationRepository.findByIdWithPaper(7L)).thenReturn(Optional.of(examination));
        when(examination.getExamPaper()).thenReturn(exam);
        when(exam.getId()).thenReturn(1L);
        when(questionRepository.findByExamIdOrderBySeqAscWithCategory(1L)).thenReturn(List.of(question));
        when(question.getId()).thenReturn(10L);
        when(question.getSeq()).thenReturn(1);
        when(question.getResultTitle()).thenReturn("2025년 2회 19번 — TCP 취약점 공격");
        when(question.getSourceQuestionBankId()).thenReturn(59L);
        when(question.getContent()).thenReturn("공격 명칭을 쓰시오.");
        when(question.getQuestionType()).thenReturn(Question.QuestionType.SHORT_ANSWER);
        when(question.getAnswer()).thenReturn("SYN Flooding");
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(user.getId()).thenReturn(2L);
        when(examHistoryRepository.save(any(ExamHistory.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ExaminationSubmitResponse response = service.submitExam(
                7L, Map.of(10L, "SYN-Flooding"), "user@test.com");

        assertThat(response.results().get(0).title())
                .isEqualTo("2025년 2회 19번 — TCP 취약점 공격");
        assertThat(response.results().get(0).questionBankId()).isEqualTo(59L);
        ArgumentCaptor<ExamHistory> historyCaptor = ArgumentCaptor.forClass(ExamHistory.class);
        verify(examHistoryRepository).save(historyCaptor.capture());
        assertThat(historyCaptor.getValue().getDetails().get(0).getTitle())
                .isEqualTo("2025년 2회 19번 — TCP 취약점 공격");
        assertThat(historyCaptor.getValue().getDetails().get(0).getQuestionBankId()).isEqualTo(59L);
    }

    @Test
    void questionResultUsesHistorySnapshotTitleAndAllowsLegacyNull() {
        ExamHistoryDetail titled = ExamHistoryDetail.builder()
                .questionId(10L)
                .questionBankId(59L)
                .seq(1)
                .title("저장된 제목")
                .content("저장된 본문")
                .questionType("SHORT_ANSWER")
                .correct(false)
                .build();
        ExamHistoryDetail legacy = ExamHistoryDetail.builder()
                .questionId(11L)
                .seq(2)
                .content("구버전 본문")
                .questionType("SHORT_ANSWER")
                .correct(false)
                .build();

        assertThat(QuestionResultResponse.of(titled).title()).isEqualTo("저장된 제목");
        assertThat(QuestionResultResponse.of(titled).questionBankId()).isEqualTo(59L);
        assertThat(QuestionResultResponse.of(legacy).title()).isNull();
        assertThat(QuestionResultResponse.of(legacy).questionBankId()).isNull();

        when(sourceQuestionBank.getTitle()).thenReturn("원본 제목");
        when(sourceQuestionBank.getId()).thenReturn(59L);
        Question sourcedQuestion = Question.builder()
                .sourceQuestionBank(sourceQuestionBank)
                .seq(1)
                .content("시험지 본문")
                .questionType(Question.QuestionType.SHORT_ANSWER)
                .build();
        Question manualQuestion = Question.builder()
                .seq(2)
                .content("수동 문항")
                .questionType(Question.QuestionType.SHORT_ANSWER)
                .build();
        assertThat(sourcedQuestion.getResultTitle()).isEqualTo("원본 제목");
        assertThat(sourcedQuestion.getSourceQuestionBankId()).isEqualTo(59L);
        assertThat(QuestionResultResponse.of(sourcedQuestion, "", false).questionBankId()).isEqualTo(59L);
        assertThat(manualQuestion.getResultTitle()).isNull();
        assertThat(manualQuestion.getSourceQuestionBankId()).isNull();
        assertThat(QuestionResultResponse.of(manualQuestion, "", false).questionBankId()).isNull();
    }
}
