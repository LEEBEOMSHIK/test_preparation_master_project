## HIST-20260511-009

- **날짜**: 2026-05-11
- **수정 범위**: 관리자 프론트엔드 / 연습장 관리
- **수정 개요**: 연습장 관리 메뉴 및 관리자 페이지 신규 구현 — 규칙 관리, 기록 관리

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | ICON_MAP에 `practice` 추가 + FALLBACK_NAV에 "연습장 관리" 및 하위 2개 항목 추가 |
| `frontend/src/services/practiceAdminService.ts` | 추가 | `getHistory`, `getRules` API 서비스 |
| `frontend/src/app/admin/practice/page.tsx` | 추가 | `/admin/practice` → `/admin/practice/rules` 리다이렉트 |
| `frontend/src/app/admin/practice/rules/page.tsx` | 추가 | 규칙 관리 페이지 (금지 명령·테이블 접두사·오타 패턴 표시) |
| `frontend/src/app/admin/practice/history/page.tsx` | 추가 | 기록 관리 페이지 (실행 이력 테이블, 이메일 필터, 페이지네이션, SQL 상세 펼치기) |

### 수정 상세

#### `AdminLayoutShell.tsx`
- ICON_MAP: `practice` SVG 아이콘 추가 (그리드/표 모양)
- FALLBACK_NAV: id=11 "연습장 관리"(`/admin/practice`) 항목 추가 (displayOrder=11)
  - id=111: "규칙 관리" (`/admin/practice/rules`)
  - id=112: "기록 관리" (`/admin/practice/history`)

#### `practiceAdminService.ts`
- `getHistory(page, size, email?)` — `GET /api/admin/practice/history`
- `getRules()` — `GET /api/admin/practice/rules`

#### `admin/practice/rules/page.tsx`
- 규칙 4개 섹션: 금지 SQL 명령어(빨간 배지), 허용 테이블 접두사, 멀티 스테이트먼트 규칙, 오타 감지 패턴 테이블
- 기본 연습 테이블 4개 안내 블록
- 로딩 시 animate-pulse 스켈레톤

#### `admin/practice/history/page.tsx`
- 실행 결과 유형별 컬러 배지 (SELECT=파랑, INSERT=초록, ERROR=빨강 등)
- 행 클릭 시 전체 SQL·오류 메시지 상세 펼치기 (토글)
- 이메일 검색 디바운스(400ms) 적용
- 페이지네이션 (최대 7개 버튼, 앞/다음)
- `TableSkeleton` 사용

### 복원 방법

HIST-20260511-009 복원 시:
- `frontend/src/app/admin/practice/` 디렉토리 삭제
- `frontend/src/services/practiceAdminService.ts` 삭제
- `AdminLayoutShell.tsx`에서 `practice` ICON_MAP 항목 및 FALLBACK_NAV의 "연습장 관리" 항목(id=11, 111, 112) 제거
