"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface Framer3DCardProps {
  children: React.ReactNode;
  className?: string;
  glintColor?: string;
  depth?: number;
  onClick?: () => void;
}

export function Framer3DCard({
  children,
  className = "",
  glintColor = "rgba(0, 242, 255, 0.15)",
  depth = 20,
  onClick,
}: Framer3DCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [`${depth}deg`, `-${depth}deg`]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [`-${depth}deg`, `${depth}deg`]);

  const glintX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glintY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "relative rounded-3xl p-6 glass-panel border border-white/10 overflow-hidden transition-shadow duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.6)] cursor-pointer group",
        className
      )}
    >
      {/* 3D Holographic Glint Light */}
      <motion.div
        style={{
          left: glintX,
          top: glintY,
          background: `radial-gradient(circle at center, ${glintColor} 0%, transparent 70%)`,
        }}
        className="pointer-events-none absolute -inset-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
      />

      {/* Content wrapper with Z-translation */}
      <div style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}>
        {children}
      </div>
    </motion.div>
  );
}
