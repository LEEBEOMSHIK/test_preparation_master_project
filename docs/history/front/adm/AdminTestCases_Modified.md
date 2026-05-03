## HIST-20260503-006

- **날짜**: 2026-05-03
- **수정 범위**: 관리자 프론트엔드 / 테스트 케이스 관리
- **수정 개요**: 전체 테스트 실행 로직 전면 재작성 — useRef 방식 제거, 함수형 업데이트 + auto-open 방식으로 교체

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/test-cases/page.tsx` | 수정 | 전체 실행 큐를 useRef→useState(함수형 업데이트)로 교체, RunModal에 run-all 자동 열기 useEffect 추가, useRef import 제거 |

### 수정 상세

#### `app/admin/test-cases/page.tsx`
- **변경 전**:
  - `runAllRef: useRef<TestCase[]>` + `runAllState: { tc, current, total }` 조합
  - `handleRunAllNext`에서 `runAllRef.current = runAllRef.current.slice(1)` 직접 변경 후 `setRunAllState` 호출
  - RunModal: phase='ready'로 마운트 → 매 케이스마다 사용자가 "Run" 버튼을 수동 클릭해야 했음
- **변경 후**:
  - `runAllList: TestCase[] | null` + `runAllTotal: number` (순수 useState)
  - `currentRunAllTc = runAllList?.[0]`, `runAllCurrentNum = total - remaining + 1` — 렌더 시점 계산
  - `handleRunAllNext`: `setRunAllList(prev => prev.length > 1 ? prev.slice(1) : null)` — 함수형 업데이트로 스테일 클로저 원천 차단
  - RunModal에 `useEffect(() => { if (runAll) { window.open(pageUrl); setPhase('running'); } }, [])` 추가 — 전체 실행 모드에서 마운트 즉시 해당 화면을 자동으로 열어 사용자가 바로 결과를 기록할 수 있음
  - `import useRef` 제거

### 복원 방법

HIST-20260503-006 복원 시:
- `import`에 `useRef` 추가
- `runAllList`, `runAllTotal`, `currentRunAllTc`, `runAllCurrentNum` 제거
- `runAllRef`, `runAllState` 복원
- `handleRunAll/Next/Stop` 이전 구현으로 복원
- RunModal `useEffect` (auto-open) 제거
- 모달 렌더링 JSX를 `runAllState` 기반으로 복원

---

## HIST-20260503-005

- **날짜**: 2026-05-03
- **수정 범위**: 관리자 프론트엔드 / 테스트 케이스 관리
- **수정 개요**: RunModal에 테스트 입력 데이터(계정·입력값) 섹션 추가 — TEST_CONFIG + TEST_DATA 상수 구성

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/test-cases/page.tsx` | 수정 | TEST_CONFIG·TEST_DATA 상수 추가, RunModal에 "테스트 입력 데이터" 섹션 삽입 |

### 수정 상세

#### `app/admin/test-cases/page.tsx`

**TEST_CONFIG**: 테스트 환경 계정 정보를 한 곳에서 관리
- `adminEmail`, `adminPassword`, `userEmail`, `userPassword`, `newUserEmail`, `newUserName`, `newUserPassword`
- 실제 테스트 환경에 맞게 이 상수만 수정하면 됨

**TEST_DATA**: 테스트 케이스 ID → 입력 데이터 매핑 (24개 케이스 포함)
- 인증: ADM-AUTH-001~003, USR-AUTH-001~004 (이메일, 비밀번호)
- 시험/시험지: 검색 키워드, 생성 제목, 문제 모드
- 개념노트·시험정보·FAQ·문의·명언·도메인·권한·메뉴·사용자: 각 입력 필드 데이터

**RunModal 테스트 입력 데이터 섹션**:
- `testData = TEST_DATA[tc.id]`로 해당 케이스 데이터 로드
- 인디고 테두리·배경으로 시각적 강조
- `<code select-all>` — 값 클릭 시 전체 선택, Ctrl+C로 복사
- 복사 안내 문구 포함
- 데이터가 없는 케이스는 섹션 비표시 (조건부 렌더링)

