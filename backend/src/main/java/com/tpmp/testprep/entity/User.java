package com.tpmp.testprep.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = true)
    private String password;

    @Column(name = "provider", length = 20)
    private String provider;

    @Column(name = "provider_id")
    private String providerId;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(name = "is_first_login")
    private Boolean isFirstLogin;

    @Column(name = "interested_exam_types", length = 500)
    private String interestedExamTypes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @Builder
    public User(String email, String password, String name, Role role) {
        this.email = email;
        this.password = password;
        this.name = name;
        this.role = role;
        this.provider = "LOCAL";
        this.isFirstLogin = true;
    }

    public static User ofOAuth(String email, String name, String provider, String providerId) {
        User user = new User();
        user.email = email;
        user.name = name;
        user.provider = provider;
        user.providerId = providerId;
        user.role = Role.USER;
        user.isFirstLogin = true;
        return user;
    }

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_granted_permissions",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "detail_id")
    )
    private Set<PermissionDetail> grantedPermissions = new HashSet<>();

    public void linkOAuthProvider(String provider, String providerId) {
        this.provider = provider;
        this.providerId = providerId;
    }

    public void updateName(String name) { this.name = name; }
    public void updateRole(Role role) { this.role = role; }
    public void updatePassword(String encodedPassword) { this.password = encodedPassword; }
    public void completeOnboarding(String examTypes) {
        this.isFirstLogin = false;
        this.interestedExamTypes = examTypes;
    }
    public void updateInterests(String examTypes) { this.interestedExamTypes = examTypes; }
    public void setGrantedPermissions(Set<PermissionDetail> permissions) {
        this.grantedPermissions.clear();
        if (permissions != null) this.grantedPermissions.addAll(permissions);
    }

    public enum Role {
        USER, ADMIN
    }
}
