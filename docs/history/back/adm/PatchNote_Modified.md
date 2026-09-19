## HIST-20260920-001

- **날짜**: 2026-09-20
- **수정 범위**: 관리자 백엔드 패치노트 fallback·동시성 회귀 테스트
- **수정 개요**: fallback summary 정규식이 일반 공백을 삭제하지 않도록 조정하고, 동시성 테스트가 실제 운영 migration 제약명을 사용하도록 수정했습니다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `backend/src/main/java/com/tpmp/testprep/dto/response/PatchNoteResponse.java` | 수정 | fallback 전용 invisible 문자 정규식에서 `\\p{Zs}`를 제거했습니다. |
| `backend/src/test/java/com/tpmp/testprep/controller/AdminPatchNoteControllerWebMvcTest.java` | 수정 | 동시성 무결성 예외 테스트 문자열을 `ux_patch_notes_version_active`로 맞췄습니다. |

### 수정 상세

#### `PatchNoteResponse.java`
- 변경 전: fallback summary 정규식이 `\\p{Zs}`까지 제거해 일반 공백을 보존하지 못했습니다.
- 변경 후: zero-width·format 문자만 제거하고 일반 공백은 후속 `\\s+` 정규화에서 보존합니다.
- 이유: 기존 본문 fallback이 단어 사이의 일반 공백을 잃지 않도록 하기 위해서입니다.

#### `AdminPatchNoteControllerWebMvcTest.java`
- 변경 전: 동시성 테스트가 존재하지 않는 `patch_notes_version_active_uk` 문자열을 사용했습니다.
- 변경 후: 실제 migration 제약명 `ux_patch_notes_version_active`를 사용합니다.
- 이유: 전역 예외 처리의 제약명 매핑 회귀 테스트가 운영 스키마와 일치하도록 하기 위해서입니다.

### 복원 방법

두 파일의 해당 문자열 변경을 이전 값으로 되돌리고 이 히스토리 항목을 삭제합니다. 복원 후 `backend`에서 패치노트 테스트를 다시 실행합니다.

## HIST-20260916-003

- **날짜**: 2026-09-16
- **수정 범위**: 관리자 백엔드 패치노트 동시성·활성 항목 재검토
- **수정 개요**: 저장/수정 시 즉시 flush하여 버전 유니크 충돌을 서비스 오류로 변환하고, 운영 커밋 예외 및 항목 활성 플래그를 보강했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `backend/src/main/java/com/tpmp/testprep/service/PatchNoteService.java` | 수정 | create/update를 `saveAndFlush` 경계로 통일하고 정확한 버전 제약 예외 변환 |
| `backend/src/main/java/com/tpmp/testprep/exception/GlobalExceptionHandler.java` | 수정 | 정확한 `ux_patch_notes_version_active` 제약명만 패치노트 중복 오류로 매핑 |
| `backend/src/main/java/com/tpmp/testprep/entity/PatchNote.java` | 수정 | `del_yn='N'` 및 `use_yn='Y'` 항목만 활성 응답에 포함 |
| `backend/src/main/java/com/tpmp/testprep/repository/PatchNoteItemRepository.java` | 수정 | 삭제·사용 플래그 동시 필터 조회 메서드 추가 |
| `backend/src/test/java/com/tpmp/testprep/service/PatchNoteServiceTest.java` | 수정 | flush 시점 생성·수정 중복 충돌 테스트 |
| `backend/src/test/java/com/tpmp/testprep/entity/PatchNoteTest.java` | 수정 | 비활성 항목 제외 테스트 |
| `backend/src/test/java/com/tpmp/testprep/exception/GlobalExceptionHandlerTest.java` | 추가 | 정확한 제약명 및 일반 예외 500 테스트 |
| `backend/src/test/java/com/tpmp/testprep/controller/AdminPatchNoteControllerWebMvcTest.java` | 수정 | 중첩 요청 오류 회귀 테스트 |

### 수정 상세

- 변경 전: JPA 커밋 시점에만 유니크 위반이 드러날 수 있고, 일반 예외의 메시지에 제약명이 포함되어도 전역 매핑될 가능성이 있었다.
- 변경 후: 생성·수정은 `saveAndFlush`로 제약 위반을 서비스 경계에서 처리하며, 전역 핸들러는 `DataIntegrityViolationException` 계열의 정확한 제약명만 패치노트 중복으로 변환한다. 일반 예외는 기존 500을 유지한다. 항목 조회는 삭제되지 않고 사용 중인 행만 반환한다.
- 이유: 동시성 중복 등록의 일관된 오류 응답과 소프트 삭제/비활성화 정책을 보장하기 위해서다.

### 복원 방법

해당 항목의 코드·테스트를 이전 상태로 복원하고 이 기록을 삭제한다. DB의 부분 유니크 인덱스는 운영 중 제거하지 않는다.

## HIST-20260916-002

