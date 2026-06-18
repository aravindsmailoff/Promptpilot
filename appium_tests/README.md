# PromptPilot — Appium Mobile E2E Automation Testing Suite

This is a complete, modular, and professional Appium automation and end-to-end testing suite for PromptPilot Android mobile application, designed using the **Page Object Model (POM)**. It mirrors the structure, style, and Excel reporting capabilities of the sibling `selenium_tests` suite, executing **104+ test cases** adapted for the mobile Android environment.

---

## 📁 Project Structure

```text
appium_tests/
│
├── config.py                 # Configuration for APK path, Appium URL, and reports
├── db_helper.py              # Railway Postgres connection & schema querying
├── reporter.py               # Generates stylized Excel reports & screenshots on mobile
├── requirements.txt          # Python dependencies (includes Appium-Python-Client)
├── run-tests.bat             # Automation script (starts Appium & Emulator, runs tests)
│
├── pages/                    # Page Object Model (POM) representations
│   ├── base_page.py          # Commons and explicit element wait utilities for mobile
│   ├── app_login_page.py     # Profile & Google OAuth Settings page controls
│   ├── app_dashboard_page.py # Home prompt engineer, modes, directory submits
│   └── app_context_pilot_page.py # ContextPilot chatbot, memory add, search, WA toggles
│
└── tests/
    ├── test_flow.py          # Pytest execution flow (dynamic E2E collector)
    ├── test_deployable.py    # Infrastructure, port, ADB, and APK checks
    ├── test_unit.py          # Logic, vector embeddings, cleaner, and parser units
    ├── test_validation.py    # SQL injection, XSS checks, corrupt formats
    ├── test_functional.py    # Functional flows (FT_001 – FT_026) in mobile layout
    └── test_ui_ux.py         # Resizing, typography, toggles, loading animations
```

---

## ⚙️ Prerequisites & Setup

### 1. Requirements
- **Android SDK**: Must be installed at `C:\Users\Welcome\AppData\Local\Android\Sdk`.
- **Android Emulator**: An emulator profile named `Pixel_10_Pro_XL` must be created.
- **Node.js**: Needed to run the Appium server.

### 2. Install Appium Driver
In a terminal, ensure that the UIAutomator2 driver is installed:
```bash
npx appium driver install uiautomator2
```

---

## 🚀 Running the Tests

To run the full suite automatically, simply double-click or run:
```powershell
.\appium_tests\run-tests.bat
```

This batch script:
1. Pings port 4723 and starts the Appium server in the background if offline.
2. Runs ADB check and boots the `Pixel_10_Pro_XL` emulator if no active device is connected.
3. Installs Python dependencies (`Appium-Python-Client`, `openpyxl`, `pytest`).
4. Executes the pytest suite (`pytest tests/test_flow.py -v`).

---

## 📈 Reports & Output

- **Excel Report**: Generates `reports/test_automation_report.xlsx` with matching fonts (Segoe UI), color-coded statuses (soft green for PASS, soft red for FAIL), and execution timing.
- **Markdown Summary**: Writes `TEST_EXECUTION_SUMMARY.md` displaying details on total test execution counts, pass rates, and status.
- **Diagnostic Screenshots**: If a test case fails, a screenshot of the emulator screen is captured and stored under `reports/screenshots/`, linking it directly inside the Excel spreadsheet.
