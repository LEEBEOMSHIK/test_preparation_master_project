package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.response.DailyStatResponse;
import com.tpmp.testprep.dto.response.DomainStatResponse;
import com.tpmp.testprep.dto.response.UserDashboardResponse;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.ExamHistoryRepository;
import com.tpmp.testprep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserDashboardService {

    private static final int WEAK_DOMAIN_TOP_N = 5;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final UserRepository userRepository;
    private final ExamHistoryRepository examHistoryRepository;

    /**
     * 사용자 통계 대시보드 조회.
     *
     * @param email 현재 인증 사용자 이메일
     * @param days  집계 기간 (7·30 → 최근 N일, 0 → 전체)
     */
    public UserDashboardResponse getDashboard(String email, int days) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        LocalDateTime from = (days == 0)
                ? LocalDateTime.of(2000, 1, 1, 0, 0)
                : LocalDateTime.now().minusDays(days);

        // ── 총 문항 / 총 정답 ──────────────────────────────────
        Object[] totals = normalizeSingleAggregateRow(
                examHistoryRepository.sumTotalAndCorrectByUserAndPeriod(user.getId(), from)
        );
        long totalQuestions = longValueAt(totals, 0);
        long totalCorrect   = longValueAt(totals, 1);
        double overallRate  = totalQuestions > 0 ? totalCorrect * 100.0 / totalQuestions : 0.0;

        // ── 도메인별 집계 ──────────────────────────────────────
        List<DomainStatResponse> domainStats = examHistoryRepository
                .aggregateDomainStatsByUserAndPeriod(user.getId(), from)
                .stream()
                .filter(row -> row[0] != null)          // null domainName 방어
                .map(row -> {
                    String name  = (String) row[0];
                    long   total = ((Number) row[1]).longValue();
                    long   correct = ((Number) row[2]).longValue();
                    double rate  = total > 0 ? correct * 100.0 / total : 0.0;
                    return new DomainStatResponse(name, total, correct, rate);
                })
                .collect(Collectors.toList());

        // ── 약점 도메인 Top N (정답률 ASC → 이미 정렬된 결과에서 앞 N개) ──
        List<DomainStatResponse> weakDomains = domainStats.stream()
                .limit(WEAK_DOMAIN_TOP_N)
                .collect(Collectors.toList());

        // ── 날짜별 추이 ────────────────────────────────────────
        List<DailyStatResponse> dailyTrend = examHistoryRepository
                .aggregateDailyStatsByUserAndPeriod(user.getId(), from)
                .stream()
                .filter(row -> row[0] != null)
                .map(row -> {
                    // CAST(takenAt AS date) → java.sql.Date 또는 LocalDate
                    String dateStr;
                    Object dateVal = row[0];
                    if (dateVal instanceof java.sql.Date sqlDate) {
                        dateStr = sqlDate.toLocalDate().format(DATE_FORMATTER);
                    } else if (dateVal instanceof LocalDate localDate) {
                        dateStr = localDate.format(DATE_FORMATTER);
                    } else {
                        dateStr = dateVal.toString().substring(0, 10);
                    }
                    long total   = ((Number) row[1]).longValue();
                    long correct = ((Number) row[2]).longValue();
                    double rate  = total > 0 ? correct * 100.0 / total : 0.0;
                    return new DailyStatResponse(dateStr, total, correct, rate);
                })
                .collect(Collectors.toList());

        return new UserDashboardResponse(
                totalQuestions,
                totalCorrect,
                overallRate,
                domainStats,
                weakDomains,
                dailyTrend
        );
    }

    /**
     * 단일 행 다중 컬럼 집계 쿼리(Object[] 반환)는 Hibernate 버전/경로에 따라
     * 행이 한 번 더 감싸진 형태({@code [[sum1, sum2]]})로 반환될 수 있다.
     * 이 경우 내부 배열을 꺼내 일관되게 처리한다.
     */
    private Object[] normalizeSingleAggregateRow(Object[] row) {
        if (row == null || row.length == 0) {
            return new Object[0];
        }
        if (row.length == 1 && row[0] instanceof Object[] nestedRow) {
            return nestedRow;
        }
        return row;
    }

    private long longValueAt(Object[] row, int index) {
        if (row.length <= index || row[index] == null) {
            return 0L;
        }
        return ((Number) row[index]).longValue();
    }
}