### 복원 방법

HIST-20260503-005 복원 시:
- `TEST_CONFIG`, `TEST_DATA` 상수 제거
- RunModal에서 `const testData = TEST_DATA[tc.id]` 및 "테스트 입력 데이터" 섹션 제거

---

## HIST-20260503-004

- **날짜**: 2026-05-03
- **수정 범위**: 관리자 프론트엔드 / 테스트 케이스 관리
- **수정 개요**: 전체 테스트 실행 버그 근본 수정(useRef 방식) + RunModal "Run" 버튼으로 화면 직접 실행 UX 개편

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/test-cases/page.tsx` | 수정 | SCREEN_URL_MAP 추가, RunModal 단계별(ready→running→기록) UI 개편, run-all을 useRef 기반으로 재구현 |

### 수정 상세

#### `app/admin/test-cases/page.tsx`

**1. 전체 테스트 실행 — useRef 방식으로 근본 수정**
- **원인**: `runAllQueue` state + `runAllIndex` state 조합은 React 배칭 타이밍에 관계없이 스테일 클로저 발생
- **변경 전**: `useState<TestCase[] | null>` 큐 + `setRunAllQueue(prev => prev.slice(1))` 함수형 업데이트
- **변경 후**: `runAllRef = useRef<TestCase[]>` 로 큐 보관 (항상 최신값 직접 참조), `runAllState = useState<{tc, current, total} | null>` 으로 UI 렌더링용 데이터만 state 관리
  - `handleRunAllNext`: `runAllRef.current = runAllRef.current.slice(1)` → 즉시 최신 큐에서 제거 → `setRunAllState`로 다음 tc 렌더링
  - 스테일 클로저 구조적으로 차단

**2. RunModal — "Run" 버튼 + 단계별 UX**
- **변경 전**: 팝업 오픈 즉시 건너뜀/실패/통과 버튼 노출 (수동 기록 느낌)
- **변경 후**: `phase: 'ready' | 'running' | 'record'` 내부 상태로 단계 관리
  - `ready`: "Run — {화면} 화면 열기" 버튼 강조 표시, 화면 URL 안내
  - `running`: 새 탭에 화면 열림, 황색 안내 배너 표시, 단계 수행 후 결과 기록
  - 결과 기록(실제 결과 textarea) 및 건너뜀/실패/통과 버튼은 Run 클릭 후에만 표시
  - 테이블 행 "테스트 실행" 텍스트 링크 → "Run" 아이콘 버튼으로 교체

**3. SCREEN_URL_MAP**
- 화면명 → URL 매핑 상수 추가 (18개 화면)
- RunModal이 `pageUrl` prop으로 수신해 `window.open(pageUrl, '_blank')` 실행

### 복원 방법

HIST-20260503-004 복원 시:
- `SCREEN_URL_MAP` 제거
- `RunModal`에서 `phase` state, `handleRun`, 단계별 섹션 제거 → 기존 3버튼 직접 노출 방식 복원
- `runAllRef` + `runAllState` 제거 → `runAllQueue` + `runAllTotal` state 방식 복원
- 테이블 행 "Run" 버튼 → "테스트 실행" 텍스트 링크 복원

---

## HIST-20260503-003

- **날짜**: 2026-05-03
- **수정 범위**: 관리자 프론트엔드 / 테스트 케이스 관리
- **수정 개요**: 전체 테스트 실행 — 첫 번째 케이스 후 진행 안 되는 버그 수정 (스테일 클로저 → 함수형 큐 슬라이스 방식으로 교체)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/test-cases/page.tsx` | 수정 | `runAllIndex` 제거 → `runAllTotal` 도입, `handleRunAllNext`를 함수형 업데이트(`setRunAllQueue(prev => prev.slice(1))`)로 재작성 |

### 수정 상세

#### `app/admin/test-cases/page.tsx`

