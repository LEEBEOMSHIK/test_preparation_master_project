## HIST-20260427-001

- **날짜**: 2026-04-27
- **수정 범위**: 관리자 프론트엔드 / 시험 정보 관리
- **수정 개요**: 시험 정보 관리 페이지 신규 구현 — 관리자 CRUD UI, AdminLayoutShell에 시험 정보 관리 메뉴 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exam-info/page.tsx` | 추가 | 시험 정보 관리 페이지 (추가/수정/삭제 폼 + 목록) |
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | `examinfo` 아이콘 추가, FALLBACK_NAV에 시험 정보 관리 항목 추가 |

### 수정 상세

#### `app/admin/exam-info/page.tsx` (신규)
- 상단 "시험 정보 추가" 버튼 → 인라인 폼 토글
- 폼 항목: 시험 유형(select) + 시험명 + 설명 + 접수기간 + 시험일정 + 합격발표 + URL + 정렬순서 + 활성화 체크박스
- 목록: 유형 배지 + 제목 + 설명 미리보기 + 일정 요약 + 수정/삭제 버튼

#### `AdminLayoutShell.tsx`
- **변경 전**: `examinfo` 아이콘 없음, FALLBACK_NAV 9개
- **변경 후**: `examinfo` SVG 아이콘 추가, FALLBACK_NAV에 `{ id: 10, url: '/admin/exam-info', name: '시험 정보 관리', iconKey: 'examinfo', displayOrder: 10 }` 추가

### 복원 방법

HIST-20260427-001 복원 시:
- `app/admin/exam-info/page.tsx` 삭제
- `AdminLayoutShell.tsx`: `examinfo` 아이콘 제거, FALLBACK_NAV에서 id:10 항목 제거
