# =============================================================================
# TenderHub Kenya – Windows Setup & Scheduled Task Installer
# =============================================================================

$ErrorActionPreference = "Stop"

# ── Config ───────────────────────────────────────────────────────────────────
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$VENV_DIR = Join-Path $SCRIPT_DIR ".venv"
$PYTHON = Join-Path $VENV_DIR "Scripts\python.exe"
$LOG_FILE = "C:\tenderhub\logs\scraper.log"
$TASK_NAME = "TenderHub Scraper"
$RUN_TIME = "23:30"

Write-Host "[INFO] Starting setup in $SCRIPT_DIR" -ForegroundColor Green

# ── 1. Python check ──────────────────────────────────────────────────────────
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { throw "Python not found. Install Python 3.10+" }

$version = python -c "import sys; print(sys.version_info[:2])"
Write-Host "[INFO] Python version: $version"

python -c "import sys; exit(0 if sys.version_info >= (3,10) else 1)"
if ($LASTEXITCODE -ne 0) { throw "Python 3.10+ required" }

# ── 2. Virtualenv ────────────────────────────────────────────────────────────
if (-not (Test-Path $VENV_DIR)) {
    Write-Host "[INFO] Creating virtualenv..."
    python -m venv $VENV_DIR
}

# ── 3. Install dependencies ──────────────────────────────────────────────────
Write-Host "[INFO] Installing Python packages..."
& $PYTHON -m pip install --upgrade pip | Out-Null
& $PYTHON -m pip install -r (Join-Path $SCRIPT_DIR "requirements.txt")

# ── 4. Playwright ────────────────────────────────────────────────────────────
Write-Host "[INFO] Installing Playwright Chromium..."
& $PYTHON -m playwright install chromium

# ── 5. Log directory ─────────────────────────────────────────────────────────
$logDir = Split-Path $LOG_FILE
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Force -Path $logDir | Out-Null
}
Write-Host "[INFO] Log directory ready: $logDir"

# ── 6. Create runner script ──────────────────────────────────────────────────
$runnerScript = Join-Path $SCRIPT_DIR "run_tenderhub.ps1"

@"
`$ErrorActionPreference = "Stop"
cd "$SCRIPT_DIR"
& "$PYTHON" "$SCRIPT_DIR\main.py" >> "$LOG_FILE" 2>&1
"@ | Set-Content $runnerScript

Write-Host "[INFO] Runner script created: $runnerScript"

# ── 7. Scheduled Task ────────────────────────────────────────────────────────
Write-Host "[INFO] Creating scheduled task..."

# Remove existing task if exists
if (Get-ScheduledTask -TaskName $TASK_NAME -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TASK_NAME -Confirm:$false
}

$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -File `"$runnerScript`""

$trigger = New-ScheduledTaskTrigger -Daily -At $RUN_TIME

Register-ScheduledTask `
    -TaskName $TASK_NAME `
    -Action $action `
    -Trigger $trigger `
    -User "SYSTEM" `
    -RunLevel Highest

Write-Host "[INFO] Scheduled task created (daily at $RUN_TIME)"

# ── 8. Test run ──────────────────────────────────────────────────────────────
$runTest = Read-Host "Run test now? (y/N)"
if ($runTest -match "^[Yy]$") {
    Write-Host "[INFO] Running test..."
    powershell -ExecutionPolicy Bypass -File $runnerScript
}

# ── Done ─────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host " Setup complete!"
Write-Host " Task: $TASK_NAME → daily at $RUN_TIME"
Write-Host " Logs: $LOG_FILE"
Write-Host " Manual: powershell -File $runnerScript"
Write-Host "=============================================="