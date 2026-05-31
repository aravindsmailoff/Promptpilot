"""
ContextPilot — Desktop Overlay Daemon (Windows)
Runs silently in the system tray.
Every 500ms polls the clipboard; when text changes and is ≥3 words,
queries context_server.py and shows a floating tkinter popup with top 3 results.
Also provides global hotkey: Ctrl+Shift+Space to manually trigger search.
"""

import sys, os, time, json, threading, subprocess

# ─── Auto-install ─────────────────────────────────────────────────────────────
REQUIRED = ["requests", "pyperclip", "pystray", "Pillow", "keyboard"]
for pkg in REQUIRED:
    try:
        __import__(pkg.split("[")[0].replace("-", "_"))
    except ImportError:
        print(f"[Daemon] Installing {pkg}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", pkg, "-q"])

import tkinter as tk
from tkinter import ttk
import requests       # type: ignore
import pyperclip      # type: ignore
import pystray        # type: ignore
from pystray import MenuItem as item  # type: ignore
from PIL import Image, ImageDraw      # type: ignore
import keyboard       # type: ignore

# ─── Config ───────────────────────────────────────────────────────────────────
CONTEXT_SERVER = "http://127.0.0.1:8001"
POLL_MS        = 600          # clipboard polling interval (ms)
MIN_WORDS      = 3            # min words to trigger search
POPUP_DURATION = 8            # seconds before popup auto-closes
TOP_K          = 3
HOTKEY         = "ctrl+shift+space"

# Source app → icon emoji (for display)
SOURCE_ICONS = {
    "WhatsApp": "💬",
    "Gmail":    "📧",
    "Browser":  "🌐",
    "Zoom":     "🎥",
    "file":     "📄",
    "manual":   "📝",
    "paste":    "📋",
    "unknown":  "🔍",
}

# ─── State ────────────────────────────────────────────────────────────────────
last_clipboard  = ""
popup_window    = None
popup_lock      = threading.Lock()
daemon_running  = True

# ─── Clipboard Monitor ────────────────────────────────────────────────────────
def word_count(text: str) -> int:
    return len(text.strip().split())

def monitor_clipboard():
    global last_clipboard
    while daemon_running:
        try:
            clip = pyperclip.paste()
            if clip != last_clipboard and word_count(clip) >= MIN_WORDS:
                last_clipboard = clip
                threading.Thread(target=trigger_search, args=(clip,), daemon=True).start()
        except Exception:
            pass
        time.sleep(POLL_MS / 1000)

def trigger_search(query: str):
    """Query context server and display popup if results found."""
    try:
        resp = requests.post(
            f"{CONTEXT_SERVER}/search",
            json={"query": query.strip()[:300], "top_k": TOP_K, "use_gemma": False},
            timeout=2
        )
        if resp.status_code == 200:
            data = resp.json()
            results = data.get("results", [])
            if results:
                show_popup(query.strip(), results)
    except Exception as e:
        pass  # Server might be offline, fail silently

