## HIST-20260427-002

- **날짜**: 2026-04-27
- **수정 범위**: 관리자 프론트엔드 / 다크 모드 — 레이아웃 + 인프라
- **수정 개요**: 시스템 전체 다크 모드 지원 추가 — Tailwind class 전략, Zustand 테마 스토어, 안티-FOUC 스크립트, 글로벌 CSS 오버라이드, AdminLayoutShell ThemeToggle 버튼

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/tailwind.config.ts` | 수정 | `darkMode: 'class'` 추가 |
| `frontend/src/store/themeStore.ts` | 추가 | Zustand persist 테마 스토어 (`light`/`dark`/`system`, localStorage `tpmp-theme`) |
| `frontend/src/components/ThemeProvider.tsx` | 추가 | `document.documentElement`에 `dark` 클래스 적용·제거 + 시스템 preference 감지 |
| `frontend/src/app/layout.tsx` | 수정 | 안티-FOUC 인라인 스크립트 추가, `ThemeProvider` 래핑, `suppressHydrationWarning` |
| `frontend/src/app/globals.css` | 수정 | `.dark .{tailwind-class}` 글로벌 오버라이드 추가 (surfaces·text·borders·shadows·forms·scrollbar) |
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | `ThemeToggle` 컴포넌트 추가, 모든 UI 요소에 `dark:` 접두사 variant 적용 |

### 수정 상세

#### `frontend/tailwind.config.ts`
- 변경 전: `darkMode` 설정 없음 (기본 media 전략)
- 변경 후: `darkMode: 'class'` — `<html class="dark">` 기반 전환
- 이유: JS로 동적 토글·저장 가능한 class 전략 채택

#### `frontend/src/store/themeStore.ts`
- 변경 전: 파일 없음
- 변경 후: 신규 생성. `theme: 'system'|'light'|'dark'`, `toggleTheme()` (system→현재OS값 반전), Zustand persist (`tpmp-theme` 키)

#### `frontend/src/components/ThemeProvider.tsx`
- 변경 전: 파일 없음
- 변경 후: 신규 생성. `useThemeStore` 구독 → `dark`/`light` 시 직접 클래스 조작, `system` 시 `matchMedia` 이벤트 리스너 등록

#### `frontend/src/app/layout.tsx`
- 변경 전: `<html lang="ko"><body>{children}</body></html>`
- 변경 후: `<html suppressHydrationWarning>` + `<head>`에 안티-FOUC 스크립트 + `<ThemeProvider>` 래핑
- 이유: React 하이드레이션 전 FOUC(잘못된 테마 깜빡임) 방지

#### `frontend/src/app/globals.css`
- 변경 전: Tailwind 기본 + 루트 색상 변수만 존재
- 변경 후: `.dark .{class}` 오버라이드 100+ 규칙 추가
  - Surfaces: `bg-white→#1f2937`, `bg-gray-50→#111827` 등
  - Text: gray-900~400 → 밝은 등가값
  - Borders, shadows, hover states, form controls, scrollbar

#### `frontend/src/components/layout/AdminLayoutShell.tsx`
- 변경 전: 라이트 전용 Tailwind 클래스
- 변경 후:
  - `ThemeToggle` 내부 컴포넌트 추가 (sun/moon SVG, `useThemeStore().toggleTheme()`)
  - 사이드바: `dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800`
  - 활성 메뉴: `dark:bg-indigo-900/40 dark:text-indigo-300`
  - 헤더: `dark:bg-gray-900 dark:border-gray-700`
  - 메인 래퍼: `dark:bg-gray-950`

### 복원 방법

이 ID(HIST-20260427-002)로 복원 시:
- `tailwind.config.ts`에서 `darkMode: 'class'` 제거
- `themeStore.ts`, `ThemeProvider.tsx` 삭제
- `layout.tsx`를 안티-FOUC 스크립트 및 ThemeProvider 없는 이전 버전으로 되돌림
- `globals.css`에서 `.dark` 오버라이드 블록 전체 제거
- `AdminLayoutShell.tsx`에서 `ThemeToggle` 컴포넌트 및 모든 `dark:` variant 제거

---

