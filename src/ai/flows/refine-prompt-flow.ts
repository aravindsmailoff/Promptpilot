'use server';

import { z } from 'zod';
import { hfClient, ROUTING_MODELS } from '@/ai/huggingface';

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

  let lastError: any = null;

  // Try routing models in sequence
  for (const model of ROUTING_MODELS) {
    try {
      console.log(`[PromptPilot] Refining prompt using Hugging Face model: ${model}`);
      
      const response = await hfClient.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error(`Empty response from Hugging Face model ${model}`);
      }

      console.log("[PromptPilot] Refinement raw response content:", content);
      
      // Parse and validate the response
      const parsedOutput = RefinePromptOutputSchema.parse(JSON.parse(content));
      console.log("[PromptPilot] Refinement success:", parsedOutput);
      return parsedOutput;

    } catch (error: any) {
      console.error(`[PromptPilot] Refinement error with model ${model}:`, error);
      lastError = error;
      // Fallback to the next model in the list
    }
  }

  throw new Error(`Failed to refine prompt: ${lastError?.message || lastError}`);
}
