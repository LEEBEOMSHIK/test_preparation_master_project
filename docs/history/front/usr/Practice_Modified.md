## HIST-20260512-014

- **날짜**: 2026-05-12
- **수정 범위**: 사용자 프론트엔드 / 연습장 + 시험 진행
- **수정 개요**: SQL 오류 발생 시 1:1 문의 안내 링크 추가, 시험 로드 실패·시간 초과 화면에 1:1 문의 안내 링크 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/practice/page.tsx` | 수정 | SQL 결과 오류 블록(`!sqlResult.success`) 하단에 1:1 문의 링크 문구 추가 |
| `frontend/src/app/user/exams/[id]/page.tsx` | 수정 | 시험 로드 실패 상태·시간 초과 상태에 1:1 문의 링크 문구 추가 |

### 수정 상세

#### `practice/page.tsx`
- 변경 전: SQL 오류 시 오류 메시지·위치 표시만
- 변경 후: 오류 블록 하단에 `"오류가 반복되거나 예상치 못한 문제가 발생했나요? 1:1 문의로 알려주세요."` + `/user/inquiries/new` 링크 추가

#### `exams/[id]/page.tsx`
- `!exam || questions.length === 0` 상태: "돌아가기" 버튼 아래 1:1 문의 링크 추가
- `timeUp` 상태: "결과 확인" 버튼 아래 1:1 문의 링크 추가

### 복원 방법

HIST-20260512-014 복원 시:
- `practice/page.tsx` — `!sqlResult.success` 블록 내 문의 안내 `<p>` 태그 제거
- `exams/[id]/page.tsx` — 두 상태 화면의 문의 안내 `<p>` 태그 제거

---

## HIST-20260512-013

- **날짜**: 2026-05-12
- **수정 범위**: 사용자 프론트엔드 / 연습장
- **수정 개요**: 사용 가이드 SQL 탭에서 "연습장 운영 규칙" 카드 제거

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/practice/page.tsx` | 수정 | "연습장 운영 규칙" 카드 블록 제거 (rules 상태·useEffect는 방언 변환 규칙에서 계속 사용) |

### 수정 상세

#### `user/practice/page.tsx`

- 변경 전: 가이드 SQL 탭에 "연습장 운영 규칙" 카드 존재 (금지 명령어·허용 테이블 접두사·멀티 스테이트먼트 규칙·오타 감지 패턴 4개 섹션)
- 변경 후: 카드 블록 삭제. `rules` 상태 및 `getRules()` useEffect는 MySQL/Oracle 방언 탭의 변환 규칙 표시에 여전히 사용되므로 유지.

### 복원 방법

HIST-20260512-013 복원 시:
- SQL 가이드 탭의 방언 탭 선택 바 바로 위에 HIST-20260512-009의 "연습장 운영 규칙" 카드 블록을 재삽입

---

## HIST-20260512-012

- **날짜**: 2026-05-12
- **수정 범위**: 사용자 프론트엔드 / 연습장
- **수정 개요**: 사용 가이드 SQL 탭에 방언별(PostgreSQL/MySQL/Oracle) 테스트 가능·불가 항목 탭 구조 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/practice/page.tsx` | 수정 | `sqlDialectTab` 상태 추가, 방언 선택 탭 바 삽입, 테스트 가능·불가 카드를 방언별로 분리 |

### 수정 상세

#### `user/practice/page.tsx`

- 변경 전: 단일 "테스트 가능 항목" / "테스트 불가 항목" 카드 (방언 구분 없음)
- 변경 후:
  - `sqlDialectTab` 상태 추가 (`'postgresql' | 'mysql' | 'oracle'`, 초기값 `'postgresql'`)
  - 방언 선택 탭 바 삽입 (PostgreSQL=파랑, MySQL=주황, Oracle=장미 pill 버튼)
  - **PostgreSQL 탭**: 기존 정적 목록 그대로 (SELECT/DML/DCL/DDL 테스트 가능 + 10개 제한 항목)
  - **MySQL / Oracle 탭** (공통 렌더러):
    - 테스트 가능: "기본 SQL 항상 지원" 안내 배너 + 활성화된 변환 규칙 목록
    - 테스트 불가: 비활성화된 변환 규칙 테이블 (없으면 "모두 활성화" 안내), 공통 제한은 PostgreSQL 탭 참조 안내

- 이유: PostgreSQL은 기본 DB로 거의 모두 테스트 가능, MySQL/Oracle은 변환 규칙 활성화 여부에 따라 지원 범위가 달라지므로 방언별로 명확히 구분

### 복원 방법

HIST-20260512-012 복원 시:
- `sqlDialectTab` 상태 선언 제거
- 방언 선택 탭 바 제거
- PostgreSQL / MySQL / Oracle 조건부 블록 제거 → HIST-20260512-011 이전 단일 카드 구조로 복원

---

## HIST-20260512-011

- **날짜**: 2026-05-12
- **수정 범위**: 사용자 프론트엔드 / 연습장
- **수정 개요**: "테스트 불가 항목"의 비활성화 변환 규칙 표시를 방언 구분 없이 통합

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/practice/page.tsx` | 수정 | "테스트 불가 항목" 테이블에서 "MySQL 변환 비활성화" / "Oracle 변환 비활성화" 별도 행을 단일 "방언 변환 비활성화" 행으로 통합 |

