# PromptPilot — Selenium E2E Automation Testing Suite

This is a complete, modular, and professional Selenium automation and end-to-end testing suite for PromptPilot, designed using the **Page Object Model (POM)**. It automatically tests the landing page, authentications, model optimization/execution, and custom fleet submissions, verifies database state changes directly in PostgreSQL (hosted on Railway), and generates a fully styled Excel test report with screenshot links for failed tests.

---

## 📁 Project Structure

```text
selenium_tests/
│
├── config.py                 # Configuration for paths, URLs, and DB URLs
├── db_helper.py              # Railway Postgres connection & schema querying
├── reporter.py               # Generates stylized Excel reports & screenshots
├── requirements.txt          # Python dependencies
│
├── pages/                    # Page Object Model (POM) representations
│   ├── base_page.py          # Commons and explicit element wait utilities
│   ├── login_page.py         # Google OAuth & session details tab
│   └── dashboard_page.py     # Home, Directory, and history execution actions
│
└── tests/
    └── test_flow.py          # Pytest execution flow (runs the 5 core test cases)
```

---

## ⚙️ Prerequisites & Setup

### 1. Install Dependencies
Make sure you have Python 3.8+ installed. Open a terminal, navigate to the `selenium_tests` directory, and run:

```bash
pip install -r requirements.txt
```

This will automatically install:
* `selenium`: Browser automation engine.
* `psycopg2-binary`: Database connector for PostgreSQL.
* `openpyxl`: Excel spreadsheet builder and styler.
* `pytest`: Test runner.
* `python-dotenv`: Environment loader.
* `webdriver-manager`: Handles ChromeDriver installation/updates automatically.

---

### 2. Configure Environment Variables (Bypassing Google Login block)

Google OAuth employs active bot detection and blockades automated Chrome instances. The most robust workaround is loading a **pre-authenticated local Chrome User Profile** where you are already signed into Google.

1. Open Google Chrome on your system and log into your Google Account.
2. Find your local Chrome User Data path:
   * **Windows**: `C:\Users\<YourUsername>\AppData\Local\Google\Chrome\User Data`
   * **Mac**: `/Users/<YourUsername>/Library/Application Support/Google/Chrome`
   * **Linux**: `/home/<YourUsername>/.config/google-chrome`
3. Create a `.env` file inside the `selenium_tests` directory (or modify the Next.js `.env` at `../Promptpilot/.env` directly):

```env
# Optional: Set your logged-in Chrome user data path (highly recommended for Google OAuth tests)
CHROME_PROFILE_PATH="C:\Users\YourUsername\AppData\Local\Google\Chrome\User Data"
CHROME_PROFILE_NAME="Default"

# If the database URL differs from the Next.js project .env, override it here:
# DATABASE_URL="postgresql://user:pass@host:port/dbname?sslmode=no-verify"
```

*Note: The test suite will automatically import configuration values (like `DATABASE_URL` and `NEXTAUTH_URL`) from the PromptPilot Next.js project’s `.env` file if it is located in the sibling folder.*

---

## 🚀 Running the Tests

Ensure the PromptPilot web application is running locally (e.g. at `http://localhost:9002`) and the Railway PostgreSQL instance is active. Then execute:

```bash
# Run all test cases
pytest tests/test_flow.py -v

# Run in headless mode (virtual window, runs without launching visual browser)
$env:HEADLESS="true"; pytest tests/test_flow.py -v
```

---

## 📊 Test Cases Executed

The suite runs **5 modular test cases** sequentially:

| Test ID | Component | Description | Expected Outcome |
| :--- | :--- | :--- | :--- |
| **TC_001** | Database Integration | Validates connection to Railway PostgreSQL database. | `psycopg2` connects to DB successfully. |
| **TC_002** | Authentication | Checks if Google Login session is active or Offline mode fallback is engaged. | Profile credentials loaded or Offline state warned. |
| **TC_003** | Orchestrator Core | Submits a prompt optimization, waits for LLM response, clicks Auto-Execute, and verifies DB records. | Optimization succeeds; new history row matching the task is written in `MissionHistory`. |
| **TC_004** | Fleet Directory | Opens "Submit a Model" dialog, fills inputs, submits, and checks PostgreSQL database. | The submission completes, and the new model is verified in the `ModelSubmission` table. |
| **TC_005** | Authentication | Triggers Sign Out. | Session terminates and LoginPage resets. |

---

## 📈 Excel Test Report & Screenshots

After execution, the suite generates a professional report in `selenium_tests/reports/test_automation_report.xlsx`.

* **Styling**: PASS rows feature a soft green status, FAIL/ERROR rows feature a soft red/yellow status.
* **Duration**: Tracks execution duration in seconds for each scenario.
* **Failures & Screenshots**: If a test case fails, a screenshot is automatically captured and saved under `selenium_tests/reports/screenshots/`. A clickable hyperlink (`View Screenshot`) will appear in the spreadsheet for immediate diagnostic review.
