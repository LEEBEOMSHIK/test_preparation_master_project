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
