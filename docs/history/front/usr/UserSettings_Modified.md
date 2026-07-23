# 사용자 설정 화면 수정 이력

## HIST-20260724-001

- **날짜**: 2026-07-24
- **수정 범위**: 사용자 프론트엔드 / 설정 페이지 (모바일 390×844 텍스트 줄바꿈·잘림 버그 수정)
- **수정 개요**: 모바일 뷰포트(390×844)에서 발견된 버그 2건 수정 — (1) 닉네임 수정 카드 "저장" 버튼이 좁은 폭에서 "저\n장"으로 세로 줄바꿈되던 문제, (2) "내 시험 접수 정보" 카드에서 flex 컨테이너 + `truncate` 조합 오류로 시험명이 말줄임표 없이 하드클립되던 문제

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/settings/page.tsx` | 수정 | "저장" 버튼에 `whitespace-nowrap` 추가, "내 시험 접수 정보" 카드의 시험명 표시 구조를 flex-item 기준으로 수정(`truncate`+`title` 속성 이동) |

### 수정 상세

#### `frontend/src/app/user/settings/page.tsx`
- 변경 전(저장 버튼): `className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"` — 좁은 폭에서 버튼 내부 "저장" 텍스트가 두 글자 사이에서 세로로 줄바꿈됨
- 변경 후(저장 버튼): 위 className 끝에 `whitespace-nowrap` 추가하여 텍스트 줄바꿈 금지
- 변경 전(시험명 표시): 부모 `<p>`가 `flex items-center gap-1.5`와 `truncate`를 동시에 가짐(`text-sm font-medium text-gray-800 truncate flex items-center gap-1.5`) — flex 컨테이너에는 `text-overflow: ellipsis`가 정상 동작하지 않아 자식 `<span className="truncate">{app.examName}</span>`이 flex item 기본 `min-width: auto`로 인해 실제로 줄어들지 않고, 부모의 `overflow:hidden`에 의해 말줄임표 없이 하드클립됨
- 변경 후(시험명 표시): 부모 `<p>`에서 `truncate` 제거(`flex items-center gap-1.5`만 유지), `examName`을 감싼 `<span>`에 `min-w-0 flex-1`을 추가해 flex row 안에서 실제로 줄어들며 자체 `truncate`가 정상 동작하도록 수정, 전체 시험명 확인용 `title={app.examName}` 속성 추가
- 이유: 모바일(390×844) 실기기 테스트에서 발견된 텍스트 줄바꿈/잘림 버그 3건 중 2건(사용자 요청 조사 결과 반영)

### 복원 방법
이 ID(HIST-20260724-001)만으로 복원 시 `frontend/src/app/user/settings/page.tsx`에서 "저장" 버튼 className의 `whitespace-nowrap`을 제거하고, "내 시험 접수 정보" 카드의 시험명 표시부를 `<p className="text-sm font-medium text-gray-800 truncate flex items-center gap-1.5">`(truncate 포함)와 `<span className="truncate">{app.examName}</span>`(min-w-0·flex-1·title 없음)으로 되돌린다.

## HIST-20260722-001

