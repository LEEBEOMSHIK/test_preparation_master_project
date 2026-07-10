package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.CheckRequest;
import com.tpmp.testprep.dto.response.CheckResult;
import com.tpmp.testprep.dto.response.DomainMasterResponse;
import com.tpmp.testprep.dto.response.DomainSlaveResponse;
import com.tpmp.testprep.dto.response.QuizQuestionView;
import com.tpmp.testprep.entity.DomainMaster;
import com.tpmp.testprep.entity.DomainSlave;
import com.tpmp.testprep.entity.QuestionBank;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.entity.UserQuestionBookmark;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.DomainMasterRepository;
import com.tpmp.testprep.repository.QuestionBankRepository;
import com.tpmp.testprep.repository.UserQuestionBookmarkRepository;
import com.tpmp.testprep.repository.UserRepository;
import com.tpmp.testprep.service.support.AnswerGrader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserQuizService {

    private final DomainMasterRepository domainMasterRepository;
    private final QuestionBankRepository questionBankRepository;
    private final UserRepository userRepository;
    private final QuizHistoryRecorder quizHistoryRecorder;
    private final UserQuestionBookmarkRepository userQuestionBookmarkRepository;

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

        // CODE 유형 문항이 존재하는 문제 유형(category) ID — 프로그래밍 언어 필터 노출 여부 판단용
        Set<Long> codeCategoryIds = new HashSet<>(
                questionBankRepository.findDistinctCategoryIdsByQuestionType(QuestionBank.QuestionType.CODE));

        // AI 커스텀 문항이 존재하는 문제 유형(category) ID — 출처 필터 노출 여부 판단용
        Set<Long> aiCustomCategoryIds = new HashSet<>(
                questionBankRepository.findDistinctCategoryIdsWithAiCustomQuestions());

        return allMasters.stream()
                .map(m -> {
                    if ("QUESTION_TYPE".equals(m.getCode())) {
                        List<DomainSlaveResponse> slaves = m.getSlaves().stream()
                                .filter(s -> finalAllowedIds == null || finalAllowedIds.contains(s.getId()))
                                .map(s -> DomainSlaveResponse.from(s, codeCategoryIds.contains(s.getId()), aiCustomCategoryIds.contains(s.getId())))
                                .toList();
                        return new DomainMasterResponse(m.getId(), m.getCode(), m.getName(), slaves);
                    }
                    return DomainMasterResponse.from(m);
                })
                .toList();
    }

    /** 카테고리별 랜덤 퀴즈 문항 (최대 30개)
     *  language: CODE 유형 문항만 대상으로 하는 언어 필터(java/python/c 등, 소문자 코드).
     *  source: 문항 출처 필터 — "EXAM"(기출) 또는 "AI_CUSTOM"(AI 커스텀). 그 외 값·null·공백·"ALL"(대소문자 무시)이면 필터 없이 전체 반환. */
    public List<QuizQuestionView> getQuizQuestions(Long categoryId, int limit, String language, String source) {
        String normalizedLanguage = (language == null || language.isBlank() || "ALL".equalsIgnoreCase(language))
                ? null : language.trim();
        String normalizedSource = normalizeSource(source);
        List<QuestionBank> questions =
                questionBankRepository.findRandomByCategory(categoryId, Math.min(limit, 30), normalizedLanguage, normalizedSource);
        return questions.stream().map(QuizQuestionView::from).toList();
    }

    private String normalizeSource(String source) {
        if (source == null) return null;
        String trimmed = source.trim();
        if (trimmed.isEmpty() || "ALL".equalsIgnoreCase(trimmed)) return null;
        if ("AI_CUSTOM".equalsIgnoreCase(trimmed)) return "AI_CUSTOM";
        if ("EXAM".equalsIgnoreCase(trimmed)) return "EXAM";
        return null; // 그 외 값은 무시(필터 없음)
    }

    /** 사용자가 복습 표시(북마크)한 문항 전체를 퀴즈 재풀이용으로 반환 — 정답 미노출, 최신순, 상한 100 */
    public List<QuizQuestionView> getBookmarkedQuestions(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return userQuestionBookmarkRepository.findAllByUserIdWithQuestion(user.getId())
                .stream()
                .map(UserQuestionBookmark::getQuestionBank)
                .limit(100)
                .map(QuizQuestionView::from)
                .toList();
    }

    /**
     * 단건 채점 + 이력 영속화.
     *
     * <p>이력 저장은 {@link QuizHistoryRecorder#record}의 REQUIRES_NEW 트랜잭션에 위임한다.
     * 저장 실패 시 내부 트랜잭션만 롤백되고 현재 readOnly 트랜잭션은 영향받지 않으므로
     * UnexpectedRollbackException 없이 채점 결과를 정상 반환할 수 있다.
     * (메서드 레벨 @Transactional 쓰기 어노테이션 제거 — 저장은 REQUIRES_NEW 컴포넌트 담당)
     */
    public CheckResult checkAnswer(CheckRequest request, String email) {
        QuestionBank qb = questionBankRepository.findById(request.questionId())
                .filter(q -> "N".equals(q.getDelYn()))
                .orElseThrow(() -> new BusinessException(ErrorCode.QUESTION_NOT_FOUND));

        boolean correct = AnswerGrader.isCorrect(
                qb.getQuestionType().name(), qb.getAnswer(), request.userAnswer(), qb.getOptions());

        // 스칼라 값 먼저 추출 — readOnly tx 내에서 LAZY 접근 가능, recorder에는 id만 전달
        Long userId = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND))
                .getId();

        DomainSlave category = qb.getCategory();
        Long categoryId   = category != null ? category.getId()   : null;
        String domainName = category != null ? category.getName() : null;

        // REQUIRES_NEW 독립 트랜잭션으로 이력 저장 — 실패해도 채점 결과 정상 반환
        try {
            quizHistoryRecorder.record(userId, qb.getId(), categoryId, domainName,
                    qb.getQuestionType().name(), request.userAnswer(), correct);
        } catch (Exception e) {
            log.warn("[QuizHistory] 이력 저장 실패 (questionBankId={}, email={}): {}",
                    request.questionId(), email, e.getMessage());
        }

        return new CheckResult(correct, qb.getAnswer(), qb.getExplanation());
    }
}
