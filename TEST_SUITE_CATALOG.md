# PromptPilot & ContextPilot — Comprehensive Test Suite Catalog

This document provides a professional, end-to-end testing blueprint for the PromptPilot web application, the ContextPilot universal search layer, and associated background daemons. It contains **110 unique test cases** structured across Unit, Functional, UI/UX, Validation, and Deployable Status categories, alongside a deployment readiness assessment.

---

## 📋 Executive Summary

### 1. Goals & Scope
The goal of this testing suite is to guarantee the security, functionality, and performance of PromptPilot's local-first search system (ContextPilot) and its web-based prompt engineering workspace. The testing scope covers:
* **The Web Client**: Next.js dashboard executing prompt optimization, co-founder modules, history, and model directory submissions.
* **The Search Backend**: FastAPI server computing local sentence embeddings, performing hybrid searches (vector + BM25), and optional local LLM re-ranking.
* **The Desktop Daemon**: Clipboard polling listener, global system hotkeys, system tray, and native Tkinter popup notifications.
* **Database integrations**: Local SQLite databases and PostgreSQL (hosted on Railway).

### 2. Testing Methodology & Strategy
Our multi-tiered testing strategy ensures coverage from code units to production deployments:
```
                     ┌──────────────────────────────┐
                     │ Deployable Status & Infra    │ (Ports, build, DB connectivity)
                     └──────────────┬───────────────┘
                                    ▼
                     ┌──────────────────────────────┐
                     │   Validation & Security      │ (File types, inputs, SQLi/XSS)
                     └──────────────┬───────────────┘
                                    ▼
                     ┌──────────────────────────────┐
                     │     Functional & E2E         │ (Selenium, user flows)
                     └──────────────┬───────────────┘
                                    ▼
                     ┌──────────────────────────────┐
                     │          UI / UX             │ (Glassmorphism, responsive, states)
                     └──────────────┬───────────────┘
                                    ▼
                     ┌──────────────────────────────┐
                     │         Unit Tests           │ (Parsers, database utils, helpers)
                     └──────────────────────────────┘
```
* **Unit Tests**: Executed using `pytest` for Python utilities/parsers and `Jest`/`Vitest` for TypeScript helper modules.
* **UI/UX and Functional E2E Tests**: Automating full user scenarios with Selenium WebDriver (Python POM structure) in both headless and GUI modes.
* **Validation Tests**: Targeting inputs, file import parsers, and data ingestion constraints.
* **Deployable Status**: Verifying infrastructure integrity, build compilation, and environment variable correctness.

---

## 🚀 Deployable Status & Infrastructure

Before running the test suite or releasing to production, verify the following deployment requirements:

| Service | Port / URI | Executable | Description |
| :--- | :--- | :--- | :--- |
| **Next.js Dashboard** | `http://localhost:9002` | `npm run dev` / `npm run build` | Web interface to manage models, view history, run co-founder analyses, and index memories. |
| **FastAPI Search Server** | `http://127.0.0.1:8001` | `python context_server.py` | ContextPilot backend handling vector database operations and NLP computations. |
| **Desktop Daemon** | Native OS Window | `python context_daemon.py` | Clipboard poller, hotkey listener, and Tkinter-based search result popup. |
| **WhatsApp Service** | `http://localhost:8002` | `node whatsapp-service.js` | Baileys-based WhatsApp bot engine. |
| **Gemma Server (Optional)** | `http://localhost:8000` | `python gemma_server.py` | Local LLM server hosting Gemma/Qwen for advanced re-ranking. |
| **PostgreSQL Database** | Railway Hosted | Client Connection | Stores persistent history, submissions, and credentials. |
| **SQLite Database** | `contextpilot.db` (Local) | File Access | Local vector database containing sentence-transformer index. |

---

## 🧪 Detailed Test Case Catalog

### 1. Unit Tests (UT) — 26 Test Cases

*Focuses on verifying functions, routing APIs, schema parsers, and connection modules in isolation.*

