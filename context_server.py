"""
ContextPilot — Universal Silent Search Backend
FastAPI server with:
  - Local SQLite + numpy vector store (no cloud needed)
  - sentence-transformers for fast local embeddings
  - BM25 keyword search fallback
  - Gemma LLM re-ranking via existing gemma_server.py on port 8000
  - /search endpoint returns top-3 results in <500ms
  - /ingest endpoints for WhatsApp, browser history, Gmail export, plain text
"""

import os, sys, json, sqlite3, time, hashlib, re, subprocess
from pathlib import Path
from datetime import datetime
from typing import List, Optional, Dict, Any

# ─── Auto-install dependencies ────────────────────────────────────────────────
REQUIRED = [
    "fastapi", "uvicorn", "pydantic", "sentence-transformers",
    "numpy", "rank-bm25", "python-dotenv", "requests", "python-multipart"
]
IMPORT_NAMES = {
    "sentence-transformers": "sentence_transformers",
    "rank-bm25":             "rank_bm25",
    "python-dotenv":         "dotenv",
    "python-multipart":      "multipart",
}
for pkg in REQUIRED:
    import_name = IMPORT_NAMES.get(pkg, pkg.replace("-", "_").split("[")[0])
    try:
        if pkg == "python-multipart":
            from multipart.multipart import parse_options_header
        else:
            __import__(import_name)
    except ImportError:
        print(f"[ContextPilot] Installing {pkg}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", pkg, "-q"])

import numpy as np                                     # type: ignore
from fastapi import FastAPI, HTTPException, UploadFile, File, Form  # type: ignore
from fastapi.middleware.cors import CORSMiddleware      # type: ignore
from pydantic import BaseModel                          # type: ignore
import uvicorn                                          # type: ignore
from sentence_transformers import SentenceTransformer  # type: ignore
from rank_bm25 import BM25Okapi                        # type: ignore
import requests                                         # type: ignore

# ─── Config ───────────────────────────────────────────────────────────────────
DB_PATH   = Path(__file__).parent / "contextpilot.db"
MODEL_ID  = "all-MiniLM-L6-v2"   # 80MB, fast, great quality
GEMMA_URL = "http://127.0.0.1:8000/v1/chat/completions"
PORT      = 8001

print(f"[ContextPilot] Loading embedding model '{MODEL_ID}'...")
embedder = SentenceTransformer(MODEL_ID)
print("[ContextPilot] Embedding model ready.")

# ─── Database ─────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS memories (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            content     TEXT    NOT NULL,
            source      TEXT    NOT NULL DEFAULT 'manual',
            source_app  TEXT    NOT NULL DEFAULT 'unknown',
            created_at  TEXT    NOT NULL,
            metadata    TEXT    DEFAULT '{}',
            content_hash TEXT   UNIQUE,
            embedding   BLOB
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_source ON memories(source_app)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_created ON memories(created_at)")
    conn.commit()
    conn.close()
    print(f"[ContextPilot] Database ready at {DB_PATH}")

init_db()

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="ContextPilot Search API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ─── Pydantic Models ──────────────────────────────────────────────────────────
class Memory(BaseModel):
    content:    str
    source:     str = "manual"
    source_app: str = "unknown"
    metadata:   Dict[str, Any] = {}

class SearchRequest(BaseModel):
    query:      str
    top_k:      int = 3
    use_gemma:  bool = False   # Set True to enable Gemma re-ranking (slower)
    source_app: Optional[str] = None

class IngestTextRequest(BaseModel):
    text:    str
    source:  str = "paste"
    app:     str = "unknown"
    meta:    Dict[str, Any] = {}

# ─── Core: embed + store ──────────────────────────────────────────────────────
def _hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()

def embed(texts: List[str]) -> np.ndarray:
    return embedder.encode(texts, normalize_embeddings=True, show_progress_bar=False)

