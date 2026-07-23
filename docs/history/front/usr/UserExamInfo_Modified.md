## HIST-20260724-001

- **날짜**: 2026-07-24
- **수정 범위**: 사용자 프론트엔드 / 시험 정보 (모바일 390px CSS 오버플로우로 "관심 시험 유형 설정"·"접수 정보 입력/수정" 모달 저장 버튼 클릭 불가 버그 수정)
- **수정 개요**: 모바일 뷰포트(390px)에서 두 모달의 grid/flex 행에 `min-w-0`가 없어 긴 라벨(예: "정보처리기사 실기")·date input이 아이템을 줄어들지 못하게 하고 모달 박스 폭을 밀어내던 문제를 수정. 검증 과정에서 `UserLayoutShell.tsx` 헤더 내비게이션(모바일에서 `hidden`으로 숨겨지는 데스크톱 nav)의 콘텐츠 오버플로우가 `overflow-x:hidden` 부재로 인해 문서 전체의 수평 스크롤을 유발하고, 이로 인해 `position:fixed` 요소(헤더·하단 내비·두 모달 wrapper 포함)의 레이아웃 뷰포트 폭 자체가 390px보다 넓게 계산되어 "저장" 버튼이 실제 화면 밖으로 11px가량 밀려나는 2차 증상을 추가로 발견 — `globals.css`에 `html, body { overflow-x: hidden }` 전역 안전장치를 추가해 함께 해소함(모달 두 개 자체 수정만으로는 완전히 해소되지 않았던 부분)
- **재현/검증**: Chrome DevTools MCP로 390×844 모바일 에뮬레이션 + 실 로그인(user@tpmp.com) 후 두 모달 각각 열어 `document.documentElement.scrollWidth`/`clientWidth`, "저장"/"수정" 버튼 `getBoundingClientRect()` 실측. 수정 전: scrollWidth 441 vs clientWidth 390(두 모달 공통, 헤더 오버플로우 포함), 저장 버튼 일부 화면 밖. 수정 후(모달 2건 + globals.css 3건 모두 적용): scrollWidth=clientWidth=390, 저장/수정 버튼 완전히 뷰포트 내(right≤354). "접수 정보 수정" 모달은 실제로 접수일 값을 변경 후 저장 → 목록에 반영되는 것까지 end-to-end 확인(테스트 후 원래 값으로 복구). 1440px 데스크톱에서 그리드 2열 레이아웃·라벨 전체 노출(미잘림) 회귀 없음 확인

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/InterestExamTypeModal.tsx` | 수정 | 시험 유형 grid 버튼에 `min-w-0` 추가, 라벨 텍스트를 `<span className="truncate" title={type.name}>`로 감싸 좁은 폭에서 말줄임표 처리(데스크톱처럼 공간이 충분하면 전체 노출, 회귀 없음) |
| `frontend/src/components/ui/ExamApplicationFormModal.tsx` | 수정 | 접수일·시험일 date input 각각의 wrapper(`space-y-1`)와 input 자체에 `min-w-0` 추가해 grid-cols-2 상태에서 date input 기본 min-content 폭이 모달을 밀어내지 못하도록 수정 |
| `frontend/src/app/globals.css` | 수정 | `html`, `body`에 `overflow-x: hidden` 전역 규칙 추가. 검증 중 발견한 헤더 내비 오버플로우(별도 기존 버그)가 `position:fixed` 요소들의 레이아웃 뷰포트 폭을 왜곡시켜 모달 "저장" 버튼을 화면 밖으로 밀어내는 2차 피해를 차단하는 안전장치 |

### 수정 상세

#### `frontend/src/components/ui/InterestExamTypeModal.tsx`
- 변경 전: `<button ... className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left text-sm transition-all ${...}">...{type.name}</button>` — `min-w-0` 없음, `{type.name}`을 span 없이 직접 렌더
- 변경 후: button className에 `min-w-0` 추가, `{type.name}`을 `<span className="truncate" title={type.name}>{type.name}</span>`로 교체
- 이유: `grid grid-cols-2`의 자식은 기본적으로 `min-width: auto`(min-content)라 긴 라벨이 셀 폭을 넘겨 모달 박스 자체를 밀어냄. `min-w-0`로 축소를 허용하고 `truncate`로 넘치는 텍스트를 말줄임 처리

#### `frontend/src/components/ui/ExamApplicationFormModal.tsx`
- 변경 전: `<div className="grid grid-cols-2 gap-3"><div className="space-y-1">...<input type="date" className="w-full border ...">...`
- 변경 후: 각 date wrapper `<div className="space-y-1 min-w-0">`, input className에 `min-w-0` 추가
- 이유: 브라우저 기본 date input UI가 flex/grid 축소를 막아 `grid-cols-2` 상태에서 모달 폭을 초과시킴

#### `frontend/src/app/globals.css`
- 변경 전: `html` 셀렉터 규칙 없음, `body { font-family: ...; background-color: ...; color: ...; }`(overflow-x 미설정)
- 변경 후: `html { overflow-x: hidden; }` 규칙 신설, `body`에 `overflow-x: hidden;` 추가
- 이유: 위 두 모달을 고쳐도 페이지의 다른 곳(헤더 내비 등)에서 수평 오버플로우가 발생하면 모바일 브라우저가 `position:fixed` 요소의 레이아웃 뷰포트를 넓혀 모달까지 화면 밖으로 밀어내는 것을 실측(1440px)으로 확인 — 전역 방어 규칙으로 근본 차단