| Test ID | Component | Feature under Test | Step-by-Step Instructions | Expected Result | Verification Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UT_001** | Database Integration | `db_helper.py` connection check | 1. Initialize `DBHelper`. <br>2. Call `check_db_connection()`. | Returns `True` indicating database is accessible. | Pytest assertion |
| **UT_002** | Database Integration | User query by email | 1. Insert test user in database. <br>2. Call `get_user_by_email(email)`. | Returns dict with matching user columns. | Pytest assertion |
| **UT_003** | Database Integration | Logging mission history | 1. Call `log_mission_history(user_id, task, prompt)`. <br>2. Query database for inserted ID. | Row is written correctly with correct timestamps. | SQL Query verification |
| **UT_004** | Database Integration | Submitting custom models | 1. Call `save_model_submission(name, url, specialization)`. <br>2. Fetch submission from DB. | Fields are written precisely as passed. | SQL Query verification |
| **UT_005** | Ingestion Engine | Custom `clean_text()` utility | 1. Pass string containing control chars, emojis, and raw binary bytes to `clean_text()`. | Returns stripped, clean alphanumeric/punctuation string. | Pytest assertion |
| **UT_006** | Ingestion Engine | WhatsApp chat parser | 1. Input string: `[11/06/2026, 12:35 PM] User: Hello World`. <br>2. Execute `parse_whatsapp_line()`. | Returns dict: `{"timestamp": ..., "sender": "User", "message": "Hello World"}`. | Pytest assertion |
| **UT_007** | Ingestion Engine | Gmail `.mbox` parser | 1. Instantiate MBOX parser with a multi-part MIME email string. <br>2. Execute body parsing. | Extracted content contains only the plain text message body. | Pytest assertion |
| **UT_008** | Ingestion Engine | Zoom `.vtt` parser | 1. Input string containing WebVTT format headers and timed dialogue blocks. <br>2. Execute parsing. | Returns clean speech segments without timestamps or line markers. | Pytest assertion |
| **UT_009** | Ingestion Engine | Chrome history `.json` parser | 1. Input schema containing browser logs (url, title, visit count). <br>2. Run parsing. | Schema matches validation criteria; returns a flat list of text records. | Pytest assertion |
| **UT_010** | Vector Search | Embedding calculator | 1. Input test query string. <br>2. Execute model vector computation. | Returns float array of exactly 384 dimensions (`all-MiniLM-L6-v2`). | Pytest shape assertion |
| **UT_011** | Text Search | BM25 keyword search | 1. Create a corpus of three documents. <br>2. Search for exact keyword. | Returns documents containing keyword sorted by TF-IDF. | Pytest sorting check |
| **UT_012** | Hybrid Search | Score merger algorithm | 1. Combine vector similarity and BM25 scores. <br>2. Pass values through weighting algorithm. | Merged score correctly ranks documents according to configured weights. | Score validation |
| **UT_013** | LLM Re-ranking | Gemma prompt builder | 1. Input candidate list and original query. <br>2. Call `build_gemma_rerank_prompt()`. | Returns structured LLM prompt mapping candidates to numerical indices. | String match assertion |
| **UT_014** | Web Backend API | `/api/context/search` route | 1. Send POST request to `/api/context/search` with missing query parameter. | Returns HTTP 400 with validation error schema. | API fetch response check |
| **UT_015** | Web Backend API | `/api/context/stats` route | 1. Send GET request to `/api/context/stats`. | Returns HTTP 200 with total document count and DB file size. | API fetch response check |
| **UT_016** | Web Backend API | `/api/context/ingest` route | 1. Send POST request with empty payload structure. | Returns HTTP 422 Unprocessable Entity. | API fetch response check |
| **UT_017** | Desktop Daemon | Clipboard text length check | 1. Pass string with 2 words to `should_trigger_search()`. <br>2. Pass string with 3 words. | 1. Returns `False`. <br>2. Returns `True`. | Pytest assertion |
| **UT_018** | Desktop Daemon | Hotkey handler registration | 1. Initialize `context_daemon.py`. <br>2. Verify keypress bind configuration. | System hook is bound to `Ctrl+Shift+Space`. | Daemon process inspection |
| **UT_019** | Desktop Daemon | Tray icon menu mapping | 1. Check tray initialization options. | Menu keys match "Status", "Settings", and "Exit". | System tray assertion |
| **UT_020** | Desktop Daemon | Popup positioning | 1. Call `calculate_window_position()`. | Window coordinates locate the popup at bottom-right of primary display monitor. | Coordinate geometry check |
| **UT_021** | WhatsApp Service | Baileys auth config loading | 1. Load credentials from `baileys_auth_info`. | Loads credentials buffer successfully. | Node check assertions |
| **UT_022** | WhatsApp Service | Message packet parser | 1. Input raw JSON message representation from WhatsApp API. <br>2. Call parsing function. | Returns clean message text and sender remote ID. | Node unit assertions |
| **UT_023** | WhatsApp Service | Auto-reply state check | 1. Call `should_reply_to_chat()` with group ID. | Evaluates against settings and returns boolean value. | Unit state test |
| **UT_024** | Startup Utility | Environment loader | 1. Run environment loader with mock file. | Parse correctly without crash. | Config parsing check |
| **UT_025** | API Client | HF token header builder | 1. Call header builder function. | Authorization header begins with `Bearer hf_`. | Header match assertion |
| **UT_026** | API Client | OpenAI custom client | 1. Initialize client using router URL. | Target endpoint matches `https://router.huggingface.co/v1`. | Endpoint check assertion |

