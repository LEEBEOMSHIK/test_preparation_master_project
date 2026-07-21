## HIST-20260721-002

- **날짜**: 2026-07-21
- **수정 범위**: 사용자 백엔드 / 내 시험 접수 정보
- **수정 개요**: `validateDates()`에 날짜 검증 2가지 추가 — 접수일이 시험일보다 늦으면 거부, 연도가 `[2000, 현재연도+10]` 범위를 벗어나면 거부(백엔드가 최종 방어선)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/UserExamApplicationService.java` | 수정 | `validateDates()`에 순서 검증(`applicationDate().isAfter(examDate())`)과 `validateYearRange()`(신규 private 메서드) 호출 추가, `MIN_ALLOWED_YEAR=2000` 상수 추가, 상한은 `LocalDate.now().getYear() + 10`으로 동적 계산, `java.time.LocalDate` import 추가 |
| `backend/src/test/java/com/tpmp/testprep/service/UserExamApplicationServiceTest.java` | 수정 | 신규 검증 2개에 대한 테스트 6건 추가 — 순서 위반 실패(create/update 각 1건)·순서 정상 저장 1건, 연도 하한 미만 실패 1건, 연도 상한 초과 실패 1건, 연도 상한 경계값(현재연도+10) 정상 저장 1건 |

### 수정 상세

#### `UserExamApplicationService.java`
- 변경 전:
  ```java
  private void validateDates(UserExamApplicationRequest request) {
      if (request.applicationDate() == null && request.examDate() == null) {
          throw new BusinessException(ErrorCode.INVALID_INPUT);
      }
  }
  ```
- 변경 후:
  ```java
  private static final int MIN_ALLOWED_YEAR = 2000;

  private void validateDates(UserExamApplicationRequest request) {
      if (request.applicationDate() == null && request.examDate() == null) {
          throw new BusinessException(ErrorCode.INVALID_INPUT);
      }
      int maxAllowedYear = LocalDate.now().getYear() + 10;
      validateYearRange(request.applicationDate(), maxAllowedYear);
      validateYearRange(request.examDate(), maxAllowedYear);
      if (request.applicationDate() != null && request.examDate() != null
              && request.applicationDate().isAfter(request.examDate())) {
          throw new BusinessException(ErrorCode.INVALID_INPUT);
      }
  }

  private void validateYearRange(LocalDate date, int maxAllowedYear) {
      if (date == null) {
          return;
      }
      int year = date.getYear();
      if (year < MIN_ALLOWED_YEAR || year > maxAllowedYear) {
          throw new BusinessException(ErrorCode.INVALID_INPUT);
      }
  }
  ```
- 이유: 프론트엔드 검증만으로는 API 직접 호출을 막을 수 없어, 접수일·시험일 순서 역전과 비현실적 연도(1900년, 9999년 등) 입력을 백엔드에서 최종적으로 차단해야 함. `create`·`update` 둘 다 기존에 `validateDates()`를 호출하고 있어 이 메서드 안에만 추가하면 양쪽 경로에 자동 적용됨. 기존 `INVALID_INPUT` 에러코드를 재사용(전용 에러코드 신설은 과함 — 프론트가 이미 구체적 안내 메시지를 표시하므로 백엔드는 방어선 역할만 수행).

### 검증
- `./gradlew test --tests "com.tpmp.testprep.service.UserExamApplicationServiceTest"` — BUILD SUCCESSFUL
- `./gradlew test` (전체) — BUILD SUCCESSFUL
- 로컬 8080 gradle bootRun 프로세스가 이미 떠 있어 코드 변경 반영을 위해 재기동 필요(강제 종료는 수행하지 않음, 재기동 명령: 기존 프로세스 종료 후 `./gradlew bootRun`)

### 복원 방법
이 ID(HIST-20260721-002)만으로 복원 시 `UserExamApplicationService.java`의 `validateDates()`를 위 "변경 전" 상태로 되돌리고 `MIN_ALLOWED_YEAR` 상수와 `validateYearRange()` 메서드를 제거한다. 테스트 파일에서 이번에 추가된 6개 테스트 메서드(`create_applicationDateAfterExamDate_throwsInvalidInput`, `create_applicationDateOnOrBeforeExamDate_savesSuccessfully`, `create_yearTooOld_throwsInvalidInput`, `create_yearTooFarInFuture_throwsInvalidInput`, `create_yearAtUpperBoundary_savesSuccessfully`, `update_applicationDateAfterExamDate_throwsInvalidInput`)를 제거한다.

---

## HIST-20260721-001

- **날짜**: 2026-07-21
- **수정 범위**: 사용자 백엔드 / 내 시험 접수 정보 (신규)
- **수정 개요**: "내 시험 접수 정보" 기능 신규 구현 — Q-net 공개 API가 제공하지 않는 개인별 접수일·시험일을 사용자가 직접 입력·수정·삭제할 수 있는 Controller-Service-Repository 3레이어 + 신규 테이블(`user_exam_applications`) 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `docs/db-migration/20260721_09_create_user_exam_applications.sql` | 추가 | `user_exam_applications` 테이블 생성 마이그레이션 (FK, 인덱스, 컬럼 코멘트 포함), 로컬 tpmp-db(docker)에 적용 완료 |
| `backend/src/main/java/com/tpmp/testprep/entity/UserExamApplication.java` | 추가 | 엔티티 — `user`(NOT NULL, LAZY), `examInfo`(nullable, LAZY), `examName` 스냅샷, `applicationDate`/`examDate`/`memo`, `createdAt`/`updatedAt` + `@PrePersist`/`@PreUpdate`, `update()` |
| `backend/src/main/java/com/tpmp/testprep/repository/UserExamApplicationRepository.java` | 추가 | `findByUserWithExamInfo(User)` — `LEFT JOIN FETCH examInfo`, `ORDER BY examDate ASC, createdAt DESC` (PostgreSQL의 ASC 기본 NULL-라스트 정렬에 의존, NULLS LAST 키워드 미사용) |
| `backend/src/main/java/com/tpmp/testprep/dto/request/UserExamApplicationRequest.java` | 추가 | `examInfoId`(nullable), `examName`(`@NotBlank @Size(max=200)`), `applicationDate`/`examDate`(nullable), `memo`(`@Size(max=300)`, nullable) |
| `backend/src/main/java/com/tpmp/testprep/dto/response/UserExamApplicationResponse.java` | 추가 | `examInfoTitle`/`examType`은 연결된 `ExamInfo`의 현재 값(examInfo가 null이면 둘 다 null), `from()` 정적 팩토리 |
| `backend/src/main/java/com/tpmp/testprep/service/UserExamApplicationService.java` | 추가 | `getMine`/`create`/`update`/`delete` — `validateDates`(접수일·시험일 둘 다 null이면 `INVALID_INPUT`), `resolveExamInfo`(examInfoId 미존재 시 `INVALID_INPUT`), `checkOwner`로 update·delete 모두 소유자 검증 |
| `backend/src/main/java/com/tpmp/testprep/controller/UserExamApplicationController.java` | 추가 | `/api/user/exam-applications` GET/POST/PUT/{id}/DELETE/{id}, `@AuthenticationPrincipal String email` + `ApiResponse<T>` |
| `backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java` | 수정 | `// User` 섹션에 `USER_EXAM_APPLICATION_NOT_FOUND`(404), `USER_EXAM_APPLICATION_ACCESS_DENIED`(403) 추가 |
| `backend/src/test/java/com/tpmp/testprep/service/UserExamApplicationServiceTest.java` | 추가 | Mockito 단위 테스트 8건 — 날짜 필수값, examInfo 미존재, 자유 입력 저장, 소유자 아닌 update/delete 거부, 정상 update/delete |
| `docs/db-guidelines.md` | 수정 | §7 테이블 목록, §8 ERD, §9.1/§9.2 코멘트에 `user_exam_applications` 추가 |
| `frontend/src/data/tableComments.ts` | 수정 | `TABLE_COMMENTS`에 `user_exam_applications` 항목·`fkRelations`(user_id→users, exam_info_id→exam_info) 추가 |

