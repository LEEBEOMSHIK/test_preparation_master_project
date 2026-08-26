## HIST-20260826-003

- **날짜**: 2026-08-26
- **수정 범위**: 관리자 백엔드 / 패치노트 검증·페이지·보안 체인
- **수정 개요**: 렌더되지 않는 HTML의 빈 본문 검증, 목록 페이지 상한, 실제 Spring Security·Validation 체인 테스트를 보강했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/PatchNoteService.java` | 수정 | script/style/template 내용과 Unicode 비가시 문자를 빈 본문 판정에서 제거 |
| `backend/src/main/java/com/tpmp/testprep/controller/PatchNotePageable.java` | 추가 | 패치노트 전용 page·size 정규화 |
| `backend/src/main/java/com/tpmp/testprep/controller/AdminPatchNoteController.java` | 수정 | 기본 size 10 및 최대 50 적용 |
| `backend/src/test/java/com/tpmp/testprep/service/PatchNoteServiceTest.java` | 수정 | 숨김 노드·NBSP·제로폭 차단과 유효 리치 텍스트 통과 회귀 테스트 |
| `backend/src/test/java/com/tpmp/testprep/controller/AdminPatchNoteControllerTest.java` | 수정 | 기본값·음수 page·size 0·상한 MockMvc 테스트 |
| `backend/src/test/java/com/tpmp/testprep/controller/AdminPatchNoteControllerWebMvcTest.java` | 추가 | 미인증 401·USER 403·ADMIN 허용·잘못된 DTO 400 실제 체인 테스트 |

### 수정 상세

- 변경 전: 태그만 제거해 숨김 노드 내부 문자열과 제로폭 문자만 있는 본문을 저장할 수 있었고, 관리자 목록은 전역 기본 size 20과 과대 size를 사용했다. 권한 테스트도 Controller 직접 호출과 annotation 문자열 검사에 머물렀다.
- 변경 후: 렌더되지 않는 요소를 내용째 제거하고 entity 해제 뒤 Unicode 비가시 문자를 제거해 빈 본문을 차단한다. 관리자 목록은 기본 10·최대 50으로 제한하며, 실제 `SecurityConfig`와 Bean Validation을 MockMvc로 통과시킨다.
- 이유: DOMPurify 렌더 규칙과 서버 저장 검증을 정렬하고 과대 조회와 보안 회귀를 실제 요청 체인에서 방지한다.

### 복원 방법

이 ID(`back/adm/PatchNotes_Modified.md` 기준 HIST-20260826-003)로 복원 시 숨김 요소·비가시 문자 패턴을 제거해 기존 태그/entity 검증으로 되돌리고, 페이지 annotation·정규화와 신규 MockMvc 보안 테스트 및 추가 경계 테스트를 제거한다.

## HIST-20260826-002

- **날짜**: 2026-08-26
- **수정 범위**: 관리자 백엔드 / 패치노트 관리 전체 구현
- **수정 개요**: 관리자 CRUD·게시 전환·소프트 삭제 API, 메뉴 seed, 감사 정보를 구현하고 시각적으로 빈 HTML을 서버에서 차단했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/PatchNote.java` | 추가/이동 | 공통 감사·삭제 컬럼 기반 패치노트 엔티티 |
| `backend/src/main/java/com/tpmp/testprep/repository/PatchNoteRepository.java` | 추가/수정 | 관리자 목록·단건 활성 조회 |
| `backend/src/main/java/com/tpmp/testprep/service/PatchNoteService.java` | 추가/수정 | CRUD·게시 전환·빈 HTML 서버 검증 |
| `backend/src/main/java/com/tpmp/testprep/controller/AdminPatchNoteController.java` | 추가 | ADMIN 전용 관리 API |
| `backend/src/main/java/com/tpmp/testprep/dto/request/PatchNoteRequest.java` | 추가 | 등록·수정 요청 검증 DTO |
| `backend/src/main/java/com/tpmp/testprep/dto/request/PatchNotePublicationRequest.java` | 추가 | 게시 전환 요청 DTO |
| `backend/src/main/java/com/tpmp/testprep/dto/response/PatchNoteResponse.java` | 추가/수정 | 관리 응답 DTO |
| `backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java` | 수정 | 패치노트 not-found 오류 |
| `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java` | 수정 | 관리자 메뉴 멱등 seed |
| `backend/src/test/java/com/tpmp/testprep/entity/PatchNoteTest.java` | 추가/이동 | 엔티티 상태 전환 테스트 |
| `backend/src/test/java/com/tpmp/testprep/service/PatchNoteServiceTest.java` | 추가/수정 | CRUD·게시·빈 HTML 경계 테스트 |
| `backend/src/test/java/com/tpmp/testprep/controller/AdminPatchNoteControllerTest.java` | 추가/수정 | 관리자 API·권한 위임 테스트 |
| `backend/src/test/java/com/tpmp/testprep/config/DataInitializerTest.java` | 수정 | 메뉴 seed 멱등성 테스트 |
| `docs/db-migration/20260826_01_create_patch_notes.sql` | 추가 | 패치노트 DDL |
| `docs/db-guidelines.md` | 수정 | 패치노트 테이블 등록 |
| `docs/sql/README.md` | 수정 | 마이그레이션 적용 안내 |
| `docs/project-overview.md` | 수정 | 관리자 기능과 실제 DB 필드 문서화 |

