package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.response.PagedResponse;
import com.tpmp.testprep.dto.response.QuizHistoryResponse;
import com.tpmp.testprep.entity.QuestionBank;
import com.tpmp.testprep.entity.QuizHistory;
import com.tpmp.testprep.repository.QuestionBankRepository;
import com.tpmp.testprep.repository.QuizHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuizHistoryService {

    private final QuizHistoryRepository quizHistoryRepository;
    private final QuestionBankRepository questionBankRepository;

    /** 관리자 퀴즈 이력 목록 — 시험 이력 관리(ExamHistoryService.getExamHistories)와 동일한 검색·페이징 패턴 */
    public PagedResponse<QuizHistoryResponse> getQuizHistories(
            String keyword, String type, LocalDate from, LocalDate to, Pageable pageable) {

        LocalDateTime fromDt = (from != null ? from : LocalDate.of(2000, 1, 1)).atStartOfDay();
        LocalDateTime toDt = (to != null ? to : LocalDate.now()).atTime(LocalTime.MAX);

        Page<QuizHistory> page;
        if (keyword == null || keyword.isBlank()) {
            page = quizHistoryRepository.findByCreatedAtBetween(fromDt, toDt, pageable);
        } else {
            page = switch (type) {
                case "email" -> quizHistoryRepository.findByUser_EmailContainingIgnoreCaseAndCreatedAtBetween(keyword, fromDt, toDt, pageable);
                case "domain" -> quizHistoryRepository.findByDomainNameContainingIgnoreCaseAndCreatedAtBetween(keyword, fromDt, toDt, pageable);
                default -> quizHistoryRepository.findByUser_NameContainingIgnoreCaseAndCreatedAtBetween(keyword, fromDt, toDt, pageable);
            };
        }

        // 문항은행 원본은 FK 없이 ID만 보존(문항 삭제돼도 이력 유지)되므로 페이지 내 ID만 일괄 조회
        List<Long> questionBankIds = page.getContent().stream()
                .map(QuizHistory::getQuestionBankId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        Map<Long, QuestionBank> questionBankById = questionBankRepository.findAllById(questionBankIds).stream()
                .collect(Collectors.toMap(QuestionBank::getId, Function.identity()));

        long total = page.getTotalElements();
        AtomicLong counter = new AtomicLong(total - (long) pageable.getPageNumber() * pageable.getPageSize());

        Page<QuizHistoryResponse> mapped = page.map(h -> QuizHistoryResponse.from(
                h, counter.getAndDecrement(), questionBankById.get(h.getQuestionBankId())));
        return PagedResponse.from(mapped);
    }
}
