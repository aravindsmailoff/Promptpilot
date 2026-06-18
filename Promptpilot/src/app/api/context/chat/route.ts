import { NextRequest, NextResponse } from 'next/server';
import { executeOllamaChat } from '@/ai/ollama';
import { executePythonChat } from '@/ai/python-server';
import { hfClient } from '@/ai/huggingface';
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
      ollamaModel: 'gemma2:2b',
      localEngine: 'ollama',
      pythonServerUrl: 'http://127.0.0.1:8000'
    };

    try {
      const settingsPath = path.join(process.cwd(), 'promptpilot-settings.json');
      if (fs.existsSync(settingsPath)) {
        const data = fs.readFileSync(settingsPath, 'utf8');
        settings = { ...settings, ...JSON.parse(data) };
      }
    } catch (settingsErr) {
      console.warn('[Chat API] Failed to load server settings:', settingsErr);
    }

    let reply = '';
    const localEngine = settings.localEngine || 'ollama';

    // Hybrid execution: try local first, fall back to Hugging Face Cloud Gemma 2b
    let success = false;

    if (settings.useOllama) {
      try {
        if (localEngine === 'python') {
          const activeUrl = settings.pythonServerUrl || 'http://127.0.0.1:8000';
          console.log('[Chat API] Running local Gemma via Python server...');
          reply = await executePythonChat(
            activeUrl,
            [
              { role: 'user', content: prompt }
            ],
            0.4
          );
          success = true;
        } else {
          const activeModel = settings.ollamaModel || 'gemma2:2b';
          const activeUrl = settings.ollamaBaseUrl || 'http://127.0.0.1:11434';
          console.log(`[Chat API] Running local Gemma via Ollama model: ${activeModel}...`);
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
      } catch (localErr) {
        console.warn('[Chat API] Local Gemma server is offline, falling back to Hugging Face cloud Gemma 2b...');
      }
    }

    if (!success) {
      console.log('[Chat API] Running Cloud Gemma 2b via Hugging Face...');
      const response = await hfClient.chat.completions.create({
        model: 'google/gemma-2-2b-it',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.4
      });
      reply = response.choices[0]?.message?.content || '';
    }

    // Clean up reasonings/thoughts
    reply = reply.replace(/<(think|thought)>[\s\S]*?<\/\1>/g, '').trim();

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('[Chat API] Prompt execution failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
