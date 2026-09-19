# 버전별 패치노트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자에게 버전별 패치 항목 등록 기능을 제공하고 사용자에게 배포 버전별 패치 목록을 공개한다.

**Architecture:** 기존 `patch_notes` 릴리즈 엔티티를 유지하고 `patch_note_items` 자식 엔티티를 추가한다. 관리자와 사용자 API는 릴리즈 응답에 정렬된 항목을 중첩하고, 기존 페이지네이션·게시·소프트 삭제 흐름을 유지한다.

**Tech Stack:** Spring Boot 3, Java 17, JPA, PostgreSQL, Next.js 14, TypeScript, Jest, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-09-16-versioned-patch-notes-design.md`

## Global Constraints

- 기존 `patch_notes` 데이터·content 컬럼·게시/삭제 API를 호환성 때문에 제거하지 않는다.
- 패치 유형 enum은 `ADD`, `IMPROVEMENT`, `FIX`, `SECURITY`, `ETC`만 허용한다.
- 버전은 `vMAJOR.MINOR.PATCH` 형식과 삭제되지 않은 릴리즈 내 유일성을 검증한다.
- 사용자 응답에는 게시된 릴리즈만 포함하고 항목은 `displayOrder` 오름차순으로 반환한다.
- 요약은 HTML이 아닌 순수 텍스트 최대 200자이며, 릴리즈당 항목을 1개 이상 요구한다.
- 모든 데이터 페칭 화면에는 기존 Skeleton UI를 사용하고, 수정마다 관련 히스토리를 작성한다.

---

### Task 1: 백엔드 하위 항목 모델과 API

**Files:**
- Create: `backend/src/main/java/com/tpmp/testprep/entity/PatchNoteItem.java`
- Create: `backend/src/main/java/com/tpmp/testprep/repository/PatchNoteItemRepository.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/entity/PatchNote.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/dto/request/PatchNoteRequest.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/dto/response/PatchNoteResponse.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/service/PatchNoteService.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/repository/PatchNoteRepository.java`
- Test: `backend/src/test/java/com/tpmp/testprep/service/PatchNoteServiceTest.java`
- Test: `backend/src/test/java/com/tpmp/testprep/entity/PatchNoteTest.java`
- Test: `backend/src/test/java/com/tpmp/testprep/controller/AdminPatchNoteControllerTest.java`
- Create/Modify: `docs/history/back/adm/PatchNote_Modified.md`, `docs/history/back/usr/PatchNote_Modified.md`

**Interfaces:** `PatchNoteRequest.items`는 `List<PatchNoteItemRequest>`이고 응답 `PatchNoteResponse.items`는 정렬된 `List<PatchNoteItemResponse>`다. 서비스 create/update는 릴리즈와 자식 항목을 하나의 트랜잭션으로 저장하고, 기존 content만 있는 레코드는 `ETC` fallback 항목을 응답한다.

- [x] 실패 테스트: 항목 없는 요청, 잘못된 enum/요약, 잘못된 버전, 중복 버전이 거부되는지 작성한다.
- [x] 실패 테스트 실행 및 최소 구현: 엔티티·DTO·서비스의 자식 저장/정렬/검증과 기존 데이터 fallback, 운영 migration과 부분 유니크 인덱스를 구현했다.
- [x] 통과 테스트 실행: 패치노트 테스트와 전체 백엔드 481개 테스트를 통과시켰다.
- [x] `git diff --check`와 히스토리 파일을 확인했다.

### Task 2: 관리자 등록·수정 UI

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/components/admin/PatchNoteForm.tsx`
- Modify: `frontend/src/components/admin/PatchNoteForm.test.tsx`
- Modify: `frontend/src/app/admin/patch-notes/new/page.tsx`
- Modify: `frontend/src/app/admin/patch-notes/[id]/edit/page.tsx`
- Modify: `frontend/src/services/patchNoteService.ts`
- Create/Modify: `docs/history/front/adm/AdminPatchNote_Modified.md`

**Interfaces:** 폼은 `PatchNoteRequest { title, version, content, published, items }`를 제출한다. 항목 행은 유형·요약·순서를 편집하며 `onSubmit`은 기존 페이지 계약을 유지한다.

- [x] 실패 테스트: 기본 항목, 항목 추가/삭제/순서 변경, 행별 필수값과 버전 오류 표시 테스트를 작성했다.
- [x] 최소 구현: 동적 행 편집기와 payload 매핑, 저장 중 중복 제출 방지를 추가했다.
- [x] 통과 테스트 실행: 관련 폼 테스트와 전체 프론트 216개 테스트를 통과했다.
- [x] `npx tsc --noEmit`와 Skeleton/접근성 점검을 통과했다.

### Task 3: 사용자 버전별 목록 UI

**Files:**
- Modify: `frontend/src/app/user/patch-notes/page.tsx`
- Create/Modify: `frontend/src/app/user/patch-notes/page.test.tsx`
- Modify: `docs/history/front/usr/PatchNote_Modified.md`

**Interfaces:** 사용자 API의 `PatchNote.items`를 릴리즈 카드 내부에서 `itemType` 표시명과 배지 색상으로 렌더링한다. 기존 `Pagination`은 릴리즈 페이지에만 적용한다.

- [x] 실패 테스트: 두 버전과 여러 항목의 버전별 카드, 유형 배지·요약·게시일 표시 테스트를 작성했다.
- [x] 최소 구현: 카드 내부 항목 목록, 기존 content fallback, 빈/오류/로딩 상태를 구현했다.
- [x] 통과 테스트 실행: 사용자 패치노트 테스트와 전체 프론트 테스트를 통과했다.
- [x] 다크모드·모바일 레이아웃과 `CardListSkeleton`을 확인했다.

### Task 4: 통합 검증 및 인계

**Files:**
- Modify: `docs/agent-handoff/CURRENT.md`
- Modify: `docs/user-list-pagination-checklist.md` 또는 새 `docs/patch-notes-versioning-checklist.md`

- [x] `cd backend; .\\gradlew.bat test --offline --no-daemon` 실행
- [x] `cd frontend; npx tsc --noEmit` 실행
- [x] `cd frontend; npm test -- --watch=false --runInBand` 실행
- [x] `cd frontend; npm run build` 실행
- [ ] Docker Desktop 재기동 후 로컬 DB migration 적용 여부와 관리자 저장/게시, 사용자 카드·페이지네이션을 실제 화면에서 확인한다.
- [x] `git diff --check`와 히스토리, 인계 문서를 확인했다. 커밋·푸시는 사용자 요청 대기.
