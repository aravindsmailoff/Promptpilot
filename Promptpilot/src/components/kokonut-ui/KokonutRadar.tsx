"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface KokonutRadarProps {
  className?: string;
  size?: number;
  label?: string;
  sublabel?: string;
  status?: string;
  targetCount?: number;
}

export function KokonutRadar({
  className,
  size = 110,
  label = "Active Crawler Radar",
  sublabel = "120s Live Research Worker",
  status = "ONLINE",
  targetCount = 6,
}: KokonutRadarProps) {
  return (
    <div className={cn("relative flex items-center gap-4 p-3 rounded-2xl bg-black/40 border border-cyan-500/20 backdrop-blur-md", className)}>
      {/* Radar Dish */}
      <div
        className="relative rounded-full border border-cyan-500/40 bg-[#030814] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-[0_0_25px_rgba(0,242,255,0.2)]"
        style={{ width: size, height: size }}
      >
        {/* Concentric Sonar Rings */}
        <div className="absolute inset-2 rounded-full border border-cyan-500/20" />
        <div className="absolute inset-6 rounded-full border border-cyan-500/20" />
        <div className="absolute inset-10 rounded-full border border-cyan-500/20" />

        {/* Crosshairs */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-[1px] bg-cyan-500/15" />
          <div className="absolute h-full w-[1px] bg-cyan-500/15" />
        </div>

        {/* Concentric Pulsing Ripples */}
        <motion.div
          animate={{ scale: [0.3, 1.4], opacity: [0.9, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-full border-2 border-cyan-400 pointer-events-none"
        />
        <motion.div
          animate={{ scale: [0.3, 1.4], opacity: [0.9, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 1.1 }}
          className="absolute inset-0 rounded-full border-2 border-cyan-400 pointer-events-none"
        />

        {/* Rotating Radar Sweep Cone */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 origin-center pointer-events-none"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(0,242,255,0) 0deg, rgba(0,242,255,0) 290deg, rgba(0,242,255,0.15) 330deg, rgba(0,242,255,0.65) 360deg)",
          }}
        />

        {/* Live Detected Target Blips */}
        <motion.div
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }}
          className="absolute top-[28%] left-[62%] w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]"
        />
        <motion.div
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2.1, repeat: Infinity, delay: 0.9 }}
          className="absolute bottom-[32%] right-[58%] w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2ff]"
        />
        <motion.div
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: 1.5 }}
          className="absolute top-[68%] left-[26%] w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]"
        />

        {/* Center Anchor Point */}
        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f2ff] z-10" />
      </div>

      {/* Radar Status Details */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">
            {status}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
            {targetCount} Targets Tracked
          </span>
        </div>
        <h4 className="text-sm font-bold text-white">{label}</h4>
        <p className="text-[11px] text-white/50 leading-tight">{sublabel}</p>
      </div>
    </div>
  );
}