### 수정 상세

#### `user/practice/page.tsx`

- 변경 전: `mysqlConversionRules`와 `oracleConversionRules`의 비활성화 규칙을 각각 주황/빨강 배경으로 분리 렌더링 ("MySQL 변환 비활성화" / "Oracle 변환 비활성화")
- 변경 후: 두 배열의 비활성화 규칙을 단일 배열로 합쳐 중립 스타일(`bg-gray-50/50`)로 "방언 변환 비활성화" 카테고리로 통합 표시 — 방언 구분 없음

### 복원 방법

HIST-20260512-011 복원 시:
- "테스트 불가 항목" 테이블의 통합 `방언 변환 비활성화` 블록을 제거하고, 분리된 MySQL/Oracle 블록(HIST-20260512-010 기준)으로 복원

---

## HIST-20260512-010

- **날짜**: 2026-05-12
- **수정 범위**: 사용자 프론트엔드 / 연습장
- **수정 개요**: 사용 가이드 "방언별 특수 문법" 섹션 동적화 및 "테스트 불가 항목"에 비활성화 변환 규칙 동적 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/.../services/practiceService.ts` | 수정 | `ConversionRule` 인터페이스 추가, `PracticeRules`에 `mysqlConversionRules`, `oracleConversionRules` 추가 |
| `frontend/.../user/practice/page.tsx` | 수정 | "방언별 특수 문법" 하드코딩 → `enabled=true` 규칙 동적 렌더링으로 교체; "테스트 불가 항목" 테이블에 `enabled=false` 규칙 행 동적 추가 |

### 수정 상세

#### `practiceService.ts`
- `ConversionRule { id, dialect, ruleKey, userLabel, enabled, complex }` 추가 (adminLabel 없는 사용자용)
- `PracticeRules`에 `mysqlConversionRules`, `oracleConversionRules` 배열 추가

#### `user/practice/page.tsx`
- 변경 전: "방언별 특수 문법" — MySQL 4개, Oracle 5개 하드코딩 bullet
- 변경 후: `rules.mysqlConversionRules.filter(r => r.enabled)` 동적 렌더링 (활성화된 것만 표시)
  - 전체 비활성화 시 "활성화된 변환 규칙이 없습니다." 안내
- 변경 전: "테스트 불가 항목" 고정 10개 행
- 변경 후: 고정 10개 행 이후, `enabled=false` MySQL/Oracle 변환 규칙을 각각 "MySQL 변환 비활성화" / "Oracle 변환 비활성화" 분류로 동적 추가 (주황/빨강 행 배경)

### 복원 방법

HIST-20260512-010 복원 시:
- `practiceService.ts` — `ConversionRule` 제거, `PracticeRules`에서 `mysqlConversionRules`, `oracleConversionRules` 제거
- `user/practice/page.tsx` — "방언별 특수 문법" 하드코딩 배열로 복원, "테스트 불가 항목" 동적 행 제거

---

## HIST-20260512-009

- **날짜**: 2026-05-12
- **수정 범위**: 사용자 프론트엔드 / 연습장
- **수정 개요**: 가이드 탭 SQL 서브탭에 "연습장 운영 규칙" 카드 추가 — API에서 실시간 규칙 로드

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/.../user/practice/page.tsx` | 수정 | `PracticeRules` 타입 import, `rules` state 추가, `getRules()` useEffect, 운영 규칙 UI 카드 삽입 |
| `frontend/.../services/practiceService.ts` | 수정 | `PracticeRules`, `TypoPattern` 인터페이스 + `getRules()` 메서드 추가 |

