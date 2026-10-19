import { NextResponse } from 'next/server';

export async function GET() {
  const whatsappUrl = process.env.WHATSAPP_SERVICE_URL || 'http://127.0.0.1:8002';
  try {
    const res = await fetch(new URL('/chats', whatsappUrl).toString(), {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      throw new Error(`WhatsApp service returned ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.warn('[WhatsApp Chats API] Daemon offline or unreachable:', err.message);
    return NextResponse.json({ groups: [], privates: [] });
  }
}
