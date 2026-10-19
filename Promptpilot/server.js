const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');

// Load environment variables from .env
try {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
} catch (e) {
  console.warn('[Backend] Could not load .env file:', e.message);
}

const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 8080;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:2b';

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Supported AI fleet for PromptPilot Task Analysis
const FLEET_MODELS = [
  { id: 'DeepSeek', name: 'DeepSeek-R1', description: 'State-of-the-art reasoning model for math, coding, and complex logic.', url: 'https://chat.deepseek.com' },
  { id: 'Gemini', name: 'Google Gemini', description: 'Multimodal reasoning with fast search integration.', url: 'https://gemini.google.com' },
  { id: 'ChatGPT', name: 'ChatGPT (GPT-4o)', description: 'Industry standard for structured writing, creative text, and general tasks.', url: 'https://chatgpt.com' },
  { id: 'Claude', name: 'Claude 3.5 Sonnet', description: 'Best-in-class coding, system architecture, and nuanced human-like writing.', url: 'https://claude.ai' },
  { id: 'Flux', name: 'Flux.1 [schnell]', description: 'Photorealistic image generation with clean typography and prompt fidelity.', url: 'https://huggingface.co/spaces/black-forest-labs/FLUX.1-schnell' },
  { id: 'Suno', name: 'Suno v3', description: 'Generates full musical compositions with vocals, instruments, and mixing.', url: 'https://suno.com' },
  { id: 'Perplexity', name: 'Perplexity AI', description: 'Real-time conversational search engine with verified live citations.', url: 'https://perplexity.ai' },
  { id: 'OllamaLocal', name: 'Ollama Local (RTX GPU)', description: 'Fast, completely private local AI running on device.', url: 'http://127.0.0.1:11434' }
];

// Helper: Call Local Ollama with RTX GPU optimizations
async function queryOllama({ messages, model = OLLAMA_MODEL, temperature = 0.7, formatJson = false, maxTokens = 600 }) {
  const chatUrl = `${OLLAMA_BASE_URL}/api/chat`;

  const requestBody = {
    model: model.trim(),
    messages: messages.map(m => ({
      role: m.role || 'user',
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
    })),
    stream: false,
    think: false, // Disables slow thinking steps for instant replies
    options: {
      num_ctx: 2048,   // Fits 100% in GPU VRAM
      num_predict: maxTokens,
      num_gpu: 99,     // 100% RTX GPU acceleration
      temperature
    }
  };

  if (formatJson) {
    requestBody.format = 'json';
  }

  const response = await fetch(chatUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(60000)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.message?.content || '';
}

// In-memory memory / mission store (persists while backend is running)
const memoryStore = [];
const missionHistory = [];

// ==========================================
// ROUTES
// ==========================================

// 1. Root Service Info
app.get('/', (req, res) => {
  res.json({
    service: 'PromptPilot Standalone API Backend',
    status: 'ONLINE',
    version: '1.0.0',
    type: 'Pure REST API (Zero UI)',
    aiEngine: {
      provider: 'Ollama (Local RTX GPU)',
      baseUrl: OLLAMA_BASE_URL,
      model: OLLAMA_MODEL
    },
    endpoints: {
      health: 'GET /health',
      tags: 'GET /api/tags',
      chat: 'POST /api/chat',
      generate: 'POST /api/generate',
      analyze: 'POST /api/analyze',
      execute: 'POST /api/execute',
      mobile: 'POST /api/mobile?action=[analyze|execute|addMemory]',
      cofounder: 'POST /api/cofounder',
      memories: 'GET /api/memories'
    }
  });
});

// 2. Health check
app.get('/health', async (req, res) => {
  let ollamaConnected = false;
  let installedModels = [];
  try {
    const tagsRes = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (tagsRes.ok) {
      const data = await tagsRes.json();
      ollamaConnected = true;
      installedModels = (data.models || []).map(m => m.name);
    }
  } catch (e) {
    ollamaConnected = false;
  }

  res.json({
    status: ollamaConnected ? 'ok' : 'degraded',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    ollama: {
      connected: ollamaConnected,
      url: OLLAMA_BASE_URL,
      configuredModel: OLLAMA_MODEL,
      installedModels
    }
  });
});

// 3. Ollama Tags (Installed Models)
app.get('/api/tags', async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { signal: AbortSignal.timeout(5000) });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Cannot reach Ollama', details: err.message });
  }
});

