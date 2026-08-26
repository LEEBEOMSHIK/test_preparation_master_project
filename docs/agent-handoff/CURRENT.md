# Agent Handoff - CURRENT

> 최종 갱신: 2026-08-26

## 현재 목표와 확정된 사용자 결정 사항

- 패치노트 전체 기능 구현과 정적·동적 검증을 완료했다.
- 사용자는 상단 헤더 독립 아이콘에서 게시 패치노트 목록만 조회한다. 읽음 여부·배지·상세 페이지·사용자 메뉴 seed는 추가하지 않는다.
- 관리자는 `/admin/patch-notes` 독립 메뉴에서 CRUD와 게시/비게시 전환을 수행한다.
- 시각적으로 빈 HTML은 프론트뿐 아니라 API 직접 호출 시에도 서버에서 400으로 거부한다.

## 완료한 작업

1. `patch_notes` DDL, 엔티티·Repository·DTO·Service·사용자/관리자 Controller와 테스트를 구현했다.
2. 사용자 목록에 페이지네이션·스켈레톤·빈 상태·재시도·안전한 HTML 렌더링과 헤더 진입점을 구현했다.
3. 관리자 목록·등록·수정·삭제·게시 전환, 공통 폼, 로딩·오류 상태와 메뉴 seed를 구현했다.
4. HTTP 백엔드 오류와 명시적 앱 오류는 보존하고 네트워크/임의 오류는 fallback을 쓰도록 API 오류 계약을 수정했다.
5. 마지막 페이지의 유일한 항목 삭제 시 이전 페이지로 이동하고, 그 외에는 현재 페이지를 재조회하도록 보정했다.
6. 태그·HTML entity·NBSP/공백만 남은 본문을 서비스에서 `INVALID_INPUT(400)`으로 차단했다.
7. `PatchNote` 엔티티와 테스트를 `entity` 패키지로 이동하고 모든 import를 갱신했다.
8. 프로젝트 개요의 패치노트 필드를 실제 DB 컬럼명으로 정정하고 범위별 히스토리 `HIST-20260826-002`를 추가했다.
9. 병렬 Jest worker 경합으로 기본 1초를 넘기던 `ExamResultDisplay` 비동기 assertion 한 곳에만 5초 timeout을 적용하고 프론트 전체 테스트를 통과시켰다.
10. API 오류 공통 계약을 `AGENTS.md` Shared Utilities 표에 등록하고 시험 이력 범위 히스토리와 최종 인계 정보를 정리했다.

## 미완료 작업

- 없음.

## 전체 패치노트 수정 파일

### 백엔드·DB

- `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java`
- `backend/src/main/java/com/tpmp/testprep/controller/AdminPatchNoteController.java`
- `backend/src/main/java/com/tpmp/testprep/controller/UserPatchNoteController.java`
- `backend/src/main/java/com/tpmp/testprep/dto/request/PatchNotePublicationRequest.java`
- `backend/src/main/java/com/tpmp/testprep/dto/request/PatchNoteRequest.java`
- `backend/src/main/java/com/tpmp/testprep/dto/response/PatchNoteResponse.java`
- `backend/src/main/java/com/tpmp/testprep/entity/PatchNote.java`
- `backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java`
- `backend/src/main/java/com/tpmp/testprep/repository/PatchNoteRepository.java`
- `backend/src/main/java/com/tpmp/testprep/service/PatchNoteService.java`
- `backend/src/test/java/com/tpmp/testprep/config/DataInitializerTest.java`
- `backend/src/test/java/com/tpmp/testprep/controller/AdminPatchNoteControllerTest.java`
- `backend/src/test/java/com/tpmp/testprep/controller/UserPatchNoteControllerTest.java`
- `backend/src/test/java/com/tpmp/testprep/entity/PatchNoteTest.java`
- `backend/src/test/java/com/tpmp/testprep/service/PatchNoteServiceTest.java`
- `docs/db-migration/20260826_01_create_patch_notes.sql`

### 프론트엔드

