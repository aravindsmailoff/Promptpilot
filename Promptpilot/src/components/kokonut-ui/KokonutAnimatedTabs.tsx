"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface KokonutTabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeColor?: string;
}

interface KokonutAnimatedTabsProps {
  tabs: KokonutTabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  layoutId?: string;
}

export function KokonutAnimatedTabs({
  tabs,
  activeTab,
  onChange,
  className,
}: KokonutAnimatedTabsProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center p-1 rounded-full bg-[#1c1c1e]/90 border border-white/[0.08] backdrop-blur-2xl shadow-sm",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 select-none cursor-pointer",
              isActive
                ? "bg-[#2c2c2e] text-white shadow-sm border border-white/[0.08]"
                : "text-neutral-400 hover:text-white"
            )}
          >
            {tab.icon && (
              <span className="opacity-80">
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-medium leading-none",
                  tab.badgeColor || (isActive ? "bg-white/10 text-neutral-300" : "bg-white/5 text-neutral-500")
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
