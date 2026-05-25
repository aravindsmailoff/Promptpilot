'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export interface SaveMissionInput {
  taskDescription: string;
  selectedAI: string;
  aiUrl?: string;
  reasoning: string;
  optimizedPrompt: string;
  isImageTask?: boolean;
  executionOutput?: string;
}

/**
 * Save a completed mission routing result to PostgreSQL.
 * Only saves when a user is signed in. Silently skips if unauthenticated.
 */
export async function saveMissionHistory(input: SaveMissionInput): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) return null;

    const userId = (session.user as any).id as string;

    const record = await prisma.missionHistory.create({
      data: {
        userId,
        taskDescription: input.taskDescription,
        selectedAI: input.selectedAI,
        aiUrl: input.aiUrl,
        reasoning: input.reasoning,
        optimizedPrompt: input.optimizedPrompt,
        isImageTask: input.isImageTask ?? false,
        executionOutput: input.executionOutput,
      },
    });

    return record.id;
  } catch (err) {
    console.error('[saveMissionHistory] DB error:', err);
    return null;
  }
}

/**
 * Get all mission history records for the current user, newest first.
 */
export async function getMissionHistory() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) return [];

    const userId = (session.user as any).id as string;

    return await prisma.missionHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  } catch (err) {
    console.error('[getMissionHistory] DB error:', err);
    return [];
  }
}

/**
 * Delete a single mission history record by ID (only if owned by the current user).
 */
export async function deleteMissionHistory(id: string): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) return false;

    const userId = (session.user as any).id as string;

    await prisma.missionHistory.deleteMany({
      where: { id, userId },
    });

    return true;
  } catch (err) {
    console.error('[deleteMissionHistory] DB error:', err);
    return false;
  }
}

/**
 * Update the execution output of an existing mission history record.
 */
export async function updateMissionHistoryOutput(id: string, executionOutput: string): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) return false;

    const userId = (session.user as any).id as string;

    await prisma.missionHistory.updateMany({
      where: { id, userId },
      data: { executionOutput },
    });

    return true;
  } catch (err) {
    console.error('[updateMissionHistoryOutput] DB error:', err);
    return false;
  }
}