### 복원 방법
이 ID(HIST-20260724-001)만으로 복원 시: `InterestExamTypeModal.tsx`의 button className에서 `min-w-0` 제거하고 `<span className="truncate" title={type.name}>{type.name}</span>`를 `{type.name}`으로 되돌림. `ExamApplicationFormModal.tsx`의 date wrapper·input에서 `min-w-0` 제거. `globals.css`에서 `html { overflow-x: hidden; }` 블록 삭제, `body`의 `overflow-x: hidden;` 삭제.

## HIST-20260722-001

- **날짜**: 2026-07-22
- **수정 범위**: 사용자 프론트엔드 / 시험 정보 (관심 시험 유형 모달 공용화 + "직접 등록" 버튼 문구 개선)
- **수정 개요**: 인라인으로 구현돼 있던 "관심 시험 유형 설정" 모달을 `InterestExamTypeModal` 공용 컴포넌트로 추출해 `/user/settings`와 함께 쓸 수 있도록 변경(동작은 기존과 동일, 회귀 없음). 상단 "직접 등록" 버튼을 "다른 시험 직접 등록"으로 라벨을 명확히 하고 `title` 툴팁으로 "목록에 없는 시험의 접수 정보를 직접 입력합니다" 보조 설명 추가. 각 시험 카드 내부의 "+ 접수 정보 입력/추가" 버튼은 변경하지 않음

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/InterestExamTypeModal.tsx` | 추가 | `open`/`onClose`/`onSaved` props의 공용 관심 시험 유형 설정 모달. `examInfoService.getExamTypes`로 목록 조회, `updateInterests`로 저장 후 authStore `setAuth`로 유저 정보 즉시 갱신, 저장 성공 시 `onClose()` → `onSaved?.()` 순서로 호출 |
| `frontend/src/app/user/exam-info/page.tsx` | 수정 | 인라인 관심 설정 모달 JSX·관련 state(`examTypes`/`pendingInterests`/`savingInterests`)·`handleSaveInterests` 제거 후 `InterestExamTypeModal` import로 교체(`onSaved`에서 `examInfoService.getMyExamInfo()` 재조회로 목록 동기화). 상단 "직접 등록" 버튼 텍스트를 "다른 시험 직접 등록"으로 변경하고 `title` 속성 추가 |

### 수정 상세

#### `frontend/src/components/ui/InterestExamTypeModal.tsx`
- 변경 전: 없음(신규 파일)
- 변경 후: `frontend/src/app/user/exam-info/page.tsx`에 있던 관심 시험 유형 설정 모달 JSX·상태·저장 로직을 그대로 이전한 공용 컴포넌트
- 이유: CLAUDE.md 공용 유틸리티 원칙(동일 로직 2곳 이상 필요 시 공통 위치로 추출) — `/user/settings`에도 동일 기능이 필요해짐

#### `frontend/src/app/user/exam-info/page.tsx`
- 변경 전: `showInterestModal`/`examTypes`/`pendingInterests`/`savingInterests` state와 `openInterestModal`/`handleSaveInterests` 함수, 인라인 모달 JSX를 페이지 내부에 직접 구현. 상단 버튼 텍스트 "직접 등록"
- 변경 후: `showInterestModal` state만 유지, `openInterestModal`은 `setShowInterestModal(true)`만 호출, `handleInterestsSaved`가 `InterestExamTypeModal`의 `onSaved` 콜백으로 전달되어 저장 후 `examInfoService.getMyExamInfo()`로 목록 재조회. 상단 버튼 텍스트 "다른 시험 직접 등록" + `title="목록에 없는 시험의 접수 정보를 직접 입력합니다"`
- 이유: 관심 시험 유형 모달 공용화 + 신규 사용자 대상 버튼 의미 명확화 피드백 반영

### 복원 방법
이 ID(HIST-20260722-001)만으로 복원 시 `frontend/src/components/ui/InterestExamTypeModal.tsx`를 삭제하고, `frontend/src/app/user/exam-info/page.tsx`에서 "직접 등록" 버튼으로 텍스트를 되돌린 뒤 관심 설정 모달 관련 state·함수·인라인 JSX를 위 "변경 전" 설명대로 페이지 내부에 복원한다.

## HIST-20260721-004

- **날짜**: 2026-07-21
- **수정 범위**: 사용자 프론트엔드 / 시험 정보 (접수기간·시험일정 상태 배지 판정 기준)
- **수정 개요**: 접수기간·시험일정 상태 배지(`진행중/예정/종료`)를 개인 접수 정보(`applicationDate`/`examDate`)가 있으면 그 날짜 기준으로, 없으면 기존처럼 공식 공통 일정(`item.applicationPeriod`/`item.examSchedule`) 기준으로 판정하도록 수정. 개인 시험일이 과거인데 공식 기간이 아직 안 끝나 "시험일정" 배지가 "진행중"으로 잘못 표시되던 문제 해결. 합격발표 배지·표시되는 날짜 텍스트(`fmtRange`)·D-day 미니 섹션은 변경 없음

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/exam-info/page.tsx` | 수정 | 카드 렌더 루프에서 `applicationsByExamInfoId.get(item.id)`로 개인 접수 기록을 조회해 `applicationDate`/`examDate`가 있는 첫 기록을 찾고, 각각 있으면 그 값을 `getPhaseStatus`에 전달(없으면 기존 공식 필드 그대로 전달) |

### 수정 상세

