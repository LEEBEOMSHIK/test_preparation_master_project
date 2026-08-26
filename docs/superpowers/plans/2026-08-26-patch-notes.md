# 패치노트 기능 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자가 패치노트를 작성·게시·관리하고, 사용자가 헤더의 독립 아이콘을 통해 상세 이동 없이 전체 수정 내용을 최신순 목록으로 확인할 수 있게 한다.

**Architecture:** `PatchNote` 독립 도메인을 Spring Boot의 Controller → Service → Repository 구조로 추가하고 PostgreSQL 수동 마이그레이션을 제공한다. 프론트엔드는 사용자 목록, 관리자 목록/작성/수정 페이지와 공용 타입·서비스를 추가하며, HTML 출력은 공용 `RichContent`에서 DOMPurify로 정제한다.

**Tech Stack:** Spring Boot 3, Java 17, Spring Data JPA, PostgreSQL 15, Next.js 14 App Router, TypeScript strict, React Native Web, Tailwind CSS, axios, Jest/Testing Library

**Spec:** `docs/superpowers/specs/2026-08-26-patch-notes-design.md`

## 전역 제약사항

- 사용자 화면은 읽음 여부·배지·상세 페이지 없이 목록 카드에 버전, 제목, 게시일, 전체 본문을 표시한다.
- 헤더의 패치노트 아이콘은 인증 상태와 무관하게 항상 표시하며 `/user/patch-notes`로 바로 이동한다.
- 관리자 입력 필드는 제목, 버전, 리치 텍스트 본문, 게시 여부만 제공한다.
- 최초 게시 시각은 한 번만 기록하고 게시 해제 후 재게시해도 유지한다.
- 삭제는 `BaseEntity.softDelete()`를 사용하는 논리 삭제로 처리한다.
- 기존 사용자의 미커밋 변경(`UserExamInfo_Modified.md`, `exam-info/page.tsx`, `CACHE_POLICY.md`)은 건드리거나 커밋에 포함하지 않는다.
- 구현 체크포인트마다 `docs/agent-handoff/CURRENT.md`를 현재 작업 스냅샷으로 갱신한다.

---

## 작업 1: DB 스키마와 백엔드 도메인 기반 추가

**파일:**

- 생성: `docs/db-migration/20260826_01_create_patch_notes.sql`
- 수정: `docs/sql/README.md`
- 수정: `docs/db-guidelines.md`
- 생성: `backend/src/main/java/com/tpmp/testprep/domain/PatchNote.java`
- 생성: `backend/src/main/java/com/tpmp/testprep/repository/PatchNoteRepository.java`
- 수정: `backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java`

- [ ] `patch_notes` 테이블과 조회 인덱스를 만드는 멱등 SQL을 작성한다. 컬럼은 `id`, `title`, `version`, `content`, `published_yn`, `published_dt`와 BaseEntity 감사·상태 컬럼으로 제한한다.
- [ ] 신규 환경은 baseline 이후 날짜순 마이그레이션도 실행하도록 SQL README를 갱신하고 DB 가이드 테이블 목록에 `patch_notes`를 추가한다.
- [ ] `PatchNote` 엔티티를 추가한다. 생성·수정·게시 상태 변경은 아래 불변식을 지킨다.

```java
public void changePublication(boolean published, Long userId) {
    this.publishedYn = published ? "Y" : "N";
    if (published && this.publishedDt == null) {
        this.publishedDt = LocalDateTime.now();
    }
    updateAudit(userId);
}

public boolean isPublished() {
    return "Y".equals(publishedYn);
}
```

- [ ] 저장소에 관리자 목록, 사용자 공개 목록, 삭제 제외 단건 조회 메서드를 선언한다.

```java
Page<PatchNote> findByDelYnOrderByModifiedDtDescIdDesc(String delYn, Pageable pageable);
Page<PatchNote> findByDelYnAndUseYnAndPublishedYnOrderByPublishedDtDescIdDesc(
        String delYn, String useYn, String publishedYn, Pageable pageable);
Optional<PatchNote> findByIdAndDelYn(Long id, String delYn);
```

