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
1. 탐색 범위가 3쿼리 이상이면 codebase-explorer로 위임한다.
2. 수정 파일 3개↑ · 파일 간 의존관계 있음 · 설계 옵션 2개↑ → webapp-planner로 계획을 먼저 수립한다.
3. 단순 파일 읽기(경로가 이미 알려진 경우)·신규 파일 1개 추가는 바로 구현한다.
4. **webapp-developer만 코드를 수정한다.** 검증·테스트에서 받은 문제 항목은 webapp-developer가 재구현한다.
5. AGENTS.md에 영향을 주는 변경(새 유틸·스켈레톤 추가 등) 시 webapp-developer가 이 파일을 즉시 업데이트한다.

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
| `<RichContent html className />` | `src/components/ui/RichContent.tsx` | 에디터 HTML 렌더링 |
| `<RichTextEditor value onChange />` | `src/components/ui/RichTextEditor.tsx` | react-quill 에디터 |
| `<QuestionDetailModal question onClose />` | `src/components/ui/QuestionDetailModal.tsx` | 문항 상세 모달 |
| `<PermissionDeniedModal />` | `src/components/ui/PermissionDeniedModal.tsx` | 권한 없음 팝업 |
| `<TableSkeleton />` 외 | `src/components/ui/Skeleton.tsx` | 스켈레톤 UI 모음 |
| `<QuestionAnalysisPanel content />` | `src/components/ui/QuestionAnalysisPanel.tsx` | 문항 AI 키워드·도메인 추출 패널 |

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
- ID: `HIST-{YYYYMMDD}-{3자리 순번}` (당일 최대 순번 + 1)
