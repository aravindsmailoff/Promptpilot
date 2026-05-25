import { 
  MessageSquare, 
  Sparkles, 
  Brain, 
  Search, 
  Image as ImageIcon, 
  Zap, 
  Bot, 
  Code, 
  Video, 
  Music, 
  Mic2, 
  Globe,
  Cpu,
  Layers,
  PenTool,
  Monitor,
  Rocket,
  ShieldCheck
} from 'lucide-react';

export const SUPPORTED_AIS = [
  // --- General Intelligence (High-Precision Free/Open) ---
  {
    id: 'DeepSeek',
    name: 'DeepSeek-R1',
    description: 'State-of-the-art open-weights reasoning model. Incredible logic, math, and coding precision for complex problem solving.',
    url: 'https://chat.deepseek.com',
    icon: Monitor,
    color: 'text-blue-400',
    category: 'General Intelligence'
  },
  {
    id: 'Gemini',
    name: 'Google Gemini',
    description: 'Powerful multimodal reasoning with the best web-search integration in a free tier.',
    url: 'https://gemini.google.com',
    icon: Sparkles,
    color: 'text-blue-500',
    category: 'General Intelligence'
  },

  // --- Image Generation (High-Fidelity Free/OSS) ---
  {
    id: 'AdobeFirefly',
    name: 'Adobe Firefly',
    description: 'Professional-grade, ethically trained AI. Best for high-fidelity textures and lighting in a free tier.',
    url: 'https://firefly.adobe.com',
    icon: PenTool,
    color: 'text-red-500',
    category: 'Image Generation'
  },
  {
    id: 'Flux',
    name: 'Flux.1 [schnell]',
    description: 'The current king of open-source image models. Exceptional at rendering text and photorealistic details.',
    url: 'https://huggingface.co/spaces/black-forest-labs/FLUX.1-schnell',
    icon: ImageIcon,
    color: 'text-orange-500',
    category: 'Image Generation'
  },
  {
    id: 'Leonardo',
    name: 'Leonardo.ai',
    description: 'Advanced production-quality image generation with specialized models for character and architectural precision.',
    url: 'https://leonardo.ai',
    icon: Layers,
    color: 'text-purple-400',
    category: 'Image Generation'
  },


  {
    id: 'Perplexity',
    name: 'Perplexity AI',
    description: 'The gold standard for AI research. Provides real-time citations with high precision and accuracy.',
    url: 'https://www.perplexity.ai',
    icon: Search,
    color: 'text-cyan-500',
    category: 'Real-time Research'
  },
  {
    id: 'Mistral',
    name: 'Mistral Le Chat',
    description: 'Efficient, logical, and highly accurate reasoning from the premier European AI laboratory.',
    url: 'https://chat.mistral.ai',
    icon: Zap,
    color: 'text-orange-400',
    category: 'Reasoning & Analysis'
  },

  // --- Engineering & Performance ---
  {
    id: 'Codeium',
    name: 'Codeium',
    description: 'The most capable free alternative to GitHub Copilot. Precision autocomplete and system-level refactoring.',
    url: 'https://codeium.com',
    icon: Code,
    color: 'text-emerald-500',
    category: 'Developer Tools'
  },
  {
    id: 'Groq',
    name: 'Groq Cloud',
    description: 'Near-instant inference for Llama models. Perfect for rapid-fire technical brainstorming and debugging.',
    url: 'https://groq.com',
    icon: Cpu,
    color: 'text-orange-600',
    category: 'Developer Tools'
  }
];

export function getAIById(idOrName: string) {
  if (!idOrName) return SUPPORTED_AIS[0];
  const searchStr = idOrName.toLowerCase();
  return SUPPORTED_AIS.find(ai => 
    ai.id.toLowerCase() === searchStr || 
    ai.name.toLowerCase() === searchStr
  ) || SUPPORTED_AIS[0];
}
