## HIST-20260624-001

- **날짜**: 2026-06-24
- **수정 범위**: 관리자 프론트엔드 / 시험 정보 관리
- **수정 개요**: 시험 정보 관리 폼에 "접수 사이트 URL" 입력란 추가, 목록 카드에 접수 사이트 링크 노출

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `ExamInfo` 인터페이스에 `applicationUrl?: string` 필드 추가 |
| `frontend/src/app/admin/exam-info/page.tsx` | 수정 | `EMPTY_FORM`/`FormState`에 `applicationUrl: ''` 추가, `openEdit`/`handleSave`에 연결, `renderFormFields`에 입력란 추가, 목록 카드에 접수 사이트 링크 추가 |

### 수정 상세

#### `frontend/src/types/index.ts`
- 변경 전: `officialUrl?: string;` 다음 바로 `isActive`
- 변경 후: `officialUrl?: string;` 다음에 `applicationUrl?: string;` 추가

#### `frontend/src/app/admin/exam-info/page.tsx`
- 변경 전: `EMPTY_FORM`에 `officialUrl: ''`, `openEdit`에 `officialUrl: item.officialUrl ?? ''`, payload에 `officialUrl: form.officialUrl`, `renderFormFields` 내 공식 홈페이지 URL 입력란만 존재, 목록 카드에 officialUrl 링크만 존재
- 변경 후:
  - `EMPTY_FORM`에 `applicationUrl: ''` 추가
  - `openEdit`에 `applicationUrl: item.applicationUrl ?? ''` 추가
  - payload에 `applicationUrl: form.applicationUrl` 추가
  - `renderFormFields` 내 "공식 홈페이지 URL" 입력란 바로 다음에 "접수 사이트 URL" `<input type="url">` 추가 (placeholder로 노출 조건 안내)
  - 목록 카드 일정 요약 영역에 `item.applicationUrl`이 있을 때 "접수 사이트 ↗" (emerald 색상) 링크 추가

### 복원 방법
HIST-20260624-001 복원 시:
- `types/index.ts`: `applicationUrl?: string` 제거
- `admin/exam-info/page.tsx`: `EMPTY_FORM.applicationUrl` 제거, `openEdit`/payload에서 제거, `renderFormFields`에서 "접수 사이트 URL" 입력란 제거, 목록 카드 applicationUrl 링크 제거

---

## HIST-20260506-007

