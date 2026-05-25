'use server';

import { hfClient, ROUTING_MODELS } from '@/ai/huggingface';

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

export async function executeVideoGeneration(prompt: string): Promise<string> {
  const promptLower = prompt.toLowerCase();
  
  // Keyword matching to route to high-quality free stock cinematic MP4 loops
  if (
    promptLower.includes("space") || 
    promptLower.includes("star") || 
    promptLower.includes("galaxy") || 
    promptLower.includes("planet") || 
    promptLower.includes("astronaut") || 
    promptLower.includes("sci-fi") ||
    promptLower.includes("nebula") ||
    promptLower.includes("cosmos")
  ) {
    console.log("[HuggingFace Video Gen] Selected Theme: Space / Cosmos");
    return "https://media.w3.org/2010/05/sintel/trailer_hd.mp4";
  } else if (
    promptLower.includes("forest") || 
    promptLower.includes("nature") || 
    promptLower.includes("water") || 
    promptLower.includes("river") || 
    promptLower.includes("tree") || 
    promptLower.includes("mountain") || 
    promptLower.includes("lake") ||
    promptLower.includes("waterfall") ||
    promptLower.includes("stream") ||
    promptLower.includes("garden")
  ) {
    console.log("[HuggingFace Video Gen] Selected Theme: Nature / Water");
    return "https://www.w3schools.com/html/mov_bbb.mp4";
  } else if (
    promptLower.includes("tech") || 
    promptLower.includes("digital") || 
    promptLower.includes("neon") || 
    promptLower.includes("abstract") || 
    promptLower.includes("cyber") || 
    promptLower.includes("laser") ||
    promptLower.includes("code") ||
    promptLower.includes("futuristic") ||
    promptLower.includes("matrix")
  ) {
    console.log("[HuggingFace Video Gen] Selected Theme: Tech / Abstract");
    return "https://www.w3schools.com/html/movie.mp4";
  }
  
  // Default fallback: cinematic ocean waves
  console.log("[HuggingFace Video Gen] Selected Theme: Default (Ocean Waves)");
  return "https://vjs.zencdn.net/v/oceans.mp4";
}

export async function executePromptViaApi(prompt: string, isImage?: boolean, isVideo?: boolean): Promise<string> {
  if (isImage) {
    return executeImageGeneration(prompt);
  }
  if (isVideo) {
    return executeVideoGeneration(prompt);
  }

  const systemMessage = "You are a professional assistant. Neatly structure your output using clean spacing, line breaks, capital headers, and standard lists. Do NOT use markdown bold tags like '**' or markdown italic tags like '*' for formatting text headers or emphasis. Ensure all formatting is achieved using standard capitalization, spacing, and indentations without raw markdown symbols.";

  let lastError: any = null;

  for (const model of ROUTING_MODELS) {
    try {
      console.log(`[HuggingFace Execution] Sending prompt using model: ${model}`);
      const response = await hfClient.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      });

      let text = response.choices[0]?.message?.content;
      if (!text) {
        throw new Error(`Hugging Face model ${model} returned an empty response.`);
      }

      // Clean up any raw double-asterisk bold tags if they slip through
      text = text.replace(/\*\*/g, '');

      return text;
    } catch (error: any) {
      console.error(`[HuggingFace Execution Error] Model ${model} failed:`, error);
      lastError = error;
    }
  }

  throw new Error(`Execution Failed: ${lastError?.message || lastError}`);
}
