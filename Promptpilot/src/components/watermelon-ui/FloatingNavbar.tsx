"use client";

import React from "react";
import { Home as HomeIcon, History, Brain, LayoutGrid, Settings, Sparkles, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface FloatingNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function FloatingNavbar({ activeTab, setActiveTab }: FloatingNavbarProps) {
  const navItems = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "growth", label: "Growth OS", icon: Sparkles },
    { id: "context", label: "CRM", icon: Brain },
    { id: "history", label: "History", icon: History },
    { id: "directory", label: "Fleet", icon: LayoutGrid },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="sticky top-4 z-50 w-full px-4 md:px-6 pointer-events-none">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 p-2 rounded-3xl bg-[#070b16]/80 border border-white/15 backdrop-blur-2xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] pointer-events-auto">
        {/* Brand Logo with 3D Holographic Glow */}
        <div
          onClick={() => setActiveTab("home")}
          className="flex items-center gap-3 pl-3 pr-2 py-1 cursor-pointer group"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/40 rounded-2xl blur-md group-hover:scale-125 transition-transform" />
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30 group-hover:rotate-12 transition-transform duration-300">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tighter text-white block leading-none">
                SPARK
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                v2.5
              </span>
            </div>
            <span className="text-[9px] font-bold text-accent uppercase tracking-widest mt-0.5 block opacity-80">
              AI Orchestrator
            </span>
          </div>
        </div>

        {/* Central Morphing Dock Tabs */}
        <nav className="flex items-center p-1 rounded-2xl bg-white/5 border border-white/5 shadow-inner">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300",
                  isActive ? "text-white" : "text-muted-foreground hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-blue-600 shadow-lg shadow-primary/30"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <item.icon className="h-4 w-4 relative z-10" />
                <span className="relative z-10 hidden md:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Status Indicator */}
        <div className="flex items-center gap-2 pr-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold font-mono text-muted-foreground shadow-sm backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span className="text-white text-[11px] font-bold">SPARK AI</span>
            <span className="text-white/20">•</span>
            <span className="text-cyan-400 text-[11px]">Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}