// 4. Chat Endpoint (Multi-turn conversational Ollama)
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model, temperature, maxTokens } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Array of "messages" is required.' });
    }

    const reply = await queryOllama({
      messages,
      model: model || OLLAMA_MODEL,
      temperature: temperature ?? 0.7,
      maxTokens: maxTokens ?? 500
    });

    res.json({ reply, model: model || OLLAMA_MODEL });
  } catch (err) {
    console.error('[POST /api/chat] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Generate / Complete Endpoint (Single prompt)
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, system, model, temperature, maxTokens } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: '"prompt" string is required.' });
    }

    const messages = [];
    if (system) {
      messages.push({ role: 'system', content: system });
    }
    messages.push({ role: 'user', content: prompt });

    const reply = await queryOllama({
      messages,
      model: model || OLLAMA_MODEL,
      temperature: temperature ?? 0.7,
      maxTokens: maxTokens ?? 500
    });

    res.json({ output: reply, model: model || OLLAMA_MODEL });
  } catch (err) {
    console.error('[POST /api/generate] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Analyze Task & Generate Optimized Prompt (SPARK Engine)
app.post('/api/analyze', async (req, res) => {
  try {
    const { taskDescription } = req.body;
    if (!taskDescription) {
      return res.status(400).json({ error: '"taskDescription" is required.' });
    }

    const systemPrompt = `You are the Master Orchestrator for SPARK. Analyze the user's task and select the single most powerful AI model.
Respond STRICTLY with a valid JSON object matching this schema:
{
  "selectedAI": "Exact display name of selected AI",
  "aiUrl": "Official URL (starting with http)",
  "reasoning": "Brief reason max 12 words",
  "optimizedPrompt": "Master-level prompt optimized for the selected AI"
}

Known Fleet:
${FLEET_MODELS.map(m => `- ${m.name}: ${m.description} (${m.url})`).join('\n')}`;

    const rawResponse = await queryOllama({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Mission: ${taskDescription}` }
      ],
      formatJson: true,
      maxTokens: 500
    });

    let result;
    try {
      result = JSON.parse(rawResponse);
    } catch (e) {
      result = {
        selectedAI: 'Ollama Local (RTX GPU)',
        aiUrl: 'http://127.0.0.1:11434',
        reasoning: 'Direct execution on dedicated RTX GPU.',
        optimizedPrompt: taskDescription
      };
    }

    const record = {
      id: `task-${Date.now()}`,
      taskDescription,
      ...result,
      createdAt: new Date().toISOString()
    };
    missionHistory.unshift(record);

    res.json(record);
  } catch (err) {
    console.error('[POST /api/analyze] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 7. Execute Prompt with Local RTX GPU
app.post('/api/execute', async (req, res) => {
  try {
    const { prompt, historyId } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: '"prompt" is required.' });
    }

    const output = await queryOllama({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 600
    });

    if (historyId) {
      const hist = missionHistory.find(h => h.id === historyId);
      if (hist) hist.executionOutput = output;
    }

    res.json({ output, model: OLLAMA_MODEL });
  } catch (err) {
    console.error('[POST /api/execute] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 8. Mobile App API Endpoint (Compatible with PromptPilot Mobile App / APK)
app.all('/api/mobile', async (req, res) => {
  const action = req.query.action || req.body?.action;

  if (req.method === 'GET') {
    if (action === 'history') {
      return res.json(missionHistory);
    }
    if (action === 'memories') {
      return res.json(memoryStore);
    }
    return res.json({ history: missionHistory, memories: memoryStore });
  }

  if (req.method === 'POST') {
    if (action === 'analyze') {
      const taskDescription = req.body?.taskDescription;
      if (!taskDescription) {
        return res.status(400).json({ error: 'taskDescription is required.' });
      }

      const systemPrompt = `You are the Master Orchestrator for SPARK. Analyze the user's task and select the best AI.
Return STRICT JSON:
{
  "selectedAI": "Name of AI",
  "aiUrl": "URL",
  "reasoning": "Reason max 12 words",
  "optimizedPrompt": "Optimized prompt"
}
Fleet:
${FLEET_MODELS.map(m => `- ${m.name}: ${m.description} (${m.url})`).join('\n')}`;

      const raw = await queryOllama({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: taskDescription }
        ],
        formatJson: true
      });

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        parsed = {
          selectedAI: 'Ollama Local (RTX GPU)',
          aiUrl: 'http://127.0.0.1:11434',
          reasoning: 'Direct execution on dedicated RTX GPU.',
          optimizedPrompt: taskDescription
        };
      }

      const recordId = `mobile-${Date.now()}`;
      const record = { id: recordId, taskDescription, ...parsed, createdAt: new Date().toISOString() };
      missionHistory.unshift(record);

      return res.json({ ...parsed, historyId: recordId });
    }

    if (action === 'execute') {
      const { prompt, historyId } = req.body;
      if (!prompt) return res.status(400).json({ error: 'prompt is required.' });

      const output = await queryOllama({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 600
      });

      if (historyId) {
        const hist = missionHistory.find(h => h.id === historyId);
        if (hist) hist.executionOutput = output;
      }

      return res.json({ output });
    }

    if (action === 'addMemory') {
      const { content, source } = req.body;
      if (!content) return res.status(400).json({ error: 'content is required.' });

      const mem = {
        id: `mem-${Date.now()}`,
        content,
        source: source || 'mobile',
        createdAt: new Date().toISOString()
      };
      memoryStore.unshift(mem);
      return res.status(201).json(mem);
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  }

  res.status(405).json({ error: 'Method not allowed' });
});

// 9. CoFounder AI Validation Endpoint
app.post('/api/cofounder', async (req, res) => {
  try {
    const { idea, sector, targetAudience } = req.body;
    if (!idea) {
      return res.status(400).json({ error: '"idea" is required.' });
    }

    const prompt = `As a veteran startup co-founder, evaluate this startup idea:
Idea: ${idea}
Sector: ${sector || 'General Tech'}
Target Audience: ${targetAudience || 'Consumers / Businesses'}

Provide an executive breakdown with:
1. Core Value Proposition
2. Market Opportunity & Potential Moat
3. Top 3 Execution Risks
4. First 3 Immediate Action Items`;

    const analysis = await queryOllama({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 700
    });

    res.json({ idea, analysis, model: OLLAMA_MODEL });
  } catch (err) {
    console.error('[POST /api/cofounder] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 10. Memory endpoints
app.get('/api/memories', (req, res) => res.json(memoryStore));
app.post('/api/memories', (req, res) => {
  const { content, source } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required.' });
  const mem = { id: `mem-${Date.now()}`, content, source: source || 'api', createdAt: new Date().toISOString() };
  memoryStore.unshift(mem);
  res.status(201).json(mem);
});

// Start Server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n==================================================');
  console.log(`🚀 PromptPilot Pure API Backend Running!`);
  console.log(`📡 Local Address:   http://localhost:${PORT}`);
  console.log(`🌐 Network Address: http://192.168.29.57:${PORT}`);
  console.log(`🧠 AI Engine:       Ollama (${OLLAMA_MODEL}) @ ${OLLAMA_BASE_URL}`);
  console.log(`⚡ RTX GPU Status:  100% Hardware Accelerated`);
  console.log(`==================================================\n`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Backend] Shutting down cleanly...');
  server.close(() => process.exit(0));
});