---

### 2. Functional Tests (FT) — 26 Test Cases

*Verifies feature workflows and end-to-end capabilities.*

| Test ID | Component | Feature under Test | Step-by-Step Instructions | Expected Result | Verification Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FT_001** | Orchestrator Core | Prompt optimization | 1. Go to Home tab. <br>2. Enter prompt. <br>3. Click "Execute Mission". | System calls HuggingFace/local model, returns optimized prompt in editor. | Selenium E2E flow |
| **FT_002** | Orchestrator Core | Auto-execution | 1. Execute mission. <br>2. Once optimized prompt returns, click "Auto-Execute". | Optimization parameters are passed to executors, task status updates. | Selenium E2E flow & DB verification |
| **FT_003** | Dashboard UI | Mode switching | 1. On Home page, click mode switcher toggle. | View switches between standard R&D Mode and Startup Co-Founder Mode. | DOM assertion |
| **FT_004** | Startup Co-Founder | Setup profile | 1. Switch to Co-Founder Mode. <br>2. Fill idea details, sector, stage. <br>3. Click "Activate". | Profile data is saved locally, enabling module card selections. | Selenium input fill check |
| **FT_005** | Startup Co-Founder | Profile update | 1. Activate profile. <br>2. Click edit. <br>3. Change Sector. <br>4. Click "Activate". | New sector configurations apply across Co-Founder suggestions. | Profile state inspection |
| **FT_006** | Startup Co-Founder | Module cards | 1. Click "Idea Validation" card. | Module loads, showing Run analysis view configured with startup data. | DOM check for button visibility |
| **FT_007** | Fleet Directory | Submit model | 1. Go to Fleet tab. <br>2. Click "Submit a Model". <br>3. Enter valid inputs. <br>4. Submit. | Form closes, model is added to list, DB contains submission. | E2E + Postgres validation |
| **FT_008** | Fleet Directory | Submit model validation | 1. Open model submission form. <br>2. Leave URL blank. <br>3. Click submit. | Submission is blocked, showing "URL is required" error message. | Selenium validation check |
| **FT_009** | History Log | History fetch | 1. Go to History tab when logged in. | Page retrieves and list-renders recent MissionHistory rows from Postgres. | DOM item count validation |
| **FT_010** | History Log | Search query filtering | 1. Go to History tab. <br>2. Type specific keyword in search filter. | List updates instantly showing only matching missions. | Selenium text filter check |
| **FT_011** | History Log | Security offline block | 1. Go to History tab in offline mode (no active Google OAuth). | Tab displays "Security Lock Active" state, blocking history visibility. | Lock message display check |
| **FT_012** | ContextPilot | Chatbot interaction | 1. Go to ContextPilot tab → Bots. <br>2. Type query. <br>3. Click Send. | Text lists in chat feed, server responds with relevant response. | Chat history assertion |
| **FT_013** | ContextPilot | Quick add memory | 1. Go to Context Explorer. <br>2. Enter content in Quick Add. <br>3. Click Add. | System adds memory, clears input, showing success notification. | Success alert verification |
| **FT_014** | ContextPilot | Memory deletion | 1. Go to Context Explorer. <br>2. Click "Clear Database" button. | Database drops current index data, statistics card resets count to 0. | DB count = 0 verify |
| **FT_015** | ContextPilot | Vector search retrieval | 1. Add unique memory. <br>2. Search memory keywords in explorer. | Returns matching memory row containing search highlights. | DOM element search |
| **FT_016** | ContextPilot | WhatsApp auto-reply toggles | 1. Toggle "Reply to Unknown" checkbox. <br>2. Refresh settings. | Preference state persists inside configuration file. | Settings check |
| **FT_017** | ContextPilot | WhatsApp chat import | 1. Open Import panel. <br>2. Drag-drop `_chat.txt` file. | File parses, database updates, document counts rise. | DB records increase check |
| **FT_018** | ContextPilot | Gmail MBOX import | 1. Drag-drop valid `.mbox` email archive file. | Parse progresses, email text segments are successfully indexed. | Stats dashboard query |
| **FT_019** | ContextPilot | Zoom VTT import | 1. Drag-drop `.vtt` file. | Ingests dialog rows, linking them to source context metadata. | Stats document verification |
| **FT_020** | ContextPilot | Browser history import | 1. Drag-drop JSON browser export. | Indexed records count includes web history urls and page titles. | Vector search query test |
| **FT_021** | Clipboard Monitor | Auto-trigger copy | 1. Copy string "Deploying new app update" to clipboard. | Tkinter popup window surfaces automatically in ~600ms. | Window handle visibility check |
| **FT_022** | Clipboard Monitor | Short copy block | 1. Copy "Hi there" to clipboard. | System ignores trigger; Tkinter window remains hidden. | Process window count |
| **FT_023** | Clipboard Monitor | Duplicate copy block | 1. Copy "Duplicate query string test" once (popup displays). <br>2. Clear popup. <br>3. Copy same text. | System detects identical value and does not open duplicate popup. | Popup state check |
| **FT_024** | Tkinter Overlay | Search result render | 1. Copy query string. <br>2. Wait for popup. | Popup displays top 3 matches containing snippets from indexed DB. | Tkinter label verification |
| **FT_025** | Tkinter Overlay | Result selection | 1. Click on second result in Tkinter window. | Popup closes, clipboard content updates with selected result text. | Clipboard check |
| **FT_026** | Tkinter Overlay | Dismiss popup | 1. Click overlay. <br>2. Press `ESC`. | Window closes immediately, returning control to background daemon. | Window visibility check |

