[CmdletBinding()]
param(
    [string]$AppId = '',

    [ValidateRange(250, 10000)]
    [int]$PollIntervalMs = 750,

    [ValidatePattern('^[A-Za-z0-9_.-]+$')]
    [string]$RunValueName = 'OpenAICodexSessionNotificationWatcher'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Resolve-ChatGptAppId {
    param([string]$ExplicitAppId)

    if (-not [string]::IsNullOrWhiteSpace($ExplicitAppId)) {
        return $ExplicitAppId.Trim()
    }

    $candidates = @(
        Get-StartApps -ErrorAction Stop |
            Where-Object { $_.Name -match '(?i)ChatGPT' -or $_.AppID -match '(?i)ChatGPT' }
    )
    if ($candidates.Count -eq 0) {
        throw 'Get-StartApps에서 ChatGPT AUMID를 찾지 못했습니다. install.ps1 -AppId ''<이 PC의 AUMID>''로 다시 실행하세요.'
    }

    $exact = @($candidates | Where-Object { $_.Name -eq 'ChatGPT' })
    if ($exact.Count -eq 1) {
        return [string]$exact[0].AppID
    }
    if ($exact.Count -eq 0 -and $candidates.Count -eq 1) {
        return [string]$candidates[0].AppID
    }

    $candidateList = ($candidates | ForEach-Object {
        '  - Name={0}; AppID={1}' -f $_.Name, $_.AppID
    }) -join [Environment]::NewLine
    throw (("ChatGPT AUMID 후보가 여러 개라 자동 선택할 수 없습니다.`n{0}`n" +
        "install.ps1 -AppId '<사용할 AUMID>'로 명시하세요.") -f $candidateList)
}

function Get-WatcherFileArgument {
    param([string]$CommandLine)

    if ([string]::IsNullOrWhiteSpace($CommandLine)) { return $null }
    $match = [regex]::Match(
        $CommandLine,
        '(?i)(?:^|\s)-File\s+(?:"(?<quoted>[^"]+)"|(?<bare>\S+))'
    )
    if (-not $match.Success) { return $null }
    if ($match.Groups['quoted'].Success) {
        return $match.Groups['quoted'].Value
    }
    return $match.Groups['bare'].Value
}

function Test-WatcherCommand {
    param([string]$CommandLine, [string]$WatcherPath, [string]$ProcessName = '')

    if (-not [string]::IsNullOrWhiteSpace($ProcessName) -and $ProcessName -ine 'powershell.exe') {
        return $false
    }
    if ([string]::IsNullOrWhiteSpace($ProcessName) -and
            $CommandLine -notmatch '^\s*"[^"]*\\powershell\.exe"\s+') {
        return $false
    }
    $fileArgument = Get-WatcherFileArgument $CommandLine
    if ([string]::IsNullOrWhiteSpace($fileArgument)) { return $false }
    try {
        return [string]::Equals(
            [System.IO.Path]::GetFullPath($fileArgument),
            [System.IO.Path]::GetFullPath($WatcherPath),
            [StringComparison]::OrdinalIgnoreCase
        )
    } catch {
        return $false
    }
}

function Stop-InstalledWatcher {
    param([string]$WatcherPath, [string]$PidPath)

    if (-not (Test-Path -LiteralPath $PidPath)) {
        return
    }

    $rawPid = (Get-Content -LiteralPath $PidPath -Raw -ErrorAction SilentlyContinue).Trim()
    $watcherPid = 0
    if (-not [int]::TryParse($rawPid, [ref]$watcherPid)) {
        Remove-Item -LiteralPath $PidPath -Force -ErrorAction SilentlyContinue
        return
    }

    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $watcherPid" -ErrorAction SilentlyContinue
    if ($null -ne $process -and
            (Test-WatcherCommand ([string]$process.CommandLine) $WatcherPath ([string]$process.Name))) {
        Stop-Process -Id $watcherPid -Force -ErrorAction Stop
        Start-Sleep -Milliseconds 250
    }
    Remove-Item -LiteralPath $PidPath -Force -ErrorAction SilentlyContinue
}

if ($env:OS -ne 'Windows_NT') {
    throw '이 설치 스크립트는 Windows 전용입니다.'
}
if ([string]::IsNullOrWhiteSpace($env:USERPROFILE)) {
    throw 'USERPROFILE 환경 변수를 확인할 수 없습니다.'
}

$resolvedAppId = Resolve-ChatGptAppId $AppId
if ($resolvedAppId.Contains('"')) {
    throw 'AppId에 큰따옴표를 사용할 수 없습니다.'
}

$targetDir = Join-Path $env:USERPROFILE '.codex\notifications'
$watcherPath = Join-Path $targetDir 'codex-session-watcher.ps1'
$toastPath = Join-Path $targetDir 'codex-toast.ps1'
$uninstallPath = Join-Path $targetDir 'uninstall.ps1'
$configPath = Join-Path $targetDir 'codex-notifications.json'
$pidPath = Join-Path $targetDir 'codex-session-watcher.pid'
$runKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'

$sourceFiles = @(
    (Join-Path $PSScriptRoot 'codex-session-watcher.ps1'),
    (Join-Path $PSScriptRoot 'codex-toast.ps1'),
    (Join-Path $PSScriptRoot 'uninstall.ps1')
)
foreach ($sourceFile in $sourceFiles) {
    if (-not (Test-Path -LiteralPath $sourceFile)) {
        throw "설치 원본 파일이 없습니다: $sourceFile"
    }
}

if (Test-Path -LiteralPath $runKey) {
    $runValues = Get-ItemProperty -LiteralPath $runKey -ErrorAction SilentlyContinue
    $existingRunEntry = if ($null -eq $runValues) {
        $null
    } else {
        $runValues.PSObject.Properties[$RunValueName]
    }
    if ($null -ne $existingRunEntry -and
            -not (Test-WatcherCommand ([string]$existingRunEntry.Value) $watcherPath)) {
        throw "HKCU Run\$RunValueName 값이 다른 명령에 사용 중입니다. 값을 보존했으며 설치를 중단합니다."
    }
}

New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
Stop-InstalledWatcher $watcherPath $pidPath

foreach ($sourceFile in $sourceFiles) {
    $destination = Join-Path $targetDir (Split-Path -Leaf $sourceFile)
    if (-not [string]::Equals(
            [System.IO.Path]::GetFullPath($sourceFile),
            [System.IO.Path]::GetFullPath($destination),
            [StringComparison]::OrdinalIgnoreCase)) {
        Copy-Item -LiteralPath $sourceFile -Destination $destination -Force
    }
}

@{
    appId = $resolvedAppId
    pollIntervalMs = $PollIntervalMs
    runValueName = $RunValueName
    installedAt = [DateTimeOffset]::Now.ToString('o')
} | ConvertTo-Json | Set-Content -LiteralPath $configPath -Encoding UTF8

$powershellPath = (Get-Command powershell.exe -ErrorAction Stop).Source
$runCommand = '"{0}" -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "{1}" -AppId "{2}" -PollIntervalMs {3}' -f
    $powershellPath, $watcherPath, $resolvedAppId, $PollIntervalMs

New-Item -Path $runKey -Force | Out-Null
New-ItemProperty -Path $runKey -Name $RunValueName -PropertyType String -Value $runCommand -Force | Out-Null

$startArgs = @(
    '-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-ExecutionPolicy', 'Bypass',
    '-File', ('"{0}"' -f $watcherPath),
    '-AppId', ('"{0}"' -f $resolvedAppId),
    '-PollIntervalMs', [string]$PollIntervalMs
)
Start-Process -FilePath $powershellPath -ArgumentList $startArgs -WindowStyle Hidden | Out-Null
Start-Sleep -Milliseconds 500

Write-Host "Installed: $targetDir"
Write-Host "ChatGPT AUMID: $resolvedAppId"
Write-Host "Startup value: HKCU Run\$RunValueName"
if (Test-Path -LiteralPath $pidPath) {
    Write-Host "Watcher started. PID: $((Get-Content -LiteralPath $pidPath -Raw).Trim())"
} else {
    Write-Warning "Watcher PID file was not created. Check $targetDir\codex-session-watcher.log"
}
