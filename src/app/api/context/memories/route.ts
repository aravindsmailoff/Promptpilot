import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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
    } catch (err) {
      // Ignore
    }

    if (useLocal) {
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
    } else {
      console.log('[Memories API] Fetching memories from PostgreSQL...');
      const queryConditions: any = {};
      if (sourceApp && sourceApp !== 'all') {
        queryConditions.sourceApp = sourceApp;
      }
      const rows = await prisma.memory.findMany({
        where: queryConditions,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      const results = rows.map((r) => ({
        id: r.id,
        content: r.content,
        source: r.source,
        source_app: r.sourceApp,
        created_at: r.createdAt.toISOString(),
        metadata: JSON.parse(r.metadata || '{}'),
      }));

      return NextResponse.json({ results });
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch memories', detail: err.message }, { status: 500 });
  }
}
