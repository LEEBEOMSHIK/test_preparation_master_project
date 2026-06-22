package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.response.DailyStatResponse;
import com.tpmp.testprep.dto.response.DomainStatResponse;
import com.tpmp.testprep.dto.response.QuizDailyStatResponse;
import com.tpmp.testprep.dto.response.QuizDomainStatResponse;
import com.tpmp.testprep.dto.response.UserDashboardResponse;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.ExamHistoryRepository;
import com.tpmp.testprep.repository.QuizHistoryRepository;
import com.tpmp.testprep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserDashboardService {

    private static final int WEAK_DOMAIN_TOP_N = 5;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final UserRepository userRepository;
    private final ExamHistoryRepository examHistoryRepository;
    private final QuizHistoryRepository quizHistoryRepository;

    /**
     * 사용자 통계 대시보드 조회.
     * - 정답률(총 문항·정답·도메인별·날짜별) = 시험 이력 전용
     * - 퀴즈 풀이량(총 문항·도메인별·날짜별) = 퀴즈 이력 별도 집계
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

        // ── 시험 전용: 총 문항 / 총 정답 ──────────────────────────
        Object[] examTotals = normalizeSingleAggregateRow(
                examHistoryRepository.sumTotalAndCorrectByUserAndPeriod(user.getId(), from));

        long totalQuestions = longValueAt(examTotals, 0);
        long totalCorrect   = longValueAt(examTotals, 1);
        double overallRate  = totalQuestions > 0 ? totalCorrect * 100.0 / totalQuestions : 0.0;

        // ── 시험 전용: 도메인별 정답률 ────────────────────────────
        Map<String, long[]> domainMap = new LinkedHashMap<>();

        examHistoryRepository.aggregateDomainStatsByUserAndPeriod(user.getId(), from)
                .stream()
                .filter(row -> row[0] != null)
                .forEach(row -> {
                    String name    = (String) row[0];
                    long   total   = ((Number) row[1]).longValue();
                    long   correct = ((Number) row[2]).longValue();
                    domainMap.merge(name, new long[]{total, correct},
                            (a, b) -> new long[]{a[0] + b[0], a[1] + b[1]});
                });

        // 정답률 ASC 정렬
        List<DomainStatResponse> domainStats = domainMap.entrySet().stream()
                .map(e -> {
                    long   t    = e.getValue()[0];
                    long   c    = e.getValue()[1];
                    double rate = t > 0 ? c * 100.0 / t : 0.0;
                    return new DomainStatResponse(e.getKey(), t, c, rate);
                })
                .sorted(Comparator.comparingDouble(DomainStatResponse::correctRate))
                .collect(Collectors.toList());

        // 약점 도메인 Top N
        List<DomainStatResponse> weakDomains = domainStats.stream()
                .limit(WEAK_DOMAIN_TOP_N)
                .collect(Collectors.toList());

        // ── 시험 전용: 날짜별 정답률 추이 ─────────────────────────
        Map<String, long[]> dailyMap = new LinkedHashMap<>();

        examHistoryRepository.aggregateDailyStatsByUserAndPeriod(user.getId(), from)
                .stream()
                .filter(row -> row[0] != null)
                .forEach(row -> {
                    String dateStr = toDateString(row[0]);
                    long   total   = ((Number) row[1]).longValue();
                    long   correct = ((Number) row[2]).longValue();
                    dailyMap.merge(dateStr, new long[]{total, correct},
                            (a, b) -> new long[]{a[0] + b[0], a[1] + b[1]});
                });

        // 날짜 ASC 정렬
        List<DailyStatResponse> dailyTrend = dailyMap.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> {
                    long   t    = e.getValue()[0];
                    long   c    = e.getValue()[1];
                    double rate = t > 0 ? c * 100.0 / t : 0.0;
                    return new DailyStatResponse(e.getKey(), t, c, rate);
                })
                .collect(Collectors.toList());

        // ── 퀴즈 전용: 총 풀이 문항 수 ───────────────────────────
        Object[] quizTotals = normalizeSingleAggregateRow(
                quizHistoryRepository.sumTotalAndCorrectByUserAndPeriod(user.getId(), from));
        long quizTotalQuestions = longValueAt(quizTotals, 0);

        // ── 퀴즈 전용: 도메인별 풀이량 (풀이수 내림차순) ─────────
        List<QuizDomainStatResponse> quizDomainStats = quizHistoryRepository
                .aggregateDomainStatsByUserAndPeriod(user.getId(), from)
                .stream()
                .filter(row -> row[0] != null)
                .map(row -> new QuizDomainStatResponse(
                        (String) row[0],
                        ((Number) row[1]).longValue()
                ))
                .sorted(Comparator.comparingLong(QuizDomainStatResponse::totalQuestions).reversed())
                .collect(Collectors.toList());

        // ── 퀴즈 전용: 날짜별 풀이량 (날짜 ASC) ──────────────────
        List<QuizDailyStatResponse> quizDailyStats = quizHistoryRepository
                .aggregateDailyStatsByUserAndPeriod(user.getId(), from)
                .stream()
                .filter(row -> row[0] != null)
                .collect(Collectors.toMap(
                        row -> toDateString(row[0]),
                        row -> ((Number) row[1]).longValue(),
                        Long::sum,
                        java.util.TreeMap::new
                ))
                .entrySet().stream()
                .map(e -> new QuizDailyStatResponse(e.getKey(), e.getValue()))
                .collect(Collectors.toList());

        return new UserDashboardResponse(
                totalQuestions,
                totalCorrect,
                overallRate,
                domainStats,
                weakDomains,
                dailyTrend,
                quizTotalQuestions,
                quizDomainStats,
                quizDailyStats
        );
    }

    // ── 헬퍼 ────────────────────────────────────────────────────────

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

    private String toDateString(Object dateVal) {
        if (dateVal instanceof java.sql.Date sqlDate) {
            return sqlDate.toLocalDate().format(DATE_FORMATTER);
        } else if (dateVal instanceof LocalDate localDate) {
            return localDate.format(DATE_FORMATTER);
        } else {
            return dateVal.toString().substring(0, 10);
        }
    }
}