### 수정 상세

#### `practice/page.tsx`
- 변경 전: 가이드 SQL 탭에 정적 테스트 가능/불가 항목만 존재
- 변경 후: "연습장 운영 규칙" 카드 삽입 (테스트 가능 항목 바로 위) — 금지 명령어(badge), 허용 테이블 접두사, 멀티 스테이트먼트 규칙, 오타 감지 패턴 테이블을 API에서 가져와 렌더링; 로드 실패 시 카드 미표시(조건부 렌더링)

#### `practiceService.ts`
- 변경 전: `executeSql`, `resetData` 2개 메서드
- 변경 후: `getRules() → GET /user/practice/rules` 추가 + `PracticeRules`, `TypoPattern` 인터페이스 export

### 복원 방법

HIST-20260512-009 복원 시:
- `practice/page.tsx` — `PracticeRules` import 제거, `rules` state 및 `getRules()` useEffect 제거, "연습장 운영 규칙" 카드 블록 제거
- `practiceService.ts` — `getRules()` 메서드 및 `PracticeRules`, `TypoPattern` 인터페이스 제거

---

## HIST-20260512-008

- **날짜**: 2026-05-12
- **수정 범위**: 사용자 프론트엔드 / 연습장
- **수정 개요**: 사용 가이드 탭을 SQL / OS 서브탭으로 분리

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/practice/page.tsx` | 수정 | `guideTab` 상태 추가, 가이드 탭 전체를 SQL·OS 서브탭 구조로 재구성 |

### 수정 상세

#### `page.tsx`

- 변경 전: 가이드 탭이 단일 그리드(SQL 예제·OS 예제·방언 비교·테스트 가능·테스트 불가 카드 혼재)
- 변경 후:
  - `guideTab` 상태 추가 (`'sql' | 'os'`, 초기값 `'sql'`)
  - 서브탭 바(pill 스타일) 추가 — `SQL 가이드` / `OS 명령어 가이드` 전환
  - **SQL 가이드 서브탭**: SQL 예제(2열 그리드) + 방언 비교표 + 테스트 가능 항목 + 테스트 불가 항목
  - **OS 가이드 서브탭**: Linux/Mac 예제 + Windows 예제 + 터미널 사용 팁

### 복원 방법

HIST-20260512-008 복원 시:
- `guideTab` 상태 선언 제거
- 가이드 탭(`tab === 'guide'`) 전체를 단일 `grid grid-cols-1 lg:grid-cols-2` 구조로 복원

---

## HIST-20260512-007

- **날짜**: 2026-05-12
- **수정 범위**: 사용자 프론트엔드 / 연습장
- **수정 개요**: 사용 가이드 탭에 "테스트 가능 항목" / "테스트 불가 항목" 섹션 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/practice/page.tsx` | 수정 | 가이드 탭에 테스트 가능·불가 항목 카드 2개 추가 |

### 수정 상세

#### `page.tsx`

- 변경 전: 가이드 탭에 SQL 예제·OS 예제·방언 비교표 3개 카드만 존재
- 변경 후: "테스트 가능 항목" 카드(SELECT/DML/DCL/DDL/방언별 자동 변환 목록) + "테스트 불가 항목" 카드(차단 분류 표) 2개 추가 (각 `lg:col-span-2` 전체 폭)

추가 내용:
1. **테스트 가능 항목** — SELECT 12개·DML 5개·DCL 2개·DDL 12개·MySQL 방언 4개·Oracle 방언 5개 항목
2. **테스트 불가 항목** — 트랜잭션 명시 제어, 시퀀스 함수 직접 실행, DO 블록 내 시퀀스 함수, DB 관리 함수, 계정·역할 관리 DDL, 데이터베이스·스키마 관리, 확장 관리, prac_ 외 DML, DELIMITER(MySQL 외), 비-DDL 멀티 스테이트먼트 등 10개 분류

### 복원 방법