def store_memory(content: str, source: str, source_app: str, metadata: dict = {}) -> int | None:
    """Store a memory chunk. Returns row ID or None if duplicate."""
    content = content.strip()
    min_len = 2 if source == "whatsapp" else 10
    if len(content) < min_len:
        return None
    h = _hash(content)
    emb = embed([content])[0]
    emb_bytes = emb.astype(np.float32).tobytes()
    conn = get_db()
    try:
        cur = conn.execute(
            """INSERT OR IGNORE INTO memories
               (content, source, source_app, created_at, metadata, content_hash, embedding)
               VALUES (?,?,?,?,?,?,?)""",
            (content, source, source_app,
             datetime.utcnow().isoformat(), json.dumps(metadata), h, emb_bytes)
        )
        conn.commit()
        return cur.lastrowid if cur.rowcount > 0 else None
    finally:
        conn.close()

def load_all_memories(source_app: Optional[str] = None):
    conn = get_db()
    if source_app:
        rows = conn.execute(
            "SELECT id, content, source, source_app, created_at, metadata, embedding FROM memories WHERE source_app = ?",
            (source_app,)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT id, content, source, source_app, created_at, metadata, embedding FROM memories"
        ).fetchall()
    conn.close()
    return rows

# ─── Core: search ─────────────────────────────────────────────────────────────
def search_memories(query: str, top_k: int = 3, use_gemma: bool = False, source_app: Optional[str] = None) -> List[Dict]:
    t0 = time.time()
    rows = load_all_memories(source_app)
    if not rows:
        return []

    contents    = [r["content"] for r in rows]
    source_apps = [r["source_app"] for r in rows]
    created_ats = [r["created_at"] for r in rows]
    metadatas   = [json.loads(r["metadata"] or "{}") for r in rows]

    # ── Semantic search ──────────────────────────────────────────────────────
    q_emb = embed([query])[0]
    embeddings = []
    valid_rows = []
    for r in rows:
        if r["embedding"]:
            arr = np.frombuffer(r["embedding"], dtype=np.float32)
            if arr.shape[0] == q_emb.shape[0]:
                embeddings.append(arr)
                valid_rows.append(r)

    semantic_scores = {}
    if embeddings:
        emb_matrix = np.stack(embeddings)
        sims = emb_matrix @ q_emb   # cosine similarity (normalized)
        for i, r in enumerate(valid_rows):
            semantic_scores[r["id"]] = float(sims[i])

    # ── BM25 keyword search ───────────────────────────────────────────────────
    tokenized = [c.lower().split() for c in contents]
    bm25 = BM25Okapi(tokenized)
    bm25_raw = bm25.get_scores(query.lower().split())
    bm25_max = float(bm25_raw.max()) if bm25_raw.max() > 0 else 1.0
    bm25_scores = {rows[i]["id"]: float(bm25_raw[i]) / bm25_max for i in range(len(rows))}

    # ── Combine scores (hybrid) ───────────────────────────────────────────────
    ALPHA = 0.7   # weight for semantic vs keyword
    combined = {}
    for r in rows:
        rid = r["id"]
        sem  = semantic_scores.get(rid, 0.0)
        bm25 = bm25_scores.get(rid, 0.0)
        combined[rid] = ALPHA * sem + (1 - ALPHA) * bm25

    sorted_ids = sorted(combined, key=combined.get, reverse=True)[:top_k * 3]

    # ── Build candidate results ───────────────────────────────────────────────
    id_to_row = {r["id"]: r for r in rows}
    candidates = []
    for rid in sorted_ids:
        r = id_to_row[rid]
        candidates.append({
            "id":         rid,
            "content":    r["content"],
            "source":     r["source"],
            "source_app": r["source_app"],
            "created_at": r["created_at"],
            "metadata":   json.loads(r["metadata"] or "{}"),
            "score":      round(combined[rid], 4),
        })

    # ── Optional: Gemma re-ranking ─────────────────────────────────────────
    if use_gemma and candidates:
        try:
            candidates = gemma_rerank(query, candidates, top_k)
        except Exception as e:
            print(f"[ContextPilot] Gemma re-rank failed, using hybrid scores: {e}")
            candidates = candidates[:top_k]
    else:
        candidates = candidates[:top_k]

    elapsed = int((time.time() - t0) * 1000)
    print(f"[ContextPilot] Search '{query[:40]}...' -> {len(candidates)} results in {elapsed}ms")
    return candidates

