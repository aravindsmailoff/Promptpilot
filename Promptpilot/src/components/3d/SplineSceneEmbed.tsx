"use client";

import React, { useEffect, useRef, useState } from "react";
import { Application } from "@splinetool/runtime";
import { Loader2, RefreshCw } from "lucide-react";

export interface SplineSceneProps {
  className?: string;
  height?: string;
  sceneUrl?: string;
}

export function SplineSceneEmbed({
  className = "",
  height = "360px",
  sceneUrl = "https://prod.spline.design/6W-t8MYQ7Oi0-z8r/scene.splinecode", // Default interactive 3D robot/cyber orb
}: SplineSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const splineAppRef = useRef<Application | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isMounted = true;
    const spline = new Application(canvas);
    splineAppRef.current = spline;

    setLoading(true);
    setError(false);

    spline
      .load(sceneUrl)
      .then(() => {
        if (isMounted) {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Spline load failed (network or asset):", err);
        if (isMounted) {
          setLoading(false);
          setError(true);
        }
      });

    return () => {
      isMounted = false;
      try {
        spline.dispose();
      } catch (e) {
        // ignore cleanup error
      }
    };
  }, [sceneUrl]);

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden glass-panel border border-white/10 ${className}`}>
      {/* Header Overlay */}
      <div className="absolute top-4 left-5 right-5 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-pulse shadow-[0_0_8px_#ec4899]" />
          <span className="text-xs font-black tracking-widest text-white uppercase bg-black/40 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-md">
            Spline • Visual 3D Interactive Scene
          </span>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="text-[10px] text-muted-foreground bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
            Hosted Spline Runtime
          </span>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm gap-2">
          <Loader2 className="h-7 w-7 text-primary animate-spin" />
          <span className="text-xs font-semibold text-muted-foreground">Streaming 3D Spline Asset...</span>
        </div>
      )}

      {/* Fallback state if offline or network blocked */}
      {error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center mb-3">
            <RefreshCw className="h-6 w-6 text-pink-400" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Spline 3D Scene Offline Mode</h4>
          <p className="text-xs text-muted-foreground max-w-sm mb-4">
            Spline visual cloud assets require active internet connectivity. You can plug in any custom Spline .splinecode export URL.
          </p>
          <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-cyan-300">
            Integrated via @splinetool/runtime
          </div>
        </div>
      )}

      {/* Canvas */}
      <div style={{ height }} className="w-full">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 backdrop-blur-md text-[11px] text-muted-foreground pointer-events-none">
        <span className="font-mono text-pink-300">Spline WebGL Engine</span>
        <span className="text-xs text-white/50">Direct cursor physics enabled</span>
      </div>
    </div>
  );
}
