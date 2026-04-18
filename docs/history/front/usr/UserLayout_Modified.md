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
  - 페이지 콘텐츠 영역: max-w-5xl 중앙 정렬, mt-14 (헤더 높이) / mb-16 (모바일 하단 탭 높이)
  - 모바일 하단 탭 바 (sm:hidden, h-16): 시험/개념노트/1:1문의 아이콘+레이블, 활성 탭 상단 인디케이터
  - Zustand `useAuthStore`로 사용자 정보 표시 및 로그아웃 처리
- **이유**: 사용자 전용 레이아웃 분리 (관리자 레이아웃과 독립적으로 유지보수)

#### `frontend/src/app/user/layout.tsx`
- **변경 전**: 파일 없음
- **변경 후**: 신규 생성
  - `UserLayoutShell` import 후 `/user/**` 라우트 전체에 적용하는 Next.js 레이아웃

### 복원 방법

이 ID(HIST-20260418-001)로 복원 시:
- `frontend/src/components/layout/UserLayoutShell.tsx` 삭제
- `frontend/src/app/user/layout.tsx` 삭제