---

### 3. UI/UX Tests (UI) — 26 Test Cases

*Focuses on visual layout, responsiveness, animations, styles, and interactive user controls.*

| Test ID | Component | Feature under Test | Step-by-Step Instructions | Expected Result | Verification Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UI_001** | Theme | Glassmorphism consistency | 1. Inspect dashboard header, sidebars, and panels. | Elements use correct backdrop filters, gradients, and tailwind configurations. | Visual CSS check |
| **UI_002** | Responsive Layout | Sizing breakpoints | 1. Resize viewport to Mobile (375px), Tablet (768px), and Desktop (1440px). | Layout updates correctly, showing toggle bars or drawer overlays on mobile. | Chrome DevTools simulation |
| **UI_003** | Navigation | Tab styling | 1. Click through Home, Fleet, Co-Founder, History, Context tabs. | Active tab updates styled states, showing focus border/fill. | CSS classes check |
| **UI_004** | Interactivity | Hover states | 1. Hover mouse pointer over Co-Founder module cards. | Cards elevate visually with shadow changes and border highlight transition. | Selenium Actions hover |
| **UI_005** | Loading States | Optimizing spinner | 1. Submit prompt optimization request. | Loading spinner/skeleton animation plays during processing. | DOM check for loader |
| **UI_006** | Chat UI | Chat auto-scroll | 1. Send multiple chat messages until messages exceed panel height. | View automatically scrolls to view newest message at the bottom. | ScrollHeight position check |
| **UI_007** | Modals | Form dialog transition | 1. Trigger "Submit a Model" dialog. | Modal slides/fades in with smooth animation transitions. | Modal opacity inspection |
| **UI_008** | Forms | Input highlight focus | 1. Focus on form input fields. | Active field displays glow ring with colored outline boundary. | Selenium active element check |
| **UI_009** | Notifications | Toast system messages | 1. Trigger database clean operation. | Success toast alert appears, stays for 3s, then fades out. | Toast DOM lifetime check |
| **UI_010** | Settings | Profile presentation | 1. View Google Profile card on Settings tab. | Renders user avatar image, name, and email aligned inside cards. | Image load verification |
| **UI_011** | Accessibility | High contrast text | 1. Analyze dashboard text contrast in dark theme. | All text meets readability contrast standards. | DevTools accessibility auditor |
| **UI_012** | Layout | History text overflow | 1. View history logs containing long task strings. | Overflows are cleanly truncated with ellipses (`...`). | CSS text-overflow verify |
| **UI_013** | Tkinter Popup | Result alignment | 1. Trigger overlay popup. | Items are aligned vertically with score badges matching right column. | Tkinter layout validation |
| **UI_014** | Tkinter Popup | Window opacity | 1. Verify popup window attributes. | Window background supports custom transparency transparency/translucent colors. | Tkinter alpha parameter |
| **UI_015** | Typography | Text size hierarchy | 1. Verify typography styles. | Text components match font hierarchies. | Computed CSS values check |
| **UI_016** | History Log | Empty states | 1. Clear database history. <br>2. Navigate to History list. | Displays placeholder illustrations with helpful tip guides. | DOM illustration check |
| **UI_017** | Forms | Button disable states | 1. Clear forms inputs. <br>2. Check submission action buttons. | Submit button is visually greyed out, displaying disabled cursor state. | Button attributes check |
| **UI_018** | System Tray | Tray menu response | 1. Right-click pystray system tray icon. | Action menu displays instantly next to cursor. | Right-click click action |
| **UI_019** | ContextPilot | Connection badge status | 1. Check server status indicator. | Badge shows green color ("Online") or red ("Offline") with corresponding label text. | CSS border/color status |
| **UI_020** | Ingestion Engine | Drag-and-Drop hover | 1. Drag file item over drop target boundary. | Dropzone changes background color and dashed line style. | Selenium drag hover test |
| **UI_021** | Accessibility | Keyboard tab navigation | 1. Navigate dashboard tabs using Tab key. | Focus ring moves sequentially through tabs. | Active element tracker |
| **UI_022** | Accessibility | Icon button screen reader | 1. Inspect icon buttons (Close, Add, Trash). | Buttons contain descriptive alt text or aria-labels. | Aria-label verification |
| **UI_023** | Controls | Toggle switch UI alignment | 1. Verify alignment of toggle settings switches. | Switched toggles slide color shifts horizontally. | DOM layout alignment |
| **UI_024** | Tkinter Popup | Fade animation | 1. Close overlay popup. | Tkinter fade script transitions window transparency. | Window opacity loop check |
| **UI_025** | Theme | System icon styling | 1. Load context dashboard. | Navigation icons look crisp, rendering standard heights (24px). | SVG sizing verification |
| **UI_026** | Modals | Server disconnect popup | 1. Kill `context_server.py`. <br>2. Interact with ContextPilot tab. | Error modal appears notifying user of offline status. | DOM error panel check |

