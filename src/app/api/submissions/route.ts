import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const { modelName, modelUrl, description } = body;
    if (!modelName || !modelUrl) {
      return NextResponse.json({ error: 'modelName and modelUrl are required.' }, { status: 400 });
    }

    const record = await prisma.modelSubmission.create({
      data: {
        modelName,
        modelUrl,
        description: description ?? null,
        status: 'pending',
        userId: session?.user ? (session.user as any).id : null,
      },
    });

    return NextResponse.json({ id: record.id }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/submissions] Error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
