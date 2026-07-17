param(
    [ValidateRange(250, 10000)]
    [int]$PollIntervalMs = 750,

    [string]$AppId = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$codexHome = Join-Path $env:USERPROFILE '.codex'
$sessionRoot = Join-Path $codexHome 'sessions'
$notificationDir = Join-Path $codexHome 'notifications'
$toastScript = Join-Path $notificationDir 'codex-toast.ps1'
$watcherLog = Join-Path $notificationDir 'codex-session-watcher.log'
$pidPath = Join-Path $notificationDir 'codex-session-watcher.pid'
$configPath = Join-Path $notificationDir 'codex-notifications.json'
$approvalPattern = '["'']?sandbox_permissions["'']?\s*:\s*["'']require_escalated["'']'

if ([string]::IsNullOrWhiteSpace($AppId) -and (Test-Path -LiteralPath $configPath)) {
    try {
        $config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
        $AppId = [string]$config.appId
    } catch {
        # The toast script will attempt Get-StartApps discovery if config is unreadable.
    }
}

$createdNew = $false
$mutex = New-Object System.Threading.Mutex(
    $true,
    'Local\OpenAICodexSessionNotificationWatcher',
    [ref]$createdNew
)
if (-not $createdNew) {
    Add-Content -LiteralPath $watcherLog -Encoding UTF8 -Value (
        '{0:o} INFO watcher-already-running' -f [DateTimeOffset]::Now
    )
    return
}

Set-Content -LiteralPath $pidPath -Encoding ASCII -Value ([string]$PID)

$positions = @{}
$remainders = @{}
$rootSessions = @{}
$metadataReady = @{}
$projectNames = @{}
$seenEvents = New-Object 'System.Collections.Generic.HashSet[string]'

function Write-WatcherLog {
    param([string]$Level, [string]$Message)
    Add-Content -LiteralPath $watcherLog -Encoding UTF8 -Value (
        '{0:o} {1} {2}' -f [DateTimeOffset]::Now, $Level, $Message
    )
}

function Read-SessionMetadata {
    param([string]$Path)

    $isRoot = $false
    $projectName = 'Codex'
    $script:rootSessions[$Path] = $false
    $script:metadataReady[$Path] = $false
    $script:projectNames[$Path] = $projectName
    try {
        $firstLine = Get-Content -LiteralPath $Path -TotalCount 1 -ErrorAction Stop
        if ([string]::IsNullOrWhiteSpace($firstLine)) {
            throw 'session metadata line is empty'
        }

        $record = $firstLine | ConvertFrom-Json
        if ([string]$record.type -ne 'session_meta' -or $null -eq $record.payload) {
            throw 'first JSONL record is not session_meta'
        }
        $parentProperty = $record.payload.PSObject.Properties['parent_thread_id']
        $parentThreadId = if ($null -eq $parentProperty) { '' } else { [string]$parentProperty.Value }
        $isRoot = [string]::IsNullOrWhiteSpace($parentThreadId)
        $cwdProperty = $record.payload.PSObject.Properties['cwd']
        $cwd = if ($null -eq $cwdProperty) { '' } else { [string]$cwdProperty.Value }
        if (-not [string]::IsNullOrWhiteSpace($cwd)) {
            $candidate = Split-Path -Leaf $cwd.TrimEnd('\')
            if (-not [string]::IsNullOrWhiteSpace($candidate)) {
                $projectName = $candidate
            }
        }

        $script:rootSessions[$Path] = $isRoot
        $script:projectNames[$Path] = $projectName
        $script:metadataReady[$Path] = $true
        return $true
    } catch {
        Write-WatcherLog 'WARN' ("metadata-read-failed path={0} error={1}" -f $Path, $_.Exception.Message)
        return $false
    }
}

function Get-ActiveSessionFiles {
    $activeCutoff = (Get-Date).AddDays(-7)
    return @(
        Get-ChildItem -LiteralPath $script:sessionRoot -Recurse -File -Filter '*.jsonl' -ErrorAction SilentlyContinue |
            Where-Object { $_.LastWriteTime -ge $activeCutoff }
    )
}

function Remove-StaleSessionState {
    param([System.IO.FileInfo[]]$ActiveFiles)

    $activePaths = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
    foreach ($file in $ActiveFiles) {
        $null = $activePaths.Add($file.FullName)
    }

    foreach ($path in @($script:positions.Keys)) {
        if (-not $activePaths.Contains([string]$path)) {
            $script:positions.Remove($path)
            $script:remainders.Remove($path)
            $script:rootSessions.Remove($path)
            $script:metadataReady.Remove($path)
            $script:projectNames.Remove($path)
        }
    }
}

function Test-RequiresApproval {
    param([string]$InputText)

    if ([string]::IsNullOrWhiteSpace($InputText)) {
        return $false
    }

    try {
        $inputObject = $InputText | ConvertFrom-Json -ErrorAction Stop
        $permissionProperty = $inputObject.PSObject.Properties['sandbox_permissions']
        if ($null -ne $permissionProperty) {
            return [string]$permissionProperty.Value -ceq 'require_escalated'
        }
        return $false
    } catch {
        # Older or partially written input may not be valid JSON. Accept quoted/unquoted key syntax only.
        return $InputText -match $script:approvalPattern
    }
}

function Send-CodexNotification {
    param([string]$EventName, [string]$Path, [string]$EventKey)

    if (-not $script:seenEvents.Add($EventKey)) {
        return
    }

    $projectName = [string]$script:projectNames[$Path]
    try {
        $toastArgs = @{ EventName = $EventName; ProjectName = $projectName }
        if (-not [string]::IsNullOrWhiteSpace($script:AppId)) {
            $toastArgs.AppId = $script:AppId
        }
        & $script:toastScript @toastArgs
        Write-WatcherLog 'DETECTED' ("event={0} key={1} project={2}" -f $EventName, $EventKey, $projectName)
    } catch {
        Write-WatcherLog 'ERROR' ("toast-failed event={0} error={1}" -f $EventName, $_.Exception.Message)
    }
}

function Process-SessionLine {
    param([string]$Path, [string]$Line)

    if ([string]::IsNullOrWhiteSpace($Line)) {
        return
    }

    try {
        $record = $Line | ConvertFrom-Json
        if ($record.type -eq 'response_item' -and $record.payload.type -eq 'custom_tool_call') {
            $inputText = [string]$record.payload.input
            $callId = [string]$record.payload.call_id
            if (Test-RequiresApproval $inputText) {
                Send-CodexNotification 'ApprovalRequested' $Path ("approval:{0}" -f $callId)
                return
            }

            if ([string]$record.payload.name -eq 'request_user_input') {
                Send-CodexNotification 'QuestionRequested' $Path ("question:{0}" -f $callId)
                return
            }
        }

        if ($record.type -eq 'event_msg' -and $record.payload.type -eq 'task_complete') {
            if ([bool]$script:metadataReady[$Path] -and [bool]$script:rootSessions[$Path]) {
                $timestamp = [string]$record.timestamp
                Send-CodexNotification 'TurnCompleted' $Path ("complete:{0}:{1}" -f $Path, $timestamp)
            }
        }
    } catch {
        Write-WatcherLog 'WARN' ("line-parse-failed path={0} error={1}" -f $Path, $_.Exception.Message)
    }
}

function Read-AppendedContent {
    param([System.IO.FileInfo]$File)

    $path = $File.FullName
    if (-not $script:positions.ContainsKey($path)) {
        $script:positions[$path] = [long]0
        $script:remainders[$path] = ''
        $script:rootSessions[$path] = $false
        $script:metadataReady[$path] = $false
        $script:projectNames[$path] = 'Codex'
    }
    if (-not [bool]$script:metadataReady[$path]) {
        $null = Read-SessionMetadata $path
    }

    $offset = [long]$script:positions[$path]
    $endOffset = [long]$File.Length
    if ($endOffset -lt $offset) {
        $offset = 0
        $script:remainders[$path] = ''
    }
    if ($endOffset -eq $offset) {
        return
    }

    $stream = $null
    $memory = $null
    try {
        $stream = New-Object System.IO.FileStream(
            $path,
            [System.IO.FileMode]::Open,
            [System.IO.FileAccess]::Read,
            [System.IO.FileShare]::ReadWrite
        )
        $null = $stream.Seek($offset, [System.IO.SeekOrigin]::Begin)
        $memory = New-Object System.IO.MemoryStream
        $buffer = New-Object byte[] 8192
        $remaining = $endOffset - $offset
        while ($remaining -gt 0) {
            $requested = [int][Math]::Min([long]$buffer.Length, $remaining)
            $read = $stream.Read($buffer, 0, $requested)
            if ($read -le 0) { break }
            $memory.Write($buffer, 0, $read)
            $remaining -= $read
        }
        $bytes = $memory.ToArray()
    } finally {
        if ($null -ne $memory) { $memory.Dispose() }
        if ($null -ne $stream) { $stream.Dispose() }
    }

    # Offset은 고정 endOffset이나 stream.Length가 아니라 마지막 완전한 LF 다음으로만 전진한다.
    # 따라서 scan 중 append된 바이트를 건너뛰지 않고 UTF-8 문자 중간에서 다음 decode를 시작하지 않는다.
    $lastNewlineIndex = -1
    for ($index = $bytes.Length - 1; $index -ge 0; $index--) {
        if ($bytes[$index] -eq 10) {
            $lastNewlineIndex = $index
            break
        }
    }
    if ($lastNewlineIndex -lt 0) { return }

    $completeLength = $lastNewlineIndex + 1
    $appended = [System.Text.Encoding]::UTF8.GetString($bytes, 0, $completeLength)
    $script:positions[$path] = $offset + $completeLength
    $script:remainders[$path] = ''

    foreach ($line in [regex]::Split($appended, '\n')) {
        Process-SessionLine $path $line.TrimEnd("`r")
    }
}

try {
    if (-not (Test-Path -LiteralPath $sessionRoot)) {
        New-Item -ItemType Directory -Path $sessionRoot -Force | Out-Null
    }
    if (-not (Test-Path -LiteralPath $toastScript)) {
        throw "Toast script not found: $toastScript"
    }

    $activeFiles = @(Get-ActiveSessionFiles)
    Remove-StaleSessionState $activeFiles
    foreach ($file in $activeFiles) {
        $positions[$file.FullName] = $file.Length
        $remainders[$file.FullName] = ''
        $rootSessions[$file.FullName] = $false
        $metadataReady[$file.FullName] = $false
        $projectNames[$file.FullName] = 'Codex'
        $null = Read-SessionMetadata $file.FullName
    }

    Write-WatcherLog 'INFO' (
        "watcher-started pid={0} tracked={1} pollMs={2}" -f $PID, $positions.Count, $PollIntervalMs
    )

    while ($true) {
        try {
            $activeFiles = @(Get-ActiveSessionFiles)
            Remove-StaleSessionState $activeFiles
            foreach ($file in $activeFiles) {
                Read-AppendedContent $file
            }
        } catch {
            Write-WatcherLog 'ERROR' ("scan-failed error={0}" -f $_.Exception.Message)
        }
        Start-Sleep -Milliseconds $PollIntervalMs
    }
} finally {
    try {
        if ((Test-Path -LiteralPath $pidPath) -and
                ((Get-Content -LiteralPath $pidPath -Raw).Trim() -eq [string]$PID)) {
            Remove-Item -LiteralPath $pidPath -Force
        }
    } catch {
        # PID cleanup failure is non-fatal.
    }
    if ($null -ne $mutex) {
        $mutex.ReleaseMutex()
        $mutex.Dispose()
    }
}