## HIST-20260419-007

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 프론트엔드 / 인증
- **수정 개요**: apiClient 401/403 인터셉터가 /auth/ 엔드포인트에는 동작하지 않도록 수정 (로그인 실패 401이 refresh 루프에 빠지는 버그 수정)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/apiClient.ts` | 수정 | `isAuthEndpoint` 체크 추가 — `/auth/` URL은 401/403 인터셉터 바이패스 |

### 수정 상세

#### `services/apiClient.ts`
- 변경 전: 모든 401 응답에서 refresh 시도 → `/auth/login` 자체도 401 시 refresh 루프 발생
- 변경 후: `originalRequest.url`에 `/auth/`가 포함되면 즉시 `Promise.reject` 반환, 인터셉터 건너뜀
- 이유: 로그인 실패(`INVALID_CREDENTIALS` → 401), refresh 실패(`TOKEN_INVALID` → 401) 응답이 재귀 호출되는 버그 수정

### 복원 방법

이 ID(HIST-20260419-007)만으로 복원 시:
- `apiClient.ts`: `isAuthEndpoint` 선언 및 `if (isAuthEndpoint) return Promise.reject(error)` 블록 제거

---

## HIST-20260419-006

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 프론트엔드 / 인증
- **수정 개요**: 미인증(토큰 없음) 접근 시 로그인 페이지 자동 리다이렉트, 403 응답 시 로그인 리다이렉트 처리 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | useEffect로 sessionStorage 토큰 확인 — 없으면 /auth/login으로 replace |
| `frontend/src/services/apiClient.ts` | 수정 | 403 응답 시 토큰 제거 후 /auth/login 리다이렉트 추가 |

### 수정 상세

#### `components/layout/AdminLayoutShell.tsx`
- 변경 전: 인증 확인 없음 — 토큰 없이도 관리자 화면 렌더링
- 변경 후: `useEffect`에서 `sessionStorage.getItem('accessToken')` 확인, 없으면 `router.replace('/auth/login')`
- 이유: 토큰 없이 관리자 URL 직접 접근 시 로그인 화면 안내

#### `services/apiClient.ts`
- 변경 전: 401만 처리 (refresh 시도 → 실패 시 로그인)
- 변경 후: 403 응답 추가 처리 — 토큰 제거 후 `/auth/login` 이동
- 이유: 권한 없는 요청(토큰 없음/USER 역할)에서 발생하는 403을 로그인 리다이렉트로 처리

### 복원 방법

이 ID(HIST-20260419-006)만으로 복원 시:
- `AdminLayoutShell.tsx`: `useEffect` import 및 인증 확인 블록 제거
- `apiClient.ts`: `status === 403` 처리 블록 제거

---

## HIST-20260419-004

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 문항 유형에 CODE(코드) 타입 추가 — IntelliJ Darcula 스타일 코드 에디터 컴포넌트 신규 구현

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `QuestionType`에 `'CODE'` 추가, `QuestionSummary`에 `code?`, `language?` 필드 추가 |
| `frontend/src/services/examService.ts` | 수정 | `adminCreateQuestionsBulk` 파라미터에 `code?`, `language?` 추가 |
| `frontend/src/components/ui/CodeEditor.tsx` | 추가 | IntelliJ Darcula 테마 코드 에디터/뷰어 컴포넌트 신규 생성 |
| `frontend/src/app/admin/exams/questions/new/page.tsx` | 수정 | CODE 유형 추가 (언어 선택, 코드 에디터, 정답/예상 출력 필드), Tab키=2스페이스 |
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | CODE 유형 라벨/색상(violet) 추가 |
| `frontend/src/app/admin/exams/papers/new/page.tsx` | 수정 | CODE 유형 라벨/색상(violet) 추가 |

### 수정 상세

#### `frontend/src/components/ui/CodeEditor.tsx`
- **변경 전**: 파일 없음
- **변경 후**: 신규 생성
  - **IntelliJ Darcula 테마**: bg `#2b2b2b`, 거터 `#313335`, 텍스트 `#a9b7c6`, 탭바 `#3c3f41`
  - **맥OS 트래픽 라이트 점** (빨/노/초) + 파일명 탭(`Main.js`, `Main.py` 등)
  - **라인 번호**: 코드와 좌우 동기 스크롤 (onScroll 핸들러)
  - **Tab키**: 포커스 이동 대신 2칸 공백 삽입
  - **복사 버튼**: 우상단, 복사 후 1.5초 "복사됨" 피드백
  - `readOnly` prop으로 편집/조회 모드 전환

#### `frontend/src/app/admin/exams/questions/new/page.tsx`
- **변경 전**: MULTIPLE_CHOICE / SHORT_ANSWER / OX 3가지 유형만 지원
- **변경 후**: CODE 유형 추가
  - 유형 선택 버튼에 `{}` 아이콘 + violet 활성 색상
  - CODE 선택 시: 언어 선택 드롭다운 (15종), `CodeEditor` 컴포넌트(편집 모드), 정답/예상 출력 textarea(monospace)
  - submit 유효성: CODE 유형은 `code` 필드도 필수
  - API 전송 시 `code`, `language` 포함

