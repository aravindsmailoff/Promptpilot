'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rtdb } from '@/lib/firebase';
import { 
  ref, 
  push, 
  set, 
  get, 
  remove
} from 'firebase/database';

export interface SaveMissionInput {
  taskDescription: string;
  selectedAI: string;
  aiUrl?: string;
  reasoning: string;
  optimizedPrompt: string;
  isImageTask?: boolean;
  executionOutput?: string;
}

const LOCAL_USER_ID = "local-user-id";

/**
 * Save a completed mission routing result to Firebase Realtime Database.
 */
export async function saveMissionHistory(input: SaveMissionInput): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || LOCAL_USER_ID;
    const createdAt = new Date();

    // 1. Save user record to users node in Firebase RTDB
    try {
      await set(ref(rtdb, `users/${userId}`), {
        id: userId,
        name: session?.user?.name || (userId === LOCAL_USER_ID ? 'Local User' : 'SPARK User'),
        email: session?.user?.email || (userId === LOCAL_USER_ID ? 'local@SPARK.internal' : 'user@SPARK.internal'),
        image: session?.user?.image || null,
        lastActive: createdAt.toISOString(),
      });
    } catch (uErr) {}

    // 2. Save mission record to missionHistory node in Firebase RTDB
    const historyRef = ref(rtdb, 'missionHistory');
    const newRef = push(historyRef);
    const recordId = newRef.key || `mission-${Date.now()}`;

    await set(newRef, {
      id: recordId,
      userId,
      taskDescription: input.taskDescription,
      selectedAI: input.selectedAI,
      aiUrl: input.aiUrl || '',
      reasoning: input.reasoning,
      optimizedPrompt: input.optimizedPrompt,
      isImageTask: input.isImageTask ?? false,
      executionOutput: input.executionOutput || null,
      createdAt: createdAt.toISOString(),
      timestamp: Date.now(),
    });

    return recordId;
  } catch (err: any) {
    console.error('[saveMissionHistory] RTDB error:', err?.message || err);
    return `local-${Date.now()}`;
  }
}

/**
 * Get all mission history records from Firebase Realtime Database.
 */
export async function getMissionHistory() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    let records: any[] = [];

    const snapshot = await get(ref(rtdb, 'missionHistory'));
    if (snapshot.exists()) {
      const val = snapshot.val();
      records = Object.keys(val).map(k => ({
        id: k,
        userId: val[k].userId || LOCAL_USER_ID,
        taskDescription: val[k].taskDescription || '',
        selectedAI: val[k].selectedAI || 'AI Model',
        aiUrl: val[k].aiUrl || null,
        reasoning: val[k].reasoning || '',
        optimizedPrompt: val[k].optimizedPrompt || '',
        isImageTask: !!val[k].isImageTask,
        executionOutput: val[k].executionOutput || null,
        createdAt: val[k].createdAt ? new Date(val[k].createdAt) : new Date(val[k].timestamp || Date.now()),
      }));
    }

    if (userId && records.length > 0) {
      records = records.filter(r => r.userId === userId || r.userId === LOCAL_USER_ID);
    }

    records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return records;
  } catch (err: any) {
    console.error('[getMissionHistory] RTDB error:', err?.message || err);
    return [];
  }
}

/**
 * Delete a single mission history record by ID.
 */
export async function deleteMissionHistory(id: string): Promise<boolean> {
  try {
    await remove(ref(rtdb, `missionHistory/${id}`));
    return true;
  } catch (err) {
    console.error('[deleteMissionHistory] Error:', err);
    return false;
  }
}

/**
 * Update execution output of a mission history record.
 */
export async function updateMissionHistoryOutput(id: string, executionOutput: string): Promise<boolean> {
  try {
    await set(ref(rtdb, `missionHistory/${id}/executionOutput`), executionOutput);
    return true;
  } catch (err) {
    console.error('[updateMissionHistoryOutput] Error:', err);
    return false;
  }
}

/**
 * Update optimized prompt of a mission history record.
 */
export async function updateMissionHistoryPrompt(id: string, optimizedPrompt: string): Promise<boolean> {
  try {
    await set(ref(rtdb, `missionHistory/${id}/optimizedPrompt`), optimizedPrompt);
    return true;
  } catch (err) {
    console.error('[updateMissionHistoryPrompt] Error:', err);
    return false;
  }
}
