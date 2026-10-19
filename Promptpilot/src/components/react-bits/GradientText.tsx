"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number;
  showBorder?: boolean;
}

export function GradientText({
  children,
  className,
  colors = ["#00f2ff", "#a855f7", "#ec4899", "#3b82f6", "#00f2ff"],
  animationSpeed = 8,
  showBorder = false,
}: GradientTextProps) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${colors.join(", ")})`,
    backgroundSize: "300% 100%",
    animationDuration: `${animationSpeed}s`,
  };

  return (
    <span
      className={cn(
        "relative inline-block bg-clip-text text-transparent animate-gradient font-black",
        showBorder && "border border-white/10 rounded-full px-3 py-1",
        className
      )}
      style={gradientStyle}
    >
      {children}
    </span>
  );
}