- **날짜**: 2026-07-22
- **수정 범위**: 사용자 프론트엔드 / 설정 페이지 ("시험 관리" 그룹에 관심 시험 유형 카드 추가)
- **수정 개요**: "시험 관리" 섹션의 "내 시험 접수 정보" 카드 위에 "관심 시험 유형" 카드를 신규 추가. 현재 선택된 관심 시험 유형을 배지로 보여주고 "변경" 버튼으로 공용 `InterestExamTypeModal`을 열어 저장하면 authStore가 즉시 갱신되어 `/user/exam-info`와 양방향 동기화된다. `SettingsPageSkeleton`에도 새 카드 자리 shimmer 추가
- **관련 작업**: `frontend/src/components/ui/InterestExamTypeModal.tsx` 신규 추출은 `docs/history/front/usr/UserExamInfo_Modified.md`의 HIST-20260722-001 참고

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/settings/page.tsx` | 수정 | "시험 관리" 그룹에 "관심 시험 유형" `<section>` 카드 추가(기존 "내 시험 접수 정보" 카드와 동일한 `bg-white border border-gray-200 rounded-xl p-5` 스타일), `showInterestModal` state·`InterestExamTypeModal` import·렌더 추가, `SettingsPageSkeleton`에 새 카드 shimmer 블록 추가 |

### 수정 상세

#### `frontend/src/app/user/settings/page.tsx`
- 변경 전: "시험 관리" 그룹에 "내 시험 접수 정보" 카드 1개만 존재. 관심 시험 유형을 바꾸려면 `/user/exam-info`로 이동해야 함
- 변경 후: "관심 시험 유형" 카드 추가 — `storeUser?.interestedExamTypes`를 배지로 표시(없으면 "선택된 관심 시험 유형이 없습니다."), "변경" 버튼 클릭 시 `InterestExamTypeModal` 오픈. 저장 성공 시 모달 내부에서 authStore `setAuth`로 유저 정보가 갱신되어 배지가 자동 반영(별도 재조회 불필요, `onSaved` prop 미사용). `SettingsPageSkeleton`에 관심 시험 유형 카드용 shimmer(라벨 배지 2개 + "변경" 버튼 자리) 추가
- 이유: 마이페이지 3그룹(계정/연동/시험 관리) 재편에 맞춰 관심 시험 유형 설정 진입점을 `/user/settings`에도 제공해달라는 사용자 피드백 반영

### 복원 방법
이 ID(HIST-20260722-001)만으로 복원 시 `frontend/src/app/user/settings/page.tsx`에서 "관심 시험 유형" `<section>` 카드, `showInterestModal` state, `InterestExamTypeModal` import·렌더, `SettingsPageSkeleton`의 해당 shimmer 블록을 제거한다(단, `InterestExamTypeModal.tsx` 컴포넌트 자체 삭제는 `UserExamInfo_Modified.md`의 HIST-20260722-001 복원 절차를 따른다).

## HIST-20260721-003

- **날짜**: 2026-07-21
- **수정 범위**: 사용자 프론트엔드 / 설정 페이지 (레이아웃)
- **수정 개요**: 카드 3개(닉네임 수정 / Notion 연동 / 내 시험 접수 정보)를 "계정" / "연동" / "시험 관리" 3개 그룹으로 묶고 각 그룹 앞에 작은 섹션 라벨 추가(카드 내부 로직·JSX는 변경 없음, 순수 레이아웃 변경)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/settings/page.tsx` | 수정 | `UserSettingsContent()`의 `<h1>`/콜백 배너 아래에 `<div className="space-y-8">` 그룹 컨테이너를 추가하고, 각 `<section>`을 `<div className="space-y-3"><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{라벨}</p><section>...</section></div>`로 감쌈(라벨: 계정/연동/시험 관리). `SettingsPageSkeleton()`도 동일한 3그룹 구조로 맞추고 각 그룹 라벨 자리에 `<Skeleton className="h-3 w-10" />`(시험 관리는 `w-14`) shimmer 추가, 바깥 컨테이너를 `space-y-6`→`space-y-8`(animate-pulse)로 조정 |

### 수정 상세

#### `frontend/src/app/user/settings/page.tsx`
- 변경 전: `<div className="max-w-2xl mx-auto p-6 space-y-6">` 안에 `<h1>` → 콜백 배너 → 닉네임 `<section>` → Notion `<section>` → 내 시험 접수 정보 `<section>`이 그룹 구분 없이 나란히 나열됨. `SettingsPageSkeleton()`도 동일하게 3개 카드 shimmer가 그룹 없이 나열됨
- 변경 후: `<h1>`/콜백 배너는 그대로 두고 그 아래에 `<div className="space-y-8">`로 3개 그룹(계정/연동/시험 관리)을 감쌈. 각 그룹은 `<div className="space-y-3">` 안에 `text-xs font-semibold text-gray-400 uppercase tracking-wide` 톤의 라벨 `<p>` + 기존 `<section>`(내부 JSX·로직 변경 없음)으로 구성. `SettingsPageSkeleton()`도 동일하게 3그룹 구조에 라벨 자리 shimmer(`<Skeleton className="h-3 w-10/w-14" />`)를 추가하고 바깥 `space-y-6`→`space-y-8`로 조정. 이 파일은 기존에 `dark:` 클래스가 전혀 없는(라이트모드 전용) 컨벤션이라 새 라벨도 `dark:` 없이 기존 톤 그대로 추가(카드만 다크 미대응인 상태에서 라벨만 다크 대응 시 오히려 부자연스러움)
- 이유: 카드 3개가 서로 다른 성격(계정 정보/외부 서비스 연동/시험 데이터 관리)임에도 시각적 구분 없이 나열되어 있어 그룹 라벨로 정보 위계를 명확히 함. 카드 내부 로직(닉네임 저장, Notion 연동 상태 조회/연결/해제, 시험 접수 정보 CRUD·D-day 배지·모달)은 전혀 건드리지 않은 순수 레이아웃 변경

