package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.response.ExaminationDetailResponse;
import com.tpmp.testprep.dto.response.ExaminationResponse;
import com.tpmp.testprep.dto.response.ExaminationSubmitResponse;
import com.tpmp.testprep.dto.response.QuestionResultResponse;
import com.tpmp.testprep.entity.Exam;
import com.tpmp.testprep.entity.ExamHistory;
import com.tpmp.testprep.entity.Examination;
import com.tpmp.testprep.entity.Question;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
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

    /** 시험 제출·채점·이력 저장 */
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
            String userAnswer = answers.getOrDefault(q.getId(), "");
            boolean isCorrect = !userAnswer.isEmpty() && q.getAnswer() != null
                    && userAnswer.trim().equalsIgnoreCase(q.getAnswer().trim());
            if (isCorrect) correct++;
            results.add(QuestionResultResponse.of(q, userAnswer, isCorrect));
        }
        int score = total > 0 ? (int) Math.round(correct * 100.0 / total) : 0;

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        examHistoryRepository.save(ExamHistory.builder()
                .user(user)
                .examination(examination)
                .totalQuestions(total)
                .correctCount(correct)
                .score((double) score)
                .build());

        return ExaminationSubmitResponse.of(total, correct, score, results);
    }
}
