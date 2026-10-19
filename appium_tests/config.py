import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
APK_PATH = os.path.join(
    PROJECT_ROOT,
    "Promptpilot",
    "android",
    "app",
    "build",
    "outputs",
    "apk",
    "debug",
    "app-debug.apk"
)

# Appium Server Configuration
APPIUM_SERVER_URL = os.getenv("APPIUM_SERVER_URL", "http://127.0.0.1:4723")

# Android Desired Capabilities
DESIRED_CAPS = {
    "platformName": "Android",
    "automationName": "UiAutomator2",
    "deviceName": os.getenv("ANDROID_DEVICE_NAME", "Pixel_10_Pro_XL"),
    "appPackage": os.getenv("APP_PACKAGE", "com.promptpilot.app"),
    "appActivity": os.getenv("APP_ACTIVITY", ".MainActivity"),
    "app": APK_PATH,
    "noReset": False,
    "fullReset": False,
    "newCommandTimeout": 300,
    "autoGrantPermissions": True,
    "uiautomator2ServerInstallTimeout": 60000,
    "adbExecTimeout": 60000
}

# Web Server & Backend Base URLs — uses Vercel service binding PROMPTPILOT_URL if available
NEXTJS_URL = os.getenv("PROMPTPILOT_URL", "http://127.0.0.1:9002")
FASTAPI_URL = os.getenv("CONTEXT_SERVER_URL", "http://127.0.0.1:8001")