- **원인**: `handleRunAllNext`가 렌더 시점의 `runAllIndex` 값을 클로저로 캡처하는 스테일 클로저 문제. `submit` 안에서 `onSave`(→ `setResults`) 와 `runAll.onNext()`(→ `setRunAllIndex`) 가 순서대로 호출될 때, React 배칭·리렌더 타이밍에 따라 캡처된 `runAllIndex`가 오래된 값을 참조해 진행이 멈추거나 마지막 케이스 판정이 잘못됨
- **변경 전**:
  - `runAllIndex: number` state + `setRunAllIndex((i) => i + 1)` 방식
  - `handleRunAllNext`가 클로저로 `runAllIndex`를 읽어 조건 분기
- **변경 후**:
  - `runAllIndex` 제거, `runAllTotal: number` state 추가 (총 케이스 수 보관)
  - `handleRunAllNext`: `setRunAllQueue((prev) => prev.length <= 1 ? null : prev.slice(1))` — 항상 최신 큐를 받는 함수형 업데이트로 스테일 클로저 완전 차단
  - 모달 렌더링: `runAllQueue[runAllIndex]` → `runAllQueue[0]` (큐 헤드가 항상 현재 케이스)
  - 진행 표시: `runAllIndex + 1` → `runAllTotal - runAllQueue.length + 1`

### 복원 방법

HIST-20260503-003 복원 시:
- `runAllTotal` 제거, `runAllIndex: number` state 복원
- `handleRunAllNext`를 조건 분기(`runAllIndex < length - 1`) + `setRunAllIndex` 방식으로 되돌림
- 모달 렌더링의 `runAllQueue[0]` → `runAllQueue[runAllIndex]` 복원

---

## HIST-20260503-002

- **날짜**: 2026-05-03
- **수정 범위**: 관리자 프론트엔드 / 테스트 케이스 관리
- **수정 개요**: 팝업 다크 모드 수정, 전체 테스트 순차 실행 버튼 추가, 통계 카드 클릭 필터링 기능 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/test-cases/page.tsx` | 수정 | RunModal 다크 모드 대응, 전체 테스트 실행 버튼 + 순차 실행 로직, StatCard 클릭 필터링 |

### 수정 상세

#### `app/admin/test-cases/page.tsx`

**1. RunModal 다크 모드**
- **변경 전**: 모달 컨테이너 `bg-white`, 섹션 배경이 `bg-gray-50` / `bg-green-50` 고정 → 다크 모드에서 흰 배경으로 가독성 저하
- **변경 후**:
  - 모달 컨테이너: `bg-white dark:bg-gray-900`
  - 헤더/푸터 구분선: `dark:border-gray-700`
  - 제목: `dark:text-white`
  - 전제 조건 블록: `dark:text-gray-300 dark:bg-gray-800`
  - 테스트 단계 번호: `dark:bg-indigo-900/40 dark:text-indigo-400`
  - **기대 결과 블록**: `dark:text-gray-100 dark:bg-green-900/20 dark:border-green-800` (가장 중요한 수정)
  - textarea: `dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:placeholder-gray-600`
  - 버튼류 다크 변형 추가

**2. 전체 테스트 실행 버튼**
- **변경 전**: 개별 "테스트 실행" 버튼만 존재
- **변경 후**:
  - 헤더에 "전체 테스트 실행" 버튼(에메랄드 색상) 추가
  - `runAllQueue: TestCase[] | null`, `runAllIndex: number` state 추가
  - `handleRunAll()`: 현재 필터 조건의 케이스 목록으로 큐 구성, confirm 후 실행
  - `handleRunAllNext()`: 다음 케이스로 진행, 마지막이면 큐 종료
  - `handleRunAllStop()`: 중간 종료
  - `RunModal`에 `runAll` prop 추가 — 헤더에 `(현재 / 전체)` 진행 표시, 통과/실패/건너뜀 선택 후 자동으로 다음 케이스로 이동
  - `key` prop(`runall-{id}`)으로 케이스 전환 시 내부 state 초기화 보장
  - 실행 종료 버튼("실행 종료")으로 중간에 중단 가능

**3. 통계 카드 클릭 필터링**
- **변경 전**: `StatCard`가 표시 전용(클릭 불가)
- **변경 후**:
  - `StatCard`에 `active?: boolean`, `onClick?: () => void` prop 추가
  - `active` 시 인디고 링 + 강조 테두리 표시
  - 클릭 시 `filterStatus` 토글 — 이미 활성화된 카드 재클릭 시 '전체'로 복귀
  - "전체" 카드는 `filterStatus === ''`일 때 active
  - `handleStatCardClick(status)` 핸들러로 중복 제거

### 복원 방법

HIST-20260503-002 복원 시:
- `RunModal`의 모든 `dark:` variant 제거, `bg-white` 단일 사용 복원
- `runAll` prop 및 관련 state(`runAllQueue`, `runAllIndex`), 핸들러(`handleRunAll`, `handleRunAllNext`, `handleRunAllStop`) 제거
- "전체 테스트 실행" 버튼 제거
- `StatCard`를 표시 전용 `div`로 되돌리고 `active`/`onClick` prop 제거

---

## HIST-20260502-003

- **날짜**: 2026-05-02
- **수정 범위**: 관리자 프론트엔드 / 테스트 케이스 관리
- **수정 개요**: 테스트 케이스 관리 화면 신규 구현 — 화면·기능별 62개 케이스, 실행/결과 기록, 검색/페이징, Excel(CSV) 다운로드

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/test-cases/page.tsx` | 추가 | 테스트 케이스 관리 페이지 신규 생성 |
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | `test` 아이콘 ICON_MAP 추가, FALLBACK_NAV에 `테스트 케이스` 항목 추가 |
| `docs/claude-config/TestCaseSpec.md` | 추가 | AI용 테스트 케이스 생성 규격서 |

