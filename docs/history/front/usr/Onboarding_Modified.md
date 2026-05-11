## HIST-20260511-001

- **날짜**: 2026-05-11
- **수정 범위**: 사용자 프론트엔드 / 온보딩
- **수정 개요**: 온보딩 표시 조건을 `isFirstLogin` 플래그 기반에서 `user_interested_exam` 테이블 데이터 유무 기반으로 변경

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/login/page.tsx` | 수정 | 온보딩 리다이렉트 조건 변경 |
| `frontend/src/app/auth/oauth/callback/page.tsx` | 수정 | 온보딩 리다이렉트 조건 변경 (OAuth 로그인) |

### 수정 상세

#### `frontend/src/app/user/login/page.tsx`
- 변경 전: `if (user.isFirstLogin) { router.push('/onboarding'); }`
- 변경 후: `if (!user.interestedExamSlaveIds || user.interestedExamSlaveIds.length === 0) { router.push('/onboarding'); }`
- 이유: DB에 관심 시험 유형 데이터가 없을 때만 온보딩이 표시되어야 함. `isFirstLogin` 플래그는 `handleSkip`에서 갱신되지 않아 매 로그인마다 온보딩이 표시되는 버그가 있었음

#### `frontend/src/app/auth/oauth/callback/page.tsx`
- 변경 전: `else if (user.isFirstLogin) { router.push('/onboarding'); }`
- 변경 후: `else if (!user.interestedExamSlaveIds || user.interestedExamSlaveIds.length === 0) { router.push('/onboarding'); }`
- 이유: 일반 로그인과 동일한 조건 적용 (Google OAuth 로그인 경로)

### 동작 변경 요약

| 상황 | 변경 전 | 변경 후 |
|------|---------|---------|
| 최초 로그인 (관심 유형 없음) | isFirstLogin=true → 온보딩 | interestedExamSlaveIds=[] → 온보딩 |
| "시작하기" 클릭 후 로그인 | isFirstLogin=false → 메인 | interestedExamSlaveIds=[...] → 메인 |
| "나중에 설정하기" 클릭 후 로그인 | isFirstLogin=true → 온보딩 (버그) | interestedExamSlaveIds=[] → 온보딩 (의도된 동작) |
| Docker 볼륨 삭제 후 재생성 | isFirstLogin=true → 온보딩 | interestedExamSlaveIds=[] → 온보딩 |

### 복원 방법

HIST-20260511-001 복원 시:
- `user/login/page.tsx`: `!user.interestedExamSlaveIds || user.interestedExamSlaveIds.length === 0` → `user.isFirstLogin`
- `auth/oauth/callback/page.tsx`: 동일하게 `user.interestedExamSlaveIds` 조건 → `user.isFirstLogin`
