import { NextRequest, NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, get, remove } from 'firebase/database';

const CONTEXT_SERVER = process.env.CONTEXT_SERVER_URL || 'http://127.0.0.1:8001';

// GET /api/context/stats  → returns indexed memory counts by source
export async function GET() {
  try {
    let useLocal = false;
    try {
      const testRes = await fetch(`${CONTEXT_SERVER}/health`, { signal: AbortSignal.timeout(1000) });
      if (testRes.ok) useLocal = true;
    } catch (err) {}

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
      let total = 0;
      const by_source: any[] = [];
      try {
        const snap = await get(ref(rtdb, 'memories'));
        if (snap.exists()) {
          const val = snap.val();
          const keys = Object.keys(val);
          total = keys.length;
          const map: Record<string, { count: number; last_seen: string }> = {};
          for (const k of keys) {
            const app = val[k].sourceApp || 'unknown';
            const created = val[k].createdAt || '';
            if (!map[app]) {
              map[app] = { count: 0, last_seen: created };
            }
            map[app].count++;
            if (created > map[app].last_seen) {
              map[app].last_seen = created;
            }
          }
          for (const app of Object.keys(map)) {
            by_source.push({
              source_app: app,
              count: map[app].count,
              last_seen: map[app].last_seen,
            });
          }
        }
      } catch (e) {}

      return NextResponse.json({ total, by_source, isCloud: true });
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch memory stats', detail: err.message }, { status: 500 });
  }
}

// DELETE /api/context/stats  → clears all memories
export async function DELETE() {
  try {
    let useLocal = false;
    try {
      const testRes = await fetch(`${CONTEXT_SERVER}/health`, { signal: AbortSignal.timeout(1000) });
      if (testRes.ok) useLocal = true;
    } catch (err) {}

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
      try {
        await remove(ref(rtdb, 'memories'));
      } catch (e) {}
      return NextResponse.json({ status: 'cleared' });
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to clear memories', detail: err.message }, { status: 500 });
  }
}
