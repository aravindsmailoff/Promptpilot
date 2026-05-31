import { NextRequest, NextResponse } from 'next/server';

const CONTEXT_SERVER = process.env.CONTEXT_SERVER_URL || 'http://127.0.0.1:8001';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${CONTEXT_SERVER}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Context server error', status: res.status }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    if (err.name === 'TimeoutError') {
      return NextResponse.json({ error: 'Search timed out — is context_server.py running?' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Could not connect to context_server.py on port 8001', detail: err.message }, { status: 503 });
  }
}
