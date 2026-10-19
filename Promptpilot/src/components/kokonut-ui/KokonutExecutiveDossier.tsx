"use client";

import React from "react";
import { Check, AlertTriangle, ShieldCheck, ArrowRight, Target, Sparkles, Zap, Shield, Flame } from "lucide-react";
import { KokonutCard } from "./KokonutCard";

export interface WinningFactor {
  factor: string;
  evidence: string;
  impact?: string;
}

export interface FailingTrap {
  trap: string;
  evidence: string;
  severity: "Lethal" | "High" | "Moderate" | string;
  countermeasure: string;
}

export interface GoNoGoCriteria {
  confidenceLevel?: string;
  goConditions?: string[];
  noGoKillConditions?: string[];
}

export interface ImmediateAction {
  step: number;
  action: string;
  metric: string;
  timeline: string;
}

interface KokonutExecutiveDossierProps {
  whyItWins?: WinningFactor[];
  whyItFails?: FailingTrap[];
  goNoGoCriteria?: GoNoGoCriteria;
  next3Actions?: ImmediateAction[];
}

export function KokonutExecutiveDossier({
  whyItWins,
  whyItFails,
  goNoGoCriteria,
  next3Actions,
}: KokonutExecutiveDossierProps) {
  const wins = whyItWins || [
    {
      factor: "High-Margin Automation vs. Manual Incumbents",
      evidence: "Traditional competitors charge heavy human-consulting rates with multi-week project backlogs.",
      impact: "Delivers 10x faster execution speed at 60% lower total cost of ownership."
    },
    {
      factor: "Proprietary Vertical Workflow Integration",
      evidence: "Generic horizontal LLM tools lack specialized domain taxonomy and customer operational context.",
      impact: "Creates compounding user retention and sticky high-gravity dataset."
    },
    {
      factor: "Direct Government & Institutional Tailwinds",
      evidence: "Meets national innovation criteria with access to equity-free grants (SISFS/DPIIT).",
      impact: "Provides low-dilution early capital runway to de-risk technological proof."
    }
  ];

  const fails = whyItFails || [
    {
      trap: "Customer Apathy & 'Good-Enough' Spreadsheet Inertia",
      evidence: "Over 65% of early software pilots stall because buyers default to existing manual routines.",
      severity: "Lethal",
      countermeasure: "Design a 5-minute time-to-value workflow that demands zero complex migration."
    },
    {
      trap: "Customer Acquisition Cost Outpacing Early Revenue",
      evidence: "Paid outbound conversion rates decline rapidly when selling unbranded solutions.",
      severity: "High",
      countermeasure: "Rely strictly on founder-led direct outreach and organic proof-of-work loops."
    },
    {
      trap: "Incumbent Feature Bundling & Commercial Lock-in",
      evidence: "Established suites can roll out surface-level replicas and bundle them for free.",
      severity: "Moderate",
      countermeasure: "Specialize deeply in niche edge cases horizontal platforms cannot afford to support."
    }
  ];

  const goConds = goNoGoCriteria?.goConditions || [
    "≥ 5 signed Letters of Intent (LOIs) or paid pilots secured within 45 days",
    "≥ 40% weekly recurring usage among initial 15 trial users",
    "Demonstrated time-to-value under 30 minutes with zero manual setup"
  ];

  const noGoConds = goNoGoCriteria?.noGoKillConditions || [
    "Fewer than 2 paying pilots after 40 direct customer discovery pitches",
    "Customer Acquisition Cost exceeds 3x initial annual contract value",
    "Target buyers report problem is 'minor inconvenience, not worthy of budget'"
  ];

  const actions = next3Actions || [
    { step: 1, action: "Conduct 15 Problem Discovery Interviews", metric: "Uncover exact financial loss without pitching", timeline: "Days 1–7" },
    { step: 2, action: "Execute Concierge Pilot for 3 Buyers", metric: "Deliver manual outcome to prove willingness to pay", timeline: "Days 8–14" },
    { step: 3, action: "Secure Paid Advance Commitment", metric: "Obtain ≥ 2 signed advance deposits", timeline: "Days 15–21" }
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Apple-style Luminous Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f2ff]" />
            <span className="text-[11px] font-bold tracking-widest uppercase text-cyan-400">
              Venture Intelligence Report
            </span>
          </div>
          <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Executive Decision Dossier
          </h3>
          <p className="text-sm text-neutral-400">
            Pinpointed structural moats, lethal failure modes, and immediate 21-day execution gates.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/[0.08] border border-white/[0.15] text-white shadow-sm backdrop-blur-xl">
            Evidence-Driven Framework
          </div>
        </div>
      </div>

      {/* Side-by-Side Vibrant Apple Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Why This Idea Wins (Emerald Glow) */}
        <KokonutCard glowColor="emerald" className="h-full">
          <div className="flex items-center justify-between pb-5 mb-5 border-b border-white/[0.1]">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#30d158] to-[#10b981] flex items-center justify-center text-black font-black text-lg shadow-[0_0_24px_rgba(48,209,88,0.4)]">
                <ShieldCheck className="w-5 h-5 text-black" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-white tracking-tight">WHY THIS IDEA WINS</h4>
                <p className="text-xs text-[#30d158] font-medium">Unfair Structural Advantages & Moats</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/40 shadow-[0_0_15px_rgba(48,209,88,0.25)]">
              STRONG MOAT
            </span>
          </div>

          <div className="space-y-4">
            {wins.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-[#30d158]/40 transition-all duration-300 space-y-2.5 shadow-sm"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/40 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_8px_rgba(48,209,88,0.3)]">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <h5 className="text-sm font-bold text-white leading-snug">{item.factor}</h5>
                </div>
                
                <p className="pl-7 text-neutral-300 text-xs leading-relaxed">
                  <strong className="text-neutral-400 font-semibold">Evidence: </strong>
                  {item.evidence}
                </p>

                {item.impact && (
                  <div className="ml-7 mt-2 p-2.5 rounded-xl bg-[#30d158]/10 border border-[#30d158]/25 flex items-center gap-2 text-xs text-[#30d158]">
                    <Zap className="w-3.5 h-3.5 text-[#30d158] flex-shrink-0" />
                    <span>
                      <strong className="font-bold">Moat Advantage: </strong>
                      {item.impact}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-neutral-400">Validated against industry benchmarks</span>
            <span className="text-[#30d158] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#30d158] shadow-[0_0_8px_#30d158]" />
              High Viability
            </span>
          </div>
        </KokonutCard>

        {/* Card 2: Why This Idea Could Fail (Rose Glow) */}
        <KokonutCard glowColor="rose" className="h-full">
          <div className="flex items-center justify-between pb-5 mb-5 border-b border-white/[0.1]">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ff453a] to-[#e11d48] flex items-center justify-center text-white font-black text-lg shadow-[0_0_24px_rgba(255,69,58,0.4)]">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-white tracking-tight">WHY THIS IDEA COULD FAIL</h4>
                <p className="text-xs text-[#ff453a] font-medium">Lethal Traps, Friction & Blindspots</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#ff453a]/20 text-[#ff453a] border border-[#ff453a]/40 shadow-[0_0_15px_rgba(255,69,58,0.25)]">
              CRITICAL RISKS
            </span>
          </div>

          <div className="space-y-4">
            {fails.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-[#ff453a]/40 transition-all duration-300 space-y-2.5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#ff453a]/20 text-[#ff453a] border border-[#ff453a]/40 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_8px_rgba(255,69,58,0.3)] font-bold text-xs">
                      ✕
                    </div>
                    <h5 className="text-sm font-bold text-white leading-snug">{item.trap}</h5>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0 border ${
                      item.severity.toLowerCase() === "lethal"
                        ? "bg-rose-500/25 border-rose-500/50 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                        : "bg-amber-500/25 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                    }`}
                  >
                    {item.severity}
                  </span>
                </div>

                <p className="pl-7 text-neutral-300 text-xs leading-relaxed">
                  <strong className="text-neutral-400 font-semibold">Root Cause: </strong>
                  {item.evidence}
                </p>

                {item.countermeasure && (
                  <div className="ml-7 mt-2 p-2.5 rounded-xl bg-[#30d158]/10 border border-[#30d158]/25 flex items-center gap-2 text-xs text-[#30d158]">
                    <Shield className="w-3.5 h-3.5 text-[#30d158] flex-shrink-0" />
                    <span>
                      <strong className="font-bold">Survival Countermeasure: </strong>
                      {item.countermeasure}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-neutral-400">Post-mortem failure analysis</span>
            <span className="text-[#ff453a] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ff453a] shadow-[0_0_8px_#ff453a]" />
              Priority Mitigations
            </span>
          </div>
        </KokonutCard>
      </div>

      {/* Decision Gate & Immediate Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Go / No-Go Decision Gate (Cyan Glow) */}
        <KokonutCard glowColor="cyan" className="lg:col-span-2">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.1]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0a84ff] to-cyan-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(10,132,255,0.4)]">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white tracking-tight uppercase">Go / No-Go Decision Gate</h4>
                <p className="text-xs text-neutral-400">Strict binary validation conditions before committing capital</p>
              </div>
            </div>
            <div className="px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 font-mono text-xs font-bold shadow-[0_0_12px_rgba(0,242,255,0.2)]">
              {goNoGoCriteria?.confidenceLevel || "Confidence: 82%"}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Green Light Column */}
            <div className="p-4 rounded-2xl bg-[#30d158]/[0.06] border border-[#30d158]/30 space-y-3">
              <span className="text-xs font-bold text-[#30d158] flex items-center gap-1.5 uppercase tracking-wider">
                <Check className="w-4 h-4 stroke-[3]" /> Conditions to Proceed (GO)
              </span>
              <div className="space-y-2.5 pt-1">
                {goConds.map((cond, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-neutral-200 leading-relaxed">
                    <span className="text-[#30d158] font-bold text-sm leading-none mt-0.5">✓</span>
                    <span>{cond}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Red Light Column */}
            <div className="p-4 rounded-2xl bg-[#ff453a]/[0.06] border border-[#ff453a]/30 space-y-3">
              <span className="text-xs font-bold text-[#ff453a] flex items-center gap-1.5 uppercase tracking-wider">
                <Flame className="w-4 h-4 text-[#ff453a]" /> Stop / Kill Conditions (NO-GO)
              </span>
              <div className="space-y-2.5 pt-1">
                {noGoConds.map((cond, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-neutral-200 leading-relaxed">
                    <span className="text-[#ff453a] font-bold text-sm leading-none mt-0.5">✕</span>
                    <span>{cond}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </KokonutCard>

        {/* Next 3 Immediate Actions (Purple Glow) */}
        <KokonutCard glowColor="purple">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.1]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#bf5af2] to-purple-600 flex items-center justify-center text-white shadow-[0_0_16px_rgba(191,90,242,0.4)]">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h4 className="text-sm font-extrabold text-white tracking-tight uppercase">Immediate Sprints</h4>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#bf5af2]/20 text-[#bf5af2] border border-[#bf5af2]/40">
              Days 1–21
            </span>
          </div>

          <div className="space-y-3">
            {actions.map((act) => (
              <div
                key={act.step}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-[#bf5af2]/40 transition-all space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#bf5af2] tracking-wider text-[11px] uppercase">
                    Sprint 0{act.step}
                  </span>
                  <span className="text-neutral-400 font-mono text-[10px] bg-white/[0.06] px-2 py-0.5 rounded-full">
                    {act.timeline}
                  </span>
                </div>
                <p className="text-white font-semibold leading-snug">{act.action}</p>
                <p className="text-neutral-400 text-[11px] leading-tight">
                  <span className="text-cyan-400 font-medium">Gate: </span>
                  {act.metric}
                </p>
              </div>
            ))}
          </div>
        </KokonutCard>
      </div>
    </div>
  );
}
