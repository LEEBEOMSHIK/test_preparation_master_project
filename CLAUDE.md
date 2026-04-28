# CLAUDE.md — AI Development Guide

이 파일은 Claude Code(AI)가 이 프로젝트를 이해하고 일관되게 기여하기 위한 핵심 가이드입니다.

---

## Project Overview

**Test Preparation Master Project (TPMP)**는 시험 준비와 개념 정리를 위한 웹 서비스입니다.  
상세 내용은 [`docs/project-overview.md`](docs/project-overview.md)를 참조하세요.

---

## Repository Structure

```
frontend/   → Next.js 14 + React Native Web (TypeScript)
backend/    → Spring Boot 3 + Java 17 + Gradle
docs/       → 설계 문서
nginx/      → Reverse proxy
docker-compose.yml
```

---

## Key Conventions

### Frontend
- 언어: TypeScript (strict mode)
- 스타일: Tailwind CSS + `react-native-web` 기반 컴포넌트
- 상태관리: Zustand
- API 클라이언트: axios (services/ 레이어)
- 컴포넌트: `src/components/` — React Native Web 호환 (View, Text, TouchableOpacity 등)
- 페이지: `src/app/` — Next.js App Router
- 반응형: 모바일 우선 (min-width breakpoints)

### Backend
- 패키지 구조: `com.tpmp.testprep`
- 레이어: Controller → Service → Repository → Entity
- DTO: 요청/응답 분리 (`dto/request/`, `dto/response/`)
- 인증: JWT (Access Token 15분, Refresh Token 7일)
- 예외: `@ControllerAdvice` + 커스텀 `ErrorCode` enum
- 응답 포맷: `ApiResponse<T>` 래퍼 클래스 통일

### Database
- DBMS: PostgreSQL 15
- ORM: JPA/Hibernate (ddl-auto: validate in prod, update in dev)
- 마이그레이션: Flyway (향후 도입 예정)
- 네이밍: snake_case (테이블/컬럼)

---

## Development Workflow

1. 기능 브랜치: `feature/{scope}-{short-description}` (예: `feature/backend-exam-upload`)
2. 커밋 메시지: `[FE|BE|INFRA] type: subject` (예: `[BE] feat: 시험 파일 업로드 API 추가`)
3. PR: main 브랜치로 머지, 리뷰 1인 이상 필요

---

## What to Read First

- [`docs/project-overview.md`](docs/project-overview.md) — 도메인 모델, 기능 요구사항
- [`docs/code-guidelines.md`](docs/code-guidelines.md) — 코딩 컨벤션 상세
- [`docs/security.md`](docs/security.md) — 보안 정책
- [`docs/style-guidelines.md`](docs/style-guidelines.md) — UI/UX 가이드

---

## AI Task Guidelines

- 코드 생성 시 항상 타입 안전성 확보 (TypeScript strict, Java generic)
- 새 API 추가 시 Controller-Service-Repository 3레이어 모두 작성
- 보안 관련 변경(인증/인가/파일업로드)은 `docs/security.md` 먼저 확인
- 테스트 코드는 새 서비스 메서드에 반드시 포함 (JUnit5, Jest)
- SQL 직접 작성 시 파라미터 바인딩 사용 (SQL Injection 방지)
- 파일 업로드: 허용 확장자 검증, 파일명 UUID 변환 필수

---

## Skeleton UI Convention

**데이터 페칭이 있는 모든 화면은 반드시 스켈레톤 UI를 구현한다.**  
텍스트("불러오는 중...") 또는 스피너(`animate-spin`)를 단독으로 사용하지 않는다.

### 사용 가능한 컴포넌트

모든 스켈레톤은 `src/components/ui/Skeleton.tsx`에서 import한다.

| 컴포넌트 | Props | 적합한 화면 |
|---------|-------|------------|
| `<Skeleton className="..." />` | `className` | 인라인 커스텀 shimmer (단일 요소) |
| `<TableSkeleton rows={N} cols={N} />` | `rows=5`, `cols=5` | 테이블 목록 (관리자/사용자 테이블 페이지) |
| `<CardListSkeleton rows={N} />` | `rows=6` | 카드형 목록 (시험 목록, 개념노트 등) |
| `<ExamInfoCardSkeleton count={N} />` | `count=4` | 상세 정보 카드 (user/exam-info 패턴) |
| `<AccordionSkeleton rows={N} />` | `rows=6` | 아코디언 목록 (FAQ) |
| `<CardGridSkeleton />` | 없음 | 카드 그리드 (퀴즈 카테고리, 도메인 선택) |

