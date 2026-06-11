'use server';

import { z } from 'zod';
import { hfClient, ROUTING_MODELS } from '@/ai/huggingface';
import { executeOllamaChat } from '@/ai/ollama';
import { executePythonChat } from '@/ai/python-server';

const RefinePromptInputSchema = z.object({
  previousPrompt: z.string().describe('The previous prompt that was generated or used.'),
  feedback: z.string().describe('User feedback indicating what went wrong or what needs to be improved.'),
  settings: z.object({
    useOllama: z.boolean().optional(),
    ollamaBaseUrl: z.string().optional(),
    ollamaModel: z.string().optional(),
    localEngine: z.enum(['ollama', 'python']).optional(),
    pythonServerUrl: z.string().optional(),
  }).optional(),
});
export type RefinePromptInput = z.infer<typeof RefinePromptInputSchema>;

const RefinePromptOutputSchema = z.object({
  refinedPrompt: z.string().describe('The new, refined prompt based on the user feedback.'),
  error: z.string().optional().describe('An optional error message if execution failed.'),
});
export type RefinePromptOutput = z.infer<typeof RefinePromptOutputSchema>;

export async function refinePrompt(input: RefinePromptInput): Promise<RefinePromptOutput> {
  try {
    const systemPrompt = `You are an expert prompt engineer tasked with refining prompts based on user feedback.
Your goal is to improve the previous prompt so that it generates a better result, addressing the user's feedback directly.

The output JSON structure MUST contain exactly this key:
{
  "refinedPrompt": "The new, refined prompt based on the user feedback."
}`;

    const userText = `Previous Prompt: """${input.previousPrompt}"""
User Feedback for refinement: """${input.feedback}"""`;

    if (input.settings?.useOllama) {
      try {
        let response = '';

        if (input.settings.localEngine === 'python') {
          const activeUrl = input.settings.pythonServerUrl || 'http://127.0.0.1:8000';
          console.log(`[PromptPilot] Refining prompt using local Python Server: ${activeUrl}`);
          
          response = await executePythonChat(
            activeUrl,
            [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userText }
            ],
            0.2
          );
        } else {
          const activeModel = input.settings.ollamaModel || 'gemma2:2b';
          const activeUrl = input.settings.ollamaBaseUrl || 'http://127.0.0.1:11434';
          console.log(`[PromptPilot] Refining prompt using local Ollama model: ${activeModel}`);

          response = await executeOllamaChat(
            activeUrl,
            activeModel,
            [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userText }
            ],
            0.2,
            { type: 'json_object' }
          );
        }

        console.log("[PromptPilot] Ollama raw refinement response:", response);

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

        const parsedOutput = RefinePromptOutputSchema.parse(parsedJson);
        console.log("[PromptPilot] Ollama refinement success:", parsedOutput);
        return parsedOutput;

      } catch (error: any) {
        console.warn(`[PromptPilot] Ollama/Python local refinement failed, falling back to Hugging Face Cloud API:`, error);
        // Do not throw, allow execution to fall through to Hugging Face Cloud fallback
      }
    }

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
        
        // Clean up markdown block wraps if present
        let cleaned = content.trim();
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

        // Parse and validate the response
        const parsedOutput = RefinePromptOutputSchema.parse(parsedJson);
        console.log("[PromptPilot] Refinement success:", parsedOutput);
        return parsedOutput;

      } catch (error: any) {
        console.error(`[PromptPilot] Refinement error with model ${model}:`, error);
        lastError = error;
        // Fallback to the next model in the list
      }
    }

    throw new Error(`Failed to refine prompt: ${lastError?.message || lastError}`);
  } catch (error: any) {
    console.error(`[refinePrompt] Server Action Error:`, error);
    return {
      refinedPrompt: '',
      error: error.message || String(error)
    };
  }
}
