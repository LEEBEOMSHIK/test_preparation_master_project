# 패치노트 최종 코드 리뷰 수정 보고서

## 상태

- **PASS** — final-review-fix brief의 Important 1건, Minor 3건, 포함 Recommendation 2건을 모두 반영했다.
- 기준 HEAD: 751158f
- 구현·테스트·히스토리 커밋: bf79cd1
- production 보안 우회·신규 외부 의존성·서버/DB 기동: 없음

## Finding별 RED → GREEN

| Finding | RED 증거 | 구현 | GREEN 증거 |
|---|---|---|---|
| 서버 가시 본문 판정 | PatchNoteServiceTest 16개 중 script/style/template/제로폭 4개 실패 | 숨김 요소를 내용째 제거하고 entity 해제 뒤 Unicode 공백·비가시 문자를 제거 | 서비스 16개 통과; 기존 NBSP 차단과 유효 리치 텍스트 통과 유지 |
| 페이지 기본값·상한 | 교정된 Controller 테스트 7개 중 4개 실패: 기대 10/실제 20, 기대 50/실제 999 | Pageable 기본 size 10 + 패치노트 전용 page≥0, 기본 10, max 50 정규화 | 사용자 4개·관리자 5개 총 9개 통과(size 0·음수 page 포함) |
| RichContent prop 교체 | layout 시점 기대 빈 내용/실제 이전 본문으로 1개 실패 | 정제 상태를 source와 html로 저장하고 현재 prop source만 렌더 | RichContent 3개 통과 |
| 관리자 보안·Validation 체인 | 기본 WebMvc slice에서 미인증 302, USER 200, invalid DTO 403으로 3개 실패 | 테스트에 실제 SecurityConfig와 기존 JWT/OAuth 협력자 mock을 import; production 변경 없음 | 미인증 401, USER 403, ADMIN 200, invalid DTO 400의 4개 통과 |
| 수정 화면 조회 오류 | HTTP 404 메시지 대신 고정 fallback을 표시해 1개 실패 | success=false를 ApiApplicationError로 변환하고 catch에서 extractApiErrorMessage 사용 | HTTP·앱 오류 메시지 및 네트워크 fallback 3개 통과 |
| 원장·문서·히스토리 | deferred Method import와 최종 수정 이력 미기록 | progress를 resolved로 변경하고 네 범위 히스토리를 파일별 다음 ID로 prepend | ID 중복 없음과 파일 상단 위치 확인 |

## TDD 교정 기록

- 페이지 첫 RED의 500은 Page.empty()가 가진 미지원 Pageable 직렬화 때문이었다. 테스트 fixture를 요청 Pageable 기반 PageImpl로 고치고 production 페이지 변경을 제거한 뒤, 실제 경계값 불일치 RED를 다시 확인하고 production을 재적용했다.
- 수정 화면 첫 Jest 명령은 [id]를 정규식으로 해석해 테스트 0개였고, 다음 실행은 프로젝트에 등록되지 않은 matcher 때문에 실패했다. 정확한 path와 기본 matcher로 교정한 뒤 HTTP 404 메시지 결함만 실패하는 RED를 확인했다.

## 최종 검증

| 명령 | 결과 |
|---|---|
| cd frontend; npx tsc --noEmit | PASS, exit 0 |
| cd frontend; npm test -- --watch=false | PASS — 14 suites, 72 tests, snapshots 0, 43.599s |
| cd frontend; npm run build | PASS — Next 14.2.3, 54/54 정적 페이지 |
| cd backend; gradlew.bat test --rerun-tasks --console=plain | PASS — 281 tests, failures 0, ignored 0, 2m 30s |

### 패치노트 라우트

- /user/patch-notes — Static
- /admin/patch-notes — Static
- /admin/patch-notes/new — Static
- /admin/patch-notes/[id]/edit — Dynamic

## 히스토리

- docs/history/back/usr/PatchNotes_Modified.md: HIST-20260826-003
- docs/history/back/adm/PatchNotes_Modified.md: HIST-20260826-003
- docs/history/front/adm/PatchNotes_Modified.md: HIST-20260826-003
- docs/history/front/usr/RichContent_Modified.md: HIST-20260826-001

## 경고·잔여 우려

- Next build의 기존 전역 metadata.viewport 이전 권고가 여러 라우트에서 반복된다. 이번 패치노트 수정과 무관하며 빌드는 통과했다.
- 백엔드의 기존 ExamQuestionSyncServiceTest unchecked 연산, JVM class sharing, Gradle 9 deprecated feature 경고가 남아 있다.
- git의 사용자 전역 ignore 파일 읽기 권한 경고와 기본 PowerShell 오류 1920이 있었으나, cmd.exe fallback으로 모든 검증과 구현 커밋을 완료했다.
- 기능·테스트 기준 잔여 open finding은 없다.