#### `frontend/src/app/user/exam-info/page.tsx`
- 변경 전:
```tsx
const appStatus = getPhaseStatus(item.applicationPeriod);
const schStatus = getPhaseStatus(item.examSchedule);
const resStatus = getPhaseStatus(item.resultDate);
```
- 변경 후:
```tsx
const myApps = applicationsByExamInfoId.get(item.id) ?? [];
const myApplicationDate = myApps.find(a => a.applicationDate)?.applicationDate;
const myExamDate = myApps.find(a => a.examDate)?.examDate;
const appStatus = getPhaseStatus(myApplicationDate ?? item.applicationPeriod);
const schStatus = getPhaseStatus(myExamDate ?? item.examSchedule);
const resStatus = getPhaseStatus(item.resultDate);
```
- 이유: 사용자 개인 시험일이 과거임에도 공식 공통 기간이 아직 끝나지 않아 "시험일정" 배지가 "진행중"으로 잘못 표시되는 버그 수정. 개인 접수 정보가 있으면 그것을 우선 기준으로 삼는 것이 사용자에게 더 정확한 정보

### 복원 방법
이 ID(HIST-20260721-004)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다.

## HIST-20260721-003

- **날짜**: 2026-07-21
- **수정 범위**: 사용자 프론트엔드 / 시험 정보 (내 접수 정보 D-day 표시)
- **수정 개요**: "내 접수" 미니 섹션에 개인 접수 정보 기반 D-day 배지 추가. 공식 일정 배지(접수기간/시험일정/합격발표 — `진행중/예정/종료`)는 그대로 두고, 개인 접수일·시험일 기반 D-day를 별도 배지로 병기. 공용 로직은 신규 `src/lib/date.ts`로 추출(`exam-info`/`settings` 두 화면 공용)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/lib/date.ts` | 추가 | `parseLocalDate`(기존 `exam-info/page.tsx`에서 이동, 로컬 자정 파싱), `getExamDDayLabel(applicationDate?, examDate?)`(examDate 우선 — `시험까지 D-N`/`오늘 시험일`/`시험 종료`, 없으면 applicationDate만으로 `접수 예정 D-N`/`접수 완료`, 둘 다 없으면 빈 문자열), `isExamDDayUrgent`/`getExamDDayBadgeClass`(오늘 포함 7일 이내 임박이면 빨강 배지, 그 외 회색) |
| `frontend/src/app/user/exam-info/page.tsx` | 수정 | 로컬 `parseLocalDate` 함수 정의 제거 후 `@/lib/date`에서 import. "내 접수" 미니 섹션의 각 접수 항목에 `getExamDDayLabel`/`getExamDDayBadgeClass` 기반 배지 추가(라벨이 빈 문자열이면 미렌더) |

### 수정 상세

#### `frontend/src/lib/date.ts` (신규)
- 변경 전: 없음(신규 파일)
- 변경 후: `parseLocalDate`, `getExamDDayLabel`, `isExamDDayUrgent`, `getExamDDayBadgeClass`, `EXAM_DDAY_BADGE_URGENT`/`EXAM_DDAY_BADGE_NEUTRAL` 상수 export
- 이유: `exam-info/page.tsx`와 `settings/page.tsx` 두 화면이 동일한 D-day 계산·배지 스타일 로직을 필요로 해 CLAUDE.md 공통 유틸리티 원칙에 따라 추출

#### `frontend/src/app/user/exam-info/page.tsx`
- 변경 전: 파일 내부에 `parseLocalDate` 함수를 직접 정의(KST 파싱 버그 방지 주석 포함), "내 접수" 미니 섹션은 접수일·시험일·메모만 텍스트로 표시
- 변경 후: `parseLocalDate`를 `@/lib/date`에서 import(로컬 정의 제거), "내 접수" 각 항목 앞에 `getExamDDayLabel(app.applicationDate, app.examDate)` 결과를 `getExamDDayBadgeClass`로 스타일링한 배지로 표시(라벨 빈 문자열이면 배지 미렌더)
- 이유: 사용자가 직접 입력한 개인 접수 정보에 D-day 카운트다운을 추가해 임박도를 한눈에 파악할 수 있게 함(기존 공식 일정 배지는 그대로 유지, 개인 상태와 혼동되지 않도록 분리)

### 복원 방법
이 ID(HIST-20260721-003)만으로 복원 시:
1. `frontend/src/lib/date.ts` 파일을 삭제한다.
2. `frontend/src/app/user/exam-info/page.tsx`에서 `parseLocalDate`/`getExamDDayLabel`/`getExamDDayBadgeClass` import를 제거하고, "내 접수" 미니 섹션의 D-day 배지 JSX와 `parseLocalDate` 로컬 함수 정의를 원래대로 복원한다(HIST-20260721-002 시점 코드 참고).

---

## HIST-20260721-002

- **날짜**: 2026-07-21
- **수정 범위**: 사용자 프론트엔드 / 시험 정보 (접수 정보 등록 모달)
- **수정 개요**: `ExamApplicationFormModal`의 `validate()`에 날짜 검증 2가지 추가 — 접수일이 시험일보다 늦으면 거부, 연도가 `[2000, 현재연도+10]` 범위를 벗어나면 거부(UX용 조기 피드백, 최종 방어선은 백엔드)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/ExamApplicationFormModal.tsx` | 수정 | `validate()`에 연도 범위 체크(각 날짜의 앞 4자리를 `Number`로 파싱, `2000` ~ `new Date().getFullYear() + 10`)와 순서 체크(`applicationDate > examDate` 문자열 비교, `YYYY-MM-DD` ISO 형식이라 사전순 비교가 곧 날짜 비교와 동일) 추가 |

### 수정 상세

#### `ExamApplicationFormModal.tsx`
- 변경 전:
  ```ts
  const validate = (): string | null => {
    if (!examName.trim()) return '시험명을 입력해 주세요.';
    if (!applicationDate && !examDate) return '접수일 또는 시험일 중 하나는 입력해야 합니다.';
    return null;
  };
  ```
