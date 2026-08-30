# AGENTS.md — AI Development Guide

이 파일은 AI 코딩 에이전트(Codex 등)가 이 프로젝트를 이해하고 일관되게 기여하기 위한 핵심 가이드입니다.

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
- 큰 파일은 통째로 출력하지 말고 필요한 줄만 `Select-String`, `rg -n`, `Get-Content -TotalCount` 등으로 제한한다.

### 탐색 범위 규칙

1. 사용자가 화면·메뉴·파일·API를 명시한 경우, 해당 라우트/컴포넌트/서비스/Controller/Entity부터 탐색한다.
2. 좁은 탐색으로 연결 파일을 찾은 뒤, 그 연결 경로를 따라 한 단계씩 확장한다.
3. 전체 저장소 검색은 좁은 탐색이 실패했거나 공통 유틸·전역 정책 영향이 의심될 때만 수행하고, 그 이유를 작업 로그에 남긴다.
4. 전체 검색이 필요하면 `.rgignore` 또는 `--glob` 제외 규칙을 적용한다.

### 에이전트·검증 비용 규칙

- 기본은 메인 에이전트가 직접 좁게 탐색하고 구현한다. subagent는 사용자가 명시했거나, 영향 범위가 불명확한 다중 레이어·고위험 변경일 때만 사용한다.
- 5단계 풀 파이프라인은 신규 API/DB/보안/공통 유틸처럼 실패 비용이 큰 작업에 적용한다. 화면과 변경 지점이 명확한 소규모 작업은 단일 흐름으로 처리한다.
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

## Agent Pipeline — 5단계

작업은 **분석 → 설계 → 구현 → 검증(정적) → 테스트(동적)** 5단계 파이프라인으로 진행한다.
각 단계의 에이전트 정의는 `.codex/agents/{name}.toml`에 있다.

| 단계 | 에이전트 | 역할 | 코드 수정 |
|------|---------|------|:--------:|
| 분석 | **codebase-explorer** | 구조·패턴·사용처 탐색 | ✕ |
| 설계 | **webapp-planner** | 영향 범위·단계별 구현 계획 수립 | ✕ |
| 구현 | **webapp-developer** | FE/BE 코드 작성·히스토리 기록 | ○ |
| 검증 | **webapp-verifier** | 컨벤션·타입·누락 정적 점검 | ✕ |
| 테스트 | **webapp-tester** | 빌드·테스트·타입체크 실제 실행 | ✕ |

**핵심 규칙**
1. 탐색 범위가 3쿼리 이상이면서 대상 화면·메뉴·파일이 불명확하면 codebase-explorer로 위임한다. 대상이 명확하면 먼저 직접 좁게 탐색한다.
2. 수정 파일 3개↑ · 파일 간 의존관계 있음 · 설계 옵션 2개↑이고 영향 범위가 불명확하면 webapp-planner로 계획을 먼저 수립한다.
3. 단순 파일 읽기(경로가 이미 알려진 경우)·신규 파일 1개 추가는 바로 구현한다.
4. **webapp-developer만 코드를 수정한다.** 검증·테스트에서 받은 문제 항목은 webapp-developer가 재구현한다.
5. AGENTS.md에 영향을 주는 변경(새 유틸·스켈레톤 추가 등) 시 webapp-developer가 이 파일을 즉시 업데이트한다.
6. 비용 절감형 탐색·검증 규칙이 5단계 파이프라인보다 우선한다. 풀 파이프라인은 필요성이 확인된 경우에만 적용한다.

**구현 시 준수 사항**
- TypeScript strict · Tailwind · Controller-Service-Repository 3레이어 컨벤션 준수
- 수정 완료 후 히스토리 파일 자동 작성 (아래 Modification History Policy 참조)

**검증 단계 — webapp-verifier (정적, 신규 기능·보안 변경·리팩토링 후 필수)**

구현 완료 후 코드를 *읽어서* 독립 점검한다. 코드를 수정하지 않으며, 문제 발견 시 항목·위치를 보고하고 구현 단계로 되돌린다.

