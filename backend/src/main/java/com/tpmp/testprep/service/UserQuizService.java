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
import com.tpmp.testprep.entity.support.SqlData;
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
     *  categoryId가 null이면 카테고리 구분 없는 AI 커스텀 통합 출제 진입이다 — 이때 normalizedSource가
     *  null(=필터 없음)이면 전체 문항 무제한 랜덤 출제가 되어버리므로 반드시 거부한다.
     *  language: CODE 유형 문항만 대상으로 하는 언어 필터(java/python/c 등, 소문자 코드).
     *  source: 문항 출처 필터 — "EXAM"(기출) 또는 "AI_CUSTOM"(AI 커스텀). 그 외 값·null·공백·"ALL"(대소문자 무시)이면 필터 없이 전체 반환.
     *  excludeIds: 쉼표 구분 문항 ID 목록 — 세션 내 이전 라운드 출제 문항을 다음 라운드에서 제외(데일리 퀴즈
     *              라운드 간 중복 방지). 비정상 토큰은 무시하고 최대 500개까지만 반영, 빈 목록이면 기존 경로 그대로. */
    public List<QuizQuestionView> getQuizQuestions(Long categoryId, int limit, String language, String source, String excludeIds) {
        String normalizedLanguage = (language == null || language.isBlank() || "ALL".equalsIgnoreCase(language))
                ? null : language.trim();
        String normalizedSource = normalizeSource(source);
        List<Long> excludeIdList = parseExcludeIds(excludeIds);
        int normalizedLimit = Math.min(limit, 30);

        List<QuestionBank> questions;
        if (categoryId == null) {
            if (normalizedSource == null) {
                throw new BusinessException(ErrorCode.INVALID_INPUT);
            }
            questions = excludeIdList.isEmpty()
                    ? questionBankRepository.findRandomBySourceOnly(
                            normalizedLimit, normalizedLanguage, normalizedSource)
                    : questionBankRepository.findRandomBySourceOnlyExcluding(
                            normalizedLimit, normalizedLanguage, normalizedSource, excludeIdList);
        } else {
            questions = excludeIdList.isEmpty()
                    ? questionBankRepository.findRandomByCategory(
                            categoryId, normalizedLimit, normalizedLanguage, normalizedSource)
                    : questionBankRepository.findRandomByCategoryExcluding(
                            categoryId, normalizedLimit, normalizedLanguage, normalizedSource, excludeIdList);
        }
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

    /** "1,2,3" 형태의 쉼표 구분 ID 문자열을 List&lt;Long&gt;으로 파싱 — 공백·빈 토큰·숫자가 아닌 토큰은
     *  무시, 중복 제거 후 최대 500개까지만 반영(과도한 IN 절 길이로 인한 쿼리 성능 저하 방지). */
    private List<Long> parseExcludeIds(String excludeIds) {
        if (excludeIds == null || excludeIds.isBlank()) return List.of();
        return Arrays.stream(excludeIds.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(this::parseLongOrNull)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .limit(500)
                .collect(Collectors.toList());
    }

    private Long parseLongOrNull(String s) {
        try {
            return Long.parseLong(s);
        } catch (NumberFormatException e) {
            return null;
        }
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
     *
     * <p>채점 우선순위: 보기(options)가 있으면(유형 무관) 항상 기존 4-인자 번호 채점을 그대로
     * 유지한다(전역 불변식). 보기가 없고 SQL 유형이며 sqlData.expectedResult가 존재하면 결과
     * 테이블 채점({@link AnswerGrader#isSqlResultTableCorrect})으로 분기한다. 그 외에는 기존
     * 텍스트 비교 채점을 그대로 따른다.
     */
    public CheckResult checkAnswer(CheckRequest request, String email) {
        QuestionBank qb = questionBankRepository.findById(request.questionId())
                .filter(q -> "N".equals(q.getDelYn()))
                .orElseThrow(() -> new BusinessException(ErrorCode.QUESTION_NOT_FOUND));

        SqlData sqlData = qb.getSqlData();
        SqlData.SqlExpectedResult sqlExpectedResult =
                qb.getQuestionType() == QuestionBank.QuestionType.SQL && sqlData != null
                        ? sqlData.expectedResult() : null;

        boolean correct;
        if (sqlExpectedResult != null && !AnswerGrader.hasMeaningfulOptions(qb.getOptions())) {
            correct = AnswerGrader.isSqlResultTableCorrect(sqlExpectedResult, request.userAnswer());
        } else {
            correct = AnswerGrader.isCorrect(
                    qb.getQuestionType().name(), qb.getAnswer(), request.userAnswer(), qb.getOptions(),
                    qb.isDisableAlternativeAnswer());
        }

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

        return new CheckResult(correct, qb.getAnswer(), qb.getExplanation(), qb.isDisableAlternativeAnswer());
    }
}
