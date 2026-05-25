'use server';

import { ai } from '@/ai/genkit';

export async function executeImageGeneration(prompt: string): Promise<string> {
  // We try FLUX.1-schnell first. If it fails, we fall back to Stable Diffusion XL.
  const models = [
    "black-forest-labs/FLUX.1-schnell",
    "stabilityai/stable-diffusion-xl-base-1.0",
    "stabilityai/stable-diffusion-3.5-large"
  ];

  let lastError: Error | null = null;

  for (const model of models) {
    try {
      console.log(`[HuggingFace Image Gen] Sending prompt to model: ${model}`);
      const response = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.HF_TOKEN}`,
          "x-wait-for-model": "true"
        },
        body: JSON.stringify({
          inputs: prompt
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HF HTTP error! Status: ${response.status}, message: ${errorText}`);
      }

      // The response is binary image data
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const contentType = response.headers.get("content-type") || "image/png";
      
      console.log(`[HuggingFace Image Gen] Success generating image using ${model}`);
      return `data:${contentType};base64,${base64}`;
    } catch (error: any) {
      console.warn(`[HuggingFace Image Gen] Model ${model} failed: ${error.message}`);
      lastError = error;
    }
  }

  throw new Error(`All image generation models failed. Last error: ${lastError?.message}`);
}

export async function executePromptViaApi(prompt: string, isImage?: boolean): Promise<string> {
  if (isImage) {
    return executeImageGeneration(prompt);
  }

  try {
    console.log("[Genkit Execution] Sending prompt to Gemini 2.5 Flash");
    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      system: "You are a professional assistant. Neatly structure your output using clean spacing, line breaks, capital headers, and standard lists. Do NOT use markdown bold tags like '**' or markdown italic tags like '*' for formatting text headers or emphasis. Ensure all formatting is achieved using standard capitalization, spacing, and indentations without raw markdown symbols.",
      prompt: prompt,
    });

    let text = response.text;
    if (!text) {
      throw new Error("Gemini 2.5 Flash returned an empty response.");
    }

    // Clean up any raw double-asterisk bold tags if they slip through
    text = text.replace(/\*\*/g, '');

    return text;
  } catch (error: any) {
    console.error("[Genkit API Execution Error]:", error);
    throw new Error(`Execution Failed: ${error.message}`);
  }
}

