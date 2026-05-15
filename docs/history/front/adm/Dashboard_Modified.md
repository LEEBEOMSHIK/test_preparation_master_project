## HIST-20260516-001

- **날짜**: 2026-05-16
- **수정 범위**: 관리자 프론트엔드 / 대시보드 + 로그인 히스토리 + 레이아웃
- **수정 개요**: 대시보드 페이지 신규 생성, 로그인 히스토리 페이지 신규 생성, 레이아웃 메뉴 개편

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/dashboard/page.tsx` | 추가 | 대시보드 페이지 (통계 카드 5종) |
| `frontend/src/app/admin/login-history/page.tsx` | 추가 | 로그인 히스토리 페이지 (테이블, 검색, 필터, 페이지네이션) |
| `frontend/src/services/adminDashboardService.ts` | 추가 | 대시보드 통계 API 클라이언트 |
| `frontend/src/services/adminLoginHistoryService.ts` | 추가 | 로그인 히스토리 API 클라이언트 |
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | ICON_MAP에 dashboard/loginhistory 아이콘 추가; FALLBACK_NAV에 대시보드(id:0) 최상단 추가; 계정 관리(id:9)에 서브메뉴(계정 목록, 로그인 히스토리) 추가; isParentActive 로직을 자식 URL까지 포함하도록 수정 |
| `frontend/src/app/admin/login/page.tsx` | 수정 | 로그인 성공 후 redirect를 /admin/exams → /admin/dashboard 로 변경 |

### 수정 상세

#### `AdminLayoutShell.tsx`
- 변경 전: 대시보드 메뉴 없음; 계정 관리가 자식메뉴 없는 단일 항목; 로그인 후 /admin/exams로 이동
- 변경 후:
  - FALLBACK_NAV 첫 번째 항목으로 대시보드(/admin/dashboard) 추가
  - 계정 관리 → 자식 [계정 목록(/admin/users), 로그인 히스토리(/admin/login-history)]
  - isParentActive: `pathname.startsWith(item.url) || children.some(c => pathname.startsWith(c.url))`
- 이유: 관리자 로그인 진입 시 대시보드를 첫 화면으로 표시; 계정 관련 메뉴 그룹화

#### `login/page.tsx`
- 변경 전: `router.push('/admin/exams')`
- 변경 후: `router.push('/admin/dashboard')`
- 이유: 로그인 후 대시보드를 첫 진입 화면으로 통일

### 복원 방법

이 ID(HIST-20260516-001)로 복원 시:
- dashboard/page.tsx, login-history/page.tsx, adminDashboardService.ts, adminLoginHistoryService.ts 삭제
- AdminLayoutShell.tsx에서 dashboard/loginhistory 아이콘, 대시보드 메뉴 항목, 계정 관리 서브메뉴 제거; isParentActive를 `pathname.startsWith(item.url)`로 복원
- login/page.tsx redirect를 `/admin/exams`로 복원
