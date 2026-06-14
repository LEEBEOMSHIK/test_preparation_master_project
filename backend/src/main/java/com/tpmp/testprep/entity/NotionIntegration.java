package com.tpmp.testprep.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 사용자별 Notion OAuth 연동 정보.
 * access_token은 평문 저장 금지 — TokenCipher로 암호화하여 보관한다.
 */
@Entity
@Table(name = "notion_integrations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NotionIntegration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    /** 암호화된 Notion access token */
    @Column(name = "access_token_enc", nullable = false, columnDefinition = "TEXT")
    private String accessTokenEnc;

    @Column(name = "workspace_id", length = 64)
    private String workspaceId;

    @Column(name = "workspace_name", length = 200)
    private String workspaceName;

    @Column(name = "bot_id", length = 64)
    private String botId;

    /** OAuth 시 사용자가 선택한 부모 페이지 ID (DB 생성 위치) */
    @Column(name = "parent_page_id", length = 64)
    private String parentPageId;

    /** 개념노트를 모으는 Notion 데이터베이스 ID (최초 내보내기 시 생성 후 저장) */
    @Column(name = "notion_database_id", length = 64)
    private String notionDatabaseId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @Builder
    public NotionIntegration(Long userId, String accessTokenEnc, String workspaceId,
                             String workspaceName, String botId, String parentPageId) {
        this.userId = userId;
        this.accessTokenEnc = accessTokenEnc;
        this.workspaceId = workspaceId;
        this.workspaceName = workspaceName;
        this.botId = botId;
        this.parentPageId = parentPageId;
    }

    /** 재연결 시 토큰·워크스페이스 정보 갱신 */
    public void reconnect(String accessTokenEnc, String workspaceId, String workspaceName,
                          String botId, String parentPageId) {
        this.accessTokenEnc = accessTokenEnc;
        this.workspaceId = workspaceId;
        this.workspaceName = workspaceName;
        this.botId = botId;
        this.parentPageId = parentPageId;
        this.notionDatabaseId = null; // 워크스페이스가 바뀌었을 수 있으므로 DB 재생성 대상
    }

    public void assignDatabaseId(String notionDatabaseId) {
        this.notionDatabaseId = notionDatabaseId;
    }
}
