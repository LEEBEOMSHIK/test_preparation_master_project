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
