import { NextRequest, NextResponse } from 'next/server';
import {
  storeMemoryInCloud,
  chunkText,
  parseWhatsAppExport,
  parseBrowserHistory,
  parseGmailExport,
  parseZoomTranscript,
} from '@/lib/context-cloud';

const CONTEXT_SERVER = process.env.CONTEXT_SERVER_URL || 'http://127.0.0.1:8001';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // Default to local, check if local server is online
    let useLocal = false;
    try {
      const testRes = await fetch(`${CONTEXT_SERVER}/health`, { signal: AbortSignal.timeout(1000) });
      if (testRes.ok) useLocal = true;
    } catch (err) {
      // Ignore
    }

    if (useLocal) {
      let upstreamRes: Response;
      if (contentType.includes('multipart/form-data')) {
        const formData = await req.formData();
        const type = req.nextUrl.searchParams.get('type') || 'file';
        const endpoint = getEndpointForType(type);
        upstreamRes = await fetch(`${CONTEXT_SERVER}${endpoint}`, {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(30000),
        });
      } else {
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
    } else {
      console.log('[Ingest API] Performing Cloud Vector Ingest...');
      if (contentType.includes('multipart/form-data')) {
        const formData = await req.formData();
        const type = req.nextUrl.searchParams.get('type') || 'file';
        const file = formData.get('file') as File;
        if (!file) {
          return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }
        const text = await file.text();
        let stored = 0;
        let parsedCount = 0;

        if (type === 'whatsapp') {
          const items = parseWhatsAppExport(text);
          parsedCount = items.length;
          for (const item of items) {
            const res = await storeMemoryInCloud(item.content, 'whatsapp', 'WhatsApp', item.meta);
            if (res && res.status === 'ok') stored++;
          }
          return NextResponse.json({ status: 'ok', messages_parsed: parsedCount, stored });
        } else if (type === 'gmail') {
          const items = parseGmailExport(text);
          parsedCount = items.length;
          for (const item of items) {
            const res = await storeMemoryInCloud(item.content, 'email', 'Gmail', item.meta);
            if (res && res.status === 'ok') stored++;
          }
          return NextResponse.json({ status: 'ok', emails_parsed: parsedCount, stored });
        } else if (type === 'zoom') {
          const items = parseZoomTranscript(text);
          parsedCount = items.length;
          for (const item of items) {
            const res = await storeMemoryInCloud(item.content, 'zoom', 'Zoom', item.meta);
            if (res && res.status === 'ok') stored++;
          }
          return NextResponse.json({ status: 'ok', segments_parsed: parsedCount, stored });
        } else if (type === 'browser') {
          const items = parseBrowserHistory(text);
          parsedCount = items.length;
          for (const item of items) {
            const content = `[Browser] ${item.title} — ${item.url}`;
            const res = await storeMemoryInCloud(content, 'browser', 'Browser', item);
            if (res && res.status === 'ok') stored++;
          }
          return NextResponse.json({ status: 'ok', items_parsed: parsedCount, stored });
        } else {
          // Generic file
          const sourceApp = (formData.get('source_app') as string) || 'file';
          const chunks = chunkText(text);
          for (const chunk of chunks) {
            const res = await storeMemoryInCloud(chunk, 'file', sourceApp, { filename: file.name });
            if (res && res.status === 'ok') stored++;
          }
          return NextResponse.json({ status: 'ok', chunks: chunks.length, stored, filename: file.name });
        }
      } else {
        // Plain text ingest
        const body = await req.json();
        const text = body.text || '';
        const source = body.source || 'paste';
        const app = body.app || 'unknown';
        const meta = body.meta || {};

        const chunks = chunkText(text);
        let stored = 0;
        for (const chunk of chunks) {
          const res = await storeMemoryInCloud(chunk, source, app, meta);
          if (res && res.status === 'ok') stored++;
        }
        return NextResponse.json({ status: 'ok', chunks_stored: stored, total_chunks: chunks.length });
      }
    }
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
