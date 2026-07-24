## HIST-20260724-001

- **날짜**: 2026-07-24
- **수정 범위**: 관리자 백엔드 / 도메인(카테고리·시험유형) 삭제 가드
- **수정 개요**: `DomainService.isSlaveInUse()`가 호출하는 `QuestionBankRepository.existsByCategoryIdOrExamTypeId`에 `del_yn` 필터가 없어, 참조 문항이 전부 소프트 삭제(`del_yn='Y'`)돼도 해당 카테고리/시험유형 슬레이브를 영구 삭제할 수 없던 버그를 수정. 파생 쿼리 메서드명으로는 `CategoryIdOrExamTypeIdAndDelYn` 형태로 만들면 Spring Data가 `(categoryId = ?) OR (examTypeId = ? AND delYn = ?)`로 잘못 그루핑하므로(Or로 먼저 분리 후 각 세그먼트에 And 적용), `(category.id = :slaveId OR examType.id = :slaveId) AND delYn = 'N'`을 명시적으로 표현하는 JPQL `@Query`로 신규 메서드 `existsActiveByCategoryIdOrExamTypeId(Long slaveId)`를 추가하고 기존 `existsByCategoryIdOrExamTypeId`는 제거, 유일한 호출부(`DomainService.isSlaveInUse`)를 교체했다. 다른 호출부 없음(grep 확인).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `backend/src/main/java/com/tpmp/testprep/repository/QuestionBankRepository.java` | 수정 | `existsByCategoryIdOrExamTypeId(Long, Long)` 파생 쿼리 제거, `existsActiveByCategoryIdOrExamTypeId(Long slaveId)` JPQL `@Query`로 대체(del_yn='N' 필터 포함) |
| `backend/src/main/java/com/tpmp/testprep/service/DomainService.java` | 수정 | `isSlaveInUse`가 신규 메서드 `existsActiveByCategoryIdOrExamTypeId(slaveId)` 호출로 변경 |
| `backend/src/test/java/com/tpmp/testprep/service/DomainServiceTest.java` | 수정 | 기존 스텁을 신규 메서드명으로 교체, "소프트 삭제된 question_bank만 남으면 삭제 허용/활성 문항 있으면 삭제 차단" 회귀 테스트 2건 추가 |

### 수정 상세

#### `backend/src/main/java/com/tpmp/testprep/repository/QuestionBankRepository.java`
- 변경 전: `boolean existsByCategoryIdOrExamTypeId(Long categoryId, Long examTypeId);` — 파생 쿼리, del_yn 조건 없음.
- 변경 후: `@Query("SELECT CASE WHEN COUNT(qb) > 0 THEN true ELSE false END FROM QuestionBank qb WHERE (qb.category.id = :slaveId OR qb.examType.id = :slaveId) AND qb.delYn = 'N'") boolean existsActiveByCategoryIdOrExamTypeId(@Param("slaveId") Long slaveId);`
- 이유: 소프트 삭제된 문항만 남아있으면 카테고리/시험유형을 영구 삭제할 수 있어야 하는데, del_yn 필터가 없어 항상 "사용 중"으로 오판(webapp-planner가 코드 직접 확인). 로컬 DB(tpmp-db)에서 롤백 트랜잭션으로 실측 검증: 슬레이브 하나를 참조하는 문항 64건을 임시로 `del_yn='Y'` 처리 후 기존 쿼리는 true(삭제 불가), 신규 쿼리는 false(삭제 가능)를 반환함을 확인 후 롤백(데이터 변경 없음).

#### `backend/src/main/java/com/tpmp/testprep/service/DomainService.java`
- 변경 전: `questionBankRepository.existsByCategoryIdOrExamTypeId(slaveId, slaveId)`
- 변경 후: `questionBankRepository.existsActiveByCategoryIdOrExamTypeId(slaveId)`
- 이유: 리포지토리 메서드 교체에 따른 호출부 반영.

### 복원 방법
이 ID(HIST-20260724-001)만으로 복원 시 `QuestionBankRepository.java`의 `existsActiveByCategoryIdOrExamTypeId`를 제거하고 `boolean existsByCategoryIdOrExamTypeId(Long categoryId, Long examTypeId);` 파생 쿼리로 되돌린 뒤, `DomainService.isSlaveInUse`의 호출을 `existsByCategoryIdOrExamTypeId(slaveId, slaveId)`로 되돌린다.

---

## HIST-20260529-001

- **날짜**: 2026-05-29
- **수정 범위**: 관리자 백엔드 / 도메인 데이터 정리 (코드 변경 없음)
- **수정 개요**: QUESTION_TYPE(masterId=1) 하위에 중복 존재하던 "웹 기술" 슬레이브(id 32, 33) 중 미사용 슬레이브 32를 삭제하여 중복 제거

### 작업 내용

