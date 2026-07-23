# 개발자 응원하기(후원) 화면 수정 이력

## HIST-20260722-002

- **날짜**: 2026-07-22
- **수정 범위**: 사용자 프론트엔드 / 개발자 응원하기(후원) 링크 관리자 연동
- **수정 개요**: HIST-20260722-001에서 파일 상단 코드 상수(`TOSS_SUPPORT_URL`/`KAKAOPAY_SUPPORT_URL`/`KAKAO_GIFT_WISHLIST_URL`)로 관리하던 3개 후원 링크를 관리자 화면(`/admin/support-settings`)에서 관리하도록 전환. 정적 페이지였던 `/user/support`가 이제 서버에서 링크를 조회하는 데이터 페칭 화면이 되어 스켈레톤 UI를 신규 적용.
- **관련 작업**: 관리자 화면·API는 `docs/history/front/adm/AdminSupportSettings_Modified.md`·`docs/history/back/adm/AdminSupportSettings_Modified.md` HIST-20260722-001, 사용자 조회 API는 `docs/history/back/usr/UserSupport_Modified.md` HIST-20260722-001 참고.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/support/page.tsx` | 수정 | 상단 하드코딩 3개 URL 상수 제거, `useEffect`로 `supportService.getSupportSettings()` 호출해 받아온 값으로 카드 활성/비활성 판단. 로딩 중 `<CardListSkeleton rows={3} />` 표시(CLAUDE.md 스켈레톤 UI 규칙 신규 적용 — 기존 `Skeleton.tsx`의 카드형 컴포넌트 재사용, 신규 컴포넌트 추가 없음) |
| `frontend/src/services/supportService.ts` | 추가 | (front/adm 히스토리와 동일 파일 — 사용자용 `getSupportSettings()` 포함) |
| `frontend/src/types/index.ts` | 수정 | (front/adm 히스토리와 동일 — `SupportSettings` 인터페이스) |

### 수정 상세

#### `frontend/src/app/user/support/page.tsx`
- 변경 전: 파일 최상단 `const TOSS_SUPPORT_URL = ''; const KAKAOPAY_SUPPORT_URL = ''; const KAKAO_GIFT_WISHLIST_URL = '';` 상수를 `SUPPORT_CHANNELS` 배열이 직접 참조. 데이터 페칭 없음, 스켈레톤 미적용.
- 변경 후: 상수 3개 제거. `buildChannels(settings: SupportSettings | null)` 함수가 `settings?.tossUrl`/`kakaopayUrl`/`kakaoGiftUrl`(옵셔널 체이닝, `?? ''`)로 채널 목록을 생성. `useState<SupportSettings | null>(null)` + `useState(true)`(loading) 추가, `useEffect`에서 `supportService.getSupportSettings().then(...).catch(() => setSettings(null)).finally(() => setLoading(false))` — 조회 실패 시에도 페이지가 깨지지 않고 3개 카드 모두 "준비 중"으로 렌더(관대한 폴백, 기존 빈 문자열 동작과 동일한 결과).
- URL 비어있으면 "준비 중" 비활성 카드로 렌더하는 기존 로직(`isReady` 판정, `<a>`/`<div>` 분기)은 그대로 유지 — 데이터 출처만 코드 상수에서 API로 교체.
- 이유: 사용자 요청 — 실제 URL 값을 배포마다 코드 수정 없이 관리자가 직접 갱신할 수 있도록 함.

### 검증
- `npx tsc --noEmit` 통과.
- 백엔드 API가 실제로 새 값을 반환하는지는 백엔드 재기동 후 확인 필요(엔티티/컨트롤러 신규 추가로 재기동 필요 — 강제 종료 대신 사용자 확인 요청).

### 복원 방법
이 ID(HIST-20260722-002)로 복원 시 `frontend/src/app/user/support/page.tsx`를 HIST-20260722-001 시점(파일 상단 3개 상수 직접 참조, 데이터 페칭·스켈레톤 없음)으로 되돌린다.

---

## HIST-20260722-001

- **날짜**: 2026-07-22
- **수정 범위**: 사용자 프론트엔드 / 개발자 응원하기(후원) 신규 페이지
- **수정 개요**: 자발적 후원 안내 전용 페이지(`/user/support`) 신규 생성. PG 연동 없이 토스 송금·카카오페이·카카오톡 선물하기(위시리스트) 3개 외부 링크 카드로 안내. 상단에 고정 감사 문구, 하단에 "후원은 자발적 참여" 안내 문구 배치. 헤더 "도움말" 드롭다운 메뉴에 항목 추가(`UserLayoutShell.tsx`)로 진입, 배너·강제 노출 없음.
- **관련 작업**: 메뉴 실제 노출을 위한 백엔드 시딩은 `docs/history/back/usr/UserMenu_Modified.md`의 HIST-20260722-001 참고

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/support/page.tsx` | 추가 | 신규 페이지. 파일 상단 `TOSS_SUPPORT_URL`/`KAKAOPAY_SUPPORT_URL`/`KAKAO_GIFT_WISHLIST_URL` 상수(현재 빈 문자열 플레이스홀더)로 3개 채널을 정의, URL이 비어있으면 카드 비활성화("준비 중" 배지, `<div>`) + 값이 있으면 `<a target="_blank">` 링크로 자동 전환 |
| `frontend/src/components/layout/UserLayoutShell.tsx` | 수정 | `ICON_MAP`에 `support` 아이콘 추가, `USER_FALLBACK_NAV` 도움말 그룹에 `개발자 응원하기`(id 114, `/user/support`, order 5) 자식 추가, `ALWAYS_ALLOWED`에 `/user/support` 추가(메뉴 권한과 무관하게 로그인 사용자 항상 접근 가능) |

