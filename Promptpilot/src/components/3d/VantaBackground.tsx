"use client";

import React, { useEffect, useState } from "react";
import { Activity, ShieldCheck, Zap } from "lucide-react";

interface VantaBackgroundProps {
  opacity?: number;
  interactive?: boolean;
}

export function VantaBackground({ opacity = 1 }: VantaBackgroundProps) {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [mounted, setMounted] = useState(false);
  const [latency, setLatency] = useState(28);

  useEffect(() => {
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Subtle realistic latency fluctuation for useful telemetry
    const interval = setInterval(() => {
      setLatency(Math.floor(24 + Math.random() * 12));
    }, 3500);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. Deep Sleek Dark Base with Multi-Stop Gradient Meshes */}
      <div className="absolute inset-0 bg-[#030712]" />
      
      {/* Top Aurora Gradient Spotlight */}
      <div 
        className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[1200px] h-[600px] rounded-full blur-[140px] opacity-40 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(0, 242, 255, 0.25) 0%, rgba(99, 102, 241, 0.18) 40%, rgba(168, 85, 247, 0.12) 65%, transparent 80%)"
        }}
      />

      {/* Bottom Aurora Gradient Glow */}
      <div 
        className="absolute -bottom-[200px] right-0 w-[800px] h-[500px] rounded-full blur-[150px] opacity-25 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(168, 85, 247, 0.3) 0%, rgba(59, 130, 246, 0.15) 50%, transparent 75%)"
        }}
      />

      {/* 2. Precision Architectural Micro-Grid with Linear Mask */}
      <div 
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 90% 80% at 50% 30%, black 40%, transparent 95%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 80% at 50% 30%, black 40%, transparent 95%)",
        }}
      />

      {/* 3. Interactive Cursor Spotlight (Deep canvas illumination) */}
      {mounted && (
        <div
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(850px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0, 242, 255, 0.14), rgba(59, 130, 246, 0.08), rgba(147, 51, 234, 0.04), transparent 70%)`,
          }}
        />
      )}

      {/* 4. Useful Sleek Telemetry HUD (Bottom-Right Minimalist Utility Badge) */}
      <div className="hidden lg:flex fixed bottom-5 right-6 pointer-events-auto items-center gap-3 px-3.5 py-1.5 rounded-full bg-[#0a0f1d]/85 border border-white/10 backdrop-blur-xl shadow-2xl text-[10px] font-mono z-50 transition-all hover:border-cyan-500/40">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-bold">FLEET ONLINE</span>
        </div>
        <span className="text-white/20">|</span>
        <div className="flex items-center gap-1 text-cyan-300">
          <Zap className="h-3 w-3" />
          <span>{latency}ms</span>
        </div>
        <span className="text-white/20">|</span>
        <div className="flex items-center gap-1 text-white/50">
          <ShieldCheck className="h-3 w-3 text-indigo-400" />
          <span>ENCRYPTED</span>
        </div>
      </div>
    </div>
  );
}
