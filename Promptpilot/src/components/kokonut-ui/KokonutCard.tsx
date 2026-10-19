"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface KokonutCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: "cyan" | "emerald" | "rose" | "purple" | "amber" | "blue";
  hoverLift?: boolean;
  beamSpeed?: number;
  beamActive?: boolean;
}

const ACCENTS = {
  cyan: {
    border: "border-cyan-500/30 hover:border-cyan-400/50",
    glow: "shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(100,210,255,0.12)]",
    ambient: "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(10,132,255,0.15), transparent 75%)",
    specular: "via-cyan-300/30",
  },
  emerald: {
    border: "border-emerald-500/30 hover:border-emerald-400/50",
    glow: "shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_35px_rgba(48,209,88,0.15)]",
    ambient: "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(48,209,88,0.16), transparent 75%)",
    specular: "via-emerald-300/30",
  },
  rose: {
    border: "border-rose-500/30 hover:border-rose-400/50",
    glow: "shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_35px_rgba(255,69,58,0.15)]",
    ambient: "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(255,69,58,0.16), transparent 75%)",
    specular: "via-rose-300/30",
  },
  purple: {
    border: "border-purple-500/30 hover:border-purple-400/50",
    glow: "shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(191,90,242,0.12)]",
    ambient: "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(191,90,242,0.15), transparent 75%)",
    specular: "via-purple-300/30",
  },
  amber: {
    border: "border-amber-500/30 hover:border-amber-400/50",
    glow: "shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(255,214,10,0.12)]",
    ambient: "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(255,214,10,0.15), transparent 75%)",
    specular: "via-amber-300/30",
  },
  blue: {
    border: "border-blue-500/30 hover:border-blue-400/50",
    glow: "shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(10,132,255,0.12)]",
    ambient: "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(10,132,255,0.15), transparent 75%)",
    specular: "via-blue-300/30",
  },
};

export function KokonutCard({
  children,
  className,
  glowColor = "cyan",
  hoverLift = true,
  beamSpeed,
  beamActive,
  ...props
}: KokonutCardProps) {
  const accent = ACCENTS[glowColor] || ACCENTS.cyan;

  return (
    <div
      className={cn(
        "relative rounded-[28px] bg-gradient-to-b from-[#181a20]/95 via-[#101217]/98 to-[#0a0b0e]/98 backdrop-blur-2xl border transition-all duration-500 overflow-hidden",
        accent.border,
        accent.glow,
        hoverLift && "hover:-translate-y-1 hover:shadow-2xl",
        className
      )}
      {...props}
    >
      {/* Apple Specular Top Lip Highlight */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent to-transparent pointer-events-none z-20",
          accent.specular
        )}
      />

      {/* Luminous Ambient Glow Dome */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-80"
        style={{
          background: accent.ambient,
        }}
      />

      {/* Card Content Container */}
      <div className="relative z-10 p-6 md:p-8 text-white font-sans">
        {children}
      </div>
    </div>
  );
}
