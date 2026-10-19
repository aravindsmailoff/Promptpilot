import { rtdb } from '@/lib/firebase';
import { ref, push, set, get } from 'firebase/database';
import crypto from 'crypto';

function dotProduct(vecA: number[], vecB: number[]): number {
  let product = 0;
  for (let i = 0; i < vecA.length; i++) {
    product += vecA[i] * vecB[i];
  }
  return product;
}

function magnitude(vec: number[]): number {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i];
  }
  return Math.sqrt(sum);
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const magA = magnitude(vecA);
  const magB = magnitude(vecB);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(vecA, vecB) / (magA * magB);
}

// Generate embeddings via local Ollama API (or local term vector fallback)
export async function getEmbedding(text: string): Promise<number[]> {
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const model = process.env.OLLAMA_EMBEDDING_MODEL || 'all-minilm';

  try {
    const response = await fetch(`${ollamaUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: text }),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.embedding)) {
        return data.embedding;
      }
    }
  } catch (e) {}

  // Local fallback 64-dim normalized term-hash embedding if Ollama embedding isn't loaded
  const vec = new Array(64).fill(0);
  const words = text.toLowerCase().split(/\W+/);
  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % 64;
    vec[idx] += 1;
  }
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

export async function storeMemoryInCloud(
  content: string,
  source: string,
  sourceApp: string,
  metadata: any = {}
): Promise<any> {
  const cleaned = content.trim();
  if (cleaned.length < 3) return null;

  const contentHash = crypto.createHash('sha256').update(cleaned).digest('hex');

  // Check duplicate in Firebase Realtime Database
  try {
    const snap = await get(ref(rtdb, 'memories'));
    if (snap.exists()) {
      const allMems = snap.val();
      for (const k of Object.keys(allMems)) {
        if (allMems[k].contentHash === contentHash) {
          return { status: 'duplicate', id: k };
        }
      }
    }
  } catch (e) {}

  // Get embedding from Hugging Face
  const embedding = await getEmbedding(cleaned);

  // Store in Firebase Realtime Database
  const newRef = push(ref(rtdb, 'memories'));
  const id = newRef.key || `mem-${Date.now()}`;
  const createdAt = new Date().toISOString();

  await set(newRef, {
    id,
    content: cleaned,
    source,
    sourceApp,
    metadata: JSON.stringify(metadata),
    contentHash,
    embedding,
    createdAt,
  });

  return { status: 'ok', id };
}

export async function searchMemoriesInCloud(
  query: string,
  topK: number = 3,
  sourceApp?: string
): Promise<any[]> {
  const qEmb = await getEmbedding(query);
  let memories: any[] = [];

  try {
    const snap = await get(ref(rtdb, 'memories'));
    if (snap.exists()) {
      const val = snap.val();
      memories = Object.keys(val).map(k => ({ id: k, ...val[k] }));
      if (sourceApp && sourceApp !== 'all') {
        memories = memories.filter(m => m.sourceApp === sourceApp);
      }
    }
  } catch (e) {}

  if (memories.length === 0) return [];

  const scored = memories.map((mem) => {
    const score = cosineSimilarity(qEmb, mem.embedding || []);
    return {
      id: mem.id,
      content: mem.content,
      source: mem.source,
      source_app: mem.sourceApp,
      created_at: mem.createdAt || new Date().toISOString(),
      metadata: JSON.parse(mem.metadata || '{}'),
      score: Math.round(score * 10000) / 10000,
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// ─── Document Parsing Helpers ───

export function chunkText(text: string, maxChars: number = 400, overlap: number = 80): string[] {
  const cleaned = text.trim();
  if (cleaned.length <= maxChars) {
    return cleaned.length >= 10 ? [cleaned] : [];
  }
  const sentences = cleaned.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let buf = "";
  for (const sent of sentences) {
    if (buf.length + sent.length > maxChars) {
      if (buf) chunks.push(buf.trim());
      buf = sent;
    } else {
      buf += (buf ? " " : "") + sent;
    }
  }
  if (buf.trim()) {
    chunks.push(buf.trim());
  }
  return chunks;
}

export function parseWhatsAppExport(text: string): Array<{ content: string; meta: any }> {
  const pattern = /(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\s*[-–]\s*([^:]+):\s*(.*)/;
  const results: Array<{ content: string; meta: any }> = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const m = line.trim().match(pattern);
    if (m) {
      const [, date, timeStr, sender, body] = m;
      const cleanBody = body.trim();
      if (cleanBody && !cleanBody.startsWith('<') && cleanBody.length > 3) {
        results.push({
          content: `${sender}: ${cleanBody}`,
          meta: { sender: sender.trim(), date, time: timeStr }
        });
      }
    }
  }
  return results;
}

export function parseBrowserHistory(content: string): Array<{ url: string; title: string }> {
  const items: Array<{ url: string; title: string }> = [];
  try {
    const data = JSON.parse(content);
    if (Array.isArray(data)) {
      for (const entry of data) {
        const url = entry.url || '';
        const title = entry.title || url;
        if (url && !url.includes('chrome://') && !url.includes('about:')) {
          items.push({ url, title });
        }
      }
    }
    return items;
  } catch (e) {}
  const lines = content.split(/\r?\n/);
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length >= 2) {
      const url = parts[0].replace(/"/g, '').trim();
      const title = parts[1].replace(/"/g, '').trim();
      if (url.startsWith('http')) {
        items.push({ url, title });
      }
    }
  }
  return items;
}

export function parseGmailExport(text: string): Array<{ content: string; meta: any }> {
  const emails: Array<{ content: string; meta: any }> = [];
  const blocks = text.split(/^From /m);
  for (let i = 1; i < blocks.length; i++) {
    const lines = blocks[i].split(/\r?\n/);
    let subject = '';
    let sender = '';
    const bodyLines: string[] = [];
    let inBody = false;
    for (const line of lines) {
      if (line.toLowerCase().startsWith('subject:')) {
        subject = line.substring(8).trim();
      } else if (line.toLowerCase().startsWith('from:')) {
        sender = line.substring(5).trim();
      } else if (line === '' && !inBody) {
        inBody = true;
      } else if (inBody) {
        bodyLines.push(line);
      }
      if (bodyLines.length > 80) break;
    }
    const body = bodyLines.join(' ').trim();
    if (subject || body) {
      const chunk = `Email from ${sender} — Subject: ${subject}\n${body.substring(0, 500)}`;
      emails.push({ content: chunk, meta: { subject, from: sender } });
    }
  }
  return emails;
}

export function parseZoomTranscript(text: string): Array<{ content: string; meta: any }> {
  const segments: Array<{ content: string; meta: any }> = [];
  const vttPattern = /(\d+:\d+:\d+\.\d+\s*-->\s*\d+:\d+:\d+\.\d+)\r?\n([\s\S]+?)(?=\r?\n\d+:\d+|\Z)/g;
  let match;
  while ((match = vttPattern.exec(text)) !== null) {
    const ts = match[1];
    const body = match[2];
    const content = body.replace(/<[^>]+>/g, '').trim();
    if (content && content.length > 5) {
      segments.push({ content: `[Zoom] ${content}`, meta: { timestamp: ts.trim() } });
    }
  }

  if (segments.length === 0) {
    const plainPattern = /(\d+:\d+:\d+)\s+([^:]+):\s+(.+)/;
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(plainPattern);
      if (m) {
        const [, ts, speaker, utterance] = m;
        segments.push({
          content: `[Zoom] ${speaker}: ${utterance}`,
          meta: { timestamp: ts, speaker }
        });
      }
    }
  }

  return segments;
}
