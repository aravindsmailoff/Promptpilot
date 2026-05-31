import { NextRequest, NextResponse } from 'next/server';

const CONTEXT_SERVER = process.env.CONTEXT_SERVER_URL || 'http://127.0.0.1:8001';

export async function GET(req: NextRequest) {
  try {
    const limit = req.nextUrl.searchParams.get('limit') || '50';
    const sourceApp = req.nextUrl.searchParams.get('source_app');
    let url = `${CONTEXT_SERVER}/memories?limit=${limit}`;
    if (sourceApp) {
      url += `&source_app=${encodeURIComponent(sourceApp)}`;
    }
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: 'Context server error' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: 'Could not connect to context_server.py', detail: err.message }, { status: 503 });
  }
}
