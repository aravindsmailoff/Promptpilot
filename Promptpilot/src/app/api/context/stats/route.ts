import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const CONTEXT_SERVER = process.env.CONTEXT_SERVER_URL || 'http://127.0.0.1:8001';

// GET /api/context/stats  → returns indexed memory counts by source
export async function GET() {
  try {
    // Default to local, check if local server is online
    let useLocal = false;
    try {
      const testRes = await fetch(`${CONTEXT_SERVER}/health`, { signal: AbortSignal.timeout(1000) });
      if (testRes.ok) useLocal = true;
    } catch (err) {
      // Ignore
    }

    if (useLocal) {
      const res = await fetch(`${CONTEXT_SERVER}/memories/stats`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXTAUTH_SECRET || ''}`
        },
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) return NextResponse.json({ error: 'Server error' }, { status: res.status });
      return NextResponse.json(await res.json());
    } else {
      console.log('[Stats API] Querying memories statistics from PostgreSQL...');
      const total = await prisma.memory.count();
      const groups = await prisma.memory.groupBy({
        by: ['sourceApp'],
        _count: {
          _all: true,
        },
        _max: {
          createdAt: true,
        },
      });

      const by_source = groups.map((g) => ({
        source_app: g.sourceApp,
        count: g._count._all,
        last_seen: g._max.createdAt?.toISOString() || '',
      }));

      return NextResponse.json({ total, by_source, isCloud: true });
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch memory stats', detail: err.message }, { status: 500 });
  }
}

// DELETE /api/context/stats  → clears all memories
export async function DELETE() {
  try {
    // Default to local, check if local server is online
    let useLocal = false;
    try {
      const testRes = await fetch(`${CONTEXT_SERVER}/health`, { signal: AbortSignal.timeout(1000) });
      if (testRes.ok) useLocal = true;
    } catch (err) {
      // Ignore
    }

    if (useLocal) {
      const res = await fetch(`${CONTEXT_SERVER}/memories`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.NEXTAUTH_SECRET || ''}`
        },
        signal: AbortSignal.timeout(5000),
      });
      return NextResponse.json(await res.json());
    } else {
      console.log('[Stats API] Clearing all memories in PostgreSQL...');
      await prisma.memory.deleteMany({});
      return NextResponse.json({ status: 'cleared' });
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to clear memories', detail: err.message }, { status: 500 });
  }
}
