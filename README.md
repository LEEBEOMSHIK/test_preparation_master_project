# Test Preparation Master Project (TPMP)

시험 준비 및 개념 정리를 위한 웹 서비스 (향후 모바일 앱 확장 예정)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + React Native Web |
| Backend | Java 17, Spring Boot 3.x, Gradle |
| Database | PostgreSQL 15 |
| Infrastructure | Docker, Docker Compose |
| Auth | JWT (Access + Refresh Token) |
| File Upload | PDF, HWP (multipart/form-data) |

> **React Native + Next.js 호환성**: `react-native-web`을 통해 React Native 컴포넌트를 웹에서 렌더링합니다.  
> 향후 Expo 기반 앱으로 확장 시 `src/components`, `src/hooks`, `src/services` 코드를 재사용할 수 있습니다.

---

## Project Structure

```
test_preparation_master_project/
├── frontend/                         # Next.js + React Native Web
│   ├── src/
│   │   ├── app/                      # Next.js App Router (pages)
│   │   │   ├── layout.tsx            # Root layout
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── auth/                 # 로그인 / 회원가입
│   │   │   │   ├── login/
│   │   │   │   └── signup/
│   │   │   ├── user/                 # 사용자 영역
│   │   │   │   ├── exams/            # 시험 목록 / 응시
│   │   │   │   ├── concepts/         # 개념 요약 등록 / 조회
│   │   │   │   └── inquiries/        # 1:1 문의
│   │   │   └── admin/                # 관리자 영역
│   │   │       ├── exams/            # 시험 등록 / 관리
│   │   │       ├── concepts/         # 사용자 개념 요약 관리
│   │   │       └── inquiries/        # 1:1 문의 답변
│   │   ├── components/               # 공통 UI 컴포넌트 (React Native Web 호환)
│   │   │   ├── common/               # Button, Input, Modal 등
│   │   │   ├── layout/               # Header, Sidebar, Footer
│   │   │   ├── exam/                 # 시험 관련 컴포넌트
│   │   │   ├── concept/              # 개념 요약 컴포넌트
│   │   │   └── inquiry/              # 문의 컴포넌트
│   │   ├── hooks/                    # Custom React Hooks
│   │   ├── services/                 # API 호출 레이어 (axios)
│   │   ├── store/                    # 전역 상태 (Zustand)
│   │   ├── types/                    # TypeScript 타입 정의
│   │   └── utils/                    # 유틸 함수
│   ├── public/                       # 정적 파일
│   ├── next.config.js
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── backend/                          # Spring Boot REST API
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/tpmp/testprep/
│   │   │   │   ├── config/           # Security, CORS, Swagger 설정
│   │   │   │   ├── controller/       # REST 컨트롤러
│   │   │   │   ├── service/          # 비즈니스 로직
│   │   │   │   ├── repository/       # JPA 레포지토리
│   │   │   │   ├── entity/           # JPA 엔티티
│   │   │   │   ├── dto/              # Request / Response DTO
│   │   │   │   │   ├── request/
│   │   │   │   │   └── response/
│   │   │   │   ├── security/         # JWT 필터, 핸들러
│   │   │   │   │   ├── jwt/
│   │   │   │   │   └── handler/
│   │   │   │   ├── exception/        # 전역 예외 처리
│   │   │   │   └── util/             # 유틸 클래스
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       └── application-docker.yml
│   │   └── test/
│   ├── build.gradle
│   ├── settings.gradle
│   └── Dockerfile
│
├── nginx/                            # Reverse proxy 설정
│   └── nginx.conf
│
├── uploads/                          # 업로드 파일 임시 저장 (Docker volume)
│   ├── pdfs/
│   └── hwp/
│
├── docs/                             # 프로젝트 문서
│   ├── project-overview.md
│   ├── code-guidelines.md
│   ├── security.md
│   └── style-guidelines.md
│
├── CLAUDE.md                         # AI 개발 가이드
├── docker-compose.yml
└── README.md
```

---

## Feature Overview

### 사용자(User)
- 시험 목록 조회 및 응시
- 개념 요약 등록 / 조회
- 1:1 문의 등록 / 답변 확인

### 관리자(Admin)
- 시험 등록 (제목, 문항 순서: 랜덤/순차, 문항 등록)
- 문항 등록: 수동 1건 / 다건 입력, PDF·HWP 파일 업로드
- 사용자 개념 요약 관리
- 1:1 문의 답변

---

## API Endpoints (Overview)

```
POST   /api/auth/signup             회원가입
POST   /api/auth/login              로그인
POST   /api/auth/refresh            토큰 갱신

GET    /api/user/exams              시험 목록
GET    /api/user/exams/{id}         시험 상세
POST   /api/user/exams/{id}/submit  시험 제출

GET    /api/user/concepts           개념 요약 목록
POST   /api/user/concepts           개념 요약 등록
PUT    /api/user/concepts/{id}      개념 요약 수정
DELETE /api/user/concepts/{id}      개념 요약 삭제

GET    /api/user/inquiries          내 문의 목록
POST   /api/user/inquiries          문의 등록

GET    /api/admin/exams             시험 관리 목록
POST   /api/admin/exams             시험 등록
PUT    /api/admin/exams/{id}        시험 수정
DELETE /api/admin/exams/{id}        시험 삭제
POST   /api/admin/exams/{id}/questions          문항 수동 등록
POST   /api/admin/exams/{id}/questions/bulk     문항 다건 등록
POST   /api/admin/exams/{id}/questions/upload   파일 업로드 등록

GET    /api/admin/concepts          개념 요약 전체 관리
DELETE /api/admin/concepts/{id}

GET    /api/admin/inquiries         1:1 문의 목록
POST   /api/admin/inquiries/{id}/reply  답변 등록
```

---

## Build & Run

### Prerequisites
- Docker 24+, Docker Compose v2
- (Local 개발) Node.js 20+, Java 17, Gradle 8+

### 환경 변수 설정

```bash
cp .env.example .env
# .env 파일 내 DB 패스워드, JWT_SECRET 등 수정
```

### Docker로 전체 실행

```bash
docker-compose up --build
```

서비스 접속:
- 웹: http://localhost:3000
- API: http://localhost:8080
- DB: localhost:5432

### 로컬 개발 (프론트엔드)

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

### 로컬 개발 (백엔드)

```bash
cd backend
# PostgreSQL이 실행 중이어야 합니다 (docker-compose up db)
./gradlew bootRun --args='--spring.profiles.active=local'
```

### 테스트

```bash
# Frontend
cd frontend && npm test

# Backend
cd backend && ./gradlew test
```

---

## Git Repository

- Remote: https://github.com/LEEBEOMSHIK/test_preparation_master_project

```bash
git remote -v
# origin  https://github.com/LEEBEOMSHIK/test_preparation_master_project.git
```

---

## Roadmap

- [ ] 웹 서비스 MVP
- [ ] AI 기반 자동 문항 분석 기능
- [ ] React Native Expo 앱 (코드 공유)
- [ ] CI/CD (GitHub Actions)