# ─── Popup UI (tkinter) ───────────────────────────────────────────────────────
def show_popup(query: str, results: list):
    global popup_window
    with popup_lock:
        # Destroy previous popup if open
        if popup_window and popup_window.winfo_exists():
            try:
                popup_window.destroy()
            except Exception:
                pass

        root = tk.Tk()
        popup_window = root
        root.title("ContextPilot")
        root.overrideredirect(True)          # No window chrome
        root.attributes("-topmost", True)    # Always on top
        root.attributes("-alpha", 0.97)
        root.configure(bg="#0a0f1e")

        # ── Position: bottom-right corner ────────────────────────────────────
        sw = root.winfo_screenwidth()
        sh = root.winfo_screenheight()
        w, h = 440, 320
        x = sw - w - 20
        y = sh - h - 60
        root.geometry(f"{w}x{h}+{x}+{y}")

        # ── Header ───────────────────────────────────────────────────────────
        hdr = tk.Frame(root, bg="#131929", pady=10, padx=14)
        hdr.pack(fill="x")

        tk.Label(
            hdr, text="⚡ ContextPilot",
            bg="#131929", fg="#3b82f6",
            font=("Segoe UI", 11, "bold")
        ).pack(side="left")

        close_btn = tk.Label(hdr, text="✕", bg="#131929", fg="#ffffff66",
                             font=("Segoe UI", 12), cursor="hand2")
        close_btn.pack(side="right")
        close_btn.bind("<Button-1>", lambda e: root.destroy())

        # Query preview
        q_preview = query[:55] + "…" if len(query) > 55 else query
        tk.Label(
            root, text=f'  Results for: "{q_preview}"',
            bg="#0a0f1e", fg="#64748b",
            font=("Segoe UI", 8), anchor="w"
        ).pack(fill="x", padx=4, pady=(4, 2))

        # ── Results ──────────────────────────────────────────────────────────
        colors = ["#1e3a5f", "#1a2f47", "#152437"]
        for i, result in enumerate(results[:TOP_K]):
            app_name = result.get("source_app", "unknown")
            icon     = SOURCE_ICONS.get(app_name, "🔍")
            content  = result.get("content", "")
            date_raw = result.get("created_at", "")
            date     = date_raw[:10] if date_raw else ""
            score    = result.get("score", 0)

            # Truncate long content
            preview = content[:180] + "…" if len(content) > 180 else content

            card = tk.Frame(root, bg=colors[i % len(colors)],
                            padx=12, pady=8, relief="flat", bd=0)
            card.pack(fill="x", padx=8, pady=3)

            # Source + date header
            meta_row = tk.Frame(card, bg=colors[i % len(colors)])
            meta_row.pack(fill="x")
            tk.Label(
                meta_row, text=f"{icon} {app_name}",
                bg=colors[i % len(colors)], fg="#60a5fa",
                font=("Segoe UI", 8, "bold")
            ).pack(side="left")
            tk.Label(
                meta_row, text=f"{date}  ·  {int(score*100)}% match",
                bg=colors[i % len(colors)], fg="#475569",
                font=("Segoe UI", 7)
            ).pack(side="right")

            # Content
            tk.Label(
                card, text=preview,
                bg=colors[i % len(colors)], fg="#e2e8f0",
                font=("Segoe UI", 9), wraplength=400, justify="left", anchor="w"
            ).pack(fill="x", pady=(4, 0))

            # Copy on click
            def make_copy(text):
                def copy(e=None):
                    pyperclip.copy(text)
                return copy

            card.bind("<Button-1>", make_copy(content))
            for child in card.winfo_children():
                child.bind("<Button-1>", make_copy(content))

        # ── Footer ───────────────────────────────────────────────────────────
        footer = tk.Frame(root, bg="#080d1a", pady=6)
        footer.pack(fill="x", side="bottom")
        tk.Label(
            footer, text="Click any result to copy  ·  ESC to dismiss",
            bg="#080d1a", fg="#334155",
            font=("Segoe UI", 7)
        ).pack()

        # Animate in (slide up)
        def slide_in(step=0):
            if step <= 10:
                offset = int((10 - step) * 3)
                root.geometry(f"{w}x{h}+{x}+{y + offset}")
                root.after(15, lambda: slide_in(step + 1))

        slide_in()

        # Auto-close after N seconds
        root.after(POPUP_DURATION * 1000, lambda: root.destroy() if root.winfo_exists() else None)

        # ESC to close
        root.bind("<Escape>", lambda e: root.destroy())

        root.mainloop()

# ─── System Tray ─────────────────────────────────────────────────────────────
def create_tray_icon():
    """Create a simple system tray icon."""
    img = Image.new("RGB", (64, 64), color="#0a0f1e")
    d   = ImageDraw.Draw(img)
    d.ellipse([8, 8, 56, 56], fill="#3b82f6")
    d.text((20, 20), "C", fill="#ffffff")

    def on_quit(icon, item):
        global daemon_running
        daemon_running = False
        icon.stop()
        os._exit(0)

    def on_search(icon, item):
        try:
            clip = pyperclip.paste()
            if clip and word_count(clip) >= 1:
                threading.Thread(target=trigger_search, args=(clip,), daemon=True).start()
        except Exception:
            pass

    def on_open_dashboard(icon, item):
        import webbrowser
        webbrowser.open("http://localhost:9002")

    menu = pystray.Menu(
        item("🔍 Search Clipboard Now", on_search),
        item("📊 Open Dashboard", on_open_dashboard),
        pystray.Menu.SEPARATOR,
        item("Quit ContextPilot", on_quit)
    )
    tray = pystray.Icon("ContextPilot", img, "ContextPilot — Active", menu)
    return tray

# ─── Hotkey ───────────────────────────────────────────────────────────────────
def register_hotkey():
    try:
        def hotkey_handler():
            try:
                clip = pyperclip.paste()
                if clip and word_count(clip) >= 1:
                    threading.Thread(target=trigger_search, args=(clip,), daemon=True).start()
            except Exception:
                pass

        keyboard.add_hotkey(HOTKEY, hotkey_handler)
        print(f"[Daemon] Hotkey registered: {HOTKEY}")
    except Exception as e:
        print(f"[Daemon] Could not register hotkey (try running as admin): {e}")

# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    print("=" * 55)
    print("  ContextPilot Overlay Daemon — Starting...")
    print(f"  Server: {CONTEXT_SERVER}")
    print(f"  Hotkey: {HOTKEY}")
    print(f"  Clipboard polling every {POLL_MS}ms")
    print("=" * 55)

    # Check server connectivity
    try:
        r = requests.get(f"{CONTEXT_SERVER}/health", timeout=3)
        data = r.json()
        print(f"[Daemon] Connected to context server. {data['memories_indexed']} memories indexed.")
    except Exception:
        print("[Daemon] WARNING: context_server.py is not running!")
        print("[Daemon] Start it with: python context_server.py")

    # Start clipboard monitor thread
    clip_thread = threading.Thread(target=monitor_clipboard, daemon=True)
    clip_thread.start()
    print("[Daemon] Clipboard monitor started.")

    # Register global hotkey
    register_hotkey()

    # Start system tray (blocking)
    tray = create_tray_icon()
    print("[Daemon] System tray active. ContextPilot is running silently.")
    tray.run()

if __name__ == "__main__":
    main()
