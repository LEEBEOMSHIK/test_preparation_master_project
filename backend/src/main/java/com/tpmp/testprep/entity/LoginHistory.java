package com.tpmp.testprep.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "login_history", indexes = {
    @Index(name = "idx_login_history_email", columnList = "email"),
    @Index(name = "idx_login_history_login_at", columnList = "login_at")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LoginHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_name", nullable = false)
    private String memberName;

    @Column(nullable = false)
    private String email;

    @Column(name = "ip_address", nullable = false, length = 45)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "login_at", nullable = false, updatable = false)
    private LocalDateTime loginAt;

    @PrePersist
    protected void onCreate() {
        this.loginAt = LocalDateTime.now();
    }

    @Builder
    public LoginHistory(String memberName, String email, String ipAddress, String userAgent) {
        this.memberName = memberName;
        this.email = email;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
    }
}
