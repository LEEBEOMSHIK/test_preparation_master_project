package com.tpmp.testprep.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "dialect_conversion_rules")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DialectConversionRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** "mysql" or "oracle" */
    @Column(nullable = false, length = 10)
    private String dialect;

    /** 코드 매핑 키 (고유) */
    @Column(name = "rule_key", nullable = false, unique = true, length = 50)
    private String ruleKey;

    /** 관리자 화면 표시 레이블 */
    @Column(name = "admin_label", nullable = false, length = 100)
    private String adminLabel;

    /** 사용자 가이드 표시 레이블 */
    @Column(name = "user_label", nullable = false, columnDefinition = "TEXT")
    private String userLabel;

    /** 활성화 여부 */
    @Column(nullable = false)
    private boolean enabled;

    /** 관리자/사용자 화면 내 정렬 순서 */
    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    /** 복합 로직 여부 (트리거·프로시저 등 Regex Matcher 기반) */
    @Column(nullable = false)
    private boolean complex;

    @Builder
    public DialectConversionRule(String dialect, String ruleKey, String adminLabel,
                                  String userLabel, boolean enabled, int displayOrder, boolean complex) {
        this.dialect = dialect;
        this.ruleKey = ruleKey;
        this.adminLabel = adminLabel;
        this.userLabel = userLabel;
        this.enabled = enabled;
        this.displayOrder = displayOrder;
        this.complex = complex;
    }

    public void toggle() {
        this.enabled = !this.enabled;
    }
}