- **날짜**: 2026-05-06
- **수정 범위**: 관리자 프론트엔드 / 시험 정보 관리
- **수정 개요**: 합격 발표 필드를 날짜 범위 피커 → 단일 날짜 피커로 변경, 수정 폼을 상단 고정에서 해당 카드 위치 인라인으로 변경

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exam-info/page.tsx` | 수정 | `resultDateStart/End` 제거 → `resultDate` 단일 필드, `showForm` → `showCreateForm`으로 분리, 수정 폼 인라인 렌더링, `renderFormFields()` 함수 추출 |

### 수정 상세

#### `admin/exam-info/page.tsx`
- **변경**: `EMPTY_FORM`에서 `resultDateStart: ''`, `resultDateEnd: ''` 제거 → `resultDate: ''` 단일 필드
- **변경**: `openEdit()`에서 `parseRange(item.resultDate).start`만 추출해 `resultDate`에 할당 (기존 range 데이터 하위 호환)
- **변경**: `handleSave` payload에서 `buildRange(form.resultDateStart, form.resultDateEnd)` → `form.resultDate` (단일 날짜 문자열)
- **변경**: 합격 발표 폼 영역 — 날짜 피커 2개 + "~" 구분자 제거 → `<input type="date">` 단일 필드
- **변경**: `showForm: boolean` → `showCreateForm: boolean` 분리; 수정 시 인라인 렌더링으로 전환
  - 추가 폼: `showCreateForm` 이 true일 때 목록 위에 표시 (기존 동작 유지)
  - 수정 폼: `editingId === item.id` 조건으로 해당 카드 위치에 인라인 표시 (새 동작)
- **추가**: `cancelEdit()` — `setEditingId(null)` + `setShowCreateForm(false)` 통합
- **추가**: `renderFormFields()` — 추가/수정 공통 폼 필드 렌더 함수 (코드 중복 제거)
- **변경**: 목록의 발표일 표시: `fmtRange(item.resultDate)` → `fmtDate(parseRange(item.resultDate).start || item.resultDate)` (단일 날짜 형식)

### 복원 방법

HIST-20260506-007 복원 시:
- `EMPTY_FORM`에서 `resultDate` 제거 → `resultDateStart: ''`, `resultDateEnd: ''` 복원
- `openEdit()`에서 `resStart` 추출 제거 → `resultDateStart: resRange.start, resultDateEnd: resRange.end` 복원
- `handleSave` payload에서 `resultDate: form.resultDate` → `resultDate: buildRange(form.resultDateStart, form.resultDateEnd)` 복원
- 합격 발표 폼: 단일 `<input type="date">` → 2개 날짜 피커 + "~" 구분자로 복원
- `showCreateForm` → `showForm`으로 복원, `editingId` 기반 인라인 렌더링 제거 → 단일 `showForm` 조건 블록으로 복원
- `renderFormFields()` 제거, 인라인 JSX로 복원

---

## HIST-20260506-005

- **날짜**: 2026-05-06
- **수정 범위**: 관리자 프론트엔드 / 시험 정보 관리
- **수정 개요**: 합격 발표(`resultDate`) 입력을 자유 텍스트 → 날짜 범위 피커(시작일 ~ 종료일)로 교체

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exam-info/page.tsx` | 수정 | `resultDate` 단일 text 입력 제거 → `resultDateStart/End` date 피커 2개로 교체, 공식 URL 필드를 별도 행으로 이동 |

### 수정 상세

#### `admin/exam-info/page.tsx`
- **변경 전**: `EMPTY_FORM`에 `resultDate: ''` (단일 문자열), 폼에 `<input type="text" placeholder="예: 시험 후 약 4주">`, 목록에 `{item.resultDate}` 직접 출력
- **변경 후**:
  - `EMPTY_FORM`에 `resultDateStart: ''`, `resultDateEnd: ''` 분리
  - 폼에 `<input type="date">` 2개 + `~` 구분자 (접수 기간·시험 일정과 동일한 패턴)
  - `openEdit` 에서 `parseRange(item.resultDate)` 로 start/end 분리해 피커에 채움
  - `handleSave` 에서 `buildRange(form.resultDateStart, form.resultDateEnd)` 로 직렬화
  - 목록 표시에 `fmtRange(item.resultDate)` 적용 (날짜 포맷 통일)
  - 공식 홈페이지 URL 필드를 기존 3열 그리드(합격발표와 함께)에서 독립 행으로 분리

### 복원 방법

HIST-20260506-005 복원 시:
- `EMPTY_FORM`에서 `resultDateStart/End` 제거 → `resultDate: ''` 복원
- `openEdit`에서 `resRange` 파싱 제거 → `resultDate: item.resultDate ?? ''` 복원
- `handleSave` payload에서 `buildRange(form.resultDateStart, form.resultDateEnd)` → `form.resultDate` 복원
- 합격 발표 날짜 범위 `<div>` 블록 제거 → text input 복원
- 공식 URL을 다시 3열 grid 안으로 이동
- 목록 표시에서 `fmtRange(item.resultDate)` → `{item.resultDate}` 복원

---

## HIST-20260430-006