- `frontend/src/app/admin/patch-notes/[id]/edit/page.tsx`
- `frontend/src/app/admin/patch-notes/new/page.tsx`
- `frontend/src/app/admin/patch-notes/page.tsx`
- `frontend/src/app/admin/patch-notes/page.test.tsx`
- `frontend/src/app/user/patch-notes/page.tsx`
- `frontend/src/app/user/patch-notes/page.test.tsx`
- `frontend/src/components/admin/PatchNoteForm.tsx`
- `frontend/src/components/admin/PatchNoteForm.test.tsx`
- `frontend/src/components/layout/AdminLayoutShell.tsx`
- `frontend/src/components/layout/UserLayoutShell.tsx`
- `frontend/src/components/ui/RichContent.tsx`
- `frontend/src/components/ui/RichContent.test.tsx`
- `frontend/src/lib/apiError.ts`
- `frontend/src/lib/apiError.test.ts`
- `frontend/src/services/patchNoteService.ts`
- `frontend/src/types/index.ts`

### 문서

- `AGENTS.md`
- `docs/agent-handoff/CURRENT.md`
- `docs/db-guidelines.md`
- `docs/history/back/adm/PatchNotes_Modified.md`
- `docs/history/back/usr/PatchNotes_Modified.md`
- `docs/history/front/adm/PatchNotes_Modified.md`
- `docs/history/front/usr/PatchNotes_Modified.md`
- `docs/history/front/usr/UserExamination_Modified.md`
- `docs/history/front/usr/UserExamHistory_Modified.md`
- `docs/project-overview.md`
- `docs/sql/README.md`

## 실행한 검증과 결과

| 명령 | 결과 |
|---|---|
| `npm test -- --runInBand src/lib/apiError.test.ts src/components/ui/RichContent.test.tsx src/app/user/patch-notes/page.test.tsx src/components/admin/PatchNoteForm.test.tsx src/app/admin/patch-notes/page.test.tsx` | 통과 (5 suite, 13 tests) |
| `npx tsc --noEmit` | 통과 |
| `gradlew.bat test --tests com.tpmp.testprep.service.PatchNoteServiceTest --tests com.tpmp.testprep.entity.PatchNoteTest --tests com.tpmp.testprep.controller.AdminPatchNoteControllerTest --tests com.tpmp.testprep.controller.UserPatchNoteControllerTest --rerun-tasks --console=plain` | 통과 (17 tests) |
| `npx jest src/components/ui/ExamResultDisplay.test.tsx --runInBand` | 통과 (18 tests) |
| `npm test -- --watch=false` | 통과 (13 suite, 68 tests) |
| `npm run build` | 통과 (`/user/patch-notes`, `/admin/patch-notes`, `/admin/patch-notes/new`, `/admin/patch-notes/[id]/edit` 라우트 생성 확인) |
| `gradlew.bat test --console=plain` | 통과 (267 tests) |

## 실패·경고·주의사항

- 제한된 네트워크에서 Gradle wrapper 다운로드가 차단되어 권한 승인 후 집중 테스트를 실행했다.
- 첫 백엔드 GREEN에서 `HtmlUtils` import 오기, 다음 실행에서 테스트의 불필요 Mockito stub을 발견해 수정 후 재검증했다.
- Gradle 9 호환성 deprecated feature 경고와 기존 `ExamQuestionSyncServiceTest` unchecked 연산 경고가 출력됐다.
- 프론트 전체 병렬 테스트에서 `ExamResultDisplay.test.tsx:111`만 기본 1초 대기 한도를 넘는 현상이 반복됐고, 해당 assertion에만 5초를 적용한 뒤 병렬 전체 테스트가 통과했다.
- Next.js 빌드에서 기존 metadata `viewport` 설정 관련 경고가 출력됐지만 빌드와 패치노트 4개 라우트 생성은 통과했다.
- **원본 작업공간의 기존 미커밋 파일 `docs/history/front/usr/UserExamInfo_Modified.md`, `frontend/src/app/user/exam-info/page.tsx`, `CACHE_POLICY.md`는 건드리거나 병합에 포함하면 안 된다.**

## 다음 세션이 바로 실행할 명령

```powershell
cd C:\projects\test_preparation_master_project\.worktrees\feature-patch-notes
git status --short
git log -1 --oneline
```

## 건드리면 안 되는 파일 또는 기존 미추적 파일

- 원본 작업공간의 `docs/history/front/usr/UserExamInfo_Modified.md`
- 원본 작업공간의 `frontend/src/app/user/exam-info/page.tsx`
- 원본 작업공간의 `CACHE_POLICY.md`
