package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.entity.DialectConversionRule;
import com.tpmp.testprep.entity.PracticeHistory;
import com.tpmp.testprep.repository.DialectConversionRuleRepository;
import com.tpmp.testprep.repository.PracticeHistoryRepository;
import com.tpmp.testprep.service.PracticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/practice")
@RequiredArgsConstructor
public class AdminPracticeController {

    private final PracticeHistoryRepository practiceHistoryRepository;
    private final DialectConversionRuleRepository conversionRuleRepository;
    private final PracticeService practiceService;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /** 연습장 SQL 실행 기록 조회 (페이지네이션, 복합 필터) */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<HistoryPageResponse>> getHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String sqlContent,
            @RequestParam(required = false) String resultType,
            @RequestParam(required = false) String dialect,
            @RequestParam(required = false) String date) {

        String emailParam   = (email != null && !email.isBlank()) ? email.trim() : null;
        String sqlParam     = (sqlContent != null && !sqlContent.isBlank()) ? sqlContent.trim() : null;
        String typeParam    = (resultType != null && !resultType.isBlank()) ? resultType.trim() : null;
        String dialectParam = (dialect != null && !dialect.isBlank()) ? dialect.trim() : null;

        LocalDateTime startDate = null, endDate = null;
        if (date != null && !date.isBlank()) {
            try {
                LocalDate d = LocalDate.parse(date.trim());
                startDate = d.atStartOfDay();
                endDate   = d.plusDays(1).atStartOfDay();
            } catch (DateTimeParseException ignored) {}
        }

        final LocalDateTime fStart = startDate;
        final LocalDateTime fEnd   = endDate;

        Specification<PracticeHistory> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (emailParam != null) {
                predicates.add(cb.like(cb.lower(root.get("userEmail")),
                        "%" + emailParam.toLowerCase() + "%"));
            }
            if (sqlParam != null) {
                predicates.add(cb.like(cb.lower(root.get("sqlContent")),
                        "%" + sqlParam.toLowerCase() + "%"));
            }
            if (typeParam != null) {
                predicates.add(cb.equal(root.get("resultType"), typeParam));
            }
            if (dialectParam != null) {
                predicates.add(cb.equal(root.get("dialect"), dialectParam));
            }
            if (fStart != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("executedAt"), fStart));
            }
            if (fEnd != null) {
                predicates.add(cb.lessThan(root.get("executedAt"), fEnd));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        var pageable = PageRequest.of(page, Math.min(size, 100),
                Sort.by(Sort.Direction.DESC, "executedAt"));
        Page<PracticeHistory> historyPage = practiceHistoryRepository.findAll(spec, pageable);

        List<HistoryDto> content = historyPage.getContent().stream()
                .map(h -> new HistoryDto(
                        h.getId(),
                        h.getUserEmail(),
                        h.getSqlContent(),
                        h.getResultType(),
                        h.getRowCount(),
                        h.getErrorMessage(),
                        h.getDialect() != null ? h.getDialect() : "postgresql",
                        h.getExecutedAt().format(FMT)))
                .toList();

        return ResponseEntity.ok(ApiResponse.success(
                new HistoryPageResponse(content, historyPage.getTotalElements(),
                        historyPage.getTotalPages(), page)));
    }

    /** 연습장 운영 규칙 조회 (변환 규칙 목록 포함) */
    @GetMapping("/rules")
    public ResponseEntity<ApiResponse<PracticeRulesResponse>> getRules() {
        List<DialectConversionRule> allRules = conversionRuleRepository.findAllByOrderByDialectAscDisplayOrderAsc();
        List<ConversionRuleDto> mysqlRules = allRules.stream()
                .filter(r -> "mysql".equals(r.getDialect()))
                .map(ConversionRuleDto::from)
                .collect(Collectors.toList());
        List<ConversionRuleDto> oracleRules = allRules.stream()
                .filter(r -> "oracle".equals(r.getDialect()))
                .map(ConversionRuleDto::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(PracticeRulesResponse.of(mysqlRules, oracleRules)));
    }

    /** 변환 규칙 활성화/비활성화 토글 */
    @PatchMapping("/conversion-rules/{id}/toggle")
    public ResponseEntity<ApiResponse<ConversionRuleDto>> toggleConversionRule(@PathVariable Long id) {
        DialectConversionRule rule = conversionRuleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("변환 규칙을 찾을 수 없습니다: " + id));
        rule.toggle();
        conversionRuleRepository.save(rule);
        practiceService.refreshRuleCache();
        return ResponseEntity.ok(ApiResponse.success(ConversionRuleDto.from(rule)));
    }

    // ── Records ─────────────────────────────────────────────────────────────

    public record HistoryDto(
            Long id, String userEmail, String sqlContent,
            String resultType, Integer rowCount, String errorMessage,
            String dialect, String executedAt) {}

    public record HistoryPageResponse(
            List<HistoryDto> content, long totalElements, int totalPages, int currentPage) {}

    public record TypoPattern(String typo, String correction) {}

    public record ConversionRuleDto(
            Long id, String dialect, String ruleKey,
            String adminLabel, String userLabel,
            boolean enabled, int displayOrder, boolean complex) {

        public static ConversionRuleDto from(DialectConversionRule r) {
            return new ConversionRuleDto(r.getId(), r.getDialect(), r.getRuleKey(),
                    r.getAdminLabel(), r.getUserLabel(), r.isEnabled(), r.getDisplayOrder(), r.isComplex());
        }
    }

    public record PracticeRulesResponse(
            List<String> blockedCommands,
            String allowedTablePrefix,
            String multiStatementRule,
            List<TypoPattern> typoPatterns,
            List<ConversionRuleDto> mysqlConversionRules,
            List<ConversionRuleDto> oracleConversionRules) {

        public static PracticeRulesResponse of(List<ConversionRuleDto> mysql, List<ConversionRuleDto> oracle) {
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
                    ),
                    mysql,
                    oracle
            );
        }
    }
}
