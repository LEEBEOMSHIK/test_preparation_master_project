[CmdletBinding()]
param(
    [switch]$RemoveLogs,

    [ValidatePattern('^[A-Za-z0-9_.-]+$')]
    [string]$RunValueName = 'OpenAICodexSessionNotificationWatcher'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Stop-InstalledWatcher {
    param([string]$WatcherPath, [string]$PidPath)

    if (-not (Test-Path -LiteralPath $PidPath)) {
        return
    }
    $rawPid = (Get-Content -LiteralPath $PidPath -Raw -ErrorAction SilentlyContinue).Trim()
    $watcherPid = 0
    if ([int]::TryParse($rawPid, [ref]$watcherPid)) {
        $process = Get-CimInstance Win32_Process -Filter "ProcessId = $watcherPid" -ErrorAction SilentlyContinue
        if ($null -ne $process -and
                (Test-WatcherCommand ([string]$process.CommandLine) $WatcherPath ([string]$process.Name))) {
            Stop-Process -Id $watcherPid -Force -ErrorAction Stop
            Start-Sleep -Milliseconds 250
        }
    }
    Remove-Item -LiteralPath $PidPath -Force -ErrorAction SilentlyContinue
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

if ([string]::IsNullOrWhiteSpace($env:USERPROFILE)) {
    throw 'USERPROFILE 환경 변수를 확인할 수 없습니다.'
}

$targetDir = Join-Path $env:USERPROFILE '.codex\notifications'
$watcherPath = Join-Path $targetDir 'codex-session-watcher.ps1'
$pidPath = Join-Path $targetDir 'codex-session-watcher.pid'
$configPath = Join-Path $targetDir 'codex-notifications.json'
$runKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'

if ((Test-Path -LiteralPath $configPath) -and -not $PSBoundParameters.ContainsKey('RunValueName')) {
    try {
        $config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
        $configuredRunValueName = [string]$config.runValueName
        if ($configuredRunValueName -match '^[A-Za-z0-9_.-]+$') {
            $RunValueName = $configuredRunValueName
        } elseif (-not [string]::IsNullOrWhiteSpace($configuredRunValueName)) {
            Write-Warning '설정 파일의 runValueName 형식이 안전하지 않아 기본 Run 값 이름을 사용합니다.'
        }
    } catch {
        Write-Warning "설정 파일을 읽지 못해 기본 Run 값 이름을 사용합니다: $($_.Exception.Message)"
    }
}

Stop-InstalledWatcher $watcherPath $pidPath

$runValueRemoved = $false
$runValuePreserved = $false
if (Test-Path -LiteralPath $runKey) {
    $runValues = Get-ItemProperty -LiteralPath $runKey -ErrorAction SilentlyContinue
    $runEntry = if ($null -eq $runValues) { $null } else { $runValues.PSObject.Properties[$RunValueName] }
    if ($null -ne $runEntry) {
        $runCommand = [string]$runEntry.Value
        if (Test-WatcherCommand $runCommand $watcherPath) {
            Remove-ItemProperty -LiteralPath $runKey -Name $RunValueName -ErrorAction Stop
            $runValueRemoved = $true
        } else {
            $runValuePreserved = $true
            Write-Warning "HKCU Run\$RunValueName 값이 설치 watcher 전용 명령과 일치하지 않아 보존합니다."
        }
    }
}

$installedFiles = @(
    (Join-Path $targetDir 'codex-session-watcher.ps1'),
    (Join-Path $targetDir 'codex-toast.ps1'),
    (Join-Path $targetDir 'codex-notifications.json'),
    (Join-Path $targetDir 'codex-session-watcher.pid'),
    (Join-Path $targetDir 'uninstall.ps1')
)
foreach ($file in $installedFiles) {
    Remove-Item -LiteralPath $file -Force -ErrorAction SilentlyContinue
}

if ($RemoveLogs) {
    Remove-Item -LiteralPath (Join-Path $targetDir 'codex-session-watcher.log') -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath (Join-Path $targetDir 'codex-toast.log') -Force -ErrorAction SilentlyContinue
}

if ((Test-Path -LiteralPath $targetDir) -and
        @(Get-ChildItem -LiteralPath $targetDir -Force -ErrorAction SilentlyContinue).Count -eq 0) {
    Remove-Item -LiteralPath $targetDir -Force -ErrorAction SilentlyContinue
}

if ($runValueRemoved) {
    Write-Host "Removed startup value: HKCU Run\$RunValueName"
} elseif ($runValuePreserved) {
    Write-Host "Preserved unrelated startup value: HKCU Run\$RunValueName"
} else {
    Write-Host "Startup value was not present: HKCU Run\$RunValueName"
}
Write-Host 'Removed only the notification watcher files installed by this package.'
if ($RemoveLogs) {
    Write-Host 'Watcher and toast logs were removed.'
} else {
    Write-Host "Logs were preserved under: $targetDir"
}