### 수정 상세

#### `docs/db-migration/20260721_09_create_user_exam_applications.sql`
- 변경 전: 파일 없음(신규)
- 변경 후: `CREATE TABLE IF NOT EXISTS user_exam_applications` (id IDENTITY PK, user_id FK CASCADE, exam_info_id nullable FK SET NULL, exam_name/application_date/exam_date/memo, created_at/updated_at) + 인덱스 2개 + 컬럼 코멘트. 로컬 tpmp-db(docker exec psql)에 적용 완료, 컬럼·인덱스·FK(confdeltype c/n) 검증 쿼리로 확인함.
- 이유: Q-net 공개 API는 종목별 공통 일정만 제공하고 개인별 접수 이력을 제공하지 않아, 사용자가 직접 입력·관리하는 저장소가 필요.

#### `UserExamApplicationRepository.java`
- 변경 전: 파일 없음(신규)
- 변경 후: JPQL `ORDER BY a.examDate ASC, a.createdAt DESC` (NULLS LAST 키워드 미사용)
- 이유: 설계에는 "JPQL NULLS LAST가 안 되면 서비스 레이어 스트림 정렬로 대체"를 명시했으나, 프로젝트가 PostgreSQL 단일 대상 DB이고 PostgreSQL은 ASC 정렬 시 NULL을 기본적으로 맨 뒤에 배치하므로 별도 키워드 없이도 "시험일 미입력 건은 뒤로" 요구사항이 그대로 만족됨. Hibernate 버전 간 JPQL NULLS LAST 지원 여부라는 불확실성을 없애는 더 안전한 선택으로 순수 ASC 정렬을 채택함(런타임 검증은 로컬 gradle 프로세스가 이미 8080에서 구동 중이어서 재기동 없이 서비스 단위 테스트로 대체 검증).