- 변경 후:
  ```ts
  const validate = (): string | null => {
    if (!examName.trim()) return '시험명을 입력해 주세요.';
    if (!applicationDate && !examDate) return '접수일 또는 시험일 중 하나는 입력해야 합니다.';

    const minYear = 2000;
    const maxYear = new Date().getFullYear() + 10;
    for (const dateStr of [applicationDate, examDate]) {
      if (!dateStr) continue;
      const year = Number(dateStr.slice(0, 4));
      if (!Number.isFinite(year) || year < minYear || year > maxYear) {
        return `날짜는 ${minYear}년부터 ${maxYear}년 사이여야 합니다.`;
      }
    }

    if (applicationDate && examDate && applicationDate > examDate) {
      return '접수일은 시험일보다 늦을 수 없습니다.';
    }

    return null;
  };
  ```
- 이유: 저장 버튼 클릭 시 API 왕복 없이 즉시 오류를 안내하기 위한 UX 조기 피드백. 최종 검증은 백엔드 `UserExamApplicationService.validateDates()`(`HIST-20260721-002`, `docs/history/back/usr/UserExamApplication_Modified.md`)가 담당하며, 두 곳의 연도 상한 계산 로직(`현재연도+10`)은 각자의 언어(`new Date().getFullYear()` / `LocalDate.now().getYear()`)로 동적 계산해 하드코딩을 피함.

### 복원 방법
이 ID(HIST-20260721-002)만으로 복원 시 `ExamApplicationFormModal.tsx`의 `validate()`를 위 "변경 전" 상태로 되돌린다.

---

## HIST-20260721-001

- **날짜**: 2026-07-21
- **수정 범위**: 사용자 프론트엔드 / 시험 정보 (신규)
- **수정 개요**: "내 시험 접수 정보" 기능 추가 — 시험 정보 카드마다 내가 입력한 접수일·시험일을 표시하고 등록/수정/삭제할 수 있는 미니 섹션 + 헤더 "+ 직접 등록" 버튼 + exam_info와 연결되지 않은 자유 입력 기록을 위한 "직접 등록한 시험" 섹션 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/exam-info/page.tsx` | 수정 | `examApplicationService.getMine()`을 기존 `examInfoService.getMyExamInfo()`와 `Promise.all`로 병행 로딩(기존 `ExamInfoCardSkeleton` 재사용), examInfoId 기준 그룹핑(`applicationsByExamInfoId`), 각 카드 하단 미니 섹션(매칭 기록 있으면 접수일/시험일+수정/삭제 아이콘, 없으면 "+ 접수 정보 입력"), 헤더에 "+ 직접 등록" 버튼(prefill=null), 자유 입력 기록용 "직접 등록한 시험" 섹션, `ExamApplicationFormModal` 렌더 |
| `frontend/src/services/examApplicationService.ts` | 추가 | `getMine`/`create`/`update`/`remove` axios 함수 (신규 파일, 상세는 `UserExamApplication_Modified.md` 백엔드 히스토리 및 `UserSettings_Modified.md` 참고) |
| `frontend/src/components/ui/ExamApplicationFormModal.tsx` | 추가 | 접수 정보 등록/수정 공용 모달 (신규 파일, 상세는 `UserSettings_Modified.md` 참고) |
| `frontend/src/types/index.ts` | 수정 | `UserExamApplication` 인터페이스 추가 |

### 수정 상세

#### `frontend/src/app/user/exam-info/page.tsx`
- 변경 전: `examInfoService.getMyExamInfo()` 단일 호출로 `items`만 로딩, 카드에 시험 정보만 표시
- 변경 후: `Promise.all([examInfoService.getMyExamInfo(), examApplicationService.getMine()])`로 `items`+`applications` 병행 로딩(로딩 상태는 기존 `loading` 하나로 통합, finally에서 해제). `useMemo`로 `applicationsByExamInfoId`(Map<examInfoId, UserExamApplication[]>) 계산, `freeApplications`(examInfoId 없는 기록) 파생. 카드 그리드(`applicationPeriod`/`examSchedule`/`resultDate`) 아래에 `border-t` 구분선 + 미니 섹션 추가 — 매칭 기록이 있으면 각 기록을 `접수일 .../시험일 .../· 메모` 텍스트 + 수정(연필)/삭제(휴지통) 아이콘 버튼으로 나열하고 "+ 접수 정보 추가" 링크를, 없으면 "+ 접수 정보 입력" 링크만 표시. 헤더 우측에 "+ 직접 등록" 버튼(관심 설정 버튼 왼쪽) 추가 — `openAddApplication()`(item 인자 없이 호출 시 prefill=null). 목록 하단에 `freeApplications.length > 0`일 때 "직접 등록한 시험" 섹션을 카드 리스트로 렌더. 삭제는 `window.confirm()` 후 `examApplicationService.remove(id)` 호출.
- 이유: Q-net 공개 API가 개인별 접수 이력을 제공하지 않아 사용자가 직접 입력한 접수일·시험일을 시험 정보 화면에서 바로 확인·관리할 수 있도록 함.

### 복원 방법
이 ID(HIST-20260721-001)만으로 복원 시 `frontend/src/app/user/exam-info/page.tsx`에서 접수 정보 관련 import·state·핸들러·미니 섹션·"직접 등록한 시험" 섹션·모달 렌더를 모두 제거하고 변경 전 상태(단일 `getMyExamInfo()` 호출)로 되돌린다.

---

## HIST-20260624-005

- **날짜**: 2026-06-24
- **수정 범위**: 사용자 프론트엔드 / 시험 정보
- **수정 개요**: HIST-20260624-004 후속 — 접수 기간 카드 헤더의 '접수하기' 링크를 텍스트 링크에서 채움형 emerald 알약 버튼으로 강화

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/exam-info/page.tsx` | 수정 | '접수하기' `<a>` className을 텍스트 링크(`text-emerald-600`)에서 채움 알약형(`bg-emerald-600 text-white rounded-full`)으로 변경 |

