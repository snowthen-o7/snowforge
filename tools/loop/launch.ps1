# SnowForge loop kit: Task Scheduler entry point for an unattended overnight run (2026-10-05).
#
# A loop launched from an interactive Claude Code session dies with that session, and schtasks /TR
# mangles quoted inline commands, so a scheduled task runs this file with a hidden window instead.
# Register it with NO trigger: it is a detached container started by hand (schtasks /Run).
#
#   $kit = "C:\Users\alexi\Documents\Diaz\Repositories\SnowForgeLLC\SnowForge\tools\loop\launch.ps1"
#   $action = New-ScheduledTaskAction -Execute powershell.exe `
#     -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File $kit -Repo <checkout> -Iterations 30"
#   $settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
#   Register-ScheduledTask -TaskName <Name> -Action $action -Settings $settings -Force   # no -Trigger
#   schtasks /Run /TN <Name>
#
# Progress: <checkout>\<LOG_DIR>\overnight-stdout.log (one line per launch and exit, naming this
# launcher's pid) and the overnight-*.log / overnight-batch-*.log beside it. Stop: schtasks /End.
param(
  [Parameter(Mandatory = $true)][string]$Repo,
  [int]$Iterations = 20,
  [int]$MaxUsd = 25,
  [string]$LogDir = "logs",
  [switch]$DryRun
)

$bash = "C:\Program Files\Git\bin\bash.exe"
$kit = $PSScriptRoot
$toPosix = { param($p) "/" + $p.Substring(0, 1).ToLower() + ($p.Substring(2) -replace '\\', '/') }
$repoPosix = & $toPosix (Resolve-Path $Repo).Path
$kitPosix = & $toPosix $kit
$ledgerRel = "$LogDir/overnight-stdout.log"
$cmd = "cd '$repoPosix' && mkdir -p '$LogDir' && bash '$kitPosix/launch.sh' '$repoPosix' overnight $Iterations $MaxUsd >> '$ledgerRel' 2>&1"
if ($DryRun) { Write-Output "$bash -lc $cmd"; exit 0 }
$ledger = Join-Path (Resolve-Path $Repo).Path ($LogDir -replace '/', '\') | Join-Path -ChildPath "overnight-stdout.log"
New-Item -ItemType Directory -Force (Split-Path $ledger) | Out-Null
$stamp = { Get-Date -Format "yyyy-MM-dd HH:mm:ss" }
("[{0}] launched pid {1}: overnight {2} x{3} ${4}" -f (& $stamp), $PID, $Repo, $Iterations, $MaxUsd) |
  Out-File -FilePath $ledger -Append -Encoding utf8
& $bash -lc $cmd
$code = $LASTEXITCODE
("[{0}] exited pid {1}: {2}" -f (& $stamp), $PID, $code) | Out-File -FilePath $ledger -Append -Encoding utf8
exit $code
