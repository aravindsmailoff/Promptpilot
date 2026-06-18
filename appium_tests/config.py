import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory of the appium_tests folder
BASE_DIR = Path(__file__).resolve().parent

# Check for Promptpilot .env file in the sibling directory
promptpilot_env = BASE_DIR.parent / "Promptpilot" / ".env"
if promptpilot_env.exists():
    load_dotenv(dotenv_path=promptpilot_env)
else:
    # Fallback to local .env if promptpilot env isn't found
    load_dotenv(dotenv_path=BASE_DIR / ".env")

# App URL Configuration (for backend calls if needed)
base_url_env = os.getenv("NEXTAUTH_URL", "http://localhost:9002")
if "loca.lt" in base_url_env or "localtunnel.me" in base_url_env:
    BASE_URL = "http://localhost:9002"
else:
    BASE_URL = base_url_env

# Database Connection (from Promptpilot .env)
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Appium and Android Settings
APPIUM_SERVER_URL = os.getenv("APPIUM_SERVER_URL", "http://localhost:4723")
AVD_NAME = os.getenv("AVD_NAME", "Pixel_10_Pro_XL")
APK_PATH = str((BASE_DIR.parent / "apks" / "PromptPilot.apk").resolve())
APP_PACKAGE = "com.promptpilot.app"
APP_ACTIVITY = ".MainActivity"

# Reports and Output Paths
REPORTS_DIR = BASE_DIR / "reports"
SCREENSHOTS_DIR = REPORTS_DIR / "screenshots"

# Ensure directories exist
REPORTS_DIR.mkdir(exist_ok=True)
SCREENSHOTS_DIR.mkdir(exist_ok=True)

# Test Report File (Root for easy access)
REPORT_FILE_PATH = BASE_DIR / "test_automation_report.xlsx"