### 수정 상세

#### `frontend/src/app/user/support/page.tsx` (신규)
- 정적 콘텐츠 페이지(데이터 페칭 없음 — 스켈레톤 UI 미적용, 프로젝트 컨벤션 예외 없음: 페칭이 없는 화면이라 해당 없음).
- 상단: "TPMP를 이용해 주시고 응원해 주셔서 감사합니다. 여러분의 작은 후원이 서비스를 계속 운영하고 개선해 나가는 데 큰 힘이 됩니다." 고정 문구(강요 톤 없음).
- 하단: "후원은 순전히 자발적인 참여이며, 서비스 이용에 어떠한 영향도 주지 않습니다." 고정 안내.
- `SUPPORT_CHANNELS` 배열(토스/카카오페이/카카오 선물하기)을 순회 렌더 — `channel.url.trim().length > 0`이면 활성(`<a href={url} target="_blank" rel="noopener noreferrer">`), 아니면 비활성(`<div>` + 반투명 + "준비 중" 배지 + `cursor-not-allowed`).
- 후원자 배지·개인별 감사 인사 등 추적 기능 없음(요구사항대로 고정 문구만).
- 모바일 우선 반응형: `max-w-2xl mx-auto p-6`, 카드형 리스트 `space-y-3`(faq/settings 페이지와 동일한 `bg-white border border-gray-200 rounded-xl` 톤 유지, 배너·강조색 남발 없음).

#### `frontend/src/components/layout/UserLayoutShell.tsx`
- 변경 전: `ICON_MAP`에 `support` 키 없음. `USER_FALLBACK_NAV` 도움말 그룹 자식이 시험 정보/FAQ/1:1 문의/설정 4개. `ALWAYS_ALLOWED = ['/user/inquiries', '/user/settings']`.
- 변경 후: `ICON_MAP.support`(하트 모양 아이콘, `settings` 아이콘과 동일한 `stroke-width 1.8` 스타일) 추가. `USER_FALLBACK_NAV` 도움말 그룹에 `leaf(114, '개발자 응원하기', '/user/support', 'support', 5)` 추가. `ALWAYS_ALLOWED`에 `/user/support` 추가.
- 이유: 도움말 드롭다운에 항목을 추가해 진입 경로를 만들되(사용자 요청 — 눈에 띄지 않게), 실사용 시 네비게이션 데이터는 백엔드 `/menus/mine` API 결과만 사용하고 폴백은 API 실패 시에만 쓰이므로(`UserLayoutShell.tsx` 187~209행 로직), 동일 항목을 백엔드 `DataInitializer`에도 시딩해야 실제 드롭다운에 노출됨. 또한 접근 가드(`accessibleUrls` 기반)가 메뉴에 없는 경로를 "권한 없음" 처리해 `/user/inquiries`로 리다이렉트하므로, 후원 페이지는 계정/지원 성격상 메뉴 권한과 무관하게 항상 접근 가능해야 한다고 판단해 `ALWAYS_ALLOWED`에도 포함(설정·1:1 문의와 동일한 취급).

### 검증
- `npx tsc --noEmit` 통과 확인.
- 브라우저(크롬) — `user@tpmp.com` 로그인 후 `/user/support` 직접 접근 시 페이지 정상 렌더(감사 문구 + 3개 카드 "준비 중" 비활성 상태) 확인은 별도 진행. 도움말 드롭다운에서 "개발자 응원하기" 항목이 실제로 보이려면 백엔드(`DataInitializer`)가 재기동되어 메뉴 시딩이 반영되어야 함(백엔드는 로컬 gradle bootRun으로 이미 기동 중이라 강제 재시작 대신 사용자 확인 필요).

### 복원 방법
이 ID(HIST-20260722-001)만으로 복원 시 `frontend/src/app/user/support/page.tsx`를 삭제하고, `UserLayoutShell.tsx`에서 `ICON_MAP.support`, `USER_FALLBACK_NAV`의 `개발자 응원하기` 자식 항목, `ALWAYS_ALLOWED`의 `/user/support`를 제거한다(백엔드 메뉴 시딩 복원은 `UserMenu_Modified.md`의 HIST-20260722-001 절차를 함께 따른다).
