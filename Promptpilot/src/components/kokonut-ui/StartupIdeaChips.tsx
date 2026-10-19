"use client";

import React from "react";
import { Sparkles, Cpu, ShieldCheck, ShoppingBag, Stethoscope, GraduationCap, Truck } from "lucide-react";
import { StartupProfile } from "@/components/prompt-pilot/CoFounderTab";

interface StartupIdeaChipsProps {
  onSelectPreset: (preset: StartupProfile) => void;
}

export const PRESET_STARTUPS: Array<{
  name: string;
  icon: React.ElementType;
  badge: string;
  color: string;
  profile: StartupProfile;
}> = [
  {
    name: "FinTech AI Invoicing",
    icon: Cpu,
    badge: "Fintech",
    color: "from-blue-500/20 to-cyan-500/20 border-cyan-500/30 text-cyan-300",
    profile: {
      idea: "Autonomous AI billing & cash flow recovery platform for Indian SMEs and exporters.",
      sector: "Fintech",
      stage: "Pre-Seed",
      revenueModel: "SaaS + Transaction Fee",
      targetMarket: "India & MENA",
      teamSize: "2 co-founders",
      location: "Bengaluru, India",
    },
  },
  {
    name: "HealthTech Tele-Triage",
    icon: Stethoscope,
    badge: "Healthcare",
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300",
    profile: {
      idea: "Multilingual AI patient triage and clinical documentation copilot for tier-2 & 3 hospitals.",
      sector: "HealthTech",
      stage: "Seed",
      revenueModel: "B2B SaaS per Bed",
      targetMarket: "India",
      teamSize: "3 founders (1 MD)",
      location: "Hyderabad, India",
    },
  },
  {
    name: "Agritech Cold-Chain AI",
    icon: Truck,
    badge: "AgriTech",
    color: "from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-300",
    profile: {
      idea: "IoT and predictive shelf-life computer vision reducing perishable crop post-harvest loss.",
      sector: "Agritech",
      stage: "Pre-Seed",
      revenueModel: "Hardware Lease + SaaS",
      targetMarket: "India",
      teamSize: "2 founders",
      location: "Pune, India",
    },
  },
  {
    name: "EdTech Adaptive Tutor",
    icon: GraduationCap,
    badge: "EdTech",
    color: "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300",
    profile: {
      idea: "Personalized voice-first vernacular STEM exam coach for high-school students in India.",
      sector: "EdTech",
      stage: "Pre-Seed",
      revenueModel: "B2C Subscription",
      targetMarket: "India (Tier 2/3)",
      teamSize: "2 engineers",
      location: "Delhi NCR, India",
    },
  },
  {
    name: "DevSecOps Cloud Shield",
    icon: ShieldCheck,
    badge: "Cybersecurity",
    color: "from-indigo-500/20 to-blue-500/20 border-indigo-500/30 text-indigo-300",
    profile: {
      idea: "Zero-configuration automated compliance and runtime vulnerability scanner for cloud microservices.",
      sector: "Cybersecurity",
      stage: "Seed",
      revenueModel: "Usage-Based SaaS",
      targetMarket: "Global",
      teamSize: "4 engineers",
      location: "Remote / Bengaluru",
    },
  },
];

export function StartupIdeaChips({ onSelectPreset }: StartupIdeaChipsProps) {
  return (
    <div className="space-y-2 pt-1 font-sans">
      <div className="flex items-center gap-1.5 text-xs text-neutral-400">
        <Sparkles className="h-3.5 w-3.5 text-neutral-300" />
        <span>Sample Ventures:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {PRESET_STARTUPS.map((preset) => {
          const Icon = preset.icon;
          return (
            <button
              key={preset.name}
              type="button"
              onClick={() => onSelectPreset(preset.profile)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-neutral-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <Icon className="h-3.5 w-3.5 text-neutral-400" />
              <span>{preset.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-400 font-medium">
                {preset.badge}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
