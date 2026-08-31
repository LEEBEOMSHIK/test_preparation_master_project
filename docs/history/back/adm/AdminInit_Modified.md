## HIST-20260831-001

- **날짜**: 2026-08-31
- **수정 범위**: 관리자 백엔드 / DataInitializer 글로벌 메뉴
- **수정 개요**: 이메일 템플릿 관리 메뉴를 정확한 URL·아이콘·순서로 멱등 보강했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java` | 수정 | `/admin/email-templates` 관리자 메뉴 보강 |
| `backend/src/test/java/com/tpmp/testprep/config/DataInitializerTest.java` | 수정 | 메뉴 값과 반복 실행 중복 방지 테스트 |

### 수정 상세

#### `DataInitializer.java`
- 변경 전: 기존 DB에 이메일 템플릿 관리자 메뉴를 보강하는 부팅 단계가 없었다.
- 변경 후: URL이 없을 때만 `이메일 템플릿 관리`, `/admin/email-templates`, `email`, displayOrder `15`, ADMIN 역할의 최상위 메뉴를 저장한다.
- 이유: 신규 DB와 기존 DB 모두 글로벌 관리자 메뉴 계약을 중복 없이 갖게 하기 위해서다.

### 복원 방법

이 ID(`AdminInit_Modified.md` 기준 HIST-20260831-001)로 복원 시 `run()`의 `ensureEmailTemplateAdminMenu()` 호출과 메서드, 대응 테스트 2개를 제거한다.

---

## HIST-20260511-007

- **날짜**: 2026-05-11
- **수정 범위**: 관리자 백엔드 / DataInitializer
- **수정 개요**: 연습장 관리 관리자 메뉴 자동 시딩 추가 — "연습장 관리" 부모 메뉴 + "규칙 관리"/"기록 관리" 하위 메뉴

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../config/DataInitializer.java` | 수정 | `ensurePracticeAdminMenus()` 추가 + `run()` 호출 등록 |

### 수정 상세

#### `DataInitializer.java`
- **`ensurePracticeAdminMenus()`** 신규 추가:
  - `/admin/practice` 없으면 부모 메뉴("연습장 관리", iconKey='practice', displayOrder=11) 생성 후 자식 2개 연결
  - `/admin/practice/rules` : "규칙 관리" (displayOrder=1)
  - `/admin/practice/history` : "기록 관리" (displayOrder=2)
  - 부모만 있고 자식이 없는 경우에도 JdbcTemplate으로 parentId 조회 후 자식 보완 (멱등)
- **`run()` 실행 순서** (변경 후):
  ```
  ... → ensurePracticeMenu() → ensurePracticeAdminMenus() → ensurePermissionMenuAssociations() → ...
  ```

### 복원 방법

HIST-20260511-007 복원 시:
- `ensurePracticeAdminMenus()` 메서드 삭제
- `run()`에서 호출 제거
- DB: `DELETE FROM menu_config WHERE url IN ('/admin/practice', '/admin/practice/rules', '/admin/practice/history')`

---

## HIST-20260511-004

