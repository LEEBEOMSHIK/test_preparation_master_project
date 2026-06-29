package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.response.ExamHistoryDetailResponse;
import com.tpmp.testprep.dto.response.ExamSessionResponse;
import com.tpmp.testprep.dto.response.ExaminationDetailResponse;
import com.tpmp.testprep.dto.response.ExaminationResponse;
import com.tpmp.testprep.dto.response.ExaminationSubmitResponse;
import com.tpmp.testprep.dto.response.PagedResponse;
import com.tpmp.testprep.dto.response.QuestionResultResponse;
import com.tpmp.testprep.dto.response.UserExamHistoryResponse;
import com.tpmp.testprep.entity.Exam;
import com.tpmp.testprep.entity.ExamHistory;
import com.tpmp.testprep.entity.ExamHistoryDetail;
import com.tpmp.testprep.entity.ExamSession;
import com.tpmp.testprep.entity.Examination;
import com.tpmp.testprep.entity.Question;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.ExamHistoryDetailRepository;
import com.tpmp.testprep.repository.ExamHistoryRepository;
import com.tpmp.testprep.repository.ExamSessionRepository;
import com.tpmp.testprep.repository.ExaminationRepository;
import com.tpmp.testprep.repository.QuestionRepository;
import com.tpmp.testprep.repository.UserRepository;
import com.tpmp.testprep.service.support.AnswerGrader;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserExaminationService {

    private final ExaminationRepository examinationRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final ExamHistoryRepository examHistoryRepository;
    private final ExamHistoryDetailRepository examHistoryDetailRepository;
    private final ExamSessionRepository examSessionRepository;

    /**
     * 시험 응시 세션 시작 또는 재개.
     * reset=true 이면 기존 세션을 삭제하고 새로 생성한다(다시 풀기).
     * 반환되는 remainingSeconds 가 0 이하이면 프론트엔드에서 즉시 자동제출해야 한다.
     */
    @Transactional
    public ExamSessionResponse startExam(Long examinationId, String email, boolean reset) {
        Examination examination = examinationRepository.findByIdWithPaper(examinationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EXAMINATION_NOT_FOUND));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (reset) {
            examSessionRepository.deleteByUser_IdAndExamination_Id(user.getId(), examinationId);
        }

        ExamSession session = examSessionRepository
                .findByUser_IdAndExamination_Id(user.getId(), examinationId)
                .orElseGet(() -> examSessionRepository.save(
                        ExamSession.builder()
                                .user(user)
                                .examination(examination)
                                .build()
                ));

        int remainingSeconds = (int) Math.max(
                0,
                examination.getTimeLimit() * 60L
                        - Duration.between(session.getStartedAt(), LocalDateTime.now()).getSeconds()
        );

        return ExamSessionResponse.of(session, remainingSeconds);
    }

    /** 시험 목록 조회 */
    public Page<ExaminationResponse> getExaminations(Pageable pageable) {
        return examinationRepository.findAllWithDetails(pageable)
                .map(ExaminationResponse::from);
    }

    /** 시험 상세 조회 (문항 포함, RANDOM 모드 시 셔플) */
    public ExaminationDetailResponse getExaminationDetail(Long id) {
        Examination examination = examinationRepository.findByIdWithPaper(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.EXAMINATION_NOT_FOUND));

        Exam paper = examination.getExamPaper();
        List<Question> questions = new ArrayList<>(
                questionRepository.findByExamIdOrderBySeqAsc(paper.getId())
        );
        if (paper.getQuestionMode() == Exam.QuestionMode.RANDOM) {
            Collections.shuffle(questions);
        }
        return ExaminationDetailResponse.of(examination, questions);
    }

    /** 시험 제출·채점·이력 저장 (문항별 스냅샷 포함) */
    @Transactional
    public ExaminationSubmitResponse submitExam(Long id, Map<Long, String> answers, String email) {
        Examination examination = examinationRepository.findByIdWithPaper(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.EXAMINATION_NOT_FOUND));

        // category LEFT JOIN FETCH — N+1 방지
        List<Question> questions = questionRepository.findByExamIdOrderBySeqAscWithCategory(
                examination.getExamPaper().getId()
        );
        int total = questions.size();
        int correct = 0;
        List<QuestionResultResponse> results = new ArrayList<>();

        for (Question q : questions) {
            String raw = answers.getOrDefault(q.getId(), "");
            String userAnswer = raw.isEmpty() ? null : raw;
            boolean isCorrect = AnswerGrader.isCorrect(
                    q.getQuestionType().name(), q.getAnswer(), userAnswer);
            if (isCorrect) correct++;
            results.add(QuestionResultResponse.of(q, raw, isCorrect));
        }
        int score = total > 0 ? (int) Math.round(correct * 100.0 / total) : 0;

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        ExamHistory history = ExamHistory.builder()
                .user(user)
                .examination(examination)
                .totalQuestions(total)
                .correctCount(correct)
                .score((double) score)
                .build();

        // 문항별 스냅샷 저장 (cascade로 history와 함께 persist)
        for (int i = 0; i < questions.size(); i++) {
            Question q = questions.get(i);
            String raw = answers.getOrDefault(q.getId(), "");
            String userAnswer = raw.isEmpty() ? null : raw;
            boolean isCorrect = AnswerGrader.isCorrect(
                    q.getQuestionType().name(), q.getAnswer(), userAnswer);

            ExamHistoryDetail detail = ExamHistoryDetail.builder()
                    .questionId(q.getId())
                    .seq(q.getSeq())
                    .content(q.getContent())
                    .questionType(q.getQuestionType().name())
                    .options(q.getOptions())
                    .userAnswer(userAnswer)
                    .correctAnswer(q.getAnswer())
                    .correct(isCorrect)
                    .explanation(q.getExplanation())
                    .code(q.getCode())
                    .language(q.getLanguage())
                    .categoryName(q.getCategory() != null ? q.getCategory().getName() : null)
                    .build();
            history.addDetail(detail);
        }

        ExamHistory saved = examHistoryRepository.save(history);

        return ExaminationSubmitResponse.of(total, correct, score, results, saved.getId());
    }

    /** 사용자 전체 응시 이력 목록 (최신순 페이징) */
    public PagedResponse<UserExamHistoryResponse> getUserExamHistories(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Page<UserExamHistoryResponse> page = examHistoryRepository
                .findByUser_IdOrderByTakenAtDesc(user.getId(), pageable)
                .map(UserExamHistoryResponse::from);
        return PagedResponse.from(page);
    }

    /** 과거 응시 결과 단건 재조회 (본인 소유 검증) */
    public ExamHistoryDetailResponse getUserExamHistoryResult(Long historyId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        ExamHistory history = examHistoryRepository
                .findByIdAndUser_Id(historyId, user.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.EXAM_HISTORY_NOT_FOUND));
        List<ExamHistoryDetail> details =
                examHistoryDetailRepository.findByExamHistory_IdOrderBySeqAsc(historyId);
        return ExamHistoryDetailResponse.of(history, details);
    }

    /** 최신 시험 결과 재조회 (본인 이력만) */
    public ExamHistoryDetailResponse getLatestResult(Long examinationId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        ExamHistory history = examHistoryRepository
                .findTopByUser_IdAndExamination_IdOrderByTakenAtDesc(user.getId(), examinationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EXAM_HISTORY_NOT_FOUND));

        List<ExamHistoryDetail> details =
                examHistoryDetailRepository.findByExamHistory_IdOrderBySeqAsc(history.getId());

        // 총 응시 횟수 집계
        long attemptCount = examHistoryRepository.countByUser_IdAndExamination_Id(user.getId(), examinationId);

        // 구버전 이력(detail 없음)이어도 예외 없이 빈 결과 반환
        return ExamHistoryDetailResponse.of(history, details, attemptCount);
    }
}
