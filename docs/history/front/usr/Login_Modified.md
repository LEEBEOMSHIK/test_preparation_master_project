## HIST-20260418-006

- **날짜**: 2026-04-18
- **수정 범위**: 사용자 프론트엔드 / 인증 (로그인, 회원가입)
- **수정 개요**: 로그인·회원가입 페이지 신규 구현 (빈 파일 → 완성 페이지)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/auth/login/page.tsx` | 추가 | 로그인 페이지 구현 |
| `frontend/src/app/auth/signup/page.tsx` | 추가 | 회원가입 페이지 구현 |

### 수정 상세

#### `frontend/src/app/auth/login/page.tsx`
- **변경 전**: 0 bytes
- **변경 후**: 로그인 폼 컴포넌트
  - 이메일 + 비밀번호 입력 필드
  - 제출 시 `authService.login()` 호출 → `useAuthStore.setAuth()` 저장
  - 역할 기반 리다이렉트: ADMIN → `/admin/exams`, USER → `/user/exams`
  - 에러 메시지 인라인 표시
  - 회원가입 페이지 링크

#### `frontend/src/app/auth/signup/page.tsx`
- **변경 전**: 0 bytes
- **변경 후**: 회원가입 폼 컴포넌트
  - 이름 + 이메일 + 비밀번호 + 비밀번호 확인 필드
  - 실시간 비밀번호 불일치 표시 (border-red + 안내 문구)
  - 8자 미만 클라이언트 유효성 검사
  - 성공 시 `/auth/login?registered=1` 이동
  - 로그인 페이지 링크

### 복원 방법

이 ID(HIST-20260418-006)로 복원 시:
- `frontend/src/app/auth/login/page.tsx` 삭제 (또는 빈 파일로)
- `frontend/src/app/auth/signup/page.tsx` 삭제 (또는 빈 파일로)
