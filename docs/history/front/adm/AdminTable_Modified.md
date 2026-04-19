## HIST-20260420-012

- **날짜**: 2026-04-20
- **수정 범위**: 관리자 프론트엔드 / 테이블 관리
- **수정 개요**: `/admin/tables` 접근 시 404 오류 발생 → 도메인 관리 페이지로 자동 리다이렉트

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/app/admin/tables/page.tsx | 추가 | `/admin/tables/domains`으로 즉시 redirect |

### 수정 상세

#### `src/app/admin/tables/page.tsx`
- 변경 전: 파일 없음 → 404 오류
- 변경 후: useRouter().replace('/admin/tables/domains') 호출로 도메인 관리 페이지로 이동

### 복원 방법

HIST-20260420-012 복원 시:
- src/app/admin/tables/page.tsx 삭제
