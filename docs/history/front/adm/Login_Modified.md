## HIST-20260717-001

- **날짜**: 2026-07-17
- **수정 범위**: 관리자 프론트엔드 / 로그인 화면 (다크모드 토글)
- **수정 개요**: 관리자 로그인 화면에 다크모드 토글 버튼 추가. 기존 항상-다크 고정 스타일을 테마 반응형(라이트 기본 + `dark:` 변형)으로 전환.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/login/page.tsx` | 수정 | 우상단(fixed) `<ThemeToggle />` 추가, 라이트 스타일 기본 + 기존 다크 스타일을 `dark:` 변형으로 이동 |
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | 로컬 `ThemeToggle` 정의 제거 → 공용 `src/components/ui/ThemeToggle.tsx` import |

### 수정 상세
- **변경 전**: `bg-gradient-to-br from-gray-900 to-gray-800` 등 다크 색상 고정 — 테마 설정과 무관하게 항상 어둡게 표시.
- **변경 후**: 라이트 모드는 `from-gray-100 to-white` 그라디언트 + 흰 카드, 다크 모드는 기존 디자인 그대로(`dark:` 접두사). 제목·라벨·입력·에러·버튼·링크 전부 양쪽 테마 대응.
- 토글은 사용자 로그인과 동일하게 `fixed top-4 right-4` 위치, 공용 `<ThemeToggle />` 사용 (신규 추출 — 상세는 `docs/history/front/usr/Login_Modified.md` HIST-20260717-001 참조).
- **주의**: 라이트 테마 사용자는 관리자 로그인이 기존과 달리 밝은 화면으로 보임.

### 검증 결과
- `npx tsc --noEmit`: 오류 0건

### 복원 방법
이 ID(HIST-20260717-001)로 복원 시 `admin/login/page.tsx`의 토글 블록 제거 후 다크 고정 클래스(`dark:` 없는 gray-900/800 계열)로 되돌리고, `AdminLayoutShell.tsx`에 로컬 `ThemeToggle` 함수를 복원한다.
