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
