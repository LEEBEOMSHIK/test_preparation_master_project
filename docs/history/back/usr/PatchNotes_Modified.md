## HIST-20260826-003

- **날짜**: 2026-08-26
- **수정 범위**: 사용자 백엔드 / 패치노트 목록 페이지 경계
- **수정 개요**: 사용자 패치노트 목록의 기본 페이지 크기를 10으로 고정하고 page·size 입력을 로컬 경계에서 안전하게 정규화했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/controller/PatchNotePageable.java` | 추가 | 패치노트 전용 page 0 이상·size 1~50 정규화 |
| `backend/src/main/java/com/tpmp/testprep/controller/UserPatchNoteController.java` | 수정 | 기본 size 10 선언 및 정규화된 Pageable 전달 |
| `backend/src/test/java/com/tpmp/testprep/controller/UserPatchNoteControllerTest.java` | 수정 | 기본값·음수 page·size 0·상한 50 MockMvc 경계 테스트 |

### 수정 상세

- 변경 전: 전역 `Pageable` 기본 size 20과 과대 요청 size를 사용자 패치노트 API가 그대로 사용했다.
- 변경 후: `@PageableDefault(size=10)`과 패치노트 전용 정규화로 page는 0 이상, size는 기본 10·최대 50을 보장한다.
- 이유: 다른 도메인의 전역 설정을 바꾸지 않고 사용자 패치노트 목록의 응답 크기를 예측 가능하게 제한한다.

### 복원 방법

이 ID(`back/usr/PatchNotes_Modified.md` 기준 HIST-20260826-003)로 복원 시 사용자 Controller의 `@PageableDefault`와 정규화 호출을 제거하고, 공유 `PatchNotePageable`은 관리자 범위와 함께 제거하며 추가 테스트를 되돌린다.

## HIST-20260826-002

- **날짜**: 2026-08-26
- **수정 범위**: 사용자 백엔드 / 패치노트 전체 구현
- **수정 개요**: 게시·사용·미삭제 패치노트만 최신 게시순으로 조회하는 사용자 API와 저장 구조를 구현했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/PatchNote.java` | 추가/이동 | 패치노트 JPA 엔티티와 게시 상태 |
| `backend/src/main/java/com/tpmp/testprep/repository/PatchNoteRepository.java` | 추가 | 사용자 공개 목록 조건·정렬 쿼리 |
| `backend/src/main/java/com/tpmp/testprep/service/PatchNoteService.java` | 추가/수정 | 게시 패치노트 조회 서비스 |
| `backend/src/main/java/com/tpmp/testprep/controller/UserPatchNoteController.java` | 추가 | 사용자 목록 API |
| `backend/src/main/java/com/tpmp/testprep/dto/response/PatchNoteResponse.java` | 추가/수정 | 사용자 공통 응답 DTO |
| `backend/src/test/java/com/tpmp/testprep/entity/PatchNoteTest.java` | 추가/이동 | 엔티티 게시·수정 동작 테스트 |
| `backend/src/test/java/com/tpmp/testprep/service/PatchNoteServiceTest.java` | 추가/수정 | 공개 조회 조건·정렬 테스트 |
| `backend/src/test/java/com/tpmp/testprep/controller/UserPatchNoteControllerTest.java` | 추가 | 사용자 API 위임 테스트 |
| `docs/db-migration/20260826_01_create_patch_notes.sql` | 추가 | `patch_notes` 테이블 DDL |
| `docs/db-guidelines.md` | 수정 | 패치노트 테이블 등록 |
| `docs/sql/README.md` | 수정 | 마이그레이션 적용 안내 |
| `docs/project-overview.md` | 수정 | 사용자 패치노트 조회·DB 필드 문서화 |

### 수정 상세

- 변경 전: 사용자에게 제공할 패치노트 저장 모델과 조회 API가 없었다.
- 변경 후: `del_yn=N`, `use_yn=Y`, `published_yn=Y`인 항목만 `published_dt`, `id` 내림차순으로 페이지 조회한다.
- 이유: 비게시·삭제·비활성 항목을 노출하지 않고 최신 변경 사항을 안정적으로 제공한다.

### 검증 결과

- 패치노트 백엔드 집중 테스트 17개 통과(서비스·엔티티·사용자/관리자 Controller).

### 복원 방법

이 ID를 복원할 때 사용자 Controller와 공개 조회 서비스·Repository 메서드를 제거하고, 패치노트 엔티티·응답 DTO·DDL의 공용 구현은 관리자 범위와 함께 되돌린다.

## HIST-20260826-001

- **날짜**: 2026-08-26
- **수정 범위**: 사용자 백엔드 / 패치노트
- **수정 개요**: 사용자에게는 게시된 패치노트 목록 조회만 제공하며 별도 사용자 메뉴 seed를 추가하지 않는 정책을 문서화했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `docs/project-overview.md` | 수정 | 게시 패치노트 사용자 조회 범위를 기능 요구사항에 반영 |

### 수정 상세

#### `docs/project-overview.md`
- 변경 전: 사용자 패치노트 조회 범위가 프로젝트 문서에 정의되지 않았다.
- 변경 후: 사용자 기능을 게시된 패치노트 목록 조회로 한정해 명시했다.
- 이유: 읽음 여부·배지·상세 페이지나 사용자 메뉴 seed 없이 목록만 제공하는 확정 정책을 기록한다.

### 검증 결과

- `gradle.bat test --tests com.tpmp.testprep.config.DataInitializerTest --rerun-tasks --console=plain` 통과 (3개 테스트).

### 복원 방법

이 ID(`PatchNotes_Modified.md` 기준 HIST-20260826-001)로 복원 시 사용자 패치노트 조회 기능 문서 항목을 제거한다. (순번은 파일별이므로 복원 시 파일명도 함께 지정한다.)
