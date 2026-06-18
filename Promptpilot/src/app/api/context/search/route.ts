import { NextRequest, NextResponse } from 'next/server';
import { searchMemoriesInCloud } from '@/lib/context-cloud';

const CONTEXT_SERVER = process.env.CONTEXT_SERVER_URL || 'http://127.0.0.1:8001';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Default to local, check if local server is online
    let useLocal = false;
    try {
      const testRes = await fetch(`${CONTEXT_SERVER}/health`, { signal: AbortSignal.timeout(1000) });
      if (testRes.ok) useLocal = true;
    } catch (err) {
      // Ignore and use cloud search
    }

    if (useLocal) {
      console.log('[Search API] Proxying to Local Python Search Server...');
      const res = await fetch(`${CONTEXT_SERVER}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXTAUTH_SECRET || ''}`
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) {
        return NextResponse.json({ error: 'Context server error', status: res.status }, { status: res.status });
      }
      const data = await res.json();
      return NextResponse.json(data);
    } else {
      console.log('[Search API] Performing Cloud Vector Search...');
      const results = await searchMemoriesInCloud(
        body.query,
        body.top_k || 3,
        body.source_app
      );
      return NextResponse.json({ query: body.query, results, count: results.length });
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Search failed', detail: err.message }, { status: 500 });
  }
}
