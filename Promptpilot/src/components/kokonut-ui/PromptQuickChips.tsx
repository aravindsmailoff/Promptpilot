"use client";

import React from "react";
import { Sparkles, Terminal, Palette, Brain, Smartphone, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuickPrompt {
  id: string;
  icon: React.ElementType;
  label: string;
  prompt: string;
  category: string;
  color: string;
}

export const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: "arch",
    icon: Terminal,
    label: "Cloud Architecture",
    prompt: "Design a fault-tolerant cloud microservices architecture with real-time WebSocket pub/sub, distributed Redis cache, and automated blue-green deployments on Kubernetes.",
    category: "Coding",
    color: "from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:border-cyan-400",
  },
  {
    id: "visual",
    icon: Palette,
    label: "Hyper-Real Render",
    prompt: "Create an ultra-high resolution 8K cinematic render of a cyberpunk Tokyo street corner in heavy rain, with neon reflections, ray-traced glass puddles, and anamorphic lens flares.",
    category: "Visual",
    color: "from-pink-500/20 to-purple-500/20 text-pink-300 border-pink-500/30 hover:border-pink-400",
  },
  {
    id: "math",
    icon: Brain,
    label: "Deep Reasoning",
    prompt: "Analyze and solve this multi-variable dynamic programming optimization problem step-by-step, including time/space complexity analysis and edge case formal proofs.",
    category: "Logic",
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30 hover:border-emerald-400",
  },
  {
    id: "mobile",
    icon: Smartphone,
    label: "Fullstack Mobile",
    prompt: "Architect an offline-first iOS and Android app featuring local SQLite sync, biometric authentication, push notifications, and buttery-smooth 120fps gesture transitions.",
    category: "Mobile",
    color: "from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30 hover:border-amber-400",
  },
  {
    id: "startup",
    icon: Rocket,
    label: "Unicorn Pitch",
    prompt: "Draft an irresistible 10-slide Seed-stage pitch deck narrative for an autonomous AI developer orchestration platform, detailing unit economics, TAM, and defensible moats.",
    category: "Strategy",
    color: "from-violet-500/20 to-indigo-500/20 text-violet-300 border-violet-500/30 hover:border-violet-400",
  },
];

interface PromptQuickChipsProps {
  onSelectPrompt: (promptText: string) => void;
  className?: string;
}

export function PromptQuickChips({ onSelectPrompt, className = "" }: PromptQuickChipsProps) {
  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-accent" />
          SPARK • Quick Intelligence Vectors
        </span>
        <span className="text-[10px] text-white/30 hidden sm:inline">Click to pre-load mission</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {QUICK_PROMPTS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectPrompt(item.prompt)}
            className={cn(
              "group flex items-center gap-2 px-3.5 py-1.5 rounded-full border bg-gradient-to-r text-xs font-semibold whitespace-nowrap transition-all duration-300 backdrop-blur-md",
              "hover:scale-[1.03] active:scale-95 shadow-sm hover:shadow-[0_0_15px_rgba(0,242,255,0.2)]",
              item.color
            )}
          >
            <item.icon className="h-3.5 w-3.5 group-hover:rotate-12 transition-transform" />
            <span>{item.label}</span>
            <span className="text-[9px] opacity-60 font-mono px-1.5 py-0.2 rounded-full bg-black/40 border border-white/5">
              {item.category}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
