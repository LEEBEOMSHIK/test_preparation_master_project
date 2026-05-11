## HIST-20260511-008

- **날짜**: 2026-05-11
- **수정 범위**: 관리자/사용자 백엔드 / 연습장
- **수정 개요**: 연습장 SQL 실행 기록 저장 + 관리자 기록/규칙 조회 API 신규 구현

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../entity/PracticeHistory.java` | 추가 | practice_history 테이블 엔티티 |
| `backend/.../repository/PracticeHistoryRepository.java` | 추가 | 전체·이메일 필터 조회 메서드 |
| `backend/.../service/PracticeService.java` | 수정 | `execute()` 파라미터에 `userEmail` 추가 + `saveAndReturn()` 히스토리 저장 |
| `backend/.../controller/UserPracticeController.java` | 수정 | `@AuthenticationPrincipal String email` 추가, `execute()` 호출 변경 |
| `backend/.../controller/AdminPracticeController.java` | 추가 | `/api/admin/practice/history`, `/api/admin/practice/rules` 엔드포인트 |

### 수정 상세

#### `PracticeHistory.java`
- 테이블: `practice_history`
- 필드: id, user_email, sql_content, result_type, row_count, error_message, executed_at
- `BaseEntity` 미상속 (로그성 엔티티 — 생성자 번호 불필요)

#### `PracticeHistoryRepository.java`
- `findAllByOrderByExecutedAtDesc(Pageable)` — 전체 최신순 페이징
- `findByUserEmailContainingIgnoreCaseOrderByExecutedAtDesc(String, Pageable)` — 이메일 부분 검색

#### `PracticeService.java`
- `execute(String rawSql)` → `execute(String rawSql, String userEmail)` 시그니처 변경
- `saveAndReturn()`: 검증 실패 포함 모든 실행 결과를 `practice_history`에 저장 후 반환
- 히스토리 저장 실패 시 warn 로그만 남기고 정상 응답 유지

#### `UserPracticeController.java`
- `executeSql` 메서드에 `@AuthenticationPrincipal String email` 파라미터 추가
- `practiceService.execute(request.sql(), email)` 호출로 변경

#### `AdminPracticeController.java`
- `GET /api/admin/practice/history?page=0&size=20&email=` → `HistoryPageResponse` 반환
- `GET /api/admin/practice/rules` → 하드코딩된 규칙 정보 반환 (blockedCommands, typoPatterns 등)

### 복원 방법

HIST-20260511-008 복원 시:
- `PracticeHistory.java`, `PracticeHistoryRepository.java`, `AdminPracticeController.java` 삭제
- `PracticeService.execute()` 파라미터를 `(String rawSql)`로 복원, `PracticeHistoryRepository` 주입 제거, `saveAndReturn()` 제거
- `UserPracticeController.executeSql()`에서 `@AuthenticationPrincipal` 파라미터 제거
- DB: `DROP TABLE IF EXISTS practice_history`
