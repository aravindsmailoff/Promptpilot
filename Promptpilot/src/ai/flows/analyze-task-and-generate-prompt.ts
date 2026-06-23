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

    const systemPrompt = `You are the Master Orchestrator for PromptPilot. Your objective is to analyze the user's mission and route it to the single most powerful and PRECISE AI model available.

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
When generating the "optimizedPrompt" for any text-based tasks, startup ideas, or informational guides, you MUST explicitly instruct the target AI to focus on startup ideation, helping the user generate and improvise ideas with brutal honesty (no fluff, no bluff). You must explicitly include instructions to produce a clean, clear text output, avoiding noisy formatting symbols (such as *$, #, extra asterisks, or hashes) and strictly prohibiting any image markdown syntax, placeholders, or media brackets.`;

    const userText = `Analyze this task and generate the output:
Objective: "${input.taskDescription}"
${input.fileText ? `Document Context: "${input.fileText}"` : ''}`;

    // Force local Ollama engine with gemma2:2b as required
    const settings = {
      ...input.settings,
      useOllama: true,
      ollamaModel: 'gemma2:2b',
      localEngine: 'ollama' as const
    };

    try {
      let response = '';
      const userContent: any[] = [{ type: "text", text: userText }];
      if (input.imageUri) {
        userContent.push({
          type: "image_url",
          image_url: {
            url: input.imageUri
          }
        });
      }

      const activeModel = settings.ollamaModel;
      const activeUrl = settings.ollamaBaseUrl || 'http://127.0.0.1:11434';
      console.log(`[PromptPilot] Routing task using local Ollama model: ${activeModel}`);

      response = await executeOllamaChat(
        activeUrl,
        activeModel,
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent as any }
        ],
        0.1,
        { type: 'json_object' }
      );

      console.log("[PromptPilot] Ollama raw routing response:", response);
      
      // Strip out internal reasoning/thinking processes (<think>...</think> or <thought>...</thought>)
      response = response.replace(/<(think|thought)>[\s\S]*?<\/\1>/g, '').trim();

      let cleaned = response.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
      }

      let parsedJson;
      try {
        parsedJson = JSON.parse(cleaned);
      } catch (e) {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsedJson = JSON.parse(match[0]);
          } catch (innerE) {
            throw new Error(`Could not parse inner JSON: ${match[0]}`);
          }
        } else {
          throw new Error(`Could not parse JSON response: ${cleaned}`);
        }
      }

      const parsedOutput = AnalyzeTaskOutputSchema.parse(parsedJson);
      console.log("[PromptPilot] Ollama routing success:", parsedOutput);
      return parsedOutput;

    } catch (error: any) {
      console.error(`[PromptPilot] Local routing failed:`, error);
      throw error;
    }
  } catch (error: any) {
    console.error(`[analyzeTaskAndGeneratePrompt] Server Action Error:`, error);
    return {
      selectedAI: '',
      aiUrl: '',
      reasoning: '',
      optimizedPrompt: '',
      error: error.message || String(error)
    };
  }
}