- [ ] `PATCH_NOTE_NOT_FOUND` 오류 코드를 404로 추가한다.
- [ ] 변경 파일의 import, 컬럼 길이, null 허용 여부와 SQL/JPA 이름이 일치하는지 정적 확인한다.
- [ ] 커밋한다: `[BE] feat: 패치노트 도메인 및 스키마 추가`

## 작업 2: 서비스 동작을 테스트로 고정하고 구현

**파일:**

- 생성: `backend/src/main/java/com/tpmp/testprep/dto/request/PatchNoteRequest.java`
- 생성: `backend/src/main/java/com/tpmp/testprep/dto/request/PatchNotePublicationRequest.java`
- 생성: `backend/src/main/java/com/tpmp/testprep/dto/response/PatchNoteResponse.java`
- 생성: `backend/src/main/java/com/tpmp/testprep/service/PatchNoteService.java`
- 생성: `backend/src/test/java/com/tpmp/testprep/service/PatchNoteServiceTest.java`

- [ ] 요청 DTO에 제목·버전·본문 길이 제한과 `published` 필수 검증을 선언한다.

```java
public record PatchNoteRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 50) String version,
        @NotBlank String content,
        @NotNull Boolean published
) {}

public record PatchNotePublicationRequest(@NotNull Boolean published) {}
```

- [ ] 응답 DTO에 `id`, `title`, `version`, `content`, `published`, `publishedAt`, `createdAt`, `updatedAt`을 노출하고 `from(PatchNote)` 팩터리를 작성한다.
- [ ] Mockito 서비스 테스트를 먼저 작성한다: 초안 생성, 즉시 게시 생성, 최초 게시일 생성, 게시 해제·재게시 시 게시일 유지, 공개 목록 필터, 논리 삭제, 삭제 항목 단건 조회 실패.
- [ ] 다음 명령으로 테스트가 구현 전 실패하는지 확인한다.

```powershell
cd backend
.\gradlew.bat test --tests com.tpmp.testprep.service.PatchNoteServiceTest
```

예상: `PatchNoteService` 미구현 또는 동작 불일치로 실패.

- [ ] `PatchNoteService`에서 사용자 이메일로 관리자 ID를 조회하고 생성·수정·게시 변경·논리 삭제 시 감사 필드를 갱신한다.
- [ ] 공개 목록은 `delYn=N`, `useYn=Y`, `publishedYn=Y` 조건과 `publishedDt DESC, id DESC` 순서를 사용한다.
- [ ] 같은 테스트를 다시 실행해 통과시킨다.
- [ ] 커밋한다: `[BE] feat: 패치노트 서비스 추가`

## 작업 3: 사용자·관리자 API 추가

**파일:**

- 생성: `backend/src/main/java/com/tpmp/testprep/controller/UserPatchNoteController.java`
- 생성: `backend/src/main/java/com/tpmp/testprep/controller/AdminPatchNoteController.java`

- [ ] 사용자 컨트롤러에 `GET /api/user/patch-notes?page=0&size=10`을 추가하고 `ApiResponse<Page<PatchNoteResponse>>`로 반환한다.
- [ ] 관리자 컨트롤러에 목록, 단건, 생성, 수정, 게시 상태 변경, 삭제 API를 추가한다.

```text
GET    /api/admin/patch-notes
GET    /api/admin/patch-notes/{id}
POST   /api/admin/patch-notes
PUT    /api/admin/patch-notes/{id}
PATCH  /api/admin/patch-notes/{id}/publication
DELETE /api/admin/patch-notes/{id}
```

- [ ] 관리자 API에 `@PreAuthorize("hasRole('ADMIN')")`, 변경 API에 `@AuthenticationPrincipal String email`, 요청 본문에 `@Valid`를 적용한다.
- [ ] 사용자 단건 API와 읽음 처리 API가 생성되지 않았는지 확인한다.
- [ ] 백엔드 전체 테스트를 실행한다.

```powershell
cd backend
.\gradlew.bat test
```

예상: `BUILD SUCCESSFUL`.

- [ ] 커밋한다: `[BE] feat: 패치노트 사용자 관리자 API 추가`

## 작업 4: 공용 HTML 렌더링 보안 강화와 프론트 타입·서비스 추가

**파일:**

