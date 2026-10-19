# PromptPilot Standalone Pure API Backend

A dedicated, lightweight REST API backend powered by **local Ollama (`qwen3.5:2b`)** running with 100% RTX GPU hardware acceleration.

- **Zero Web UI / Zero Frontend** (Pure JSON API)
- **Zero Cloudflare / Zero Tunnels**
- **Zero Cloud AI / Zero HuggingFace Fallbacks**
- **CORS Enabled** for mobile apps, curl, Postman, and any frontend client.

---

## 🚀 How to Run the Backend

### Method 1: Double-click Launcher
Double-click [`START_BACKEND.bat`](file:///d:/Promptpilot-main/START_BACKEND.bat) in the project root.

### Method 2: Command Line
```powershell
npm run backend
```
Or with custom port:
```powershell
$env:PORT=8080; node Promptpilot/server.js
```

---

## 📡 Network Addresses
- **Localhost:** `http://localhost:8080`
- **LAN Address (for Mobile Phones / other devices on Wi-Fi):** `http://192.168.29.57:8080`

---

## 📋 API Endpoints Specification

### 1. Health & Status
* **`GET /health`**
  * Checks server health and verifies connection to local Ollama on RTX GPU.
  * **Response:**
    ```json
    {
      "status": "ok",
      "uptimeSeconds": 120,
      "ollama": {
        "connected": true,
        "url": "http://127.0.0.1:11434",
        "configuredModel": "qwen3.5:2b",
        "installedModels": ["qwen3.5:0.8b", "qwen3.5:2b"]
      }
    }
    ```

---

### 2. Task Analysis & AI Prompt Optimization
* **`POST /api/analyze`**
  * Analyzes a raw user task, evaluates the AI fleet, and generates an optimized master prompt.
  * **Payload:**
    ```json
    {
      "taskDescription": "Write a Python script to scrape live stock prices"
    }
    ```
  * **Response:**
    ```json
    {
      "id": "task-1792435287968",
      "taskDescription": "Write a Python script to scrape live stock prices",
      "selectedAI": "Claude 3.5 Sonnet",
      "aiUrl": "https://claude.ai",
      "reasoning": "Best-in-class coding for robust, error-handled stock scraping architecture.",
      "optimizedPrompt": "Act as a Senior Python Developer. Create a production-grade script to scrape live stock prices...",
      "createdAt": "2026-10-19T18:41:27.968Z"
    }
    ```

---

### 3. Prompt Execution (Local Ollama Neural Engine)
* **`POST /api/execute`**
  * Executes a prompt directly using local Ollama.
  * **Payload:**
    ```json
    {
      "prompt": "List 3 advantages of local LLMs"
    }
    ```
  * **Response:**
    ```json
    {
      "output": "1. Complete privacy\n2. Zero subscription costs\n3. Offline capability",
      "model": "qwen3.5:2b"
    }
    ```

---

### 4. Direct Chat (Multi-turn Conversational)
* **`POST /api/chat`**
  * **Payload:**
    ```json
    {
      "messages": [
        { "role": "system", "content": "You are a helpful assistant." },
        { "role": "user", "content": "Hello!" }
      ],
      "temperature": 0.7
    }
    ```
  * **Response:**
    ```json
    {
      "reply": "Hello! How can I assist you today?",
      "model": "qwen3.5:2b"
    }
    ```

---

### 5. Single Prompt Generation
* **`POST /api/generate`**
  * **Payload:**
    ```json
    {
      "prompt": "What is the capital of France?"
    }
    ```
  * **Response:**
    ```json
    {
      "output": "The capital of France is Paris.",
      "model": "qwen3.5:2b"
    }
    ```

---

### 6. Mobile App Compatible Route
* **`POST /api/mobile?action=analyze`**
* **`POST /api/mobile?action=execute`**
* **`POST /api/mobile?action=addMemory`**
* **`GET /api/mobile?action=history`**
* **`GET /api/mobile?action=memories`**

---

### 7. CoFounder Startup Validation
* **`POST /api/cofounder`**
  * **Payload:**
    ```json
    {
      "idea": "An AI tool that optimizes prompts for developers",
      "sector": "Developer Tools",
      "targetAudience": "Software engineers and agencies"
    }
    ```
