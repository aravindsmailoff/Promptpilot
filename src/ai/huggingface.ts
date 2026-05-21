import { OpenAI } from "openai";

/**
 * Hugging Face Inference Router client.
 * Uses the OpenAI-compatible API via HF Router.
 *
 * Best open-source model for task routing / JSON structured output (2025):
 *   Primary:  Qwen/Qwen3-32B        — 258 tok/s, 321ms TTFT, JSON output, tools ✓
 *   Fallback: Qwen/Qwen3-8B         — lighter, still strong instruction following
 *   Legacy:   google/gemma-4-31B-it — original model, kept as last resort
 *
 * Selection criteria from live HF Router API (router.huggingface.co/v1/models):
 *  ✓ supports_structured_output (json_object mode)
 *  ✓ supports_tools
 *  ✓ low first_token_latency_ms
 *  ✓ high throughput (tokens/sec)
 *  ✓ Apache-2.0 or MIT license (fully open source)
 */
export const hfClient = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN,
});

/**
 * Ordered list of models to try for routing/JSON tasks.
 * The system tries each in order and falls back on failure.
 */
export const ROUTING_MODELS = [
  // #1 Best: Qwen3-32B — highest throughput + structured output via groq on HF router
  "Qwen/Qwen3-32B",
  // #2 Fallback: lighter Qwen3-8B — fast, still great at instruction following
  "Qwen/Qwen3-8B",
  // #3 Legacy: original Gemma model — kept as last resort
  "google/gemma-4-31B-it:together",
] as const;

export const PRIMARY_ROUTING_MODEL = ROUTING_MODELS[0];