- **날짜**: 2026-05-11
- **수정 범위**: 백엔드 / 연습장 (DataInitializer + 신규 파일)
- **수정 개요**: 연습장 기능 신규 구현 — prac_* 테이블 스키마/시딩, 연습장 메뉴 추가, SQL 실행 API

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../service/PracticeService.java` | 추가 | SQL 실행·검증·시드·초기화 로직 |
| `backend/.../controller/UserPracticeController.java` | 추가 | `/api/user/practice/sql/*` REST 엔드포인트 |
| `backend/.../config/DataInitializer.java` | 수정 | PracticeService 주입 + `ensurePracticeMenu()` + `ensurePracticeSchema()` 추가 |

### 수정 상세

#### `PracticeService.java`
- `execute(sql)`: 멀티 스테이트먼트 차단, 시스템 파괴 명령 차단, prac_ 접두사 검증, SELECT/DML 분기 실행
- `resetData()`: 사용자 생성 prac_ 테이블 DROP + 기본 4개 테이블 TRUNCATE + 재시딩
- `seedDefaultData()`: prac_departments(5) / prac_employees(10) / prac_products(8) / prac_orders(12) 시딩

#### `DataInitializer.java`
- `run()` 에 `ensurePracticeMenu()`, `ensurePracticeSchema()` 호출 추가
- `ensurePracticeSchema()`: prac_* 4개 테이블 CREATE TABLE IF NOT EXISTS + 최초 시딩
- `ensurePracticeMenu()`: `/user/practice` 메뉴 없으면 추가

### 복원 방법

HIST-20260511-004 복원 시:
- `PracticeService.java`, `UserPracticeController.java` 삭제
- `DataInitializer.java`에서 PracticeService 필드 및 `ensurePracticeMenu()`, `ensurePracticeSchema()` 호출/메서드 제거
- DB: `DROP TABLE IF EXISTS prac_orders, prac_employees, prac_products, prac_departments CASCADE`

---

## HIST-20260510-003

- **날짜**: 2026-05-10
- **수정 범위**: 관리자 백엔드 / DataInitializer
- **수정 개요**: 테스트 케이스 관리 메뉴 URL 수정 — `/admin/exams/test-cases`(시험 관리 하위) → `/admin/test-cases`(최상위)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../config/DataInitializer.java` | 수정 | `ensureTestCaseMenu()` — 기존 DB 레코드 마이그레이션 + 신규 생성 URL 변경 |

### 수정 상세

#### `DataInitializer.java` — `ensureTestCaseMenu()`
- **변경 전**: 시험 관리(`/admin/exams`) 하위 자식으로 `/admin/exams/test-cases` 생성
- **변경 후**:
  1. 기존 `/admin/exams/test-cases` 레코드가 있으면 URL → `/admin/test-cases`, `parent_id → NULL`, `icon_key → 'test'`, `display_order → 99`로 UPDATE (멱등 마이그레이션)
  2. `/admin/test-cases`가 없으면 최상위 메뉴로 신규 생성
- **이유**: 실제 페이지 파일이 `src/app/admin/test-cases/page.tsx`에 위치하며 FALLBACK_NAV도 `/admin/test-cases`를 사용하고 있어, DB 메뉴 URL과 불일치

### 복원 방법

HIST-20260510-003 복원 시:
- `ensureTestCaseMenu()`를 `existsByUrl("/admin/exams/test-cases")` 체크 + `examParentId` 기반 하위 생성 형태로 복원
- DB에서 `UPDATE menu_config SET url='/admin/exams/test-cases', parent_id=<exam_id> WHERE url='/admin/test-cases'` 수동 실행

---

## HIST-20260510-001

- **날짜**: 2026-05-10
- **수정 범위**: 관리자 백엔드 / DataInitializer
- **수정 개요**: admin@tpmp.com에 MASTER_ADMIN 세부 권한 자동 부여 + 기본 메뉴에 GENERAL_USER·MASTER_ADMIN 권한 코드 연결

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../config/DataInitializer.java` | 수정 | `ensureAdminUserPermissions()`, `ensurePermissionMenuAssociations()` 추가; `run()` 호출 순서 갱신 |

### 수정 상세

#### `DataInitializer.java`

- **`ensureAdminUserPermissions()`** 신규 추가
  - `user_granted_permissions` 테이블에 admin@tpmp.com–MASTER_ADMIN 연결이 없을 때만 INSERT
  - JdbcTemplate 사용 (JPA self-invocation 우회)

- **`ensurePermissionMenuAssociations()`** 신규 추가 (매 기동 시 실행)
  - `menu_type = 'USER'`인 메뉴 전체에 `GENERAL_USER` 코드가 없으면 `allowedRoles`에 추가
  - `menu_type = 'ADMIN'`인 메뉴 전체에 `MASTER_ADMIN` 코드가 없으면 `allowedRoles`에 추가
  - PostgreSQL `COALESCE + ||` 연산 사용

- **`run()` 실행 순서** (변경 후):
  ```
  ... → ensurePermissionMasters() → ensureDefaultPermissionDetails()
  → ensureAdminUserPermissions()
  → ensureDefaultMenus() → ensureAdminUsersMenu() → ensureExamInfoMenus() → ensureTestCaseMenu()
  → ensurePermissionMenuAssociations()
  ```

### 복원 방법

HIST-20260510-001 복원 시:
- `ensureAdminUserPermissions()`, `ensurePermissionMenuAssociations()` 메서드 삭제
- `run()`에서 두 호출 제거

---

## HIST-20260506-004

- **날짜**: 2026-05-06
- **수정 범위**: 관리자 백엔드 / DataInitializer
- **수정 개요**: 기본 세부 권한(PermissionDetail) 2개 및 테스트 케이스 관리 메뉴 자동 시딩 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../repository/PermissionDetailRepository.java` | 수정 | `existsByCode(String code)` 메서드 추가 |
| `backend/.../config/DataInitializer.java` | 수정 | `PermissionDetailRepository` 주입, `ensureDefaultPermissionDetails()`, `ensureTestCaseMenu()` 추가 및 `run()` 호출 등록 |

### 수정 상세

#### `PermissionDetailRepository.java`
- 변경 전: `findByMasterId(Long masterId)`만 존재
- 변경 후: `boolean existsByCode(String code)` 추가 (중복 삽입 방지용)

#### `DataInitializer.java`
- **`ensureDefaultPermissionDetails()`** 신규 추가 — DB에 없을 때만 다음 2개 생성:
  - `GENERAL_USER` / "일반 사용자" — PermissionMaster `USER` 하위
  - `MASTER_ADMIN` / "총괄 관리자" — PermissionMaster `ADMIN` 하위
- **`ensureTestCaseMenu()`** 신규 추가 — `/admin/exams/test-cases` 가 없을 때만 "테스트 케이스 관리" 메뉴 생성 (시험 관리 하위, displayOrder=3)
- `run()` 실행 순서:
  ```
  ensurePermissionMasters() → ensureDefaultPermissionDetails() → ensureDefaultMenus()
  → ensureAdminUsersMenu() → ensureExamInfoMenus() → ensureTestCaseMenu()
  ```

### 복원 방법

HIST-20260506-004 복원 시:
- `PermissionDetailRepository`에서 `existsByCode` 제거
- `DataInitializer`에서 `permissionDetailRepository` 필드·주입 제거
- `ensureDefaultPermissionDetails()`, `ensurePermissionDetail()`, `ensureTestCaseMenu()` 메서드 삭제
- `run()`에서 두 호출 제거

---

## HIST-20260505-011

- **날짜**: 2026-05-05
- **수정 범위**: 관리자 백엔드 / DataInitializer
- **수정 개요**: `ensureDomainMasterWithCode` — 기존 마스터에 code 부여 후 `save()` 미호출 버그 수정 (변경이 DB에 반영되지 않던 문제)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../config/DataInitializer.java` | 수정 | `byName` 분기에서 `updateCode()` 후 `domainMasterRepository.save(existing)` 추가 |

### 수정 상세

#### `DataInitializer.java`
- **근본 원인**: `@Transactional` 어노테이션이 self-invocation(같은 빈 내부 호출)으로 인해 프록시를 거치지 않아 실제 트랜잭션이 열리지 않음. `findByName()`이 반환한 엔티티는 세션이 닫힌 detached 상태이므로 `updateCode()`만으로는 dirty-checking이 동작하지 않음.
- 변경 전:
  ```java
  var byName = domainMasterRepository.findByName(masterName);
  if (byName.isPresent()) {
      byName.get().updateCode(code);
      log.info(...);
      return;
  }
  ```
- 변경 후:
  ```java
  var byName = domainMasterRepository.findByName(masterName);
  if (byName.isPresent()) {
      DomainMaster existing = byName.get();
      existing.updateCode(code);
      domainMasterRepository.save(existing);  // detached 엔티티 → merge → DB 반영
      log.info(...);
      return;
  }
  ```

### 복원 방법

HIST-20260505-011 복원 시: `domainMasterRepository.save(existing)` 한 줄 및 `existing` 변수 선언 제거.

---

## HIST-20260505-008

- **날짜**: 2026-05-05
- **수정 범위**: 관리자 백엔드 / DataInitializer
- **수정 개요**: `ensureDomainMaster` → `ensureDomainMasterWithCode` 리팩토링, EXAM_YEAR·EXAM_ROUND 도메인 마스터 데이터 추가 (기존 코드 없는 마스터에 code 자동 할당 포함)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../config/DataInitializer.java` | 수정 | `ensureDomainMaster` 제거 → `ensureDomainMasterWithCode` 추가; `run()`에 EXAM_YEAR·EXAM_ROUND 초기화 호출 추가 |

### 수정 상세

#### `DataInitializer.java`

- 변경 전: `ensureDomainMaster(String masterName, String[] slaveNames)` — 이름으로만 마스터를 찾고 code 미설정
- 변경 후: `ensureDomainMasterWithCode(String code, String masterName, String[] slaveNames)` — 3단계 처리:
  1. `findByCode(code)` → 이미 code 있으면 skip
  2. `findByName(masterName)` → code 없는 기존 레코드면 code 할당 후 skip (마이그레이션)
  3. 둘 다 없으면 새 마스터 + 슬레이브 생성

- `run()` 변경:
  ```java
  // 변경 전
  ensureDomainMaster("문제 유형", new String[]{"운영체제", "SQL", ...});
  ensureDomainMaster("시험 유형", new String[]{"SQLD", ...});

  // 변경 후
  ensureDomainMasterWithCode("QUESTION_TYPE", "문제 유형", new String[]{"운영체제", "SQL", ...});
  ensureDomainMasterWithCode("EXAM_TYPE",     "시험 유형", new String[]{"SQLD", ...});
  ensureDomainMasterWithCode("EXAM_YEAR",     "시험 연도", new String[]{"2026","2025","2024","2023","2022"});
  ensureDomainMasterWithCode("EXAM_ROUND",    "시험 회차", new String[]{"1","2","3","4","5","6","7","8","9","10"});
  ```

### 복원 방법

HIST-20260505-008 복원 시:
- `ensureDomainMasterWithCode` → `ensureDomainMaster(String masterName, String[] slaveNames)` 시그니처로 복원 (code 파라미터·할당 로직 제거)
- `run()`에서 EXAM_YEAR·EXAM_ROUND 두 호출 제거
- 기존 QUESTION_TYPE·EXAM_TYPE 호출을 이름만 전달하는 형태로 복원

---

## HIST-20260428-009

- **날짜**: 2026-04-28
- **수정 범위**: 관리자 백엔드 / DataInitializer
- **수정 개요**: 빌드 오류 수정 — 존재하지 않는 `ensureExamTypeCategories()` 호출 제거

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../config/DataInitializer.java` | 수정 | `run()` 에서 `ensureExamTypeCategories()` 호출 제거 |

### 수정 상세

#### `DataInitializer.java`
- **변경 전**: `run()` 마지막에 `ensureExamTypeCategories()` 호출
- **변경 후**: 해당 호출 제거
- **이유**: 이전 세션에서 ExamTypeCategory 엔티티 방식을 검토하다 취소했으나 `run()` 내 호출부가 잔류 → 컴파일/기동 오류 원인

### 복원 방법

복원 불필요 (잔여 코드 제거).

---

## HIST-20260420-009

- **날짜**: 2026-04-20
- **수정 범위**: 관리자 백엔드 / 데이터 초기화
- **수정 개요**: 테스트 사용자 계정(user@tpmp.com) 자동 생성 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| config/DataInitializer.java | 수정 | ensureTestUser() 메서드 추가, run()에서 호출 |

### 수정 상세

#### `DataInitializer.java`
- 변경 전: 관리자 계정(admin@tpmp.com)만 초기 생성
- 변경 후: 테스트 사용자 계정 추가 생성
  - 이메일: user@tpmp.com
  - 비밀번호: User1234!
  - 이름: 테스트 사용자
  - 역할: USER

### 복원 방법

HIST-20260420-009 복원 시:
- DataInitializer.java에서 TEST_USER_* 상수, ensureTestUser() 메서드, run()의 ensureTestUser() 호출 제거
