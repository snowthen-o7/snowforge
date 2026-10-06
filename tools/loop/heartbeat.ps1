# SnowForge loop kit: the heartbeat (Alex, 2026-10-05: "add the heartbeat check, and make it more
# frequent, every 15").
#
# overnight.sh emails when a run stops, but only if it is still alive to do it: on 2026-10-05 RiftMind's
# whole run died between 18:59 and 20:40 with no exit line and no notice, and nobody knew for two hours.
# Every 15 minutes this looks at each loop the kit runs unattended (every scheduled task whose action
# runs launch.ps1) and reads its ledger, <repo>\<LogDir>\overnight-stdout.log:
#   - the last run launched and never wrote "exited pid N", and process N is gone: the run died;
#   - the last run wrote "exited pid N" but no stop notice after its launch: it was cut off before the
#     notice could go.
# Either way it sends one stop email through notify.py (the same as overnight.sh's) and leaves a marker,
# <LogDir>\.heartbeat-<pid>, so a run is reported once, not every 15 minutes.
#
# Registered as the scheduled task SnowForgeLoopHeartbeat (every 15 minutes, through heartbeat.vbs so
# no console window flashes). -DryRun prints what it would do and sends nothing.
param([switch]$DryRun)

$kit = $PSScriptRoot
$notify = Join-Path $kit "notify.py"
$tasks = Get-ScheduledTask | Where-Object { ($_.Actions | ForEach-Object { $_.Arguments }) -match 'launch\.ps1' }

foreach ($task in $tasks) {
  $taskArgs = ($task.Actions | ForEach-Object { $_.Arguments }) -join ' '
  if ($taskArgs -notmatch '-Repo\s+"?([^"]+?)"?(\s+-|$)') { continue }
  $repo = $Matches[1].Trim()
  $logDir = if ($taskArgs -match '-LogDir\s+"?([^"\s]+)"?') { $Matches[1] } else { "logs" }
  $logPath = Join-Path $repo ($logDir -replace '/', '\')
  $ledger = Join-Path $logPath "overnight-stdout.log"
  if (-not (Test-Path $ledger)) { continue }

  $lines = @(Get-Content $ledger -Tail 2000 | ForEach-Object { $_ -replace "`0", "" })
  $launch = -1
  for ($i = $lines.Count - 1; $i -ge 0; $i--) {
    if ($lines[$i] -match 'launched pid (\d+)') { $launch = $i; break }
  }
  if ($launch -lt 0) { continue }
  $launcherPid = [int]([regex]::Match($lines[$launch], 'launched pid (\d+)').Groups[1].Value)
  $after = if ($launch + 1 -lt $lines.Count) { $lines[($launch + 1)..($lines.Count - 1)] } else { @() }
  $exitLine = $after | Where-Object { $_ -match "exited pid $launcherPid\b" } | Select-Object -Last 1
  $noticed = $after | Where-Object { $_ -match 'stop notice sent|the stop notice could not be sent' }
  $marker = Join-Path $logPath ".heartbeat-$launcherPid"
  if (Test-Path $marker) { continue }

  $reason = $null
  if ($exitLine) {
    if (-not $noticed) { $reason = "the run exited ($($exitLine.Trim())) without sending its stop notice: overnight.sh was cut off" }
  } else {
    $proc = Get-Process -Id $launcherPid -ErrorAction SilentlyContinue
    if (-not $proc -or $proc.ProcessName -notmatch 'powershell') {
      $reason = "the run died: its launcher (pid $launcherPid) is gone and it never wrote an exit line"
    }
  }
  if (-not $reason) { continue }

  $runLog = Get-ChildItem $logPath -Filter "overnight-2*.log" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime | Select-Object -Last 1
  $runRel = if ($runLog) { (Join-Path $logDir $runLog.Name) -replace '\\', '/' } else { "" }
  $name = "$($task.TaskName) (heartbeat)"
  if ($DryRun) { Write-Output "[dry run] $($task.TaskName): $reason (run log $runRel)"; continue }
  & python $notify --name $name --repo $repo --to "alexitofrancis@gmail.com" --reason $reason `
    --code 9 --iterations 0 --log-dir $logDir --run-log $runRel
  if ($LASTEXITCODE -eq 0) {
    Set-Content -Path $marker -Value ("{0} {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $reason) -Encoding utf8
  }
}
