## HIST-20260619-001

- **날짜**: 2026-06-19
- **수정 범위**: 사용자 백엔드 / 개념노트 공개 탐색 API
- **수정 개요**: 공개 개념노트 탐색 기능 구현 — isPublic 기본값 false 전환, 마이그레이션 러너, 공개 목록+단건 쿼리, getPublicNotes/getPublicNote 서비스 메서드, /public 컨트롤러 엔드포인트 2개, 메뉴 시딩 및 인덱스 추가.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `entity/ConceptNote.java` | 수정 | `isPublic` 기본값 `true`→`false`, `columnDefinition="boolean default false"` 추가, `@Table(indexes=...)` 복합 인덱스 추가 |
| `config/ConceptNotePrivacyMigrationRunner.java` | 추가 | `@Order(200)` ApplicationRunner — 기존 공개 노트를 모두 비공개로 전환하는 멱등 마이그레이션 |
| `repository/ConceptNoteRepository.java` | 수정 | `findPublicByTitle(keyword, pageable)` + `findByIdWithUser(id)` 쿼리 2개 추가 |
| `service/ConceptNoteService.java` | 수정 | `getPublicNotes(keyword, pageable)` + `getPublicNote(id, requestEmail)` 추가 (StringUtils.hasText, 본인/비공개 가드) |
| `controller/UserConceptNoteController.java` | 수정 | `GET /public` + `GET /public/{id}` 2개 엔드포인트 추가 (기존 `/{id}` 보다 앞에 선언) |
| `config/DataInitializer.java` | 수정 | `ensureConceptNotesIndex()` 헬퍼 추가, `/user/concepts/explore` 메뉴 시딩, 학습 그룹 4번 자식으로 `reparentMenu` 추가 |

### 수정 상세

#### `entity/ConceptNote.java`
- 변경 전: `@Column(name="is_public", nullable=false) private boolean isPublic = true;`
- 변경 후: `@Column(name="is_public", nullable=false, columnDefinition="boolean default false") private boolean isPublic = false;` + `@Table(indexes=@Index(...))`
- 이유: 신규 작성 노트는 기본 비공개, DB 컬럼 default도 동기화

#### `config/ConceptNotePrivacyMigrationRunner.java` (신규)
- `UPDATE concept_notes SET is_public = false WHERE is_public = true` 실행 → count == 0이면 "건너뜀" 로그, else "{}건 전환" 로그

#### `repository/ConceptNoteRepository.java`
- `findPublicByTitle`: isPublic=true + keyword LIKE 검색, user LEFT JOIN FETCH, 페이지네이션
- `findByIdWithUser`: id로 단건, user + question + questionBank 모두 FETCH

#### `service/ConceptNoteService.java`
- `getPublicNotes`: keyword 빈문자열 → null 변환 후 쿼리
- `getPublicNote`: 본인이면 isPublic 무관 반환 / 타인+비공개면 CONCEPT_NOTE_NOT_FOUND(404)

#### `controller/UserConceptNoteController.java`
- `GET /api/user/concepts/public` → 공개 목록 (keyword, Pageable)
- `GET /api/user/concepts/public/{id}` → 공개 단건
- `/public` 매핑을 `/{id}` 매핑보다 앞에 배치

#### `config/DataInitializer.java`
- `ensureConceptNotesIndex()`: `CREATE INDEX IF NOT EXISTS idx_concept_notes_public_updated ON concept_notes(is_public, updated_at DESC)`
- `/user/concepts/explore` 메뉴 멱등 추가, learningId 그룹 4번 자식으로 배치

### 복원 방법
이 ID(HIST-20260619-001)만으로 복원 시:
- `ConceptNote.java`의 `isPublic` 기본값을 `true`로, `columnDefinition` 제거, `@Table` indexes 제거
- `ConceptNotePrivacyMigrationRunner.java` 삭제
- `ConceptNoteRepository.java`에서 `findPublicByTitle`, `findByIdWithUser` 제거
- `ConceptNoteService.java`에서 `getPublicNotes`, `getPublicNote` 제거
- `UserConceptNoteController.java`에서 `/public`, `/public/{id}` 엔드포인트 제거
- `DataInitializer.java`에서 `ensureConceptNotesIndex()` 호출, `/user/concepts/explore` 시딩, `reparentMenu("/user/concepts/explore", ...)` 제거

