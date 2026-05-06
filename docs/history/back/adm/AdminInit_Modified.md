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
