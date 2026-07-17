# Agent Handoff - CURRENT

## Current Goal

- 진행 중 작업 없음. 직전 작업 2건 커밋·푸시 완료.

## Completed (커밋)

- `8fe4850` [FE|BE] fix: 동일 브라우저 다중 계정 세션 오염 방지
  - refresh 쿠키를 role별 분리(`refresh_token_user` / `refresh_token_admin`) + `/auth/refresh` scope 파라미터 분기
  - FE가 refresh 응답 `user.email`을 `authEmail`과 대조해 불일치 시 저장 거부·로그아웃
  - `RefreshTokenCookieProvider` 신설(login·OAuth2 핸들러 공용), 레거시 `refresh_token` 쿠키는 로그인 시 즉시 만료
- `98d6bd2` [FE] feat: 복습 표시 목록에 문항 제목 표시 (제목 주 텍스트 + 내용 미리보기 보조 격하, 제목 없으면 폴백)

## Verification

- `./gradlew compileJava`: BUILD SUCCESSFUL
- `npx tsc --noEmit`: 오류 0건
- `git diff --stat`: 히스토리 3개 파일 모두 순수 prepend(삭제 0줄) 확인
- **미실시: 런타임 검증.** 아래 "남은 이슈" 참고.

## 남은 이슈 / 주의사항

- **런타임 미검증 (최우선)**: 백엔드 재시작 후 실제 로그인 → 쿠키 이름(`refresh_token_user`/`refresh_token_admin`) → `/auth/refresh?scope=` 흐름을 확인해야 한다. 복습 화면 제목 표시도 브라우저 육안 확인 미실시.
- **배포·재시작 후 열려 있는 탭은 1회 재로그인 필요** (레거시 쿠키 만료 → 새 이름으로 재발급).
- **알려진 제약**: 사용자 화면(`/user/*`)에서 admin 계정으로 로그인하면 15분 뒤 로그아웃된다. 쿠키는 role 기준(`refresh_token_admin`)인데 refresh scope는 경로 기준(`user`)이라 쿠키를 못 찾기 때문. 오염 대신 안전하게 실패하는 의도된 동작.
- `scope` 판정은 `/admin`(슬래시 없음), 기존 리다이렉트 판정은 `/admin/`(슬래시 포함)로 기준이 다름 — `apiClient.ts` 주석에 명시.
- **백엔드 `/api/auth/logout` 핸들러 부재**: 프론트 `authService.ts`가 호출 중이나 컨트롤러·SecurityConfig 어디에도 없어 404. 로그아웃해도 refresh 쿠키가 남는다. 별도 작업 필요(이번 범위 제외).
- **오염된 기존 데이터 보존 결정됨**: `quiz_history` admin(id=1) 919건 / user(id=2) 42건, `user_question_bookmarks` admin 48건 / user 2건. 사용자 화면에서 푼 기록이 admin에 쌓인 상태. 이관 재개 시 admin 기록 시작 시점(2026-06-24)을 기준으로 범위를 산정할 것.

## 다음 세션이 바로 실행할 명령

```powershell
cd C:\project\tpmp\test_preparation_master_project
# 백엔드 재시작 후 로그인 → 응답 Set-Cookie 이름이 role별로 갈리는지 확인
# 사용자·관리자 탭 동시 로그인 후 15분 경과 시 사용자 탭이 user 계정을 유지하는지 확인
```

## Do Not Touch

- DB 데이터 — 오염된 `quiz_history`·`user_question_bookmarks` 보존 결정됨.
- `codex-config-tui-notify.tmp` — 기존 미추적 파일(작업과 무관, 커밋 대상 아님).
- `.env` (로컬 전용, 커밋 금지).
- `references/images/*` — 사용자 참고 이미지(gitignore 상태), 삭제·이동 금지.
