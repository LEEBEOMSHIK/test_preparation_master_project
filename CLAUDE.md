# CLAUDE.md — AI Development Guide

이 파일은 Claude Code가 프로젝트를 이해하고 일관되게 기여하기 위한 핵심 가이드입니다.

---

## 응답 언어 규칙

**모든 응답은 무조건 한국어로 작성한다.**
사용자가 영어로 질문하더라도 코드 외 모든 텍스트는 반드시 한국어로 답변한다.
코드 블록 내부의 변수명·주석·문자열은 기존 파일 컨벤션을 따른다.

---

## Project Overview

**Test Preparation Master Project (TPMP)** — 시험 준비·개념 정리 웹 서비스.
→ [`docs/project-overview.md`](docs/project-overview.md)

---

## Repository Structure

```
frontend/   → Next.js 14 + TypeScript (React Native Web)
backend/    → Spring Boot 3 + Java 17 + Gradle
docs/       → 설계 문서
nginx/      → Reverse proxy
docker-compose.yml
```

---

## Key Conventions

### Frontend
- TypeScript strict · Tailwind CSS · Zustand · axios
- 컴포넌트: `src/components/` (React Native Web 호환)
- 페이지: `src/app/` (Next.js App Router) · 모바일 우선 반응형
- → [`docs/code-guidelines.md`](docs/code-guidelines.md) · [`docs/style-guidelines.md`](docs/style-guidelines.md)

### Backend
- 패키지: `com.tpmp.testprep`
- 레이어: Controller → Service → Repository → Entity
- DTO: `dto/request/` / `dto/response/` 분리
- 인증: JWT (Access Token 15분, Refresh Token 7일)
- 응답: `ApiResponse<T>` 래퍼 · 예외: `@ControllerAdvice` + `ErrorCode` enum
- → [`docs/security.md`](docs/security.md)

### Database
- PostgreSQL 15 · JPA/Hibernate · snake_case (테이블/컬럼)
- → [`docs/db-guidelines.md`](docs/db-guidelines.md)

---

## Development Workflow

- 브랜치: `feature/{scope}-{description}` (예: `feature/backend-exam-upload`)
- 커밋: `[FE|BE|INFRA] type: subject` (예: `[BE] feat: 시험 파일 업로드 API 추가`)
- PR: main 브랜치 머지, 리뷰 1인 이상 필요

---

## Cost-Aware Exploration & Verification

요청 비용을 줄이기 위해 **좁은 탐색 → 필요한 경우에만 확장 → 마지막에 검증** 순서로 진행한다.

### `rg` 사용 설명

`rg`는 ripgrep 명령어로, 프로젝트 파일에서 문자열·정규식을 빠르게 찾는 검색 도구다. 코드베이스 탐색의 기본 검색 도구로 사용하되, 출력이 곧 모델 컨텍스트 비용이 되므로 항상 범위와 제외 대상을 제한한다.

권장 예시:

```powershell
rg "QuestionBank|questionNo" frontend/src/app/admin frontend/src/services backend/src/main/java
rg --files frontend/src/app/admin backend/src/main/java
```

금지/주의:
- 요청 화면·메뉴가 명시됐는데 `frontend backend docs` 전체를 먼저 검색하지 않는다.
- `docs/history`, `backend/build`, `frontend/.next`, `*.tsbuildinfo`, `references`는 기본 탐색 범위에서 제외한다.
- 큰 파일은 통째로 출력하지 말고 필요한 줄만 `Grep`, `Read` 범위 지정, `Select-String`, `rg -n` 등으로 제한한다.

### 탐색 범위 규칙

1. 사용자가 화면·메뉴·파일·API를 명시한 경우, 해당 라우트/컴포넌트/서비스/Controller/Entity부터 탐색한다.
2. 좁은 탐색으로 연결 파일을 찾은 뒤, 그 연결 경로를 따라 한 단계씩 확장한다.
3. 전체 저장소 검색은 좁은 탐색이 실패했거나 공통 유틸·전역 정책 영향이 의심될 때만 수행하고, 그 이유를 작업 로그에 남긴다.
4. 전체 검색이 필요하면 `.rgignore` 또는 `--glob` 제외 규칙을 적용한다.

### 에이전트·검증 비용 규칙