def gemma_rerank(query: str, candidates: List[Dict], top_k: int) -> List[Dict]:
    """Ask local Gemma to pick the most relevant results from candidates."""
    snippets = "\n".join([
        f"[{i+1}] (from {c['source_app']}, {c['created_at'][:10]}): {c['content'][:200]}"
        for i, c in enumerate(candidates)
    ])
    prompt = f"""You are a relevance ranking assistant.
Query: "{query}"

Candidate memories:
{snippets}

Return ONLY a JSON array of the indices (1-based) of the top {top_k} most relevant items, from most to least relevant.
Example: [2, 1, 4]"""

    resp = requests.post(GEMMA_URL, json={
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.0,
        "max_tokens": 64
    }, timeout=10)
    resp.raise_for_status()
    raw = resp.json()["choices"][0]["message"]["content"].strip()
    # parse JSON array from response
    match = re.search(r'\[[\d,\s]+\]', raw)
    if not match:
        return candidates[:top_k]
    indices = json.loads(match.group())
    reranked = []
    for idx in indices:
        if 1 <= idx <= len(candidates):
            reranked.append(candidates[idx - 1])
    # fill remaining if needed
    seen = {c["id"] for c in reranked}
    for c in candidates:
        if len(reranked) >= top_k:
            break
        if c["id"] not in seen:
            reranked.append(c)
    return reranked[:top_k]

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    conn = get_db()
    count = conn.execute("SELECT COUNT(*) FROM memories").fetchone()[0]
    conn.close()
    return {"status": "ok", "memories_indexed": count, "model": MODEL_ID}

@app.post("/search")
def search(req: SearchRequest):
    if not req.query.strip():
        raise HTTPException(400, "Query cannot be empty")
    results = search_memories(req.query, req.top_k, req.use_gemma, req.source_app)
    return {"query": req.query, "results": results, "count": len(results)}

@app.post("/memories")
def add_memory(mem: Memory):
    row_id = store_memory(mem.content, mem.source, mem.source_app, mem.metadata)
    if row_id is None:
        return {"status": "duplicate", "message": "Already indexed"}
    return {"status": "ok", "id": row_id}

@app.delete("/memories")
def clear_all():
    conn = get_db()
    conn.execute("DELETE FROM memories")
    conn.commit()
    conn.close()
    return {"status": "cleared"}

@app.get("/memories/gmail-ids")
def get_gmail_ids():
    conn = get_db()
    rows = conn.execute(
        "SELECT metadata FROM memories WHERE source_app = 'Gmail'"
    ).fetchall()
    conn.close()
    gmail_ids = []
    for r in rows:
        try:
            meta = json.loads(r["metadata"] or "{}")
            gid = meta.get("gmail_id")
            if gid:
                gmail_ids.append(gid)
        except Exception:
            pass
    return {"gmail_ids": gmail_ids}

@app.get("/memories")
def get_recent_memories(limit: int = 50, source_app: Optional[str] = None):
    conn = get_db()
    if source_app:
        rows = conn.execute(
            "SELECT id, content, source, source_app, created_at, metadata FROM memories WHERE source_app = ? ORDER BY created_at DESC LIMIT ?",
            (source_app, limit)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT id, content, source, source_app, created_at, metadata FROM memories ORDER BY created_at DESC LIMIT ?",
            (limit,)
        ).fetchall()
    conn.close()
    results = []
    for r in rows:
        item = dict(r)
        try:
            item["metadata"] = json.loads(r["metadata"] or "{}")
        except Exception:
            item["metadata"] = {}
        results.append(item)
    return {"results": results}

