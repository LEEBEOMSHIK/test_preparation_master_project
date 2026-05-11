## HIST-20260511-005

- **날짜**: 2026-05-11
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈
- **수정 개요**: 관심 시험 유형 기반으로 실제 문항이 있는 문제 유형만 표시 — 백엔드 필터링 연동

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/quizService.ts` | 수정 | `getCategories`에 `examTypeIds` 파라미터 추가 |
| `frontend/src/app/user/quiz/page.tsx` | 수정 | API 호출 시 관심 시험 유형 ID 전달 + 관심 유형 변경 시 재조회 |

### 수정 상세

#### `quizService.ts`
- 변경 전: `getCategories: () => apiClient.get(...)`
- 변경 후: `getCategories: (examTypeIds?: number[]) => apiClient.get(..., { params: { examTypeIds: ids.join(',') } })`
- 이유: 백엔드에 시험 유형 ID를 전달해 해당 유형에 실제 문항이 있는 문제 유형만 필터링 받음

#### `quiz/page.tsx`
- `interestedIds`, `examTypeIdsKey`를 `useEffect` 밖에서 선언 (deps 의존)
- `useEffect` deps를 `[]` → `[examTypeIdsKey]`로 변경 — 관심 유형이 로드/변경될 때 재조회
- API 호출 시 `examTypeIds` 전달 (관심 없으면 undefined)
- `setLoading(true)` 추가 — 재조회 시 로딩 상태 초기화

### 동작 변경 요약

| 상황 | 변경 전 | 변경 후 |
|------|---------|---------|
| 관심 유형 없음 | 문제 유형 전체 | 문제 유형 전체 |
| 관심 유형 선택 | 문제 유형 전체 (필터 없음) | 해당 유형에 문항이 존재하는 문제 유형만 표시 |

### 복원 방법

HIST-20260511-005 복원 시:
- `quizService.ts`: `getCategories` 파라미터·params 제거
- `quiz/page.tsx`: `examTypeIdsKey` 변수 제거, `useEffect` deps `[]`로 복원, `setLoading(true)` 제거, API 파라미터 제거

---

## HIST-20260511-002

- **날짜**: 2026-05-11
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈
- **수정 개요**: 퀴즈 카테고리 페이지에서 "문제 유형" 카테고리가 표시되지 않는 버그 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/quiz/page.tsx` | 수정 | `visibleMasters` 필터링 로직 — EXAM_TYPE에만 관심 유형 필터 적용 |

### 수정 상세

#### `frontend/src/app/user/quiz/page.tsx`

**원인 분석:**
- `interestedExamSlaveIds`는 "시험 유형"(EXAM_TYPE) 마스터의 슬레이브 ID 목록 (예: SQLD, 정보처리기사 등)
- 기존 코드는 API로 받은 **모든** 마스터(문제 유형, 시험 유형)에 동일한 ID 필터를 적용
- "문제 유형" 슬레이브(운영체제, SQL, 네트워크 등)는 EXAM_TYPE 슬레이브와 전혀 다른 엔티티이므로 ID가 절대 일치하지 않음
- 결과: 사용자가 관심 유형을 선택했을 때 "문제 유형" 마스터의 모든 슬레이브가 필터링 제거 → `slaves.length === 0` → 마스터 자체가 `visibleMasters`에서 제거됨

- 변경 전:
  ```typescript
  const visibleMasters = masters.map(master => ({
    ...master,
    slaves: interestedIds.length > 0
      ? master.slaves.filter(s => interestedIds.includes(s.id))
      : master.slaves,
  })).filter(master => master.slaves.length > 0);
  ```
- 변경 후:
  ```typescript
  // EXAM_TYPE 마스터만 관심 유형으로 필터링 (문제 유형은 항상 전체 표시)
  const visibleMasters = masters.map(master => ({
    ...master,
    slaves: (interestedIds.length > 0 && master.code === 'EXAM_TYPE')
      ? master.slaves.filter(s => interestedIds.includes(s.id))
      : master.slaves,
  })).filter(master => master.slaves.length > 0);
  ```
- 이유: "시험 유형"(EXAM_TYPE)만 관심 유형 ID로 필터링하고, "문제 유형"(QUESTION_TYPE)은 항상 전체 슬레이브 표시

### 동작 변경 요약

| 상황 | 변경 전 | 변경 후 |
|------|---------|---------|
| 관심 유형 없음 | 문제 유형 + 시험 유형 전체 표시 | 문제 유형 + 시험 유형 전체 표시 |
| 관심 유형 선택 (예: SQLD) | 시험 유형: SQLD만 표시, **문제 유형: 표시 안 됨 (버그)** | 시험 유형: SQLD만 표시, **문제 유형: 전체 표시 (정상)** |

### 복원 방법

HIST-20260511-002 복원 시:
- `quiz/page.tsx` `visibleMasters` 정의를 변경 전 코드로 되돌림 (master.code === 'EXAM_TYPE' 조건 제거)
