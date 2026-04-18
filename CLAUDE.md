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
