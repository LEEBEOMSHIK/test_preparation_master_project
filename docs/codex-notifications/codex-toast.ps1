param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('ApprovalRequested', 'QuestionRequested', 'TurnCompleted')]
    [string]$EventName,

    [string]$ProjectName = '',

    [string]$AppId = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$notificationDir = Join-Path $env:USERPROFILE '.codex\notifications'
$logPath = Join-Path $notificationDir 'codex-toast.log'

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
        throw 'Get-StartApps에서 ChatGPT AUMID를 찾지 못했습니다. -AppId 인자로 이 PC의 AUMID를 지정하세요.'
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
        "-AppId '<사용할 AUMID>'로 명시하세요.") -f $candidateList)
}

try {
    if (-not (Test-Path -LiteralPath $notificationDir)) {
        New-Item -ItemType Directory -Path $notificationDir -Force | Out-Null
    }
    if ([string]::IsNullOrWhiteSpace($ProjectName)) {
        $ProjectName = Split-Path -Leaf ((Get-Location).Path.TrimEnd('\'))
    }
    if ([string]::IsNullOrWhiteSpace($ProjectName)) {
        $ProjectName = 'Codex'
    }

    $resolvedAppId = Resolve-ChatGptAppId $AppId
    switch ($EventName) {
        'ApprovalRequested' {
            $title = 'Codex approval required'
            $message = "Review the permission request in ChatGPT. Project: $ProjectName"
        }
        'QuestionRequested' {
            $title = 'Codex needs input'
            $message = "Review the question in ChatGPT. Project: $ProjectName"
        }
        default {
            $title = 'Codex task completed'
            $message = "The current Codex turn has finished. Project: $ProjectName"
        }
    }

    $safeTitle = [System.Security.SecurityElement]::Escape($title)
    $safeMessage = [System.Security.SecurityElement]::Escape($message)
    $toastXml = @"
<toast duration="long">
  <visual>
    <binding template="ToastGeneric">
      <text>$safeTitle</text>
      <text>$safeMessage</text>
    </binding>
  </visual>
  <audio src="ms-winsoundevent:Notification.Default" />
</toast>
"@

    $null = [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime]
    $null = [Windows.UI.Notifications.ToastNotification, Windows.UI.Notifications, ContentType = WindowsRuntime]
    $null = [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime]

    $xmlDocument = New-Object Windows.Data.Xml.Dom.XmlDocument
    $xmlDocument.LoadXml($toastXml)
    $toast = New-Object Windows.UI.Notifications.ToastNotification $xmlDocument
    $notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($resolvedAppId)
    $notifier.Show($toast)

    Add-Content -LiteralPath $logPath -Encoding UTF8 -Value (
        '{0:o} SUCCESS {1} project={2} appId={3}' -f
            [DateTimeOffset]::Now, $EventName, $ProjectName, $resolvedAppId
    )
} catch {
    try {
        Add-Content -LiteralPath $logPath -Encoding UTF8 -Value (
            '{0:o} ERROR {1} {2}' -f [DateTimeOffset]::Now, $EventName, $_.Exception.Message
        )

        $fallback = New-Object -ComObject WScript.Shell
        $null = $fallback.Popup(
            "Codex event: $EventName`nProject: $ProjectName`n$($_.Exception.Message)",
            10,
            'Codex notification',
            64
        )
    } catch {
        # Notification failures must never block Codex or the watcher.
    }
}
