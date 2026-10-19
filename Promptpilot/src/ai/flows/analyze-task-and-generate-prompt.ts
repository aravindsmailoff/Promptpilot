'use server';

import { z } from 'zod';
import { SUPPORTED_AIS } from '@/lib/ai-data';
import { hfClient, ROUTING_MODELS } from '@/ai/huggingface';
import { executeOllamaChat } from '@/ai/ollama';
import { executePythonChat } from '@/ai/python-server';

const AnalyzeTaskInputSchema = z.object({
  taskDescription: z.string().describe('A plain language description of the user\'s task.'),
  imageUri: z.string().optional().describe("An optional photo attachment, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  fileText: z.string().optional().describe('Optional text extracted from an uploaded document.'),
  settings: z.object({
    useOllama: z.boolean().optional(),
    ollamaBaseUrl: z.string().optional(),
    ollamaModel: z.string().optional(),
    localEngine: z.enum(['ollama', 'python']).optional(),
    pythonServerUrl: z.string().optional(),
  }).optional(),
});
export type AnalyzeTaskInput = z.infer<typeof AnalyzeTaskInputSchema>;

const AnalyzeTaskOutputSchema = z.object({
  selectedAI: z.string().describe('The name of the most precise and powerful AI selected for the task.'),
  aiUrl: z.string().describe('The official URL to access the selected AI (e.g., https://chatgpt.com, https://claude.ai). Must be a valid URL starting with http.'),
  reasoning: z.string().describe('Explanation of why this model has the tactical advantage for this specific task.'),
  optimizedPrompt: z.string().describe('A master-level prompt optimized for the selected AI\'s specific strengths.'),
  error: z.string().optional().describe('An optional error message if execution failed.'),
});
export type AnalyzeTaskOutput = z.infer<typeof AnalyzeTaskOutputSchema>;

export async function analyzeTaskAndGeneratePrompt(input: AnalyzeTaskInput): Promise<AnalyzeTaskOutput> {
  try {
    const availableAIs = SUPPORTED_AIS.map(ai => ({
      id: ai.id,
      name: ai.name,
      description: ai.description,
      category: ai.category
    }));

    const systemPrompt = `You are the Master Orchestrator for SPARK. Your objective is to analyze the user's mission and route it to the single most powerful and PRECISE AI model available.

The output JSON structure MUST contain exactly these keys:
{
  "selectedAI": "The exact display name of the selected AI.",
  "aiUrl": "The official URL where the user can access this AI (must start with http).",
  "reasoning": "A concise briefing on the model's tactical advantage (max 12 words).",
  "optimizedPrompt": "A master-level prompt optimized for the selected AI's specific strengths."
}

### Step 1: Tactical Fleet Analysis
Evaluate the mission against the available "Known Fleet" models below.

Known Fleet:
${availableAIs.map(ai => `- ${ai.name}: ${ai.description}`).join('\n')}

### Step 2: Strategic Decision
You MUST select the absolute best AI for this task STRICTLY from the provided "Known Fleet" list. Do NOT suggest any AI that is not explicitly listed in the Known Fleet.
Selection Criteria:
- Specialization & Accuracy: Evaluate the provided Known Fleet and select the one whose description best matches the specific technical requirements of the user's task.
- Constraint: Your selectedAI MUST exactly match the display name of one of the AIs in the Known Fleet.

### Step 3: Optimized Prompt Rules
When generating the "optimizedPrompt", it MUST be directly relevant to the user's exact objective and prompt intent:
- If the user provides a greeting, casual chat, question, or specific coding/writing task, optimize for that exact intent. Do NOT force unrelated startup advice or ideation onto general prompts.
- If the user specifically asks for startup ideation, venture analysis, or business advice, then provide deep, brutally honest strategic startup guidance.
- Produce clean, clear output, avoiding noisy formatting symbols (such as *$, #, extra asterisks, or hashes) and strictly prohibiting any image markdown syntax, placeholders, or media brackets.`;

    const userText = `Analyze this task and generate the output:
Objective: "${input.taskDescription}"
${input.fileText ? `Document Context: "${input.fileText}"` : ''}`;

    const useOllama = input.settings?.useOllama ?? true;
    const activeModel = input.settings?.ollamaModel || 'qwen3.5:2b';
    const activeUrl = input.settings?.ollamaBaseUrl || 'http://127.0.0.1:11434';
    const localEngine = input.settings?.localEngine || 'ollama';

    let rawResponse = '';

    const isCloud = process.env.VERCEL === '1' || 
      Boolean(process.env.VERCEL_ENV) || 
      Boolean(process.env.VERCEL_URL) || 
      Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

    const isLocalhost = activeUrl.includes('127.0.0.1') || activeUrl.includes('localhost');
    const targetOllamaUrl = (isCloud && isLocalhost && process.env.OLLAMA_BASE_URL) 
      ? process.env.OLLAMA_BASE_URL 
      : activeUrl;

    // ── Attempt 1: Ollama Engine (runs locally or via secure tunnel) ────────────────
    if (useOllama) {
      try {
        console.log(`[SPARK] Attempting routing via ${localEngine} (${activeModel} at ${targetOllamaUrl})...`);
        
        if (localEngine === 'python') {
          const pyUrl = input.settings?.pythonServerUrl || 'http://127.0.0.1:8000';
          rawResponse = await executePythonChat(
            pyUrl,
            [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userText }
            ],
            0.1
          );
        } else {
          const userContent: any[] = [{ type: 'text', text: userText }];
          if (input.imageUri) {
            userContent.push({ type: 'image_url', image_url: { url: input.imageUri } });
          }
          rawResponse = await executeOllamaChat(
            targetOllamaUrl,
            activeModel,
            [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userContent as any }
            ],
            0.1,
            { type: 'json_object' }
          );
        }
      } catch (localErr: any) {
        console.warn(`[SPARK] Ollama routing failed:`, localErr.message);
        throw new Error(`Ollama Routing Error: ${localErr.message}`);
      }
    } else {
      // ── Attempt 2: Cloud AI Fleet (only if useOllama is false) ─
      console.log(`[SPARK] Routing task using Cloud AI Fleet (Hugging Face Router)...`);
      for (const model of ROUTING_MODELS) {
        try {
          const completion = await hfClient.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userText }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
          });
          rawResponse = completion.choices[0]?.message?.content || '';
          if (rawResponse) break;
        } catch (cloudErr: any) {
          console.warn(`[SPARK] Cloud AI model ${model} failed:`, cloudErr.message);
        }
      }
    }

    if (!rawResponse) {
      throw new Error(`Failed to route task. Local Ollama (${activeModel}) was unreachable.`);
    }

    // Clean internal thinking tags (<think>...</think> or <thought>...</thought>)
    rawResponse = rawResponse.replace(/<(think|thought)>[\s\S]*?<\/\1>/g, '').trim();

    let cleaned = rawResponse.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    let parsedJson;
    try {
      parsedJson = JSON.parse(cleaned);
    } catch (e) {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        parsedJson = JSON.parse(match[0]);
      } else {
        throw new Error(`Could not parse JSON response from router: ${cleaned}`);
      }
    }

    const parsedOutput = AnalyzeTaskOutputSchema.parse(parsedJson);
    console.log('[SPARK] Routing success:', parsedOutput.selectedAI);
    return parsedOutput;

  } catch (error: any) {
    console.error('[analyzeTaskAndGeneratePrompt] Error:', error);
    return {
      selectedAI: 'ChatGPT (GPT-4o)',
      aiUrl: 'https://chatgpt.com',
      reasoning: 'Routed to top general-purpose AI model.',
      optimizedPrompt: input.taskDescription,
      error: undefined
    };
  }
}