- 기본은 메인 에이전트가 직접 좁게 탐색하고 구현한다. subagent는 사용자가 명시했거나, 영향 범위가 불명확한 다중 레이어·고위험 변경일 때만 사용한다.
- 5단계 풀 파이프라인과 `/feature`는 신규 API/DB/보안/공통 유틸처럼 실패 비용이 큰 작업에 적용한다. 화면과 변경 지점이 명확한 소규모 작업은 단일 흐름으로 처리한다.
- 검증 루프는 실패한 범위부터 재검증한다. 전체 빌드·전체 테스트는 마지막 확인 단계에서 1회 실행하는 것을 기본으로 한다.
- 문서만 변경한 작업은 빌드·테스트를 실행하지 않고, 문서 내용과 링크만 확인한다.

---

## Session Handoff Policy

긴 작업은 세션 종료·컨텍스트 압축·다른 AI 인계를 대비해 단계 경계마다 `docs/agent-handoff/CURRENT.md`를 갱신한다. 토큰이 거의 소진된 뒤 한 번에 정리하지 말고, 복구 가능한 작업 단위가 끝날 때마다 현재 상태를 남긴다.

`CURRENT.md`는 누적 로그가 아니라 **최신 작업 1개의 상태 스냅샷**이다. 새 작업을 시작할 때 이전 내용을 이어 붙이지 말고 현재 작업 상태로 덮어쓴다. 완료된 작업의 상세 기록은 git commit과 `docs/history/`가 담당하며, `CURRENT.md`에는 완료 커밋·검증 결과·남은 이슈만 짧게 남긴다. 장기 보관이 꼭 필요한 인계 기록만 `docs/agent-handoff/archive/` 하위로 이동한다.

### 인계 파일 작성 기준

- **Soft checkpoint:** 탐색 완료 후 구현 시작 전, 설계 승인 후 구현 시작 전, 구현 완료 후 검증 시작 전, 검증 실패 후 재수정 시작 전, 커밋 전.
- **Hard checkpoint:** 파일 5개 이상 수정, DB/API/공통 유틸 변경, subagent 또는 검증 루프 1회 이상 발생, 큰 빌드·검색 출력 발생, 사용자 요구사항 변경.
- **중단 금지 구간:** DB 마이그레이션 작성 중, 다중 파일 rename 중, 테스트 실패 수정 중, `git add`/`commit`/`push` 진행 중.

### `CURRENT.md` 필수 항목

- 현재 목표와 사용자 결정 사항
- 완료한 작업과 미완료 작업
- 수정한 파일 목록
- 실행한 검증 명령과 결과
- 실패·경고·주의사항
- 다음 세션이 바로 실행할 명령
- 건드리면 안 되는 파일 또는 기존 미추적 파일

작업이 완료되어 커밋·푸시된 경우에도 `CURRENT.md`에는 완료 커밋, 검증 결과, 남은 이슈만 간단히 남긴다. 문서만 갱신하는 작업은 빌드·테스트를 실행하지 않고 문서 내용·링크만 확인한다.

---

## Agent Role Division

5단계 파이프라인 — 분석 → 설계 → 구현 → 검증(정적) → 테스트(동적)

| 단계 | 에이전트 | 역할 | 코드 수정 |
|------|---------|------|:--------:|
| 분석 | **codebase-explorer** | 구조·패턴·사용처 탐색 | ✕ |
| 설계 | **webapp-planner** | 영향 범위·단계별 구현 계획 수립 | ✕ |
| 구현 | **webapp-developer** | FE/BE 코드 작성·히스토리 기록 | ○ |
| 검증 | **webapp-verifier** | 컨벤션·타입·누락 정적 점검 | ✕ |
| 테스트 | **webapp-tester** | 빌드·테스트·타입체크 실제 실행 | ✕ |

→ 상세 워크플로우 및 판단 기준: [`docs/claude-config/agent-roles.md`](docs/claude-config/agent-roles.md)

**자동 실행**: 사용자가 명시적으로 `/feature <요구사항>`를 요청했거나, 신규 API/DB/보안/공통 유틸처럼 실패 비용이 큰 다중 레이어 신규 기능일 때만 5단계를 자동 운영한다(설계 산출 후 승인 게이트 → 구현~테스트까지 자동, 실패 시 SendMessage로 같은 구현 에이전트에 되돌림). 정의: [`.claude/skills/feature/SKILL.md`](.claude/skills/feature/SKILL.md)