### 복원 방법

이 ID(HIST-20260419-004)로 복원 시:
- `QuestionType`에서 `'CODE'` 제거
- `QuestionSummary`에서 `code?`, `language?` 제거
- `adminCreateQuestionsBulk` 파라미터에서 `code?`, `language?` 제거
- `frontend/src/components/ui/CodeEditor.tsx` 삭제
- `admin/exams/questions/new/page.tsx`를 HIST-20260419-003 이전 버전으로 되돌림
- `questions/page.tsx`, `papers/new/page.tsx`에서 CODE 라벨/색상 제거

---

## HIST-20260419-003

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 프론트엔드 / 문항 관리, 시험지 관리
- **수정 개요**: 사이드바에 문항 관리 서브메뉴 추가, 문항 관리/등록 페이지 신규 구현, 시험지 등록 페이지에 문항 선택 기능 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `QuestionSummary` 타입 추가 |
| `frontend/src/services/examService.ts` | 수정 | `adminGetQuestions`, `adminCreateQuestionsBulk` 메서드 추가 |
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | 시험 관리 서브메뉴에 '문항 관리' 항목 추가 |
| `frontend/src/app/admin/exams/questions/page.tsx` | 추가 | 문항 관리 목록 페이지 신규 생성 |
| `frontend/src/app/admin/exams/questions/new/page.tsx` | 추가 | 문항 등록 페이지 신규 생성 (직접 입력 + 파일/클립보드 가져오기) |
| `frontend/src/app/admin/exams/papers/new/page.tsx` | 수정 | 문항 선택 섹션 추가 — 문항 뱅크에서 체크박스로 문항 선택 후 시험지에 포함 |

### 수정 상세

#### `frontend/src/types/index.ts`
- **변경 전**: `ExamDetail` 까지만 정의
- **변경 후**: `QuestionSummary { id, content, questionType, options?, answer?, createdAt }` 추가

#### `frontend/src/services/examService.ts`
- **변경 전**: 문항 뱅크 관련 메서드 없음
- **변경 후**:
  - `adminGetQuestions(page, size)` → `GET /admin/questions`
  - `adminCreateQuestionsBulk(questions[])` → `POST /admin/questions/bulk`

#### `frontend/src/components/layout/AdminLayoutShell.tsx`
- **변경 전**: 시험 관리 children = `[{ label: '시험지 관리', href: '/admin/exams/papers' }]`
- **변경 후**: children에 `{ label: '문항 관리', href: '/admin/exams/questions' }` 선추가

#### `frontend/src/app/admin/exams/questions/page.tsx`
- **변경 전**: 파일 없음
- **변경 후**: 문항 뱅크 목록 (순번, 내용, 유형 배지, 등록일) + `+ 문항 등록` 버튼

#### `frontend/src/app/admin/exams/questions/new/page.tsx`
- **변경 전**: 파일 없음
- **변경 후**: 신규 생성
  - **탭 1 — 직접 입력**: 복수 문항 폼 (`+ 문항 추가` 버튼), 각 문항마다 유형(객관식/주관식/O·X) 선택, 보기 추가/삭제(객관식), 정답 입력
  - **탭 2 — 파일/클립보드**: 드래그앤드롭 영역(PDF·HWP·Excel·CSV·TXT), 클립보드 붙여넣기 버튼, 가져온 문항 목록(적용/제외 체크박스 + 전체 선택/해제)
  - 하단 요약: 직접 입력 N개 + 가져오기 M개 = 총 K개, `문항 K개 등록` 버튼

#### `frontend/src/app/admin/exams/papers/new/page.tsx`
- **변경 전**: 제목 + 출제 방식 폼만 존재
- **변경 후**:
  - 기존 폼 유지
  - `문항 선택` 섹션 추가: 문항 뱅크 API 호출, 검색 필터, 체크박스 선택, 전체 선택/해제
  - 제출 시 시험지 생성 후 선택된 문항을 `adminAddQuestionsBulk`로 일괄 추가
  - 버튼 레이블에 선택 문항 수 표시 (`시험지 등록 (문항 N개 포함)`)

### 복원 방법

