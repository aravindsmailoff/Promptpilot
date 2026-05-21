'use server';

import { hfClient } from '@/ai/huggingface';

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
    console.log("[HuggingFace Execution] Sending prompt to Gemma 4");
    const response = await hfClient.chat.completions.create({
      model: "google/gemma-4-31B-it:together",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const text = response.choices[0]?.message?.content;
    if (!text) {
      throw new Error("Gemma 4 returned an empty response.");
    }

    return text;
  } catch (error: any) {
    console.error("[HuggingFace API Execution Error]:", error);
    throw new Error(`Execution Failed: ${error.message}`);
  }
}

