'use server';

import { z } from 'genkit';
import { hfClient } from '@/ai/huggingface';

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

You MUST respond strictly with a valid JSON object. Do not include markdown fences (like \`\`\`json), conversational padding, or commentary outside the JSON object.

The output JSON structure MUST contain exactly this key:
{
  "refinedPrompt": "The new, refined prompt based on the user feedback."
}`;

  const userText = `Previous Prompt: """${input.previousPrompt}"""
User Feedback for refinement: """${input.feedback}"""`;

  try {
    const response = await hfClient.chat.completions.create({
      model: "google/gemma-4-31B-it:together",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText }
      ],
      response_format: { type: "json_object" }
    });

    const responseText = response.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error("Empty response received from HuggingFace Router during refinement.");
    }

    console.log("[HuggingFace Refinement Output]:", responseText);

    let cleanJson = responseText.trim();
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```/, "").replace(/```$/, "").trim();
    }

    const parsed = JSON.parse(cleanJson);
    return RefinePromptOutputSchema.parse(parsed);

  } catch (error: any) {
    console.error("[HuggingFace Refinement Error]:", error);
    throw new Error(`Failed to refine prompt via HuggingFace: ${error.message}`);
  }
}
