## HIST-20260626-001

- **날짜**: 2026-06-26
- **수정 범위**: 사용자 백엔드 / 복습 표시 문구 통일
- **수정 개요**: DataInitializer 시딩 문구 및 ErrorCode 에러 메시지를 "즐겨찾기"에서 "복습 표시"로 변경. enum 상수명·URL 유지.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java | 수정 | ensureBookmarkMenu() 내 saveMenu name, log 문구 변경 |
| backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java | 수정 | BOOKMARK_NOT_FOUND 에러 메시지 문자열 변경 |

### 수정 상세

#### `config/DataInitializer.java`
- 변경 전: `saveMenu(null, "즐겨찾기", ...)`, `log.info("[DataInitializer] 즐겨찾기 사용자 메뉴 추가 완료")`
- 변경 후: `saveMenu(null, "복습 표시", ...)`, `log.info("[DataInitializer] 복습 표시 사용자 메뉴 추가 완료")`
- 이유: fresh seed 시 menu_config에 "복습 표시"로 저장되어야 UI 문구와 일관됨. 기존 DB row는 메인이 UPDATE로 별도 반영.

#### `exception/ErrorCode.java`
- 변경 전: `BOOKMARK_NOT_FOUND(HttpStatus.NOT_FOUND, "즐겨찾기를 찾을 수 없습니다.")`
- 변경 후: `BOOKMARK_NOT_FOUND(HttpStatus.NOT_FOUND, "복습 표시 항목을 찾을 수 없습니다.")` — enum 상수명 BOOKMARK_NOT_FOUND 유지
- 이유: API 에러 응답 메시지를 사용자 노출 문구와 일치시켜 일관성 확보

### 복원 방법
이 ID(HIST-20260626-001)만으로 복원 시: 위 "변경 전" 문자열을 각 파일에 재적용한다.

---

## HIST-20260612-002

- **날짜**: 2026-06-12
- **수정 범위**: 사용자 백엔드 / 메뉴 시딩
- **수정 개요**: 즐겨찾기 메뉴(/user/bookmarks)를 DataInitializer의 멱등 ensure 패턴으로 DB에 시딩

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java | 수정 | ensureBookmarkMenu() 메서드 추가, run()에서 ensurePracticeMenu() 직후 호출 |

### 수정 상세

#### `config/DataInitializer.java`
- 변경 전: `ensurePracticeMenu();` 다음에 바로 `ensurePracticeAdminMenus();` 호출
- 변경 후: `ensurePracticeMenu();` → `ensureBookmarkMenu();` → `ensurePracticeAdminMenus();` → `ensurePermissionMenuAssociations();` 순서. `ensureBookmarkMenu()` 메서드 추가 — `existsByUrl("/user/bookmarks")` 체크 후 없으면 `saveMenu(null, "즐겨찾기", "/user/bookmarks", "bookmark", 8, USER, "USER,ADMIN")` 실행.
- 이유: `ensurePermissionMenuAssociations()` 호출 이전에 메뉴가 존재해야 GENERAL_USER 권한이 자동으로 연결됨. displayOrder=8은 기존 USER 메뉴(exam:1, quiz:2, concepts:3, faq:4, inquiries:5, exam-info:0, practice:7)와 충돌 없음.

### 복원 방법
이 ID(HIST-20260612-002)만으로 복원 시: `run()` 메서드에서 `ensureBookmarkMenu();` 호출 줄 제거, `ensureBookmarkMenu()` 메서드 본체 삭제.

---

## HIST-20260612-001

- **날짜**: 2026-06-12
- **수정 범위**: 사용자 백엔드 / 문항 즐겨찾기
- **수정 개요**: QuestionBank(전역 문항풀)에 대한 사용자 북마크 기능 — 토글/목록/ID목록 API 3종 신규 구현

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| backend/src/main/java/com/tpmp/testprep/entity/UserQuestionBookmark.java | 추가 | 북마크 엔티티 (user_question_bookmarks 테이블, UNIQUE(user_id, question_bank_id)) |
| backend/src/main/java/com/tpmp/testprep/repository/UserQuestionBookmarkRepository.java | 추가 | JPA Repository — findByUserIdAndQuestionBankId, findAllByUserIdWithQuestion, findQuestionBankIdsByUserId |
| backend/src/main/java/com/tpmp/testprep/dto/request/BookmarkToggleRequest.java | 추가 | 토글 요청 DTO record { Long questionBankId } |
| backend/src/main/java/com/tpmp/testprep/dto/response/BookmarkQuestionResponse.java | 추가 | 북마크 응답 DTO record — QuestionBankResponse 필드 + bookmarkId/bookmarkedAt |
| backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java | 수정 | BOOKMARK_NOT_FOUND(NOT_FOUND, "즐겨찾기를 찾을 수 없습니다.") 추가 |
| backend/src/main/java/com/tpmp/testprep/service/UserQuestionBookmarkService.java | 추가 | toggle / getBookmarks / getBookmarkedQuestionBankIds — DataIntegrityViolationException 동시성 방어 |
| backend/src/main/java/com/tpmp/testprep/controller/UserQuestionBookmarkController.java | 추가 | POST /api/user/bookmarks/toggle, GET /api/user/bookmarks, GET /api/user/bookmarks/ids |

### 수정 상세

#### `entity/UserQuestionBookmark.java`
- 변경 전: 없음
- 변경 후: `@UniqueConstraint(columnNames={"user_id","question_bank_id"})`, `@ManyToOne(LAZY) User`, `@ManyToOne(LAZY) QuestionBank`, `@PrePersist createdAt`. BaseEntity 미상속(User 엔티티 패턴 준용).
- 이유: 북마크 도메인 모델 신규 정의

#### `exception/ErrorCode.java`
- 변경 전: USER_NOT_FOUND 다음 줄 없음
- 변경 후: `BOOKMARK_NOT_FOUND(HttpStatus.NOT_FOUND, "즐겨찾기를 찾을 수 없습니다.")` 추가
- 이유: 북마크 미존재 오류 코드 표준화

#### `service/UserQuestionBookmarkService.java`
- 변경 전: 없음
- 변경 후: toggle — 존재 시 삭제(false), 미존재 시 저장(true). `DataIntegrityViolationException` try-catch로 동시성 보호. `delYn='N'` 필터로 소프트 삭제 문항 방어.
- 이유: 동시 요청으로 발생하는 UNIQUE 위반 방어 필요

### 주의사항
- **SecurityConfig 수정 불필요**: `/api/user/**` 경로가 이미 `authenticated()` 처리됨.
- **MenuConfig DB 등록 별도 필요**: 즐겨찾기 메뉴(/user/bookmarks, iconKey: bookmark)를 MenuConfig 테이블에 INSERT해야 API 기반 내비게이션에 표시됨. 미등록 시 FALLBACK_NAV로 폴백(기능 동작은 정상).
- 소프트 삭제된 문항은 북마크 목록 쿼리(`delYn = 'N'` 조건)와 toggle 서비스(`filter(qb -> "N".equals(qb.getDelYn()))`)에서 모두 제외.

### 복원 방법
이 ID(HIST-20260612-001)만으로 복원 시: 추가된 7개 파일 삭제, ErrorCode.java에서 BOOKMARK_NOT_FOUND 줄 제거.