### 구현 패턴

```tsx
import { TableSkeleton } from '@/components/ui/Skeleton';

// ✅ 올바른 패턴 — 테이블 페이지
<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
  {loading ? (
    <TableSkeleton rows={5} cols={5} />
  ) : data.length === 0 ? (
    <EmptyState />
  ) : (
    <table>...</table>
  )}
</div>

// ✅ 올바른 패턴 — 카드 목록 페이지
{loading ? (
  <CardListSkeleton rows={6} />
) : items.length === 0 ? (
  <EmptyState />
) : (
  <div className="grid gap-3">...</div>
)}

// ❌ 금지 — 텍스트/스피너만 사용
{loading && <div className="text-center text-gray-400">불러오는 중...</div>}
{loading && <div className="animate-spin ..." />}
```

### 새 화면 추가 시 체크리스트

- `useState(true)` — 초기 `loading` 상태를 `true`로 설정
- `finally(() => setLoading(false))` — fetch 완료 후 반드시 해제
- 데이터 구조에 맞는 Skeleton 컴포넌트 사용 (없으면 `Skeleton` atom 조합)
- 빈 상태(empty state) 별도 처리 (`loading === false && data.length === 0`)
- 기존 컴포넌트로 표현 불가한 새 레이아웃은 `Skeleton.tsx`에 신규 컴포넌트 추가 후 문서화

### 신규 Skeleton 컴포넌트 추가 방법

`Skeleton.tsx`에 named export로 추가하고, 이 파일(CLAUDE.md)의 컴포넌트 표에 행을 추가한다.

```tsx
// src/components/ui/Skeleton.tsx 에 추가
export function MyNewSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="...">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
```

---

## Modification History Policy

**코드 수정이 발생할 때마다 반드시 히스토리 파일을 생성/갱신한다.**

### 저장 경로 (수정 범위에 따라 구분)

| 범위 | 저장 경로 |
|------|-----------|
| 사용자 프론트엔드 | `docs/history/front/usr/` |
| 사용자 백엔드 | `docs/history/back/usr/` |
| 관리자 프론트엔드 | `docs/history/front/adm/` |
| 관리자 백엔드 | `docs/history/back/adm/` |

하나의 수정이 여러 범위에 걸칠 경우 각 해당 경로에 모두 기록한다.

### 파일명 규칙

```
{MenuName}_Modified.md
```

예: `ExamList_Modified.md`, `Login_Modified.md`, `AdminExamCreate_Modified.md`  
같은 메뉴의 히스토리는 하나의 파일에 누적 추가한다(최신 항목을 파일 상단에).

### 히스토리 ID 규칙

```
HIST-{YYYYMMDD}-{3자리 순번}
```

예: `HIST-20260418-001`  
같은 날 첫 번째 수정부터 001, 002, ... 순으로 증가. 파일 내 기존 항목을 보고 당일 최대 순번 + 1 을 사용한다.

### 히스토리 파일 템플릿

```markdown
## HIST-YYYYMMDD-NNN

- **날짜**: YYYY-MM-DD
- **수정 범위**: (예: 관리자 백엔드 / 시험 관리)
- **수정 개요**: 한 줄 요약

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| path/to/File.java | 추가/수정/삭제 | 변경 내용 요약 |

### 수정 상세

#### `path/to/File.java`
- 변경 전: (핵심 코드 또는 상태 요약)
- 변경 후: (핵심 코드 또는 상태 요약)
- 이유: 변경 이유

### 복원 방법

이 ID(HIST-YYYYMMDD-NNN)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다.
```

### AI 행동 규칙

1. 코드를 수정하기 **전에** 해당 메뉴/범위를 파악한다.
2. 수정 완료 **후** 즉시 히스토리 파일을 생성 또는 갱신한다.
3. 히스토리 파일은 사용자가 별도로 요청하지 않아도 **자동으로** 작성한다.
4. 복원 요청 시 히스토리 ID를 기준으로 "변경 전" 내용을 찾아 되돌린다.
