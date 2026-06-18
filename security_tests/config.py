import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory of the security_tests folder
BASE_DIR = Path(__file__).resolve().parent

# Check for Promptpilot .env file in the sibling directory
promptpilot_env = BASE_DIR.parent / "Promptpilot" / ".env"
promptpilot_env_local = BASE_DIR.parent / "Promptpilot" / ".env.local"

if promptpilot_env.exists():
    load_dotenv(dotenv_path=promptpilot_env)
if promptpilot_env_local.exists():
    load_dotenv(dotenv_path=promptpilot_env_local)

# Security Targets
NEXTAUTH_SECRET = os.getenv("NEXTAUTH_SECRET", "3b82f6fitepSBEAwqefdLclsnmMXfpIryxAnsNjg")
BASE_URL = os.getenv("NEXTAUTH_URL", "http://localhost:9002")
CONTEXT_SERVER_URL = os.getenv("CONTEXT_SERVER_URL", "http://127.0.0.1:8001")
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Chrome Profile Config (Required to bypass Google OAuth bot detection)
CHROME_PROFILE_PATH = os.getenv("CHROME_PROFILE_PATH", None)
CHROME_PROFILE_NAME = os.getenv("CHROME_PROFILE_NAME", "Default")

# Output configuration
REPORTS_DIR = BASE_DIR / "reports"
SCREENSHOTS_DIR = REPORTS_DIR / "screenshots"

REPORTS_DIR.mkdir(exist_ok=True)
SCREENSHOTS_DIR.mkdir(exist_ok=True)

REPORT_FILE_PATH = REPORTS_DIR / "vulnerability_test_report.xlsx"
SUMMARY_FILE_PATH = BASE_DIR / "VULNERABILITY_TEST_SUMMARY.md"

# Authorization Headers for FastAPI backend (port 8001)
AUTH_HEADERS = {"Authorization": f"Bearer {NEXTAUTH_SECRET}"}
