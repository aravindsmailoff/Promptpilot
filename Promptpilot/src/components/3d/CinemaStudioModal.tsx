"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Layers,
  Sparkles,
  Zap,
  Globe,
  Sliders,
  Box,
  Eye,
  Film,
} from "lucide-react";
import { ShimmerButton } from "@/components/magic-ui/ShimmerButton";
import { DecryptedText } from "@/components/react-bits/DecryptedText";

import { QuantumCoreCanvas } from "./QuantumCoreCanvas";
import { OglShaderCanvas } from "./OglShaderCanvas";
import { BabylonCyberLab } from "./BabylonCyberLab";
import { SplineSceneEmbed } from "./SplineSceneEmbed";
import { TheatreTimelineController } from "./TheatreTimelineController";

export function CinemaStudioModal() {
  const [activeEngine, setActiveEngine] = useState<
    "r3f" | "ogl" | "babylon" | "spline" | "theatre"
  >("r3f");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/20 via-accent/20 to-purple-500/20 hover:from-primary/30 hover:to-accent/30 border border-accent/30 backdrop-blur-md text-xs font-bold text-white transition-all shadow-[0_0_15px_rgba(0,242,255,0.25)] hover:shadow-[0_0_25px_rgba(0,242,255,0.4)] group">
          <Box className="h-3.5 w-3.5 text-accent animate-pulse group-hover:rotate-45 transition-transform" />
          <span>3D Studio</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-accent/20 text-cyan-300">
            5 Engines
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto bg-[#070b16]/95 border-white/10 backdrop-blur-2xl p-6 text-white rounded-3xl">
        <DialogHeader className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                <DecryptedText
                  text="3D & WebGL Engine Control Center"
                  animateOn="view"
                  className="text-white"
                />
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Explore real-time rendering pipelines powered by Three.js, React Three Fiber, OGL, Babylon.js, Spline, and Theatre.js
              </p>
            </div>

            {/* Engine Selector Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10">
              {[
                { id: "r3f", label: "React Three Fiber", icon: Globe },
                { id: "ogl", label: "OGL Shaders", icon: Zap },
                { id: "babylon", label: "Babylon.js", icon: Box },
                { id: "spline", label: "Spline 3D", icon: Eye },
                { id: "theatre", label: "Theatre.js Motion", icon: Film },
              ].map((engine) => (
                <button
                  key={engine.id}
                  onClick={() => setActiveEngine(engine.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeEngine === engine.id
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  }`}
                >
                  <engine.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{engine.label}</span>
                </button>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Viewport Container */}
        <div className="space-y-4">
          {activeEngine === "r3f" && (
            <div className="space-y-4">
              <QuantumCoreCanvas height="420px" showControls={true} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Architecture</div>
                  <div className="text-sm font-bold text-cyan-300 mt-1">React Three Fiber + Drei</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Declarative 3D scene graph with MeshDistortMaterial, Float physics, and multi-light additive blending.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Performance</div>
                  <div className="text-sm font-bold text-accent mt-1">60 FPS Hardware Glare</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Procedural stardust point cloud and orbital quantum toruses running off GPU buffers.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Interactivity</div>
                  <div className="text-sm font-bold text-white mt-1">Orbit Controls & Inertia</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Freeform 360° mouse drag, speed overclocks, and live shader distortion tweaking.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeEngine === "ogl" && (
            <div className="space-y-4">
              <OglShaderCanvas height="420px" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Engine</div>
                  <div className="text-sm font-bold text-cyan-300 mt-1">OGL Minimal WebGL</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sub-10kb lightweight WebGL abstraction driving custom fragment raymarching and noise uniforms.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Shader Logic</div>
                  <div className="text-sm font-bold text-emerald-300 mt-1">Simplex 2D Plasma Warp</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Multi-octave noise turbulence responding in real-time to mouse coordinates and delta time.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Color Schemes</div>
                  <div className="text-sm font-bold text-fuchsia-300 mt-1">Live Multi-Spectrum</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Instant color grading switcher between Aurora, Neon Pulse, and Matrix Flux.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeEngine === "babylon" && (
            <div className="space-y-4">
              <BabylonCyberLab height="420px" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Engine Engine</div>
                  <div className="text-sm font-bold text-violet-300 mt-1">Babylon.js v9 Core</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Industrial-grade 3D engine with complete PBR materials, hemispheric lighting, and arc-rotate camera.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Geometry</div>
                  <div className="text-sm font-bold text-accent mt-1">High-Poly Cyber Knot</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Over 6,000 vertices rendered dynamically with live wireframe & specular power controls.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Rendering</div>
                  <div className="text-sm font-bold text-white mt-1">Hardware Accelerated</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dedicated render loop with real-time FPS telemetry and camera distance clamps.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeEngine === "spline" && (
            <div className="space-y-4">
              <SplineSceneEmbed height="420px" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Platform</div>
                  <div className="text-sm font-bold text-pink-300 mt-1">Spline 3D Runtime</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Direct integration with Spline visual design tool scenes with physics, materials, and camera states.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Workflow</div>
                  <div className="text-sm font-bold text-cyan-300 mt-1">Zero-Code 3D Assets</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Design complex 3D scenes visually in Spline web editor, export .splinecode, and stream to React.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Licensing</div>
                  <div className="text-sm font-bold text-amber-300 mt-1">Hosted Service</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Spline runtime is open-source; the visual editor and asset hosting is a cloud service.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeEngine === "theatre" && (
            <div className="space-y-4">
              <TheatreTimelineController />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Motion Stack</div>
                  <div className="text-sm font-bold text-accent mt-1">Theatre.js + GSAP Core</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Animation timeline with programmatic sheets, keyframed object values, and GSAP tweens.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Sequences</div>
                  <div className="text-sm font-bold text-purple-300 mt-1">Hyperdrive & Overclock</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Trigger complex multi-stage choreographies with confetti particle bursts and laser beams.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Smooth Scroll</div>
                  <div className="text-sm font-bold text-cyan-300 mt-1">Lenis Synchronization</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tied into Lenis smooth inertial scrolling for silky motion at 120Hz display refresh rates.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
