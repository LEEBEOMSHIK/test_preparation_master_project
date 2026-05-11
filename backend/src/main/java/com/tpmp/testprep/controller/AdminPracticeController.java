package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.entity.PracticeHistory;
import com.tpmp.testprep.repository.PracticeHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/admin/practice")
@RequiredArgsConstructor
public class AdminPracticeController {

    private final PracticeHistoryRepository practiceHistoryRepository;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /** 연습장 SQL 실행 기록 조회 (페이지네이션, 이메일 필터) */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<HistoryPageResponse>> getHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String email) {

        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<PracticeHistory> historyPage = (email != null && !email.isBlank())
                ? practiceHistoryRepository.findByUserEmailContainingIgnoreCaseOrderByExecutedAtDesc(email.trim(), pageable)
                : practiceHistoryRepository.findAllByOrderByExecutedAtDesc(pageable);

        List<HistoryDto> content = historyPage.getContent().stream()
                .map(h -> new HistoryDto(
                        h.getId(),
                        h.getUserEmail(),
                        h.getSqlContent(),
                        h.getResultType(),
                        h.getRowCount(),
                        h.getErrorMessage(),
                        h.getExecutedAt().format(FMT)))
                .toList();

        return ResponseEntity.ok(ApiResponse.success(
                new HistoryPageResponse(content, historyPage.getTotalElements(),
                        historyPage.getTotalPages(), page)));
    }

    /** 연습장 운영 규칙 조회 */
    @GetMapping("/rules")
    public ResponseEntity<ApiResponse<PracticeRulesResponse>> getRules() {
        return ResponseEntity.ok(ApiResponse.success(PracticeRulesResponse.defaults()));
    }

    // ── Records ─────────────────────────────────────────────────────────────

    public record HistoryDto(
            Long id, String userEmail, String sqlContent,
            String resultType, Integer rowCount, String errorMessage, String executedAt) {}

    public record HistoryPageResponse(
            List<HistoryDto> content, long totalElements, int totalPages, int currentPage) {}

    public record TypoPattern(String typo, String correction) {}

    public record PracticeRulesResponse(
            List<String> blockedCommands,
            String allowedTablePrefix,
            String multiStatementRule,
            List<TypoPattern> typoPatterns) {

        public static PracticeRulesResponse defaults() {
            return new PracticeRulesResponse(
                    List.of("DROP DATABASE", "DROP SCHEMA", "TRUNCATE"),
                    "prac_",
                    "하나의 SQL 문만 실행 가능 (멀티 스테이트먼트 불가)",
                    List.of(
                            new TypoPattern("CREATE TALBE", "CREATE TABLE"),
                            new TypoPattern("SLECT / SELCT", "SELECT"),
                            new TypoPattern("SELECT ... FORM", "FROM"),
                            new TypoPattern("INSERT INOT / ITNO", "INSERT INTO"),
                            new TypoPattern("UPDTAE / UPDTE", "UPDATE"),
                            new TypoPattern("DELETE FORM / DELTE", "DELETE FROM / DELETE"),
                            new TypoPattern("GRUOP BY / GROP BY", "GROUP BY"),
                            new TypoPattern("ORDRER BY", "ORDER BY"),
                            new TypoPattern("WHER (E 누락)", "WHERE"),
                            new TypoPattern("JION", "JOIN")
                    )
            );
        }
    }
}