### 수정 상세

#### `frontend/src/app/user/exam-info/page.tsx`
- 변경 전: `"flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors"`
- 변경 후: `"inline-flex items-center gap-0.5 bg-emerald-600 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold hover:bg-emerald-700 shadow-sm transition-colors"`
- 이유: 텍스트 링크 방식은 emerald-50 배경의 접수 기간 카드 위에서 대비가 낮아 가시성 불량. 채움형 알약(`rounded-full`) + `shadow-sm`으로 또렷한 CTA 대비 확보. 헤더 줄 안에 들어가는 소형 크기(`px-1.5 py-0.5 text-[10px]`)로 카드 높이 영향 없음. 조건·위치·보안 속성은 HIST-004와 동일.

### 복원 방법
이 ID(HIST-20260624-005)만으로 복원 시 '접수하기' `<a>` className을 변경 전 값으로 되돌린다.

---

## HIST-20260624-004

- **날짜**: 2026-06-24
- **수정 범위**: 사용자 프론트엔드 / 시험 정보
- **수정 개요**: HIST-20260624-002·003 철회 — full-width 버튼 및 items-start 제거, '접수하기' 링크를 접수 기간 카드 헤더 인라인으로 최종 확정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/exam-info/page.tsx` | 수정 | grid `items-start` 제거(원복), 접수 기간 카드 본문의 full-width "원서 접수" 버튼 제거(원복), 카드 헤더 우측을 `flex items-center gap-1.5` 그룹으로 변경하여 '접수하기↗' 텍스트 링크를 배지 왼쪽에 인라인 배치 |

### 수정 상세

#### `frontend/src/app/user/exam-info/page.tsx`
- 변경 전(HIST-002·003 적용 상태):
  - grid: `grid grid-cols-1 sm:grid-cols-3 gap-3 items-start`
  - 접수 기간 카드 헤더: 좌측 라벨 / 우측 `{배지 span}`
  - 카드 본문 기간 텍스트 아래: `appStatus === 'active' && item.applicationUrl` 조건으로 full-width `py-1` emerald 채움 버튼
- 변경 후(최종 확정):
  - grid: `grid grid-cols-1 sm:grid-cols-3 gap-3` (items-start 제거 → 3개 카드 stretch 동일 높이 복원)
  - 접수 기간 카드 본문: 버튼 블록 완전 제거
  - 접수 기간 카드 헤더 우측: `<div className="flex items-center gap-1.5">` 로 감싸고, `appStatus === 'active' && item.applicationUrl` 조건 시 `text-[9px] font-bold text-emerald-600` '접수하기' + `w-2.5 h-2.5` 외부링크 아이콘 텍스트 링크를 배지 왼쪽에 배치. 배지는 기존과 동일 조건으로 그 오른쪽에 렌더.
  - 보안 속성 `target="_blank" rel="noopener noreferrer"` 유지. 우상단(officialUrl) 미변경.
- 이유: 카드 본문 버튼이 접수 기간 카드 높이를 늘려 형제 카드 레이아웃을 틀어트리는 문제(HIST-003에서 items-start로 임시 보정)를 근본 해결. 헤더 인라인 링크 방식으로 카드 높이 증가 없이 '접수하기' CTA를 접수 기간 맥락 안에 배치.

### 복원 방법
이 ID(HIST-20260624-004)만으로 복원 시 HIST-20260624-003 상태(items-start + full-width 버튼)로 되돌린다.

---

## HIST-20260624-003

- **날짜**: 2026-06-24
- **수정 범위**: 사용자 프론트엔드 / 시험 정보
- **수정 개요**: HIST-20260624-002 후속 보정 — grid `items-start` 추가로 형제 카드 stretch 방지, "원서 접수" 버튼 세로 패딩 축소

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/exam-info/page.tsx` | 수정 | 3열 grid에 `items-start` 추가, "원서 접수" 버튼 padding `px-3 py-1.5` → `px-2 py-1` 축소 |

### 수정 상세

#### `frontend/src/app/user/exam-info/page.tsx`
- 변경 전: `<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">` / 버튼 `px-3 py-1.5`
- 변경 후: `<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">` / 버튼 `px-2 py-1`
- 이유: HIST-20260624-002에서 접수 기간 카드 내 "원서 접수" 버튼 추가 후, grid 기본 `stretch` align으로 인해 시험 일정·합격 발표 카드도 불필요하게 높이가 늘어나는 레이아웃 문제 발생. `items-start`로 각 카드가 자신의 콘텐츠 높이만큼만 렌더되도록 수정. 버튼 패딩도 소폭 줄여 카드 내 높이 증가 최소화.

### 복원 방법
이 ID(HIST-20260624-003)만으로 복원 시:
- grid div에서 `items-start` 제거
- "원서 접수" 버튼 className의 `px-2 py-1`을 `px-3 py-1.5`로 복원

---

## HIST-20260624-002

