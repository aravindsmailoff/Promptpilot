'use server';

import { z } from 'genkit';
import { SUPPORTED_AIS } from '@/lib/ai-data';
import { ai } from '@/ai/genkit';

const AnalyzeTaskInputSchema = z.object({
  taskDescription: z.string().describe('A plain language description of the user\'s task.'),
  imageUri: z.string().optional().describe("An optional photo attachment, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  fileText: z.string().optional().describe('Optional text extracted from an uploaded document.'),
});
export type AnalyzeTaskInput = z.infer<typeof AnalyzeTaskInputSchema>;

const AnalyzeTaskOutputSchema = z.object({
  selectedAI: z.string().describe('The name of the most precise and powerful AI selected for the task.'),
  aiUrl: z.string().describe('The official URL to access the selected AI (e.g., https://chatgpt.com, https://claude.ai). Must be a valid URL starting with http.'),
  reasoning: z.string().describe('Explanation of why this model has the tactical advantage for this specific task.'),
  optimizedPrompt: z.string().describe('A master-level prompt optimized for the selected AI\'s specific strengths.'),
});
export type AnalyzeTaskOutput = z.infer<typeof AnalyzeTaskOutputSchema>;

export async function analyzeTaskAndGeneratePrompt(input: AnalyzeTaskInput): Promise<AnalyzeTaskOutput> {
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
  "optimizedPrompt": "A master-engineered prompt optimized for the target AI."
}

### Step 1: Tactical Fleet Analysis
Evaluate the mission against the available "Known Fleet" models below.

Known Fleet:
${availableAIs.map(ai => `- ${ai.name}: ${ai.description}`).join('\n')}

### Step 2: Strategic Decision
You MUST select the absolute best AI for this task STRICTLY from the provided "Known Fleet" list. Do NOT suggest any AI that is not explicitly listed in the Known Fleet.
Selection Criteria:
- Specialization & Accuracy: Evaluate the provided Known Fleet and select the one whose description best matches the specific technical requirements of the user's task.
- Constraint: Your selectedAI MUST exactly match the display name of one of the AIs in the Known Fleet.`;

  const userText = `Analyze this task and generate the output:
Objective: "${input.taskDescription}"
${input.fileText ? `Document Context: "${input.fileText}"` : ''}`;

  try {
    console.log("[PromptPilot] Routing task using Gemini 2.5 Flash via Genkit");
    
    const userContent: any[] = [{ text: userText }];
    if (input.imageUri) {
      userContent.push({ media: { url: input.imageUri } });
    }

    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userContent
        }
      ],
      output: {
        schema: AnalyzeTaskOutputSchema
      },
      config: {
        temperature: 0.1
      }
    });

    if (!response.output) {
      throw new Error("Failed to generate structured routing parameters.");
    }

    console.log("[PromptPilot] Routing success:", response.output);
    return response.output;
  } catch (error: any) {
    console.error("[PromptPilot] Routing error:", error);
    throw new Error(`Orchestration routing failed: ${error.message}`);
  }
}
