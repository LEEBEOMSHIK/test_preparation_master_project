package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.response.LoginHistoryResponse;
import com.tpmp.testprep.dto.response.PagedResponse;
import com.tpmp.testprep.entity.LoginHistory;
import com.tpmp.testprep.repository.LoginHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LoginHistoryService {

    private final LoginHistoryRepository loginHistoryRepository;

    @Transactional
    public void recordLogin(String memberName, String email, String ipAddress, String userAgent) {
        loginHistoryRepository.save(LoginHistory.builder()
                .memberName(memberName)
                .email(email)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build());
    }

    public PagedResponse<LoginHistoryResponse> getLoginHistories(
            String keyword, String type, LocalDate from, LocalDate to, Pageable pageable) {

        LocalDateTime fromDt = from != null ? from.atStartOfDay() : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime toDt = to != null ? to.plusDays(1).atStartOfDay() : LocalDateTime.now().plusDays(1);

        Page<LoginHistory> page;
        if (keyword != null && !keyword.isBlank()) {
            page = switch (type != null ? type : "") {
                case "name"  -> loginHistoryRepository.findByMemberNameContainingIgnoreCaseAndLoginAtBetween(keyword, fromDt, toDt, pageable);
                case "email" -> loginHistoryRepository.findByEmailContainingIgnoreCaseAndLoginAtBetween(keyword, fromDt, toDt, pageable);
                case "ip"    -> loginHistoryRepository.findByIpAddressContainingAndLoginAtBetween(keyword, fromDt, toDt, pageable);
                default      -> loginHistoryRepository.findByLoginAtBetween(fromDt, toDt, pageable);
            };
        } else {
            page = loginHistoryRepository.findByLoginAtBetween(fromDt, toDt, pageable);
        }

        long total = page.getTotalElements();
        int pageNum = page.getNumber();
        int pageSize = page.getSize();
        AtomicLong counter = new AtomicLong(total - (long) pageNum * pageSize);

        Page<LoginHistoryResponse> mapped = page.map(h -> LoginHistoryResponse.from(h, counter.getAndDecrement()));
        return PagedResponse.from(mapped);
    }

    public long countTodayLogins() {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = start.plusDays(1);
        return loginHistoryRepository.countByLoginAtBetween(start, end);
    }
}