이 ID(HIST-20260419-003)로 복원 시:
- `frontend/src/types/index.ts`에서 `QuestionSummary` 인터페이스 제거
- `frontend/src/services/examService.ts`에서 `adminGetQuestions`, `adminCreateQuestionsBulk` 제거
- `AdminLayoutShell.tsx` children에서 `{ label: '문항 관리', href: '/admin/exams/questions' }` 항목 제거
- `admin/exams/questions/page.tsx` 삭제
- `admin/exams/questions/new/page.tsx` 삭제
- `admin/exams/papers/new/page.tsx`를 HIST-20260419-002 버전(문항 선택 섹션 없는 버전)으로 되돌림

---

## HIST-20260419-002

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 프론트엔드 / 시험 관리, 시험지 관리
- **수정 개요**: 사이드바에 시험지 관리 서브메뉴 추가, 시험 목록 API 연동, 시험지 관리/등록 페이지 신규 구현

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | 시험 관리 하위 서브메뉴(시험지 관리) 추가, getPageTitle 함수로 헤더 타이틀 개선 |
| `frontend/src/app/admin/exams/page.tsx` | 수정 | 클라이언트 컴포넌트로 전환 + examService.adminGetExams() API 연동 → 테이블 목록 표시 |
| `frontend/src/app/admin/exams/papers/page.tsx` | 추가 | 시험지 관리 페이지 신규 생성 (목록 + 시험지 등록 버튼) |
| `frontend/src/app/admin/exams/papers/new/page.tsx` | 추가 | 시험지 등록 폼 페이지 신규 생성 |

### 수정 상세

#### `frontend/src/components/layout/AdminLayoutShell.tsx`
- **변경 전**: 단순 NAV_ITEMS 배열, 서브메뉴 없음
- **변경 후**:
  - NAV_ITEMS에 `children?: SubNavItem[]` 필드 추가
  - 시험 관리 항목에 `children: [{ label: '시험지 관리', href: '/admin/exams/papers' }]` 추가
  - 부모 활성 시 서브메뉴 인덴트(border-l) + dot 표시
  - 부모 우측 chevron → 활성 시 rotate-90
  - `getPageTitle()` 함수로 서브메뉴 포함 헤더 타이틀 정확히 표시

#### `frontend/src/app/admin/exams/page.tsx`
- **변경 전**: 정적 placeholder ("준비 중입니다.")
- **변경 후**: `useEffect`로 `examService.adminGetExams()` 호출 → 로딩/에러/빈목록/테이블 4가지 상태 표시
  - 테이블 컬럼: 순번, 시험 제목, 출제 방식(배지), 문항 수, 등록일, 상세 링크

#### `frontend/src/app/admin/exams/papers/page.tsx`
- **변경 전**: 파일 없음
- **변경 후**: 시험지 목록(API 연동) + `+ 시험지 등록` 버튼(`/admin/exams/papers/new`)

#### `frontend/src/app/admin/exams/papers/new/page.tsx`
- **변경 전**: 파일 없음
- **변경 후**: 시험지 제목 + 출제 방식 선택 폼, `examService.adminCreateExam()` 호출, 성공 시 `/admin/exams/papers`로 이동

### 복원 방법

이 ID(HIST-20260419-002)로 복원 시:
- `AdminLayoutShell.tsx`에서 `children` 필드 및 서브메뉴 렌더링 코드 제거, `getPageTitle` 함수 제거
- `admin/exams/page.tsx`를 이전 정적 placeholder로 되돌림 (HIST-20260419-001 이후 버전)
- `admin/exams/papers/page.tsx` 삭제
- `admin/exams/papers/new/page.tsx` 삭제

---

