## HIST-20260722-001

- **날짜**: 2026-07-22
- **수정 범위**: 관리자 프론트엔드 / 후원 링크 관리(신규)
- **수정 개요**: "개발자 응원하기" 사용자 페이지에 노출되는 토스·카카오페이·카카오 선물하기 링크 3개를 관리자가 화면에서 직접 등록/수정할 수 있는 신규 페이지 `/admin/support-settings` 추가. 관리자 사이드바(`AdminLayoutShell.tsx`)에도 진입점 등록.
- **관련 작업**: 백엔드 API는 `docs/history/back/adm/AdminSupportSettings_Modified.md` HIST-20260722-001, 사용자 화면 반영은 `docs/history/front/usr/UserSupport_Modified.md` HIST-20260722-002 참고.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/support-settings/page.tsx` | 추가 | 신규 관리자 페이지 — 토스/카카오페이/카카오 선물하기 URL 입력 폼 3개 + 저장 버튼, 저장 성공/실패 인라인 배너(초록/빨강), 최초 로딩 중 `<Skeleton />` 조합으로 폼 스켈레톤 표시 |
| `frontend/src/services/supportService.ts` | 추가 | `getSupportSettings()`(사용자), `adminGetSupportSettings()`/`adminUpdateSupportSettings(payload)`(관리자) |
| `frontend/src/types/index.ts` | 수정 | `SupportSettings` 인터페이스(`tossUrl`/`kakaopayUrl`/`kakaoGiftUrl`, 모두 optional) 추가 |
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | `ICON_MAP`에 `support` 아이콘(하트, `UserLayoutShell.tsx`의 동일 아이콘 재사용) 추가, `FALLBACK_NAV`에 "후원 링크 관리"(`/admin/support-settings`, id 12, order 12) 항목 추가 |

### 수정 상세

#### `frontend/src/app/admin/support-settings/page.tsx` (신규)
- 데이터 페칭(설정 조회)이 있는 화면이므로 CLAUDE.md 규칙에 따라 로딩 상태에 스켈레톤 필수 적용. 목록형 화면이 아니라 단일 폼(3필드)이라 `Skeleton.tsx`에 등록된 기존 컴포넌트 중 정확히 맞는 것이 없어, 표에 정의된 원자 컴포넌트 `<Skeleton />`을 3회 반복(라벨+입력창) + 저장 버튼 자리로 직접 조합(신규 named 컴포넌트로 등록하지 않음 — 인라인 조합은 컨벤션 예외 아님).
- 저장 성공/실패는 `error`/`successMessage` 상태로 인라인 배너 표시(기존 관리자 화면들의 `bg-red-50 text-red-500` 오류 배너 패턴 + `bg-green-50 text-green-600` 성공 배너 신규 조합, 두 색 모두 기존 코드베이스에서 이미 쓰이던 팔레트).

#### `frontend/src/components/layout/AdminLayoutShell.tsx`
- 변경 전: `ICON_MAP`에 `support` 키 없음, `FALLBACK_NAV`에 후원 링크 관리 항목 없음(마지막 항목이 `test-cases`, id 9901).
- 변경 후: `examhistory` 다음에 `support` 아이콘(하트) 추가, `FALLBACK_NAV`에 id 12 "후원 링크 관리" 항목을 `test-cases`(id 9901) 앞에 추가.
- 이유: 실제 메뉴는 `menuService`가 백엔드 `/api/menus`(DB 기반, `DataInitializer.ensureSupportSettingsMenu()`)에서 가져오며, `FALLBACK_NAV`는 API 실패 시에만 쓰이는 하드코딩 폴백이므로 두 곳 모두 갱신.

### 복원 방법
이 ID(HIST-20260722-001)로 복원 시:
1. `frontend/src/app/admin/support-settings/page.tsx`, `frontend/src/services/supportService.ts` 삭제.
2. `frontend/src/types/index.ts`에서 `SupportSettings` 인터페이스 제거.
3. `AdminLayoutShell.tsx`에서 `ICON_MAP.support`와 `FALLBACK_NAV`의 id 12 항목 제거.
