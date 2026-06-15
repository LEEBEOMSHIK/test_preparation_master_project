package com.tpmp.testprep.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tpmp.testprep.dto.response.NotionExportResponse;
import com.tpmp.testprep.dto.response.NotionStatusResponse;
import com.tpmp.testprep.entity.ConceptNote;
import com.tpmp.testprep.entity.NotionIntegration;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.ConceptNoteRepository;
import com.tpmp.testprep.repository.NotionIntegrationRepository;
import com.tpmp.testprep.repository.UserRepository;
import com.tpmp.testprep.security.TokenCipher;
import com.tpmp.testprep.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * 개념노트 → Notion 단방향 내보내기 연동.
 * - 공개 OAuth로 워크스페이스 연결, access token은 TokenCipher로 암호화 저장.
 * - 내보내기: 사용자가 OAuth 시 공유한 페이지 하위에 노트별 Notion 페이지를 생성/갱신.
 *
 * NOTE(골격): client id/secret 미설정 시 isConfigured()=false. 실제 Notion API 호출은
 *             credential 확보 후 E2E 검증 필요. 갱신(PATCH)은 제목/속성만 반영하며 본문
 *             블록 재동기화는 후속 단계 과제로 둔다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotionService {

    private static final String NOTION_API = "https://api.notion.com/v1";
    private static final String NOTION_VERSION = "2022-06-28";
    private static final String AUTHORIZE_BASE = "https://api.notion.com/v1/oauth/authorize";

    @Value("${app.notion.client-id:}")
    private String clientId;

    @Value("${app.notion.client-secret:}")
    private String clientSecret;

    @Value("${app.notion.redirect-uri:http://localhost:8080/api/notion/callback}")
    private String redirectUri;

    @Value("${app.notion.success-redirect:http://localhost:3000/user/settings?notion=connected}")
    private String successRedirect;

    @Value("${app.notion.failure-redirect:http://localhost:3000/user/settings?notion=failed}")
    private String failureRedirect;

    private final NotionIntegrationRepository integrationRepository;
    private final ConceptNoteRepository conceptNoteRepository;
    private final UserRepository userRepository;
    private final TokenCipher tokenCipher;
    private final JwtTokenProvider jwtTokenProvider;
    private final ObjectMapper objectMapper;

    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank() && clientSecret != null && !clientSecret.isBlank();
    }

    public String successRedirect() { return successRedirect; }
    public String failureRedirect() { return failureRedirect; }

    // ── 상태 / 연결 관리 ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public NotionStatusResponse getStatus(String email) {
        if (!isConfigured()) return NotionStatusResponse.notConfigured();
        User user = findUser(email);
        return integrationRepository.findByUserId(user.getId())
                .map(i -> NotionStatusResponse.connected(i.getWorkspaceName()))
                .orElseGet(NotionStatusResponse::disconnected);
    }

    /** OAuth 인가 URL — state에 사용자 식별용 단명 토큰을 담는다(콜백은 비인증 접근이므로). */
    public String buildAuthorizeUrl(String email) {
        if (!isConfigured()) throw new BusinessException(ErrorCode.NOTION_NOT_CONFIGURED);
        String state = jwtTokenProvider.createRefreshToken(email);
        return AUTHORIZE_BASE
                + "?client_id=" + enc(clientId)
                + "&response_type=code&owner=user"
                + "&redirect_uri=" + enc(redirectUri)
                + "&state=" + enc(state);
    }

    @Transactional
    public void disconnect(String email) {
        User user = findUser(email);
        integrationRepository.deleteByUserId(user.getId());
    }

    /** OAuth 콜백: state 검증 → code 교환 → 연동 저장. (컨트롤러가 프론트로 redirect) */
    @Transactional
    public void handleCallback(String code, String state) {
        if (!isConfigured()) throw new BusinessException(ErrorCode.NOTION_NOT_CONFIGURED);
        if (state == null || !jwtTokenProvider.validate(state)) {
            throw new BusinessException(ErrorCode.NOTION_OAUTH_FAILED);
        }
        String email = jwtTokenProvider.getEmail(state);
        User user = findUser(email);

        JsonNode token = exchangeCodeForToken(code);
        String accessToken = token.path("access_token").asText(null);
        if (accessToken == null) throw new BusinessException(ErrorCode.NOTION_OAUTH_FAILED);
        String encToken = tokenCipher.encrypt(accessToken);
        String workspaceId = token.path("workspace_id").asText(null);
        String workspaceName = token.path("workspace_name").asText(null);
        String botId = token.path("bot_id").asText(null);

        integrationRepository.findByUserId(user.getId()).ifPresentOrElse(
                existing -> existing.reconnect(encToken, workspaceId, workspaceName, botId, null),
                () -> integrationRepository.save(NotionIntegration.builder()
                        .userId(user.getId())
                        .accessTokenEnc(encToken)
                        .workspaceId(workspaceId)
                        .workspaceName(workspaceName)
                        .botId(botId)
                        .build())
        );
    }

    // ── 내보내기 ────────────────────────────────────────────────────────────────

    @Transactional
    public NotionExportResponse exportNote(Long noteId, String email) {
        if (!isConfigured()) throw new BusinessException(ErrorCode.NOTION_NOT_CONFIGURED);
        User user = findUser(email);
        NotionIntegration integration = integrationRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTION_NOT_CONNECTED));

        ConceptNote note = conceptNoteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CONCEPT_NOTE_NOT_FOUND));
        if (!note.getUser().getId().equals(user.getId())) {
            throw new BusinessException(ErrorCode.CONCEPT_NOTE_ACCESS_DENIED);
        }

        String accessToken = tokenCipher.decrypt(integration.getAccessTokenEnc());
        String parentPageId = resolveParentPageId(integration, accessToken);

        String pageId;
        if (note.getNotionPageId() != null && !note.getNotionPageId().isBlank()) {
            updatePageTitle(accessToken, note.getNotionPageId(), note.getTitle());
            pageId = note.getNotionPageId();
        } else {
            pageId = createPage(accessToken, parentPageId, note);
            note.assignNotionPageId(pageId);
        }
        return new NotionExportResponse(pageId, "https://www.notion.so/" + pageId.replace("-", ""));
    }

    // ── Notion API 호출 ──────────────────────────────────────────────────────────

    private JsonNode exchangeCodeForToken(String code) {
        try {
            String basic = Base64.getEncoder().encodeToString(
                    (clientId + ":" + clientSecret).getBytes(StandardCharsets.UTF_8));
            Map<String, Object> body = Map.of(
                    "grant_type", "authorization_code",
                    "code", code,
                    "redirect_uri", redirectUri
            );
            String raw = notionClient()
                    .post().uri(NOTION_API + "/oauth/token")
                    .header("Authorization", "Basic " + basic)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body).retrieve().body(String.class);
            return objectMapper.readTree(raw);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.warn("[Notion] 토큰 교환 실패: {}", e.getMessage());
            throw new BusinessException(ErrorCode.NOTION_OAUTH_FAILED);
        }
    }

    /** 내보낼 부모 페이지 결정 — 저장돼 있으면 재사용, 없으면 search로 접근 가능한 첫 페이지 사용. */
    private String resolveParentPageId(NotionIntegration integration, String accessToken) {
        if (integration.getParentPageId() != null && !integration.getParentPageId().isBlank()) {
            return integration.getParentPageId();
        }
        try {
            Map<String, Object> body = Map.of(
                    "filter", Map.of("property", "object", "value", "page"),
                    "page_size", 1
            );
            String raw = authedClient(accessToken)
                    .post().uri(NOTION_API + "/search")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body).retrieve().body(String.class);
            JsonNode results = objectMapper.readTree(raw).path("results");
            if (results.isArray() && !results.isEmpty()) {
                String pageId = results.get(0).path("id").asText(null);
                if (pageId != null) {
                    integration.assignDatabaseId(null);
                    // parentPageId는 reconnect/builder로만 세팅되므로, 여기서는 결과만 반환하고
                    // 다음 호출 비용 절감을 위해 별도 갱신 메서드로 저장한다.
                    saveParentPage(integration, pageId);
                    return pageId;
                }
            }
            throw new BusinessException(ErrorCode.NOTION_API_ERROR);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.warn("[Notion] 부모 페이지 조회 실패: {}", e.getMessage());
            throw new BusinessException(ErrorCode.NOTION_API_ERROR);
        }
    }

    private void saveParentPage(NotionIntegration integration, String pageId) {
        integration.reconnect(integration.getAccessTokenEnc(), integration.getWorkspaceId(),
                integration.getWorkspaceName(), integration.getBotId(), pageId);
    }

    private String createPage(String accessToken, String parentPageId, ConceptNote note) {
        try {
            Map<String, Object> body = Map.of(
                    "parent", Map.of("type", "page_id", "page_id", parentPageId),
                    "properties", Map.of("title", Map.of("title", List.of(
                            Map.of("text", Map.of("content", safeTitle(note.getTitle())))))),
                    "children", buildBlocks(note)
            );
            String raw = authedClient(accessToken)
                    .post().uri(NOTION_API + "/pages")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body).retrieve().body(String.class);
            return objectMapper.readTree(raw).path("id").asText();
        } catch (Exception e) {
            log.warn("[Notion] 페이지 생성 실패: {}", e.getMessage());
            throw new BusinessException(ErrorCode.NOTION_API_ERROR);
        }
    }

    private void updatePageTitle(String accessToken, String pageId, String title) {
        try {
            Map<String, Object> body = Map.of(
                    "properties", Map.of("title", Map.of("title", List.of(
                            Map.of("text", Map.of("content", safeTitle(title)))))));
            authedClient(accessToken)
                    .patch().uri(NOTION_API + "/pages/" + pageId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body).retrieve().body(String.class);
        } catch (Exception e) {
            log.warn("[Notion] 페이지 갱신 실패: {}", e.getMessage());
            throw new BusinessException(ErrorCode.NOTION_API_ERROR);
        }
    }

    /** 노트 본문(plain) + 연결된 문제(HTML→텍스트)를 Notion 블록으로 변환. */
    private List<Map<String, Object>> buildBlocks(ConceptNote note) {
        List<Map<String, Object>> blocks = new ArrayList<>();
        String questionText = linkedQuestionText(note);
        if (questionText != null && !questionText.isBlank()) {
            blocks.add(paragraph("문제: " + questionText));
        }
        for (String line : (note.getContent() == null ? "" : note.getContent()).split("\n")) {
            blocks.add(paragraph(line));
        }
        if (blocks.isEmpty()) blocks.add(paragraph(""));
        return blocks;
    }

    private Map<String, Object> paragraph(String text) {
        return Map.of("object", "block", "type", "paragraph",
                "paragraph", Map.of("rich_text", List.of(
                        Map.of("type", "text", "text", Map.of("content", clamp(text, 2000))))));
    }

    private String linkedQuestionText(ConceptNote note) {
        String html = null;
        if (note.getQuestion() != null) html = note.getQuestion().getContent();
        else if (note.getQuestionBank() != null) html = note.getQuestionBank().getContent();
        return html == null ? null : stripHtml(html);
    }

    // ── 헬퍼 ─────────────────────────────────────────────────────────────────────

    private RestClient notionClient() {
        return RestClient.builder().defaultHeader("Notion-Version", NOTION_VERSION).build();
    }

    private RestClient authedClient(String accessToken) {
        return RestClient.builder()
                .defaultHeader("Authorization", "Bearer " + accessToken)
                .defaultHeader("Notion-Version", NOTION_VERSION)
                .build();
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    private static String enc(String v) {
        return URLEncoder.encode(v, StandardCharsets.UTF_8);
    }

    private static String safeTitle(String title) {
        return clamp(title == null || title.isBlank() ? "개념노트" : title, 200);
    }

    private static String clamp(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max);
    }

    private static String stripHtml(String html) {
        return html.replaceAll("<[^>]+>", " ")
                   .replaceAll("&[a-zA-Z0-9#]+;", " ")
                   .replaceAll("\\s+", " ")
                   .trim();
    }
}