### 수정 상세

#### `app/admin/test-cases/page.tsx`
- **변경 전**: 파일 없음
- **변경 후**: 신규 생성
  - 62개 테스트 케이스 정적 정의 (`TEST_CASES` 배열) — 관리자 49건, 사용자 10건, 공통 UI 3건
  - 통계 카드 (전체 / 통과 / 실패 / 건너뜀 / 미실행)
  - 필터: 카테고리, 화면, 우선순위, 상태, 키워드 검색
  - 페이징: 10/20/50건 선택, 5페이지 단위 네비게이션
  - 테스트 실행 모달: 전제조건·단계·기대결과 표시, 실제결과 메모, 통과/실패/건너뜀 버튼
  - 결과 localStorage 저장 (`tpmp_test_results_v1`)
  - Excel 다운로드: BOM UTF-8 CSV 생성 (필터된 케이스 기준)
  - Skeleton UI: 로딩 시 `TableSkeleton rows={8} cols={6}`

#### `components/layout/AdminLayoutShell.tsx`
- **변경 전**: `test` 아이콘 없음, FALLBACK_NAV에 테스트 케이스 항목 없음
- **변경 후**:
  - ICON_MAP에 `test` 키 추가 (체크리스트 모양 SVG)
  - FALLBACK_NAV에 `{ id: 11, name: '테스트 케이스', url: '/admin/test-cases', iconKey: 'test', displayOrder: 11 }` 추가

#### `docs/claude-config/TestCaseSpec.md`
- **변경 전**: 파일 없음
- **변경 후**: AI용 테스트 케이스 생성 규격서
  - ID PREFIX 표 (화면별 분류)
  - TestCase 타입 정의
  - 우선순위 / 유형 기준표
  - 새 화면 추가 시 기본 5개 케이스 템플릿
  - 현재 등록 케이스 현황 표

### 복원 방법

HIST-20260502-003 복원 시:
- `frontend/src/app/admin/test-cases/` 디렉토리 삭제
- `AdminLayoutShell.tsx`: ICON_MAP에서 `test` 블록 제거, FALLBACK_NAV에서 `id: 11` 항목 제거
- `docs/claude-config/TestCaseSpec.md` 삭제