| 검증 항목 | 확인 방법 |
|----------|----------|
| TypeScript strict 오류 | import 경로·타입 선언·`any` 사용 여부 |
| Java 타입 안전성 | 제네릭 누락·raw type 여부 |
| 스켈레톤 UI 누락 | 데이터 페칭 화면에 Skeleton 컴포넌트 적용 여부 |
| 공통 유틸 미사용 | `dangerouslySetInnerHTML` 직접 사용, 인라인 replace 여부 |
| 히스토리 파일 | `docs/history/` 내 해당 HIST ID 존재 여부 |
| API 3레이어 완결 | Controller·Service·Repository 모두 작성 여부 |
| 보안 정책 준수 | 파일 업로드 확장자 검증·UUID 변환 여부 |

**테스트 단계 — webapp-tester (동적, 신규 API/페이지·공통 자산 변경 후 필수)**

정적 검증 통과 후 코드를 *실행해서* 점검한다. 빌드·테스트·타입체크를 실제로 돌려 런타임 결함을 잡는다. 코드를 수정하지 않으며, 실패 시 로그와 함께 webapp-developer에 재구현을 요청한다.

| 대상 | 명령 |
|------|------|
| BE 컴파일·테스트 | `cd backend; ./gradlew test` |
| FE 타입체크 | `cd frontend; npx tsc --noEmit` |
| FE 빌드 | `cd frontend; npm run build` |
| FE 테스트 | `cd frontend; npm test -- --watch=false` |

> 빌드·테스트·타입체크 등 검증 성격 명령만 실행한다. 배포·DB파괴·`git push`는 실행하지 않는다.
> 변경 범위에 맞는 최소 명령부터 실행하고, 전체 빌드·전체 테스트는 마지막 1회 확인을 기본으로 한다.

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

---

## Shared Utilities

동일 로직이 2곳 이상에서 필요하면 공통 위치에 먼저 추출 후 import한다. 인라인 복붙 금지.
→ 상세: [`docs/claude-config/rich-content.md`](docs/claude-config/rich-content.md)

