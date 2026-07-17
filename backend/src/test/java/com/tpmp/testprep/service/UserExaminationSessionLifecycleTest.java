package com.tpmp.testprep.service;

import com.tpmp.testprep.entity.Exam;
import com.tpmp.testprep.entity.ExamHistory;
import com.tpmp.testprep.entity.ExamSession;
import com.tpmp.testprep.entity.Examination;
import com.tpmp.testprep.entity.Question;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.entity.support.SqlData;
import com.tpmp.testprep.dto.response.ExaminationSubmitResponse;
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
}
