import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rtdb } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  // 1. Get the Google Account from Firebase Realtime Database
  let account: any = null;
  try {
    const snap = await get(ref(rtdb, `accounts/${userId}`));
    if (snap.exists()) {
      account = snap.val();
    }
  } catch (e) {}

  if (!account || !account.access_token) {
    return NextResponse.json({ error: 'Google account not connected or missing tokens' }, { status: 400 });
  }

  let accessToken = account.access_token;

  // 2. Check if expired and refresh if necessary
  const now = Math.floor(Date.now() / 1000);
  if (account.expires_at && account.expires_at <= now + 60) {
    if (!account.refresh_token) {
      console.warn('[Gmail Sync] Access token expired and no refresh token available.');
      return NextResponse.json({
        error: 'reauthentication_required',
        message: 'Google account credentials have expired. Please sign out and sign in again to reconnect.'
      }, { status: 401 });
    }
    console.log('[Gmail Sync] Access token expired, refreshing...');
    try {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          grant_type: 'refresh_token',
          refresh_token: account.refresh_token,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      accessToken = data.access_token;
      const newExpiresAt = Math.floor(Date.now() / 1000) + data.expires_in;

      // Save refreshed tokens in Firebase Realtime Database
      await set(ref(rtdb, `accounts/${userId}`), {
        ...account,
        access_token: accessToken,
        expires_at: newExpiresAt,
      });
      console.log('[Gmail Sync] Access token refreshed successfully in Firebase.');
    } catch (err: any) {
      console.error('[Gmail Sync] Failed to refresh access token:', err);
      return NextResponse.json({ error: 'Failed to refresh Google credentials: ' + err.message }, { status: 500 });
    }
  }

  // 3. Fetch messages from Gmail
  try {
    let messages: any[] = [];
    let nextPageToken: string | undefined = undefined;
    let pagesFetched = 0;
    const maxPages = 10;

    do {
      let url = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=500&includeSpamTrash=true';
      if (nextPageToken) {
        url += `&pageToken=${nextPageToken}`;
      }
      const listRes = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!listRes.ok) {
        if (listRes.status === 401) {
          return NextResponse.json({
            error: 'reauthentication_required',
            message: 'Google account credentials are invalid or expired. Please sign out and sign in again.'
          }, { status: 401 });
        }
        throw new Error(`Gmail API List error: ${listRes.status} ${await listRes.text()}`);
      }

      const listData = await listRes.json();
      if (listData.messages) {
        messages = messages.concat(listData.messages);
      }
      nextPageToken = listData.nextPageToken;
      pagesFetched++;
    } while (nextPageToken && pagesFetched < maxPages);

    const contextServer = process.env.CONTEXT_SERVER_URL || 'http://127.0.0.1:8001';
    let indexedGmailIds = new Set<string>();
    try {
      const idsRes = await fetch(new URL('/memories/gmail-ids', contextServer).toString(), {
        headers: {
          'Authorization': `Bearer ${process.env.NEXTAUTH_SECRET || ''}`
        }
      });
      if (idsRes.ok) {
        const idsData = await idsRes.json();
        if (idsData.gmail_ids) {
          indexedGmailIds = new Set<string>(idsData.gmail_ids);
        }
      }
    } catch (e) {
      console.warn('[Gmail Sync] Could not fetch indexed gmail IDs:', e);
    }

    const newMessages = messages.filter((msg: any) => !indexedGmailIds.has(msg.id));
    const limitNewMessages = newMessages.slice(0, 1000);

    const fetchDetails = async (msgInfo: any) => {
      try {
        const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgInfo.id}?format=full`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!detailRes.ok) {
          if (detailRes.status === 401) {
            throw new Error('UNAUTHORIZED');
          }
          return null;
        }

        const detail = await detailRes.json();
        const headers = detail.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
        const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

        const body = getEmailBody(detail.payload);
        if (!body.trim()) return null;

        const cleanContent = `Email from ${from}\nSubject: ${subject}\nDate: ${date}\n\n${body}`;

        return {
          content: cleanContent,
          source: 'email',
          source_app: 'Gmail',
          metadata: {
            gmail_id: msgInfo.id,
            subject,
            from,
            date,
          }
        };
      } catch (e: any) {
        if (e.message === 'UNAUTHORIZED') {
          throw e;
        }
        return null;
      }
    };

    const batchSize = 25;
    let parsedEmails: any[] = [];
    for (let i = 0; i < limitNewMessages.length; i += batchSize) {
      const batch = limitNewMessages.slice(i, i + batchSize);
      try {
        const batchResults = await Promise.all(batch.map(fetchDetails));
        parsedEmails = parsedEmails.concat(batchResults);
      } catch (err: any) {
        if (err.message === 'UNAUTHORIZED') {
          return NextResponse.json({
            error: 'reauthentication_required',
            message: 'Google account credentials are invalid or expired. Please sign out and sign in again.'
          }, { status: 401 });
        }
        throw err;
      }
    }

    let storedCount = 0;
    for (const item of parsedEmails) {
      if (!item) continue;
      try {
        const ingestRes = await fetch(new URL('/memories', contextServer).toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXTAUTH_SECRET || ''}`
          },
          body: JSON.stringify(item),
        });
        if (ingestRes.ok) {
          storedCount++;
        }
      } catch (e) {}
    }

    return NextResponse.json({ success: true, count: storedCount });
  } catch (err: any) {
    console.error('[Gmail Sync] Sync failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function getEmailBody(payload: any): string {
  if (!payload) return '';
  if (payload.body?.data) {
    const base64 = payload.body.data.replace(/-/g, '+').replace(/_/g, '/');
    const text = Buffer.from(base64, 'base64').toString('utf-8');
    if (payload.mimeType === 'text/html') {
      return stripHtml(text);
    }
    return text;
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        const base64 = part.body.data.replace(/-/g, '+').replace(/_/g, '/');
        return Buffer.from(base64, 'base64').toString('utf-8');
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        const base64 = part.body.data.replace(/-/g, '+').replace(/_/g, '/');
        const html = Buffer.from(base64, 'base64').toString('utf-8');
        return stripHtml(html);
      }
    }
    for (const part of payload.parts) {
      const body = getEmailBody(part);
      if (body) return body;
    }
  }
  return '';
}
