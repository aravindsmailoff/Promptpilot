"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export interface QuantumCoreProps {
  className?: string;
  initialMode?: "cyber" | "purple" | "gold";
  height?: string;
  showControls?: boolean;
}

export function QuantumCoreCanvas({
  className = "",
  initialMode = "cyber",
  height = "340px",
  showControls = true,
}: QuantumCoreProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mode, setMode] = useState<"cyber" | "purple" | "gold">(initialMode);
  const [speed, setSpeed] = useState(1.2);
  const [distort, setDistort] = useState(0.4);

  const stateRef = useRef({ mode, speed, distort });
  useEffect(() => {
    stateRef.current = { mode, speed, distort };
  }, [mode, speed, distort]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / (container.clientHeight || 340),
      0.1,
      100
    );
    camera.position.set(0, 0, 4.4);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight || 340);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Color definitions
    const colorThemes = {
      cyber: {
        primary: 0x00f2ff,
        secondary: 0x3b82f6,
        glow: 0x60a5fa,
        light: 0x00f2ff,
      },
      purple: {
        primary: 0xc084fc,
        secondary: 0x818cf8,
        glow: 0xe879f9,
        light: 0xa855f7,
      },
      gold: {
        primary: 0xfbbf24,
        secondary: 0xf97316,
        glow: 0xfde047,
        light: 0xf59e0b,
      },
    };

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(colorThemes[mode].light, 2.5, 12);
    pointLight.position.set(-4, -3, 2);
    scene.add(pointLight);

    // Quantum Core Sphere (Inner pulsating mesh)
    const sphereGeo = new THREE.IcosahedronGeometry(1.0, 32);
    const originalPositions = sphereGeo.attributes.position.clone();

    const sphereMat = new THREE.MeshStandardMaterial({
      color: colorThemes[mode].primary,
      roughness: 0.15,
      metalness: 0.85,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(coreMesh);

    // Wireframe Outer Geodesic Shell
    const shellGeo = new THREE.IcosahedronGeometry(1.18, 2);
    const shellMat = new THREE.MeshBasicMaterial({
      color: colorThemes[mode].secondary,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
    });
    const shellMesh = new THREE.Mesh(shellGeo, shellMat);
    scene.add(shellMesh);

    // Orbital Quantum Rings
    const ring1Geo = new THREE.TorusGeometry(1.6, 0.018, 16, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: colorThemes[mode].primary,
      transparent: true,
      opacity: 0.7,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    scene.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(1.9, 0.014, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: colorThemes[mode].secondary,
      transparent: true,
      opacity: 0.5,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    scene.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(2.2, 0.01, 16, 100);
    const ring3Mat = new THREE.MeshBasicMaterial({
      color: colorThemes[mode].glow,
      transparent: true,
      opacity: 0.35,
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    scene.add(ring3);

    // Particle Cloud (Stardust)
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.2 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      particlePos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePos[i * 3 + 2] = radius * Math.cos(phi);
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));

    const particleMat = new THREE.PointsMaterial({
      color: colorThemes[mode].primary,
      size: 0.045,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Mouse Drag Rotation
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      targetRotationY += deltaX * 0.008;
      targetRotationX += deltaY * 0.008;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Touch support
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      const deltaY = e.touches[0].clientY - prevMouseY;
      targetRotationY += deltaX * 0.008;
      targetRotationX += deltaY * 0.008;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    };
    const onTouchEnd = () => {
      isDragging = false;
    };

    canvas.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);

    // Resize handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 340;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", onResize);

    // Animation loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const currentSpeed = stateRef.current.speed;
      const currentDistort = stateRef.current.distort;
      const currentMode = stateRef.current.mode;
      const theme = colorThemes[currentMode];

      // Update materials if mode changed
      sphereMat.color.setHex(theme.primary);
      shellMat.color.setHex(theme.secondary);
      ring1Mat.color.setHex(theme.primary);
      ring2Mat.color.setHex(theme.secondary);
      ring3Mat.color.setHex(theme.glow);
      particleMat.color.setHex(theme.primary);
      pointLight.color.setHex(theme.light);

      // Vertex distortion calculation
      const posAttr = sphereGeo.attributes.position;
      const orig = originalPositions.array;
      const current = posAttr.array as Float32Array;

      for (let i = 0; i < orig.length; i += 3) {
        const ox = orig[i];
        const oy = orig[i + 1];
        const oz = orig[i + 2];
        const wave =
          Math.sin(ox * 3.0 + time * 3.5 * currentSpeed) *
          Math.cos(oy * 3.0 + time * 3.5 * currentSpeed) *
          Math.sin(oz * 3.0 + time * 3.5 * currentSpeed);
        const factor = 1.0 + wave * currentDistort * 0.35;
        current[i] = ox * factor;
        current[i + 1] = oy * factor;
        current[i + 2] = oz * factor;
      }
      posAttr.needsUpdate = true;
      sphereGeo.computeVertexNormals();

      // Rotations & Interactivity
      targetRotationY += 0.006 * currentSpeed;

      scene.rotation.y += (targetRotationY - scene.rotation.y) * 0.08;
      scene.rotation.x += (targetRotationX - scene.rotation.x) * 0.08;

      ring1.rotation.x = time * 0.45 * currentSpeed;
      ring1.rotation.y = time * 0.25 * currentSpeed;

      ring2.rotation.y = -time * 0.5 * currentSpeed;
      ring2.rotation.z = time * 0.3 * currentSpeed;

      ring3.rotation.z = time * 0.35 * currentSpeed;
      ring3.rotation.x = -time * 0.25 * currentSpeed;

      particles.rotation.y = time * 0.08 * currentSpeed;
      shellMesh.rotation.y = -time * 0.15 * currentSpeed;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);

      sphereGeo.dispose();
      sphereMat.dispose();
      shellGeo.dispose();
      shellMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      ring3Geo.dispose();
      ring3Mat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-3xl overflow-hidden glass-panel border border-white/10 ${className}`}
    >
      {/* Ambient Radial Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-transparent to-accent/10 pointer-events-none" />

      {/* Header overlay */}
      <div className="absolute top-4 left-5 right-5 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
          <span className="text-xs font-black tracking-widest text-white uppercase bg-black/40 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-md">
            Three.js • Quantum Neural Core
          </span>
        </div>

        {showControls && (
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={() => setMode("cyber")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                mode === "cyber"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.5)]"
                  : "bg-white/5 text-muted-foreground hover:text-white"
              }`}
            >
              Cyan
            </button>
            <button
              onClick={() => setMode("purple")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                mode === "purple"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                  : "bg-white/5 text-muted-foreground hover:text-white"
              }`}
            >
              Purple
            </button>
            <button
              onClick={() => setMode("gold")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                mode === "gold"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                  : "bg-white/5 text-muted-foreground hover:text-white"
              }`}
            >
              Gold
            </button>
          </div>
        )}
      </div>

      {/* 3D Canvas */}
      <div style={{ height }} className="w-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-grab active:cursor-grabbing outline-none"
        />
      </div>

      {/* Bottom status badge & live sliders */}
      {showControls && (
        <div className="absolute bottom-3 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 backdrop-blur-md text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>Drag 360° to rotate</span>
            <span className="text-white/20">•</span>
            <span className="text-cyan-400 font-mono">Dynamic Vertex Shader</span>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <span>Warp</span>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={distort}
                onChange={(e) => setDistort(parseFloat(e.target.value))}
                className="w-16 accent-accent h-1.5 bg-white/10 rounded-lg cursor-pointer"
              />
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <span>Velocity</span>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.2"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-16 accent-accent h-1.5 bg-white/10 rounded-lg cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
