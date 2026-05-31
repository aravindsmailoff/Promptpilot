import { NextRequest, NextResponse } from 'next/server';

const CONTEXT_SERVER = process.env.CONTEXT_SERVER_URL || 'http://127.0.0.1:8001';

// GET /api/context/stats  → returns indexed memory counts by source
export async function GET() {
  try {
    const res = await fetch(`${CONTEXT_SERVER}/memories/stats`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return NextResponse.json({ error: 'Server error' }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: 'context_server.py not reachable on port 8001' }, { status: 503 });
  }
}

// DELETE /api/context/stats  → clears all memories
export async function DELETE() {
  try {
    const res = await fetch(`${CONTEXT_SERVER}/memories`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(5000),
    });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: 'context_server.py not reachable' }, { status: 503 });
  }
}
