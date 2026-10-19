"use client";

import React, { useEffect, useRef, useState } from "react";

export function GlobalCursorGlow() {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const targetPos = useRef({ x: -1000, y: -1000 });
  const currentPos = useRef({ x: -1000, y: -1000 });
  const glowRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    let animationFrameId: number;

    const render = () => {
      // Smooth liquid interpolation
      const dx = targetPos.current.x - currentPos.current.x;
      const dy = targetPos.current.y - currentPos.current.y;

      currentPos.current.x += dx * 0.18;
      currentPos.current.y += dy * 0.18;

      const x = currentPos.current.x;
      const y = currentPos.current.y;

      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${x - 350}px, ${y - 350}px, 0)`;
      }
      if (coreRef.current) {
        coreRef.current.style.transform = `translate3d(${x - 150}px, ${y - 150}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden select-none transition-opacity duration-500 ease-out"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      {/* Volumetric Ambient Cyan/Sapphire Outer Glow */}
      <div
        ref={glowRef}
        className="pointer-events-none fixed top-0 left-0 rounded-full blur-[110px] will-change-transform"
        style={{
          width: "700px",
          height: "700px",
          background:
            "radial-gradient(circle, rgba(0, 242, 255, 0.16) 0%, rgba(59, 130, 246, 0.11) 38%, rgba(147, 51, 234, 0.05) 65%, transparent 75%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Radiant Focus Core Glow */}
      <div
        ref={coreRef}
        className="pointer-events-none fixed top-0 left-0 rounded-full blur-[45px] will-change-transform"
        style={{
          width: "300px",
          height: "300px",
          background:
            "radial-gradient(circle, rgba(0, 242, 255, 0.22) 0%, rgba(0, 160, 255, 0.10) 45%, transparent 75%)",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
