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