**작업 발굴**: 무엇을 할지 정하지 못했을 때 `/next [범위]` 스킬로 webapp-planner가 코드·이력 기반 후보를 우선순위와 함께 제시하고, 선택 항목을 `/feature`로 넘긴다. 정의: [`.claude/skills/next/SKILL.md`](.claude/skills/next/SKILL.md)

**핵심 규칙**
1. 탐색 범위가 3쿼리 이상이면서 대상 화면·메뉴·파일이 불명확하면 codebase-explorer에 위임한다. 대상이 명확하면 먼저 직접 좁게 탐색한다.
2. 수정 파일 3개↑ · 파일 간 의존관계 있음 · 설계 옵션 2개↑이고 영향 범위가 불명확하면 webapp-planner 사용.
3. 단순 파일 읽기(경로가 이미 알려진 경우)는 Read·Grep 직접 사용한다.
4. 작업 결과가 CLAUDE.md에 영향 시 webapp-developer가 즉시 이 파일을 업데이트한다.
5. webapp-verifier는 신규 기능·보안 변경·공통 유틸·리팩토링처럼 독립 정적 점검 가치가 큰 작업에 사용한다. 단순 문구·스타일·문서 변경은 메인 에이전트의 자체 확인으로 갈음할 수 있다.
6. 정적 검증 통과 후 webapp-tester가 빌드·타입체크·테스트를 실제 실행해 런타임 결함을 확인한다. 변경 범위에 맞는 최소 명령부터 실행하고, 전체 빌드·전체 테스트는 마지막 1회 확인을 기본으로 한다. dev 서버 가동 중이면 `npm run build`(.next 캐시 충돌) 대신 `npx tsc --noEmit`·lint 위주로 실행한다.
7. 비용 절감형 탐색·검증 규칙이 5단계 파이프라인보다 우선한다. 풀 파이프라인은 필요성이 확인된 경우에만 적용한다.

---

## AI Task Guidelines

- 타입 안전성 필수 (TypeScript strict, Java generic)
- 새 API 추가 시 Controller-Service-Repository 3레이어 모두 작성
- 보안 관련 변경(인증/인가/파일업로드) 시 `docs/security.md` 먼저 확인
- SQL 직접 작성 시 파라미터 바인딩 사용 (인라인 쿼리 금지)
- 파일 업로드: 허용 확장자 검증 + 파일명 UUID 변환 필수

---

## Skeleton UI Convention

데이터 페칭이 있는 모든 화면에 스켈레톤 UI 필수. 텍스트/스피너 단독 사용 금지.
→ 상세: [`docs/claude-config/skeleton-ui.md`](docs/claude-config/skeleton-ui.md)

모든 스켈레톤은 `src/components/ui/Skeleton.tsx`에서 import한다.

| 컴포넌트 | Props | 적합한 화면 |
|---------|-------|------------|
| `<Skeleton className />` | `className` | 인라인 shimmer (단일 요소) |
| `<TableSkeleton rows cols />` | `rows=5, cols=5` | 테이블 목록 |
| `<CardListSkeleton rows />` | `rows=6` | 카드형 목록 |
| `<ExamInfoCardSkeleton count />` | `count=4` | 상세 정보 카드 |
| `<AccordionSkeleton rows />` | `rows=6` | 아코디언 목록 |
| `<CardGridSkeleton />` | — | 카드 그리드 |
| `<DashboardSkeleton />` | — | 사용자 통계 대시보드 (요약카드 4개 + 도메인 막대 + 추이 막대 + 약점 Top5 + 퀴즈 도메인별 풀이량 막대 + 연습장 날짜별 실행량 막대) |
| `<QuizCardSkeleton />` | — | 퀴즈 플레이 화면 — 문항 카드 1개 로딩 상태 (헤더 + 진행바 + 문제 카드) |
| `<ExamTypeGridSkeleton count itemHeight />` | `count=6, itemHeight="h-14"` | 시험 유형 선택 그리드 (온보딩, 관심 시험 유형 설정 모달) |

---

## Shared Utilities

동일 로직이 2곳 이상에서 필요하면 공통 위치에 먼저 추출 후 import한다. 인라인 복붙 금지.
→ 상세: [`docs/claude-config/rich-content.md`](docs/claude-config/rich-content.md)