- **날짜**: 2026-04-30
- **수정 범위**: 관리자 프론트엔드 / 시험 정보 관리
- **수정 개요**: 전체 너비 레이아웃으로 변경 + 시험명/유형 키워드 검색 조건 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exam-info/page.tsx` | 수정 | `max-w-3xl` 제거 → 전체 너비, `filteredItems` useMemo + 검색 UI 추가 |

### 수정 상세

- **변경 전**: `<div className="max-w-3xl space-y-6">` — 최대 너비 제한됨
- **변경 후**: `<div className="space-y-6">` — 다른 관리자 페이지와 동일한 전체 너비
- 검색 조건: 시험명 또는 시험 유형으로 필터 (버튼 클릭 시 `filteredItems` 반영)

### 복원 방법

이 ID(HIST-20260430-006)로 복원 시: `max-w-3xl` 복원, `filteredItems`/검색 상태/검색 UI 제거, `items.map` 복원

---

## HIST-20260428-005

- **날짜**: 2026-04-28
- **수정 범위**: 관리자 프론트엔드 / 시험 정보 관리
- **수정 개요**: date 입력 포커스 아웃(blur) 시 범위 벗어난 값 자동 초기화

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exam-info/page.tsx` | 수정 | 4개 date 입력에 `onBlur` 핸들러 추가 — `isAllowedDate()` 실패 시 해당 필드 `''`으로 초기화 |

### 수정 상세

#### `admin/exam-info/page.tsx`
- **변경**: 접수 기간 시작일/종료일, 시험 일정 시작일/종료일 4개 입력 모두
  - `onBlur={e => { if (!isAllowedDate(e.target.value)) set(field, ''); }}`
  - 포커스를 벗어날 때 정규식(`DATE_RE`) 검증을 재실행해 범위 밖이면 빈 문자열로 리셋

### 복원 방법

HIST-20260428-005 복원 시: 4개 date 입력에서 `onBlur` 속성을 제거한다.

---

## HIST-20260428-004

- **날짜**: 2026-04-28
- **수정 범위**: 관리자 프론트엔드 / 시험 정보 관리
- **수정 개요**: 날짜 입력을 오늘 기준 ±10년으로 제한 — 정규식 검증 + min/max 속성 적용

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exam-info/page.tsx` | 수정 | `DATE_RE` 정규식 + `isAllowedDate()` 함수 추가, 4개 date 입력에 `min`/`max` 및 regex 검증 적용 |

### 수정 상세

#### `admin/exam-info/page.tsx`
- **추가**: `THIS_YEAR`, `MIN_DATE`(`YYYY-01-01`), `MAX_DATE`(`YYYY-12-31`) 모듈 상수
- **추가**: `DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/` — 연도 추출 정규식
- **추가**: `isAllowedDate(val)` — 정규식으로 연도를 파싱해 `[THIS_YEAR-10, THIS_YEAR+10]` 범위 초과 시 `false` 반환
- **변경**: 4개 `<input type="date">`에 `min={MIN_DATE}` `max={MAX_DATE}` 추가
- **변경**: 종료일 `min`을 `시작일 || MIN_DATE` 로 설정 (역순 + 범위 이탈 동시 방지)
- **변경**: `onChange`에서 `isAllowedDate()` 통과 시에만 state 업데이트 (키보드/붙여넣기 입력도 차단)
- **추가**: 레이블에 허용 연도 범위 힌트 표시

### 복원 방법

HIST-20260428-004 복원 시: `THIS_YEAR`/`MIN_DATE`/`MAX_DATE`/`DATE_RE`/`isAllowedDate` 제거, date 입력에서 `min`/`max`/regex 검증 제거.

---

## HIST-20260428-003

- **날짜**: 2026-04-28
- **수정 범위**: 관리자/사용자 프론트엔드 / 시험 정보 관리
- **수정 개요**: 접수 기간·시험 일정 입력을 자유 텍스트에서 날짜 범위 피커(시작일 ~ 종료일)로 교체

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exam-info/page.tsx` | 수정 | 폼 state를 start/end 분리, `<input type="date">` 범위 피커로 교체, 저장 시 `"YYYY-MM-DD ~ YYYY-MM-DD"` 직렬화, 목록에 `fmtRange` 표시 적용 |
| `frontend/src/app/user/exam-info/page.tsx` | 수정 | `fmtRange` 함수 추가, 접수 기간·시험 일정 표시에 적용 |

### 수정 상세

