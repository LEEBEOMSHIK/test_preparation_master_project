# 사용자 설정 화면 수정 이력

## HIST-20260619-001

- **날짜**: 2026-06-19
- **수정 범위**: 사용자 프론트엔드 / 설정 페이지
- **수정 개요**: `useSearchParams()` Suspense 경계 누락으로 인한 Next.js 정적 생성 빌드 실패 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/settings/page.tsx` | 수정 | `useSearchParams` 사용 로직을 자식 컴포넌트(`UserSettingsContent`)로 분리, 페이지 export를 `<Suspense>`로 래핑, fallback을 카드형 스켈레톤(`SettingsPageSkeleton`)으로 구현 |

### 수정 상세

#### `frontend/src/app/user/settings/page.tsx`
- 변경 전: 단일 `UserSettingsPage` 컴포넌트 최상위에서 `useSearchParams()` 직접 호출 — Suspense 경계 없음
- 변경 후:
  1. `SettingsPageSkeleton` — Suspense fallback (h1 + 카드 섹션 형태 animate-pulse 스켈레톤)
  2. `UserSettingsContent` — `useSearchParams()` 호출 및 기존 Notion 연동 UI 전담
  3. `UserSettingsPage` (export default) — `<Suspense fallback={<SettingsPageSkeleton />}>` 로 `UserSettingsContent` 래핑
- 이유: Next.js 14 App Router 정적 생성 단계에서 `useSearchParams()`는 반드시 `<Suspense>` 경계 안에 있어야 함. 경계 없으면 `⨯ useSearchParams() should be wrapped in a suspense boundary` 오류로 빌드(`npm run build`) 실패

### 추가 발견 사항 (이번 수정 범위 외)

동일 결함(`useSearchParams` Suspense 미적용)이 아래 파일에도 존재함:

| 파일 경로 | 현황 |
|-----------|------|
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | `useSearchParams()` 최상위 호출, Suspense 미적용 — 빌드 시 동일 에러 발생 가능 |

(나머지 `user/login`, `auth/login`, `auth/oauth/callback`은 이미 Suspense 패턴 적용 완료)

### 복원 방법
이 ID(HIST-20260619-001)만으로 복원 시, `frontend/src/app/user/settings/page.tsx`에서 `SettingsPageSkeleton`·`UserSettingsContent` 함수를 제거하고 단일 `UserSettingsPage` 컴포넌트로 합쳐 `useSearchParams()`를 최상위에서 직접 호출하도록 되돌린다(Suspense import 제거).

---

## HIST-20260615-001

- **날짜**: 2026-06-15
- **수정 범위**: 사용자 프론트엔드 / 설정 화면 (Notion 연동 진입점 이전)
- **수정 개요**: 개념노트 페이지 상단에만 있던 Notion 연동 진입점을 전용 **설정 페이지(`/user/settings`)** 로 분리하고, 헤더 사용자 드롭다운에 "설정" 링크를 추가해 어디서든 접근 가능하게 함. 콜백 redirect도 설정 페이지로 변경.

### 수정 파일 목록

| 파일 경로 | 유형 | 설명 |
|-----------|------|------|
| `frontend/src/app/user/settings/page.tsx` | 신규 | 설정 페이지 — Notion 연동 카드(상태 배지·연결/해제·콜백 피드백) |
| `frontend/src/components/layout/UserLayoutShell.tsx` | 수정 | 사용자 드롭다운에 "설정" 링크 추가 + 권한 가드 예외에 `/user/settings` 포함 |
| `frontend/src/app/user/concepts/page.tsx` | 수정 | 상단 Notion 연결 상태 바·연결/해제 핸들러·콜백 피드백 제거(설정으로 이전). 내보내기 버튼·상태조회는 유지 |
| `backend/.../service/NotionService.java` | 수정 | OAuth 성공/실패 redirect 기본값 `/user/concepts` → `/user/settings` |
| `backend/src/main/resources/application.yml` | 수정 | `app.notion.success/failure-redirect` 기본값 `/user/settings`로 변경 |

### 수정 상세
- **설정 페이지**: `notionService.getStatus()` 기반 카드. `!configured`→"서버 미설정" 안내, `connected`→워크스페이스명+"연동 해제", 그 외→"Notion 연결" 버튼. `?notion=connected|failed` 콜백 피드백 배너.
- **드롭다운**: 사용자 이름/이메일 아래 "설정"(톱니 아이콘) 링크 → `/user/settings`.
- **권한 가드**: `UserLayoutShell`의 메뉴 기반 접근 가드는 MenuConfig에 없는 URL을 차단하는데, `/user/settings`는 메뉴가 아닌 계정 페이지이므로 `/user/inquiries`와 함께 `ALWAYS_ALLOWED` 예외에 추가(미추가 시 권한없음 팝업 → 문의로 튕김).
- **개념노트**: 연결 관리 UI는 제거하되, 노트별 "노션으로 내보내기" 버튼 노출 판단을 위해 `notion` 상태 조회와 export 핸들러는 유지.
- **검증**: `npx tsc --noEmit`·`gradlew compileJava` 통과. 크롬 — 드롭다운 "설정" → `/user/settings` 진입(권한 튕김 없음), Notion 연동 카드("서버 미설정") 렌더, 개념노트 상단 바 제거 확인.

### 복원 방법
이 ID(HIST-20260615-001)로 복원 시 `settings/page.tsx` 삭제, 드롭다운 "설정" 링크·가드 예외 제거, 개념노트에 상태 바 복원, redirect 기본값을 `/user/concepts`로 환원.
