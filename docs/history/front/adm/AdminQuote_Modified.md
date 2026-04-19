## HIST-20260420-010

- **날짜**: 2026-04-20
- **수정 범위**: 관리자 프론트엔드 / 명언 관리
- **수정 개요**: 명언 목록·등록·수정·삭제·사용여부 토글 화면 추가, 관리자 사이드바에 메뉴 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/types/index.ts | 수정 | Quote 인터페이스 추가 |
| src/services/quoteService.ts | 추가 | admin CRUD + user getRandom API 메서드 |
| src/app/admin/quotes/page.tsx | 추가 | 명언 관리 페이지 (목록·인라인 폼·사용여부 토글·삭제) |
| src/components/layout/AdminLayoutShell.tsx | 수정 | 명언 관리 nav 항목 추가 (테이블 관리 위) |

### 복원 방법

HIST-20260420-010 복원 시:
- types/index.ts에서 Quote 인터페이스 제거
- quoteService.ts 삭제
- src/app/admin/quotes/ 디렉토리 삭제
- AdminLayoutShell.tsx에서 명언 관리 항목 제거
