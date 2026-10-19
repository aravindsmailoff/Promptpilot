"use client";

import React from "react";
import { Cpu, Activity, Flame, ShieldCheck, Zap } from "lucide-react";
import { Framer3DCard } from "@/components/framer-3d/Framer3DCard";

export function BentoFleetGrid({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full space-y-4 ${className}`}>
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f2ff]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground font-mono">
            SPARK • Global Telemetry & Fleet Performance
          </span>
        </div>
        <span className="text-[10px] font-mono text-cyan-400">Live Benchmarks</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Orchestration Architecture */}
        <Framer3DCard
          depth={15}
          glintColor="rgba(59, 130, 246, 0.25)"
          className="bg-gradient-to-br from-blue-950/40 via-black/70 to-[#050914] border-blue-500/25 p-6 rounded-3xl"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400 font-bold">
                Architecture
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                Multi-Agent Router Engine
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Seamless load balancing between local GPU Ollama inference and external intelligence nodes.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-primary/20 text-accent border border-primary/30 shadow-lg shrink-0">
              <Cpu className="h-6 w-6 text-cyan-400" />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-white/5 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-bold text-white">99.98% Uptime</span>
            </div>
            <span className="text-white/20">•</span>
            <span className="font-mono text-cyan-300">Prompt Zero-Loss</span>
          </div>
        </Framer3DCard>

        {/* Card 2: Latency Benchmark */}
        <Framer3DCard
          depth={18}
          glintColor="rgba(0, 242, 255, 0.25)"
          className="bg-gradient-to-br from-cyan-950/30 via-black/70 to-[#040812] border-cyan-500/25 p-6 rounded-3xl"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
              Dispatch Latency
            </span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <Activity className="h-5 w-5 text-cyan-400" />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-4xl font-black text-white tracking-tight flex items-baseline gap-1">
              <span>38</span>
              <span className="text-sm font-normal text-cyan-400 font-mono">ms</span>
            </div>
            <div className="text-xs text-emerald-400 font-medium mt-1">
              ↓ 14% faster than cloud API
            </div>
          </div>

          <div className="mt-5 text-[11px] text-muted-foreground/80 font-mono pt-3 border-t border-white/5">
            Full GPU hardware offload active
          </div>
        </Framer3DCard>

        {/* Card 3: Token Savings & Efficiency */}
        <Framer3DCard
          depth={18}
          glintColor="rgba(168, 85, 247, 0.25)"
          className="bg-gradient-to-br from-purple-950/30 via-black/70 to-[#060414] border-purple-500/25 p-6 rounded-3xl"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold">
              Token Efficiency
            </span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Flame className="h-5 w-5 text-purple-400" />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-4xl font-black text-white tracking-tight flex items-baseline gap-1">
              <span>64.2</span>
              <span className="text-sm font-normal text-purple-400 font-mono">%</span>
            </div>
            <div className="text-xs text-purple-300 font-medium mt-1">
              Context compression ratio
            </div>
          </div>

          <div className="mt-5 text-[11px] text-muted-foreground/80 font-mono pt-3 border-t border-white/5">
            Zero hallucination guardrails active
          </div>
        </Framer3DCard>
      </div>
    </div>
  );
}
