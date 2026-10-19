import { NextResponse } from 'next/server';

export async function GET() {
  const whatsappUrl = process.env.WHATSAPP_SERVICE_URL || 'http://127.0.0.1:8002';
  try {
    const res = await fetch(new URL('/status', whatsappUrl).toString(), {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
    return NextResponse.json({ status: 'disconnected', qr: null }, { status: 200 });
  } catch {
    return NextResponse.json({ status: 'disconnected', qr: null }, { status: 200 });
  }
}