- **현상**: "웹 기술" 슬레이브가 id 32·33 두 건으로 중복, 둘 다 displayOrder=8
- **참조 현황**: id 32 참조 문항 0건(미사용), id 33 참조 문항 1건(question_bank id 89, 2024년 3회 9번 URL 구조)
- **조치**: `DELETE /api/admin/domains/masters/1/slaves/32` 호출로 미사용 슬레이브 32 삭제 → "웹 기술"은 id 33만 유지
- **안전성**: `DomainService.deleteSlave`의 `isSlaveInUse`(question_bank category/examType + examination category) 검사 통과(32 미사용). 33은 문항 참조로 보존
- **재생성 여부**: `DataInitializer.ensureDomainMasterWithCode`는 QUESTION_TYPE 코드가 이미 존재하면 전체 스킵하므로 재시작 시 32가 재생성되지 않음

### 복원 방법

`POST /api/admin/domains/masters/1/slaves` `{"name":"웹 기술","displayOrder":8}` 호출로 재생성(새 id 발급).

---

## HIST-20260505-007

- **날짜**: 2026-05-05
- **수정 범위**: 관리자 백엔드 / 도메인 테이블 관리
- **수정 개요**: `DomainMaster`에 `code` 필드 추가 — 이름 대신 코드로 도메인 마스터를 식별할 수 있도록 변경 (EXAM_TYPE, QUESTION_TYPE, EXAM_YEAR, EXAM_ROUND 등)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `entity/DomainMaster.java` | 수정 | `code` 필드 추가 (`UNIQUE, VARCHAR 50`); `updateCode()` 메서드 추가; 생성자 파라미터에 code 추가 |
| `repository/DomainMasterRepository.java` | 수정 | `findByCode(String code): Optional<DomainMaster>` 추가 |
| `dto/request/DomainMasterRequest.java` | 수정 | 선택 필드 `@Size(max=50) @Pattern(regexp="^[A-Z_]*$") String code` 추가 |
| `dto/response/DomainMasterResponse.java` | 수정 | record에 `String code` 필드 추가, `from()` 매핑 포함 |
| `service/DomainService.java` | 수정 | `createMaster(String code, String name)` — code를 엔티티 생성자에 전달 |
| `controller/AdminDomainController.java` | 수정 | `createMaster` 호출 시 `request.code()` 전달 |

### 수정 상세

#### `DomainMaster.java`
- 변경 전: `name`만 존재, code 필드 없음
- 변경 후:
  ```java
  @Column(unique = true, length = 50)
  private String code;
  ```
  - `public DomainMaster(String code, String name)` 생성자 추가
  - `public void updateCode(String code)` 메서드 추가

#### `DomainMasterRepository.java`
- 변경 전: `findByName` 등 기존 메서드만 존재
- 변경 후: `Optional<DomainMaster> findByCode(String code)` 추가

#### `DomainMasterRequest.java`
- 변경 전: `@NotBlank @Size(max=100) String name` 단일 필드
- 변경 후: `@Size(max=50) @Pattern(regexp="^[A-Z_]*$") String code` 선택 필드 추가

#### `DomainMasterResponse.java`
- 변경 전: `record(Long id, String name, List<DomainSlaveResponse> slaves)`
- 변경 후: `record(Long id, String code, String name, List<DomainSlaveResponse> slaves)` — `master.getCode()` 매핑 추가

#### `DomainService.java`
- 변경 전: `createMaster(String name)` — `new DomainMaster(name)` 생성
- 변경 후: `createMaster(String code, String name)` — `new DomainMaster(code, name)` 생성

### 복원 방법

HIST-20260505-007 복원 시:
- `DomainMaster.java`: `code` 필드 제거, `updateCode()` 제거, 생성자를 `(String name)` 단일 파라미터로 복원
- `DomainMasterRepository.java`: `findByCode` 제거
- `DomainMasterRequest.java`: `code` 필드 제거
- `DomainMasterResponse.java`: record에서 `String code` 제거, `from()` 매핑 제거
- `DomainService.java`: `createMaster` 파라미터를 `(String name)`으로 복원
- `AdminDomainController.java`: `domainService.createMaster(request.name())`으로 복원

---

## HIST-20260501-004

- **날짜**: 2026-05-01
- **수정 범위**: 관리자 백엔드 / 도메인 테이블 관리
- **수정 개요**: 도메인 슬레이브/마스터 삭제 시 500 오류 수정 — FK 참조 중인 항목 삭제 시 `DataIntegrityViolationException` 미처리 → 사전 참조 확인 로직 추가 및 `GlobalExceptionHandler`에 안전망 핸들러 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `exception/ErrorCode.java` | 수정 | `DOMAIN_IN_USE` 에러 코드 추가 (409 Conflict) |
| `exception/GlobalExceptionHandler.java` | 수정 | `DataIntegrityViolationException` 핸들러 추가 → 409 반환 |
| `repository/QuestionBankRepository.java` | 수정 | `existsByCategoryIdOrExamTypeId()` 메서드 추가 |
| `repository/ExaminationRepository.java` | 수정 | `existsByCategoryId()` 메서드 추가 |
| `service/DomainService.java` | 수정 | `QuestionBankRepository`, `ExaminationRepository` 주입 + `isSlaveInUse()` 헬퍼 추가 + `deleteSlave`, `deleteMaster` 사전 참조 확인 로직 추가 |

