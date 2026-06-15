# Notion 연동 수정 이력

## HIST-20260615-002

- **날짜**: 2026-06-15
- **수정 범위**: 인프라/설정 / Notion 연동 로컬 환경변수
- **수정 개요**: Notion OAuth 시크릿을 로컬 `.env`(git 제외)로 영속화하고, docker-compose·`.env.example`·실행 스크립트를 정비. (실제 시크릿 값은 커밋하지 않음)

### 수정 파일 목록

| 파일 경로 | 유형 | 설명 |
|-----------|------|------|
| `.env` | 신규(git 제외) | NOTION_CLIENT_ID/SECRET·REDIRECT_URI·TOKEN_ENCRYPTION_KEY·DB_PASSWORD 등 로컬 값 (gitignore됨, 커밋 안 함) |
| `.env.example` | 수정 | NOTION_* / TOKEN_ENCRYPTION_KEY 키 이름 추가(값 없음, 템플릿) |
| `docker-compose.yml` | 수정 | 백엔드 서비스 environment에 NOTION_CLIENT_ID/SECRET/REDIRECT_URI·TOKEN_ENCRYPTION_KEY 매핑 |
| `backend/run-dev.sh` | 신규 | 루트 `.env`를 로드해 `bootRun` 실행하는 로컬 개발 스크립트(gradlew는 .env 자동 미로드) |

### 수정 상세
- gradlew/Spring은 `.env`를 자동으로 읽지 않으므로 `run-dev.sh`가 `set -a; source ../.env; set +a` 후 bootRun 실행. docker-compose는 루트 `.env`를 `${VAR}` 치환으로 자동 사용.
- `TOKEN_ENCRYPTION_KEY`는 기존 기본값(`tpmp_local_token_key_change_me`)과 동일하게 유지 — 값이 바뀌면 이미 저장된 access token 복호화가 불가해 재연결이 필요하기 때문.
- **검증**: `git check-ignore .env` 통과(추적 안 됨). `bash backend/run-dev.sh`로 기동 → `.env 로드 완료` 로그 → status `configured:true` + 기존 연결 `connected:true`(워크스페이스 'bomi') 유지 확인.

### 복원 방법
이 ID(HIST-20260615-002)로 복원 시 `.env` 삭제, `.env.example`·docker-compose의 NOTION/TOKEN 항목 제거, `backend/run-dev.sh` 삭제.

---

## HIST-20260615-001

- **날짜**: 2026-06-15
- **수정 범위**: 사용자 백엔드 / 개념노트 Notion 연동 (골격)
- **수정 개요**: 개념노트 → Notion 단방향 내보내기를 위한 백엔드 골격 구현 — 공개 OAuth 연결, access token 암호화 저장, 노트별 페이지 생성/갱신 엔드포인트. client id/secret 미설정 시 `configured:false`로 동작(시크릿 확보 후 E2E 검증 예정).

### 수정 파일 목록

| 파일 경로 | 유형 | 설명 |
|-----------|------|------|
| `entity/NotionIntegration.java` | 신규 | 사용자별 Notion 연동(암호화 토큰·워크스페이스·부모페이지) 엔티티 |
| `repository/NotionIntegrationRepository.java` | 신규 | userId 기준 조회/삭제 |
| `entity/ConceptNote.java` | 수정 | `notion_page_id` 컬럼 + `assignNotionPageId()` 추가 (재내보내기 멱등) |
| `security/TokenCipher.java` | 신규 | AES-256-GCM 대칭 암복호화 (access token 평문 저장 금지) |
| `service/NotionService.java` | 신규 | OAuth URL 생성·콜백 처리·상태·해제·내보내기 + Notion API 호출(RestClient) |
| `controller/NotionController.java` | 신규 | `/api/user/notion` — status / authorize-url / disconnect / export/{noteId} |
| `controller/NotionCallbackController.java` | 신규 | `/api/notion/callback` — OAuth 콜백(비인증, state로 사용자 식별 후 프론트 redirect) |
| `dto/response/NotionStatusResponse.java`, `NotionExportResponse.java` | 신규 | 응답 DTO |
| `config/SecurityConfig.java` | 수정 | `/api/notion/callback` permitAll 추가 |
| `exception/ErrorCode.java` | 수정 | NOTION_NOT_CONFIGURED/NOT_CONNECTED/OAUTH_FAILED/API_ERROR 추가 |
| `resources/application.yml` | 수정 | `app.notion.*`, `app.security.token-encryption-key` (모두 env 주입) |

### 설계 요점
- **인증**: 공개 OAuth. 콜백은 브라우저 top-level redirect라 JWT 헤더가 없으므로 permitAll + `state`(JwtTokenProvider.createRefreshToken으로 email 담은 단명 토큰)로 사용자 식별. Notion 토큰은 만료 없어 refresh 불필요.
- **데이터 모델**: 복잡한 DB 스키마 대신 OAuth 시 공유된 부모 페이지(검색으로 1건 확보) 하위에 노트별 페이지 생성. 재내보내기는 `notion_page_id`로 제목/속성 PATCH(본문 블록 재동기화는 후속 과제).
- **콘텐츠 매핑**: 노트 `content`(plain)→paragraph 블록(\n split), 연결문제(HTML)→`stripHtml`→첫 블록. 길이 클램프(제목 200·블록 2000).
- **보안**: access token은 TokenCipher(AES-GCM)로 암호화 후 `access_token_enc` 저장.

### 검증
- `./gradlew compileJava` 통과. 기동 시 `notion_integrations` 테이블 + `concept_notes.notion_page_id` 자동 생성(ddl-auto).
- curl(시크릿 미설정): status→`{configured:false,connected:false}` 200 / authorize-url·export→503 NOTION_NOT_CONFIGURED / callback(error)→302 실패 redirect(permitAll 동작).
- 실제 OAuth·내보내기는 Notion 공개 integration client id/secret 확보 후 E2E 검증 필요.

### 복원 방법
이 ID(HIST-20260615-001)로 복원 시 위 신규 파일 삭제 + ConceptNote/SecurityConfig/ErrorCode/application.yml 변경 환원, `notion_integrations` 테이블·`concept_notes.notion_page_id` 컬럼 drop.
