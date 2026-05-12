## HIST-20260512-001

- **날짜**: 2026-05-12
- **수정 범위**: 관리자 프론트엔드 / 레이아웃
- **수정 개요**: AdminLayoutShell에서 USER 토큰으로 관리자 화면 진입 시 403이 발생하는 버그 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | authService import 추가, setAuth 추가, authService.me()로 ADMIN role 검증 |

### 원인

AdminLayoutShell이 sessionStorage에 토큰이 존재하는지만 확인하고 role은 검증하지 않음.
사용자(ROLE_USER) 토큰이 sessionStorage에 남아있는 상태에서 /admin/** 접근 시, 서버가 정당하게 403 반환.

### 수정 상세

변경 전: 토큰 존재 확인 후 role 검증 없이 menuService 호출
변경 후: authService.me()로 role 확인 → ADMIN이 아니면 clearAuth + /admin/login 리다이렉트

### 복원 방법

authService import 제거, setAuth 제거, authService.me() 블록 제거 후 원래 구조로 복원
