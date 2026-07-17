package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.ExamQuestionSyncRequest;
import com.tpmp.testprep.dto.response.ExamQuestionSyncPreviewResponse;
import com.tpmp.testprep.entity.Exam;
import com.tpmp.testprep.entity.ExamSession;
import com.tpmp.testprep.entity.Examination;
import com.tpmp.testprep.entity.Question;
import com.tpmp.testprep.entity.QuestionBank;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.ExamRepository;
import com.tpmp.testprep.repository.ExamSessionRepository;
import com.tpmp.testprep.repository.ExaminationRepository;
import com.tpmp.testprep.repository.QuestionBankRepository;
import com.tpmp.testprep.repository.QuestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ExamQuestionSyncServiceTest {

    @Mock private ExamRepository examRepository;
    @Mock private QuestionRepository questionRepository;
    @Mock private QuestionBankRepository questionBankRepository;
    @Mock private ExamSessionRepository examSessionRepository;
    @Mock private ExaminationRepository examinationRepository;
    @Mock private Exam exam;
    @Mock private Question question;
    @Mock private QuestionBank source;
    @Mock private QuestionBank secondSource;
    @Mock private ExamSession session;
    @Mock private Examination examination;

    private ExamQuestionSyncService service;

    @BeforeEach
    void setUp() {
        service = new ExamQuestionSyncService(
                examRepository, questionRepository, questionBankRepository, examSessionRepository,
                examinationRepository);
        when(examinationRepository.findDistinctCategoryIdsByExamPaperId(1L)).thenReturn(List.of(7L));
    }

    private void givenPreview(String title) {
        when(examRepository.findByIdAndDelYn(1L, "N")).thenReturn(Optional.of(exam));
        when(exam.getTitle()).thenReturn(title);
        when(examSessionRepository.findByExamPaperIdWithExamination(1L)).thenReturn(List.of());
        when(questionRepository.findByExamIdOrderBySeqAscWithSyncSource(1L)).thenReturn(List.of(question));
        when(question.getId()).thenReturn(10L);
        when(question.getSeq()).thenReturn(3);
    }

    @Test
    void previewFindsStructuredCandidateEvenWhenContentDiffers() {
        givenPreview("2025년 2회 정보처리 시험지");
        when(questionBankRepository.findStructuralSyncCandidates(2025, 2, 3, 7L)).thenReturn(List.of(source));
        when(source.getId()).thenReturn(100L);
        when(source.getQuestionType()).thenReturn(QuestionBank.QuestionType.SHORT_ANSWER);

        ExamQuestionSyncPreviewResponse.Item item = service.preview(1L).items().get(0);

        assertThat(item.linkStatus()).isEqualTo("CANDIDATE");
        assertThat(item.candidateSourceQuestionBankId()).isEqualTo(100L);
        verify(question, never()).getContent();
    }

    @ParameterizedTest
    @CsvSource({
            "2024년 3회 정보처리기사, 2024, 3",
            "2025년 1회 정보처리기사, 2025, 1",
            "2025년 2회 정보처리기사, 2025, 2",
            "2025년 3회 정보처리기사, 2025, 3",
            "2026년 1회 정보처리기사, 2026, 1"
    })
    void previewParsesProductionExamTitles(String title, int examYear, int examRound) {
        givenPreview(title);
        when(questionBankRepository.findStructuralSyncCandidates(examYear, examRound, 3, 7L))
                .thenReturn(List.of(source));
        when(source.getId()).thenReturn(100L);
        when(source.getQuestionType()).thenReturn(QuestionBank.QuestionType.SHORT_ANSWER);

        ExamQuestionSyncPreviewResponse.Item item = service.preview(1L).items().get(0);

        assertThat(item.linkStatus()).isEqualTo("CANDIDATE");
        assertThat(item.candidateSourceQuestionBankId()).isEqualTo(100L);
    }

    @Test
    void previewLeavesZeroCandidateUnlinkedAndMultipleCandidatesAmbiguous() {
        givenPreview("2025년 2차 시험지");
        when(questionBankRepository.findStructuralSyncCandidates(2025, 2, 3, 7L))
                .thenReturn(List.of(), List.of(source, secondSource));

        assertThat(service.preview(1L).items().get(0).linkStatus()).isEqualTo("UNLINKED");
        assertThat(service.preview(1L).items().get(0).linkStatus()).isEqualTo("AMBIGUOUS");
    }

    @Test
    void previewRejectsMissingOrMultipleTitleKeysWithoutCandidateQuery() {
        givenPreview("2024/2026 시험지");

        assertThat(service.preview(1L).items().get(0).linkStatus()).isEqualTo("AMBIGUOUS");
        verify(questionBankRepository, never()).findStructuralSyncCandidates(2024, 1, 3, 7L);
    }

    @Test
    void previewAllowsSqlStructuredCandidate() {
        givenPreview("2025년 1회 시험지");
        when(questionBankRepository.findStructuralSyncCandidates(2025, 1, 3, 7L)).thenReturn(List.of(source));
        when(source.getId()).thenReturn(100L);
        when(source.getQuestionType()).thenReturn(QuestionBank.QuestionType.SQL);

        assertThat(service.preview(1L).items().get(0).syncStatus()).isEqualTo("CANDIDATE");
    }

    @Test
    void applyRequiresExactAnswerConfirmation() {
        givenLinkedApply();

        assertThatThrownBy(() -> service.apply(1L, request(true, "동기화")))
                .isInstanceOf(BusinessException.class)
                .satisfies(error -> assertThat(((BusinessException) error).getErrorCode())
                        .isEqualTo(ErrorCode.EXAM_QUESTION_SYNC_ANSWER_CONFIRM_REQUIRED));
    }

    @Test
    void applyPreservesIdSeqAndAnswerWithoutApproval() {
        givenLinkedApply();

        service.apply(1L, request(false, null));

        verify(question).syncFrom(source, false);
        verify(questionRepository, never()).save(question);
        assertThat(question.getId()).isEqualTo(10L);
        assertThat(question.getSeq()).isEqualTo(3);
    }

    @Test
    void applyPassesAnswerApprovalOnlyWithExactConfirmation() {
        givenLinkedApply();

        service.apply(1L, request(true, "정답 동기화"));

        verify(question).syncFrom(source, true);
    }

    @Test
    void applyIgnoresStaleAnswerApprovalStateWhenSelectionHasNoAnswerChange() {
        givenLinkedApply();
        when(source.getAnswer()).thenReturn("같은 정답");
        when(question.getAnswer()).thenReturn("같은 정답");

        service.apply(1L, request(true, "잘못된 문구"));

        verify(question).syncFrom(source, false);
    }

    @Test
    void applyAllowsSchedulingSource() {
        when(examRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(exam));
        when(exam.getTitle()).thenReturn("2025년 1회 시험지");
        when(examSessionRepository.findByExamPaperIdWithExamination(1L)).thenReturn(List.of());
        when(questionRepository.findByExamIdOrderBySeqAscWithSyncSource(1L)).thenReturn(List.of(question));
        when(question.getId()).thenReturn(10L);
        when(question.getSourceQuestionBank()).thenReturn(source);
        when(question.getAnswer()).thenReturn("11.75");
        when(questionBankRepository.findByIdAndDelYnAndUseYn(100L, "N", "Y"))
                .thenReturn(Optional.of(source));
        when(source.getQuestionType()).thenReturn(QuestionBank.QuestionType.SCHEDULING);
        when(source.getAnswer()).thenReturn("11.75");

        service.apply(1L, request(false, null));

        verify(question).syncFrom(source, false);
    }

    @Test
    void expiredSessionDoesNotBlockPreview() {
        when(examRepository.findByIdAndDelYn(1L, "N")).thenReturn(Optional.of(exam));
        when(exam.getTitle()).thenReturn("제목 없음");
        when(examSessionRepository.findByExamPaperIdWithExamination(1L)).thenReturn(List.of(session));
        when(session.getStartedAt()).thenReturn(LocalDateTime.now().minusMinutes(11));
        when(session.getExamination()).thenReturn(examination);
        when(examination.getTimeLimit()).thenReturn(10);
        when(questionRepository.findByExamIdOrderBySeqAscWithSyncSource(1L)).thenReturn(List.of());

        assertThat(service.preview(1L).activeSession()).isFalse();
    }

    @Test
    void activeSessionBlocksApplyAfterExamLock() {
        when(examRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(exam));
        when(examSessionRepository.findByExamPaperIdWithExamination(1L)).thenReturn(List.of(session));
        when(session.getStartedAt()).thenReturn(LocalDateTime.now());
        when(session.getExamination()).thenReturn(examination);
        when(examination.getTimeLimit()).thenReturn(10);

        assertThatThrownBy(() -> service.apply(1L, request(false, null)))
                .isInstanceOf(BusinessException.class)
                .satisfies(error -> assertThat(((BusinessException) error).getErrorCode())
                        .isEqualTo(ErrorCode.EXAM_QUESTION_SYNC_ACTIVE_SESSION));
        verify(examRepository).findByIdForUpdate(1L);
    }

    private void givenLinkedApply() {
        when(examRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(exam));
        when(exam.getId()).thenReturn(1L);
        when(exam.getTitle()).thenReturn("2025년 1회 시험지");
        when(examSessionRepository.findByExamPaperIdWithExamination(1L)).thenReturn(List.of());
        when(questionRepository.findByExamIdOrderBySeqAscWithSyncSource(1L)).thenReturn(List.of(question));
        when(question.getId()).thenReturn(10L);
        when(question.getSeq()).thenReturn(3);
        when(question.getSourceQuestionBank()).thenReturn(source);
        when(question.getQuestionType()).thenReturn(Question.QuestionType.SHORT_ANSWER);
        when(question.getContent()).thenReturn("이전 본문");
        when(question.getAnswer()).thenReturn("이전 정답");
        when(source.getId()).thenReturn(100L);
        when(source.getDelYn()).thenReturn("N");
        when(source.getUseYn()).thenReturn("Y");
        when(source.getQuestionType()).thenReturn(QuestionBank.QuestionType.SHORT_ANSWER);
        when(source.getContent()).thenReturn("새 본문");
        when(source.getAnswer()).thenReturn("새 정답");
        when(questionBankRepository.findByIdAndDelYnAndUseYn(100L, "N", "Y"))
                .thenReturn(Optional.of(source));
    }

    private ExamQuestionSyncRequest request(boolean applyAnswers, String confirmation) {
        return new ExamQuestionSyncRequest(
                List.of(new ExamQuestionSyncRequest.Selection(10L, 100L)),
                applyAnswers,
                confirmation);
    }
}