| 함수/컴포넌트 | 위치 | 역할 |
|-------------|------|------|
| `stripHtml(html)` | `src/lib/html.ts` | HTML → 순수 텍스트 |
| `extractApiErrorMessage(err, fallback)` / `ApiApplicationError` | `frontend/src/lib/apiError.ts` | Axios 백엔드 `error.message`와 명시적 `success=false` 앱 오류 메시지만 보존하고, 네트워크·임의 오류는 사용자용 `fallback` 사용 |
| `normalizeInquiryMenuNames(menus)` | `src/lib/menu.ts` | API·fallback 메뉴 트리의 문의·요청 표시명을 URL 기준으로 재귀 정규화 |
| `isBlankOrPositiveIntegerText(value)` / `toOptionalPositiveInteger(value)` | `src/lib/questionNumber.ts` | 선택 양의 정수 입력 검증·payload 숫자 변환 |
| `compareQuestionSourceOrder(a, b)` | `src/lib/questionSort.ts` | 문항관리 출처순 정렬(연도 DESC, 회차 ASC, 문항번호 ASC, 수정일 DESC) |
| `<RichContent html className />` | `src/components/ui/RichContent.tsx` | 에디터 HTML 렌더링 |
| `<RichTextEditor value onChange />` | `src/components/ui/RichTextEditor.tsx` | react-quill 에디터 |
| `<QuestionDetailModal question onClose hideEditLink hideAnswerInitially />` | `src/components/ui/QuestionDetailModal.tsx` | 문항 상세 모달 (`hideAnswerInitially`=true면 정답·해설을 "정답 보기" 버튼으로 가림, 기본 false) |
| `<PermissionDeniedModal />` | `src/components/ui/PermissionDeniedModal.tsx` | 권한 없음 팝업 |
| `<TableSkeleton />` 외 | `src/components/ui/Skeleton.tsx` | 스켈레톤 UI 모음 |
| `<QuestionAnalysisPanel content />` | `src/components/ui/QuestionAnalysisPanel.tsx` | 문항 AI 키워드·도메인 추출 패널 |
| `<ScratchPadPanel storageKey isCodeQuestion className />` | `src/components/ui/ScratchPadPanel.tsx` | 풀이·개념노트 상세 화면 FAB+드로어/바텀시트 스크래치패드(자유메모·CODE 트레이싱·페이지 부재 풀이 도구·스케줄링(간트 차트) 풀이 도구·트리 시각화·안전 계산기), localStorage 영속 |
| `evaluateExpression(expr)` | `src/lib/safeMathCalc.ts` | 안전한 산술·비트 수식 평가(eval/Function 미사용). 10진/2진(`0b`)/8진(`0o`)/16진(`0x`) 숫자와 `+ - * / % **`, `& \| ^ ~ << >> >>>` 지원. 비트 연산은 32비트 정수 기준. **안전한 정수 결과는 계산 방식과 무관하게 2·8·16진수 변환값**(`bitwise.binary`/`bitwise.octal`/`bitwise.hex`)을 함께 반환 — 0 이상 정수는 항상 포함, 음수 정수는 비트 문맥(비트 연산자·0b/0o/0x 리터럴 사용)일 때만 32비트 2의 보수로 포함, `Number.MAX_SAFE_INTEGER` 초과는 미포함 |
| `parseTraceLines(text)`, `type TraceLine` | `src/lib/traceNotation.ts` | 코드 트레이싱 표기법(`name = value`/`name: type = value`/배열 표기) 순수 파서 — eval/Function/JSON.parse 미사용, 실패 시 text로 안전 폴백. 변수 참조 산술·비트 수식 자동 계산(`evaluateExpression` 재사용)을 지원하며, `mask = 0b1010 & 3`, `mask << 1` 같은 비트 수식도 계산 |
| `<TracePreview lines />` | `src/components/ui/TracePreview.tsx` | `traceNotation` 파싱 결과(변수 행·1D 배열·2D 배열·자유 텍스트·이름 없는 수식)를 실시간 렌더하는 읽기 전용 프리뷰 |
| `<CodeLanguageModal open onClose showLanguage showSource onSelect />` | `src/components/ui/CodeLanguageModal.tsx` | 데일리 퀴즈 카테고리 선택 시 언어(Java/Python/C)·출처(기출/AI 커스텀) 필터 선택 모달 |
| `isInquiryClosed`, `requiresTargetArea`, `usesTargetArea`, `getAllowedAdminStatuses`, `isInquiryRequestType`, `isInquiryTargetArea`, `getInquiryTargetAreaLabel` | `frontend/src/lib/inquiry.ts` | 문의·요청 유형별 종료 상태, 발생 영역 규칙, 도메인 enum 좁히기·제품 표시명 변환 |
| `<InquiryTimeline inquiry />` | `frontend/src/components/ui/InquiryTimeline.tsx` | 최초 접수와 후속 메시지를 시간순으로 표시하는 대화 타임라인 |
| `<InquiryMessageComposer inquiryId onSent admin />` | `frontend/src/components/ui/InquiryMessageComposer.tsx` | 문의·요청 후속 메시지 및 이미지 첨부 작성기 |
| `<InquiryImageUploader uploadImage onChange onUploadingChange />` | `frontend/src/components/ui/InquiryImageUploader.tsx` | 최초 문의·후속 메시지 공용 이미지 드롭존 — 다중 선택/drag&drop, 3장·10MB·형식 사전 검증, 썸네일·상태·개별 삭제 제공 |
| `loadInquiryDomainOptions(code, isAllowed, fallback)` | `frontend/src/lib/inquiryDomain.ts` | 문의 유형·발생 영역 도메인을 허용 enum으로 좁히고 API 실패 시 fallback 반환 |

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
- ID: `HIST-{YYYYMMDD}-{3자리 순번}` · **파일별 채번** — 해당 파일 내 같은 날짜 최대 순번 + 1 (전역 아님; 같은 날 다른 파일이 같은 순번을 가질 수 있음). 기존 항목은 덮어쓰지 말고 맨 위에 추가만 한다.
