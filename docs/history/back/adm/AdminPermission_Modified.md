## HIST-20260426-004

- **날짜**: 2026-04-26
- **수정 범위**: 관리자 백엔드 / 권한 관리
- **수정 개요**: PermissionMaster + PermissionDetail 테이블 신규 추가, CRUD API 구현, DataInitializer에 USER/ADMIN 기본 권한 마스터 시딩

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `entity/PermissionMaster.java` | 추가 | 권한 마스터 엔티티 (id, code, name, description, createdAt) |
| `entity/PermissionDetail.java` | 추가 | 세부 권한 엔티티 (id, masterId FK, name, description, timestamps) |
| `repository/PermissionMasterRepository.java` | 추가 | findByCode, existsByCode 메서드 |
| `repository/PermissionDetailRepository.java` | 추가 | findByMasterId 메서드 |
| `dto/request/PermissionMasterRequest.java` | 추가 | code, name, description 요청 DTO |
| `dto/request/PermissionDetailRequest.java` | 추가 | masterId, name, description 요청 DTO |
| `dto/response/PermissionMasterResponse.java` | 추가 | 마스터 + details 목록 포함 응답 DTO |
| `dto/response/PermissionDetailResponse.java` | 추가 | 세부 권한 응답 DTO |
| `service/PermissionService.java` | 추가 | 마스터/세부 권한 CRUD 서비스 |
| `controller/AdminPermissionController.java` | 추가 | `/api/admin/permissions` CRUD 엔드포인트 |
| `config/DataInitializer.java` | 수정 | ensurePermissionMasters() 추가 — USER, ADMIN 기본 권한 마스터 시딩 |

### API 엔드포인트 (신규)

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/admin/permissions` | 전체 권한 마스터 목록 (세부 권한 포함) |
| GET | `/api/admin/permissions/{id}` | 단건 조회 |
| POST | `/api/admin/permissions/masters` | 마스터 추가 |
| PUT | `/api/admin/permissions/masters/{id}` | 마스터 수정 |
| DELETE | `/api/admin/permissions/masters/{id}` | 마스터 삭제 (cascade) |
| POST | `/api/admin/permissions/details` | 세부 권한 추가 |
| PUT | `/api/admin/permissions/details/{id}` | 세부 권한 수정 |
| DELETE | `/api/admin/permissions/details/{id}` | 세부 권한 삭제 |

### 복원 방법

HIST-20260426-004 복원 시:
- 위 신규 파일 모두 삭제
- `DataInitializer.java`에서 `ensurePermissionMasters()` 호출 및 관련 필드 제거