- 수정: `frontend/src/components/ui/RichContent.tsx`
- 생성: `frontend/src/components/ui/RichContent.test.tsx`
- 수정: `frontend/src/types/index.ts`
- 생성: `frontend/src/services/patchNoteService.ts`

- [ ] 악성 `<script>`와 이벤트 속성이 출력되지 않고 일반 서식은 유지되는 `RichContent` 테스트를 먼저 작성한다.
- [ ] 테스트를 실행해 현재 직접 HTML 주입 구현에서 실패하는지 확인한다.

```powershell
cd frontend
npx jest src/components/ui/RichContent.test.tsx --runInBand
```

예상: 악성 요소 또는 속성이 남아 실패.

- [ ] `RichContent`를 클라이언트 컴포넌트로 전환하고, 브라우저에서 DOMPurify를 동적 import해 정제한 문자열만 `dangerouslySetInnerHTML`에 전달한다. 정제 완료 전에는 빈 컨테이너를 렌더링해 원문 HTML이 잠시라도 삽입되지 않게 한다.

```tsx
'use client';

const [sanitizedHtml, setSanitizedHtml] = useState('');

useEffect(() => {
  let active = true;
  void import('dompurify').then(({ default: DOMPurify }) => {
    if (active) setSanitizedHtml(DOMPurify.sanitize(html));
  });
  return () => { active = false; };
}, [html]);
```

- [ ] 테스트를 재실행해 통과시킨다.
- [ ] `PatchNote`, `PatchNoteRequest`, `PatchNotePublicationRequest` 타입과 사용자/관리자 axios 호출을 추가한다. 기존 `PageResponse<T>`와 `ApiResponse<T>`를 재사용한다.
- [ ] 서비스 URL과 HTTP 메서드가 작업 3의 API와 정확히 일치하는지 확인한다.
- [ ] 커밋한다: `[FE] feat: 패치노트 타입과 안전한 콘텐츠 렌더링 추가`

## 작업 5: 사용자 패치노트 목록과 헤더 아이콘 추가

**파일:**

- 생성: `frontend/src/app/user/patch-notes/page.tsx`
- 수정: `frontend/src/components/layout/UserLayoutShell.tsx`

- [ ] 사용자 목록 페이지를 클라이언트 페이지로 추가하고 최초/페이지 변경 시 패치노트를 조회한다.
- [ ] 로딩 시 `CardListSkeleton`, 오류 시 재시도 가능한 오류 상태, 빈 목록 시 안내 상태를 표시한다.
- [ ] 각 카드에 버전, 제목, 게시일, `RichContent` 전체 본문을 표시하며 카드 클릭이나 상세 링크는 만들지 않는다.
- [ ] 목록 아래 기존 `Pagination`을 연결한다.
- [ ] 상단 헤더의 테마 토글 인접 위치에 독립 패치노트 아이콘 링크를 추가하고, 현재 경로가 `/user/patch-notes`일 때 명확한 활성 스타일을 적용한다.
- [ ] `/user/patch-notes`를 사용자 레이아웃의 항상 허용 경로에 추가해 메뉴 권한 응답과 무관하게 접근 가능하게 한다.
- [ ] 모바일 폭과 다크 모드에서 카드 본문과 아이콘의 대비를 코드 기준으로 확인한다.
- [ ] 커밋한다: `[FE] feat: 사용자 패치노트 목록 추가`

## 작업 6: 관리자 목록·작성·수정 UI 추가

**파일:**

- 생성: `frontend/src/components/admin/PatchNoteForm.tsx`
- 생성: `frontend/src/app/admin/patch-notes/page.tsx`
- 생성: `frontend/src/app/admin/patch-notes/new/page.tsx`
- 생성: `frontend/src/app/admin/patch-notes/[id]/edit/page.tsx`

- [ ] `PatchNoteForm`을 제목·버전·`RichTextEditor` 본문·게시 여부 필드로 구성하고 신규/수정 페이지에서 재사용한다.
- [ ] `stripHtml(content).trim()`으로 시각적으로 빈 리치 텍스트를 제출하지 못하게 검증한다.
- [ ] 관리자 목록에 서버 페이지네이션, `TableSkeleton`, 상태 표시, 작성/수정/게시 전환/삭제 액션을 구현한다.
- [ ] 게시 전환과 삭제 전 확인을 제공하고 API 성공 후 현재 페이지 데이터를 다시 조회한다.
- [ ] 수정 페이지 단건 조회 중에는 스켈레톤을 표시하고, 존재하지 않는 항목은 오류 안내와 목록 이동을 제공한다.
- [ ] 버튼 중복 제출을 막고 API 오류 메시지를 화면에 표시한다.
- [ ] 커밋한다: `[FE] feat: 관리자 패치노트 관리 화면 추가`

