## HIST-20260916-003

- **날짜**: 2026-09-16
- **수정 범위**: 사용자 백엔드 패치노트 활성 항목 응답 재검토
- **수정 개요**: 삭제·비활성 항목이 사용자 응답에 노출되지 않도록 활성 필터 회귀 테스트를 반영했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `backend/src/main/java/com/tpmp/testprep/entity/PatchNote.java` | 수정 | `del_yn` 및 `use_yn` 동시 활성 필터 적용 |
| `backend/src/main/java/com/tpmp/testprep/repository/PatchNoteItemRepository.java` | 수정 | 두 플래그 조건의 정렬 조회 추가 |
| `backend/src/test/java/com/tpmp/testprep/entity/PatchNoteTest.java` | 수정 | 비활성 항목 제외 회귀 테스트 |
| `backend/src/test/java/com/tpmp/testprep/controller/UserPatchNoteControllerTest.java` | 수정 | 중첩 응답 정렬·fallback 회귀 유지 |

### 수정 상세

- 변경 전: 사용자 항목 응답 활성 판정이 삭제 여부만 확인했다.
- 변경 후: 삭제되지 않았고 사용 중인 항목만 활성 목록에 포함한다.
- 이유: BaseEntity의 `del_yn`/`use_yn` 조회 규칙을 사용자 API에도 동일하게 적용하기 위해서다.

### 복원 방법

관련 코드와 테스트를 변경 전 상태로 복원하고 이 기록을 삭제한다.

## HIST-20260916-002

- **날짜**: 2026-09-16
- **수정 범위**: 사용자 백엔드 패치노트 중첩 응답 테스트
- **수정 개요**: 버전별 항목 정렬과 기존 content의 `ETC` fallback 응답 보존을 검증했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `backend/src/test/java/com/tpmp/testprep/controller/UserPatchNoteControllerTest.java` | 수정 | 중첩 항목 순서·fallback 응답 테스트 추가 |
| `docs/sql/README.md` | 수정 | 사용자 API가 의존하는 하위 항목 스키마 적용 순서 안내 |

### 수정 상세

- 변경 전: 사용자 컨트롤러 테스트가 릴리즈 본문 응답만 확인했다.
- 변경 후: 항목의 표시 순서와 구형 릴리즈 `ETC` fallback을 확인한다.
- 이유: 사용자 API 계약의 중첩 응답 호환성을 보호하기 위해서다.

### 복원 방법

해당 테스트와 문서를 변경 전 상태로 복원하고 이 기록을 삭제한다.

## HIST-20260916-001

- **날짜**: 2026-09-16
- **수정 범위**: 사용자 백엔드 패치노트 응답
- **수정 개요**: 게시된 릴리즈 응답에 정렬된 패치 항목과 기존 본문 fallback을 포함했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `backend/src/main/java/com/tpmp/testprep/entity/PatchNote.java` | 수정 | 사용자 응답에 사용할 활성 항목 관계와 정렬 추가 |
| `backend/src/main/java/com/tpmp/testprep/entity/PatchNoteItem.java` | 추가 | 패치 항목 엔티티 추가 |
| `backend/src/main/java/com/tpmp/testprep/repository/PatchNoteItemRepository.java` | 추가 | 항목 정렬 조회 리포지토리 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/PatchNoteResponse.java` | 수정 | 항목 목록과 `ETC` fallback 응답 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/PatchNoteItemResponse.java` | 추가 | 항목 응답 DTO 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/PatchNoteService.java` | 수정 | 사용자 응답 변환 경로에서 새 항목을 제공 |

### 수정 상세

- 변경 전: 사용자 패치노트 응답은 릴리즈 본문과 게시 정보만 포함했다.
- 변경 후: 항목을 `displayOrder` 오름차순으로 제공하고, 구형 릴리즈는 본문을 순수 텍스트 `ETC` 항목으로 제공한다.
- 이유: 사용자 화면이 릴리즈 단위로 변경 내역을 표시하면서 기존 릴리즈도 누락하지 않도록 하기 위해서다.

### 복원 방법

해당 기록의 파일을 변경 전 버전으로 복원하고 이 항목을 삭제한다. 하위 항목 데이터는 물리 삭제하지 않고 별도 복구 절차로 관리한다.
