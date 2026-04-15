#!/usr/bin/env bash
# =============================================================================
# TenderHub Kenya – Server Setup & Cron Job Installer
# =============================================================================
# Run once on the server:
#     chmod +x cron_setup.sh
#     ./cron_setup.sh
#
# What this script does:
#   1. Checks Python 3.11+
#   2. Creates a virtualenv
#   3. Installs all pip dependencies
#   4. Installs Playwright Chromium browser
#   5. Installs ODBC Driver 17 for SQL Server (Ubuntu/Debian)
#   6. Installs the cron job that runs main.py every day at 23:30 local time
#   7. Creates a log-rotation config so logs don't fill the disk
# =============================================================================

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/.venv"
PYTHON="$VENV_DIR/bin/python"
LOG_FILE="/var/log/tenderhub/scraper.log"
CRON_HOUR="23"
CRON_MIN="30"
CRON_USER="$(whoami)"

# ── Colours ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

info "TenderHub Kenya – setup starting in $SCRIPT_DIR"

# ── 1. Python version check ───────────────────────────────────────────────────
PY_BIN=$(command -v python3 || command -v python || error "Python not found")
PY_VER=$("$PY_BIN" -c "import sys; print(sys.version_info[:2])")
info "Found Python: $PY_BIN  ($PY_VER)"
"$PY_BIN" -c "import sys; sys.exit(0 if sys.version_info >= (3,10) else 1)" \
    || error "Python 3.10+ required. Please upgrade."

# ── 2. Virtualenv ─────────────────────────────────────────────────────────────
if [ ! -d "$VENV_DIR" ]; then
    info "Creating virtualenv at $VENV_DIR"
    "$PY_BIN" -m venv "$VENV_DIR"
fi
source "$VENV_DIR/bin/activate"

# ── 3. Python dependencies ────────────────────────────────────────────────────
info "Installing Python packages…"
pip install --upgrade pip --quiet
pip install -r "$SCRIPT_DIR/requirements.txt" --quiet
info "Python packages installed."

# ── 4. Playwright browser ─────────────────────────────────────────────────────
info "Installing Playwright Chromium browser…"
"$PYTHON" -m playwright install chromium --with-deps 2>&1 | tail -5
info "Playwright ready."

# ── 5. ODBC Driver 17 (Ubuntu/Debian only) ────────────────────────────────────
if command -v apt-get &>/dev/null; then
    if ! dpkg -l | grep -q "msodbcsql17"; then
        info "Installing Microsoft ODBC Driver 17 for SQL Server…"
        curl -sSL https://packages.microsoft.com/keys/microsoft.asc \
            | sudo gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg
        echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] \
            https://packages.microsoft.com/ubuntu/$(lsb_release -rs)/prod $(lsb_release -cs) main" \
            | sudo tee /etc/apt/sources.list.d/mssql-release.list > /dev/null
        sudo apt-get update -qq
        sudo ACCEPT_EULA=Y apt-get install -y msodbcsql17 -qq
        info "ODBC Driver 17 installed."
    else
        info "ODBC Driver 17 already installed – skipping."
    fi
else
    warn "Non-Debian system: install 'msodbcsql17' manually from packages.microsoft.com"
fi

# ── 6. Log directory ──────────────────────────────────────────────────────────
sudo mkdir -p "$(dirname "$LOG_FILE")"
sudo chown "$CRON_USER":"$CRON_USER" "$(dirname "$LOG_FILE")" || true
info "Log directory: $(dirname "$LOG_FILE")"

# ── 7. Log rotation ───────────────────────────────────────────────────────────
LOGROTATE_CONF="/etc/logrotate.d/tenderhub"
if [ ! -f "$LOGROTATE_CONF" ]; then
    sudo tee "$LOGROTATE_CONF" > /dev/null <<EOF
/var/log/tenderhub/*.log {
    daily
    rotate 14
    compress
    missingok
    notifempty
    create 0644 $CRON_USER $CRON_USER
}
EOF
    info "Log rotation configured at $LOGROTATE_CONF"
fi

# ── 8. Cron job ───────────────────────────────────────────────────────────────
# Runs every day at 23:30 (EOD), redirects output to log file.
CRON_CMD="$CRON_MIN $CRON_HOUR * * * cd $SCRIPT_DIR && $PYTHON $SCRIPT_DIR/main.py >> $LOG_FILE 2>&1"

# Check if this cron entry already exists
if crontab -l 2>/dev/null | grep -qF "$SCRIPT_DIR/main.py"; then
    warn "Cron job already exists – skipping. Current crontab:"
    crontab -l | grep "$SCRIPT_DIR/main.py"
else
    (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
    info "Cron job installed: runs daily at ${CRON_HOUR}:${CRON_MIN}"
    info "  $CRON_CMD"
fi

# ── 9. Test run (dry run – scrape only, no parse) ─────────────────────────────
echo ""
read -rp "Run a quick test scrape NOW? (y/N) " TEST_RUN
if [[ "$TEST_RUN" =~ ^[Yy]$ ]]; then
    info "Running test: python main.py afa --no-parse"
    cd "$SCRIPT_DIR"
    "$PYTHON" main.py afa --no-parse 2>&1 | tail -20
fi

echo ""
info "══════════════════════════════════════════════════════"
info " Setup complete!"
info " Cron:  daily at ${CRON_HOUR}:${CRON_MIN} → $LOG_FILE"
info " Manual run:  $PYTHON $SCRIPT_DIR/main.py"
info " Test source: $PYTHON $SCRIPT_DIR/main.py kengen --no-parse"
info " View logs:   tail -f $LOG_FILE"
info "══════════════════════════════════════════════════════"
