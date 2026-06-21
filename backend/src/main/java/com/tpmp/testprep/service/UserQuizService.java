package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.CheckRequest;
import com.tpmp.testprep.dto.response.CheckResult;
import com.tpmp.testprep.dto.response.DomainMasterResponse;
import com.tpmp.testprep.dto.response.DomainSlaveResponse;
import com.tpmp.testprep.dto.response.QuizQuestionView;
import com.tpmp.testprep.entity.DomainMaster;
import com.tpmp.testprep.entity.QuestionBank;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.DomainMasterRepository;
import com.tpmp.testprep.repository.QuestionBankRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserQuizService {

    private final DomainMasterRepository domainMasterRepository;
    private final QuestionBankRepository questionBankRepository;

    /** 퀴즈 카테고리 목록 (문제 유형 / 시험 유형 도메인만 반환) */
    public List<DomainMasterResponse> getCategories(String examTypeIds) {
        List<Long> examTypeIdList = null;
        if (examTypeIds != null && !examTypeIds.isBlank()) {
            examTypeIdList = Arrays.stream(examTypeIds.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Long::parseLong)
                    .collect(Collectors.toList());
        }

        List<String> quizMasterNames = List.of("문제 유형", "시험 유형");
        List<DomainMaster> allMasters = domainMasterRepository.findAllWithSlaves().stream()
                .filter(m -> quizMasterNames.contains(m.getName()))
                .toList();

        Set<Long> allowedCategoryIds = null;
        if (examTypeIdList != null && !examTypeIdList.isEmpty()) {
            allowedCategoryIds = new HashSet<>(
                    questionBankRepository.findDistinctCategoryIdsByExamTypeIds(examTypeIdList));
        }
        final Set<Long> finalAllowedIds = allowedCategoryIds;

        return allMasters.stream()
                .map(m -> {
                    if (finalAllowedIds != null && "QUESTION_TYPE".equals(m.getCode())) {
                        List<DomainSlaveResponse> filtered = m.getSlaves().stream()
                                .filter(s -> finalAllowedIds.contains(s.getId()))
                                .map(DomainSlaveResponse::from)
                                .toList();
                        return new DomainMasterResponse(m.getId(), m.getCode(), m.getName(), filtered);
                    }
                    return DomainMasterResponse.from(m);
                })
                .toList();
    }

    /** 카테고리별 랜덤 퀴즈 문항 (최대 30개) */
    public List<QuizQuestionView> getQuizQuestions(Long categoryId, int limit) {
        List<QuestionBank> questions =
                questionBankRepository.findRandomByCategory(categoryId, Math.min(limit, 30));
        return questions.stream().map(QuizQuestionView::from).toList();
    }

    /** 단건 채점 */
    public CheckResult checkAnswer(CheckRequest request) {
        QuestionBank qb = questionBankRepository.findById(request.questionId())
                .filter(q -> "N".equals(q.getDelYn()))
                .orElseThrow(() -> new BusinessException(ErrorCode.QUESTION_NOT_FOUND));
        boolean correct = qb.getAnswer() != null
                && qb.getAnswer().trim().equalsIgnoreCase(request.userAnswer().trim());
        return new CheckResult(correct, qb.getAnswer(), qb.getExplanation());
    }
}