### 수정 상세

- 변경 전: 관리자 패치노트 관리 계층과 서버 측 리치 텍스트 실내용 검증이 없었다.
- 변경 후: Controller→Service→Repository CRUD를 제공하고, 태그 제거·HTML entity 해제·NBSP 정규화 후 가시 텍스트가 없으면 `INVALID_INPUT(400)`으로 거부한다.
- 이유: 프론트 검증 우회 API 호출에서도 빈 패치노트 저장을 방지하고 프로젝트 엔티티 패키지 관례를 지킨다.

### 검증 결과

- 패치노트 백엔드 집중 테스트 17개 통과(서비스·엔티티·사용자/관리자 Controller).
- 패치노트 관련 프론트 Jest 5개 suite, 13개 테스트 및 `npx tsc --noEmit` 통과.

### 복원 방법

이 ID를 복원할 때 관리자 Controller·요청 DTO·CRUD 서비스·메뉴 seed와 테스트를 제거하고, 공용 엔티티·Repository·응답 DTO·DDL은 사용자 범위와 함께 되돌린다.

## HIST-20260826-001

- **날짜**: 2026-08-26
- **수정 범위**: 관리자 백엔드 / 패치노트 관리
- **수정 개요**: 관리자 패치노트 관리 메뉴를 멱등 초기화하고 생성·재실행 안전성 테스트를 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java` | 수정 | `/admin/patch-notes` 메뉴 seed와 실행 순서 등록 |
| `backend/src/test/java/com/tpmp/testprep/config/DataInitializerTest.java` | 수정 | 메뉴 생성 1회 및 재실행 시 중복 저장 방지 기대값 추가 |
| `docs/project-overview.md` | 수정 | 관리자 패치노트 CRUD·게시 전환 기능 명시 |

### 수정 상세

#### `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java`
- 변경 전: 패치노트 관리 화면용 관리자 메뉴가 초기화 데이터에 없었다.
- 변경 후: `/admin/patch-notes`가 없을 때만 `패치노트 관리` 메뉴를 표시 순서 14로 생성한다.
- 이유: 기존 메뉴 순서(퀴즈 이력 관리 13)와 충돌하지 않으면서 재실행에도 중복 메뉴를 만들지 않는다.

### 검증 결과

- `gradle.bat test --tests com.tpmp.testprep.config.DataInitializerTest --rerun-tasks --console=plain` 통과 (3개 테스트).

### 복원 방법

이 ID(`PatchNotes_Modified.md` 기준 HIST-20260826-001)로 복원 시 패치노트 관리자 메뉴 초기화 호출·메서드·테스트 기대값을 제거한다. (순번은 파일별이므로 복원 시 파일명도 함께 지정한다.)
