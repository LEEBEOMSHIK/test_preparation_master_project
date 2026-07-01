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

**자동 실행**: 다중 레이어 신규 기능은 `/feature <요구사항>` 스킬로 5단계를 자동 운영한다(설계 산출 후 승인 게이트 → 구현~테스트까지 자동, 실패 시 SendMessage로 같은 구현 에이전트에 되돌림). 정의: [`.claude/skills/feature/SKILL.md`](.claude/skills/feature/SKILL.md)

**작업 발굴**: 무엇을 할지 정하지 못했을 때 `/next [범위]` 스킬로 webapp-planner가 코드·이력 기반 후보를 우선순위와 함께 제시하고, 선택 항목을 `/feature`로 넘긴다. 정의: [`.claude/skills/next/SKILL.md`](.claude/skills/next/SKILL.md)

**핵심 규칙**
1. 탐색 범위가 3쿼리 이상이면 codebase-explorer에 위임한다.
2. 수정 파일 3개↑ · 파일 간 의존관계 있음 · 설계 옵션 2개↑ → webapp-planner 사용.
3. 단순 파일 읽기(경로가 이미 알려진 경우)는 Read·Grep 직접 사용한다.
4. 작업 결과가 CLAUDE.md에 영향 시 webapp-developer가 즉시 이 파일을 업데이트한다.
5. 신규 기능 구현·보안 변경·리팩토링 완료 후 webapp-verifier가 컨벤션·타입·히스토리를 정적 점검한다.
6. 정적 검증 통과 후 webapp-tester가 빌드·테스트·타입체크를 실제 실행해 런타임 결함을 확인한다.

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
| `<RichTextEditor value onChange />` | `src/components/ui/RichTextEditor.tsx` | react-quill 에디터 |
| `<QuestionDetailModal question onClose />` | `src/components/ui/QuestionDetailModal.tsx` | 문항 상세 모달 |
| `<ConceptNoteModal defaultTitle existingNote link onClose onSaved />` | `src/components/ui/ConceptNoteModal.tsx` | 문항별 개념노트 작성/수정 모달 (시험=questionId·퀴즈=questionBankId 공용) |
| `<PermissionDeniedModal />` | `src/components/ui/PermissionDeniedModal.tsx` | 권한 없음 팝업 |
| `<TableSkeleton />` 외 | `src/components/ui/Skeleton.tsx` | 스켈레톤 UI 모음 |
| `<QuestionAnalysisPanel content onApply questionType code language />` | `src/components/ui/QuestionAnalysisPanel.tsx` | 문항 AI 키워드·도메인 추출 + 태그 저장 + 문제 재구성 패널 (CODE 유형은 code+answer 함께 재생성, onApply({content, code?, answer?}) 콜백) |
| `<ExamResultDisplay result examinationTitle onBack backLabel showSavedBanner />` | `src/components/ui/ExamResultDisplay.tsx` | 시험 결과 렌더(점수카드·전체/오답필터·아코디언) 공용 |
| `<LinkedQuestionBox note />` | `src/components/ui/LinkedQuestionBox.tsx` | 개념노트에 연결된 시험·퀴즈 문제 박스 (내 노트 상세 + 공개 탐색 상세 공용) |
| `<CodeBlock code language size showHeader className />` | `src/components/ui/CodeBlock.tsx` | 구문강조 코드 블록 (Darcula 다크 고정, react-syntax-highlighter Light 빌드) |
| `<CodeAnswerInput value onChange disabled placeholder onCtrlEnter rows />` | `src/components/ui/CodeAnswerInput.tsx` | CODE 유형 멀티라인 monospace 답안 입력 (Tab 들여쓰기·Ctrl+Enter 제출) |
| `<AlertModal open message title confirmLabel onClose />` | `src/components/ui/AlertModal.tsx` | 범용 알림 팝업(확인 버튼, ESC·오버레이 클릭으로 닫힘) |

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