- **날짜**: 2026-06-24
- **수정 범위**: 사용자 프론트엔드 / 시험 정보
- **수정 개요**: "원서 접수" CTA 버튼을 카드 우상단에서 '접수 기간' 카드 내부 하단으로 이동

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/exam-info/page.tsx` | 수정 | 우상단 flex 그룹에서 "원서 접수" 조건부 링크 제거, 접수 기간 카드(`applicationPeriod` 블록) 내 기간 텍스트 아래에 full-width "원서 접수" 버튼 추가 |

### 수정 상세

#### `frontend/src/app/user/exam-info/page.tsx`
- 변경 전:
  - 카드 헤더 우상단 `shrink-0 flex items-center gap-2` 안에 `appStatus === 'active' && item.applicationUrl` 조건으로 emerald 채움 버튼("원서 접수") 렌더, officialUrl 링크와 나란히 배치
- 변경 후:
  - 우상단 flex 그룹에서 "원서 접수" 조건부 링크 완전 제거. 우상단에는 `officialUrl` 텍스트 링크만 남음
  - 접수 기간 카드(`item.applicationPeriod && <div>`) 내부, `fmtRange(item.applicationPeriod)` `<p>` 태그 바로 아래에 `appStatus === 'active' && item.applicationUrl` 조건부 블록 추가:
    ```tsx
    <a href={item.applicationUrl} target="_blank" rel="noopener noreferrer"
       className="mt-2 flex items-center justify-center gap-1 w-full px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors">
      원서 접수 <svg ...외부링크 아이콘... />
    </a>
    ```
  - emerald 강조 스타일·외부링크 보안 속성·아이콘·라벨 모두 기존 그대로 유지. `w-full`로 카드 폭에 맞는 full-width 버튼
- 이유: 접수 기간이 진행 중일 때, 해당 맥락(접수 기간 카드) 안에서 즉시 접수로 이어지도록 UX 위계 개선. 우상단은 공식 홈페이지 상시 링크 전용으로 정리.

### 복원 방법
이 ID(HIST-20260624-002)만으로 복원 시:
- 접수 기간 카드 내 `appStatus === 'active' && item.applicationUrl` 조건부 `<a>` 블록 제거
- 카드 헤더 우상단 `shrink-0 flex items-center gap-2` 안에 동일 조건부 emerald 채움 버튼을 officialUrl 링크 앞에 다시 추가(HIST-20260624-001 상태 참고)

---

## HIST-20260624-001

- **날짜**: 2026-06-24
- **수정 범위**: 사용자 프론트엔드 / 시험 정보
- **수정 개요**: 접수 기간이 활성(진행 중)이고 `applicationUrl`이 있을 때만 "원서 접수" CTA 버튼 노출

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/exam-info/page.tsx` | 수정 | 카드 헤더 우측에 `appStatus === 'active' && item.applicationUrl` 조건부 "원서 접수" 링크(emerald 채움 버튼) 추가, officialUrl 링크와 함께 flex 컨테이너로 묶음 |

### 수정 상세

#### `frontend/src/app/user/exam-info/page.tsx`
- 변경 전: 카드 헤더 우측에 `{item.officialUrl && <a ...>공식 홈페이지</a>}` 단독 존재 (`shrink-0` 직접 적용)
- 변경 후:
  - `shrink-0 flex items-center gap-2` div로 링크들을 감쌈
  - `appStatus === 'active' && item.applicationUrl` 조건 시: emerald 채움 버튼 스타일(`bg-emerald-600 text-white px-3 py-1.5 rounded-lg`) "원서 접수" 링크 표시 (target=_blank, rel="noopener noreferrer", 외부 화살표 아이콘)
  - officialUrl 링크는 기존 텍스트 스타일 유지 (항상 표시)
- 이유: 접수 기간 진행 중인 경우에만 원서접수 CTA를 노출해 사용자 행동 유도. officialUrl(상시 공식 홈)과 시각적으로 구분(채움 vs 텍스트 링크). "Q-Net" 등 종목 특정 문구 대신 중립 라벨 "원서 접수" 사용.

### 복원 방법
HIST-20260624-001 복원 시:
- 카드 헤더의 링크 그룹 div를 제거하고 `{item.officialUrl && <a className="shrink-0 ...">공식 홈페이지</a>}` 단독 구조로 복원
- "원서 접수" 조건부 링크 제거

---

## HIST-20260612-004

- **날짜**: 2026-06-12
- **수정 범위**: 사용자 프론트엔드 / 시험 정보
- **수정 개요**: 시험 단계 상태 판정(getPhaseStatus)의 타임존 버그 수정 — 오늘 날짜가 '예정'으로 잘못 표시되던 문제 해결

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/exam-info/page.tsx` | 수정 | 날짜 문자열을 로컬 자정 기준으로 파싱하는 `parseLocalDate` 추가, `getPhaseStatus`에서 사용 |

### 수정 상세

#### `frontend/src/app/user/exam-info/page.tsx`
- 변경 전: `getPhaseStatus`가 `new Date(parts[0])`로 날짜를 파싱. `new Date("YYYY-MM-DD")`는 UTC 자정으로 해석되는 반면 `today`는 로컬(KST) 자정이라, KST(UTC+9)에서는 발표일이 오늘이어도 `startDate > today`가 참이 되어 `upcoming`('예정')으로 표시됨.
- 변경 후: `parseLocalDate(s)`(`new Date(y, m-1, d)`로 로컬 자정 생성)를 추가하고 `getPhaseStatus`의 startDate/endDate 파싱에 사용. today(로컬 자정)와 동일 기준으로 비교되어, 발표일이 오늘이면 `active`('진행 중')로 올바르게 판정.
- 이유: "정보처리기사 실기 2026년 정기 기사 1회"의 합격발표일(2026-06-12)이 당일인데 '예정'으로 표시되던 버그 해결.

### 복원 방법
이 ID(HIST-20260612-004)로 복원 시 `parseLocalDate`를 제거하고 `getPhaseStatus`의 파싱을 `new Date(parts[0])`/`new Date(parts[1])`로 되돌린다.

---

## HIST-20260612-003

- **날짜**: 2026-06-12
- **수정 범위**: 사용자 프론트엔드 / 시험 정보
- **수정 개요**: 접수기간·시험일정·합격발표 상태 박스 배경 대비 강화 및 다크모드 클래스 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/exam-info/page.tsx` | 수정 | PHASE_STYLES 배경·테두리·텍스트 색상 대비 강화 |

