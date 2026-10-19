import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rtdb } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const { modelName, modelUrl, description } = body;
    if (!modelName || !modelUrl) {
      return NextResponse.json({ error: 'modelName and modelUrl are required.' }, { status: 400 });
    }

    const userId = session?.user ? (session.user as any).id : 'guest';

    // Save to Firebase Realtime Database
    const newRef = push(ref(rtdb, 'modelSubmissions'));
    const docId = newRef.key || `sub-${Date.now()}`;
    await set(newRef, {
      id: docId,
      modelName,
      modelUrl,
      description: description ?? '',
      status: 'pending',
      userId,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ id: docId }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/submissions] Error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