## 작업 7: 메뉴 등록과 문서·히스토리·인계 갱신

**파일:**

- 수정: `frontend/src/components/layout/AdminLayoutShell.tsx`
- 수정: `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java`
- 수정: `backend/src/test/java/com/tpmp/testprep/config/DataInitializerTest.java`
- 수정: `docs/project-overview.md`
- 생성: `docs/history/front/usr/PatchNotes_Modified.md`
- 생성: `docs/history/front/adm/PatchNotes_Modified.md`
- 생성: `docs/history/back/usr/PatchNotes_Modified.md`
- 생성: `docs/history/back/adm/PatchNotes_Modified.md`
- 수정: `docs/agent-handoff/CURRENT.md`

- [ ] 관리자 fallback 메뉴에 `/admin/patch-notes`를 독립 메뉴로 추가한다.
- [ ] `DataInitializer`에 패치노트 관리 메뉴를 멱등 등록하고 기존 메뉴와 충돌하지 않는 표시 순서를 사용한다.
- [ ] 초기화 테스트에 메뉴 생성 및 재실행 안전성 기대값을 추가한다.
- [ ] 프로젝트 개요에 사용자 패치노트 조회와 관리자 패치노트 관리 기능을 반영한다.
- [ ] 각 사용자/관리자·프론트/백 히스토리 파일에 `HIST-20260826-001` 형식으로 변경 목적, 파일, 검증 결과를 기록한다. 파일이 이미 존재하면 파일 내 당일 최대 순번 다음 번호를 사용한다.
- [ ] `CURRENT.md`를 현재 목표, 완료/미완료, 수정 파일, 검증, 주의사항, 다음 명령이 포함된 최신 스냅샷으로 덮어쓴다.
- [ ] 커밋한다: `[INFRA] docs: 패치노트 기능 이력 및 메뉴 등록`

## 작업 8: 정적 검증, 동적 테스트, 화면 확인

**파일:**

- 검증 대상: 위 작업에서 변경한 모든 파일
- 필요 시 수정: 검증에서 발견된 해당 구현 파일과 히스토리

- [ ] 정적 검증으로 TypeScript `any`, DTO/엔티티 불일치, 직접 `dangerouslySetInnerHTML` 사용, 스켈레톤 누락, API 3레이어, 히스토리 누락을 확인한다.
- [ ] 프론트 단위 테스트와 타입체크를 실행한다.

```powershell
cd frontend
npx jest src/components/ui/RichContent.test.tsx --runInBand
npx tsc --noEmit
npm test -- --watch=false
```

예상: 모든 테스트 통과, TypeScript 오류 0개.

- [ ] 프론트 프로덕션 빌드를 1회 실행한다.

```powershell
cd frontend
npm run build
```

예상: Next.js 빌드 성공, `/user/patch-notes`, `/admin/patch-notes`, 신규/수정 라우트 생성.

- [ ] 백엔드 전체 테스트를 마지막으로 1회 실행한다.

```powershell
cd backend
.\gradlew.bat test
```

예상: `BUILD SUCCESSFUL`.

- [ ] 로컬 서버가 이미 종료된 상태이므로 사용자의 명시적 요청 없이 상시 서버를 띄우지 않는다. 일시적으로 화면 검증용 서버를 실행했다면 검증 직후 해당 프로세스만 종료한다.
- [ ] 화면 검증 시 사용자 헤더 아이콘 직행, 목록 전체 본문, 페이지 이동, 다크 모드 대비, 관리자 CRUD/게시 전환을 확인한다.
- [ ] 검증 결과와 남은 주의사항을 히스토리와 `CURRENT.md`에 반영한다.
- [ ] 최종 커밋한다: `[FE] test: 패치노트 기능 검증 보완`

