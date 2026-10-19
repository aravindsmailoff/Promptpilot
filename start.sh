#!/bin/bash
set -e

echo "=================================================="
echo "🚀 Starting PromptPilot Cloud Container on Render"
echo "=================================================="

# 1. Start Ollama in background
export OLLAMA_HOST="0.0.0.0:11434"
echo "[Ollama] Starting Ollama daemon in background..."
ollama serve > /tmp/ollama.log 2>&1 &
OLLAMA_PID=$!

# 2. Wait for Ollama to become ready
echo "[Ollama] Waiting for Ollama engine to initialize..."
for i in {1..30}; do
    if curl -s http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
        echo "[Ollama] Daemon is ready and listening on port 11434!"
        break
    fi
    sleep 1
done

# 3. Memory detection and Model selection
TOTAL_MEM_MB=$(free -m | awk '/^Mem:/{print $2}')
echo "[System] Detected Total Memory: ${TOTAL_MEM_MB} MB"

MODEL="${OLLAMA_MODEL:-qwen3.5:2b}"

# If on Render Free Tier (< 1200MB RAM), use qwen3.5:0.8b to avoid OOM crash
if [ -n "$TOTAL_MEM_MB" ] && [ "$TOTAL_MEM_MB" -lt 1200 ] && [ "$MODEL" = "qwen3.5:2b" ]; then
    echo "[Notice] Free tier memory (${TOTAL_MEM_MB}MB) detected. Using optimized qwen3.5:0.8b to prevent memory crash."
    MODEL="qwen3.5:0.8b"
fi

export OLLAMA_MODEL="$MODEL"
echo "[Ollama] Selected model: $MODEL"

# 4. Pull model if not already cached
echo "[Ollama] Ensuring model '$MODEL' is pulled..."
ollama pull "$MODEL"
echo "[Ollama] Model '$MODEL' is ready for inference!"

# 5. Start Express API Backend on Render's PORT
export PORT="${PORT:-8080}"
echo "[Backend] Launching Express REST API on port $PORT..."
cd /app/Promptpilot
exec node server.js