## HIST-20260419-001

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 프론트엔드 / 시험 관리
- **수정 개요**: 시험 목록 페이지에 "시험 등록" 버튼 추가 및 시험 등록 페이지 신규 구현

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/page.tsx` | 수정 | 헤더 영역에 "시험 등록" 버튼(`/admin/exams/new` 링크) 추가 |
| `frontend/src/app/admin/exams/new/page.tsx` | 추가 | 시험 등록 폼 페이지 신규 생성 |

### 수정 상세

#### `frontend/src/app/admin/exams/page.tsx`
- **변경 전**: 제목+설명+"준비 중입니다." placeholder만 있었음
- **변경 후**: 제목 우측에 `+ 시험 등록` 버튼(`/admin/exams/new`) 추가, placeholder 문구 "등록된 시험이 없습니다."로 변경
- **이유**: 시험 목록에서 바로 등록 화면으로 이동할 수 있도록

#### `frontend/src/app/admin/exams/new/page.tsx`
- **변경 전**: 파일 없음
- **변경 후**: 신규 생성 — `'use client'` 컴포넌트
  - 뒤로가기 버튼 (`/admin/exams`)
  - 시험 제목 입력 필드 (필수)
  - 문항 출제 방식 토글: `SEQUENTIAL(순차 출제)` / `RANDOM(랜덤 출제)`
  - 제출 시 `examService.adminCreateExam(title, questionMode)` 호출 → 성공 시 `/admin/exams` 이동
  - 취소 버튼 (`/admin/exams`)
  - 에러 메시지 인라인 표시

### 복원 방법

이 ID(HIST-20260419-001)로 복원 시:
- `frontend/src/app/admin/exams/page.tsx`를 "시험 등록" 버튼 없는 이전 placeholder 버전으로 되돌린다.
- `frontend/src/app/admin/exams/new/page.tsx` 삭제

---

## HIST-20260418-004

- **날짜**: 2026-04-18
- **수정 범위**: 관리자 프론트엔드 / 전체 페이지 레이아웃 적용
- **수정 개요**: 빈 page.tsx 파일에 default export 추가하여 AdminLayout이 모든 관리자 페이지에 즉시 적용되도록 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/page.tsx` | 수정 | 빈 파일 → placeholder 페이지 컴포넌트 추가 |
| `frontend/src/app/admin/concepts/page.tsx` | 수정 | 빈 파일 → placeholder 페이지 컴포넌트 추가 |
| `frontend/src/app/admin/inquiries/page.tsx` | 수정 | 빈 파일 → placeholder 페이지 컴포넌트 추가 |

### 수정 상세

#### 각 page.tsx 공통 패턴
- **변경 전**: 0 bytes (빈 파일)
- **변경 후**: 제목 + 설명 + "준비 중입니다." dashed 박스 placeholder 컴포넌트
- **이유**: Next.js App Router는 page.tsx에 default export가 없으면 라우트 오류 발생

### 적용 확인 결과

| 라우트 | HTTP | 레이아웃 요소 확인 |
|--------|------|-------------------|
| `http://localhost:3000/admin/exams` | 200 | TPMP 로고, 관리자, 시험관리/개념노트관리/1:1문의관리 사이드바 |
| `http://localhost:3000/admin/concepts` | 200 | 동일 |
| `http://localhost:3000/admin/inquiries` | 200 | 동일 |

### 복원 방법

이 ID(HIST-20260418-004)로 복원 시:
각 page.tsx를 빈 파일(0 bytes)로 되돌린다.

---

## HIST-20260418-002

- **날짜**: 2026-04-18
- **수정 범위**: 관리자 프론트엔드 / 레이아웃
- **수정 개요**: 관리자 전용 레이아웃(AdminLayoutShell) 신규 생성 및 Next.js App Router 라우트 레이아웃 적용

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 추가 | 관리자 레이아웃 Shell 컴포넌트 신규 생성 |
| `frontend/src/app/admin/layout.tsx` | 추가 | Next.js App Router 관리자 라우트 레이아웃 신규 생성 |

### 수정 상세

#### `frontend/src/components/layout/AdminLayoutShell.tsx`
- **변경 전**: 파일 없음
- **변경 후**: 신규 생성
  - 좌측 사이드바 (w-56, fixed): TPMP 로고+"관리자" 뱃지, 시험관리/개념노트관리/1:1문의관리 아이콘+레이블 (활성 dot), 하단 아바타+이름+이메일+로그아웃
  - 상단 헤더 (h-16, sticky): pathname 기반 자동 페이지 제목 + 알림벨 + 아바타+이름
  - 메인 콘텐츠: ml-56, p-6

#### `frontend/src/app/admin/layout.tsx`
- **변경 전**: 파일 없음
- **변경 후**: `AdminLayoutShell`을 `/admin/**` 라우트 전체에 적용

### 레이아웃 구조

```
Admin:
┌──────────────────────────────────────────┐
│  [Sidebar w-56]  │  [Header h-16 sticky]  │
│  TPMP  관리자    │  PageTitle | 🔔 | 👤   │
│  시험 관리       ├────────────────────────┤
│  개념노트 관리   │   children (p-6)       │
│  1:1 문의 관리   │                        │
│  [User info]     │                        │
└──────────────────┴────────────────────────┘

User:
┌──────────────────────────────────────────┐
│  TPMP  [시험][개념노트][1:1문의]   [👤▼]  │  Header h-14
│   children (max-w-5xl)                   │
│  [시험]   [개념노트]   [1:1문의]          │  Mobile bottom tab
└──────────────────────────────────────────┘
```

### 복원 방법

이 ID(HIST-20260418-002)로 복원 시:
- `frontend/src/components/layout/AdminLayoutShell.tsx` 삭제
- `frontend/src/app/admin/layout.tsx` 삭제
