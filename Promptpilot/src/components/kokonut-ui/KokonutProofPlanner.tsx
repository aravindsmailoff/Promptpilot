"use client";

import React from "react";
import { Check, X, FlaskConical } from "lucide-react";
import { KokonutCard } from "./KokonutCard";

export interface KokonutExperiment {
  title: string;
  category: string;
  typeBadge: string;
  duration: string;
  cost: string;
  hypothesis: string;
  reason: string;
  participants: string;
  method: string;
  successThreshold: string;
  killThreshold: string;
  decision: string;
}

interface KokonutProofPlannerProps {
  experiments?: KokonutExperiment[];
}

export const DEFAULT_EXPERIMENTS: KokonutExperiment[] = [
  {
    title: "Problem Severity & Willingness-to-Pay Smoke Test",
    category: "Customer Discovery",
    typeBadge: "bg-[#30d158]/12 text-[#30d158] border-[#30d158]/25",
    duration: "Days 1–7",
    cost: "₹0 – ₹5,000",
    hypothesis: "Target buyers experience ≥ 10 hours/week of operational turnaround lag and at least 25% will sign a conditional letter of intent or pay an advance deposit.",
    reason: "De-risks customer apathy and verifies if the problem warrants a dedicated budget line.",
    participants: "15 Target Hiring Managers / Team Leads via cold outreach",
    method: "Blind discovery interview focused on historic costs, concluding with a firm ask for a ₹5,000 refundable pilot deposit.",
    successThreshold: "≥ 4 out of 15 interviewed leaders commit to pilot or deposit",
    killThreshold: "Fewer than 1 buyer acknowledges problem warrants budget",
    decision: "If passed, initiate Concierge MVP; if failed, pivot to alternate buyer persona."
  },
  {
    title: "Concierge MVP & Turnaround Speed Validation",
    category: "Operational Prototype",
    typeBadge: "bg-[#0a84ff]/12 text-[#0a84ff] border-[#0a84ff]/25",
    duration: "Days 8–14",
    cost: "₹5,000 – ₹10,000",
    hypothesis: "Delivering candidate assessments within 30 minutes manually yields an NPS > 50 and converts 2 design partners into paid recurring subscribers.",
    reason: "Validates workflow value and operational mechanics before building complex backend infrastructure.",
    participants: "3 Pilot Companies with active hiring requisitions",
    method: "Founder executes manual evaluation and report generation using internal templates, simulating the future automated AI engine.",
    successThreshold: "≥ 2 companies renew for subsequent weeks and approve recurring invoicing",
    killThreshold: "Hiring managers ignore reports or request traditional manual interviews instead",
    decision: "If passed, begin automated MVP architecture; if failed, redesign assessment metrics."
  },
  {
    title: "Direct Acquisition & CAC Smoke Test",
    category: "Channel Economics",
    typeBadge: "bg-[#bf5af2]/12 text-[#bf5af2] border-[#bf5af2]/25",
    duration: "Days 15–21",
    cost: "₹5,000 – ₹12,000",
    hypothesis: "A targeted landing page with explicit pricing ($149/mo) achieves a visitor-to-demo conversion rate > 7% at an estimated CAC < ₹3,500.",
    reason: "Validates scalable distribution and tests price sensitivity under real economic pressure.",
    participants: "100 Qualified clicks from hyper-targeted LinkedIn/community outreach",
    method: "Landing page showcasing product capabilities, feature breakdown, and paid checkout reservation.",
    successThreshold: "≥ 7 demo bookings or 2 paid reservations",
    killThreshold: "Conversion rate under 1.5% with traffic abandoning pricing section",
    decision: "If passed, scale organic and paid distribution; if failed, test alternate pricing tiers."
  }
];

export function KokonutProofPlanner({ experiments = DEFAULT_EXPERIMENTS }: KokonutProofPlannerProps) {
  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white">
            <FlaskConical className="w-4 h-4 text-[#0a84ff]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Proof-of-Concept Experiment Planner
            </h3>
            <p className="text-xs text-neutral-400">
              Structured validation sprints designed to verify lethal assumptions before committing engineering resources.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/[0.05] border border-white/[0.08] text-neutral-300">
          3 Validation Sprints
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {experiments.map((exp, idx) => {
          const glow = idx === 0 ? "emerald" : idx === 1 ? "blue" : "purple";
          return (
            <KokonutCard key={idx} glowColor={glow as any} className="bg-[#121214]/90 border-white/[0.08] flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${exp.typeBadge}`}>
                    {exp.category}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
                    <span>{exp.duration}</span>
                    <span>·</span>
                    <span className="text-neutral-200 font-medium">{exp.cost}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white leading-snug tracking-tight">{exp.title}</h4>
                  <p className="text-xs text-neutral-400 mt-1">Why: {exp.reason}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-neutral-400">
                    Hypothesis
                  </span>
                  <p className="text-neutral-300 text-xs leading-relaxed italic">"{exp.hypothesis}"</p>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-start gap-1.5">
                    <span className="text-neutral-500 font-medium text-[11px] uppercase tracking-wide flex-shrink-0">Cohort:</span>
                    <span className="text-neutral-300">{exp.participants}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-neutral-500 font-medium text-[11px] uppercase tracking-wide flex-shrink-0">Method:</span>
                    <span className="text-neutral-300">{exp.method}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 mt-4 border-t border-white/[0.06] text-xs">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#30d158]/[0.04] border border-[#30d158]/15 text-[#30d158]">
                  <Check className="h-3.5 w-3.5 flex-shrink-0" />
                  <span><strong>Pass:</strong> {exp.successThreshold}</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#ff453a]/[0.04] border border-[#ff453a]/15 text-[#ff453a]">
                  <X className="h-3.5 w-3.5 flex-shrink-0" />
                  <span><strong>Kill:</strong> {exp.killThreshold}</span>
                </div>
              </div>
            </KokonutCard>
          );
        })}
      </div>
    </div>
  );
}
