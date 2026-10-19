import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { to, text } = await req.json();
    if (!to || !text) {
      return NextResponse.json({ error: 'to and text are required' }, { status: 400 });
    }

    const whatsappUrl = process.env.WHATSAPP_SERVICE_URL || 'http://127.0.0.1:8002';
    const res = await fetch(new URL('/send', whatsappUrl).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, text }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText || 'Failed to send WhatsApp message via WhatsApp service' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[WhatsApp Send API] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
