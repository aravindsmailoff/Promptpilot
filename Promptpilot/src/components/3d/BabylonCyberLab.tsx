"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  PointLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Mesh,
} from "@babylonjs/core";

export interface BabylonCyberLabProps {
  className?: string;
  height?: string;
}

export function BabylonCyberLab({ className = "", height = "360px" }: BabylonCyberLabProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wireframe, setWireframe] = useState(false);
  const [fps, setFps] = useState(60);
  const [vertexCount, setVertexCount] = useState(0);
  const [meshColor, setMeshColor] = useState<"cyan" | "violet" | "gold">("cyan");

  const torusMeshRef = useRef<Mesh | null>(null);
  const materialRef = useRef<StandardMaterial | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create Babylon Engine and Scene
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    const scene = new Scene(engine);
    scene.clearColor = new (Color3 as any).FromHexString("#050814").toColor4(0.0);

    // Create Camera with Smooth Orbit
    const camera = new ArcRotateCamera(
      "Camera",
      Math.PI / 2,
      Math.PI / 3,
      4.5,
      new Vector3(0, 0, 0),
      scene
    );
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 2.5;
    camera.upperRadiusLimit = 8;
    camera.wheelPrecision = 40;

    // Ambient & Accent Lights
    const hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.6;
    hemiLight.groundColor = new Color3(0.05, 0.1, 0.2);

    const pointLight = new PointLight("pointLight", new Vector3(3, 4, 3), scene);
    pointLight.intensity = 1.5;
    pointLight.diffuse = new Color3(0.0, 0.95, 1.0);

    const pointLight2 = new PointLight("pointLight2", new Vector3(-3, -3, -2), scene);
    pointLight2.intensity = 1.0;
    pointLight2.diffuse = new Color3(0.6, 0.2, 0.9);

    // Create Procedural Cyber Torus Knot Mesh
    const torusKnot = MeshBuilder.CreateTorusKnot(
      "cyberTorus",
      {
        radius: 1.1,
        tube: 0.28,
        radialSegments: 128,
        tubularSegments: 48,
        p: 2,
        q: 3,
      },
      scene
    );
    torusMeshRef.current = torusKnot;
    setVertexCount(torusKnot.getTotalVertices());

    // Material
    const mat = new StandardMaterial("cyberMat", scene);
    mat.diffuseColor = new Color3(0.1, 0.5, 0.9);
    mat.specularColor = new Color3(1, 1, 1);
    mat.specularPower = 64;
    mat.emissiveColor = new Color3(0.0, 0.25, 0.4);
    mat.wireframe = wireframe;
    torusKnot.material = mat;
    materialRef.current = mat;

    // Render loop
    engine.runRenderLoop(() => {
      torusKnot.rotation.y += 0.012;
      torusKnot.rotation.x += 0.007;
      scene.render();
      setFps(Math.round(engine.getFps()));
    });

    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      scene.dispose();
      engine.dispose();
    };
  }, []);

  // Update wireframe live
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.wireframe = wireframe;
    }
  }, [wireframe]);

  // Update color scheme live
  useEffect(() => {
    if (!materialRef.current) return;
    if (meshColor === "cyan") {
      materialRef.current.diffuseColor = new Color3(0.0, 0.7, 0.9);
      materialRef.current.emissiveColor = new Color3(0.0, 0.2, 0.4);
    } else if (meshColor === "violet") {
      materialRef.current.diffuseColor = new Color3(0.7, 0.2, 0.9);
      materialRef.current.emissiveColor = new Color3(0.3, 0.05, 0.4);
    } else {
      materialRef.current.diffuseColor = new Color3(0.9, 0.7, 0.1);
      materialRef.current.emissiveColor = new Color3(0.3, 0.2, 0.0);
    }
  }, [meshColor]);

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden glass-panel border border-white/10 ${className}`}>
      {/* Overlay Header */}
      <div className="absolute top-4 left-5 right-5 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse shadow-[0_0_8px_#a855f7]" />
          <span className="text-xs font-black tracking-widest text-white uppercase bg-black/40 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-md">
            Babylon.js • Full 3D Engine Viewport
          </span>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setWireframe(!wireframe)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
              wireframe
                ? "bg-primary text-white border border-primary/50 shadow-md"
                : "bg-white/5 text-muted-foreground hover:text-white"
            }`}
          >
            {wireframe ? "Wireframe ON" : "Solid"}
          </button>
          <button
            onClick={() => setMeshColor("cyan")}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
              meshColor === "cyan" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50" : "bg-white/5 text-muted-foreground hover:text-white"
            }`}
          >
            Cyan
          </button>
          <button
            onClick={() => setMeshColor("violet")}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
              meshColor === "violet" ? "bg-violet-500/20 text-violet-300 border border-violet-500/50" : "bg-white/5 text-muted-foreground hover:text-white"
            }`}
          >
            Violet
          </button>
          <button
            onClick={() => setMeshColor("gold")}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
              meshColor === "gold" ? "bg-amber-500/20 text-amber-300 border border-amber-500/50" : "bg-white/5 text-muted-foreground hover:text-white"
            }`}
          >
            Gold
          </button>
        </div>
      </div>

      {/* Babylon Canvas */}
      <canvas
        ref={canvasRef}
        style={{ height, width: "100%", display: "block" }}
        className="cursor-grab active:cursor-grabbing outline-none"
      />

      {/* Bottom Telemetry Bar */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 backdrop-blur-md text-[11px] text-muted-foreground pointer-events-none">
        <div className="flex items-center gap-3 font-mono">
          <span>Engine: <strong className="text-white">Babylon.js v9</strong></span>
          <span className="text-white/20">•</span>
          <span>FPS: <strong className="text-cyan-400">{fps}</strong></span>
          <span className="text-white/20">•</span>
          <span>Vertices: <strong className="text-violet-400">{vertexCount.toLocaleString()}</strong></span>
        </div>
        <span className="text-xs text-white/50">Drag / Scroll to zoom 3D</span>
      </div>
    </div>
  );
}
