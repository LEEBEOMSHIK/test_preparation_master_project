# Agent Handoff - CURRENT

## 현재 목표와 사용자 결정 사항

- 다른 Windows PC에서도 ChatGPT 데스크톱 앱의 Codex 승인·질문·완료 알림을 재현할 수 있게 문서와 PowerShell 패키지를 보관한다.
- 다른 PC에서는 `docs/codex-notifications/` 폴더를 복사한 뒤 `install.ps1`을 실행한다.
- PID는 복사하거나 수동 설정하지 않는다. watcher가 실행될 때 해당 PC의 PID를 자동 기록한다.
- 추가 확대 검증은 중단하고 현재 패키지와 사용 문서를 기준으로 마무리한다.

## 완료한 작업

- `$env:USERPROFILE` 기반 이식형 설치·감시·토스트·제거 스크립트 작성.
- `Get-StartApps` 기반 ChatGPT AUMID 탐색 및 복수 후보 시 `-AppId` 명시 안내.
- HKCU Run 숨김 자동 시작과 즉시 실행, PID 및 mutex 기반 중복 방지 적용.
- 승인 요청, `request_user_input`, 루트 세션 `task_complete` 감지 지원.
- JSON/비JSON 승인 입력을 모두 판정하도록 `Test-RequiresApproval` 적용.
- 다른 자동 시작 값과 프로세스를 덮어쓰거나 종료·삭제하지 않도록 소유권 검사 적용.
- JSONL append 경쟁, 미완성 줄, UTF-8 경계, 메타데이터 재시도, rolling 7일 cutoff 보완.
- 설치·테스트·로그·Windows 설정·문제 해결·업데이트·제거 절차를 README에 정리.

## 수정한 파일

- `docs/codex-notifications/README.md`
- `docs/codex-notifications/install.ps1`
- `docs/codex-notifications/uninstall.ps1`
- `docs/codex-notifications/codex-session-watcher.ps1`
- `docs/codex-notifications/codex-toast.ps1`
- `docs/agent-handoff/CURRENT.md`

## 검증 결과

- Windows PowerShell 5.1 AST parser: 4개 PS1 모두 통과.
- 4개 PS1의 UTF-8 BOM 확인.
- 독립 정적 재검증: 기존 7개 finding 해결, 신규 finding 없음.
- 고정 사용자 경로·고정 AUMID·HKLM 접근·광역 `.codex` 삭제 없음.
- 임시 USERPROFILE 동적 시험에서 기존 이벤트 미알림, 질문·완료 감지와 watcher ERROR 없음 확인.
- 동적 시험에서 발견한 JSON quoted key 승인 감지 결함은 `Test-RequiresApproval`로 수정했고 직접 판정 검증을 통과함.
- 사용자 요청에 따라 수정 후 전체 동적 재시험은 중단함. 실제 `install.ps1`, `uninstall.ps1`, HKCU Run, 실제 toast는 실행하지 않음.

## 실패·경고·주의사항

- 이 패키지는 공식 데스크톱 앱 이벤트 API가 아니라 `~/.codex/sessions/**/*.jsonl` 내부 형식에 의존한다.
- ChatGPT/Codex 업데이트 후 세션 필드가 바뀌면 세 이벤트를 다시 시험해야 한다.
- 공식 `notify`와 `tui.notifications`는 Codex CLI/TUI 설정이며 현재 확인한 데스크톱 앱 이벤트에는 안정적으로 연결되지 않았다.
- 테스트 임시 폴더 `C:\tmp\tpmp-watcher-test-20260717-01`에는 테스트 산출물과 종료된 PID 파일이 남아 있다.

## 다음 세션이 바로 실행할 명령

```powershell
Set-Location docs\codex-notifications
Set-ExecutionPolicy -Scope Process Bypass
.\install.ps1
```

ChatGPT AUMID 후보가 여러 개면 README 절차대로 `-AppId`를 지정한다.

## 건드리면 안 되는 파일 또는 기존 미추적 파일

- `frontend/src/lib/traceNotation.ts`
- `frontend/src/lib/traceNotation.test.ts`

위 두 파일은 기존 별도 작업이며 이번 알림 문서 작업에서 수정하지 않았다.
