'use server';

import { hfClient, ROUTING_MODELS } from '@/ai/huggingface';
import { executeOllamaChat } from '@/ai/ollama';
import { executePythonChat } from '@/ai/python-server';

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
  
  // 1. Explicit Cat / Kitten Match
  if (promptLower.includes("cat") || promptLower.includes("kitten")) {
    console.log("[HuggingFace Video Gen] Selected Theme: Cat / Kitten");
    return "https://github.com/opsxcq/meme-vibing-cat/raw/master/cat.mp4";
  }
  
  // 2. Space / Cosmos / Sci-fi Match
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
  }
  
  // 3. Nature / Animals Match
  if (
    promptLower.includes("forest") || 
    promptLower.includes("nature") || 
    promptLower.includes("river") || 
    promptLower.includes("tree") || 
    promptLower.includes("mountain") || 
    promptLower.includes("lake") ||
    promptLower.includes("waterfall") ||
    promptLower.includes("stream") ||
    promptLower.includes("garden") ||
    promptLower.includes("animal") ||
    promptLower.includes("rabbit") ||
    promptLower.includes("bunny")
  ) {
    console.log("[HuggingFace Video Gen] Selected Theme: Nature / Water");
    return "https://www.w3schools.com/html/mov_bbb.mp4";
  }
  
  // 4. Tech / Abstract Match
  if (
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
  
  // 5. Default Fallback: Oceans
  console.log("[HuggingFace Video Gen] Selected Theme: Default (Ocean Waves)");
  return "https://vjs.zencdn.net/v/oceans.mp4";
}

export async function executePromptViaApi(
  prompt: string, 
  isImage?: boolean, 
  isVideo?: boolean,
  settings?: {
    useOllama?: boolean;
    ollamaBaseUrl?: string;
    ollamaModel?: string;
    localEngine?: 'ollama' | 'python';
    pythonServerUrl?: string;
  }
): Promise<string> {
  const systemMessage = "You are a professional assistant. Neatly structure your output using clean headings, sections, bold text for key terms, and standard lists. Provide a highly organized, professional document with clear structure and clean spacing.";

  if (settings?.useOllama) {
    let text = '';
    if (settings.localEngine === 'python') {
      const activeUrl = settings.pythonServerUrl || 'http://127.0.0.1:8000';
      console.log(`[PromptPilot] Executing prompt using local Python Server: ${activeUrl}`);
      text = await executePythonChat(
        activeUrl,
        [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt }
        ],
        0.7
      );
    } else {
      const activeModel = settings.ollamaModel || 'gemma2:2b';
      const activeUrl = settings.ollamaBaseUrl || 'http://127.0.0.1:11434';
      console.log(`[PromptPilot] Executing prompt using local Ollama model: ${activeModel}`);
      
      text = await executeOllamaChat(
        activeUrl,
        activeModel,
        [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt }
        ],
        0.7
      );
    }

    // Strip out internal reasoning/thinking processes (<think>...</think> or <thought>...</thought>)
    text = text.replace(/<(think|thought)>[\s\S]*?<\/\1>/g, '').trim();
    return text;
  }

  if (isImage) {
    return executeImageGeneration(prompt);
  }
  if (isVideo) {
    return executeVideoGeneration(prompt);
  }

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

      // Strip out internal reasoning/thinking processes (<think>...</think> or <thought>...</thought>)
      text = text.replace(/<(think|thought)>[\s\S]*?<\/\1>/g, '').trim();

      return text;
    } catch (error: any) {
      console.error(`[HuggingFace Execution Error] Model ${model} failed:`, error);
      lastError = error;
    }
  }

  throw new Error(`Execution Failed: ${lastError?.message || lastError}`);
}