HIST-20260512-007 복원 시:
- `page.tsx` 가이드 탭(`tab === 'guide'`)에서 "Testable SQL List" 블록과 "Untestable SQL List" 블록 삭제

---

## HIST-20260511-022

- **날짜**: 2026-05-11
- **수정 범위**: 사용자 프론트엔드 / 연습장
- **수정 개요**: 에러 위치 표시(^) 정확도 개선 — 탭 문자 정렬 보존, JSX 여백 오차 제거, \r\n 정규화

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/practice/page.tsx` | 수정 | `getErrorContext()` 개선, `^` 렌더 방식 수정 |

### 수정 상세

#### `page.tsx`

**`getErrorContext()` 변경:**

변경 전:
```typescript
const stripped = sqlText.replace(/;\s*$/, '');
const colNum = linesBefore[linesBefore.length - 1].length;
return { lineNum, colNum, errorLine };
```

변경 후:
```typescript
const stripped = sqlText.replace(/\r\n/g, '\n').replace(/;\s*$/, '');
const linePrefix = linesBefore[linesBefore.length - 1];
const colNum = linePrefix.length;
const caretPrefix = linePrefix.replace(/[^\t]/g, ' ');
return { lineNum, colNum, errorLine, caretPrefix };
```

개선 내용:
1. `\r\n → \n` 정규화: Windows 줄바꿈 시 position 오차 제거
2. `caretPrefix`: 탭 문자는 탭 그대로 유지, 나머지는 공백으로 치환 → 탭 들여쓰기가 있는 SQL에서 `^` 시각적 정렬 유지

**`^` 렌더 수정:**

변경 전:
```jsx
<pre className="...">
  {' '.repeat(colNum)}^     {/* JSX 들여쓰기(\n + 공백2개)가 앞에 추가되어 오차 발생 */}
</pre>
```

변경 후:
```jsx
<pre className="...">{caretPrefix + '^'}</pre>
```

- JSX 텍스트 노드의 `\n  ` 여백(2칸 오차)이 제거됨
- `' '.repeat(colNum)` 대신 `caretPrefix` 사용으로 탭 문자 지원

### 복원 방법

HIST-20260511-022 복원 시:
- `getErrorContext()`: `\r\n` 정규화 제거, `linePrefix` / `caretPrefix` 제거, `colNum = linesBefore[linesBefore.length - 1].length` 로 복원, 반환값에서 `caretPrefix` 제거
- `^` 렌더: `{caretPrefix + '^'}` → `\n  {' '.repeat(colNum)}^` 복원

---

## HIST-20260511-021

- **날짜**: 2026-05-11
- **수정 범위**: 사용자 프론트엔드 / 연습장
- **수정 개요**: MySQL/Oracle 방언 선택 시 dialect를 API에 전달 — 백엔드 자동 변환 적용

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/practiceService.ts` | 수정 | `executeSql(sql)` → `executeSql(sql, dialect)` — 요청 바디에 `dialect` 추가 |
| `frontend/src/app/user/practice/page.tsx` | 수정 | `runSql`에서 `dialect` 전달, `useCallback` 의존성 추가, 방언 배지 텍스트 수정 |

### 수정 상세

#### `practiceService.ts`

- 변경 전: `executeSql: (sql: string) => apiClient.post(..., { sql })`
- 변경 후: `executeSql: (sql: string, dialect: string) => apiClient.post(..., { sql, dialect })`

#### `page.tsx`

**`runSql` 수정:**
- 변경 전: `practiceService.executeSql(sqlToRun)` + `useCallback(fn, [])`
- 변경 후: `practiceService.executeSql(sqlToRun, dialect)` + `useCallback(fn, [dialect])`

**방언 배지 텍스트 수정:**
- 변경 전: `MySQL 방언 선택 — PostgreSQL 엔진으로 실행`
- 변경 후: `MySQL 방언 → PostgreSQL 자동 변환`

### 복원 방법

HIST-20260511-021 복원 시:
- `practiceService.ts`: `executeSql` 파라미터에서 `dialect` 제거, 요청 바디에서 제거
- `page.tsx`: `executeSql(sqlToRun, dialect)` → `executeSql(sqlToRun)`, `useCallback` 의존성에서 `dialect` 제거, 배지 텍스트 원복
