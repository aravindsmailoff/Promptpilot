'use server';

import { z } from 'genkit';
import { ai } from '@/ai/genkit';

const RefinePromptInputSchema = z.object({
  previousPrompt: z.string().describe('The previous prompt that was generated or used.'),
  feedback: z.string().describe('User feedback indicating what went wrong or what needs to be improved.'),
});
export type RefinePromptInput = z.infer<typeof RefinePromptInputSchema>;

const RefinePromptOutputSchema = z.object({
  refinedPrompt: z.string().describe('The new, refined prompt based on the user feedback.'),
});
export type RefinePromptOutput = z.infer<typeof RefinePromptOutputSchema>;

export async function refinePrompt(input: RefinePromptInput): Promise<RefinePromptOutput> {
  const systemPrompt = `You are an expert prompt engineer tasked with refining prompts based on user feedback.
Your goal is to improve the previous prompt so that it generates a better result, addressing the user's feedback directly.

The output JSON structure MUST contain exactly this key:
{
  "refinedPrompt": "The new, refined prompt based on the user feedback."
}`;

  const userText = `Previous Prompt: """${input.previousPrompt}"""
User Feedback for refinement: """${input.feedback}"""`;

  try {
    console.log("[PromptPilot] Refining prompt using Gemini 2.5 Flash via Genkit");
    
    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      system: systemPrompt,
      prompt: userText,
      output: {
        schema: RefinePromptOutputSchema
      },
      config: {
        temperature: 0.2
      }
    });

    if (!response.output) {
      throw new Error("Failed to generate refined prompt.");
    }

    console.log("[PromptPilot] Refinement success:", response.output);
    return response.output;

  } catch (error: any) {
    console.error("[PromptPilot] Refinement error:", error);
    throw new Error(`Failed to refine prompt via Genkit: ${error.message}`);
  }
}