@app.get("/memories/stats")
def stats():
    conn = get_db()
    rows = conn.execute("""
        SELECT source_app, COUNT(*) as count, MAX(created_at) as last_seen
        FROM memories GROUP BY source_app ORDER BY count DESC
    """).fetchall()
    total = conn.execute("SELECT COUNT(*) FROM memories").fetchone()[0]
    conn.close()
    return {
        "total": total,
        "by_source": [dict(r) for r in rows]
    }

# ─── Ingest: plain text / paste ───────────────────────────────────────────────
@app.post("/ingest/text")
def ingest_text(req: IngestTextRequest):
    chunks = chunk_text(req.text)
    stored = 0
    for chunk in chunks:
        if store_memory(chunk, req.source, req.app, req.meta):
            stored += 1
    return {"status": "ok", "chunks_stored": stored, "total_chunks": len(chunks)}

# ─── Ingest: WhatsApp export (_chat.txt) ─────────────────────────────────────
@app.post("/ingest/whatsapp")
async def ingest_whatsapp(file: UploadFile = File(...)):
    content = (await file.read()).decode("utf-8", errors="replace")
    messages = parse_whatsapp_export(content)
    stored = 0
    for msg in messages:
        if store_memory(msg["content"], "whatsapp", "WhatsApp", msg["meta"]):
            stored += 1
    return {"status": "ok", "messages_parsed": len(messages), "stored": stored}

def parse_whatsapp_export(text: str) -> List[Dict]:
    """Parse WhatsApp _chat.txt export format."""
    pattern = re.compile(
        r'(\d{1,2}/\d{1,2}/\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\s*[-–]\s*([^:]+):\s*(.*)'
    )
    results = []
    for line in text.splitlines():
        m = pattern.match(line.strip())
        if m:
            date, time_str, sender, body = m.groups()
            body = body.strip()
            if body and not body.startswith('<') and len(body) > 3:
                results.append({
                    "content": f"{sender}: {body}",
                    "meta": {"sender": sender.strip(), "date": date, "time": time_str}
                })
    return results

# ─── Ingest: browser history (Chrome/Edge exported JSON or CSV) ───────────────
@app.post("/ingest/browser")
async def ingest_browser(file: UploadFile = File(...)):
    content = (await file.read()).decode("utf-8", errors="replace")
    items = parse_browser_history(content, file.filename or "history")
    stored = 0
    for item in items:
        text = f"[Browser] {item['title']} — {item['url']}"
        if store_memory(text, "browser", "Browser", item):
            stored += 1
    return {"status": "ok", "items_parsed": len(items), "stored": stored}

def parse_browser_history(content: str, filename: str) -> List[Dict]:
    items = []
    # Try JSON first (Chrome takeout format)
    try:
        data = json.loads(content)
        if isinstance(data, list):
            for entry in data:
                url   = entry.get("url", "")
                title = entry.get("title", url)
                if url and "chrome://" not in url and "about:" not in url:
                    items.append({"url": url, "title": title})
        return items
    except json.JSONDecodeError:
        pass
    # CSV fallback
    for line in content.splitlines()[1:]:
        parts = line.split(",")
        if len(parts) >= 2:
            url   = parts[0].strip().strip('"')
            title = parts[1].strip().strip('"')
            if url.startswith("http"):
                items.append({"url": url, "title": title})
    return items

# ─── Ingest: Gmail export (.mbox or plain text) ──────────────────────────────
@app.post("/ingest/gmail")
async def ingest_gmail(file: UploadFile = File(...)):
    content = (await file.read()).decode("utf-8", errors="replace")
    emails = parse_gmail_export(content)
    stored = 0
    for em in emails:
        if store_memory(em["content"], "email", "Gmail", em["meta"]):
            stored += 1
    return {"status": "ok", "emails_parsed": len(emails), "stored": stored}