---

## HIST-20260421-030

- **날짜**: 2026-04-21
- **수정 범위**: 사용자 백엔드 / 개념노트 API
- **수정 개요**: ConceptNote에 시험 문항(Question) / 퀴즈 문항(QuestionBank) 연결 FK 추가 및 관련 응답·서비스 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| entity/ConceptNote.java | 수정 | `question` (FK → questions), `questionBank` (FK → question_bank) nullable ManyToOne 추가; Builder 파라미터 확장 |
| repository/ConceptNoteRepository.java | 수정 | FETCH JOIN 쿼리 3개로 교체 (findByUserIdWithRelations, findByIdWithRelations, findAllWithRelations) |
| dto/request/ConceptNoteRequest.java | 수정 | `questionId?`, `questionBankId?` 추가 |
| dto/response/ConceptNoteResponse.java | 수정 | questionId, questionContent, questionType, questionBankId, questionBankContent, questionBankType 추가 |
| service/ConceptNoteService.java | 수정 | create 시 questionId/questionBankId로 엔티티 조회·연결; fetch join 쿼리 호출로 변경 |

### 복원 방법

HIST-20260421-030 복원 시:
- `ConceptNote.java`에서 `question`, `questionBank` 필드 및 Builder 파라미터 제거
- `ConceptNoteRepository.java`를 단순 `findByUserId`, `findAll` 메서드로 복원
- `ConceptNoteRequest.java`에서 questionId, questionBankId 제거
- `ConceptNoteResponse.java`에서 question 관련 6개 필드 제거
- `ConceptNoteService.java`에서 question 조회·연결 로직 제거

---

## HIST-20260421-027

- **날짜**: 2026-04-21
- **수정 범위**: 사용자 백엔드 / 개념노트 API
- **수정 개요**: 개념노트 CRUD API 전체 구현 (서비스·사용자 컨트롤러·관리자 컨트롤러·DTO·에러코드)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| dto/request/ConceptNoteRequest.java | 추가 | 개념노트 생성/수정 요청 DTO (title, content, isPublic) |
| dto/response/ConceptNoteResponse.java | 추가 | 개념노트 응답 DTO (id, title, content, isPublic, userId, userName, 타임스탬프) |
| service/ConceptNoteService.java | 추가 | CRUD + 소유자 검증 + 관리자 메서드 |
| controller/UserConceptNoteController.java | 추가 | GET 목록·상세, POST 생성, PUT 수정, DELETE 삭제 (5개 엔드포인트) |
| controller/AdminConceptNoteController.java | 추가 | GET 전체목록, PATCH 공개전환, DELETE 삭제 (3개 엔드포인트) |
| exception/ErrorCode.java | 수정 | USER_NOT_FOUND 에러코드 추가 |

### 수정 상세

#### API 엔드포인트

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/user/concepts` | 내 개념노트 페이징 목록 |
| GET | `/api/user/concepts/{id}` | 내 개념노트 단건 조회 |
| POST | `/api/user/concepts` | 개념노트 생성 |
| PUT | `/api/user/concepts/{id}` | 개념노트 수정 |
| DELETE | `/api/user/concepts/{id}` | 개념노트 삭제 |
| GET | `/api/admin/concepts` | 전체 개념노트 목록 (Admin) |
| PATCH | `/api/admin/concepts/{id}/toggle-public` | 공개 상태 전환 (Admin) |
| DELETE | `/api/admin/concepts/{id}` | 개념노트 삭제 (Admin) |

#### 소유자 검증
- `ConceptNoteService.checkOwner()`: 요청 이메일 ≠ 노트 작성자 이메일이면 `CONCEPT_NOTE_ACCESS_DENIED` 예외 발생

### 복원 방법

HIST-20260421-027 복원 시:
- `ConceptNoteRequest.java`, `ConceptNoteResponse.java` 삭제
- `ConceptNoteService.java` 삭제
- `UserConceptNoteController.java`, `AdminConceptNoteController.java` 삭제
- `ErrorCode.java`에서 `USER_NOT_FOUND` 항목 제거