#### `admin/exam-info/page.tsx`
- **변경 전**: `applicationPeriod`, `examSchedule` 단일 text 입력
- **변경 후**: `applicationPeriodStart/End`, `examScheduleStart/End` 네 개의 date 피커로 분리
- 저장 시 `buildRange(start, end)` → `"YYYY-MM-DD ~ YYYY-MM-DD"` 문자열 조합 후 API 전달 (백엔드 컬럼 변경 없음)
- 편집 시 `parseRange()` 로 기존 저장 문자열을 start/end로 분리해 피커에 채움
- 종료 날짜의 `min` 속성을 시작 날짜로 설정해 역순 입력 방지

#### `user/exam-info/page.tsx`
- **변경 전**: `{item.applicationPeriod}` 원문 출력
- **변경 후**: `fmtRange()` 경유 — `"2026-01-15 ~ 2026-03-20"` → `"2026.01.15 ~ 2026.03.20"` 형태로 표시

### 복원 방법

HIST-20260428-003 복원 시:
- 어드민 폼 state를 단일 문자열(`applicationPeriod`, `examSchedule`)로 되돌리고 text input 복원
- 사용자 페이지에서 `fmtRange` 함수 제거, 원문 출력으로 되돌림

---

## HIST-20260428-001

- **날짜**: 2026-04-28
- **수정 범위**: 관리자 프론트엔드 / 시험 정보 관리
- **수정 개요**: 시험 유형 콤보박스를 하드코딩 배열 대신 DB domain_master "시험 유형" 슬레이브 목록으로 교체

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exam-info/page.tsx` | 수정 | EXAM_TYPES 하드코딩 제거 → domainService.getDomains()로 "시험 유형" 슬레이브 동적 로드 |

### 수정 상세

#### `frontend/src/app/admin/exam-info/page.tsx`
- **변경 전**: `import { EXAM_TYPES } from '@/types'`로 하드코딩 배열 사용, select에 EXAM_TYPES 고정 출력
- **변경 후**: `domainService.getDomains()`를 `useEffect`에서 호출해 name="시험 유형" 마스터를 찾고, 그 슬레이브 name 목록을 `examTypeOptions` state에 저장 → select에 동적 렌더링

### 복원 방법

HIST-20260428-001 복원 시: `domainService` import 제거, `examTypeOptions` state 제거, `EXAM_TYPES` import 복구, select를 EXAM_TYPES 정적 배열로 되돌린다.

---

## HIST-20260427-001

- **날짜**: 2026-04-27
- **수정 범위**: 관리자 프론트엔드 / 시험 정보 관리
- **수정 개요**: 시험 정보 관리 페이지 신규 구현 — 관리자 CRUD UI, AdminLayoutShell에 시험 정보 관리 메뉴 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exam-info/page.tsx` | 추가 | 시험 정보 관리 페이지 (추가/수정/삭제 폼 + 목록) |
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | `examinfo` 아이콘 추가, FALLBACK_NAV에 시험 정보 관리 항목 추가 |

### 수정 상세

#### `app/admin/exam-info/page.tsx` (신규)
- 상단 "시험 정보 추가" 버튼 → 인라인 폼 토글
- 폼 항목: 시험 유형(select) + 시험명 + 설명 + 접수기간 + 시험일정 + 합격발표 + URL + 정렬순서 + 활성화 체크박스
- 목록: 유형 배지 + 제목 + 설명 미리보기 + 일정 요약 + 수정/삭제 버튼

#### `AdminLayoutShell.tsx`
- **변경 전**: `examinfo` 아이콘 없음, FALLBACK_NAV 9개
- **변경 후**: `examinfo` SVG 아이콘 추가, FALLBACK_NAV에 `{ id: 10, url: '/admin/exam-info', name: '시험 정보 관리', iconKey: 'examinfo', displayOrder: 10 }` 추가

### 복원 방법

HIST-20260427-001 복원 시:
- `app/admin/exam-info/page.tsx` 삭제
- `AdminLayoutShell.tsx`: `examinfo` 아이콘 제거, FALLBACK_NAV에서 id:10 항목 제거