### 복원 방법
이 ID(HIST-20260721-003)만으로 복원 시 `frontend/src/app/user/settings/page.tsx`에서 그룹 wrapper `<div className="space-y-8">`와 각 라벨 `<p>`, 그룹 wrapper `<div className="space-y-3">`를 제거하고 `<section>` 3개를 `<h1>`/콜백 배너 아래에 바로 나열하며 바깥 컨테이너를 `space-y-6`으로 되돌린다. `SettingsPageSkeleton()`도 그룹 wrapper·라벨 shimmer를 제거하고 바깥 컨테이너를 `space-y-6`으로 되돌려 HIST-20260721-002 시점 코드로 복원한다.

---

## HIST-20260721-002

- **날짜**: 2026-07-21
- **수정 범위**: 사용자 프론트엔드 / 설정 페이지 ("내 시험 접수 정보" 섹션)
- **수정 개요**: "내 시험 접수 정보" 리스트 각 항목에 개인 접수 정보 기반 D-day 배지 추가(`exam-info` 화면과 동일한 공용 로직·스타일 재사용)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/settings/page.tsx` | 수정 | `@/lib/date`에서 `getExamDDayLabel`/`getExamDDayBadgeClass` import, "내 시험 접수 정보" 리스트 각 항목의 examType 배지·시험명 옆에 D-day 배지 추가(라벨 빈 문자열이면 미렌더) |

### 수정 상세

#### `frontend/src/app/user/settings/page.tsx`
- 변경 전: 각 접수 정보 항목이 examType 배지 + 시험명 + 접수일/시험일 텍스트만 표시
- 변경 후: 시험명 옆에 `getExamDDayLabel(app.applicationDate, app.examDate)` 결과를 `getExamDDayBadgeClass`로 스타일링한 배지로 추가 표시
- 이유: `exam-info/page.tsx`와 동일한 데이터(`UserExamApplication[]`)를 보여주는 화면이므로 D-day 정보도 동일하게 노출해 일관성 유지. `frontend/src/lib/date.ts` 신규 공용 유틸 추출 관련 상세는 `UserExamInfo_Modified.md`의 `HIST-20260721-003` 참고

### 복원 방법
이 ID(HIST-20260721-002)만으로 복원 시 `frontend/src/app/user/settings/page.tsx`에서 `getExamDDayLabel`/`getExamDDayBadgeClass` import와 D-day 배지 JSX를 제거한다(HIST-20260721-001 시점 코드로 복원).

---

## HIST-20260721-001

- **날짜**: 2026-07-21
- **수정 범위**: 사용자 프론트엔드 / 설정 페이지 (신규)
- **수정 개요**: "내 시험 접수 정보" 카드 섹션 추가 — Notion 연동 카드 아래에 내가 등록한 접수일·시험일 목록을 표시하고 수정/삭제할 수 있는 섹션 신설 (신규 등록은 `/user/exam-info`로 안내, 여기서는 수정/삭제만 지원)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/settings/page.tsx` | 수정 | `applications`/`applicationsLoading` state 추가, `examApplicationService.getMine()` useEffect 로딩, Notion 카드 아래 "내 시험 접수 정보" `<section>` 추가(로딩 시 `CardListSkeleton rows={3}`, 빈 목록 시 `/user/exam-info` 링크 안내, 목록은 시험명+examType 배지+접수일~시험일+수정/삭제 아이콘), `SettingsPageSkeleton`에 동일 shimmer 블록 1개 추가, 수정 클릭 시 `ExamApplicationFormModal`을 `editing`으로 오픈 |
| `frontend/src/components/ui/ExamApplicationFormModal.tsx` | 추가 | 접수 정보 등록/수정 공용 모달(`open, onClose, onSaved, editing?, prefill?`) — 시험명(필수)/접수일/시험일/메모(선택) 입력, 클라이언트 검증(시험명 필수, 접수일·시험일 중 최소 1개), 저장 성공 시 `onSaved` 콜백·실패 시 인라인 에러(axios 응답 `message` 우선 추출). `CLAUDE.md` Shared Utilities 표에 등록 완료 |
| `frontend/src/services/examApplicationService.ts` | 추가 | `getMine`/`create`/`update`/`remove` axios 함수 (백엔드 `/api/user/exam-applications` CRUD, `UserExamApplication_Modified.md` 백엔드 히스토리 참고) |
| `frontend/src/types/index.ts` | 수정 | `UserExamApplication` 인터페이스 추가 (`id, examInfoId?, examInfoTitle?, examType?, examName, applicationDate?, examDate?, memo?, createdAt, updatedAt`) |

