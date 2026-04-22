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
