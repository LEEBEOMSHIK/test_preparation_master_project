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