### 수정 상세

#### `frontend/src/app/user/settings/page.tsx`
- 변경 전: 닉네임 수정 카드 + Notion 연동 카드 2개 섹션만 존재
- 변경 후: Notion 카드 아래 "내 시험 접수 정보" `<section className="bg-white border border-gray-200 rounded-xl p-5">` 추가. `useEffect`로 `examApplicationService.getMine()` 호출(`applicationsLoading` true→false, 실패 시 빈 배열 폴백). 로딩 중 `CardListSkeleton rows={3}`, `applications.length === 0`이면 "등록된 접수 정보가 없습니다. [시험 정보에서 등록하기](/user/exam-info)" 안내, 있으면 각 항목을 `examType` 배지+`examName`+접수일~시험일 텍스트+연필(수정)/휴지통(삭제) 아이콘 버튼으로 렌더. `openEditApplication`이 `appModalEditing` 세팅 후 모달 오픈(이 화면에서는 신규 등록 버튼 없음 — 신규는 `/user/exam-info`의 "+ 직접 등록"/카드별 "+ 접수 정보 입력"에서 처리). 삭제는 `window.confirm()` 후 `examApplicationService.remove(id)`. `SettingsPageSkeleton`(Suspense fallback)에도 동일 shimmer 블록(`Skeleton` 제목/설명 + `CardListSkeleton rows={2}`) 추가.
- 이유: 설정 화면에서도 접수 일정을 빠르게 확인·수정할 수 있도록 하되, 신규 등록 진입점은 시험 정보 화면 하나로 유지해 중복 UX를 피함.

### 복원 방법
이 ID(HIST-20260721-001)만으로 복원 시 `frontend/src/app/user/settings/page.tsx`에서 "내 시험 접수 정보" `<section>`, 관련 state(`applications`, `applicationsLoading`, `appModalOpen`, `appModalEditing`)·핸들러(`openEditApplication`, `handleApplicationSaved`, `handleDeleteApplication`)·useEffect·모달 렌더·`SettingsPageSkeleton`의 추가 shimmer 블록을 모두 제거하고 import(`Link`, `examApplicationService`, `CardListSkeleton`, `ExamApplicationFormModal`, `UserExamApplication`)도 되돌린다.

---

## HIST-20260621-001

