"use client";

import React, { useEffect, useRef, useState } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";

export interface OglShaderProps {
  className?: string;
  height?: string;
}

export function OglShaderCanvas({ className = "", height = "360px" }: OglShaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fps, setFps] = useState(60);
  const [colorScheme, setColorScheme] = useState<"cyan" | "magenta" | "emerald">("cyan");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initialize OGL Renderer
    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 2),
      alpha: true,
      antialias: true,
    });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";

    // Full screen triangle geometry
    const geometry = new Triangle(gl);

    const vertexShader = `
      attribute vec2 position;
      attribute vec2 uv;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying vec2 vUv;

      // Simplex noise approximation
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m;
        m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.y, uResolution.x);
        vec2 mouse = (uMouse - 0.5 * uResolution.xy) / min(uResolution.y, uResolution.x);

        float dist = length(uv - mouse);
        float mouseInteraction = smoothstep(0.6, 0.0, dist) * 0.4;

        float t = uTime * 0.35;
        float n1 = snoise(uv * 2.5 + vec2(t * 0.5, t * 0.3));
        float n2 = snoise(uv * 4.0 - vec2(t * 0.4, n1 * 0.8) + mouseInteraction);
        float n3 = snoise(uv * 7.0 + vec2(n2 * 0.6, t * 0.2));

        float pattern = smoothstep(-0.2, 0.8, n1 * 0.5 + n2 * 0.3 + n3 * 0.2);

        // Cyber Grid Lines
        vec2 grid = abs(fract(uv * 12.0 - 0.5) - 0.5) / fwidth(uv * 12.0);
        float line = min(grid.x, grid.y);
        float gridPattern = 1.0 - min(line, 1.0);

        vec3 col = mix(uColorA, uColorB, pattern + mouseInteraction);
        col += vec3(0.0, 0.95, 1.0) * gridPattern * 0.12;

        // Vignette
        float vignette = smoothstep(1.2, 0.2, length(uv));
        col *= vignette;

        gl_FragColor = vec4(col, 0.92);
      }
    `;

    const colorPalettes = {
      cyan: {
        a: [0.03, 0.15, 0.35],
        b: [0.0, 0.95, 1.0],
      },
      magenta: {
        a: [0.18, 0.04, 0.28],
        b: [0.95, 0.2, 0.8],
      },
      emerald: {
        a: [0.02, 0.2, 0.15],
        b: [0.1, 0.95, 0.6],
      },
    };

    const currentColors = colorPalettes[colorScheme];

    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [gl.canvas.width, gl.canvas.height] },
        uMouse: { value: [gl.canvas.width / 2, gl.canvas.height / 2] },
        uColorA: { value: currentColors.a },
        uColorB: { value: currentColors.b },
      },
      transparent: true,
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
    }

    window.addEventListener("resize", resize);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = gl.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (gl.canvas.width / rect.width);
      const y = (rect.height - (e.clientY - rect.top)) * (gl.canvas.height / rect.height);
      program.uniforms.uMouse.value = [x, y];
    };

    container.addEventListener("mousemove", handleMouseMove);

    let animationId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = performance.now();

    function update(time: number) {
      animationId = requestAnimationFrame(update);
      program.uniforms.uTime.value = time * 0.001;

      // Update colors live
      const pal = colorPalettes[colorScheme];
      program.uniforms.uColorA.value = pal.a;
      program.uniforms.uColorB.value = pal.b;

      renderer.render({ scene: mesh });

      frameCount++;
      if (performance.now() - fpsTimer >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        fpsTimer = performance.now();
      }
    }

    animationId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      container.removeEventListener("mousemove", handleMouseMove);
      if (gl.canvas && gl.canvas.parentElement) {
        gl.canvas.parentElement.removeChild(gl.canvas);
      }
    };
  }, [colorScheme]);

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden glass-panel border border-white/10 ${className}`}>
      {/* Overlay Header */}
      <div className="absolute top-4 left-5 right-5 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f2ff]" />
          <span className="text-xs font-black tracking-widest text-white uppercase bg-black/40 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-md">
            OGL • Raw WebGL Shader Plasma
          </span>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setColorScheme("cyan")}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
              colorScheme === "cyan"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                : "bg-white/5 text-muted-foreground hover:text-white"
            }`}
          >
            Aurora
          </button>
          <button
            onClick={() => setColorScheme("magenta")}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
              colorScheme === "magenta"
                ? "bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/50"
                : "bg-white/5 text-muted-foreground hover:text-white"
            }`}
          >
            Neon Pulse
          </button>
          <button
            onClick={() => setColorScheme("emerald")}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
              colorScheme === "emerald"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                : "bg-white/5 text-muted-foreground hover:text-white"
            }`}
          >
            Matrix Flux
          </button>
        </div>
      </div>

      {/* Canvas Mount */}
      <div ref={containerRef} style={{ height }} className="w-full cursor-crosshair" />

      {/* Bottom Telemetry Bar */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 backdrop-blur-md text-[11px] text-muted-foreground pointer-events-none">
        <span className="font-mono text-cyan-300">GPU Accelerated OGL Shader</span>
        <div className="flex items-center gap-3 font-mono">
          <span>FPS: <strong className="text-white">{fps}</strong></span>
          <span className="text-white/20">•</span>
          <span>Interactivity: <strong className="text-accent">Mouse Fluid Warp</strong></span>
        </div>
      </div>
    </div>
  );
}