### 수정 상세

#### `frontend/src/app/user/exam-info/page.tsx`
- 변경 전 (`PHASE_STYLES`):
  - `past`:  `bg-gray-50` (border 없음)
  - `none`:  `bg-gray-50` (border 없음)
  - 다크모드 클래스 없음
- 변경 후 (`PHASE_STYLES`):
  - `active`:  `bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-700`
  - `upcoming`: `bg-blue-50 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-700`
  - `past`:    `bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:border-gray-700`
  - `none`:    `bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:border-gray-700`
  - 텍스트/배지 색상에 `dark:` 변형 추가
- 이유: 흰 카드(`bg-white`) 배경 위에서 `bg-gray-50` 박스가 구분되지 않는 가시성 이슈 해결. `border` 추가 및 배경을 `bg-gray-100`으로 올려 라이트모드 대비 확보. 다크모드 대응 클래스도 함께 추가.

### 복원 방법
이 ID(HIST-20260612-003)만으로 복원 시 위 "수정 상세"의 "변경 전" PHASE_STYLES 내용을 `page.tsx`에 적용한다.

---

## HIST-20260612-002

- **날짜**: 2026-06-12
- **수정 범위**: 사용자 프론트엔드 / 시험 정보
- **수정 개요**: 관심 시험 유형 설정 모달 내 인라인 animate-pulse DIV를 `ExamTypeGridSkeleton`으로 교체

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/exam-info/page.tsx` | 수정 | 모달 내 인라인 animate-pulse grid → `ExamTypeGridSkeleton count={6} itemHeight="h-10"` |

### 수정 상세

#### `frontend/src/app/user/exam-info/page.tsx`
- 변경 전: `<div className="grid grid-cols-2 gap-2 animate-pulse">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-10 rounded-xl bg-gray-100" />))}</div>`
- 변경 후: `<ExamTypeGridSkeleton count={6} itemHeight="h-10" />`
- 이유: 인라인 animate-pulse 직접 구현 → 인라인 복붙 금지 규칙 위반. `itemHeight="h-10"` prop으로 모달 버튼 높이에 맞게 조절

### 복원 방법

이 ID(HIST-20260612-002)만으로 복원 시: `ExamTypeGridSkeleton` import에서 제거 후 모달 로딩 분기를 변경 전 인라인 DIV 배열로 되돌린다.

---

## HIST-20260506-006

