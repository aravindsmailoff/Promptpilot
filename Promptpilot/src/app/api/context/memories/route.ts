import { NextRequest, NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

const CONTEXT_SERVER = process.env.CONTEXT_SERVER_URL || 'http://127.0.0.1:8001';

export async function GET(req: NextRequest) {
  try {
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50', 10);
    const sourceApp = req.nextUrl.searchParams.get('source_app');

    // Default to local, check if local server is online
    let useLocal = false;
    try {
      const testRes = await fetch(`${CONTEXT_SERVER}/health`, { signal: AbortSignal.timeout(1000) });
      if (testRes.ok) useLocal = true;
    } catch (err) {}

    if (useLocal) {
      let url = `${CONTEXT_SERVER}/memories?limit=${limit}`;
      if (sourceApp) {
        url += `&source_app=${encodeURIComponent(sourceApp)}`;
      }
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXTAUTH_SECRET || ''}`
        }
      });
      if (!res.ok) {
        return NextResponse.json({ error: 'Context server error' }, { status: res.status });
      }
      const data = await res.json();
      return NextResponse.json(data);
    } else {
      let results: any[] = [];
      try {
        const snap = await get(ref(rtdb, 'memories'));
        if (snap.exists()) {
          const val = snap.val();
          results = Object.keys(val).map(k => ({
            id: k,
            content: val[k].content,
            source: val[k].source,
            source_app: val[k].sourceApp,
            created_at: val[k].createdAt || new Date().toISOString(),
            metadata: JSON.parse(val[k].metadata || '{}'),
          }));
          if (sourceApp && sourceApp !== 'all') {
            results = results.filter(r => r.source_app === sourceApp);
          }
          results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          results = results.slice(0, limit);
        }
      } catch (e) {}

      return NextResponse.json({ results });
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch memories', detail: err.message }, { status: 500 });
  }
}