- **날짜**: 2026-06-21
- **수정 범위**: 사용자 프론트엔드 / 설정 페이지
- **수정 개요**: 닉네임 저장 실패(409 포함) 시 서버 응답 메시지를 인라인 에러로 표시 — "이미 사용 중인 닉네임입니다." 등 BE 에러 코드 메시지 노출

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/settings/page.tsx` | 수정 | `handleSaveNickname`의 `catch` 블록에서 axios 에러 응답 `data.message` 추출 로직 추가 — 서버 메시지 우선, 없으면 기본 메시지 폴백 |

### 수정 상세

#### `frontend/src/app/user/settings/page.tsx`
- 변경 전:
  ```tsx
  } catch {
    setNicknameFeedback({ type: 'error', msg: '저장에 실패했습니다. 다시 시도해 주세요.' });
  }
  ```
- 변경 후:
  ```tsx
  } catch (err: unknown) {
    let errorMsg = '저장에 실패했습니다. 다시 시도해 주세요.';
    if (/* err.response.data.message 존재 확인 */) {
      errorMsg = (err.response.data as { message: string }).message;
    }
    setNicknameFeedback({ type: 'error', msg: errorMsg });
  }
  ```
- 이유: BE가 409 CONFLICT + `{ message: "이미 사용 중인 닉네임입니다." }` 를 반환해도 FE에서 일반 메시지만 표시하던 문제 수정. axios 에러 객체의 `response.data.message`를 타입 안전하게 추출하여 표시.

### 복원 방법
이 ID(HIST-20260621-001)만으로 복원 시 `handleSaveNickname`의 catch 블록을 `catch { setNicknameFeedback({ type: 'error', msg: '저장에 실패했습니다. 다시 시도해 주세요.' }); }` 로 되돌린다.

---

## HIST-20260620-001

- **날짜**: 2026-06-20
- **수정 범위**: 사용자 프론트엔드 / 설정 페이지
- **수정 개요**: 닉네임 수정 섹션 카드 추가 — authStore.user.nickname 초기값 로드, PATCH /user/me/nickname 호출, 인라인 피드백, SettingsPageSkeleton에 닉네임 shimmer 블록 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/settings/page.tsx` | 수정 | 닉네임 수정 카드 추가(Notion 카드 위), SettingsPageSkeleton에 닉네임 shimmer 추가, 닉네임 상태·저장 로직 |
| `frontend/src/store/authStore.ts` | 수정 | `updateUser(partial: Partial<User>)` 액션 추가 — 닉네임 갱신 후 store 동기화 |

### 수정 상세

#### `frontend/src/app/user/settings/page.tsx`
- 변경 전: Notion 연동 카드만 존재. `SettingsPageSkeleton`에 Notion 카드 shimmer만 있음
- 변경 후:
  - `SettingsPageSkeleton`에 닉네임 섹션 shimmer 블록(제목·설명·input+버튼 행) 추가
  - `UserSettingsContent`에 `nicknameLoading`, `nicknameValue`, `nicknameSaving`, `nicknameFeedback` 상태 추가
  - 초기값: `storeUser.nickname` 있으면 즉시 사용, 없으면 `authService.me()` 호출 후 store 갱신
  - 저장: `userProfileService.patchNickname(trimmed)` → 성공 시 `updateUser({ nickname })` + 성공 메시지 3초 후 소멸, 실패 시 에러 메시지
  - input maxLength=20, 빈/공백만이면 버튼 disabled
  - Notion 카드는 `notionLoading` 별도 상태로 분리 유지
- 이유: 닉네임 비식별화 도입에 따른 사용자 편집 UI 제공

#### `frontend/src/store/authStore.ts`
- 변경 전: `setAuth`, `clearAuth` 2개 액션만 존재
- 변경 후: `updateUser(partial: Partial<User>)` 추가 — `state.user ? { ...state.user, ...partial } : state.user`
- 이유: 닉네임 저장 후 전체 me() 재호출 없이 store 부분 갱신

### 복원 방법
이 ID(HIST-20260620-001)만으로 복원 시:
- `settings/page.tsx`에서 닉네임 관련 state(`nicknameLoading`~`feedbackTimer`), `handleSaveNickname`, 닉네임 useEffect, 닉네임 섹션 JSX 제거. `SettingsPageSkeleton`에서 닉네임 shimmer 블록 제거. import에서 `userProfileService`, `authService`, `useAuthStore`, `useRef` 제거
- `authStore.ts`에서 `updateUser` 타입 선언 및 구현 제거

---

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
