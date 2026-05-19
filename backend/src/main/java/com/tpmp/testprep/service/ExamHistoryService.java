package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.response.ExamHistoryResponse;
import com.tpmp.testprep.dto.response.PagedResponse;
import com.tpmp.testprep.entity.ExamHistory;
import com.tpmp.testprep.repository.ExamHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExamHistoryService {

    private final ExamHistoryRepository examHistoryRepository;

    public PagedResponse<ExamHistoryResponse> getExamHistories(
            String keyword, String type, LocalDate from, LocalDate to, Pageable pageable) {

        LocalDateTime fromDt = (from != null ? from : LocalDate.of(2000, 1, 1)).atStartOfDay();
        LocalDateTime toDt = (to != null ? to : LocalDate.now()).atTime(LocalTime.MAX);

        Page<ExamHistory> page;
        if (keyword == null || keyword.isBlank()) {
            page = examHistoryRepository.findByTakenAtBetween(fromDt, toDt, pageable);
        } else {
            page = switch (type) {
                case "email" -> examHistoryRepository.findByUser_EmailContainingIgnoreCaseAndTakenAtBetween(keyword, fromDt, toDt, pageable);
                case "exam"  -> examHistoryRepository.findByExamination_TitleContainingIgnoreCaseAndTakenAtBetween(keyword, fromDt, toDt, pageable);
                default      -> examHistoryRepository.findByUser_NameContainingIgnoreCaseAndTakenAtBetween(keyword, fromDt, toDt, pageable);
            };
        }

        long total = page.getTotalElements();
        AtomicLong counter = new AtomicLong(total - (long) pageable.getPageNumber() * pageable.getPageSize());

        Page<ExamHistoryResponse> mapped = page.map(h -> ExamHistoryResponse.from(h, counter.getAndDecrement()));
        return PagedResponse.from(mapped);
    }

    public long countTodayExamAttempts() {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = LocalDate.now().atTime(LocalTime.MAX);
        return examHistoryRepository.countByTakenAtBetween(start, end);
    }
}
