import { NextRequest, NextResponse } from 'next/server';

const CONTEXT_SERVER = process.env.CONTEXT_SERVER_URL || 'http://127.0.0.1:8001';

// POST /api/context/ingest  - accepts FormData or JSON
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let upstreamRes: Response;

    if (contentType.includes('multipart/form-data')) {
      // File upload — forward the FormData directly to the correct endpoint
      const formData = await req.formData();
      const type = req.nextUrl.searchParams.get('type') || 'file';
      const endpoint = getEndpointForType(type);

      upstreamRes = await fetch(`${CONTEXT_SERVER}${endpoint}`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(30000), // files can take a while
      });
    } else {
      // Plain text / paste ingest
      const body = await req.json();
      upstreamRes = await fetch(`${CONTEXT_SERVER}/ingest/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
    }

    if (!upstreamRes.ok) {
      return NextResponse.json({ error: 'Upstream ingest error' }, { status: upstreamRes.status });
    }
    return NextResponse.json(await upstreamRes.json());
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Ingest failed', detail: err.message },
      { status: 503 }
    );
  }
}

function getEndpointForType(type: string): string {
  switch (type) {
    case 'whatsapp': return '/ingest/whatsapp';
    case 'gmail':    return '/ingest/gmail';
    case 'zoom':     return '/ingest/zoom';
    case 'browser':  return '/ingest/browser';
    default:         return '/ingest/file';
  }
}
