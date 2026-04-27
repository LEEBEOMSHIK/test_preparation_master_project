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
