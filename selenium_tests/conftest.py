import os
import sys
from pathlib import Path

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# Ensure selenium_tests root is on path
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


@pytest.fixture(scope="module")
def driver():
    """Setup and teardown Chrome webdriver."""
    chrome_options = Options()

    headless_env = os.getenv("HEADLESS", "false").lower()
    if headless_env == "true":
        print("\n[Driver Setup] Running in HEADLESS mode...")
        chrome_options.add_argument("--headless=new")
        chrome_options.add_argument("--window-size=1920,1080")
    else:
        print("\n[Driver Setup] Running in VISUAL mode (Chrome window will open)...")

    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")

    if config.CHROME_PROFILE_PATH:
        print(f"\n[Driver Setup] Loading Chrome profile from: {config.CHROME_PROFILE_PATH}")
        chrome_options.add_argument(f"--user-data-dir={config.CHROME_PROFILE_PATH}")
        chrome_options.add_argument(f"--profile-directory={config.CHROME_PROFILE_NAME}")
    else:
        print("\n[Driver Setup] No Chrome profile path set. Running with a clean browser profile.")

    try:
        print("\n[Driver Setup] Attempting direct ChromeDriver launch from system PATH...")
        drv = webdriver.Chrome(options=chrome_options)
    except Exception as direct_err:
        print(f"\n[Driver Setup] Direct launch failed ({direct_err}). Falling back to ChromeDriverManager...")
        service = Service(ChromeDriverManager().install())
        drv = webdriver.Chrome(service=service, options=chrome_options)

    if headless_env == "true":
        drv.set_window_size(1920, 1080)
    else:
        drv.maximize_window()

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
        "# PromptPilot Test Execution Summary",
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
        f"- Excel report: `reports/test_automation_report.xlsx`",
        f"- Screenshots: `reports/screenshots/` (on failure)",
        "",
        "## Prerequisites",
        "",
        "- Next.js dev server on port 9002",
        "- ContextPilot server on port 8001",
        "- Optional: WhatsApp (8002), Gemma (8000)",
        "- DATABASE_URL for DB integration tests",
        "",
    ]
    path.write_text("\n".join(lines), encoding="utf-8")
    print(f"[Teardown] Summary written to: {path}")
