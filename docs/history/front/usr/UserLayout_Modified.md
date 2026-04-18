## HIST-20260418-003

- **날짜**: 2026-04-18
- **수정 범위**: 사용자 프론트엔드 / 전체 페이지 레이아웃 적용
- **수정 개요**: 빈 page.tsx 파일에 default export 추가하여 UserLayout이 모든 사용자 페이지에 즉시 적용되도록 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/exams/page.tsx` | 수정 | 빈 파일 → placeholder 페이지 컴포넌트 추가 |
| `frontend/src/app/user/concepts/page.tsx` | 수정 | 빈 파일 → placeholder 페이지 컴포넌트 추가 |
| `frontend/src/app/user/inquiries/page.tsx` | 수정 | 빈 파일 → placeholder 페이지 컴포넌트 추가 |

### 수정 상세

#### 각 page.tsx 공통 패턴
- **변경 전**: 0 bytes (빈 파일, default export 없어 Next.js 빌드 오류 발생)
- **변경 후**: 제목 + 설명 + "준비 중입니다." dashed 박스 placeholder 컴포넌트
- **이유**: Next.js App Router는 layout.tsx가 있어도 page.tsx에 default export가 없으면 라우트 오류 발생

### 적용 확인 결과

| 라우트 | HTTP | 레이아웃 요소 확인 |
|--------|------|-------------------|
| `http://localhost:3000/user/exams` | 200 | TPMP 로고, 시험/개념노트/1:1문의 네비게이션, 모바일 bottom 탭 |
| `http://localhost:3000/user/concepts` | 200 | 동일 |
| `http://localhost:3000/user/inquiries` | 200 | 동일 |

### 복원 방법

이 ID(HIST-20260418-003)로 복원 시:
각 page.tsx를 빈 파일(0 bytes)로 되돌린다.

---

## HIST-20260418-001

- **날짜**: 2026-04-18
- **수정 범위**: 사용자 프론트엔드 / 레이아웃
- **수정 개요**: 사용자 전용 레이아웃(UserLayoutShell) 신규 생성 및 Next.js App Router 라우트 레이아웃 적용

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/UserLayoutShell.tsx` | 추가 | 사용자 레이아웃 Shell 컴포넌트 신규 생성 |
| `frontend/src/app/user/layout.tsx` | 추가 | Next.js App Router 사용자 라우트 레이아웃 신규 생성 |

### 수정 상세

#### `frontend/src/components/layout/UserLayoutShell.tsx`
- **변경 전**: 파일 없음
- **변경 후**: 신규 생성
  - 상단 헤더 (h-14, fixed): TPMP 로고 + 데스크탑 수평 네비게이션(시험/개념노트/1:1문의) + 사용자 드롭다운(이름, 이메일, 로그아웃)
  - 페이지 콘텐츠 영역: max-w-5xl 중앙 정렬, mt-14 / mb-16 (모바일)
  - 모바일 하단 탭 바 (sm:hidden, h-16): 아이콘+레이블, 활성 탭 상단 인디케이터
- **이유**: 사용자 전용 레이아웃 분리

#### `frontend/src/app/user/layout.tsx`
- **변경 전**: 파일 없음
- **변경 후**: `UserLayoutShell`을 `/user/**` 라우트 전체에 적용

### 복원 방법

이 ID(HIST-20260418-001)로 복원 시:
- `frontend/src/components/layout/UserLayoutShell.tsx` 삭제
- `frontend/src/app/user/layout.tsx` 삭제
