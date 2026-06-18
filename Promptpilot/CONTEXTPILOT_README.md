# ContextPilot MVP — Universal Silent Search Layer

> **Type anything. Remember everything. Powered by local Gemma.**

---

## What It Does

ContextPilot runs silently in the background. It:

1. **Indexes** your messages, emails, transcripts, documents, browser history — locally on your machine
2. **Monitors** your clipboard (or global hotkey) for new text
3. **Surfaces** the top 3 most relevant things you've ever said, wrote, or found — in under 500ms
4. **Pops up** a native overlay on your desktop with results — no manual searching

Your data **never leaves your machine**. All embeddings computed locally with `sentence-transformers`. Optional re-ranking via your local Gemma model.

---

## Quick Start (Windows)

### Option A — One-click launcher
```
Double-click: START_CONTEXTPILOT.bat
```
This starts all 3 services in separate windows.

### Option B — Manual (3 terminals)

**Terminal 1 — Search backend:**
```bash
python context_server.py
```
Starts the FastAPI server on `http://127.0.0.1:8001`

**Terminal 2 — Desktop overlay daemon:**
```bash
python context_daemon.py
```
Starts the system tray app and clipboard monitor

**Terminal 3 — Dashboard:**
```bash
npm run dev
```
Opens the web dashboard at `http://localhost:9002` → click **ContextPilot** tab

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Your Apps (Gmail, WhatsApp, Notion, etc.)                  │
│       ↓ copy text                                           │
│  context_daemon.py  ←──── clipboard monitor (500ms poll)   │
│       ↓ query                                               │
│  context_server.py  ←──── FastAPI on :8001                  │
│       │                                                     │
│       ├── SQLite DB (contextpilot.db)                       │
│       ├── sentence-transformers embeddings (all-MiniLM-L6)  │
│       ├── BM25 keyword search (hybrid)                      │
│       └── Gemma re-ranking (optional, via port 8000)        │
│       ↓ top 3 results                                       │
│  Tkinter popup overlay (native OS window)                   │
│  OR                                                         │
│  Next.js Dashboard (http://localhost:9002 → ContextPilot)   │
└─────────────────────────────────────────────────────────────┘
```

---

## Importing Your Data

### WhatsApp
1. Open WhatsApp → Chat → ⋮ → More → Export Chat → Without Media
2. Save the `_chat.txt` file
3. In the Dashboard → ContextPilot tab → Import → WhatsApp → select file

### Gmail
1. Go to [Google Takeout](https://takeout.google.com/) → Select Gmail → Export
2. Extract the `.mbox` file from the downloaded archive
3. Dashboard → Import → Gmail → select `.mbox`

### Zoom Transcripts
1. In Zoom → Recordings → find meeting → Download Transcript (`.vtt`)
2. Dashboard → Import → Zoom → select `.vtt`

### Browser History
1. Chrome: Settings → Privacy → Download browsing history (or use [this extension](https://chrome.google.com/webstore/detail/export-history))
2. Dashboard → Import → Browser → select `.json`

### Quick Add
- Paste **any text** directly in the dashboard → "Quick Add Memory"
- Works for meeting notes, Slack snippets, anything you copy-paste

---

## Using the Overlay Daemon

Once `context_daemon.py` is running:

| Action | What happens |
|---|---|
| Copy any text (3+ words) | Popup appears automatically in 600ms |
| Press `Ctrl+Shift+Space` | Manually triggers search on clipboard |
| Click a result | Copies it to clipboard |
| Press `ESC` | Dismisses popup |
| System tray icon | Right-click for options |

The popup auto-dismisses after 8 seconds.

---

## Gemma Re-ranking

When `gemma_server.py` is running on port 8000 (your existing Gemma server), you can enable **Gemma Re-ranking** in the dashboard. This asks your local Gemma model to pick the most relevant results from the hybrid shortlist, improving accuracy at the cost of ~1-2 seconds latency.

Toggle: Dashboard → ContextPilot tab → **Gemma Re-rank** button

---

## File Structure

```
Promptpilot/
├── context_server.py      ← FastAPI search + ingest backend
├── context_daemon.py      ← System tray + clipboard + overlay popup
├── contextpilot.db        ← Local SQLite database (auto-created)
├── START_CONTEXTPILOT.bat ← One-click Windows launcher
├── gemma_server.py        ← Existing Gemma server (for re-ranking)
└── src/
    ├── app/api/context/
    │   ├── search/route.ts    ← Search proxy
    │   ├── stats/route.ts     ← Stats + clear proxy
    │   └── ingest/route.ts    ← File ingest proxy
    └── components/contextpilot/
        └── ContextPilotTab.tsx ← Dashboard UI
```

---

## Privacy

- ✅ All data stored in `contextpilot.db` on your local machine
- ✅ Embeddings computed locally (no API calls for indexing)
- ✅ Optional Gemma re-ranking uses your local model on port 8000
- ✅ The daemon only reads your clipboard — it does not log keystrokes
- ⚠️ Delete `contextpilot.db` at any time to wipe all memories

---

## Troubleshooting

**"context_server.py not reachable"**
- Make sure you ran `python context_server.py` first
- First run downloads `all-MiniLM-L6-v2` model (~80MB) — wait for it

**"No results for my query"**
- Import some data first via the Import panel or Quick Add
- Try a different query — the model understands synonyms

**Popup not appearing**
- Make sure `context_daemon.py` is running
- Copy text with ≥3 words to trigger it
- Check that `context_server.py` is also running

**Gemma re-ranking fails**
- Start `gemma_server.py` on port 8000 first
- Or just use "Fast (Hybrid)" mode — it's already great