- **날짜**: 2026-09-16
- **수정 범위**: 관리자 백엔드 패치노트 운영 스키마·동시성 예외·웹 검증
- **수정 개요**: 하위 항목 운영 마이그레이션과 활성 버전 부분 유니크 인덱스를 추가하고, 동시 저장 충돌을 전용 오류로 변환했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `docs/db-migration/20260916_01_create_patch_note_items.sql` | 추가 | 하위 항목 테이블·제약·인덱스 및 활성 버전 부분 유니크 인덱스 |
| `docs/sql/README.md` | 수정 | 신규 델타 적용 순서·명령·목록 등록 |
| `docs/db-guidelines.md` | 수정 | 패치 항목 테이블 목록 등록 |
| `backend/src/main/java/com/tpmp/testprep/service/PatchNoteService.java` | 수정 | 동시 버전 유니크 제약 위반 변환 |
| `backend/src/main/java/com/tpmp/testprep/exception/GlobalExceptionHandler.java` | 수정 | 트랜잭션 커밋 시점의 버전 제약 위반 변환 |
| `backend/src/test/java/com/tpmp/testprep/service/PatchNoteServiceTest.java` | 수정 | 무결성 예외 변환 테스트 |
| `backend/src/test/java/com/tpmp/testprep/controller/AdminPatchNoteControllerWebMvcTest.java` | 수정 | 중첩 항목 검증·응답·동시성 오류 테스트 |
| `backend/src/test/java/com/tpmp/testprep/controller/UserPatchNoteControllerTest.java` | 수정 | 중첩 항목 정렬·기존 fallback 테스트 |

### 수정 상세

#### 마이그레이션 및 무결성 예외
- 변경 전: 운영 `ddl-auto=validate` 환경에 `patch_note_items` 스키마와 활성 버전 유니크 보장이 없었다.
- 변경 후: 표준 감사 컬럼·FK·유형/순서 CHECK와 `ux_patch_notes_version_active` 부분 유니크 인덱스를 추가했다. 제약명 기반 무결성 예외는 `PATCH_NOTE_VERSION_DUPLICATE`로 응답한다.
- 이유: 애플리케이션 선검사 사이의 동시 요청도 DB에서 차단하고 일관된 API 오류를 제공하기 위해서다.

### 복원 방법

마이그레이션 하단의 롤백 SQL을 별도 트랜잭션으로 실행하고 코드 변경을 이전 상태로 복원한다. 기존 패치노트 데이터는 삭제하지 않는다.

## HIST-20260916-001

- **날짜**: 2026-09-16
- **수정 범위**: 관리자 백엔드 패치노트 버전별 하위 항목
- **수정 개요**: 릴리즈별 패치 항목 저장·검증·정렬과 버전 중복 검증을 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `backend/src/main/java/com/tpmp/testprep/entity/PatchNote.java` | 수정 | 하위 항목 관계, 정렬, 소프트 삭제를 추가 |
| `backend/src/main/java/com/tpmp/testprep/entity/PatchNoteItem.java` | 추가 | 유형·요약·순서와 감사 정보를 저장하는 하위 엔티티 |
| `backend/src/main/java/com/tpmp/testprep/repository/PatchNoteRepository.java` | 수정 | 활성 버전 중복 조회 추가 |
| `backend/src/main/java/com/tpmp/testprep/repository/PatchNoteItemRepository.java` | 추가 | 활성 하위 항목 정렬 조회 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/request/PatchNoteRequest.java` | 수정 | 하위 항목 요청 목록과 구형 생성자 호환 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/request/PatchNoteItemRequest.java` | 추가 | 항목 요청 DTO 및 Bean Validation 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/PatchNoteResponse.java` | 수정 | 항목 응답 및 기존 content fallback 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/PatchNoteItemResponse.java` | 추가 | 항목 응답 DTO 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/PatchNoteService.java` | 수정 | 하위 항목 저장·검증·버전 중복 검증 추가 |
| `backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java` | 수정 | 버전 중복 오류 코드 추가 |
| `backend/src/test/java/com/tpmp/testprep/service/PatchNoteServiceTest.java` | 수정 | 항목 검증·저장·정렬·fallback·중복 버전 테스트 추가 |
| `backend/src/test/java/com/tpmp/testprep/entity/PatchNoteTest.java` | 수정 | 항목 교체 시 소프트 삭제·정렬 테스트 추가 |
| `backend/src/test/java/com/tpmp/testprep/controller/AdminPatchNoteControllerTest.java` | 수정 | 항목 포함 요청 위임 테스트 추가 |

### 수정 상세

#### `PatchNoteItem` 및 `PatchNote`
- 변경 전: 릴리즈 본문만 저장하고 하위 항목 관계가 없었다.
- 변경 후: 항목을 유형·요약·표시 순서로 저장하며 수정·삭제 시 기존 행을 소프트 삭제한다.
- 이유: 한 버전에 여러 변경 사항을 보존하고 기존 데이터의 물리 삭제를 방지하기 위해서다.

#### `PatchNoteService` 및 DTO
- 변경 전: 버전·본문만 검증하고 응답에 항목을 제공하지 않았다.
- 변경 후: 새 항목 요청은 `vMAJOR.MINOR.PATCH`, 1개 이상 항목, 순수 텍스트 요약과 순서를 검증하고 활성 버전 중복을 거부한다. 항목이 없는 구형 릴리즈는 본문에서 `ETC` fallback을 만든다.
- 이유: 새 API 계약과 기존 4개 필드 요청의 호환성을 함께 유지하기 위해서다.

### 복원 방법

이 항목의 수정 파일을 변경 전 상태로 되돌리고 `PatchNote_Modified.md`에서 이 기록을 삭제하면 된다. 데이터베이스의 하위 항목 행은 소프트 삭제 상태를 유지하므로 필요 시 별도 데이터 복구 절차를 수행한다.