def parse_gmail_export(text: str) -> List[Dict]:
    """Simple mbox / plain text parser — extracts From:, Subject:, body chunks."""
    emails = []
    blocks = re.split(r'^From ', text, flags=re.MULTILINE)
    for block in blocks[1:]:
        lines = block.splitlines()
        subject = ""
        sender  = ""
        body_lines = []
        in_body = False
        for line in lines:
            if line.lower().startswith("subject:"):
                subject = line[8:].strip()
            elif line.lower().startswith("from:"):
                sender = line[5:].strip()
            elif line == "" and not in_body:
                in_body = True
            elif in_body:
                body_lines.append(line)
            if len(body_lines) > 80:
                break
        body = " ".join(body_lines).strip()
        if subject or body:
            chunk = f"Email from {sender} — Subject: {subject}\n{body[:500]}"
            emails.append({"content": chunk, "meta": {"subject": subject, "from": sender}})
    return emails

# ─── Ingest: Zoom transcript (.vtt or .txt) ───────────────────────────────────
@app.post("/ingest/zoom")
async def ingest_zoom(file: UploadFile = File(...)):
    content = (await file.read()).decode("utf-8", errors="replace")
    segments = parse_zoom_transcript(content)
    stored = 0
    for seg in segments:
        if store_memory(seg["content"], "zoom", "Zoom", seg["meta"]):
            stored += 1
    return {"status": "ok", "segments_parsed": len(segments), "stored": stored}

def parse_zoom_transcript(text: str) -> List[Dict]:
    """Parse Zoom .vtt transcript format."""
    segments = []
    # VTT format
    vtt_pattern = re.compile(
        r'(\d+:\d+:\d+\.\d+\s*-->\s*\d+:\d+:\d+\.\d+)\n(.+?)(?=\n\d+:\d+|\Z)',
        re.DOTALL
    )
    matches = vtt_pattern.findall(text)
    if matches:
        for ts, body in matches:
            content = re.sub(r'<[^>]+>', '', body).strip()
            if content and len(content) > 5:
                segments.append({"content": f"[Zoom] {content}", "meta": {"timestamp": ts.strip()}})
    else:
        # Plain transcript: "HH:MM:SS SPEAKER: text"
        plain = re.compile(r'(\d+:\d+:\d+)\s+(.+?):\s+(.+)')
        for line in text.splitlines():
            m = plain.match(line)
            if m:
                ts, speaker, utterance = m.groups()
                segments.append({
                    "content": f"[Zoom] {speaker}: {utterance}",
                    "meta": {"timestamp": ts, "speaker": speaker}
                })
    return segments

# ─── Ingest: generic file (any .txt, .md, .json) ─────────────────────────────
@app.post("/ingest/file")
async def ingest_file(
    file: UploadFile = File(...),
    source_app: str = Form("file")
):
    content = (await file.read()).decode("utf-8", errors="replace")
    chunks = chunk_text(content)
    stored = 0
    for chunk in chunks:
        if store_memory(chunk, "file", source_app, {"filename": file.filename}):
            stored += 1
    return {"status": "ok", "chunks": len(chunks), "stored": stored, "filename": file.filename}

# ─── Helpers ──────────────────────────────────────────────────────────────────
def chunk_text(text: str, max_chars: int = 400, overlap: int = 80) -> List[str]:
    """Split large text into overlapping chunks for better recall."""
    text  = text.strip()
    if len(text) <= max_chars:
        return [text] if len(text) >= 10 else []
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks, buf = [], ""
    for sent in sentences:
        if len(buf) + len(sent) > max_chars:
            if buf:
                chunks.append(buf.strip())
            buf = sent
        else:
            buf += (" " if buf else "") + sent
    if buf.strip():
        chunks.append(buf.strip())
    return chunks

# ─── Run ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"[ContextPilot] Starting search server on port {PORT}")
    uvicorn.run(app, host="127.0.0.1", port=PORT, log_level="warning")
