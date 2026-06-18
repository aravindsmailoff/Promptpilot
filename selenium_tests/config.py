import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory of the selenium_tests folder
BASE_DIR = Path(__file__).resolve().parent

# Check for Promptpilot .env file in the sibling directory
promptpilot_env = BASE_DIR.parent / "Promptpilot" / ".env"
promptpilot_env_local = BASE_DIR.parent / "Promptpilot" / ".env.local"

if promptpilot_env.exists():
    load_dotenv(dotenv_path=promptpilot_env)
if promptpilot_env_local.exists():
    load_dotenv(dotenv_path=promptpilot_env_local)

# Fallback to local .env if promptpilot env isn't found
if not promptpilot_env.exists() and not promptpilot_env_local.exists():
    load_dotenv(dotenv_path=BASE_DIR / ".env")

# App URL Configuration
# If the NEXTAUTH_URL is a localtunnel URL, use localhost:9002 for local Selenium tests
base_url_env = os.getenv("NEXTAUTH_URL", "http://localhost:9002")
BASE_URL = base_url_env

# Authorization Headers for FastAPI backend (port 8001)
NEXTAUTH_SECRET = os.getenv("NEXTAUTH_SECRET", "3b82f6fitepSBEAwqefdLclsnmMXfpIryxAnsNjg")
AUTH_HEADERS = {"Authorization": f"Bearer {NEXTAUTH_SECRET}"}

# Database Connection (from Promptpilot .env)
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Chrome Profile Config (Required to bypass Google OAuth bot detection)
# Pass the absolute path to your local Chrome User Data directory.
# E.g., C:\Users\<Username>\AppData\Local\Google\Chrome\User Data
CHROME_PROFILE_PATH = os.getenv("CHROME_PROFILE_PATH", None)
CHROME_PROFILE_NAME = os.getenv("CHROME_PROFILE_NAME", "Default")

# Reports and Output Paths
REPORTS_DIR = BASE_DIR / "reports"
SCREENSHOTS_DIR = REPORTS_DIR / "screenshots"

# Ensure directories exist
REPORTS_DIR.mkdir(exist_ok=True)
SCREENSHOTS_DIR.mkdir(exist_ok=True)

# Test Report File
REPORT_FILE_PATH = REPORTS_DIR / "test_automation_report.xlsx"
