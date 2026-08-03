## HIST-20260804-002

- **날짜**: 2026-08-04
- **수정 범위**: 관리자 백엔드 / 메뉴 — 퀴즈 이력 관리 사이드바 메뉴 추가
- **수정 개요**: HIST-20260804-001에서 `/admin/quiz/history` 화면을 만들었으나 사이드바 메뉴에 등록하지 않아(`/admin/exams/history`와 동일 패턴으로 대시보드 카드로만 진입) 사용자가 "왼쪽 메뉴에 보이지 않는다"고 지적. `menu_config`를 확인한 결과 "연습장 관리 > 기록 관리"처럼 이력 화면도 사이드바에 노출되는 사례가 있어 일관성 없는 예외였음을 확인, `ensureSupportSettingsMenu()`와 동일한 패턴으로 최상위 ADMIN 메뉴 항목을 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java` | 수정 | `ensureQuizHistoryMenu()` 추가 — `menu_config`에 "퀴즈 이력 관리"(`/admin/quiz/history`, iconKey `quiz`, displayOrder 13, ADMIN 전용) idempotent 삽입, init 시퀀스에 `ensureSupportSettingsMenu()` 다음으로 호출 추가 |

### 수정 상세

#### `backend/.../config/DataInitializer.java`
- 변경 전: `/admin/quiz/history`에 대응하는 `menu_config` 행 없음
- 변경 후: `ensureQuizHistoryMenu()`가 `existsByUrl` 체크 후 없으면 `saveMenu(null, "퀴즈 이력 관리", "/admin/quiz/history", "quiz", 13, ADMIN, "ADMIN")` 실행
- 이유: 프론트 `AdminLayoutShell.tsx`의 `ICON_MAP`에 이미 `quiz` 아이콘이 정의돼 있어(USER "데일리 퀴즈" 메뉴에서 재사용) 별도 아이콘 추가 없이 바로 적용 가능

### 검증

- `./gradlew compileJava` 성공
- 백엔드 재기동 후 `menu_config` 테이블에 `id=36, 퀴즈 이력 관리, /admin/quiz/history, quiz, 13` 행이 정상 삽입됨을 SQL로 확인
- 브라우저 확인: 사이드바 "후원 링크 관리"와 "테스트 케이스 관리" 사이에 "퀴즈 이력 관리" 항목이 표시되고, 클릭 시 `/admin/quiz/history`로 정상 이동하며 헤더 타이틀도 "퀴즈 이력 관리"로 올바르게 표시됨을 확인

---

## HIST-20260804-001

- **날짜**: 2026-08-04
- **수정 범위**: 관리자 백엔드 / 퀴즈 이력
- **수정 개요**: 데일리 퀴즈 풀이 이력 조회 API 신규 구현. 기존 대시보드 "오늘 퀴즈 풀이" 카드가 카테고리 구분 없이 범용 "DB 조회"(`/admin/tables/data`) 화면으로 연결되던 것을(`docs/history/front/adm/Dashboard_Modified.md` HIST-20260804-002) 전용 목록 화면으로 대체하기 위한 백엔드 작업 — `ExamHistoryService`/`AdminExamHistoryController` 패턴을 그대로 따랐다. `QuizHistory.questionBankId`는 FK 관계가 없으므로(문항 삭제 시에도 이력 유지) `QuestionBankRepository.findAllById`로 배치 조회 후 응답 DTO에 병합.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/repository/QuizHistoryRepository.java` | 수정 | 관리자 목록용 페이징 조회 메서드 4종 추가 (`findByCreatedAtBetween`, `findByUser_NameContainingIgnoreCaseAndCreatedAtBetween`, `findByUser_EmailContainingIgnoreCaseAndCreatedAtBetween`, `findByDomainNameContainingIgnoreCaseAndCreatedAtBetween`) |
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuizHistoryResponse.java` | 추가 | 퀴즈 이력 응답 DTO — `from(QuizHistory, no, QuestionBank)` 팩토리, `questionBank`가 null이면(문항 삭제됨) `questionContent`도 null |
| `backend/src/main/java/com/tpmp/testprep/service/QuizHistoryService.java` | 추가 | `getQuizHistories(keyword, type, from, to, pageable)` — `ExamHistoryService.getExamHistories()`와 동일한 검색·페이징·역순 번호 매기기 패턴. `type`은 name/email/domain |
| `backend/src/main/java/com/tpmp/testprep/controller/AdminQuizHistoryController.java` | 추가 | `GET /api/admin/quiz-history` — keyword, type(기본 name), from, to, page, size 파라미터, createdAt DESC 정렬 |

### 수정 상세

#### `backend/.../repository/QuizHistoryRepository.java`
- 변경 전: `countByCreatedAtBetween`, `countDailyByCreatedAtBetween`만 존재(대시보드 통계용)
- 변경 후: 관리자 목록 화면용 `Page<QuizHistory>` 반환 메서드 4종 추가
- 이유: 목록 조회는 카운트가 아닌 페이징된 엔티티 목록이 필요

#### `backend/.../dto/response/QuizHistoryResponse.java`
- 변경 전: 파일 없음
- 변경 후: `record QuizHistoryResponse(id, no, userName, userEmail, domainName, questionContent, questionType, userAnswer, correct, createdAt)`
- 이유: `QuizHistory` 엔티티는 `questionBankId`만 보유(FK 없음)하므로 문항 원문(`content`)을 노출하려면 서비스 계층에서 별도 조회·병합 필요

#### `backend/.../service/QuizHistoryService.java`
- 변경 전: 파일 없음
- 변경 후: 키워드 없으면 `findByCreatedAtBetween`, 있으면 `type`(email/domain/기본 name)에 따라 분기 조회. 조회된 페이지의 `questionBankId` 목록을 `distinct`로 모아 `questionBankRepository.findAllById`로 일괄 조회 후 `Map`으로 병합(N+1 방지)
- 이유: `ExamHistoryService`와 동일한 UX(검색·기간 필터·역순 No.)를 제공하되, FK가 없는 `QuestionBank` 조인은 수동 배치 조회로 대체

#### `backend/.../controller/AdminQuizHistoryController.java`
- 변경 전: 파일 없음
- 변경 후: `AdminExamHistoryController`와 동일한 구조의 `@RestController`, `@PreAuthorize("hasRole('ADMIN')")`
- 이유: 관리자 전용 API 일관성 유지

### 검증

- `./gradlew compileJava` 성공
- 서버 재기동 후 `POST /api/auth/login`으로 관리자 JWT 발급 → `GET /api/admin/quiz-history` 호출, 임시 테스트 행(quiz_history 1건, 이후 삭제) 삽입 후 목록·이름 검색·도메인 검색·미일치 검색 4가지 케이스 모두 curl로 정상 응답 확인
