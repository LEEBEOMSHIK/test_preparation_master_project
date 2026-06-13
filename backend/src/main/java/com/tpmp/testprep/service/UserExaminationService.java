package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.response.ExamHistoryDetailResponse;
import com.tpmp.testprep.dto.response.ExaminationDetailResponse;
import com.tpmp.testprep.dto.response.ExaminationResponse;
import com.tpmp.testprep.dto.response.ExaminationSubmitResponse;
import com.tpmp.testprep.dto.response.QuestionResultResponse;
import com.tpmp.testprep.entity.Exam;
import com.tpmp.testprep.entity.ExamHistory;
import com.tpmp.testprep.entity.ExamHistoryDetail;
import com.tpmp.testprep.entity.Examination;
import com.tpmp.testprep.entity.Question;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.ExamHistoryDetailRepository;
import com.tpmp.testprep.repository.ExamHistoryRepository;
import com.tpmp.testprep.repository.ExaminationRepository;
import com.tpmp.testprep.repository.QuestionRepository;
import com.tpmp.testprep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

        List<Question> questions = questionRepository.findByExamIdOrderBySeqAsc(
                examination.getExamPaper().getId()
        );
        int total = questions.size();
        int correct = 0;
        List<QuestionResultResponse> results = new ArrayList<>();

        for (Question q : questions) {
            String raw = answers.getOrDefault(q.getId(), "");
            String userAnswer = raw.isEmpty() ? null : raw;
            boolean isCorrect = userAnswer != null && q.getAnswer() != null
                    && userAnswer.trim().equalsIgnoreCase(q.getAnswer().trim());
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
            boolean isCorrect = userAnswer != null && q.getAnswer() != null
                    && userAnswer.trim().equalsIgnoreCase(q.getAnswer().trim());

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
                    .build();
            history.addDetail(detail);
        }

        ExamHistory saved = examHistoryRepository.save(history);

        return ExaminationSubmitResponse.of(total, correct, score, results, saved.getId());
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

        // 구버전 이력(detail 없음)이어도 예외 없이 빈 결과 반환
        return ExamHistoryDetailResponse.of(history, details);
    }
}
