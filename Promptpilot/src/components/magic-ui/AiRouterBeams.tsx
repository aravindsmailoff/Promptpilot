"use client";

import React, { useRef } from "react";
import { 
  Sparkles, 
  Terminal, 
  Zap, 
  CheckCircle2, 
  Loader2,
  HardDrive,
  Cpu,
  Layers,
  ArrowRight
} from "lucide-react";
import { AnimatedBeam } from "./AnimatedBeam";
import { cn } from "@/lib/utils";

interface AiRouterBeamsProps {
  className?: string;
  isExecuting?: boolean;
  isLoading?: boolean;
  selectedAI?: string | null;
  activeModel?: string;
  taskDescription?: string;
  useOllama?: boolean;
}

export function AiRouterBeams({
  className = "",
  isExecuting = false,
  isLoading = false,
  selectedAI = null,
  activeModel = "qwen3.5:2b",
  taskDescription = "",
  useOllama = true
}: AiRouterBeamsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const routerRef = useRef<HTMLDivElement>(null);
  const activeModelRef = useRef<HTMLDivElement>(null);

  const isRoutingOrExecuting = isLoading || isExecuting;

  // The single active model being used by the user
  const modelDisplayName = useOllama 
    ? (activeModel || "qwen3.5:2b")
    : (selectedAI || activeModel || "SPARK Engine");

  const modelSubLabel = useOllama
    ? "Ollama Local Neural Core (GPU Accelerated)"
    : "Active Neural Core Engine";

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full rounded-3xl p-6 sm:p-10 glass-panel border border-white/10 overflow-hidden shadow-2xl transition-all duration-500",
        isRoutingOrExecuting && "border-cyan-500/50 shadow-[0_0_60px_rgba(0,242,255,0.2)]",
        className
      )}
    >
      {/* Header Badge & Title */}
      <div className="text-center mb-8 relative z-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-300 font-bold">
            SPARK • Autonomous AI Neural Dispatch Fabric
          </span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-white mt-3 tracking-tight flex items-center justify-center gap-2">
          <span>Real-Time Model Execution Fabric</span>
          {isRoutingOrExecuting && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono animate-pulse">
              ACTIVE WORKFLOW
            </span>
          )}
        </h3>
        <p className="text-xs text-muted-foreground max-w-lg mx-auto mt-1.5">
          Dedicated end-to-end neural workflow routing your prompts directly through your configured AI core.
        </p>

        {/* Live Active Model Indicator */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono shadow-inner">
            <HardDrive className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-white/70">Engine In Use:</span>
            <span className="text-cyan-300 font-bold">{modelDisplayName}</span>
            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {useOllama ? "LOCAL GPU CORE" : "ACTIVE"}
            </span>
          </div>
        </div>
      </div>

      {/* Main 3-Stage Linear Workflow: Objective -> SPARK Router -> Active Model */}
      <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 py-8 px-4 sm:px-12 max-w-4xl mx-auto min-h-[220px]">
        {/* Step 1: User Objective */}
        <div 
          ref={inputRef}
          className="flex flex-col items-center gap-3 z-10 w-44 text-center group"
        >
          <div className={cn(
            "w-20 h-20 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col items-center justify-center shadow-lg transition-all duration-300",
            isRoutingOrExecuting 
              ? "border-cyan-400/80 bg-cyan-500/10 shadow-[0_0_30px_rgba(0,242,255,0.35)] scale-105" 
              : "group-hover:border-white/30"
          )}>
            <Terminal className={cn("h-8 w-8 transition-colors", isRoutingOrExecuting ? "text-cyan-300" : "text-white/80")} />
            <span className="text-[9px] font-mono text-cyan-400/80 mt-1 uppercase font-semibold">STAGE 01</span>
          </div>
          <div>
            <div className="text-sm font-bold text-white">Your Objective</div>
            <div className="text-[11px] text-muted-foreground font-mono truncate max-w-[150px] mt-0.5" title={taskDescription || "Raw Prompt Intent"}>
              Raw Prompt Intent
            </div>
          </div>
        </div>

        {/* Step 2: SPARK Neural Dispatcher */}
        <div
          ref={routerRef}
          className="flex flex-col items-center gap-3 z-10 w-44 text-center"
        >
          <div
            className={cn(
              "w-24 h-24 rounded-3xl p-0.5 transition-all duration-500 shadow-2xl relative",
              isRoutingOrExecuting
                ? "bg-gradient-to-tr from-cyan-400 via-primary to-purple-500 shadow-[0_0_50px_rgba(0,242,255,0.6)] scale-110"
                : "bg-gradient-to-tr from-primary via-accent to-purple-500 shadow-[0_0_35px_rgba(0,242,255,0.3)]"
            )}
          >
            <div className="w-full h-full rounded-[22px] bg-[#070b16] flex flex-col items-center justify-center p-2 text-center relative overflow-hidden">
              {isRoutingOrExecuting ? (
                <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
              ) : (
                <Zap className="h-8 w-8 text-cyan-400" />
              )}
              <span className="text-xs font-black text-white tracking-wider mt-1">SPARK</span>
              <span className="text-[9px] text-cyan-400 font-mono tracking-widest uppercase">
                {isRoutingOrExecuting ? "DISPATCHING" : "ROUTER"}
              </span>
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-white">SPARK Dispatch</div>
            <div className="text-[11px] text-muted-foreground font-mono">Neural Pipeline</div>
          </div>
        </div>

        {/* Step 3: The ONLY Active Model Being Used */}
        <div 
          ref={activeModelRef}
          className="flex flex-col items-center gap-3 z-10 w-56 text-center"
        >
          <div
            className={cn(
              "w-full px-5 py-4 rounded-2xl border backdrop-blur-md transition-all duration-300 flex flex-col items-center justify-center relative overflow-hidden",
              isRoutingOrExecuting
                ? "bg-gradient-to-b from-cyan-500/20 to-blue-900/30 border-cyan-400 shadow-[0_0_40px_rgba(0,242,255,0.4)] scale-105"
                : "bg-white/5 border-cyan-500/30 hover:border-cyan-400/50 shadow-lg"
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center mb-2 shadow-inner">
              <Cpu className="h-5 w-5" />
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-white tracking-wide">{modelDisplayName}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                {useOllama ? "LOCAL" : "AI CORE"}
              </span>
            </div>

            <div className="text-[10px] text-cyan-400/90 font-mono mt-1 text-center leading-tight">
              {modelSubLabel}
            </div>

            {/* Status indicator pill */}
            <div className="mt-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span>{isRoutingOrExecuting ? "Processing Task" : "Online & Ready"}</span>
            </div>
          </div>

          <div>
            <div className="text-sm font-bold text-white">Target AI Core</div>
            <div className="text-[11px] text-muted-foreground font-mono">100% Dedicated Execution</div>
          </div>
        </div>
      </div>

      {/* Beam 1: Objective -> SPARK Router */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={inputRef}
        toRef={routerRef}
        curvature={0}
        gradientStartColor="#ffffff"
        gradientStopColor="#00f2ff"
        duration={isRoutingOrExecuting ? 1.4 : 2.5}
        pathOpacity={isRoutingOrExecuting ? 0.6 : 0.25}
        pathWidth={isRoutingOrExecuting ? 3 : 2}
      />

      {/* Beam 2: SPARK Router -> Active Model Core */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={routerRef}
        toRef={activeModelRef}
        curvature={0}
        gradientStartColor="#00f2ff"
        gradientStopColor="#10b981"
        duration={isRoutingOrExecuting ? 1.4 : 2.5}
        pathOpacity={isRoutingOrExecuting ? 0.7 : 0.3}
        pathWidth={isRoutingOrExecuting ? 3 : 2}
        delay={0.2}
      />
    </div>
  );
}
