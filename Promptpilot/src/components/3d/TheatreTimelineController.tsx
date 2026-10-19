"use client";

import React, { useEffect, useRef, useState } from "react";
import { getProject, types } from "@theatre/core";
import gsap from "gsap";
import confetti from "canvas-confetti";
import { Zap, Play, RotateCcw, Sparkles, Activity } from "lucide-react";

export interface TheatreTimelineProps {
  className?: string;
  onSequenceTrigger?: (sequenceName: string) => void;
}

export function TheatreTimelineController({ className = "", onSequenceTrigger }: TheatreTimelineProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePreset, setActivePreset] = useState<string>("hyperdrive");
  const [progress, setProgress] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const meterRef = useRef<HTMLDivElement>(null);

  // Initialize Theatre.js Project & Sheet
  const theatreSheetRef = useRef<any>(null);

  useEffect(() => {
    try {
      const project = getProject("SparkCinematicStudio");
      const sheet = project.sheet("MainSequence");
      theatreSheetRef.current = sheet;

      const theatreObj = sheet.object("QuantumOrb", {
        scale: types.number(1, { range: [0.5, 3] }),
        glow: types.number(0.5, { range: [0, 1] }),
        rotation: types.number(0, { range: [0, 360] }),
      });

      theatreObj.onValuesChange((values: { scale: number; glow: number; rotation: number }) => {
        if (orbRef.current) {
          orbRef.current.style.transform = `scale(${values.scale}) rotate(${values.rotation}deg)`;
          orbRef.current.style.boxShadow = `0 0 ${values.glow * 50}px rgba(0, 242, 255, ${values.glow})`;
        }
      });
    } catch (e) {
      console.warn("Theatre.js initialization in client:", e);
    }
  }, []);

  const triggerCinematicSequence = (type: "hyperdrive" | "overclock" | "pulse") => {
    setActivePreset(type);
    setIsPlaying(true);
    setProgress(0);

    if (onSequenceTrigger) onSequenceTrigger(type);

    const tl = gsap.timeline({
      onUpdate: () => {
        setProgress(Math.round(tl.progress() * 100));
      },
      onComplete: () => {
        setIsPlaying(false);
        // Particle burst on completion
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.8 },
          colors: ["#00f2ff", "#3b82f6", "#a855f7", "#ec4899"],
        });
      },
    });

    if (type === "hyperdrive") {
      tl.to(orbRef.current, { scale: 1.8, rotation: 360, duration: 0.8, ease: "power2.inOut" })
        .to(beamRef.current, { width: "100%", opacity: 1, duration: 0.4, ease: "power4.out" }, "-=0.2")
        .to(orbRef.current, { scale: 1, rotation: 720, duration: 0.6, ease: "elastic.out(1, 0.3)" })
        .to(beamRef.current, { opacity: 0, duration: 0.3 });
    } else if (type === "overclock") {
      tl.to(orbRef.current, { scale: 1.4, duration: 0.2, repeat: 5, yoyo: true })
        .to(meterRef.current, { width: "100%", duration: 0.6, ease: "power1.in" })
        .to(orbRef.current, { scale: 1, duration: 0.4 })
        .to(meterRef.current, { width: "45%", duration: 0.4 });
    } else {
      tl.to(orbRef.current, { scale: 2.2, opacity: 0.3, duration: 0.5, yoyo: true, repeat: 2 })
        .to(orbRef.current, { scale: 1, opacity: 1, duration: 0.4 });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-3xl p-6 glass-panel border border-white/10 overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20 text-accent border border-primary/30">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white tracking-wide uppercase">
              Theatre.js + GSAP Motion Engine
            </h4>
            <span className="text-[11px] text-muted-foreground font-mono">
              Timeline Orchestration & Cinematic Sequences
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerCinematicSequence("hyperdrive")}
            disabled={isPlaying}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activePreset === "hyperdrive"
                ? "bg-accent text-accent-foreground shadow-[0_0_15px_rgba(0,242,255,0.4)]"
                : "bg-white/5 text-muted-foreground hover:text-white"
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            Hyperdrive
          </button>
          <button
            onClick={() => triggerCinematicSequence("overclock")}
            disabled={isPlaying}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activePreset === "overclock"
                ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                : "bg-white/5 text-muted-foreground hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Overclock
          </button>
          <button
            onClick={() => triggerCinematicSequence("pulse")}
            disabled={isPlaying}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activePreset === "pulse"
                ? "bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                : "bg-white/5 text-muted-foreground hover:text-white"
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Sync
          </button>
        </div>
      </div>

      {/* Visual Animation Stage */}
      <div className="relative h-28 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden">
        {/* Animated Laser Beam */}
        <div
          ref={beamRef}
          className="absolute h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent w-0 opacity-0 pointer-events-none shadow-[0_0_20px_#00f2ff]"
        />

        {/* Dynamic Holographic Reactor Orb */}
        <div
          ref={orbRef}
          className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary via-accent to-purple-400 shadow-[0_0_30px_rgba(0,242,255,0.5)] border border-white/30 flex items-center justify-center cursor-pointer transition-shadow"
          onClick={() => triggerCinematicSequence(activePreset as any)}
        >
          <div className="w-6 h-6 rounded-full bg-white/90 shadow-[0_0_15px_#ffffff]" />
        </div>
      </div>

      {/* Timeline Scrubber & Progress */}
      <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
        <div className="flex items-center gap-2">
          <Play className={`h-3 w-3 ${isPlaying ? "text-accent animate-spin" : "text-white/40"}`} />
          <span>Timeline Status: {isPlaying ? "Running..." : "Idle / Armed"}</span>
        </div>
        <div className="w-36 h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            ref={meterRef}
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span>{progress}%</span>
      </div>
    </div>
  );
}