### 수정 상세

#### 원인
`DomainSlave`는 `question_bank.category_id`, `question_bank.exam_type_id`, `examinations.category_id`에서 FK로 참조된다. 참조 중인 slave를 삭제하면 PostgreSQL이 FK 제약 위반 예외를 던지는데, `GlobalExceptionHandler`에 `DataIntegrityViolationException` 핸들러가 없어 `handleUnexpected` → 500으로 처리됐다. 마스터 삭제도 `CascadeType.ALL`로 slave를 연쇄 삭제하므로 동일하게 실패.

#### `ErrorCode.java`
- 추가: `DOMAIN_IN_USE(HttpStatus.CONFLICT, "다른 데이터에서 참조 중인 항목입니다. 먼저 해당 항목의 참조를 제거하세요.")`

#### `GlobalExceptionHandler.java`
- 추가: `@ExceptionHandler(DataIntegrityViolationException.class)` → `DOMAIN_IN_USE` (409) 반환

#### `QuestionBankRepository.java`
- 추가: `boolean existsByCategoryIdOrExamTypeId(Long categoryId, Long examTypeId)`

#### `ExaminationRepository.java`
- 추가: `boolean existsByCategoryId(Long categoryId)`

#### `DomainService.java`
- 추가 의존성: `QuestionBankRepository`, `ExaminationRepository`
- 추가 헬퍼: `isSlaveInUse(Long slaveId)` — questionBank와 examination 양쪽 참조 확인
- `deleteSlave`: 삭제 전 `isSlaveInUse` 확인 → 참조 중이면 `BusinessException(DOMAIN_IN_USE)` throw
- `deleteMaster`: 삭제 전 모든 slave의 참조 확인 → 하나라도 참조 중이면 `BusinessException(DOMAIN_IN_USE)` throw

### 복원 방법

HIST-20260501-004 복원 시:
- `ErrorCode.java`에서 `DOMAIN_IN_USE` 제거
- `GlobalExceptionHandler.java`에서 `DataIntegrityViolationException` 핸들러 제거
- `QuestionBankRepository.java`에서 `existsByCategoryIdOrExamTypeId` 제거
- `ExaminationRepository.java`에서 `existsByCategoryId` 제거
- `DomainService.java`에서 `QuestionBankRepository`, `ExaminationRepository` 주입 제거, `isSlaveInUse` 제거, `deleteSlave`/`deleteMaster`에서 참조 확인 코드 제거

---

## HIST-20260420-003

- **날짜**: 2026-04-20
- **수정 범위**: 관리자 백엔드 / 도메인 테이블 관리
- **수정 개요**: 도메인 마스터/슬레이브 CRUD API 추가 (기존 GET 전용 → 전체 CRUD)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| entity/DomainMaster.java | 수정 | `updateName()` 메서드 추가 |
| entity/DomainSlave.java | 수정 | `update(name, displayOrder)` 메서드 추가 |
| dto/request/DomainMasterRequest.java | 추가 | `record(@NotBlank @Size(max=100) String name)` |
| dto/request/DomainSlaveRequest.java | 추가 | `record(@NotBlank @Size(max=100) String name, @NotNull @Min(1) Integer displayOrder)` |
| dto/response/DomainSlaveResponse.java | 수정 | `displayOrder` 필드 추가 |
| exception/ErrorCode.java | 수정 | `DOMAIN_NOT_FOUND` 추가 |
| service/DomainService.java | 수정 | DomainSlaveRepository 주입, createMaster/updateMaster/deleteMaster/createSlave/updateSlave/deleteSlave 추가 |
| controller/AdminDomainController.java | 수정 | GET 전용 → 전체 CRUD 엔드포인트 추가 |

### API 엔드포인트 (신규)

| Method | URL | 설명 |
|--------|-----|------|
| POST | `/api/admin/domains/masters` | 마스터 생성 |
| PUT | `/api/admin/domains/masters/{masterId}` | 마스터 이름 수정 |
| DELETE | `/api/admin/domains/masters/{masterId}` | 마스터 + 슬레이브 cascade 삭제 |
| POST | `/api/admin/domains/masters/{masterId}/slaves` | 슬레이브 추가 |
| PUT | `/api/admin/domains/masters/{masterId}/slaves/{slaveId}` | 슬레이브 수정 |
| DELETE | `/api/admin/domains/masters/{masterId}/slaves/{slaveId}` | 슬레이브 삭제 |

### 복원 방법

HIST-20260420-003 복원 시:
- `DomainMaster.java`에서 `updateName()` 제거
- `DomainSlave.java`에서 `update()` 제거
- `DomainMasterRequest.java`, `DomainSlaveRequest.java` 삭제
- `DomainSlaveResponse.java`에서 `displayOrder` 필드 제거
- `ErrorCode.java`에서 `DOMAIN_NOT_FOUND` 제거
- `DomainService.java`를 GET 전용 `getAllMasters()` 만 남기고 나머지 제거
- `AdminDomainController.java`를 `GET /` 엔드포인트만 남기고 나머지 제거
