import { NextRequest, NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { analyzeTaskAndGeneratePrompt } from '@/ai/flows/analyze-task-and-generate-prompt';
import { executePromptViaApi } from '@/ai/actions/execute-prompt';
import { 
  ref, 
  push, 
  set, 
  get, 
  remove 
} from 'firebase/database';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'history') {
      let history: any[] = [];
      try {
        const snap = await get(ref(rtdb, 'missionHistory'));
        if (snap.exists()) {
          const val = snap.val();
          history = Object.keys(val).map(k => ({ id: k, ...val[k] }));
          history.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        }
      } catch (e) {}
      return NextResponse.json(history);
    }

    if (action === 'memories') {
      let memories: any[] = [];
      try {
        const snap = await get(ref(rtdb, 'memories'));
        if (snap.exists()) {
          const val = snap.val();
          memories = Object.keys(val).map(k => ({ id: k, ...val[k] }));
          memories.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        }
      } catch (e) {}
      return NextResponse.json(memories);
    }

    return NextResponse.json({ error: 'Invalid GET action.' }, { status: 400 });
  } catch (err: any) {
    console.error('[GET /api/mobile] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const body = await req.json().catch(() => ({}));

    if (action === 'analyze') {
      const { taskDescription, imageUri, fileText, useOllama } = body;
      if (!taskDescription) {
        return NextResponse.json({ error: 'taskDescription is required.' }, { status: 400 });
      }

      const result = await analyzeTaskAndGeneratePrompt({
        taskDescription,
        imageUri: imageUri || undefined,
        fileText: fileText || undefined,
        settings: { 
          useOllama: useOllama !== undefined ? useOllama : true, 
          ollamaModel: 'qwen3.5:2b', 
          localEngine: 'ollama' 
        }
      });

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      const newRef = push(ref(rtdb, 'missionHistory'));
      const recordId = newRef.key || `mobile-${Date.now()}`;
      await set(newRef, {
        id: recordId,
        userId: 'mobile-user-id',
        taskDescription,
        selectedAI: result.selectedAI || 'Local Router',
        aiUrl: result.aiUrl || '',
        reasoning: result.reasoning || '',
        optimizedPrompt: result.optimizedPrompt || '',
        isImageTask: result.selectedAI ? result.selectedAI.toLowerCase().includes('image') : false,
        executionOutput: '',
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({
        ...result,
        historyId: recordId
      });
    }

    if (action === 'execute') {
      const { prompt, isImage, isVideo, historyId, useOllama } = body;
      if (!prompt) {
        return NextResponse.json({ error: 'prompt is required.' }, { status: 400 });
      }

      const output = await executePromptViaApi(prompt, isImage, isVideo, {
        useOllama: useOllama !== undefined ? useOllama : true,
        ollamaModel: 'qwen3.5:2b',
        localEngine: 'ollama'
      });

      if (historyId) {
        try {
          await set(ref(rtdb, `missionHistory/${historyId}/executionOutput`), output);
        } catch (e) {}
      }

      return NextResponse.json({ output });
    }

    if (action === 'addMemory') {
      const { content, source } = body;
      if (!content) {
        return NextResponse.json({ error: 'content is required.' }, { status: 400 });
      }

      const newRef = push(ref(rtdb, 'memories'));
      const memId = newRef.key || `mem-${Date.now()}`;
      const memoryData = {
        id: memId,
        content,
        source: source || 'mobile',
        sourceApp: 'SPARK Mobile',
        createdAt: new Date().toISOString(),
        metadata: '{}',
      };

      await set(newRef, memoryData);
      return NextResponse.json(memoryData, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid POST action.' }, { status: 400 });
  } catch (err: any) {
    console.error('[POST /api/mobile] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'deleteHistory') {
      const id = searchParams.get('id');
      if (!id) {
        return NextResponse.json({ error: 'id is required.' }, { status: 400 });
      }
      try {
        await remove(ref(rtdb, `missionHistory/${id}`));
      } catch (e) {}
      return NextResponse.json({ success: true });
    }

    if (action === 'deleteMemory') {
      const id = searchParams.get('id');
      if (!id) {
        return NextResponse.json({ error: 'id is required.' }, { status: 400 });
      }
      try {
        await remove(ref(rtdb, `memories/${id}`));
      } catch (e) {}
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid DELETE action.' }, { status: 400 });
  } catch (err: any) {
    console.error('[DELETE /api/mobile] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
