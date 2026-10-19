import { OpenAI } from "openai";

/**
 * SPARK Cloud Intelligence Client (Hugging Face Inference Router).
 * Uses Hugging Face OpenAI-compatible API endpoint (https://router.huggingface.co/v1).
 * Serves as the cloud AI fallback when local Ollama is offline or unavailable.
 */
export const hfClient = new OpenAI({
  baseURL: process.env.HF_ROUTER_URL || "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN || "",
});

export const ROUTING_MODELS = [
  "Qwen/Qwen2.5-7B-Instruct",
  "meta-llama/Llama-3.2-1B-Instruct",
  "google/gemma-2-2b-it",
] as const;

export const PRIMARY_ROUTING_MODEL = ROUTING_MODELS[0];

