import os
import sys
import subprocess
from pathlib import Path

import pytest
from appium import webdriver
from appium.options.common import AppiumOptions

# Ensure appium_tests root is on path
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

import config
from db_helper import DBHelper
from reporter import TestReporter

# Session-scoped reporter shared across all test modules
_reporter = TestReporter()


@pytest.fixture(scope="session")
def reporter():
    return _reporter


@pytest.fixture(scope="session")
def db_helper():
    return DBHelper()


def is_device_connected():
    """Check if any android device is currently connected via ADB."""
    try:
        adb_path = os.environ.get("ADB_PATH", "adb")
        output = subprocess.check_output([adb_path, "devices"]).decode()
        lines = [line for line in output.splitlines() if line.strip() and not line.startswith("List")]
        return len(lines) > 0
    except Exception:
        return False


@pytest.fixture(scope="module")
def driver():
    """Setup and teardown Appium remote webdriver for Android."""
    options = AppiumOptions()

    caps = {
        "platformName": "Android",
        "automationName": "UiAutomator2",
        "deviceName": "Android Emulator",
        "app": config.APK_PATH,
        "appPackage": config.APP_PACKAGE,
        "appActivity": config.APP_ACTIVITY,
        "noReset": True,
        "newCommandTimeout": 3600,
        "browserName": "",  # Explicitly disable browser to prevent opening Chrome
        "appWaitActivity": "*",  # Wait for any activity to start
        "ensureWebviewsHavePages": True,
        "nativeWebScreenshot": True
    }
    
    # Only request AVD launch if no device is already connected
    if not is_device_connected():
        caps["avd"] = config.AVD_NAME
        print(f"[Driver Setup] No connected device found. Requesting AVD launch: {config.AVD_NAME}")
    else:
        print("[Driver Setup] Connected device detected. Using existing device in Running Devices.")

    options.load_capabilities(caps)

    print(f"[Driver Setup] Connecting to Appium server at: {config.APPIUM_SERVER_URL}")
    drv = webdriver.Remote(config.APPIUM_SERVER_URL, options=options)
    
    yield drv
    
    drv.quit()


def pytest_collection_modifyitems(session, config, items):
    """Deduplicate when test_flow.py re-exports tests from sibling modules."""
    seen = set()
    deduped = []
    for item in items:
        key = item.name
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    items[:] = deduped


def pytest_sessionfinish(session, exitstatus):
    """Generate Excel report after all tests complete."""
    print("\n[Teardown] Writing Excel test report...")
    _reporter.generate_excel_report()
    summary_path = ROOT / "TEST_EXECUTION_SUMMARY.md"
    _generate_summary_md(_reporter, summary_path)


def _generate_summary_md(reporter: TestReporter, path: Path):
    """Write a markdown executive summary from reporter results."""
    results = reporter.results
    total = len(results)
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] in ("FAIL", "FAILED"))
    errors = sum(1 for r in results if r["status"] == "ERROR")

    categories = {"UT": 0, "FT": 0, "UI": 0, "VT": 0, "DS": 0, "TC": 0}
    cat_pass = {k: 0 for k in categories}
    for r in results:
        tid = r["id"]
        prefix = tid.split("_")[0] if "_" in tid else "TC"
        if prefix in categories:
            categories[prefix] += 1
            if r["status"] == "PASS":
                cat_pass[prefix] += 1
        elif tid.startswith("TC"):
            categories["TC"] += 1
            if r["status"] == "PASS":
                cat_pass["TC"] += 1

    verdict = "READY" if failed == 0 and errors == 0 and total >= 100 else "NOT READY"

    lines = [
        "# PromptPilot Mobile Test Execution Summary",
        "",
        f"**Deployable Status:** {verdict}",
        "",
        "## Overall Results",
        "",
        f"| Metric | Count |",
        f"|--------|-------|",
        f"| Total Tests | {total} |",
        f"| Passed | {passed} |",
        f"| Failed | {failed} |",
        f"| Errors | {errors} |",
        f"| Pass Rate | {(passed / total * 100) if total else 0:.1f}% |",
        "",
        "## Results by Category",
        "",
        "| Category | Total | Passed |",
        "|----------|-------|--------|",
    ]
    for cat, count in categories.items():
        if count > 0:
            lines.append(f"| {cat} | {count} | {cat_pass[cat]} |")

    lines += [
        "",
        "## Report Artifacts",
        "",
        f"- Full Excel report: `test_automation_report.xlsx`",
        f"- Screenshots: `reports/screenshots/` (on failure)",
        "",
        "## Prerequisites",
        "",
        "- Next.js dev server on port 9002",
        "- ContextPilot server on port 8001",
        "- Android Emulator running",
        "- Appium Server on port 4723",
        "",
    ]
    path.write_text("\n".join(lines), encoding="utf-8")
    print(f"[Teardown] Summary written to: {path}")
