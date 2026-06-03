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

const RESEARCH_SYSTEM_PROMPT = `You are PromptPilot Research AI — an advanced research engine, not a chatbot.

Your role: Synthesize live web research into comprehensive, authoritative reports.

OUTPUT RULES (follow strictly):
1. Use ## headings and ### sub-headings to structure every response
2. Use **bold** for key terms, findings, and important data points
3. Use bullet points for lists, numbered lists for steps/rankings
4. When live research data is provided above, cite sources inline: e.g., "According to [Source Name]..."
5. End every response with a "## Sources" section listing all URLs consulted
6. If no live data was fetched, clearly state "Based on training knowledge as of [your cutoff]:"
7. Flag contradictions or gaps: "⚠ Note: Sources conflict on this point..."
8. Provide a "## Key Takeaways" section with 3–5 actionable bullet points at the end

You are NOT a casual assistant. You deliver RESEARCH-GRADE outputs with depth, structure, and citations.
Move fast, cite everything, leave no question half-answered.`;

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

  // ── IMAGE / VIDEO paths (remain as is) ────────────────
  if (isImage) return executeImageGeneration(prompt);
  if (isVideo) return executeVideoGeneration(prompt);

  // ── TEXT GENERATION path (OLLAMA / LOCAL ONLY) ──────────────────────────────
  if (!settings?.useOllama) {
    const systemMessage = "You are a professional assistant. Neatly structure your output using clean headings, sections, bold text for key terms, and standard lists. Provide a highly organized, professional document with clear structure and clean spacing.";
    let lastError: any = null;

    for (const model of ROUTING_MODELS) {
      try {
        console.log(`[HuggingFace Cloud Execution] Sending prompt using model: ${model}`);
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

    throw new Error(`Cloud Execution Failed: ${lastError?.message || lastError}`);
  }

  // Fetch live web data before calling local synthesis
  let enrichedPrompt = prompt;
  let sourcesFooter = '';

  try {
    const { conductResearch, buildResearchPrompt } = await import('@/ai/research');
    console.log('[PromptPilot Research AI] Conducting live web research...');
    const research = await conductResearch(prompt);

    if (research.sources.length > 0) {
      enrichedPrompt = await buildResearchPrompt(prompt, research);
      sourcesFooter = research.sources
        .map((s, i) => `${i + 1}. [${s.title}](${s.url})`)
        .join('\n');
      console.log(`[PromptPilot Research AI] Research complete. ${research.sources.length} sources injected.`);
    } else {
      console.log('[PromptPilot Research AI] No live sources found — using training knowledge.');
    }
  } catch (researchErr) {
    console.warn('[PromptPilot Research AI] Research phase failed, proceeding with raw prompt:', researchErr);
  }

  // ── SYNTHESIS PHASE ─────────────────────────────
  // Send enriched prompt to Ollama / local engine for synthesis
  let text = '';
  const localEngine = settings?.localEngine || 'ollama';

  try {
    if (localEngine === 'python') {
      const activeUrl = settings?.pythonServerUrl || 'http://127.0.0.1:8000';
      console.log(`[PromptPilot Research AI] Synthesizing via Python Server: ${activeUrl}`);
      text = await executePythonChat(
        activeUrl,
        [
          { role: 'system', content: RESEARCH_SYSTEM_PROMPT },
          { role: 'user', content: enrichedPrompt },
        ],
        0.4
      );
    } else {
      const activeModel = settings?.ollamaModel || 'gemma2:2b';
      const activeUrl = settings?.ollamaBaseUrl || 'http://127.0.0.1:11434';
      console.log(`[PromptPilot Research AI] Synthesizing via Ollama model: ${activeModel}`);

      text = await executeOllamaChat(
        activeUrl,
        activeModel,
        [
          { role: 'system', content: RESEARCH_SYSTEM_PROMPT },
          { role: 'user', content: enrichedPrompt },
        ],
        0.4
      );
    }
  } catch (err: any) {
    console.error('[PromptPilot Server Action Error]:', err);
    return `Error: ${err.message || err}`;
  }

  // Strip think/thought tags
  text = text.replace(/<(think|thought)>[\s\S]*?<\/\1>/g, '').trim();

  // Append sources footer if not already in output and we have sources
  if (sourcesFooter && !text.includes('## Sources')) {
    text += `\n\n## Sources\n${sourcesFooter}`;
  }

  return text;
}
