import { NextRequest, NextResponse } from 'next/server';
import { executeOllamaChat } from '@/ai/ollama';
import { executePythonChat } from '@/ai/python-server';
import { hfClient, PRIMARY_ROUTING_MODEL } from '@/ai/huggingface';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Read server-side settings
    let settings: any = {
      useOllama: true,
      ollamaBaseUrl: 'http://127.0.0.1:11434',
      ollamaModel: 'qwen3.5:2b',
      localEngine: 'ollama',
      pythonServerUrl: 'http://127.0.0.1:8000'
    };

    try {
      const settingsPath = path.join(process.cwd(), 'SPARK-settings.json');
      if (fs.existsSync(settingsPath)) {
        const data = fs.readFileSync(settingsPath, 'utf8');
        settings = { ...settings, ...JSON.parse(data) };
      }
    } catch (settingsErr) {
      console.warn('[Chat API] Failed to load server settings:', settingsErr);
    }

    let reply = '';
    const localEngine = settings.localEngine || 'ollama';

    // Local execution with qwen3.5:2b via Ollama
    let success = false;

    if (settings.useOllama !== false) {
      try {
        if (localEngine === 'python') {
          const activeUrl = settings.pythonServerUrl || 'http://127.0.0.1:8000';
          console.log('[Chat API] Running local model via Python server...');
          reply = await executePythonChat(
            activeUrl,
            [
              { role: 'user', content: prompt }
            ],
            0.4
          );
          success = true;
        } else {
          const activeModel = settings.ollamaModel || 'qwen3.5:2b';
          const activeUrl = settings.ollamaBaseUrl || 'http://127.0.0.1:11434';
          console.log(`[Chat API] Running local model via Ollama: ${activeModel}...`);
          reply = await executeOllamaChat(
            activeUrl,
            activeModel,
            [
              { role: 'user', content: prompt }
            ],
            0.4
          );
          success = true;
        }
      } catch (localErr: any) {
        console.warn(`[Chat API] Local Ollama execution failed: ${localErr.message}`);
        throw new Error(`Local Ollama error (${settings.ollamaModel || 'qwen3.5:2b'}): ${localErr.message}`);
      }
    }

    // Clean up reasonings/thoughts
    reply = reply.replace(/<(think|thought)>[\s\S]*?<\/\1>/g, '').trim();

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('[Chat API] Prompt execution failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
