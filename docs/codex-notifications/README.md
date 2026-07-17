# Windows Codex 데스크톱 토스트 알림

이 폴더는 다른 Windows PC에서도 ChatGPT 데스크톱 앱의 Codex 작업에 대해 다음 세 가지 토스트를 재현하기 위한 이식 가능한 설치 패키지다.

1. `ApprovalRequested`: 샌드박스 권한 승인이 필요할 때
2. `QuestionRequested`: Codex가 사용자 입력을 요청할 때
3. `TurnCompleted`: 루트 세션의 현재 작업 턴이 완료될 때

모든 설치 경로는 현재 사용자의 `$env:USERPROFILE`을 기준으로 계산한다. 특정 사용자명이나 현재 PC의 AUMID를 기본값으로 포함하지 않는다.

## 왜 JSONL watcher를 사용하는가

Codex 공식 [`config.toml` 설정 레퍼런스](https://developers.openai.com/codex/config-reference)는 다음 설정을 제공한다.

- `notify`: Codex가 JSON payload를 전달하며 실행하는 외부 명령
- `tui.notifications`: Codex CLI의 터미널 UI 알림을 켜거나 이벤트 유형을 제한하는 설정
- `tui.notification_method`, `tui.notification_condition`: 터미널 알림 방식과 포커스 조건

이 설정들은 CLI/TUI 환경의 공식 알림 경로다. 현재 확인한 ChatGPT Windows 데스크톱 앱의 Codex 승인 요청·사용자 질문·작업 완료 이벤트에는 `notify`나 `tui.notifications`가 안정적으로 연결되지 않았다. 따라서 이 패키지는 공식 설정을 대체하거나 수정하지 않고, 로컬 `~/.codex/sessions/**/*.jsonl`에 추가되는 내부 이벤트를 읽는 우회책을 사용한다.

이 결론 중 설정 키의 존재와 의미는 공식 문서에 근거한다. 데스크톱 앱에서 안정적으로 호출되지 않는다는 부분은 현재 설치본에서 확인한 동작상의 한계이며 공식 보장 사항이 아니다.

## 요구 사항

- Windows 10/11
- Windows PowerShell 5.1 이상
- ChatGPT Windows 데스크톱 앱 설치 및 시작 메뉴 등록
- 현재 사용자에게 `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` 쓰기 권한
- Codex 세션이 `$env:USERPROFILE\.codex\sessions`에 JSONL을 기록하는 설치 형태

관리자 권한은 필요하지 않다. 설치와 자동 시작 등록은 모두 현재 사용자 범위다.

## 설치

PowerShell에서 이 폴더로 이동한 뒤 실행한다.

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\install.ps1
```

설치 스크립트는 다음 작업을 수행한다.

1. `Get-StartApps`에서 이름 또는 AppID에 `ChatGPT`가 포함된 항목을 찾는다. `Name=ChatGPT`가 정확히 하나이거나 전체 후보가 하나일 때만 자동 선택한다.
2. watcher, toast, uninstall 스크립트를 `$env:USERPROFILE\.codex\notifications`에 복사한다.
3. 선택한 AUMID와 polling 주기를 `codex-notifications.json`에 기록한다.
4. 이전 설치 watcher가 `powershell.exe`이며 `-File` 인자의 정규화 경로가 설치 watcher와 정확히 일치할 때만 종료한다.
5. 같은 이름의 `HKCU` Run 값이 이미 다른 명령에 사용 중이면 덮어쓰지 않고 설치를 중단한다. 기존 값이 설치 watcher 전용 명령일 때만 갱신한다.
6. `HKCU` Run에 숨김 PowerShell 시작 명령을 등록한다.
7. watcher를 즉시 숨김 상태로 시작한다.

watcher 자체도 이름 있는 mutex를 사용하므로 같은 Windows 로그인 세션에서 중복 실행되지 않는다.

### AUMID 자동 탐색이 실패하거나 후보가 모호할 때

일부 설치 방식에서는 ChatGPT가 `Get-StartApps`에 나타나지 않거나 여러 배포 채널의 후보가 함께 나타난다. 스크립트는 복수 후보의 첫 항목을 임의 선택하지 않고 Name/AppID 목록과 `-AppId` 안내를 출력하며 중단한다. 먼저 후보를 확인한다.

```powershell
Get-StartApps |
  Where-Object { $_.Name -match 'ChatGPT' -or $_.AppID -match 'ChatGPT' } |
  Format-Table Name, AppID -AutoSize
```

PC에서 확인한 AUMID를 명시적으로 전달한다.

```powershell
.\install.ps1 -AppId '<이 PC에서 확인한 ChatGPT AUMID>'
```

고정 AUMID를 다른 PC에 복사하지 않는다. Microsoft Store/배포 방식과 앱 버전에 따라 값이 달라질 수 있다.

### Polling 주기 변경

기본값은 750ms이며 250~10000ms 범위에서 바꿀 수 있다.

```powershell
.\install.ps1 -PollIntervalMs 1000
```

## 알림 테스트

설치 후 각 이벤트 토스트를 직접 시험할 수 있다. 설정 파일의 AUMID를 사용하려면 다음처럼 실행한다.

```powershell
$notificationDir = Join-Path $env:USERPROFILE '.codex\notifications'
$config = Get-Content (Join-Path $notificationDir 'codex-notifications.json') -Raw | ConvertFrom-Json

& (Join-Path $notificationDir 'codex-toast.ps1') `
  -EventName ApprovalRequested -ProjectName 'notification-test' -AppId $config.appId
& (Join-Path $notificationDir 'codex-toast.ps1') `
  -EventName QuestionRequested -ProjectName 'notification-test' -AppId $config.appId
& (Join-Path $notificationDir 'codex-toast.ps1') `
  -EventName TurnCompleted -ProjectName 'notification-test' -AppId $config.appId
```

그다음 ChatGPT Codex에서 다음 상황을 실제로 만들어 본다.

- 권한 상승이 필요한 명령 실행 요청
- 선택지가 있는 사용자 입력 요청
- 일반 작업 턴 완료

설치 시 이미 존재하던 JSONL은 끝 위치부터 감시하므로 과거 이벤트를 다시 알리지 않는다. watcher 실행 후 새로 생성된 세션 파일은 처음부터 처리한다.

## Windows 알림 설정

토스트가 생성되었는데 화면에 보이지 않으면 Windows 설정을 확인한다.

1. **설정 → 시스템 → 알림**에서 알림을 켠다.
2. 앱별 알림 목록에서 **ChatGPT** 알림, 배너, 알림 센터 표시, 소리를 허용한다.
3. **방해 금지** 또는 집중 지원 규칙이 ChatGPT 알림을 숨기지 않는지 확인한다.
4. 회사 관리 PC라면 그룹 정책이나 보안 제품이 Windows Runtime toast 또는 HKCU Run을 차단하는지 관리자에게 확인한다.

토스트는 발견한 ChatGPT AUMID를 발신 앱 ID로 사용한다. ChatGPT가 시작 메뉴에 등록되지 않았거나 AUMID가 틀리면 Windows Runtime toast가 실패하고 10초짜리 `WScript.Shell.Popup`으로 폴백한다.

## 로그와 상태 확인

설치 디렉터리:

```text
%USERPROFILE%\.codex\notifications
```

주요 파일:

- `codex-session-watcher.log`: watcher 시작, 이벤트 감지, JSONL/토스트 오류
- `codex-toast.log`: toast 성공/실패와 사용한 AUMID
- `codex-session-watcher.pid`: 현재 watcher PID
- `codex-notifications.json`: 설치 시 탐색한 AUMID, polling 주기, Run 값 이름

최근 로그 확인:

```powershell
$dir = Join-Path $env:USERPROFILE '.codex\notifications'
Get-Content (Join-Path $dir 'codex-session-watcher.log') -Tail 50
Get-Content (Join-Path $dir 'codex-toast.log') -Tail 50
Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' |
  Select-Object OpenAICodexSessionNotificationWatcher
```

## 문제 해결

### 설치 직후 watcher가 시작되지 않음

- `codex-session-watcher.log`와 PID 파일을 확인한다.
- 회사 정책이 `powershell.exe -ExecutionPolicy Bypass` 또는 HKCU Run을 막는지 확인한다.
- 기존 watcher가 있으면 mutex가 두 번째 실행을 종료하며 로그에 `watcher-already-running`을 남긴다.
- 업데이트 설치는 PID 파일과 실제 프로세스 명령행이 모두 설치 watcher를 가리킬 때만 이전 프로세스를 종료한다.
- 프로세스 이름이 `powershell.exe`이고 파싱한 `-File` 인자의 정규화 경로가 설치 watcher와 정확히 같아야 종료하므로, 경로 일부가 비슷한 다른 PowerShell 프로세스는 종료하지 않는다.

### toast 로그는 성공인데 배너가 없음

- Windows 알림과 ChatGPT 앱별 알림을 켠다.
- 방해 금지/집중 지원을 끄고 다시 시험한다.
- `codex-notifications.json`의 `appId`와 현재 `Get-StartApps` 결과가 같은지 비교한다.
- ChatGPT 업데이트 후 AUMID가 달라졌다면 설치 스크립트를 다시 실행한다.

### 승인 또는 질문 알림만 감지되지 않음

- watcher 로그에 `line-parse-failed`가 있는지 확인한다.
- `$env:USERPROFILE\.codex\sessions` 아래 최신 JSONL의 수정 시간이 갱신되는지 확인한다.
- ChatGPT/Codex 업데이트로 내부 이벤트의 `type`, `payload.name`, `payload.input` 구조가 바뀌었을 수 있다.

### 완료 알림이 너무 많거나 없음

- 완료 알림은 subagent가 아니라 `parent_thread_id`가 없는 루트 세션의 `task_complete`만 대상으로 한다.
- 내부 메타데이터 형식이 바뀌어 루트 판별이 실패하면 로그의 `metadata-read-failed`를 확인한다.

## 업데이트

저장소의 이 폴더를 최신 버전으로 받은 뒤 `install.ps1`을 다시 실행한다. 기존 watcher를 정확한 PID/명령행으로 확인해 종료하고 스크립트를 덮어쓴 다음 즉시 다시 시작한다. 로그 파일은 덮어쓰거나 삭제하지 않는다.

ChatGPT 또는 Codex 업데이트 후에는 반드시 세 이벤트를 다시 시험한다. 이 패키지는 공개 API가 아니라 내부 JSONL 필드에 의존하므로 다음 변경으로 깨질 수 있다.

- 세션 저장 경로 또는 파일 확장자 변경
- `response_item`, `custom_tool_call`, `event_msg`, `task_complete` 이름 변경
- 승인 요청 input의 `sandbox_permissions` 표현 변경. 현재는 input JSON을 먼저 파싱해 값이 정확히 `require_escalated`인지 비교하고, JSON 파싱 실패 시 quoted/unquoted key 정규식으로만 폴백한다.
- `request_user_input` 도구 이름 변경
- 최초 `session_meta` payload의 `cwd` 또는 `parent_thread_id` 변경

watcher는 매 scan 시점의 현재 시각에서 7일을 다시 계산하고, 범위 밖으로 나간 파일의 offset·부분행·root/meta/project 상태를 메모리에서 제거한다. JSONL append를 읽을 때는 scan 시작 시의 파일 끝을 고정하고 마지막 완전한 개행까지만 offset을 전진하므로, 읽는 도중 추가된 이벤트나 UTF-8 중간 바이트를 다음 scan에서 건너뛰지 않는다.

## 제거

저장소 사본 또는 설치 디렉터리의 제거 스크립트를 실행한다.

```powershell
.\uninstall.ps1
```

기본 제거는 다음만 수행한다.

- PID와 실제 명령행이 설치 watcher를 가리키는 프로세스 종료
- 이 패키지가 사용하는 이름의 HKCU Run 값 중, 값 자체가 설치된 고정 watcher 경로를 `-File`로 실행하는 숨김 PowerShell 명령과 일치할 때만 제거
- 설치한 watcher/toast/uninstall/config/PID 파일 제거
- watcher/toast 로그 보존

로그까지 제거하려면 다음 옵션을 사용한다.

```powershell
.\uninstall.ps1 -RemoveLogs
```

알 수 없는 파일이나 `$env:USERPROFILE\.codex`의 다른 설정·세션·로그는 삭제하지 않는다.
같은 Run 값 이름을 다른 프로그램이 덮어쓴 경우에는 경고를 출력하고 해당 값을 보존한다.

## 스크립트 인코딩과 호환성 검증

배포하는 네 개의 `.ps1`은 Windows PowerShell 5.1이 한글 문자열을 안정적으로 읽도록 UTF-8 BOM으로 저장한다. 저장소 변경 후에는 PowerShell AST parser로 네 파일을 모두 검사하고, 선두 바이트가 `EF BB BF`인지 확인한다.

## 보안·개인정보 메모

- watcher는 로컬 세션 JSONL을 읽기 전용으로 열고 네트워크로 전송하지 않는다.
- 로그에는 이벤트 종류, 이벤트 키, 프로젝트 폴더명, AUMID, 오류 메시지가 기록될 수 있다.
- toast 본문에는 프롬프트나 답안 전문을 넣지 않는다.
- Run 등록은 현재 사용자 범위이며 제거 스크립트가 동일한 값만 삭제한다.
