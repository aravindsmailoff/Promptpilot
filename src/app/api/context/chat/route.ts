import { NextRequest, NextResponse } from 'next/server';
import { executePromptViaApi } from '@/ai/actions/execute-prompt';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Read server-side settings
    let settings = undefined;
    try {
      const settingsPath = path.join(process.cwd(), 'promptpilot-settings.json');
      if (fs.existsSync(settingsPath)) {
        const data = fs.readFileSync(settingsPath, 'utf8');
        settings = JSON.parse(data);
      }
    } catch (settingsErr) {
      console.warn('[Chat API] Failed to load server settings:', settingsErr);
    }

    // Run the prompt using our server action and the server-side configurations
    const reply = await executePromptViaApi(prompt, false, false, settings);
    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('[Chat API] Prompt execution failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