---

### 4. Validation Tests (VT) — 16 Test Cases

*Verifies boundary conditions, error handling, file parsing rules, and security protections.*

| Test ID | Component | Feature under Test | Step-by-Step Instructions | Expected Result | Verification Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **VT_001** | Ingestion | Corrupt WhatsApp files | 1. Import a file `corrupt.txt` containing binary garbage. | Parsing is aborted safely with descriptive validation warnings. | Progress toast message |
| **VT_002** | Ingestion | Empty file uploads | 1. Ingest an empty text file. | Application rejects file immediately, preventing database commits. | Ingest count unchanged |
| **VT_003** | Directory | Duplicate URLs | 1. Submit model with name "M1" and URL `https://m1.ai`. <br>2. Submit model with name "M2" and same URL. | System raises database constraint error, showing conflict message. | DB constraint verification |
| **VT_004** | Optimization | Excessively long prompt | 1. Pass a 15,000 character prompt to optimization route. | API blocks request or truncates safely, preventing model buffer overflow. | HTTP 400 or graceful limit |
| **VT_005** | Ingestion | Large file block | 1. Ingest a 50MB document archive file. | System blocks upload on frontend before server execution. | Warning popup check |
| **VT_006** | Security | Search SQL injection | 1. Search memory using query: `' UNION SELECT username, password FROM users --`. | Search query passes as literal string, returning zero database leakage. | SQLite syntax error check |
| **VT_007** | Security | Quick Add XSS protection | 1. Quick Add memory content: `<script>alert('hack')</script>`. <br>2. Search and render results. | Script executes as safe text; scripts do not run in DOM. | DOM node type check |
| **VT_008** | Database | SQLite lock protection | 1. Execute five concurrent import tasks on ContextPilot. | SQLite database handles concurrency with proper thread wait/lock release. | Write conflicts count = 0 |
| **VT_009** | Session | Token timeout | 1. Expire Google OAuth session token manually. <br>2. Navigate Dashboard. | User session is signed out automatically, displaying login prompt. | Redirect check |
| **VT_010** | Security | API endpoint protection | 1. Send GET to `/api/context/stats` from terminal without authorization. | Endpoint blocks access, returning HTTP 401 Unauthorized. | Terminal curl check |
| **VT_011** | Ingestion | Corrupt MBOX headers | 1. Import `.mbox` file with missing headers. | Parser skips corrupt headers, extracting remaining healthy emails. | Indexed count validation |
| **VT_012** | Core | Offline prompt optimize | 1. Disconnect internet. <br>2. Optimize prompt. | UI presents offline error option without crashing frontend script. | Error dialog verification |
| **FT_013** | Core | Connection retry | 1. Terminate server. <br>2. Click retry connection. <br>3. Restart server. | Client reconnects and retrieves normal application states. | Connection status check |
| **VT_014** | Config | Invalid JSON settings | 1. Write malformed JSON string into settings config file. | System falls back to default settings, warning in server console. | Startup fallback check |
| **VT_015** | Startup | Port conflict resolver | 1. Bind port 8001 to mock service. <br>2. Run `python context_server.py`. | Server outputs clean "Port 8001 already in use" message and exits. | Console output match |
| **VT_016** | Config | Bad WhatsApp configs | 1. Put string values in boolean WhatsApp fields inside `whatsapp-config.json`. | App ignores invalid types, preserving existing configuration. | Config validation check |

