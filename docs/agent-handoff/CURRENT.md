# Agent Handoff - CURRENT

이 파일은 세션 종료, 컨텍스트 압축, 다른 AI 또는 다른 세션 인계를 위한 현재 작업 상태 기록이다.
작업 단계 경계마다 갱신하고, 완료 후에도 마지막 커밋과 남은 이슈를 간단히 남긴다.
누적 로그가 아니라 최신 작업 1개의 상태 스냅샷으로 운영한다. 새 작업을 시작할 때 이전 내용을 이어 붙이지 말고 현재 작업 상태로 덮어쓴다.

## Current Goal

- 세션 인계 정책을 `AGENTS.md`, `CLAUDE.md`, Claude 상세 역할 문서에 정리하고, 이어받기용 템플릿을 추가한다.

## User Decisions

- 토큰이 끊기기 전 다른 AI/세션이 이어받을 수 있도록 장치를 둔다.
- 인계 방식은 `docs/agent-handoff/CURRENT.md` 중심으로 운영한다.
- 경계 기준은 탐색/설계/구현/검증/커밋 전후 같은 단계 체크포인트로 잡는다.
- `CURRENT.md`는 누적하지 않고 최신 작업 스냅샷으로 덮어쓴다.
- 장기 보관이 필요한 인계 기록만 `docs/agent-handoff/archive/`로 이동한다.

## Completed

- `AGENTS.md`에 Session Handoff Policy 추가.
- `CLAUDE.md`에 Session Handoff Policy 추가.
- `docs/claude-config/agent-roles.md`에 세션 인계 기준 추가.
- `docs/agent-handoff/CURRENT.md` 생성.
- `CURRENT.md` 스냅샷 운영 규칙 추가.

## In Progress

- 문서 변경 정적 확인 완료.

## Remaining

- 사용자 요청 시 커밋/푸시.

## Modified Files

- `AGENTS.md`
- `CLAUDE.md`
- `docs/claude-config/agent-roles.md`
- `docs/agent-handoff/CURRENT.md`

## Verification

- `rg -n "Session Handoff|세션 인계|CURRENT\\.md|Soft checkpoint|Hard checkpoint|중단 금지|Agent Handoff" AGENTS.md CLAUDE.md docs/claude-config/agent-roles.md docs/agent-handoff/CURRENT.md`: 정책 문구 위치 확인 완료.
- `rg -n "누적 로그|상태 스냅샷|덮어쓴다|archive|장기 보관" AGENTS.md CLAUDE.md docs/claude-config/agent-roles.md docs/agent-handoff/CURRENT.md`: `CURRENT.md` 스냅샷 운영 규칙 위치 확인 완료.
- `git diff --check`: 공백 오류 없음. 줄바꿈 변환 경고만 있음.
- 문서 변경이라 빌드/테스트는 실행하지 않음.

## Warnings / Notes

- 기존 미추적 `references/`는 이번 작업과 무관하므로 건드리지 않는다.
- 문서만 변경했으므로 `npm run build`, `npx tsc --noEmit`, `gradlew test`는 실행하지 않는다.

## Next Commands

```powershell
git status --short
git diff -- AGENTS.md CLAUDE.md docs/claude-config/agent-roles.md docs/agent-handoff/CURRENT.md
```

## Last Commit

- `4d0ef8d [INFRA] docs: 에이전트 탐색 비용 규칙 정리`