#### `ErrorCode.java`
- 변경 전: `// User` 섹션에 `USER_NOT_FOUND`, `BOOKMARK_NOT_FOUND`, `NICKNAME_ALREADY_EXISTS`만 존재
- 변경 후: `USER_EXAM_APPLICATION_NOT_FOUND(404, "접수 정보를 찾을 수 없습니다.")`, `USER_EXAM_APPLICATION_ACCESS_DENIED(403, "해당 접수 정보에 접근할 수 없습니다.")` 추가
- 이유: update·delete의 소유자 검증(핵심 보안 요구사항) 실패 시 반환할 전용 에러 코드 필요.

### 검증

- `./gradlew compileJava compileTestJava` — 통과
- `./gradlew test --tests "com.tpmp.testprep.service.UserExamApplicationServiceTest"` — 8/8 통과
- `./gradlew test` (전체) — 223/223 통과, 실패 0
- 로컬 tpmp-db(docker)에 마이그레이션 적용 후 컬럼·인덱스·FK 검증 쿼리 실행 완료
- 로컬 8080에 이미 떠 있던 gradle bootRun 프로세스는 재기동하지 않음(사용자 요청) — 실제 API(GET/POST/PUT/DELETE `/api/user/exam-applications`) e2e 확인은 다음 세션에서 백엔드 재기동 후 필요

### 복원 방법
이 ID(HIST-20260721-001)만으로 복원 시: `UserExamApplication.java`/`UserExamApplicationRepository.java`/`UserExamApplicationRequest.java`/`UserExamApplicationResponse.java`/`UserExamApplicationService.java`/`UserExamApplicationController.java`/`UserExamApplicationServiceTest.java` 파일을 삭제하고, `ErrorCode.java`에서 `USER_EXAM_APPLICATION_NOT_FOUND`·`USER_EXAM_APPLICATION_ACCESS_DENIED` 두 줄을 제거한다. DB는 `docs/db-migration/20260721_09_create_user_exam_applications.sql` 하단의 ROLLBACK 절차(`DROP TABLE IF EXISTS user_exam_applications;`)로 되돌린다. `db-guidelines.md`·`tableComments.ts`의 `user_exam_applications` 관련 추가 내용도 함께 제거한다.

---