---

### 5. Deployable Status & Infrastructure Tests (DS) — 16 Test Cases

*Verifies configurations, environments, compilation states, and backend processes.*

| Test ID | Component | Feature under Test | Step-by-Step Instructions | Expected Result | Verification Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DS_001** | Infrastructure | Port 8001 listening | 1. Check TCP status on port 8001. | FastAPI context server listens for search/ingest actions. | Port bind socket check |
| **DS_002** | Infrastructure | Port 8002 listening | 1. Check TCP status on port 8002. | WhatsApp Baileys service listens for incoming webhook connections. | Port bind socket check |
| **DS_003** | Infrastructure | Port 9002 listening | 1. Check TCP status on port 9002. | Next.js development server serves dashboard client. | Port bind socket check |
| **DS_004** | Infrastructure | Port 8000 listening | 1. Check TCP status on port 8000. | Gemma backend model server is listening. | Port bind socket check |
| **DS_005** | Configuration | Environment variables | 1. Check for presence of `.env` file. | Config contains `DATABASE_URL` and `NEXTAUTH_URL`. | File existence check |
| **DS_006** | Configuration | Local Environment settings | 1. Check `.env.local` settings. | Contains valid local developer options. | File check |
| **DS_007** | Database | Railway DB connection | 1. Ping remote PostgreSQL database. | Response is quick (under 300ms) with valid DB handle. | Ping latency verification |
| **DS_008** | Database | Prisma migration checks | 1. Execute `npx prisma db push` or check migration records. | Database schema columns match Prisma client configurations. | Migration logs check |
| **DS_009** | Build | Next.js compilation | 1. Execute `npm run build`. | Project compiles without syntax or typescript interface compile errors. | Command terminal exit code |
| **DS_010** | Build | Static export build | 1. Run static builds checking outputs. | Static directories (`out/` or `.next/` cache) are populated. | Directory size verification |
| **DS_011** | Database | SQLite vector file check | 1. Check SQLite directory path. | File `contextpilot.db` exists with readable file permissions. | File size verification |
| **DS_012** | Daemon | Tkinter support checks | 1. Execute `python -c "import tkinter"`. | Python libraries find tkinter environment components without DLL error. | Terminal import verification |
| **DS_013** | Environment | Node modules check | 1. Execute package dependencies review. | All packages in `node_modules` match versions in `package.json`. | Dependency status check |
| **DS_014** | Environment | Python requirements | 1. Check python packages. | Installed dependencies match modules listed in `requirements.txt`. | Pip freeze checks |
| **DS_015** | Network | HuggingFace connection | 1. Ping HuggingFace inference API. | Connection succeeds with active response packets. | Net socket connection |
| **DS_016** | Integration | Baileys startup check | 1. Initialize WhatsApp connection modules. | Baileys engine starts socket session listener cleanly. | Node process status |

---

## 📈 Test Execution and Reporting

To run the automated tests defined in this suite:
1. Make sure all backend servers are active.
2. Navigate to the `selenium_tests` directory.
3. Run:
   ```bash
   pytest tests/test_flow.py -v
   ```
4. View the generated report in `selenium_tests/reports/test_automation_report.xlsx` for detailed pass/fail logs, run times, and failure diagnostics (including screenshots).