- **날짜**: 2026-05-06
- **수정 범위**: 사용자 프론트엔드 / 시험 정보
- **수정 개요**: 시험 정보 카드에 현재 날짜 기준 단계 상태(진행 중 / 예정 / 종료) 배지 및 배경색 표시 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/exam-info/page.tsx` | 수정 | `getPhaseStatus()`, `PHASE_STYLES` 추가 및 접수 기간·시험 일정·합격 발표 박스에 상태별 색상/배지 적용, `resultDate` 표시를 `fmtRange()` 경유로 변경 |

### 수정 상세

#### `user/exam-info/page.tsx`
- **추가**: `PhaseStatus` 타입 (`'active' | 'upcoming' | 'past' | 'none'`)
- **추가**: `getPhaseStatus(rangeStr)` — `"YYYY-MM-DD ~ YYYY-MM-DD"` 형식 파싱, 오늘 날짜 기준으로 상태 반환; 비날짜 문자열은 `'none'` 반환
- **추가**: `PHASE_STYLES` 상수 맵:
  - `active` → 에메랄드 배경 + "진행 중" 배지
  - `upcoming` → 파란색 배경 + "예정" 배지
  - `past` → 회색 배경 + "종료" 배지 + 흐린 텍스트
  - `none` → 기존 회색 배경 (배지 없음)
- **변경**: `displayed.map` 을 arrow function body로 전환, 각 카드에서 `appStatus/schStatus/resStatus` 사전 계산
- **변경**: 3개 정보 박스(접수 기간·시험 일정·합격 발표) — 기존 `bg-gray-50` 고정 → `PHASE_STYLES[status].box` 동적 배경, 상단에 라벨 + 배지 행 추가
- **변경**: `{item.resultDate}` 직접 출력 → `fmtRange(item.resultDate)` 경유 (날짜 포맷 통일)

### 복원 방법

HIST-20260506-006 복원 시:
- `PhaseStatus` 타입, `getPhaseStatus` 함수, `PHASE_STYLES` 상수 제거
- `displayed.map(item => (...))` 형태로 복원 (상태 계산 변수 제거)
- 3개 정보 박스를 `bg-gray-50 rounded-xl p-3` 고정 배경, 라벨만 있는 단순 구조로 복원
- `fmtRange(item.resultDate)` → `{item.resultDate}` 복원

---

## HIST-20260505-016

- **날짜**: 2026-05-05
- **수정 범위**: 사용자 프론트엔드 / 시험 정보, 온보딩
- **수정 개요**: 관심 시험 선택 화면을 하드코딩 EXAM_TYPES → EXAM_TYPE 도메인 슬레이브 동적 조회로 전환, ID 기반 저장

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `User`에 `interestedExamSlaveIds?: number[]` 추가; `EXAM_TYPES` 상수·`ExamType` 타입 제거 |
| `frontend/src/services/examInfoService.ts` | 수정 | `ExamTypeOption` 인터페이스 추가, `getExamTypes()` 추가, `completeOnboarding`/`updateInterests` 인자 `string[]`→`number[]` 변경 |
| `frontend/src/app/onboarding/page.tsx` | 수정 | `useEffect`로 `getExamTypes()` 호출, 선택 상태를 `Set<number>` (ID) 기반으로 변경, 스켈레톤 로딩 추가 |
| `frontend/src/app/user/exam-info/page.tsx` | 수정 | 동적 슬레이브 조회, `pendingInterests: Set<number>`, `interestedExamSlaveIds`로 초기화, `examTypeColor()` 팔레트 함수 추가 |

### 수정 상세

#### `types/index.ts`
- 변경 전: `EXAM_TYPES` const(8개 고정), `ExamType` 타입, `User.interestedExamTypes?: string[]`
- 변경 후: 위 const/타입 제거, `User.interestedExamSlaveIds?: number[]` 추가

#### `examInfoService.ts`
- `getExamTypes()`: `GET /user/exam-types` → `ExamTypeOption[]` (id, name, displayOrder, masterId)
- `completeOnboarding(slaveIds: number[])` / `updateInterests(slaveIds: number[])`: body `{ slaveIds }`

#### `onboarding/page.tsx`
- 마운트 시 `getExamTypes()` 호출 → 동적 슬레이브 목록 표시
- 선택 상태: `Set<string>(name)` → `Set<number>(slaveId)`
- 로딩 중 그리드 스켈레톤 표시

#### `user/exam-info/page.tsx`
- 모달 열 때 `getExamTypes()` 호출, `interestedExamSlaveIds`로 pendingInterests 초기화
- `pendingInterests: Set<number>` (ID 기반)
- 하드코딩 `TYPE_COLOR` 맵 → `examTypeColor(name)` 해시 팔레트 함수

### 복원 방법

HIST-20260505-016 복원 시:
- `types/index.ts`: `EXAM_TYPES`, `ExamType` 복원; `interestedExamSlaveIds` 제거
- `examInfoService.ts`: `getExamTypes()` 제거, `completeOnboarding/updateInterests` 인자를 `string[]`로 복원
- `onboarding/page.tsx`: 하드코딩 `EXAM_TYPES` 기반으로 복원, `Set<string>` 사용
- `user/exam-info/page.tsx`: `TYPE_COLOR` Record, `EXAM_TYPES` import, `Set<string>` 기반으로 복원

---

## HIST-20260427-001

- **날짜**: 2026-04-27
- **수정 범위**: 사용자 프론트엔드 / 시험 정보 + 온보딩
- **수정 개요**: 첫 로그인 온보딩 페이지 신규 구현, 시험 정보 사용자 페이지 신규 구현, 로그인 후 리다이렉트 로직 변경, 사용자 메뉴에 시험 정보 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `User`에 `isFirstLogin?`, `interestedExamTypes?` 추가; `EXAM_TYPES` 상수, `ExamType` 타입, `ExamInfo` 인터페이스 추가 |
| `frontend/src/services/examInfoService.ts` | 추가 | 시험 정보 API 서비스 (admin CRUD + user 조회/온보딩) |
| `frontend/src/app/auth/login/page.tsx` | 수정 | 로그인 후 `isFirstLogin`이면 `/onboarding`으로 리다이렉트 |
| `frontend/src/app/onboarding/page.tsx` | 추가 | 첫 로그인 온보딩 페이지 (시험 유형 멀티셀렉트) |
| `frontend/src/app/user/exam-info/page.tsx` | 추가 | 사용자 시험 정보 페이지 (관심 필터 + 유형 탭 + 관심 설정 모달) |
| `frontend/src/components/layout/UserLayoutShell.tsx` | 수정 | NAV_ITEMS 맨 앞에 "시험 정보" 항목 추가 |

### 수정 상세

#### `types/index.ts`
- `User` 인터페이스: `isFirstLogin?: boolean`, `interestedExamTypes?: string[]` 추가
- 신규: `EXAM_TYPES` (8개 고정 카테고리), `ExamType`, `ExamInfo` 인터페이스

#### 온보딩 플로우
```
로그인 성공
  ├── ADMIN → /admin/exams
  ├── USER + isFirstLogin=true → /onboarding
  └── USER + isFirstLogin=false → /user/exam-info
```

#### `/onboarding` 페이지
- 유저 레이아웃 없이 독립 페이지 (root layout만 적용)
- 8개 시험 유형 카드 멀티셀렉트 (emoji + 이름)
- "시작하기" → POST /user/onboarding → authStore 갱신 → /user/exam-info 리다이렉트
- "나중에 설정하기" → /user/exam-info 바로 이동

#### `/user/exam-info` 페이지
- 관심 유형 배지 표시 + 상단 "관심 설정" 버튼
- 유형별 탭 필터
- 시험 정보 카드: 유형 배지 + 제목 + 설명 + 접수기간/시험일정/합격발표 3칸 그리드 + 공식 홈페이지 링크
- 관심 설정 모달: 유형 체크박스 → PUT /user/exam-info/interests → authStore 갱신

#### `UserLayoutShell.tsx`
- **변경 전**: 시험, 개념노트, 데일리 퀴즈, FAQ, 1:1 문의 (5개)
- **변경 후**: **시험 정보** (신규 첫 항목), 시험, 개념노트, 데일리 퀴즈, FAQ, 1:1 문의 (6개)

### 복원 방법

HIST-20260427-001 복원 시:
- `types/index.ts`: `User`에서 `isFirstLogin`, `interestedExamTypes` 제거; `EXAM_TYPES`, `ExamType`, `ExamInfo` 제거
- `examInfoService.ts` 삭제
- `auth/login/page.tsx`: 리다이렉트 로직을 `user.role === 'ADMIN' ? '/admin/exams' : '/user/exams'`로 복원
- `onboarding/page.tsx` 삭제 (디렉토리 포함)
- `user/exam-info/page.tsx` 삭제 (디렉토리 포함)
- `UserLayoutShell.tsx`: "시험 정보" 항목 제거
