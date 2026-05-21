'use server';

import { z } from 'genkit';
import { SUPPORTED_AIS } from '@/lib/ai-data';
import { hfClient, ROUTING_MODELS } from '@/ai/huggingface';

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

You MUST respond strictly with a valid JSON object. Do not include any markdown fences (like \`\`\`json), conversational padding, or commentary outside the JSON object.

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

  let userContent: any[] = [
    {
      type: "text",
      text: userText
    }
  ];

  if (input.imageUri) {
    userContent.push({
      type: "image_url",
      image_url: {
        url: input.imageUri
      }
    });
  }

  // System prompt note for Qwen3 models: prepend /no-think to skip chain-of-thought
  // and get a direct JSON response (faster, deterministic output).
  const qwenSystemPrompt = `/no-think\n\n${systemPrompt}`;

  let lastError: Error | null = null;

  for (const model of ROUTING_MODELS) {
    const isQwen3 = model.startsWith("Qwen/Qwen3");
    try {
      console.log(`[PromptPilot] Trying model: ${model}`);
      const response = await hfClient.chat.completions.create({
        model,
        messages: [
          { role: "system", content: isQwen3 ? qwenSystemPrompt : systemPrompt },
          { role: "user", content: userContent as any }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1, // low temp for deterministic JSON routing
      });

      const responseText = response.choices[0]?.message?.content;
      if (!responseText || responseText.trim() === "") {
        throw new Error("Empty response received from model.");
      }

      console.log(`[PromptPilot] Success with ${model}:`, responseText);

      // Clean up Markdown JSON wrapper if model ignored instructions
      let cleanJson = responseText.trim();
      // Strip Qwen3 <think>...</think> blocks if they leak through
      cleanJson = cleanJson.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
      if (cleanJson.startsWith("```json")) {
        cleanJson = cleanJson.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.replace(/^```/, "").replace(/```$/, "").trim();
      }

      const parsed = JSON.parse(cleanJson);
      return AnalyzeTaskOutputSchema.parse(parsed);

    } catch (error: any) {
      console.warn(`[PromptPilot] Model ${model} failed: ${error.message}`);
      lastError = error;
      // Continue to next fallback model
    }
  }

  throw new Error(`All routing models failed. Last error: ${lastError?.message}`);
}
