import { NextRequest, NextResponse } from 'next/server';
import { executeOllamaChat } from '@/ai/ollama';
import { executePythonChat } from '@/ai/python-server';
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

    if (settings.useOllama) {
      if (localEngine === 'python') {
        const activeUrl = settings.pythonServerUrl || 'http://127.0.0.1:8000';
        reply = await executePythonChat(
          activeUrl,
          [
            { role: 'user', content: prompt }
          ],
          0.4
        );
      } else {
        const activeModel = settings.ollamaModel || 'gemma2:2b';
        const activeUrl = settings.ollamaBaseUrl || 'http://127.0.0.1:11434';
        reply = await executeOllamaChat(
          activeUrl,
          activeModel,
          [
            { role: 'user', content: prompt }
          ],
          0.4
        );
      }
    } else {
      // Fallback local execution
      const activeModel = settings.ollamaModel || 'gemma2:2b';
      const activeUrl = settings.ollamaBaseUrl || 'http://127.0.0.1:11434';
      reply = await executeOllamaChat(
        activeUrl,
        activeModel,
        [
          { role: 'user', content: prompt }
        ],
        0.4
      );
    }

    // Clean up reasonings/thoughts
    reply = reply.replace(/<(think|thought)>[\s\S]*?<\/\1>/g, '').trim();

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('[Chat API] Prompt execution failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