| 함수/컴포넌트 | 위치 | 역할 |
|-------------|------|------|
| `stripHtml(html)` | `src/lib/html.ts` | HTML → 순수 텍스트 |
| `useIsDarkMode()` | `src/lib/useIsDarkMode.ts` | 현재 다크모드 여부(html `dark` 클래스 기준, MutationObserver 반응) |
| `<RichContent html className />` | `src/components/ui/RichContent.tsx` | 에디터 HTML 렌더링 |
| `<RichTextEditor value onChange />` | `src/components/ui/RichTextEditor.tsx` | react-quill 에디터 (툴바 이미지 버튼·붙여넣기·드래그드롭 모두 서버 업로드 후 URL 삽입, base64 인라인 금지) |
| `<QuestionDetailModal question onClose />` | `src/components/ui/QuestionDetailModal.tsx` | 문항 상세 모달 |
| `<ConceptNoteModal defaultTitle existingNote link onClose onSaved />` | `src/components/ui/ConceptNoteModal.tsx` | 문항별 개념노트 작성/수정 모달 (시험=questionId·퀴즈=questionBankId 공용) |
| `<PermissionDeniedModal />` | `src/components/ui/PermissionDeniedModal.tsx` | 권한 없음 팝업 |
| `<TableSkeleton />` 외 | `src/components/ui/Skeleton.tsx` | 스켈레톤 UI 모음 |
| `<QuestionAnalysisPanel content onApply questionType code language />` | `src/components/ui/QuestionAnalysisPanel.tsx` | 문항 AI 키워드·도메인 추출 + 태그 저장 + 문제 재구성 패널 (CODE 유형은 code+answer 함께 재생성, onApply({content, code?, answer?}) 콜백) |
| `<ExamResultDisplay result examinationTitle onBack backLabel showSavedBanner />` | `src/components/ui/ExamResultDisplay.tsx` | 시험 결과 렌더(점수카드·전체/오답필터·아코디언) 공용 |
| `<LinkedQuestionBox note />` | `src/components/ui/LinkedQuestionBox.tsx` | 개념노트에 연결된 시험·퀴즈 문제 박스 (내 노트 상세 + 공개 탐색 상세 공용) |
| `<CodeBlock code language size showHeader className />` | `src/components/ui/CodeBlock.tsx` | 구문강조 코드 블록 (Darcula 다크 고정, react-syntax-highlighter Light 빌드) |
| `<CodeAnswerInput value onChange disabled placeholder onCtrlEnter rows />` | `src/components/ui/CodeAnswerInput.tsx` | CODE 유형 멀티라인 monospace 답안 입력 (Tab 들여쓰기·Ctrl+Enter 제출) |
| `<ColResizeHandle onMouseDown />` | `src/components/ui/ColResizeHandle.tsx` | th 내부 드래그 리사이즈 핸들(얇은 선+8px 히트영역) 캡슐화 |
| `<AlertModal open message title confirmLabel onClose />` | `src/components/ui/AlertModal.tsx` | 범용 알림 팝업(확인 버튼, ESC·오버레이 클릭으로 닫힘) |
| `useColumnResize(storageKey, defaultWidths)` | `src/lib/useColumnResize.ts` | 테이블 컬럼 드래그 리사이즈 훅 — widths 배열 + startResize 핸들러 반환, localStorage 영속 |
| `<SchedulingProblemTable data className />` | `src/components/ui/SchedulingProblemTable.tsx` | CPU 스케줄링 구조화 문항(SCHEDULING 유형) 표시용 표 — 알고리즘·타임퀀텀 배지 + 프로세스 표 |
| `<SchedulingProblemEditor value onChange />` | `src/components/ui/SchedulingProblemEditor.tsx` | 스케줄링 문항 등록/수정 에디터 — 알고리즘 select·타임퀀텀·프로세스 행 추가/삭제 |
| `emptySchedulingDraft`/`toSchedulingDataPayload`/`fromSchedulingData` 등 | `src/lib/scheduling.ts` | 스케줄링 문항 등록/수정 폼 공용 헬퍼 (Draft ↔ SchedulingData 변환) |
| `<SqlProblemView data className />` | `src/components/ui/SqlProblemView.tsx` | SQL 구조화 문항(SQL 유형) 표시용 뷰 — 표/스키마(DDL) 토글, PK 배지 |
| `<SqlProblemEditor value onChange />` | `src/components/ui/SqlProblemEditor.tsx` | SQL 문항 등록/수정 에디터 — 테이블 카드 반복(테이블명·컬럼 편집·샘플 데이터 행 추가/삭제) |
| `emptySqlDraft`/`toSqlDataPayload`/`fromSqlData` 등 | `src/lib/sql.ts` | SQL 문항 등록/수정 폼 공용 헬퍼 (Draft ↔ SqlData 변환) |
| `<Pagination page totalPages onChange className />` | `src/components/ui/Pagination.tsx` | 관리자 목록 표 공용 페이지네이션(0-based) — 첫/마지막 고정 + 현재 ±2 윈도우 + 생략부호(…), 화살표·번호 버튼 다크모드 대응 |
| `<ScratchPadPanel storageKey isCodeQuestion className />` | `src/components/ui/ScratchPadPanel.tsx` | 풀이 화면 FAB+드로어/바텀시트 스크래치패드(자유메모·CODE 트레이싱·페이지 부재 풀이 도구·스케줄링(간트 차트) 풀이 도구·트리 시각화·안전 계산기), localStorage 영속. 코드 트레이싱 탭은 "타이핑→자동 렌더" 표기법 방식(traceNotation). 데스크톱 드로어는 왼쪽 가장자리 드래그로 폭 리사이즈 가능(300~720px, localStorage 키 `tpmp:scratchpad:panel-width` 영속) |
| `<PageReplacementTool value onChange />`, `type PageReplacementData`, `parseRefTokens`, `isPageReplacementData` | `src/components/ui/PageReplacementTool.tsx` | 페이지 부재(페이지 교체) 손입력 풀이 도구 — 참조열/프레임 수로 표 골격만 생성, FIFO/LRU/Optimal 자동 계산·채점 없음. 참조열/프레임 수 변경 시 그리드 자동 리사이즈(기존 입력값 최대한 보존) |
| `<SchedulingSolveTool value onChange />`, `type SchedulingSolveData`, `isSchedulingSolveData` | `src/components/ui/SchedulingSolveTool.tsx` | 손입력 간트 차트 스케줄링 풀이 도구(풀이 스크래치패드 전용) — 프로세스 표+총 시간으로 타임 슬롯·결과 표 골격 생성, FIFO/SJF/RR/Priority 등 알고리즘 자동 계산·채점 없음(반환/대기시간 평균만 자동). 문항 등록/표시용 `SchedulingProblemEditor`/`SchedulingProblemTable`과는 별개 |
| `<BinaryTreeTool value onChange />`, `type TreeNode`, `parseLevelOrderTree`, `MAX_TREE_NODES` | `src/components/ui/BinaryTreeTool.tsx` | 이진트리 시각화 도구 — 레벨오더 배열 표기(`[1, 2, 3, null, 4, 5]`)를 LeetCode 표준 BFS 규칙으로 역직렬화 후 SVG로 자동 렌더(in-order x·깊이 y 좌표). 순수 시각화(채점/코드실행 없음), 노드 200개 상한 |
| `evaluateExpression(expr)` | `src/lib/safeMathCalc.ts` | 안전한 사칙연산 수식 평가(eval/Function 미사용) |
| `parseTraceLines(text)`, `type TraceLine` | `src/lib/traceNotation.ts` | 코드 트레이싱 표기법(`name = value`/`name: type = value`/`name = [a,b]`/`name = [[1,2],[3,4]]`) 순수 파서 — eval/Function/JSON.parse 미사용, 실패 시 text로 안전 폴백. 값 기반 타입 자동추론 + `: type` 명시 오버라이드(typeLabel/typeSource). **변수 참조 사칙연산 자동 계산**(`evaluateExpression` 재사용)을 픽스포인트 다중 패스로 지원 — (1) 식별자 없는 순수 리터럴 수식도 계산(`av = 10 / 4` → 2.5, 단 날짜·버전·전화번호형 압축 나열(`2024-01-01` 등)은 가드로 제외), (2) 변수 정의가 참조보다 아래 줄에 있어도(순서 무관) 계산. 같은 이름 재대입 시 텍스트상 마지막 리터럴이 최종값. 미정의 참조·순환·계산 오류는 문자열로 안전 폴백, 결과는 `VarLine.sourceExpr`+`value`. **`=` 없이 수식만 적은 줄도 계산**(예: `av / len` → `ExprLine`, 이름 없음·env 미등록) — 사칙연산자 최소 1개 포함 + 화이트리스트 통과 + 참조 식별자가 named 변수 픽스포인트 종료 후 최종 env에 전부 존재해야 계산, 그 외(단어 하나·단일 식별자·자유 문장·미정의 참조)는 text로 폴백. 레거시 traceBlocks 이관용 `sanitizeLegacyTraceBlocks`·`legacyTraceBlocksToNotation`도 포함 |
| `<TracePreview lines />` | `src/components/ui/TracePreview.tsx` | traceNotation 파싱 결과(변수 행·1D 배열·2D 배열·자유 텍스트·이름 없는 수식)를 실시간 렌더 + 타입 배지(explicit/inferred 시각 구분) + 자동 계산된 변수는 `이름 = 수식 = 결과` 형태로 원본 수식도 함께 표시하는 읽기 전용 프리뷰. 이름 없는 수식 줄(`kind: 'expr'`)은 `수식 = 결과` + 타입 배지만 표시(이름 칩 없음) |
| `<CodeLanguageModal open onClose onSelect />` | `src/components/ui/CodeLanguageModal.tsx` | 데일리 퀴즈에서 CODE(프로그래밍 언어) 카테고리 선택 시 Java/Python/C/전체 중 언어를 고르는 모달(AlertModal 패턴 준용, ESC·오버레이 클릭 닫기). `onSelect(language?: string)` — "전체" 선택 시 `undefined` 전달 |
| `hasOptions(options)` | `src/lib/answer.ts` | 문항 보기(options) 존재 여부 판정 — trim 후 비어있지 않은 요소 1개 이상이면 true(`['','','','']`→false). 보기가 있으면 유형과 무관하게 "빈칸 순서대로" 채점(백엔드 `AnswerGrader.isCorrect(type, correct, user, options)` 4-인자 오버로드와 동일 기준) — 정답·사용자 답안을 콤마/슬래시로 분리해 순서 보존 비교, 토큰 수 불일치 시 오답, 번호↔보기 텍스트 상호 인정, 같은 번호 중복 지정 허용, 부분 점수 없음. MULTIPLE_CHOICE의 기존 클릭 선택 UI는 그대로 유지 |
| `slotsToAnswer(slots)` / `parseAnswerToSlots(answer, options)` | `src/lib/answer.ts` | 정답 슬롯(빈칸 순서대로 1-based 보기 번호 배열) ↔ answer 저장 문자열 상호 변환. `parseAnswerToSlots`는 매칭 실패·빈 문자열이면 null(호출부는 원문 텍스트 입력으로 폴백). 정규화 규칙은 백엔드 `AnswerGrader`의 options 채점 로직과 반드시 동일하게 유지 |

새 유틸 함수는 `src/lib/`에, 새 UI 컴포넌트는 `src/components/ui/`에 추가하고 위 표를 즉시 갱신한다.

---

## Modification History Policy

코드 수정마다 히스토리 파일 자동 작성. 사용자가 요청하지 않아도 항상 작성한다.
→ 상세 템플릿·규칙: [`docs/claude-config/history-policy.md`](docs/claude-config/history-policy.md)

| 범위 | 저장 경로 |
|------|-----------|
| 사용자 프론트엔드 | `docs/history/front/usr/` |
| 사용자 백엔드 | `docs/history/back/usr/` |
| 관리자 프론트엔드 | `docs/history/front/adm/` |
| 관리자 백엔드 | `docs/history/back/adm/` |

- 파일명: `{MenuName}_Modified.md` · 최신 항목을 파일 상단에 누적 추가
- ID: `HIST-{YYYYMMDD}-{3자리 순번}` · **파일별 채번** — 해당 파일 내 같은 날짜 최대 순번 + 1 (전역 아님; 같은 날 다른 파일이 같은 순번을 가질 수 있음). 기존 항목은 덮어쓰지 말고 맨 위에 추가만 한다. → [`docs/claude-config/history-policy.md`](docs/claude-config/history-policy.md)
