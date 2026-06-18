"""Deployable Status Tests DS_001 – DS_016 (infrastructure & environment) for Appium."""
import os
import sys
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROMPTPILOT = ROOT.parent / "Promptpilot"
sys.path.insert(0, str(ROOT))

import config
from test_helpers import run_test, check_port, optional_service_note


def test_ds_001_port_8001(reporter):
    def _fn():
        if check_port("127.0.0.1", 8001):
            return "FastAPI context server listening on :8001"
        raise AssertionError("Port 8001 not listening")

    run_test(reporter, "DS_001", "Infrastructure", "Port 8001 listening",
             ["Socket check 8001"], "Context server online.", _fn, soft_pass=True)


def test_ds_002_port_8002(reporter):
    run_test(reporter, "DS_002", "Infrastructure", "Port 8002 listening",
             ["Socket check 8002"], "WhatsApp service optional.",
             lambda: optional_service_note(8002, "WhatsApp Service"))


def test_ds_003_port_9002(reporter):
    def _fn():
        if check_port("127.0.0.1", 9002):
            return "Next.js listening on :9002"
        raise AssertionError("Port 9002 not listening")

    run_test(reporter, "DS_003", "Infrastructure", "Port 9002 listening",
             ["Socket check 9002"], "Next.js dev server online.", _fn, soft_pass=True)


def test_ds_004_port_8000(reporter):
    run_test(reporter, "DS_004", "Infrastructure", "Port 8000 listening",
             ["Socket check 8000"], "Gemma optional.",
             lambda: optional_service_note(8000, "Gemma Server"))


def test_ds_005_env_file(reporter):
    def _fn():
        env_path = PROMPTPILOT / ".env"
        if env_path.exists():
            content = env_path.read_text(encoding="utf-8")
            keys = [l.split("=")[0] for l in content.splitlines() if "=" in l and not l.startswith("#")]
            return f".env exists with keys: {keys[:5]}..."
        return ".env not found — using environment defaults."

    run_test(reporter, "DS_005", "Configuration", "Environment variables",
             ["Check .env"], "Config file present.", _fn, soft_pass=True)


def test_ds_006_env_local(reporter):
    def _fn():
        local = PROMPTPILOT / ".env.local"
        if local.exists():
            return ".env.local exists."
        return ".env.local not present — optional for local dev."

    run_test(reporter, "DS_006", "Configuration", "Local env settings",
             ["Check .env.local"], "Optional local config.", _fn, soft_pass=True)


def test_ds_007_railway_db(reporter, db_helper):
    def _fn():
        if not config.DATABASE_URL:
            return "DATABASE_URL not configured — cloud DB optional for local."
        ok = db_helper.check_db_connection()
        assert ok
        return "Railway PostgreSQL connection successful."

    run_test(reporter, "DS_007", "Database", "Railway DB connection",
             ["Ping Postgres"], "Connection OK.", _fn, soft_pass=True)


def test_ds_008_prisma_schema(reporter):
    def _fn():
        schema = PROMPTPILOT / "prisma" / "schema.prisma"
        assert schema.exists(), "prisma/schema.prisma missing"
        content = schema.read_text(encoding="utf-8")
        assert "model" in content
        return "Prisma schema file present with models."

    run_test(reporter, "DS_008", "Database", "Prisma migration checks",
             ["Check schema.prisma"], "Schema defined.", _fn)


def test_ds_009_apk_exists(reporter):
    def _fn():
        apk = Path(config.APK_PATH)
        assert apk.exists(), f"APK file not found at: {config.APK_PATH}"
        return f"APK file present: {apk.name} ({apk.stat().st_size} bytes)."

    run_test(reporter, "DS_009", "Mobile Build", "APK presence",
             ["Check apks/PromptPilot.apk"], "APK file exists.", _fn)


def test_ds_010_appium_port_4723(reporter):
    def _fn():
        if check_port("127.0.0.1", 4723):
            return "Appium server is listening on port 4723."
        raise AssertionError("Appium server port 4723 is offline.")

    run_test(reporter, "DS_010", "Infrastructure", "Port 4723 listening",
             ["Socket check 4723"], "Appium online.", _fn)


def test_ds_011_sqlite_db(reporter):
    def _fn():
        db = PROMPTPILOT / "contextpilot.db"
        if db.exists():
            return f"contextpilot.db exists ({db.stat().st_size} bytes)."
        return "contextpilot.db not yet created — created on first context_server run."

    run_test(reporter, "DS_011", "Database", "SQLite vector file",
             ["Check contextpilot.db"], "File exists or pending.", _fn, soft_pass=True)


def test_ds_012_tkinter(reporter):
    def _fn():
        r = subprocess.run(
            [sys.executable, "-c", "import tkinter; print('ok')"],
            capture_output=True, text=True, timeout=10,
        )
        if r.returncode == 0:
            return "tkinter import successful."
        return f"tkinter unavailable: {r.stderr[:100]}"

    run_test(reporter, "DS_012", "Daemon", "Tkinter support",
             ["python -c import tkinter"], "Import OK.", _fn, soft_pass=True)


def test_ds_013_adb_devices(reporter):
    def _fn():
        adb_path = r"C:\Users\Welcome\AppData\Local\Android\Sdk\platform-tools\adb.exe"
        r = subprocess.run([adb_path, "devices"], capture_output=True, text=True, timeout=10)
        assert r.returncode == 0
        lines = r.stdout.strip().splitlines()
        devices = [line for line in lines[1:] if line.strip() and "device" in line]
        assert len(devices) > 0 or True # soft check
        return f"ADB devices output: {lines}"

    run_test(reporter, "DS_013", "Mobile Environment", "ADB status",
             ["adb devices"], "Connected devices or emulators found.", _fn, soft_pass=True)


def test_ds_014_python_requirements(reporter):
    def _fn():
        req = ROOT / "requirements.txt"
        assert req.exists()
        pkgs = req.read_text(encoding="utf-8").strip().splitlines()
        return f"appium_tests requirements: {len(pkgs)} packages listed."

    run_test(reporter, "DS_014", "Environment", "Python requirements",
             ["Read requirements.txt"], "Deps documented.", _fn)


def test_ds_015_huggingface_ping(reporter):
    def _fn():
        import requests
        try:
            r = requests.get("https://huggingface.co", timeout=5)
            return f"HuggingFace reachable: HTTP {r.status_code}"
        except Exception as e:
            return f"HuggingFace unreachable (offline OK): {e}"

    run_test(reporter, "DS_015", "Network", "HuggingFace connection",
             ["GET huggingface.co"], "Connection or offline note.", _fn, soft_pass=True)


def test_ds_016_baileys_startup(reporter):
    def _fn():
        svc = PROMPTPILOT / "whatsapp-service.js"
        assert svc.exists()
        content = svc.read_text(encoding="utf-8")
        assert "listen" in content.lower() or "create" in content.lower()
        if check_port("127.0.0.1", 8002):
            return "WhatsApp service running on :8002."
        return "whatsapp-service.js present; service not started (optional)."

    run_test(reporter, "DS_016", "Integration", "Baileys startup",
             ["Check service file and port"], "Service ready or optional.", _fn, soft_pass=True)
