import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const settingsPath = path.join(process.cwd(), 'SPARK-settings.json');

const DEFAULT_SETTINGS = {
  instantCopy: true,
  toneProfile: 'professional',
  manualModelOverride: true,
  useOllama: true,
  ollamaBaseUrl: 'http://127.0.0.1:11434',
  ollamaModel: 'qwen3.5:2b',
  localEngine: 'ollama',
  pythonServerUrl: 'http://127.0.0.1:8000'
};

function readSettings() {
  try {
    if (!fs.existsSync(settingsPath)) {
      fs.writeFileSync(settingsPath, JSON.stringify(DEFAULT_SETTINGS, null, 2));
      return DEFAULT_SETTINGS;
    }
    const data = fs.readFileSync(settingsPath, 'utf8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}

export async function GET() {
  const settings = readSettings();
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = readSettings();
    const updated = {
      ...current,
      ...body
    };
    fs.writeFileSync(settingsPath, JSON.stringify(updated, null, 2));
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
