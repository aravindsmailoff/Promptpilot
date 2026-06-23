"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { saveMissionHistory } from "@/lib/actions/history";
import { useSettings } from "@/components/providers/SettingsProvider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Rocket,
  TrendingUp,
  Users,
  PresentationIcon,
  Search,
  DollarSign,
  Handshake,
  UserPlus,
  Building2,
  BarChart3,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Download,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  Globe,
  IndianRupee,
  Star,
  Shield,
  X,
  RefreshCw,
  SlidersHorizontal,
  ArrowUpDown,
  Github,
  Filter,
} from "lucide-react";
import { GOVERNMENT_SCHEMES, INVESTORS, matchSchemesToStartup, matchInvestorsToStartup } from "@/lib/cofounder-data";

// ── Types ──────────────────────────────────────────────
export interface StartupProfile {
  idea: string;
  sector: string;
  stage: string;
  revenueModel: string;
  targetMarket: string;
  teamSize: string;
  location: string;
}

export type ModuleId =
  | "validate"
  | "competitors"
  | "pitch-deck"
  | "discovery"
  | "financials"
  | "investors"
  | "hiring"
  | "schemes"
  | "cofounder-match";

export interface ModuleDef {
  id: ModuleId;
  title: string;
  description: string;
  icon: any;
  color: string;
  glow: string;
  badge?: string;
}

// ── Module Definitions ─────────────────────────────────
export const MODULES: ModuleDef[] = [
  {
    id: "validate",
    title: "Idea Validation",
    description: "Brutally honest market analysis with confidence score, TAM/SAM/SOM and demand signals.",
    icon: Target,
    color: "from-blue-500/20 to-cyan-500/10 border-blue-500/30",
    glow: "shadow-blue-500/20",
    badge: "Core",
  },
  {
    id: "competitors",
    title: "Competitor Intel",
    description: "Map 8–10 direct/indirect competitors with pricing, features, weaknesses and your win condition.",
    icon: Search,
    color: "from-violet-500/20 to-purple-500/10 border-violet-500/30",
    glow: "shadow-violet-500/20",
  },
  {
    id: "pitch-deck",
    title: "Pitch Deck",
    description: "Auto-generate a 12-slide investor-ready deck with real numbers, GTM strategy and TAM charts.",
    icon: PresentationIcon,
    color: "from-orange-500/20 to-amber-500/10 border-orange-500/30",
    glow: "shadow-orange-500/20",
    badge: "🔥 Popular",
  },
  {
    id: "discovery",
    title: "Customer Discovery",
    description: "10 discovery questions, 3 target personas, and a distribution plan with expected response rates.",
    icon: Users,
    color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
    glow: "shadow-emerald-500/20",
  },
  {
    id: "financials",
    title: "Financial Model",
    description: "3-year P&L, burn rate, CAC/LTV ratios, break-even analysis and cost optimization tips.",
    icon: BarChart3,
    color: "from-yellow-500/20 to-amber-500/10 border-yellow-500/30",
    glow: "shadow-yellow-500/20",
    badge: "India ₹",
  },
  {
    id: "investors",
    title: "Investor Outreach",
    description: "Find matching VCs and angels with fit scores, personalized cold email templates and CRM.",
    icon: DollarSign,
    color: "from-pink-500/20 to-rose-500/10 border-pink-500/30",
    glow: "shadow-pink-500/20",
  },
  {
    id: "hiring",
    title: "Hire Planning",
    description: "Priority hire list, equity ranges, JD templates and where to find the right people cheaply.",
    icon: UserPlus,
    color: "from-sky-500/20 to-blue-500/10 border-sky-500/30",
    glow: "shadow-sky-500/20",
  },
  {
    id: "schemes",
    title: "Govt Scheme Matching",
    description: "Match to 100+ Indian schemes — Startup India, DPIIT, NIDHI, BIRAC — with application steps.",
    icon: Building2,
    color: "from-green-500/20 to-emerald-500/10 border-green-500/30",
    glow: "shadow-green-500/20",
    badge: "Free Money",
  },
  {
    id: "cofounder-match",
    title: "Co-Founder Match",
    description: "Skill gap analysis, co-founder archetypes, search strategies and intro email templates.",
    icon: Handshake,
    color: "from-fuchsia-500/20 to-pink-500/10 border-fuchsia-500/30",
    glow: "shadow-fuchsia-500/20",
  },
];

// ── Score Gauge Component ──────────────────────────────
export function ScoreGauge({ score, size = 140 }: { score: number; size?: number }) {
  const r = size * 0.386;
  const cx = size / 2;
  const cy = size / 2;
  const color = score >= 70 ? "#22c55e" : score >= 45 ? "#eab308" : "#ef4444";
  const label = score >= 70 ? "STRONG" : score >= 45 ? "MODERATE" : "WEAK";
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: "stroke-dashoffset 1.2s ease" }} />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize={size * 0.2} fontWeight="900" fontFamily="Inter">{score}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={size * 0.08} fontWeight="700">/ 100</text>
      </svg>
      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>{label}</span>
    </div>
  );
}

// ── Mini Score Bar ─────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  const color = score >= 7 ? "bg-emerald-500" : score >= 5 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-full bg-white/5 rounded-full h-1.5 mt-1.5">
      <div className={`h-1.5 rounded-full transition-all duration-1000 ${color}`} style={{ width: `${score * 10}%` }} />
    </div>
  );
}

// ── Validation Result Renderer ─────────────────────────
export function ValidationResult({ data }: { data: any }) {
  const [activeTab, setActiveTab] = useState<string>("problem");

  // ── Detect new vs old schema ─────────────────────────
  const isNewSchema = !!data.dimensions;

  // Render old schema if dimensions key is missing
  if (!isNewSchema) {
    const qualifies = data.qualifiesForGovtFunding;
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <ScoreGauge score={data.validationScore || 0} />
          <div className="flex-1 space-y-3">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">BRUTAL HONESTY</p>
              <p className="text-white/90 font-medium">{data.brutalHonesty}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[{ label: "TAM", value: data.marketSize?.TAM }, { label: "SAM", value: data.marketSize?.SAM }, { label: "SOM", value: data.marketSize?.SOM }].map((m) => (
                <div key={m.label} className="p-3 bg-primary/10 rounded-xl text-center">
                  <div className="text-[9px] font-black text-primary/80 uppercase tracking-widest">{m.label}</div>
                  <div className="text-xs font-bold text-white mt-1">{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {qualifies && (
          <div className="p-5 bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-2xl border-2 border-green-500/40">
            <p className="text-green-400 font-black text-sm uppercase tracking-widest mb-1">🎉 Qualifies for Government Funding</p>
            <p className="text-white/60 text-xs">{data.govtFundingReason}</p>
          </div>
        )}
      </div>
    );
  }

  // ── New 12-dimension schema rendering ────────────────
  const d = data.dimensions || {};
  const sc = data.scorecard || {};
  const verdict = data.verdict || "VALIDATE FURTHER";
  const overallScore = data.overallScore || 0;

  const verdictConfig: Record<string, { bg: string; border: string; text: string; icon: string; label: string }> = {
    "STRONGLY VALIDATE": { bg: "from-emerald-500/20 to-green-500/10", border: "border-emerald-500/50", text: "text-emerald-400", icon: "🚀", label: "Build Immediately" },
    "VALIDATE FURTHER":  { bg: "from-blue-500/20 to-cyan-500/10",    border: "border-blue-500/50",    text: "text-blue-400",    icon: "🔬", label: "Promising — Test First" },
    "PIVOT RECOMMENDED": { bg: "from-amber-500/20 to-orange-500/10", border: "border-amber-500/50",   text: "text-amber-400",   icon: "⚡", label: "Core Assumptions Weak" },
    "DO NOT BUILD":      { bg: "from-red-500/20 to-rose-500/10",     border: "border-red-500/50",     text: "text-red-400",     icon: "🛑", label: "Insufficient Viability" },
  };
  const vc = verdictConfig[verdict] || verdictConfig["VALIDATE FURTHER"];

  const scorecardItems = [
    { key: "problem",       label: "Problem",       icon: "🎯" },
    { key: "customer",      label: "Customer",      icon: "👥" },
    { key: "demand",        label: "Demand",        icon: "📈" },
    { key: "competition",   label: "Competition",   icon: "⚔️" },
    { key: "uvp",           label: "UVP",           icon: "💎" },
    { key: "revenue",       label: "Revenue",       icon: "💰" },
    { key: "technical",     label: "Technical",     icon: "⚙️" },
    { key: "scalability",   label: "Scalability",   icon: "🌐" },
    { key: "risk",          label: "Risk",          icon: "🛡️" },
    { key: "investorAppeal",label: "Investor",      icon: "🏦" },
  ];

  const dimTabs = [
    { id: "problem",       label: "Problem"     },
    { id: "customer",      label: "Customer"    },
    { id: "demand",        label: "Demand"      },
    { id: "competition",   label: "Competition" },
    { id: "uvp",           label: "UVP"         },
    { id: "revenue",       label: "Revenue"     },
    { id: "technical",     label: "Technical"   },
    { id: "founderFit",    label: "Founder Fit" },
    { id: "scalability",   label: "Scalability" },
    { id: "risk",          label: "Risk"        },
    { id: "investor",      label: "Investor"    },
    { id: "mvpRoadmap",    label: "Roadmap"     },
  ];

  const scoreColor = (s: number) => s >= 7 ? "text-emerald-400" : s >= 5 ? "text-amber-400" : "text-red-400";
  const badgeColor = (level: string) => {
    const l = (level || "").toLowerCase();
    if (["high", "critical", "extreme", "rising", "exponential"].some(k => l.includes(k))) return "bg-rose-500/10 border-rose-500/20 text-rose-400";
    if (["medium", "moderate", "stable", "linear"].some(k => l.includes(k))) return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
  };

  const InfoPill = ({ label, value }: { label: string; value: string }) => (
    <div className="p-3 bg-white/3 rounded-xl border border-white/5">
      <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-white/80 text-xs font-semibold">{value}</p>
    </div>
  );

  const renderDimension = () => {
    switch (activeTab) {
      case "problem": return d.problem ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-white text-sm uppercase tracking-wider">Problem Validation</h4>
            <span className={`text-2xl font-black ${scoreColor(d.problem.score)}`}>{d.problem.score}/10</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoPill label="Pain Level" value={d.problem.painLevel || "—"} />
            <InfoPill label="Frequency" value={d.problem.frequency || "—"} />
          </div>
          <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl">
            <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-2">📊 MARKET EVIDENCE</p>
            <p className="text-white/80 text-sm leading-relaxed">{d.problem.evidence}</p>
          </div>
        </div>
      ) : null;

      case "customer": return d.customer ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-white text-sm uppercase tracking-wider">Customer Validation</h4>
            <span className={`text-2xl font-black ${scoreColor(d.customer.score)}`}>{d.customer.score}/10</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div className="p-4 bg-blue-500/5 border border-blue-500/15 rounded-2xl">
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">👤 PRIMARY PERSONA</p>
              <p className="text-white/90 font-semibold">{d.customer.primaryPersona}</p>
            </div>
            <div className="p-4 bg-violet-500/5 border border-violet-500/15 rounded-2xl">
              <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-2">👤 SECONDARY PERSONA</p>
              <p className="text-white/90 font-semibold">{d.customer.secondaryPersona}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoPill label="Buying Power" value={d.customer.buyingPower || "—"} />
            <InfoPill label="Customer Clarity" value={`${d.customer.score}/10`} />
          </div>
          <div className="p-3 bg-white/3 border border-white/5 rounded-xl">
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">INSIGHT</p>
            <p className="text-white/70 text-xs">{d.customer.summary}</p>
          </div>
        </div>
      ) : null;

      case "demand": return d.demand ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-white text-sm uppercase tracking-wider">Market Demand</h4>
            <span className={`text-2xl font-black ${scoreColor(d.demand.score)}`}>{d.demand.score}/10</span>
          </div>
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl">
            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-3">📡 DEMAND SIGNALS</p>
            <div className="space-y-2">
              {[
                { label: "Google Trends", value: d.demand.googleTrend, icon: "📈" },
                { label: "Reddit Signal", value: d.demand.redditSignal, icon: "💬" },
                { label: "Product Hunt", value: d.demand.productHuntSignal, icon: "🚀" },
              ].map((s) => s.value ? (
                <div key={s.label} className="flex items-start gap-3 p-2 bg-white/3 rounded-xl">
                  <span className="text-base flex-shrink-0">{s.icon}</span>
                  <div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-wider">{s.label}</p>
                    <p className="text-white/80 text-xs font-medium">{s.value}</p>
                  </div>
                </div>
              ) : null)}
            </div>
          </div>
          <InfoPill label="Demand Trend" value={d.demand.trend || "—"} />
        </div>
      ) : null;

      case "competition": return d.competition ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-white text-sm uppercase tracking-wider">Competitive Analysis</h4>
            <span className={`text-2xl font-black ${scoreColor(d.competition.score)}`}>{d.competition.score}/10</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
              <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Direct</p>
              <p className="text-2xl font-black text-white mt-1">{d.competition.directCount || 0}</p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
              <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Indirect</p>
              <p className="text-2xl font-black text-white mt-1">{d.competition.indirectCount || 0}</p>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-center">
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Saturation</p>
              <p className="text-xs font-black text-white mt-1">{d.competition.saturation}</p>
            </div>
          </div>
          <div className="p-4 bg-white/3 border border-white/5 rounded-2xl">
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">🏆 TOP COMPETITOR</p>
            <p className="text-white/80 text-sm">{d.competition.topCompetitor}</p>
          </div>
          <div className="p-3 bg-white/3 border border-white/5 rounded-xl">
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">LANDSCAPE INSIGHT</p>
            <p className="text-white/70 text-xs">{d.competition.summary}</p>
          </div>
        </div>
      ) : null;

      case "uvp": return d.uvp ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-white text-sm uppercase tracking-wider">Unique Value Proposition</h4>
            <span className={`text-2xl font-black ${scoreColor(d.uvp.score)}`}>{d.uvp.score}/10</span>
          </div>
          {d.uvp.weakFlag && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <p className="text-amber-400 text-xs font-black">⚠ WEAK DIFFERENTIATION DETECTED — Strong UVP required before launch</p>
            </div>
          )}
          <div className="space-y-3">
            <div className="p-4 bg-red-500/5 border border-red-500/15 rounded-2xl">
              <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-2">❌ EXISTING SOLUTIONS FAIL AT</p>
              <p className="text-white/80 text-sm">{d.uvp.existingSolutionFlaw}</p>
            </div>
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl">
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">✅ YOUR DIFFERENTIATION</p>
              <p className="text-white/80 text-sm">{d.uvp.differentiation}</p>
            </div>
            <div className="p-4 bg-primary/5 border border-primary/15 rounded-2xl">
              <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2">🔄 WHY USERS WOULD SWITCH</p>
              <p className="text-white/80 text-sm">{d.uvp.switchReason}</p>
            </div>
          </div>
        </div>
      ) : null;

      case "revenue": return d.revenue ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-white text-sm uppercase tracking-wider">Business Model</h4>
            <span className={`text-2xl font-black ${scoreColor(d.revenue.score)}`}>{d.revenue.score}/10</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl">
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">💰 PRIMARY REVENUE STREAM</p>
              <p className="text-white/90 font-bold text-sm">{d.revenue.primaryStream}</p>
            </div>
            {d.revenue.secondaryStream && (
              <div className="p-4 bg-cyan-500/5 border border-cyan-500/15 rounded-2xl">
                <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-1">💸 SECONDARY STREAM</p>
                <p className="text-white/90 font-semibold text-sm">{d.revenue.secondaryStream}</p>
              </div>
            )}
          </div>
          <InfoPill label="Monetization Difficulty" value={d.revenue.monetizationDifficulty || "—"} />
          <div className="p-3 bg-white/3 border border-white/5 rounded-xl">
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">REVENUE INSIGHT</p>
            <p className="text-white/70 text-xs">{d.revenue.summary}</p>
          </div>
        </div>
      ) : null;

      case "technical": return d.technical ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-white text-sm uppercase tracking-wider">Technical Feasibility</h4>
            <span className={`text-2xl font-black ${scoreColor(d.technical.score)}`}>{d.technical.score}/10</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-violet-500/5 border border-violet-500/15 rounded-2xl text-center">
              <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-1">MVP BUILD TIME</p>
              <p className="text-3xl font-black text-white">{d.technical.mvpWeeks}</p>
              <p className="text-white/40 text-[10px]">WEEKS</p>
            </div>
            <div className="p-4 bg-white/3 border border-white/5 rounded-2xl text-center">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">COMPLEXITY</p>
              <p className="text-xl font-black text-white">{d.technical.complexity}</p>
            </div>
          </div>
          {d.technical.teamRequired?.length > 0 && (
            <div className="p-4 bg-white/3 border border-white/5 rounded-2xl">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3">👨‍💻 TEAM REQUIRED</p>
              <div className="flex flex-wrap gap-2">
                {d.technical.teamRequired.map((role: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl text-xs font-bold text-primary">{role}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null;

      case "founderFit": return d.founderFit ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-white text-sm uppercase tracking-wider">Founder-Market Fit</h4>
            <span className={`text-2xl font-black ${scoreColor(d.founderFit.score)}`}>{d.founderFit.score}/10</span>
          </div>
          {d.founderFit.requiredExpertise?.length > 0 && (
            <div className="p-4 bg-white/3 border border-white/5 rounded-2xl">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3">🎓 REQUIRED EXPERTISE</p>
              <div className="flex flex-wrap gap-2">
                {d.founderFit.requiredExpertise.map((e: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs font-bold text-amber-400">{e}</span>
                ))}
              </div>
            </div>
          )}
          <div className="p-4 bg-blue-500/5 border border-blue-500/15 rounded-2xl">
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">🏆 COMPETITIVE ADVANTAGE</p>
            <p className="text-white/80 text-sm">{d.founderFit.advantage}</p>
          </div>
        </div>
      ) : null;

      case "scalability": return d.scalability ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-white text-sm uppercase tracking-wider">Scalability Analysis</h4>
            <span className={`text-2xl font-black ${scoreColor(d.scalability.score)}`}>{d.scalability.score}/10</span>
          </div>
          <div className="space-y-3">
            {[
              { label: "🏙️ Local Potential", value: d.scalability.local, color: "bg-cyan-500/5 border-cyan-500/15" },
              { label: "🇮🇳 National Potential", value: d.scalability.national, color: "bg-blue-500/5 border-blue-500/15" },
              { label: "🌍 Global Potential", value: d.scalability.global, color: "bg-violet-500/5 border-violet-500/15" },
            ].map((item) => (
              <div key={item.label} className={`p-4 ${item.color} border rounded-2xl`}>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-white/80 text-sm font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null;

      case "risk": return d.risk ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-white text-sm uppercase tracking-wider">Risk Assessment</h4>
            <span className={`text-2xl font-black ${scoreColor(d.risk.score)}`}>{d.risk.score}/10</span>
          </div>
          <div className="space-y-3">
            {(d.risk.topRisks || []).map((r: any, i: number) => (
              <div key={i} className="p-4 bg-red-500/5 border border-red-500/15 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">{r.type} RISK</span>
                  <div className="flex gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black border ${badgeColor(r.probability)}`}>P: {r.probability}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black border ${badgeColor(r.severity)}`}>S: {r.severity}</span>
                  </div>
                </div>
                <p className="text-white/80 text-sm font-medium mb-2">{r.risk}</p>
                <div className="flex items-start gap-2">
                  <Shield className="h-3 w-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-emerald-400 text-xs">{r.mitigation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null;

      case "investor": return d.investorAppeal ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-white text-sm uppercase tracking-wider">Investor Attractiveness</h4>
            <span className={`text-2xl font-black ${scoreColor(d.investorAppeal.score)}`}>{d.investorAppeal.score}/10</span>
          </div>
          <div className="p-5 bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20 rounded-2xl">
            <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-2">💬 VC VERDICT</p>
            <p className="text-white/90 font-semibold italic text-sm">"{d.investorAppeal.vcVerdict}"</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoPill label="Defensibility" value={d.investorAppeal.defensibility || "—"} />
            <InfoPill label="Growth Potential" value={d.investorAppeal.growthPotential || "—"} />
          </div>
          <div className="p-3 bg-white/3 border border-white/5 rounded-xl">
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">INVESTOR SUMMARY</p>
            <p className="text-white/70 text-xs">{d.investorAppeal.summary}</p>
          </div>
        </div>
      ) : null;

      case "mvpRoadmap": return d.mvpRoadmap ? (
        <div className="space-y-4">
          <h4 className="font-black text-white text-sm uppercase tracking-wider">MVP Validation Roadmap</h4>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-violet-500 to-transparent" />
            <div className="space-y-4">
              {(d.mvpRoadmap.weeks || []).map((w: any, i: number) => (
                <div key={i} className="relative flex gap-4 pl-12">
                  <div className="absolute left-3 top-1 w-5 h-5 rounded-full bg-primary border-2 border-background flex items-center justify-center text-[10px] font-black text-white z-10">
                    {w.week}
                  </div>
                  <div className="flex-1 p-4 bg-white/3 border border-white/5 rounded-2xl hover:border-primary/30 transition-colors">
                    <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">WEEK {w.week}: {w.action}</p>
                    <p className="text-white/70 text-xs">{w.goal}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null;

      default: return null;
    }
  };

  return (
    <div className="space-y-8">

      {/* ── SECTION 1: Verdict Banner ──────────────────── */}
      <div className={`p-6 bg-gradient-to-br ${vc.bg} border-2 ${vc.border} rounded-3xl shadow-xl`}>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <ScoreGauge score={overallScore} size={120} />
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="text-2xl">{vc.icon}</span>
              <span className={`text-xl font-black uppercase tracking-widest ${vc.text}`}>{verdict}</span>
            </div>
            <p className={`text-sm font-bold ${vc.text} opacity-80 mb-3`}>{vc.label}</p>
            <div className="p-3 bg-black/20 rounded-xl border border-white/5">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">BRUTAL HONESTY</p>
              <p className="text-white/90 font-medium text-sm italic">"{data.brutalHonesty}"</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Validation Scorecard Grid ──────── */}
      <div>
        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">📊 Validation Scorecard</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {scorecardItems.map((item) => {
            const score = sc[item.key] ?? d[item.key]?.score ?? 0;
            const col = score >= 7 ? "border-emerald-500/20 bg-emerald-500/5" : score >= 5 ? "border-amber-500/20 bg-amber-500/5" : "border-red-500/20 bg-red-500/5";
            return (
              <button
                key={item.key}
                onClick={() => {
                  const tabKey = item.key === "investorAppeal" ? "investor" : item.key;
                  setActiveTab(tabKey);
                  document.getElementById("validation-deep-dive")?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`p-3 border rounded-2xl text-left transition-all duration-200 hover:scale-105 cursor-pointer ${col}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">{item.icon}</span>
                  <span className={`text-lg font-black ${scoreColor(score)}`}>{score}</span>
                </div>
                <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">{item.label}</p>
                <ScoreBar score={score} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 3: Market Size ─────────────────────── */}
      {data.marketSize && (
        <div>
          <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">📐 Market Size Estimation</h3>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { label: "TAM", value: data.marketSize.TAM, sub: "Total Addressable", color: "from-blue-500/20 to-blue-500/5 border-blue-500/20" },
              { label: "SAM", value: data.marketSize.SAM, sub: "Serviceable Available", color: "from-violet-500/20 to-violet-500/5 border-violet-500/20" },
              { label: "SOM", value: data.marketSize.SOM, sub: "Obtainable Market", color: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20" },
            ].map((m) => (
              <div key={m.label} className={`p-4 bg-gradient-to-b ${m.color} border rounded-2xl text-center`}>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{m.label}</p>
                <p className="text-white font-black text-lg mt-1">{m.value}</p>
                <p className="text-white/30 text-[9px] mt-1">{m.sub}</p>
              </div>
            ))}
          </div>
          {data.marketSize.assumptions?.length > 0 && (
            <div className="p-3 bg-white/3 border border-white/5 rounded-xl">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">ASSUMPTIONS</p>
              <div className="flex flex-col gap-1">
                {data.marketSize.assumptions.map((a: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                    <span className="text-primary font-black flex-shrink-0">→</span>{a}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 4: Deep Dive Tabs ──────────────────── */}
      <div id="validation-deep-dive">
        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">🔬 12-Dimension Deep Dive</h3>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {dimTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 border
                ${activeTab === tab.id
                  ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                  : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-5 bg-white/3 border border-white/8 rounded-3xl min-h-[200px]">
          {renderDimension()}
        </div>
      </div>

      {/* ── SECTION 5: SWOT ────────────────────────────── */}
      {data.swot && (
        <div>
          <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">⚡ SWOT Analysis</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "strengths",    label: "Strengths",    icon: "💪", color: "bg-emerald-500/5 border-emerald-500/20", pill: "bg-emerald-500/10 text-emerald-400" },
              { key: "weaknesses",   label: "Weaknesses",   icon: "⚠️",  color: "bg-red-500/5 border-red-500/20",      pill: "bg-red-500/10 text-red-400"     },
              { key: "opportunities",label: "Opportunities",icon: "🚀", color: "bg-blue-500/5 border-blue-500/20",      pill: "bg-blue-500/10 text-blue-400"   },
              { key: "threats",      label: "Threats",      icon: "🛑", color: "bg-amber-500/5 border-amber-500/20",    pill: "bg-amber-500/10 text-amber-400" },
            ].map((q) => (
              <div key={q.key} className={`p-4 ${q.color} border rounded-2xl`}>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-3">{q.icon} {q.label}</p>
                <div className="space-y-2">
                  {(data.swot[q.key] || []).map((item: string, i: number) => (
                    <div key={i} className={`px-3 py-1.5 ${q.pill} rounded-xl text-[11px] font-medium leading-snug`}>{item}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 6: Recommendations ─────────────────── */}
      {data.recommendations && (
        <div>
          <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">🎯 Actionable Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.recommendations.top5Improvements?.length > 0 && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-3">🔧 TOP 5 IMPROVEMENTS</p>
                <div className="space-y-2">
                  {data.recommendations.top5Improvements.map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-white/80">
                      <span className="bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black flex-shrink-0 mt-0.5">{i+1}</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-3">
              {data.recommendations.fastestExperiments?.length > 0 && (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-3">⚡ FASTEST EXPERIMENTS</p>
                  <div className="space-y-1.5">
                    {data.recommendations.fastestExperiments.map((e: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-white/80">
                        <Zap className="h-3 w-3 text-emerald-400 flex-shrink-0 mt-0.5" />{e}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.recommendations.niches?.length > 0 && (
                <div className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-2xl">
                  <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-2">🎯 NICHE OPPORTUNITIES</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.recommendations.niches.map((n: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-violet-500/10 border border-violet-500/20 rounded-lg text-[10px] font-bold text-violet-300">{n}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {data.recommendations.acquisitionChannels?.length > 0 && (
              <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl">
                <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-3">📣 ACQUISITION CHANNELS</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.recommendations.acquisitionChannels.map((c: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-[10px] font-bold text-cyan-300">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {data.recommendations.pricingSuggestions?.length > 0 && (
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-3">💰 PRICING SUGGESTIONS</p>
                <div className="space-y-1.5">
                  {data.recommendations.pricingSuggestions.map((p: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-white/80">
                      <IndianRupee className="h-3 w-3 text-amber-400 flex-shrink-0 mt-0.5" />{p}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SECTION 7: Government Funding CTA ─────────── */}
      {data.qualifiesForGovtFunding && (
        <div className="p-5 bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-2xl border-2 border-green-500/40 shadow-xl shadow-green-500/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-500 p-2 rounded-xl">
              <IndianRupee className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-green-400 font-black text-sm uppercase tracking-widest">🎉 Qualifies for Government Funding!</p>
              <p className="text-white/60 text-xs">{data.govtFundingReason}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Startup India Seed Fund (₹50L)", "NIDHI-PRAYAS (₹10L)", "DPIIT Recognition"].map((s) => (
              <span key={s} className="px-3 py-1 bg-green-500/20 rounded-full text-green-300 text-xs font-bold">{s}</span>
            ))}
          </div>
          <p className="text-green-400 font-black text-xs mt-3 uppercase tracking-wider">→ Run the "Govt Scheme Matching" module for your personalized application checklist</p>
        </div>
      )}
    </div>
  );
}


// ── Competitors Result Renderer ────────────────────────
export function CompetitorsResult({ data }: { data: any }) {
  const [filter, setFilter] = useState<'all' | 'direct' | 'indirect' | 'open-source' | 'startup' | 'enterprise'>('all');
  const [sort, setSort] = useState<'similarity' | 'funded' | 'popularity' | 'newest' | 'open-source'>('similarity');
  const [search, setSearch] = useState('');

  // ── Logo URL Helper ──────────────────────────────────
  const getLogoUrl = (website: string) => {
    if (!website) return null;
    try {
      const clean = website.replace('https://', '').replace('http://', '').split('/')[0];
      return `https://logo.clearbit.com/${clean}`;
    } catch (e) {
      return null;
    }
  };

  // ── Badge Style Helpers ──────────────────────────────
  const getCategoryBadge = (category: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('direct')) return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
    if (cat.includes('indirect')) return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    if (cat.includes('open source') || cat.includes('open-source')) return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    if (cat.includes('emerging')) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    return 'bg-white/5 border-white/10 text-white/60';
  };

  const getTypeBadge = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('startup')) return 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400';
    if (t.includes('sme')) return 'bg-violet-500/10 border-violet-500/20 text-violet-400';
    if (t.includes('enterprise')) return 'bg-pink-500/10 border-pink-500/20 text-pink-400';
    if (t.includes('open source') || t.includes('open-source')) return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    return 'bg-white/5 border-white/10 text-white/50';
  };

  // ── Funding Score for Sorting ──────────────────────
  const getFundingScore = (stage: string) => {
    if (!stage) return 0;
    const s = stage.toLowerCase();
    if (s.includes('public') || s.includes('ipo')) return 6;
    if (s.includes('series c') || s.includes('series d') || s.includes('late')) return 5;
    if (s.includes('series b')) return 4;
    if (s.includes('series a')) return 3;
    if (s.includes('seed') || s.includes('angel') || s.includes('pre-seed')) return 2;
    if (s.includes('bootstrapped')) return 1;
    return 0;
  };

  // ── Filtering logic ──────────────────────────────────
  const list = data.competitors || [];
  
  const filtered = list.filter((c: any) => {
    const nameMatch = c.name?.toLowerCase().includes(search.toLowerCase()) || 
                      c.shortDescription?.toLowerCase().includes(search.toLowerCase());
    if (!nameMatch) return false;

    const cat = (c.category || c.type || '').toLowerCase();
    const type = (c.companyType || '').toLowerCase();

    if (filter === 'direct') return cat.includes('direct');
    if (filter === 'indirect') return cat.includes('indirect');
    if (filter === 'open-source') return cat.includes('open source') || cat.includes('open-source') || type.includes('open source') || type.includes('open-source');
    if (filter === 'startup') return type.includes('startup');
    if (filter === 'enterprise') return type.includes('enterprise');
    return true;
  });

  // ── Sorting logic ────────────────────────────────────
  const sorted = [...filtered].sort((a: any, b: any) => {
    if (sort === 'similarity') {
      return (b.similarityScore || 0) - (a.similarityScore || 0);
    }
    if (sort === 'funded') {
      return getFundingScore(b.fundingStatus || b.funding) - getFundingScore(a.fundingStatus || a.funding);
    }
    if (sort === 'popularity') {
      const popB = b.githubDetails?.stars || (b.similarityScore / 10);
      const popA = a.githubDetails?.stars || (a.similarityScore / 10);
      return popB - popA;
    }
    if (sort === 'newest') {
      const isNewB = (b.category || '').toLowerCase().includes('emerging') ? 1 : 0;
      const isNewA = (a.category || '').toLowerCase().includes('emerging') ? 1 : 0;
      if (isNewB !== isNewA) return isNewB - isNewA;
      return (b.similarityScore || 0) - (a.similarityScore || 0);
    }
    if (sort === 'open-source') {
      const isOSB = ((b.category || '').toLowerCase().includes('open source') || (b.companyType || '').toLowerCase().includes('open source')) ? 1 : 0;
      const isOSA = ((a.category || '').toLowerCase().includes('open source') || (a.companyType || '').toLowerCase().includes('open source')) ? 1 : 0;
      if (isOSB !== isOSA) return isOSB - isOSA;
      return (b.similarityScore || 0) - (a.similarityScore || 0);
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      
      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Search competitors..."
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-white/40 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 flex-shrink-0">
              <ArrowUpDown className="h-3.5 w-3.5" /> Sort By
            </span>
            <select
              className="w-full md:w-48 bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
              value={sort}
              onChange={(e: any) => setSort(e.target.value)}
            >
              <option value="similarity" className="bg-secondary text-white">Highest Similarity</option>
              <option value="funded" className="bg-secondary text-white">Most Funded</option>
              <option value="popularity" className="bg-secondary text-white">Most Popular</option>
              <option value="newest" className="bg-secondary text-white">Emerging Startups</option>
              <option value="open-source" className="bg-secondary text-white">Open Source First</option>
            </select>
          </div>

        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-3">
          <span className="text-white/40 text-[10px] font-black uppercase tracking-widest mr-2 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Filter:
          </span>
          {[
            { id: 'all', label: 'All' },
            { id: 'direct', label: 'Direct' },
            { id: 'indirect', label: 'Indirect' },
            { id: 'open-source', label: 'Open Source' },
            { id: 'startup', label: 'Startups' },
            { id: 'enterprise', label: 'Enterprise' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`
                px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 border
                ${filter === tab.id 
                  ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                  : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Competitors */}
      {sorted.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/3">
          <p className="text-white/50 font-bold">No competitors match your filters.</p>
          <button onClick={() => { setFilter('all'); setSearch(''); }} className="mt-2 text-xs text-primary font-black uppercase tracking-widest hover:underline">Clear Filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sorted.map((c: any, idx: number) => {
            const logo = getLogoUrl(c.website);
            const cat = c.category || c.type || 'Direct';
            const features = Array.isArray(c.keyFeatures) 
              ? c.keyFeatures 
              : (c.keyFeature ? [c.keyFeature] : []);
            
            return (
              <div 
                key={idx}
                className="group relative flex flex-col p-6 glass-panel bg-white/3 border border-white/10 hover:border-violet-500/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] rounded-3xl transition-all duration-300"
              >
                
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Logo */}
                    <div className="h-11 w-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                      {logo ? (
                        <img 
                          src={logo} 
                          alt={c.name}
                          className="h-8 w-8 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : null}
                      {/* Initial fallback */}
                      <span className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-purple-500/10 text-white font-bold text-sm flex items-center justify-center pointer-events-none uppercase">
                        {c.name?.[0] || 'C'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-black text-white text-base leading-tight group-hover:text-primary transition-colors flex items-center gap-1">
                        {c.name}
                      </h3>
                      {c.website ? (
                        <a 
                          href={c.website.startsWith('http') ? c.website : `https://${c.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-white/40 hover:text-white text-xs flex items-center gap-1 font-medium transition-colors"
                        >
                          {c.website.replace('https://', '').replace('http://', '').split('/')[0]} <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-white/20 text-xs italic">No Website</span>
                      )}
                    </div>
                  </div>

                  {/* Similarity Badge */}
                  <div className="flex flex-col items-end">
                    <div className="px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black text-primary uppercase tracking-widest">
                      {c.similarityScore || 0}% Match
                    </div>
                  </div>
                </div>

                {/* Metadata Badges */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  <span className={`px-2 py-0.5 border rounded-lg text-[9px] font-black uppercase ${getCategoryBadge(cat)}`}>
                    {cat}
                  </span>
                  <span className={`px-2 py-0.5 border rounded-lg text-[9px] font-black uppercase ${getTypeBadge(c.companyType)}`}>
                    {c.companyType || 'Startup'}
                  </span>
                  {c.country && (
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-white/60 uppercase flex items-center gap-1">
                      <Globe className="h-3 w-3 text-white/40" /> {c.country}
                    </span>
                  )}
                  {(c.fundingStatus || c.funding) && (
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-cyan-400 uppercase">
                      {c.fundingStatus || c.funding}
                    </span>
                  )}
                </div>

                {/* Descriptions */}
                <div className="space-y-3 mt-4 text-xs flex-1">
                  <div className="p-3 bg-white/3 rounded-2xl border border-white/5">
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest block mb-1">SHORT DESCRIPTION</span>
                    <p className="text-white/80 font-medium leading-relaxed">{c.shortDescription}</p>
                  </div>
                  
                  <div className="p-3 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                    <span className="text-[8px] font-black text-amber-400/80 uppercase tracking-widest block mb-1">WHY THEY COMPETE</span>
                    <p className="text-white/80 font-medium leading-relaxed">{c.whyItIsACompetitor}</p>
                  </div>
                </div>

                {/* Key Features & Pricing */}
                <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                  {features.length > 0 && (
                    <div>
                      <span className="text-[8px] font-black text-white/30 uppercase tracking-widest block mb-1.5">KEY FEATURES</span>
                      <div className="flex flex-wrap gap-1.5">
                        {features.map((f: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-white/5 border border-white/5 rounded-lg text-[10px] font-medium text-white/70">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/40">Pricing Model:</span>
                    <strong className="text-white/80 uppercase tracking-wider text-[10px]">{c.pricingModel || c.pricing || 'Paid'}</strong>
                  </div>
                </div>

                {/* GitHub details (if open source) */}
                {c.githubDetails && c.githubDetails.repoName && (
                  <div className="mt-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">
                        <Github className="h-3.5 w-3.5" /> Open Source Codebase
                      </span>
                      <a 
                        href={`https://github.com/${c.githubDetails.repoName}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5 font-bold"
                      >
                        {c.githubDetails.repoName} <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="flex items-center gap-1.5 bg-black/20 p-2 rounded-lg">
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        <div>
                          <span className="text-white/40 block text-[8px] uppercase tracking-wider">STARS</span>
                          <span className="text-white font-bold">{c.githubDetails.stars?.toLocaleString() || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-black/20 p-2 rounded-lg">
                        <Shield className="h-3 w-3 text-emerald-400" />
                        <div>
                          <span className="text-white/40 block text-[8px] uppercase tracking-wider">LICENSE</span>
                          <span className="text-white font-bold">{c.githubDetails.license || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="bg-black/20 p-2 rounded-lg">
                        <span className="text-white/40 block text-[8px] uppercase tracking-wider">LAST UPDATE</span>
                        <span className="text-white font-bold">{c.githubDetails.lastUpdated || 'N/A'}</span>
                      </div>
                      <div className="bg-black/20 p-2 rounded-lg">
                        <span className="text-white/40 block text-[8px] uppercase tracking-wider">CONTRIBUTORS</span>
                        <span className="text-white font-bold">{c.githubDetails.activeContributors || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Strategic Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
          <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2">🎯 DIFFERENTIATION STRATEGY</p>
          <p className="text-white/80 text-sm">{data.differentiationStrategy}</p>
        </div>
        <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
          <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-2">🌊 BLUE OCEAN OPPORTUNITY</p>
          <p className="text-white/80 text-sm">{data.blueOceanOpportunity}</p>
        </div>
        <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
          <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-2">💰 PRICING RECOMMENDATION</p>
          <p className="text-white/80 text-sm">{data.pricingRecommendation}</p>
        </div>
        <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">🏆 WIN CONDITION</p>
          <p className="text-white/80 text-sm">{data.winCondition}</p>
        </div>
      </div>
    </div>
  );
}

// ── Pitch Deck Result Renderer ─────────────────────────
export function PitchDeckResult({ data, idea }: { data: any; idea: string }) {
  const [expanded, setExpanded] = useState<number | null>(0);
  const slideColors = ["bg-blue-500/10", "bg-violet-500/10", "bg-cyan-500/10", "bg-emerald-500/10", "bg-amber-500/10", "bg-orange-500/10", "bg-pink-500/10", "bg-red-500/10", "bg-sky-500/10", "bg-yellow-500/10", "bg-fuchsia-500/10", "bg-teal-500/10"];

  const downloadDeck = () => {
    const content = data.slides?.map((s: any) =>
      `## SLIDE ${s.slideNumber}: ${s.title}\n\n**${s.headline}**\n\n${s.content}\n\n*Speaker Note: ${s.speakerNote}*\n`
    ).join("\n---\n\n");
    const full = `# ${data.deckTitle || idea}\n*${data.tagline || ""}*\n\n---\n\n${content}\n\n---\n\n**Investor Fit Note:** ${data.investorFitNote || ""}`;
    const blob = new Blob([full], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PitchDeck_${(data.deckTitle || idea).replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPPTX = async () => {
    try {
      const pptxgen = (await import("pptxgenjs")).default;
      const pptx = new pptxgen();
      const shapes = (pptx as any).shapes;

      // Configure presentation to 16:9 widescreen
      pptx.layout = 'LAYOUT_16x9';

      // 1. Cover Slide
      const coverSlide = pptx.addSlide();
      coverSlide.background = { color: "0B0F19" }; // Dark Slate

      // Left Accent Border
      coverSlide.addShape(shapes.RECTANGLE, {
        x: 0.0,
        y: 0.0,
        w: 0.25,
        h: 7.5,
        fill: { color: "3B82F6" }
      });

      // Add Subtitle Header
      coverSlide.addText("INVESTOR PITCH PRESENTATION", {
        x: 1.0,
        y: 2.2,
        w: 11.3,
        h: 0.4,
        fontSize: 12,
        bold: true,
        color: "3B82F6", // Primary Blue
        fontFace: "Arial",
        charSpacing: 2
      });

      // Add Company Name Title
      coverSlide.addText(data.deckTitle || idea, {
        x: 1.0,
        y: 2.7,
        w: 11.3,
        h: 1.2,
        fontSize: 44,
        bold: true,
        color: "FFFFFF",
        fontFace: "Arial"
      });

      // Add Tagline
      coverSlide.addText(data.tagline || "", {
        x: 1.0,
        y: 4.0,
        w: 11.3,
        h: 1.0,
        fontSize: 18,
        color: "94A3B8", // Soft Gray
        fontFace: "Arial",
        italic: true
      });

      // Add Footer
      coverSlide.addText(`Prepared for Potential Investors  |  Confidential`, {
        x: 1.0,
        y: 5.8,
        w: 11.3,
        h: 0.4,
        fontSize: 11,
        color: "475569", // Darker slate
        fontFace: "Arial"
      });

      if (data.tagline) {
        coverSlide.addNotes(`Elevator Pitch: ${data.tagline}`);
      }

      // 2. Generate content slides dynamically based on their layouts
      data.slides?.forEach((slide: any) => {
        const newSlide = pptx.addSlide();
        newSlide.background = { color: "0B0F19" };

        const layout = slide.layout || "";

        if (layout === "cover" || slide.slideNumber === 1) {
          // Left Accent Border
          newSlide.addShape(shapes.RECTANGLE, {
            x: 0.0,
            y: 0.0,
            w: 0.25,
            h: 7.5,
            fill: { color: "3B82F6" }
          });

          // Add Subtitle Header
          newSlide.addText("INVESTOR PITCH PRESENTATION", {
            x: 1.0,
            y: 2.2,
            w: 11.3,
            h: 0.4,
            fontSize: 12,
            bold: true,
            color: "3B82F6",
            fontFace: "Arial",
            charSpacing: 2
          });

          // Add Company Name Title
          newSlide.addText(data.deckTitle || idea, {
            x: 1.0,
            y: 2.7,
            w: 11.3,
            h: 1.2,
            fontSize: 44,
            bold: true,
            color: "FFFFFF",
            fontFace: "Arial"
          });

          // Add Tagline
          newSlide.addText(data.tagline || "", {
            x: 1.0,
            y: 4.0,
            w: 11.3,
            h: 1.0,
            fontSize: 18,
            color: "94A3B8",
            fontFace: "Arial",
            italic: true
          });

          // Add Footer
          newSlide.addText(`Prepared for Potential Investors  |  Confidential`, {
            x: 1.0,
            y: 5.8,
            w: 11.3,
            h: 0.4,
            fontSize: 11,
            color: "475569",
            fontFace: "Arial"
          });

          if (slide.speakerNote) {
            newSlide.addNotes(slide.speakerNote);
          }
          return;
        }

        // Slide number / Category Header
        newSlide.addText(`SLIDE ${slide.slideNumber}  |  ${slide.title.toUpperCase()}`, {
          x: 0.8,
          y: 0.4,
          w: 11.7,
          h: 0.3,
          fontSize: 11,
          bold: true,
          color: "3B82F6",
          fontFace: "Arial",
          charSpacing: 1
        });

        // Slide Headline
        newSlide.addText(slide.headline, {
          x: 0.8,
          y: 0.8,
          w: 11.7,
          h: 0.7,
          fontSize: 24,
          bold: true,
          color: "FFFFFF",
          fontFace: "Arial"
        });

        // Thin horizontal divider line
        newSlide.addShape(shapes.RECTANGLE, {
          x: 0.8,
          y: 1.6,
          w: 11.7,
          h: 0.02,
          fill: { color: "1E293B" }
        });

        // Parse and render bullet points
        const contentLines = slide.content
          ? slide.content.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0)
          : [];

        const count = contentLines.length;

        if (count > 0) {
          if (layout === "verdict") {
            // Verdict layout: Score circle on the left, details on the right
            const scoreLine = contentLines.find((l: string) => l.toLowerCase().includes("score"));
            const verdictLine = contentLines.find((l: string) => l.toLowerCase().includes("verdict"));
            const honestyLine = contentLines.find((l: string) => l.toLowerCase().includes("honesty") || l.toLowerCase().includes("brutal"));

            let scoreNum = "80";
            if (scoreLine) {
              const scoreMatch = scoreLine.match(/\b([1-9]\d?|100)\b/);
              if (scoreMatch) scoreNum = scoreMatch[1];
            }

            // Left score circle card
            newSlide.addShape(shapes.ROUNDED_RECTANGLE, {
              x: 0.8,
              y: 2.0,
              w: 3.5,
              h: 4.4,
              fill: { color: "111827" },
              line: { color: "1E293B", width: 1.5 }
            });

            const circleSize = 1.8;
            newSlide.addShape(shapes.OVAL, {
              x: 0.8 + (3.5 - circleSize) / 2,
              y: 2.6,
              w: circleSize,
              h: circleSize,
              fill: { color: "1E293B" },
              line: { color: parseInt(scoreNum) >= 70 ? "10B981" : parseInt(scoreNum) >= 45 ? "F59E0B" : "EF4444", width: 3 }
            });

            newSlide.addText(scoreNum, {
              x: 0.8 + (3.5 - circleSize) / 2,
              y: 2.6,
              w: circleSize,
              h: circleSize - 0.3,
              fontSize: 36,
              bold: true,
              color: "FFFFFF",
              align: "center",
              valign: "middle"
            });

            newSlide.addText("/ 100", {
              x: 0.8 + (3.5 - circleSize) / 2,
              y: 3.8,
              w: circleSize,
              h: 0.3,
              fontSize: 12,
              color: "94A3B8",
              align: "center"
            });

            newSlide.addText("CONFIDENCE SCORE", {
              x: 0.9,
              y: 4.8,
              w: 3.3,
              h: 0.4,
              fontSize: 11,
              bold: true,
              color: "3B82F6",
              align: "center",
              charSpacing: 1
            });

            // Right cards (Verdict & Brutal Honesty)
            let rightY = 2.0;
            const rightW = 7.7;
            const rightX = 4.8;

            const renderRightCard = (line: string, label: string, color: string) => {
              if (!line) return;
              const cleanLine = line.replace(/^[-*]\s+/, "");
              const match = cleanLine.match(/^\*\*(.*?)\*\*:\s*(.*)$/);
              const desc = match ? match[2] : cleanLine;

              newSlide.addShape(shapes.ROUNDED_RECTANGLE, {
                x: rightX,
                y: rightY,
                w: rightW,
                h: 2.05,
                fill: { color: "111827" },
                line: { color: "1E293B", width: 1.5 }
              });

              newSlide.addShape(shapes.RECTANGLE, {
                x: rightX + 0.2,
                y: rightY + 0.25,
                w: 0.05,
                h: 0.3,
                fill: { color: color }
              });

              newSlide.addText(label.toUpperCase(), {
                x: rightX + 0.35,
                y: rightY + 0.2,
                w: rightW - 0.6,
                h: 0.4,
                fontSize: 12,
                bold: true,
                color: color,
                fontFace: "Arial",
                valign: "middle"
              });

              newSlide.addText(desc, {
                x: rightX + 0.35,
                y: rightY + 0.7,
                w: rightW - 0.7,
                h: 1.1,
                fontSize: 12,
                color: "CBD5E1",
                fontFace: "Arial",
                valign: "top",
                lineSpacing: 16
              });

              rightY += 2.35;
            };

            renderRightCard(verdictLine || "", "Market Verdict", "10B981");
            renderRightCard(honestyLine || "", "Brutal Honesty", "3B82F6");
          }
          else if (layout === "market-size") {
            // Market Size layout: 3 columns for TAM, SAM, SOM
            let colW = 3.65;
            let colGap = count > 1 ? (11.7 - (count * colW)) / (count - 1) : 0;
            if (count === 1) colW = 11.7;

            contentLines.forEach((line: string, idx: number) => {
              const cleanLine = line.replace(/^[-*]\s+/, "");
              const match = cleanLine.match(/^\*\*(.*?)\*\*:\s*(.*)$/);
              
              let titleText = "";
              let descText = cleanLine;
              
              if (match) {
                titleText = match[1];
                descText = match[2];
              }

              const colX = 0.8 + idx * (colW + colGap);

              newSlide.addShape(shapes.ROUNDED_RECTANGLE, {
                x: colX,
                y: 2.0,
                w: colW,
                h: 4.4,
                fill: { color: idx === 2 ? "1E3A8A" : "111827" }, // Blue background for SOM to focus target
                line: { color: idx === 2 ? "3B82F6" : "1E293B", width: idx === 2 ? 2.5 : 1.5 }
              });

              newSlide.addShape(shapes.RECTANGLE, {
                x: colX + 0.2,
                y: 2.2,
                w: 0.4,
                h: 0.04,
                fill: { color: "3B82F6" }
              });

              if (titleText) {
                newSlide.addText(titleText.toUpperCase(), {
                  x: colX + 0.2,
                  y: 2.35,
                  w: colW - 0.4,
                  h: 0.4,
                  fontSize: 12,
                  bold: true,
                  color: "3B82F6",
                  fontFace: "Arial",
                  valign: "top"
                });

                newSlide.addText(descText, {
                  x: colX + 0.2,
                  y: 2.9,
                  w: colW - 0.4,
                  h: 3.2,
                  fontSize: 14,
                  color: "FFFFFF",
                  fontFace: "Arial",
                  valign: "top",
                  lineSpacing: 18
                });
              } else {
                newSlide.addText(descText, {
                  x: colX + 0.2,
                  y: 2.35,
                  w: colW - 0.4,
                  h: 3.75,
                  fontSize: 14,
                  color: "FFFFFF",
                  fontFace: "Arial",
                  valign: "top",
                  lineSpacing: 18
                });
              }
            });
          }
          else if (layout === "opportunities") {
            // 3 columns layout for Opportunities
            let colW = 3.65;
            let colGap = count > 1 ? (11.7 - (count * colW)) / (count - 1) : 0;
            if (count === 1) colW = 11.7;

            contentLines.forEach((line: string, idx: number) => {
              const cleanLine = line.replace(/^[-*]\s+/, "");
              const match = cleanLine.match(/^\*\*(.*?)\*\*:\s*(.*)$/);
              
              let titleText = "";
              let descText = cleanLine;
              
              if (match) {
                titleText = match[1];
                descText = match[2];
              }

              const colX = 0.8 + idx * (colW + colGap);

              newSlide.addShape(shapes.ROUNDED_RECTANGLE, {
                x: colX,
                y: 2.0,
                w: colW,
                h: 4.4,
                fill: { color: "111827" },
                line: { color: "1E293B", width: 1.5 }
              });

              newSlide.addShape(shapes.RECTANGLE, {
                x: colX + 0.2,
                y: 2.2,
                w: 0.05,
                h: 0.35,
                fill: { color: "10B981" } // Green accent for opportunities
              });

              if (titleText) {
                newSlide.addText(titleText.toUpperCase(), {
                  x: colX + 0.35,
                  y: 2.2,
                  w: colW - 0.6,
                  h: 0.4,
                  fontSize: 13,
                  bold: true,
                  color: "10B981",
                  fontFace: "Arial",
                  valign: "middle"
                });

                newSlide.addText(descText, {
                  x: colX + 0.35,
                  y: 2.9,
                  w: colW - 0.7,
                  h: 3.2,
                  fontSize: 12,
                  color: "CBD5E1",
                  fontFace: "Arial",
                  valign: "top",
                  lineSpacing: 18
                });
              } else {
                newSlide.addText(descText, {
                  x: colX + 0.35,
                  y: 2.2,
                  w: colW - 0.7,
                  h: 4.0,
                  fontSize: 13,
                  color: "CBD5E1",
                  fontFace: "Arial",
                  valign: "top",
                  lineSpacing: 18
                });
              }
            });
          }
          else if (layout === "niche") {
            // Niche layout: Target Customer card on left, Underserved Need & Launch Strategy on right
            let colW = 5.6;
            let colGap = 0.5;

            contentLines.forEach((line: string, idx: number) => {
              if (idx >= 2) return; // limit to 2 columns for symmetry
              const cleanLine = line.replace(/^[-*]\s+/, "");
              const match = cleanLine.match(/^\*\*(.*?)\*\*:\s*(.*)$/);
              
              let titleText = "";
              let descText = cleanLine;
              
              if (match) {
                titleText = match[1];
                descText = match[2];
              }

              const colX = 0.8 + idx * (colW + colGap);

              newSlide.addShape(shapes.ROUNDED_RECTANGLE, {
                x: colX,
                y: 2.0,
                w: colW,
                h: 4.4,
                fill: { color: "111827" },
                line: { color: "1E293B", width: 1.5 }
              });

              newSlide.addShape(shapes.RECTANGLE, {
                x: colX + 0.2,
                y: 2.2,
                w: 0.05,
                h: 0.35,
                fill: { color: "3B82F6" }
              });

              if (titleText) {
                newSlide.addText(titleText.toUpperCase(), {
                  x: colX + 0.35,
                  y: 2.2,
                  w: colW - 0.6,
                  h: 0.4,
                  fontSize: 14,
                  bold: true,
                  color: "3B82F6",
                  fontFace: "Arial",
                  valign: "middle"
                });

                newSlide.addText(descText, {
                  x: colX + 0.35,
                  y: 2.8,
                  w: colW - 0.7,
                  h: 3.3,
                  fontSize: 13,
                  color: "CBD5E1",
                  fontFace: "Arial",
                  valign: "top",
                  lineSpacing: 18
                });
              } else {
                newSlide.addText(descText, {
                  x: colX + 0.35,
                  y: 2.2,
                  w: colW - 0.7,
                  h: 4.0,
                  fontSize: 13,
                  color: "CBD5E1",
                  fontFace: "Arial",
                  valign: "top",
                  lineSpacing: 18
                });
              }
            });
          }
          else if (layout === "signals") {
            // Signals layout: Reddit (social) vs Google Trends (search volume) 2-column cards
            let colW = 5.6;
            let colGap = 0.5;

            contentLines.forEach((line: string, idx: number) => {
              if (idx >= 2) return;
              const cleanLine = line.replace(/^[-*]\s+/, "");
              const match = cleanLine.match(/^\*\*(.*?)\*\*:\s*(.*)$/);
              
              let titleText = "";
              let descText = cleanLine;
              
              if (match) {
                titleText = match[1];
                descText = match[2];
              }

              const colX = 0.8 + idx * (colW + colGap);

              newSlide.addShape(shapes.ROUNDED_RECTANGLE, {
                x: colX,
                y: 2.0,
                w: colW,
                h: 4.4,
                fill: { color: "111827" },
                line: { color: "1E293B", width: 1.5 }
              });

              newSlide.addShape(shapes.RECTANGLE, {
                x: colX + 0.2,
                y: 2.2,
                w: 0.05,
                h: 0.35,
                fill: { color: idx === 0 ? "3B82F6" : "10B981" }
              });

              if (titleText) {
                newSlide.addText(titleText.toUpperCase(), {
                  x: colX + 0.35,
                  y: 2.2,
                  w: colW - 0.6,
                  h: 0.4,
                  fontSize: 14,
                  bold: true,
                  color: idx === 0 ? "3B82F6" : "10B981",
                  fontFace: "Arial",
                  valign: "middle"
                });

                newSlide.addText(descText, {
                  x: colX + 0.35,
                  y: 2.8,
                  w: colW - 0.7,
                  h: 3.3,
                  fontSize: 13,
                  color: "CBD5E1",
                  fontFace: "Arial",
                  valign: "top",
                  lineSpacing: 18
                });
              } else {
                newSlide.addText(descText, {
                  x: colX + 0.35,
                  y: 2.2,
                  w: colW - 0.7,
                  h: 4.0,
                  fontSize: 13,
                  color: "CBD5E1",
                  fontFace: "Arial",
                  valign: "top",
                  lineSpacing: 18
                });
              }
            });
          }
          else if (layout === "risks") {
            // Risks layout: 2-column cards accented with red/orange colors
            let colW = 5.6;
            let colGap = 0.5;

            contentLines.forEach((line: string, idx: number) => {
              if (idx >= 2) return;
              const cleanLine = line.replace(/^[-*]\s+/, "");
              const match = cleanLine.match(/^\*\*(.*?)\*\*:\s*(.*)$/);
              
              let titleText = "";
              let descText = cleanLine;
              
              if (match) {
                titleText = match[1];
                descText = match[2];
              }

              const colX = 0.8 + idx * (colW + colGap);

              newSlide.addShape(shapes.ROUNDED_RECTANGLE, {
                x: colX,
                y: 2.0,
                w: colW,
                h: 4.4,
                fill: { color: "111827" },
                line: { color: "1E293B", width: 1.5 }
              });

              newSlide.addShape(shapes.RECTANGLE, {
                x: colX + 0.2,
                y: 2.2,
                w: 0.05,
                h: 0.35,
                fill: { color: "EF4444" } // Red warning color
              });

              if (titleText) {
                newSlide.addText(titleText.toUpperCase(), {
                  x: colX + 0.35,
                  y: 2.2,
                  w: colW - 0.6,
                  h: 0.4,
                  fontSize: 14,
                  bold: true,
                  color: "EF4444",
                  fontFace: "Arial",
                  valign: "middle"
                });

                newSlide.addText(descText, {
                  x: colX + 0.35,
                  y: 2.8,
                  w: colW - 0.7,
                  h: 3.3,
                  fontSize: 13,
                  color: "CBD5E1",
                  fontFace: "Arial",
                  valign: "top",
                  lineSpacing: 18
                });
              } else {
                newSlide.addText(descText, {
                  x: colX + 0.35,
                  y: 2.2,
                  w: colW - 0.7,
                  h: 4.0,
                  fontSize: 13,
                  color: "CBD5E1",
                  fontFace: "Arial",
                  valign: "top",
                  lineSpacing: 18
                });
              }
            });
          }
          else if (layout === "govt-schemes") {
            // Govt Schemes layout: 3 cards showing schemes/grants details
            let colW = 3.65;
            let colGap = count > 1 ? (11.7 - (count * colW)) / (count - 1) : 0;
            if (count === 1) colW = 11.7;

            contentLines.forEach((line: string, idx: number) => {
              const cleanLine = line.replace(/^[-*]\s+/, "");
              const match = cleanLine.match(/^\*\*(.*?)\*\*:\s*(.*)$/);
              
              let titleText = "";
              let descText = cleanLine;
              
              if (match) {
                titleText = match[1];
                descText = match[2];
              }

              const colX = 0.8 + idx * (colW + colGap);

              newSlide.addShape(shapes.ROUNDED_RECTANGLE, {
                x: colX,
                y: 2.0,
                w: colW,
                h: 4.4,
                fill: { color: "111827" },
                line: { color: "1E293B", width: 1.5 }
              });

              newSlide.addShape(shapes.RECTANGLE, {
                x: colX + 0.2,
                y: 2.2,
                w: 0.05,
                h: 0.35,
                fill: { color: "10B981" }
              });

              if (titleText) {
                newSlide.addText(titleText.toUpperCase(), {
                  x: colX + 0.35,
                  y: 2.2,
                  w: colW - 0.6,
                  h: 0.4,
                  fontSize: 13,
                  bold: true,
                  color: "10B981",
                  fontFace: "Arial",
                  valign: "middle"
                });

                newSlide.addText(descText, {
                  x: colX + 0.35,
                  y: 2.9,
                  w: colW - 0.7,
                  h: 3.2,
                  fontSize: 12,
                  color: "CBD5E1",
                  fontFace: "Arial",
                  valign: "top",
                  lineSpacing: 18
                });
              } else {
                newSlide.addText(descText, {
                  x: colX + 0.35,
                  y: 2.2,
                  w: colW - 0.7,
                  h: 4.0,
                  fontSize: 13,
                  color: "CBD5E1",
                  fontFace: "Arial",
                  valign: "top",
                  lineSpacing: 18
                });
              }
            });
          }
          else if (layout === "action-plan") {
            // Action Plan layout: Horizontal timeline with node milestones
            newSlide.addShape(shapes.RECTANGLE, {
              x: 0.8,
              y: 4.0,
              w: 11.7,
              h: 0.05,
              fill: { color: "1E293B" }
            });

            const stepX = 11.7 / (count + 1);

            contentLines.forEach((line: string, idx: number) => {
              const cleanLine = line.replace(/^[-*]\s+/, "");
              const match = cleanLine.match(/^\*\*(.*?)\*\*:\s*(.*)$/);
              
              let phaseText = `STEP ${idx + 1}`;
              let milestoneText = cleanLine;

              if (match) {
                phaseText = match[1];
                milestoneText = match[2];
              }

              const nodeX = 0.8 + (idx + 1) * stepX - 0.125;

              newSlide.addShape(shapes.OVAL, {
                x: nodeX,
                y: 3.9,
                w: 0.25,
                h: 0.25,
                fill: { color: "3B82F6" },
                line: { color: "FFFFFF", width: 2 }
              });

              const isAbove = idx % 2 === 0;
              const textY = isAbove ? 2.0 : 4.4;

              newSlide.addText(phaseText.toUpperCase(), {
                x: nodeX - 1.2,
                y: textY,
                w: 2.65,
                h: 0.35,
                fontSize: 12,
                bold: true,
                color: "3B82F6",
                fontFace: "Arial",
                align: "center"
              });

              newSlide.addShape(shapes.ROUNDED_RECTANGLE, {
                x: nodeX - 1.2,
                y: isAbove ? 2.45 : 4.85,
                w: 2.65,
                h: 1.25,
                fill: { color: "111827" },
                line: { color: "1E293B", width: 1 }
              });

              newSlide.addText(milestoneText, {
                x: nodeX - 1.15,
                y: isAbove ? 2.5 : 4.9,
                w: 2.55,
                h: 1.15,
                fontSize: 11,
                color: "CBD5E1",
                fontFace: "Arial",
                align: "center",
                valign: "top",
                lineSpacing: 14
              });
            });
          }
          else if (layout === "team") {
            let colW = 3.65;
            let colGap = count > 1 ? (11.7 - (count * colW)) / (count - 1) : 0;
            if (count === 1) colW = 11.7;

            contentLines.forEach((line: string, idx: number) => {
              const cleanLine = line.replace(/^[-*]\s+/, "");
              const match = cleanLine.match(/^\*\*(.*?)\*\*\s*\((.*?)\):\s*(.*)$/);
              
              let nameText = cleanLine;
              let roleText = "Founder";
              let bgText = "";

              if (match) {
                nameText = match[1];
                roleText = match[2];
                bgText = match[3];
              }

              const colX = 0.8 + idx * (colW + colGap);

              newSlide.addShape(shapes.ROUNDED_RECTANGLE, {
                x: colX,
                y: 2.0,
                w: colW,
                h: 4.4,
                fill: { color: "111827" },
                line: { color: "1E293B", width: 1.5 }
              });

              const circleSize = 1.1;
              newSlide.addShape(shapes.OVAL, {
                x: colX + (colW - circleSize) / 2,
                y: 2.3,
                w: circleSize,
                h: circleSize,
                fill: { color: "1E293B" },
                line: { color: "3B82F6", width: 1.5 }
              });

              newSlide.addText("👤", {
                x: colX + (colW - circleSize) / 2,
                y: 2.3,
                w: circleSize,
                h: circleSize,
                fontSize: 26,
                align: "center",
                valign: "middle"
              });

              newSlide.addText(nameText, {
                x: colX + 0.1,
                y: 3.6,
                w: colW - 0.2,
                h: 0.35,
                fontSize: 14,
                bold: true,
                color: "FFFFFF",
                fontFace: "Arial",
                align: "center"
              });

              newSlide.addText(roleText.toUpperCase(), {
                x: colX + 0.1,
                y: 4.0,
                w: colW - 0.2,
                h: 0.3,
                fontSize: 10,
                bold: true,
                color: "3B82F6",
                fontFace: "Arial",
                align: "center",
                charSpacing: 1
              });

              newSlide.addText(bgText, {
                x: colX + 0.15,
                y: 4.4,
                w: colW - 0.3,
                h: 1.8,
                fontSize: 11,
                color: "CBD5E1",
                fontFace: "Arial",
                align: "center",
                valign: "top",
                lineSpacing: 16
              });
            });
          }
          else if (layout === "problem" || layout === "solution") {
            let colW = 5.6;
            let colGap = 0.5;

            contentLines.forEach((line: string, idx: number) => {
              const cleanLine = line.replace(/^[-*]\s+/, "");
              const match = cleanLine.match(/^\*\*(.*?)\*\*:\s*(.*)$/);
              
              let titleText = "";
              let descText = cleanLine;
              
              if (match) {
                titleText = match[1];
                descText = match[2];
              }

              const colX = 0.8 + idx * (colW + colGap);

              newSlide.addShape(shapes.ROUNDED_RECTANGLE, {
                x: colX,
                y: 2.0,
                w: colW,
                h: 4.4,
                fill: { color: "111827" },
                line: { color: "1E293B", width: 1.5 }
              });

              newSlide.addShape(shapes.RECTANGLE, {
                x: colX + 0.2,
                y: 2.2,
                w: 0.05,
                h: 0.35,
                fill: { color: layout === "problem" ? "EF4444" : "10B981" }
              });

              if (titleText) {
                newSlide.addText(titleText.toUpperCase(), {
                  x: colX + 0.35,
                  y: 2.2,
                  w: colW - 0.6,
                  h: 0.4,
                  fontSize: 14,
                  bold: true,
                  color: layout === "problem" ? "EF4444" : "10B981",
                  fontFace: "Arial",
                  valign: "middle"
                });

                const bullets = descText.split(';').map(b => b.trim()).filter(b => b.length > 0);
                let currentBulY = 2.8;
                bullets.forEach((bullet) => {
                  newSlide.addText(bullet, {
                    x: colX + 0.35,
                    y: currentBulY,
                    w: colW - 0.7,
                    h: 0.65,
                    fontSize: 13,
                    color: "CBD5E1",
                    fontFace: "Arial",
                    valign: "top",
                    bullet: { code: "25E6" },
                    lineSpacing: 18
                  });
                  currentBulY += 0.75;
                });
              } else {
                newSlide.addText(descText, {
                  x: colX + 0.35,
                  y: 2.2,
                  w: colW - 0.7,
                  h: 4.0,
                  fontSize: 13,
                  color: "CBD5E1",
                  fontFace: "Arial",
                  valign: "top",
                  lineSpacing: 18
                });
              }
            });
          }
          else if (layout === "product") {
            let colW = 3.65;
            let colGap = count > 1 ? (11.7 - (count * colW)) / (count - 1) : 0;
            if (count === 1) colW = 11.7;

            contentLines.forEach((line: string, idx: number) => {
              const cleanLine = line.replace(/^[-*]\s+/, "");
              const match = cleanLine.match(/^\*\*(.*?)\*\*:\s*(.*)$/);
              
              let titleText = "";
              let descText = cleanLine;
              
              if (match) {
                titleText = match[1];
                descText = match[2];
              }

              const colX = 0.8 + idx * (colW + colGap);

              newSlide.addShape(shapes.ROUNDED_RECTANGLE, {
                x: colX,
                y: 2.0,
                w: colW,
                h: 4.4,
                fill: { color: "111827" },
                line: { color: "1E293B", width: 1.5 }
              });

              newSlide.addShape(shapes.OVAL, {
                x: colX + 0.2,
                y: 2.2,
                w: 0.6,
                h: 0.6,
                fill: { color: "3B82F6" },
                line: { color: "FFFFFF", width: 1 }
              });

              newSlide.addText(`${idx + 1}`, {
                x: colX + 0.2,
                y: 2.2,
                w: 0.6,
                h: 0.6,
                fontSize: 14,
                bold: true,
                color: "FFFFFF",
                fontFace: "Arial",
                align: "center",
                valign: "middle"
              });

              if (titleText) {
                newSlide.addText(titleText.toUpperCase(), {
                  x: colX + 1.0,
                  y: 2.3,
                  w: colW - 1.2,
                  h: 0.4,
                  fontSize: 13,
                  bold: true,
                  color: "FFFFFF",
                  fontFace: "Arial",
                  valign: "middle"
                });

                newSlide.addText(descText, {
                  x: colX + 0.2,
                  y: 3.0,
                  w: colW - 0.4,
                  h: 3.2,
                  fontSize: 12,
                  color: "CBD5E1",
                  fontFace: "Arial",
                  valign: "top",
                  lineSpacing: 18
                });
              } else {
                newSlide.addText(descText, {
                  x: colX + 0.2,
                  y: 3.0,
                  w: colW - 0.4,
                  h: 3.2,
                  fontSize: 13,
                  color: "CBD5E1",
                  fontFace: "Arial",
                  valign: "top",
                  lineSpacing: 18
                });
              }

              if (idx < count - 1) {
                newSlide.addText("→", {
                  x: colX + colW + 0.05,
                  y: 3.8,
                  w: colGap - 0.1,
                  h: 0.5,
                  fontSize: 24,
                  bold: true,
                  color: "3B82F6",
                  align: "center",
                  valign: "middle"
                });
              }
            });
          }
          else if (layout === "market") {
            let colW = 3.3;
            let colGap = 0.9;

            contentLines.forEach((line: string, idx: number) => {
              const cleanLine = line.replace(/^[-*]\s+/, "");
              const match = cleanLine.match(/^\*\*(.*?)\*\*:\s*(.*)$/);
              
              let titleText = "";
              let descText = cleanLine;
              
              if (match) {
                titleText = match[1];
                descText = match[2];
              }

              const colX = 0.8 + idx * (colW + colGap);

              newSlide.addShape(shapes.ROUNDED_RECTANGLE, {
                x: colX,
                y: 2.3,
                w: colW,
                h: 3.8,
                fill: { color: idx === 2 ? "1E3A8A" : "111827" },
                line: { color: idx === 2 ? "3B82F6" : "1E293B", width: idx === 2 ? 2.5 : 1.5 }
              });

              if (titleText) {
                newSlide.addText(titleText.toUpperCase(), {
                  x: colX + 0.2,
                  y: 2.6,
                  w: colW - 0.4,
                  h: 0.5,
                  fontSize: 12,
                  bold: true,
                  color: "3B82F6",
                  fontFace: "Arial",
                  align: "center",
                  valign: "top"
                });

                newSlide.addText(descText, {
                  x: colX + 0.2,
                  y: 3.3,
                  w: colW - 0.4,
                  h: 2.5,
                  fontSize: 18,
                  bold: true,
                  color: "FFFFFF",
                  fontFace: "Arial",
                  align: "center",
                  valign: "middle"
                });
              } else {
                newSlide.addText(descText, {
                  x: colX + 0.2,
                  y: 2.8,
                  w: colW - 0.4,
                  h: 3.0,
                  fontSize: 15,
                  color: "FFFFFF",
                  fontFace: "Arial",
                  align: "center",
                  valign: "middle"
                });
              }

              if (idx === 0) {
                newSlide.addText("×", {
                  x: colX + colW + 0.1,
                  y: 3.7,
                  w: colGap - 0.2,
                  h: 1.0,
                  fontSize: 32,
                  bold: true,
                  color: "3B82F6",
                  align: "center",
                  valign: "middle"
                });
              } else if (idx === 1) {
                newSlide.addText("=", {
                  x: colX + colW + 0.1,
                  y: 3.7,
                  w: colGap - 0.2,
                  h: 1.0,
                  fontSize: 32,
                  bold: true,
                  color: "3B82F6",
                  align: "center",
                  valign: "middle"
                });
              }
            });
          }
          else if (layout === "business-model") {
            let colW = 3.65;
            let colGap = count > 1 ? (11.7 - (count * colW)) / (count - 1) : 0;
            if (count === 1) colW = 11.7;

            contentLines.forEach((line: string, idx: number) => {
              const cleanLine = line.replace(/^[-*]\s+/, "");
              const match = cleanLine.match(/^\*\*(.*?)\*\*:\s*(.*)$/);
              
              let titleText = "";
              let descText = cleanLine;
              
              if (match) {
                titleText = match[1];
                descText = match[2];
              }

              const colX = 0.8 + idx * (colW + colGap);

              newSlide.addShape(shapes.ROUNDED_RECTANGLE, {
                x: colX,
                y: 2.0,
                w: colW,
                h: 4.4,
                fill: { color: "111827" },
                line: { color: "1E293B", width: 1.5 }
              });

              newSlide.addShape(shapes.RECTANGLE, {
                x: colX + 0.2,
                y: 2.2,
                w: 0.05,
                h: 0.35,
                fill: { color: idx === 0 ? "3B82F6" : idx === 1 ? "94A3B8" : "10B981" }
              });

              if (titleText) {
                newSlide.addText(titleText.toUpperCase(), {
                  x: colX + 0.35,
                  y: 2.2,
                  w: colW - 0.6,
                  h: 0.4,
                  fontSize: 13,
                  bold: true,
                  color: idx === 0 ? "3B82F6" : idx === 1 ? "FFFFFF" : "10B981",
                  fontFace: "Arial",
                  valign: "middle"
                });

                newSlide.addText(descText, {
                  x: colX + 0.35,
                  y: 2.9,
                  w: colW - 0.7,
                  h: 3.2,
                  fontSize: 14,
                  color: "CBD5E1",
                  fontFace: "Arial",
                  valign: "top",
                  lineSpacing: 18
                });
              } else {
                newSlide.addText(descText, {
                  x: colX + 0.35,
                  y: 2.2,
                  w: colW - 0.7,
                  h: 4.0,
                  fontSize: 14,
                  color: "CBD5E1",
                  fontFace: "Arial",
                  valign: "top",
                  lineSpacing: 18
                });
              }
            });
          }
          else if (layout === "competition") {
            const tableHeader = ["METRICS / FEATURES", data.deckTitle || "US", "COMPETITOR A", "COMPETITOR B"];
            const tableRows = [
              tableHeader.map(text => ({
                text: text,
                options: { bold: true, color: "FFFFFF", fill: "1E293B", align: "center", valign: "middle" }
              }))
            ];

            contentLines.forEach((line: string) => {
              const cleanLine = line.replace(/^[-*]\s+/, "");
              const match = cleanLine.match(/^\*\*(.*?)\*\*:\s*(.*)$/);
              if (match) {
                const featureLabel = match[1];
                const valuesPart = match[2];
                const segments = valuesPart.split(/vs/i).map(s => s.trim());
                
                const usVal = segments[0] || "";
                const compAVal = segments[1] || "";
                const compBVal = segments[2] || "";

                tableRows.push([
                  { text: featureLabel.toUpperCase(), options: { bold: true, color: "3B82F6", fill: "111827", align: "left", valign: "middle" } } as any,
                  { text: usVal, options: { bold: true, color: "FFFFFF", fill: "1E3A8A", align: "center", valign: "middle" } } as any,
                  { text: compAVal, options: { color: "94A3B8", fill: "111827", align: "center", valign: "middle" } } as any,
                  { text: compBVal, options: { color: "94A3B8", fill: "111827", align: "center", valign: "middle" } } as any
                ]);
              } else {
                tableRows.push([
                  { text: cleanLine, options: { color: "FFFFFF", fill: "111827", align: "left", valign: "middle" } } as any,
                  { text: "", options: { fill: "111827" } } as any,
                  { text: "", options: { fill: "111827" } } as any,
                  { text: "", options: { fill: "111827" } } as any
                ]);
              }
            });

            newSlide.addTable(tableRows as any, {
              x: 0.8,
              y: 2.0,
              w: 11.7,
              h: 4.4,
              colW: [3.5, 2.73, 2.73, 2.73],
              border: { color: "1E293B", pt: 1.5 },
              fontFace: "Arial",
              fontSize: 13
            });
          }
          else if (layout === "roadmap") {
            newSlide.addShape(shapes.RECTANGLE, {
              x: 0.8,
              y: 4.0,
              w: 11.7,
              h: 0.05,
              fill: { color: "1E293B" }
            });

            const stepX = 11.7 / (count + 1);

            contentLines.forEach((line: string, idx: number) => {
              const cleanLine = line.replace(/^[-*]\s+/, "");
              const match = cleanLine.match(/^\*\*(.*?)\*\*:\s*(.*)$/);
              
              let phaseText = `PHASE ${idx + 1}`;
              let milestoneText = cleanLine;

              if (match) {
                phaseText = match[1];
                milestoneText = match[2];
              }

              const nodeX = 0.8 + (idx + 1) * stepX - 0.125;

              newSlide.addShape(shapes.OVAL, {
                x: nodeX,
                y: 3.9,
                w: 0.25,
                h: 0.25,
                fill: { color: "3B82F6" },
                line: { color: "FFFFFF", width: 2 }
              });

              const isAbove = idx % 2 === 0;
              const textY = isAbove ? 2.0 : 4.4;

              newSlide.addText(phaseText.toUpperCase(), {
                x: nodeX - 1.2,
                y: textY,
                w: 2.65,
                h: 0.35,
                fontSize: 12,
                bold: true,
                color: "3B82F6",
                fontFace: "Arial",
                align: "center"
              });

              newSlide.addShape(shapes.ROUNDED_RECTANGLE, {
                x: nodeX - 1.2,
                y: isAbove ? 2.45 : 4.85,
                w: 2.65,
                h: 1.25,
                fill: { color: "111827" },
                line: { color: "1E293B", width: 1 }
              });

              newSlide.addText(milestoneText, {
                x: nodeX - 1.15,
                y: isAbove ? 2.5 : 4.9,
                w: 2.55,
                h: 1.15,
                fontSize: 11,
                color: "CBD5E1",
                fontFace: "Arial",
                align: "center",
                valign: "top",
                lineSpacing: 14
              });
            });
          }
          else if (layout === "funding") {
            let colW = 5.6;
            let colGap = 0.5;

            contentLines.forEach((line: string, idx: number) => {
              const cleanLine = line.replace(/^[-*]\s+/, "");
              const match = cleanLine.match(/^\*\*(.*?)\*\*:\s*(.*)$/);
              
              let titleText = "";
              let descText = cleanLine;
              
              if (match) {
                titleText = match[1];
                descText = match[2];
              }

              const colX = 0.8 + idx * (colW + colGap);

              newSlide.addShape(shapes.ROUNDED_RECTANGLE, {
                x: colX,
                y: 2.0,
                w: colW,
                h: 4.4,
                fill: { color: idx === 0 ? "1E3A8A" : "111827" },
                line: { color: idx === 0 ? "3B82F6" : "1E293B", width: idx === 0 ? 2.5 : 1.5 }
              });

              newSlide.addShape(shapes.RECTANGLE, {
                x: colX + 0.2,
                y: 2.2,
                w: 0.4,
                h: 0.04,
                fill: { color: "3B82F6" }
              });

              if (titleText) {
                newSlide.addText(titleText.toUpperCase(), {
                  x: colX + 0.2,
                  y: 2.35,
                  w: colW - 0.4,
                  h: 0.4,
                  fontSize: 14,
                  bold: true,
                  color: "3B82F6",
                  fontFace: "Arial",
                  valign: "top"
                });

                newSlide.addText(descText, {
                  x: colX + 0.2,
                  y: 2.85,
                  w: colW - 0.4,
                  h: 3.25,
                  fontSize: 14,
                  color: "CBD5E1",
                  fontFace: "Arial",
                  valign: "top",
                  lineSpacing: 20
                });
              } else {
                newSlide.addText(descText, {
                  x: colX + 0.2,
                  y: 2.35,
                  w: colW - 0.4,
                  h: 3.75,
                  fontSize: 14,
                  color: "CBD5E1",
                  fontFace: "Arial",
                  valign: "top",
                  lineSpacing: 20
                });
              }
            });
          }
          else if (layout === "contact") {
            const cardW = 6.0;
            const cardX = 0.8 + (11.7 - cardW) / 2;

            newSlide.addShape(shapes.ROUNDED_RECTANGLE, {
              x: cardX,
              y: 2.0,
              w: cardW,
              h: 4.4,
              fill: { color: "111827" },
              line: { color: "1E293B", width: 1.5 }
            });

            const headshotSize = 1.2;
            newSlide.addShape(shapes.OVAL, {
              x: cardX + (cardW - headshotSize) / 2,
              y: 2.2,
              w: headshotSize,
              h: headshotSize,
              fill: { color: "1E293B" },
              line: { color: "3B82F6", width: 1.5 }
            });

            newSlide.addText("👤", {
              x: cardX + (cardW - headshotSize) / 2,
              y: 2.2,
              w: headshotSize,
              h: headshotSize,
              fontSize: 28,
              align: "center",
              valign: "middle"
            });

            let currentContactY = 3.6;
            contentLines.forEach((line: string) => {
              const cleanLine = line.replace(/^[-*]\s+/, "");
              const match = cleanLine.match(/^\*\*(.*?)\*\*:\s*(.*)$/);
              
              let label = "";
              let val = cleanLine;

              if (match) {
                label = match[1];
                val = match[2];
              }

              newSlide.addText(val, {
                x: cardX + 0.5,
                y: currentContactY,
                w: cardW - 1.0,
                h: 0.35,
                fontSize: label.includes("Name") ? 16 : 13,
                bold: label.includes("Name") || label.includes("Role"),
                color: label.includes("Name") ? "FFFFFF" : label.includes("Role") ? "3B82F6" : "CBD5E1",
                fontFace: "Arial",
                align: "center",
                valign: "middle"
              });
              currentContactY += 0.4;
            });
          }
          else {
            let colW = 11.7;
            let colY = 2.0;
            let colH = 4.4;

            if (count === 2) {
              colW = 5.6;
            } else if (count === 3) {
              colW = 3.65;
            } else if (count >= 4) {
              colW = 5.6;
              colH = 2.0;
            }

            const colGap = count > 1 ? (11.7 - (count * colW)) / (count - 1) : 0;

            contentLines.forEach((line: string, idx: number) => {
              const cleanLine = line.replace(/^[-*]\s+/, "");
              const match = cleanLine.match(/^\*\*(.*?)\*\*:\s*(.*)$/);
              
              let titleText = "";
              let descText = cleanLine;
              
              if (match) {
                titleText = match[1];
                descText = match[2];
              }

              let colX = 0.8;
              let targetY = colY;

              if (count <= 3) {
                colX = 0.8 + idx * (colW + colGap);
              } else {
                const row = Math.floor(idx / 2);
                const col = idx % 2;
                colX = 0.8 + col * (colW + 0.5);
                targetY = colY + row * (colH + 0.3);
              }

              newSlide.addShape(shapes.ROUNDED_RECTANGLE, {
                x: colX,
                y: targetY,
                w: colW,
                h: colH,
                fill: { color: "111827" },
                line: { color: "1E293B", width: 1.5 }
              });

              newSlide.addShape(shapes.RECTANGLE, {
                x: colX + 0.2,
                y: targetY + 0.15,
                w: 0.4,
                h: 0.04,
                fill: { color: "3B82F6" }
              });

              if (titleText) {
                newSlide.addText(titleText.toUpperCase(), {
                  x: colX + 0.2,
                  y: targetY + 0.35,
                  w: colW - 0.4,
                  h: 0.4,
                  fontSize: 13,
                  bold: true,
                  color: "3B82F6",
                  fontFace: "Arial",
                  valign: "top"
                });

                newSlide.addText(descText, {
                  x: colX + 0.2,
                  y: targetY + 0.85,
                  w: colW - 0.4,
                  h: colH - 1.05,
                  fontSize: 12,
                  color: "CBD5E1",
                  fontFace: "Arial",
                  valign: "top",
                  lineSpacing: 18
                });
              } else {
                newSlide.addText(descText, {
                  x: colX + 0.2,
                  y: targetY + 0.35,
                  w: colW - 0.4,
                  h: colH - 0.55,
                  fontSize: 13,
                  color: "CBD5E1",
                  fontFace: "Arial",
                  valign: "top",
                  lineSpacing: 18
                });
              }
            });
          }
        }

        if (slide.speakerNote) {
          newSlide.addNotes(slide.speakerNote);
        }
      });

      // 3. Final Investor Fit Slide
      if (data.investorFitNote) {
        const fitSlide = pptx.addSlide();
        fitSlide.background = { color: "0B0F19" };

        fitSlide.addText("INVESTOR FIT ALIGNMENT", {
          x: 0.8,
          y: 1.2,
          w: 11.7,
          h: 0.4,
          fontSize: 12,
          bold: true,
          color: "3B82F6",
          fontFace: "Arial",
          charSpacing: 2
        });

        fitSlide.addText("Ideal Investor Profile & Next Steps", {
          x: 0.8,
          y: 1.7,
          w: 11.7,
          h: 0.8,
          fontSize: 28,
          bold: true,
          color: "FFFFFF",
          fontFace: "Arial"
        });

        // Thin horizontal divider line
        fitSlide.addShape(shapes.RECTANGLE, {
          x: 0.8,
          y: 2.5,
          w: 11.7,
          h: 0.02,
          fill: { color: "1E293B" }
        });

        // Rounded Card for alignment note
        fitSlide.addShape(shapes.ROUNDED_RECTANGLE, {
          x: 0.8,
          y: 2.9,
          w: 11.7,
          h: 3.5,
          fill: { color: "111827" },
          line: { color: "1E293B", width: 1.5 }
        });

        fitSlide.addShape(shapes.RECTANGLE, {
          x: 1.1,
          y: 3.1,
          w: 0.6,
          h: 0.04,
          fill: { color: "3B82F6" }
        });

        fitSlide.addText(data.investorFitNote, {
          x: 1.1,
          y: 3.4,
          w: 11.1,
          h: 2.8,
          fontSize: 16,
          color: "CBD5E1",
          fontFace: "Arial",
          valign: "top",
          lineSpacing: 26
        });

        fitSlide.addNotes(`Investor Fit Strategy: ${data.investorFitNote}`);
      }

      // Write/Save the file
      const fileName = `PitchDeck_${(data.deckTitle || idea).replace(/\s+/g, "_")}.pptx`;
      await pptx.writeFile({ fileName });
    } catch (err) {
      console.error("Failed to generate PowerPoint:", err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-white">{data.deckTitle}</h3>
          <p className="text-white/50 text-sm italic">{data.tagline}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={downloadDeck} size="sm" className="bg-white/5 hover:bg-white/10 text-white border border-white/10 gap-2">
            <Download className="h-4 w-4" /> Download .md
          </Button>
          <Button onClick={downloadPPTX} size="sm" className="bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/30 gap-2">
            <PresentationIcon className="h-4 w-4" /> Download .pptx
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {data.slides?.map((slide: any, i: number) => (
          <div key={i} className={`rounded-2xl border border-white/10 overflow-hidden ${slideColors[i] || "bg-white/5"}`}>
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="bg-white/10 text-white text-[10px] font-black w-7 h-7 rounded-full flex items-center justify-center">{slide.slideNumber}</span>
                <div>
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block">{slide.title}</span>
                  <span className="text-white font-bold text-sm">{slide.headline}</span>
                </div>
              </div>
              <ChevronRight className={`h-4 w-4 text-white/40 transition-transform ${expanded === i ? "rotate-90" : ""}`} />
            </button>
            {expanded === i && (
              <div className="px-4 pb-4 space-y-3 animate-in fade-in duration-200">
                <p className="text-white/80 text-sm whitespace-pre-line">{slide.content}</p>
                {slide.speakerNote && (
                  <div className="p-3 bg-black/30 rounded-xl">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Speaker Note</p>
                    <p className="text-white/60 text-xs italic">{slide.speakerNote}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {data.investorFitNote && (
        <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
          <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">INVESTOR FIT NOTE</p>
          <p className="text-white/80 text-sm">{data.investorFitNote}</p>
        </div>
      )}
    </div>
  );
}

// ── Financials Result Renderer ─────────────────────────
export function FinancialsResult({ data }: { data: any }) {
  const maxRevenue = Math.max(...(data.yearlyProjections?.map((y: any) => y.revenue_INR) || [1]));
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "LTV/CAC", value: data.assumptions?.LTV_CAC_ratio, icon: "📊" },
          { label: "Break-Even", value: `Month ${data.breakEvenMonth}`, icon: "⚖️" },
          { label: "Runway", value: `${data.runwayMonths} months`, icon: "🛣️" },
          { label: "Gross Margin", value: data.keyMetrics?.grossMargin, icon: "💰" },
        ].map((m) => (
          <div key={m.label} className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
            <div className="text-2xl mb-1">{m.icon}</div>
            <div className="text-lg font-black text-white">{m.value}</div>
            <div className="text-[9px] font-black text-white/40 uppercase tracking-widest">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart (CSS-based bars) */}
      <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-4">3-YEAR REVENUE PROJECTION</p>
        <div className="flex items-end gap-4 h-32">
          {data.yearlyProjections?.map((y: any, i: number) => {
            const height = (y.revenue_INR / maxRevenue) * 100;
            const isProfit = y.netProfit_INR >= 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className={`text-xs font-black ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                  {y.netProfit_INR >= 0 ? "+" : ""}₹{(y.netProfit_INR / 100000).toFixed(1)}L
                </span>
                <div
                  className="w-full rounded-t-xl bg-gradient-to-t from-primary to-cyan-400 transition-all duration-1000"
                  style={{ height: `${Math.max(height, 5)}%` }}
                />
                <div className="text-center">
                  <div className="text-white font-black text-sm">₹{(y.revenue_INR / 100000).toFixed(1)}L</div>
                  <div className="text-white/40 text-[9px] uppercase tracking-widest">Year {y.year}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {["Year", "Revenue", "Expenses", "Net P&L", "Users", "MRR"].map((h) => (
                <th key={h} className="text-left py-2 px-3 text-[9px] font-black text-white/40 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.yearlyProjections?.map((y: any, i: number) => (
              <tr key={i} className="border-b border-white/5">
                <td className="py-3 px-3 font-black text-white">Y{y.year}</td>
                <td className="py-3 px-3 text-emerald-400 font-bold">₹{(y.revenue_INR / 100000).toFixed(1)}L</td>
                <td className="py-3 px-3 text-red-400/80">₹{(y.expenses_INR / 100000).toFixed(1)}L</td>
                <td className={`py-3 px-3 font-bold ${y.netProfit_INR >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {y.netProfit_INR >= 0 ? "+" : ""}₹{(y.netProfit_INR / 100000).toFixed(1)}L
                </td>
                <td className="py-3 px-3 text-white/70">{y.users?.toLocaleString()}</td>
                <td className="py-3 px-3 text-primary font-bold">₹{(y.MRR_INR / 1000).toFixed(0)}K</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Yearly Scaling Actions Playbook */}
      {data.yearlyProjections?.some((y: any) => y.scalingActions) && (
        <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-4">
          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">📈 YEAR-BY-YEAR SCALING ACTIONS PLAYBOOK</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.yearlyProjections.map((y: any, idx: number) => (
              <div key={idx} className="p-4 bg-black/20 rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between border-b border-white/5 pb-1 mb-1">
                  <span className="text-xs font-black text-primary uppercase">Year {y.year} Focus</span>
                  <span className="text-[10px] text-white/40">Target MRR: ₹{(y.MRR_INR / 1000).toFixed(0)}K</span>
                </div>
                {y.scalingActions?.map((action: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-white/80">
                    <span className="text-emerald-400 font-bold mt-0.5">•</span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategic Playbooks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.monetizationPlan && (
          <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-3">💸 MONETIZATION PLAYBOOK (HOW WE EARN)</p>
            <div className="space-y-2">
              {data.monetizationPlan.map((m: string, i: number) => (
                <div key={i} className="flex items-start gap-3 text-xs text-white/80">
                  <span className="bg-emerald-500/20 text-emerald-400 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black flex-shrink-0">{i + 1}</span>
                  <span className="mt-0.5">{m}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.growthPlaybook && (
          <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/20">
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-3">🚀 GROWTH PLAYBOOK (HOW WE SCALE)</p>
            <div className="space-y-2">
              {data.growthPlaybook.map((g: string, i: number) => (
                <div key={i} className="flex items-start gap-3 text-xs text-white/80">
                  <span className="bg-blue-500/20 text-blue-400 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black flex-shrink-0">{i + 1}</span>
                  <span className="mt-0.5">{g}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {data.costCuttingTips && (
        <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
          <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-2">💡 COST-CUTTING TIPS</p>
          {data.costCuttingTips.map((t: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-sm text-white/80 mb-1">
              <span className="text-amber-400 font-black">→</span> {t}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Investors Result Renderer ──────────────────────────
export function InvestorsResult({ data }: { data: any }) {
  const [showEmail, setShowEmail] = useState(false);
  return (
    <div className="space-y-5">
      <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">FUNDING STRATEGY</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
          {[
            { label: "Stage", value: data.fundingStrategy?.recommendedStage },
            { label: "Amount", value: data.fundingStrategy?.recommendedAmount_INR },
            { label: "Valuation", value: data.fundingStrategy?.valuation_INR },
            { label: "Timeline", value: data.fundingStrategy?.timeline },
          ].map((f) => (
            <div key={f.label} className="text-center">
              <div className="text-xs font-black text-white">{f.value}</div>
              <div className="text-[9px] text-white/40 uppercase tracking-widest">{f.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {data.investorTargets?.map((inv: any, i: number) => {
          // Look up details from our static database
          const cleanName = inv.name.toLowerCase();
          const details = INVESTORS.find(item => {
            const itemName = item.name.toLowerCase();
            return itemName.includes(cleanName) || cleanName.includes(itemName) ||
              (itemName.includes('sequoia') && cleanName.includes('sequoia')) ||
              (itemName.includes('accel') && cleanName.includes('accel')) ||
              (itemName.includes('matrix') && cleanName.includes('matrix')) ||
              (itemName.includes('blume') && cleanName.includes('blume')) ||
              (itemName.includes('kalaari') && cleanName.includes('kalaari')) ||
              (itemName.includes('elevation') && cleanName.includes('elevation')) ||
              (itemName.includes('nexus') && cleanName.includes('nexus')) ||
              (itemName.includes('lightspeed') && cleanName.includes('lightspeed')) ||
              (itemName.includes('3one4') && cleanName.includes('3one4')) ||
              (itemName.includes('quotient') && cleanName.includes('quotient')) ||
              (itemName.includes('stellaris') && cleanName.includes('stellaris')) ||
              (itemName.includes('y combinator') && cleanName.includes('yc')) ||
              (itemName.includes('andreessen') && cleanName.includes('a16z')) ||
              (itemName.includes('benchmark') && cleanName.includes('benchmark')) ||
              (itemName.includes('first round') && cleanName.includes('first round'));
          });

          return (
            <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-white">{details ? details.name : inv.name}</span>
                    <Badge className="bg-primary/20 text-primary text-[9px] px-2 py-0.5">{details ? details.type : inv.type}</Badge>
                    <Badge className="bg-white/10 text-white/60 text-[9px] px-2 py-0.5">{details ? details.geography : inv.geography}</Badge>
                  </div>
                  <p className="text-white/60 text-xs">{inv.fitReason}</p>
                  <p className="text-white/40 text-xs mt-1">Portfolio match: <span className="text-cyan-400">{inv.portfolioMatch}</span></p>
                  
                  {inv.contactStrategy && (
                    <div className="mt-2 p-2 bg-black/25 rounded-lg border border-white/5 text-[11px] text-amber-400 font-medium">
                      ⚡ <strong>Strategy:</strong> {inv.contactStrategy}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-black" style={{ color: inv.fitScore >= 80 ? "#22c55e" : inv.fitScore >= 60 ? "#eab308" : "#f87171" }}>
                    {inv.fitScore}
                  </div>
                  <div className="text-[9px] text-white/30 uppercase tracking-widest">FIT SCORE</div>
                </div>
              </div>

              {/* Contact details footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-white/5">
                <div className="flex gap-3">
                  {details?.website && (
                    <a href={details.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 text-xs font-black flex items-center gap-1">
                      Visit Website <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {details?.email && (
                    <a href={`mailto:${details.email}`} className="text-cyan-400 hover:text-cyan-300 text-xs font-black flex items-center gap-1">
                      Email: {details.email}
                    </a>
                  )}
                  {!details?.website && !details?.email && (
                    <span className="text-white/40 text-xs italic">Search on Google / LinkedIn to contact</span>
                  )}
                </div>
                {details?.ticketSize && (
                  <span className="text-[10px] text-white/40">Ticket: <strong className="text-white/80">{details.ticketSize}</strong></span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {data.coldEmailTemplate && (
        <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">📧 COLD EMAIL TEMPLATE</p>
            <button onClick={() => setShowEmail(!showEmail)} className="text-xs text-white/50 hover:text-white">
              {showEmail ? "Hide" : "Show"}
            </button>
          </div>
          {showEmail && (
            <div className="space-y-2">
              <div className="p-2 bg-black/30 rounded-lg">
                <span className="text-[9px] text-white/30 uppercase tracking-wider">Subject: </span>
                <span className="text-white/80 text-sm font-medium">{data.coldEmailTemplate.subject}</span>
              </div>
              <div className="p-3 bg-black/30 rounded-lg">
                <p className="text-white/70 text-sm whitespace-pre-line">{data.coldEmailTemplate.body}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {data.acceleratorsToApply && (
        <div className="p-4 bg-violet-500/10 rounded-2xl border border-violet-500/20">
          <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-2">🚀 ACCELERATORS TO APPLY</p>
          {data.acceleratorsToApply.map((a: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-sm text-white/80 mb-1">
              <span className="text-violet-400">→</span> {a}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getOfficialSchemeLink(name: string, fallbackLink: string): string {
  const cleanName = name.toLowerCase();
  const matched = GOVERNMENT_SCHEMES.find(s => {
    const sName = s.name.toLowerCase();
    return sName.includes(cleanName) || cleanName.includes(sName) ||
      (sName.includes('dpiit') && cleanName.includes('dpiit')) ||
      (sName.includes('prayas') && cleanName.includes('prayas')) ||
      (sName.includes('eir') && cleanName.includes('eir')) ||
      (sName.includes('birac') && cleanName.includes('birac')) ||
      (sName.includes('seed fund') && cleanName.includes('seed')) ||
      (sName.includes('meity') && cleanName.includes('meity')) ||
      (sName.includes('msme') && cleanName.includes('msme')) ||
      (sName.includes('kerala') && cleanName.includes('kerala')) ||
      (sName.includes('tamil nadu') && cleanName.includes('tamil')) ||
      (sName.includes('telangana') && cleanName.includes('telangana')) ||
      (sName.includes('nasscom') && cleanName.includes('nasscom')) ||
      (sName.includes('icreate') && cleanName.includes('icreate')) ||
      (sName.includes('aim') && cleanName.includes('aim')) ||
      (sName.includes('pli') && cleanName.includes('pli'));
  });
  return matched ? matched.link : (fallbackLink && fallbackLink.startsWith('http') ? fallbackLink : 'https://www.startupindia.gov.in');
}

// ── Schemes / Funding Discovery Result Renderer ────────
export function SchemesResult({ data }: { data: any }) {
  const [activePhase, setActivePhase] = useState<number>(1);

  // ── Old schema fallback ─────────────────────────────
  const isNewSchema = !!data.verdict;
  if (!isNewSchema) {
    return (
      <div className="space-y-5">
        <div className="p-5 bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-2xl border-2 border-green-500/40">
          <div className="flex items-center gap-3 mb-3">
            <IndianRupee className="h-6 w-6 text-green-400" />
            <div>
              <p className="text-green-400 font-black uppercase tracking-widest text-sm">Total Potential Non-Dilutive Funding</p>
              <p className="text-2xl font-black text-white">{data.estimatedTotalFunding_INR}</p>
            </div>
          </div>
          <p className="text-white/70 text-sm">{data.eligibilitySummary}</p>
        </div>
        <div className="space-y-3">
          {data.matchedSchemes?.map((scheme: any, i: number) => {
            const linkToUse = scheme.link?.startsWith('http') ? scheme.link : 'https://www.startupindia.gov.in';
            return (
              <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <p className="font-black text-white text-sm">{scheme.name}</p>
                    <p className="text-emerald-400 font-black text-sm">{scheme.amount}</p>
                    <p className="text-white/50 text-xs">{scheme.agency}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-emerald-400">{scheme.fitScore}</div>
                    <div className="text-[9px] text-white/30 uppercase">FIT</div>
                  </div>
                </div>
                <p className="text-white/60 text-xs mb-2">{scheme.fitReason}</p>
                <a href={linkToUse} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary text-xs font-black hover:text-primary/80">
                  Apply Now <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            );
          })}
        </div>
        {data.firstStepToday && (
          <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20">
            <p className="text-[9px] font-black text-green-400 uppercase tracking-widest mb-1">⚡ DO THIS TODAY</p>
            <p className="text-white/80 font-medium text-sm">{data.firstStepToday}</p>
          </div>
        )}
      </div>
    );
  }

  // ── New 15-dimension schema ─────────────────────────
  const verdict = data.verdict || "MODERATE OPPORTUNITY";
  const cls = data.classification || {};
  const sc = data.scorecard || {};
  const schemes = data.matchedSchemes || [];

  const verdictConfig: Record<string, { bg: string; border: string; text: string; icon: string; sub: string }> = {
    "EXCELLENT FUNDING OPPORTUNITY": { bg: "from-emerald-500/20 to-green-500/10",  border: "border-emerald-500/50", text: "text-emerald-400", icon: "🏆", sub: "Multiple high-value schemes available" },
    "STRONG OPPORTUNITY":            { bg: "from-blue-500/20 to-cyan-500/10",      border: "border-blue-500/50",    text: "text-blue-400",    icon: "💰", sub: "Good funding pathways exist" },
    "MODERATE OPPORTUNITY":          { bg: "from-amber-500/20 to-orange-500/10",   border: "border-amber-500/50",   text: "text-amber-400",   icon: "📊", sub: "Some schemes available but competitive" },
    "WEAK OPPORTUNITY":              { bg: "from-red-500/20 to-rose-500/10",       border: "border-red-500/50",     text: "text-red-400",     icon: "⚠️", sub: "Limited government support" },
    "NO SIGNIFICANT MATCH":          { bg: "from-slate-500/20 to-slate-500/10",    border: "border-slate-500/50",   text: "text-slate-400",   icon: "🔍", sub: "Focus on private funding instead" },
  };
  const vc = verdictConfig[verdict] || verdictConfig["MODERATE OPPORTUNITY"];

  const scorecardItems = [
    { key: "schemeMatch",        label: "Scheme Match",   icon: "🎯" },
    { key: "eligibility",        label: "Eligibility",    icon: "✅" },
    { key: "approvalProbability",label: "Approval Prob",  icon: "📈" },
    { key: "fundingPotential",   label: "Funding",        icon: "💰" },
    { key: "strategicValue",     label: "Strategic",      icon: "⚡" },
    { key: "easeOfApplication",  label: "Ease",           icon: "🔓" },
  ];

  const scoreColor = (s: number) => s >= 7 ? "text-emerald-400" : s >= 5 ? "text-amber-400" : "text-red-400";
  const eligBadge = (status: string) => {
    if (status === "Eligible") return "bg-emerald-500/15 border-emerald-500/30 text-emerald-300";
    if (status === "Partially Eligible") return "bg-amber-500/15 border-amber-500/30 text-amber-300";
    return "bg-red-500/15 border-red-500/30 text-red-300";
  };
  const diffBadge = (d: string) => {
    if (d === "Easy") return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    if (d === "Moderate") return "bg-blue-500/10 border-blue-500/20 text-blue-400";
    if (d === "Difficult") return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    return "bg-red-500/10 border-red-500/20 text-red-400";
  };
  const catColor = (c: string) => {
    if (c === "Grant") return "bg-emerald-500/15 text-emerald-400";
    if (c === "Loan") return "bg-blue-500/15 text-blue-400";
    if (c === "Subsidy") return "bg-violet-500/15 text-violet-400";
    if (c === "Tax Benefit") return "bg-amber-500/15 text-amber-400";
    if (c === "Incubation") return "bg-cyan-500/15 text-cyan-400";
    return "bg-white/10 text-white/60";
  };

  return (
    <div className="space-y-8">

      {/* ── SECTION 1: Verdict + Total Funding Banner ──── */}
      <div className={`p-6 bg-gradient-to-br ${vc.bg} border-2 ${vc.border} rounded-3xl`}>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
          <div className="flex items-start gap-4 flex-1">
            <span className="text-3xl">{vc.icon}</span>
            <div>
              <p className={`text-xl font-black uppercase tracking-widest ${vc.text}`}>{verdict}</p>
              <p className={`text-sm font-bold opacity-70 mt-0.5 ${vc.text}`}>{vc.sub}</p>
            </div>
          </div>
          <div className="p-4 bg-black/20 rounded-2xl border border-white/10 text-center">
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Total Potential Funding</p>
            <p className="text-3xl font-black text-emerald-400 mt-1">{data.totalPotentialFunding}</p>
            <p className="text-[9px] text-white/40 mt-1">Equity-Free Non-Dilutive</p>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Scorecard ─────────────────────── */}
      <div>
        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">📊 Funding Opportunity Scorecard</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {scorecardItems.map((item) => {
            const score = sc[item.key] ?? 0;
            const col = score >= 7 ? "border-emerald-500/20 bg-emerald-500/5" : score >= 5 ? "border-amber-500/20 bg-amber-500/5" : "border-red-500/20 bg-red-500/5";
            return (
              <div key={item.key} className={`p-3 border rounded-2xl text-center ${col}`}>
                <span className="text-lg">{item.icon}</span>
                <p className={`text-xl font-black ${scoreColor(score)} mt-1`}>{score}</p>
                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">{item.label}</p>
                <div className="w-full bg-white/5 rounded-full h-1 mt-1.5">
                  <div className={`h-1 rounded-full ${score >= 7 ? "bg-emerald-500" : score >= 5 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${score * 10}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 3: Startup Classification ────────── */}
      {cls.industry && (
        <div className="p-4 bg-white/3 border border-white/8 rounded-2xl">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3">🏷️ Startup Classification</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { label: "Industry", value: cls.industry, color: "bg-primary/10 border-primary/20 text-primary" },
              { label: "Stage", value: cls.stage, color: "bg-blue-500/10 border-blue-500/20 text-blue-300" },
              { label: "Type", value: cls.businessType, color: "bg-violet-500/10 border-violet-500/20 text-violet-300" },
              { label: "Innovation", value: cls.innovationLevel, color: "bg-amber-500/10 border-amber-500/20 text-amber-300" },
            ].filter(c => c.value).map((c) => (
              <span key={c.label} className={`px-3 py-1.5 rounded-xl text-[10px] font-black border ${c.color}`}>
                {c.label}: {c.value}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Scheme Readiness:</p>
            <div className="flex-1 bg-white/5 rounded-full h-2">
              <div className={`h-2 rounded-full ${scoreColor(cls.schemeMatchReadiness || 0).replace("text-", "bg-")}`} style={{ width: `${(cls.schemeMatchReadiness || 0) * 10}%` }} />
            </div>
            <span className={`font-black text-sm ${scoreColor(cls.schemeMatchReadiness || 0)}`}>{cls.schemeMatchReadiness || 0}/10</span>
          </div>
        </div>
      )}

      {/* ── SECTION 4: Matched Scheme Cards ──────────── */}
      <div>
        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">🏛️ Matched Government Schemes</h3>
        <div className="space-y-4">
          {schemes.map((scheme: any, i: number) => {
            const link = getOfficialSchemeLink(scheme.name, scheme.link);
            const isTop = scheme.rank === 1;
            return (
              <div key={i} className={`p-5 rounded-3xl border transition-all duration-200 hover:scale-[1.005] ${isTop ? "bg-gradient-to-br from-primary/8 to-primary/3 border-primary/30" : "bg-white/3 border-white/8"}`}>
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${isTop ? "bg-primary text-white" : "bg-white/10 text-white/60"}`}>
                      #{scheme.rank}
                    </div>
                    <div>
                      <p className="font-black text-white text-sm leading-snug">{scheme.name}</p>
                      <p className="text-white/40 text-xs mt-0.5">{scheme.ministry} · {scheme.agency}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-2xl font-black text-emerald-400">{scheme.relevanceScore}%</p>
                      <p className="text-[8px] text-white/30 uppercase tracking-wider">Relevance</p>
                    </div>
                  </div>
                </div>

                {/* Relevance Bar */}
                <div className="w-full bg-white/5 rounded-full h-1.5 mb-4">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-1000"
                    style={{ width: `${scheme.relevanceScore}%` }} />
                </div>

                {/* Badges Row */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${catColor(scheme.category)}`}>
                    {scheme.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black ${eligBadge(scheme.eligibilityStatus)}`}>
                    {scheme.eligibilityStatus}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black ${diffBadge(scheme.applicationDifficulty)}`}>
                    {scheme.applicationDifficulty}
                  </span>
                  {scheme.equityFree && (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[9px] font-black">
                      ✓ Equity-Free
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${scheme.status === "Active" ? "bg-green-500/10 text-green-400" : scheme.status === "Rolling" ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"}`}>
                    {scheme.status}
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-white/3 rounded-xl text-center">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-wider">Funding</p>
                    <p className="text-sm font-black text-emerald-400 mt-1">{scheme.fundingAmount}</p>
                  </div>
                  <div className="p-3 bg-white/3 rounded-xl text-center">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-wider">Eligibility</p>
                    <p className={`text-xl font-black mt-1 ${scoreColor(scheme.eligibilityScore)}`}>{scheme.eligibilityScore}/10</p>
                  </div>
                  <div className="p-3 bg-white/3 rounded-xl text-center">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-wider">Approval</p>
                    <p className={`text-xl font-black mt-1 ${scoreColor(Math.round(scheme.approvalProbability / 10))}`}>{scheme.approvalProbability}%</p>
                  </div>
                </div>

                {/* Why + Gap */}
                <div className="space-y-2 mb-4">
                  <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                    <p className="text-[8px] font-black text-emerald-400 uppercase tracking-wider mb-0.5">✅ WHY IT MATCHES</p>
                    <p className="text-white/70 text-xs">{scheme.whyItMatches}</p>
                  </div>
                  {scheme.eligibilityGap && scheme.eligibilityStatus !== "Eligible" && (
                    <div className="flex items-start gap-2 p-2.5 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                      <AlertTriangle className="h-3 w-3 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[8px] font-black text-amber-400 uppercase tracking-wider mb-0.5">ELIGIBILITY GAP</p>
                        <p className="text-white/70 text-xs">{scheme.eligibilityGap}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Apply CTA */}
                <a href={link} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all duration-200 hover:scale-105 ${isTop ? "bg-primary/20 border border-primary text-primary hover:bg-primary/30" : "bg-white/5 border border-white/15 text-white/70 hover:border-white/30 hover:text-white"}`}
                >
                  Apply Now <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 5: Document Checklist ────────────── */}
      {data.documentChecklist && (
        <div>
          <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">📋 Document Preparation Checklist</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { key: "available", label: "Available", icon: "✅", color: "bg-emerald-500/5 border-emerald-500/15", pill: "bg-emerald-500/10 text-emerald-300" },
              { key: "missing",   label: "Missing",   icon: "❌", color: "bg-red-500/5 border-red-500/15",       pill: "bg-red-500/10 text-red-300" },
              { key: "optional",  label: "Optional",  icon: "⚪", color: "bg-white/3 border-white/8",            pill: "bg-white/8 text-white/50" },
            ].map((col) => (
              <div key={col.key} className={`p-4 ${col.color} border rounded-2xl`}>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-3">{col.icon} {col.label}</p>
                <div className="space-y-1.5">
                  {(data.documentChecklist[col.key] || []).map((doc: string, i: number) => (
                    <div key={i} className={`px-2.5 py-1.5 ${col.pill} rounded-lg text-[10px] font-medium`}>{doc}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 6: 4-Phase Funding Roadmap ───────── */}
      {data.fundingRoadmap?.length > 0 && (
        <div>
          <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">🗺️ Funding Strategy Roadmap</h3>
          <div className="flex gap-2 mb-4">
            {data.fundingRoadmap.map((p: any) => (
              <button key={p.phase} onClick={() => setActivePhase(p.phase)}
                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-200 border
                  ${activePhase === p.phase
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-white/5 border-white/8 text-white/40 hover:text-white"
                  }`}
              >
                Phase {p.phase}
              </button>
            ))}
          </div>
          {data.fundingRoadmap.filter((p: any) => p.phase === activePhase).map((p: any) => (
            <div key={p.phase} className="p-5 bg-primary/5 border border-primary/20 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <p className="font-black text-primary text-sm uppercase tracking-widest">{p.title}</p>
                <span className="px-2 py-0.5 bg-primary/10 rounded-lg text-[10px] font-black text-primary">{p.timeframe}</span>
              </div>
              <p className="text-white/80 text-sm mb-3">{p.action}</p>
              <div className="flex items-center gap-2 p-2 bg-white/3 rounded-xl">
                <IndianRupee className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                <p className="text-emerald-400 text-xs font-bold">Target Scheme: {p.scheme}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SECTION 7: Regulatory Incentives ─────────── */}
      {data.regulatoryIncentives?.length > 0 && (
        <div>
          <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">💡 Regulatory Incentives & Tax Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.regulatoryIncentives.map((inc: any, i: number) => (
              <div key={i} className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl">
                <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-2">⚡ {inc.type}</p>
                <p className="text-white/80 text-sm mb-2">{inc.benefit}</p>
                <p className="text-emerald-400 font-black text-sm">Saves: {inc.annualSaving} / year</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 8: Alternatives ──────────────────── */}
      {data.alternatives && (
        <div>
          <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">🔄 Alternative Funding Sources</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { key: "incubators",   label: "Incubators",   icon: "🏢", color: "bg-blue-500/5 border-blue-500/15",     pill: "bg-blue-500/10 text-blue-300" },
              { key: "accelerators", label: "Accelerators", icon: "🚀", color: "bg-violet-500/5 border-violet-500/15", pill: "bg-violet-500/10 text-violet-300" },
              { key: "competitions", label: "Competitions", icon: "🏆", color: "bg-amber-500/5 border-amber-500/15",   pill: "bg-amber-500/10 text-amber-300" },
            ].map((alt) => (
              <div key={alt.key} className={`p-4 ${alt.color} border rounded-2xl`}>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-3">{alt.icon} {alt.label}</p>
                <div className="space-y-1.5">
                  {(data.alternatives[alt.key] || []).map((item: string, i: number) => (
                    <div key={i} className={`px-2.5 py-1.5 ${alt.pill} rounded-lg text-[10px] font-medium`}>{item}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 9: Founder Action Plan ───────────── */}
      {data.actionPlan && (
        <div>
          <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">⚡ Founder Action Plan</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: "next7Days",  label: "Next 7 Days",  color: "bg-red-500/5 border-red-500/20",     heading: "text-red-400" },
              { key: "next30Days", label: "Next 30 Days", color: "bg-amber-500/5 border-amber-500/20", heading: "text-amber-400" },
              { key: "next60Days", label: "Next 60 Days", color: "bg-blue-500/5 border-blue-500/20",   heading: "text-blue-400" },
              { key: "next90Days", label: "Next 90 Days", color: "bg-violet-500/5 border-violet-500/20",heading: "text-violet-400" },
            ].map((period) => (
              <div key={period.key} className={`p-4 ${period.color} border rounded-2xl`}>
                <p className={`text-[9px] font-black uppercase tracking-widest mb-3 ${period.heading}`}>{period.label}</p>
                <div className="space-y-2">
                  {(data.actionPlan[period.key] || []).map((action: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-white/70">
                      <ChevronRight className={`h-3 w-3 flex-shrink-0 mt-0.5 ${period.heading}`} />{action}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 10: Strategic Recommendations ────── */}
      {data.recommendations && (
        <div>
          <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">🎯 Strategic Funding Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { key: "bestSchemeFirst",         icon: "🥇", label: "Apply First",             color: "bg-primary/5 border-primary/20 text-primary" },
              { key: "highestFundingOpportunity",icon: "💰", label: "Highest Funding",          color: "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" },
              { key: "fastestApproval",         icon: "⚡", label: "Fastest Approval",         color: "bg-blue-500/5 border-blue-500/20 text-blue-400" },
              { key: "lowestEffort",            icon: "🔓", label: "Lowest Effort",            color: "bg-cyan-500/5 border-cyan-500/20 text-cyan-400" },
              { key: "biggestEligibilityGap",   icon: "⚠️", label: "Biggest Eligibility Gap",  color: "bg-red-500/5 border-red-500/20 text-red-400" },
              { key: "mostValuableIncentive",   icon: "💡", label: "Most Valuable Incentive",  color: "bg-violet-500/5 border-violet-500/20 text-violet-400" },
            ].map((rec) => (
              <div key={rec.key} className={`p-4 ${rec.color} border rounded-2xl`}>
                <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${rec.color.split(" ")[2]}`}>{rec.icon} {rec.label}</p>
                <p className="text-white/80 text-sm font-medium">{data.recommendations[rec.key]}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ── Generic Result Renderer ────────────────────────────
export function GenericResult({ data }: { data: any }) {
  const render = (obj: any, depth = 0): React.ReactNode => {
    if (typeof obj === "string") return <span className="text-white/80">{obj}</span>;
    if (typeof obj === "number") return <span className="text-primary font-black">{obj}</span>;
    if (typeof obj === "boolean") return <span className={obj ? "text-emerald-400" : "text-red-400"}>{obj ? "Yes" : "No"}</span>;
    if (Array.isArray(obj)) {
      return (
        <ul className="space-y-1 mt-1">
          {obj.map((item, i) => (
            <li key={i} className={`flex items-start gap-2 text-sm ${depth === 0 ? "ml-0" : "ml-4"}`}>
              <span className="text-primary mt-0.5 flex-shrink-0">→</span>
              {render(item, depth + 1)}
            </li>
          ))}
        </ul>
      );
    }
    if (typeof obj === "object" && obj !== null) {
      return (
        <div className={`space-y-3 ${depth > 0 ? "ml-4 mt-2" : ""}`}>
          {Object.entries(obj).map(([key, val]) => (
            <div key={key} className="p-3 bg-white/5 rounded-xl border border-white/5">
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">
                {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}
              </p>
              <div>{render(val, depth + 1)}</div>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };
  return <div className="space-y-3">{render(data)}</div>;
}

// ── Customer Discovery Result Renderer ────────────────
export function DiscoveryResult({ data }: { data: any }) {
  const [activeSection, setActiveSection] = useState<string>("segments");

  const verdict = data.verdict || "MODERATE VALIDATION";
  const verdictConfig: Record<string, { bg: string; border: string; text: string; icon: string; sub: string }> = {
    "STRONG CUSTOMER VALIDATION": { bg: "from-emerald-500/20 to-green-500/10", border: "border-emerald-500/50", text: "text-emerald-400", icon: "🎯", sub: "Customers clearly exist and are reachable" },
    "MODERATE VALIDATION":        { bg: "from-blue-500/20 to-cyan-500/10",     border: "border-blue-500/50",    text: "text-blue-400",    icon: "🔬", sub: "Customers exist — assumptions need testing" },
    "WEAK VALIDATION":            { bg: "from-amber-500/20 to-orange-500/10",  border: "border-amber-500/50",   text: "text-amber-400",   icon: "⚠️", sub: "Customer segment unclear — validate urgently" },
    "CRITICAL RISK":              { bg: "from-red-500/20 to-rose-500/10",      border: "border-red-500/50",     text: "text-red-400",     icon: "🛑", sub: "No clear customer demand identified" },
  };
  const vc = verdictConfig[verdict] || verdictConfig["MODERATE VALIDATION"];
  const sc = data.scorecard || {};

  const scorecardItems = [
    { key: "problemSeverity",     label: "Problem",      icon: "🎯" },
    { key: "customerClarity",     label: "Clarity",      icon: "👁️" },
    { key: "marketAccessibility", label: "Access",       icon: "🌐" },
    { key: "willingnessToPay",    label: "WTP",          icon: "💰" },
    { key: "earlyAdopterPotential",label:"Adoption",     icon: "🚀" },
    { key: "retentionPotential",  label: "Retention",    icon: "🔄" },
    { key: "acquisitionEase",     label: "Acquisition",  icon: "📣" },
    { key: "revenuePotential",    label: "Revenue",      icon: "📈" },
  ];

  const sections = [
    { id: "segments",    label: "Segments"    },
    { id: "icp",         label: "ICP"         },
    { id: "pain",        label: "Pain & JTBD" },
    { id: "triggers",    label: "Triggers"    },
    { id: "wtp",         label: "WTP"         },
    { id: "channels",    label: "Channels"    },
    { id: "voice",       label: "Voice"       },
    { id: "objections",  label: "Objections"  },
    { id: "questions",   label: "Questions"   },
    { id: "roadmap",     label: "Roadmap"     },
  ];

  const scoreColor = (s: number) => s >= 7 ? "text-emerald-400" : s >= 5 ? "text-amber-400" : "text-red-400";
  const importanceBadge = (level: string) => {
    const l = (level || "").toLowerCase();
    if (l === "high") return "bg-rose-500/10 border-rose-500/20 text-rose-400";
    if (l === "medium") return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
  };
  const wtpBadge = (v: string) => {
    const l = (v || "").toLowerCase();
    if (l === "high") return "bg-emerald-500/15 border-emerald-500/30 text-emerald-300";
    if (l === "medium") return "bg-amber-500/15 border-amber-500/30 text-amber-300";
    return "bg-red-500/15 border-red-500/30 text-red-300";
  };
  const costBadge = (v: string) => {
    const l = (v || "").toLowerCase();
    if (l === "free") return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    if (l === "low") return "bg-blue-500/10 border-blue-500/20 text-blue-400";
    if (l === "medium") return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    return "bg-red-500/10 border-red-500/20 text-red-400";
  };

  const renderSection = () => {
    switch (activeSection) {

      case "segments": return (
        <div className="space-y-4">
          <h4 className="font-black text-white text-sm uppercase tracking-wider">Customer Segment Ranking</h4>
          <div className="space-y-3">
            {(data.segments || []).map((seg: any, i: number) => (
              <div key={i} className={`p-4 rounded-2xl border ${seg.rank === 1 ? "bg-primary/8 border-primary/25" : "bg-white/3 border-white/8"}`}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${seg.rank === 1 ? "bg-primary text-white" : "bg-white/10 text-white/60"}`}>
                      #{seg.rank}
                    </div>
                    <div>
                      <p className="font-black text-white text-sm">{seg.name}</p>
                      <p className="text-white/50 text-xs">{seg.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${seg.type === "Primary" ? "bg-primary/15 border-primary/30 text-primary" : "bg-white/5 border-white/10 text-white/50"}`}>
                      {seg.type}
                    </span>
                    <span className={`px-2 py-0.5 border rounded-full text-[9px] font-black ${wtpBadge(seg.willingnessToPay)}`}>
                      WTP: {seg.willingnessToPay}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-white/3 rounded-xl">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-wider">Pain</p>
                    <p className={`text-base font-black ${scoreColor(seg.painSeverity)}`}>{seg.painSeverity}/10</p>
                  </div>
                  <div className="p-2 bg-white/3 rounded-xl">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-wider">Adopter Score</p>
                    <p className={`text-base font-black ${scoreColor(seg.earlyAdopterScore)}`}>{seg.earlyAdopterScore}/10</p>
                  </div>
                  <div className="p-2 bg-white/3 rounded-xl">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-wider">Revenue</p>
                    <p className="text-xs font-black text-emerald-400">{seg.revenuePotenial || seg.revenuePotential}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

      case "icp": {
        const icp = data.icp || {};
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-white text-sm uppercase tracking-wider">Ideal Customer Profile</h4>
              <span className={`text-2xl font-black ${scoreColor(icp.confidenceScore || 0)}`}>{icp.confidenceScore || 0}/10</span>
            </div>
            <div className="p-5 bg-gradient-to-br from-blue-500/10 to-violet-500/5 border border-blue-500/20 rounded-2xl">
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Age", value: icp.age },
                  { label: "Occupation", value: icp.occupation },
                  { label: "Industry", value: icp.industry },
                  { label: "Income", value: icp.incomeLevel },
                  { label: "Geography", value: icp.geography },
                  { label: "Tech Adoption", value: icp.techAdoption },
                ].map((f) => f.value ? (
                  <div key={f.label} className="p-2 bg-white/5 rounded-xl">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-wider">{f.label}</p>
                    <p className="text-white/80 text-xs font-semibold mt-0.5">{f.value}</p>
                  </div>
                ) : null)}
              </div>
              {icp.goals?.length > 0 && (
                <div className="mb-3">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">🎯 GOALS</p>
                  <div className="flex flex-wrap gap-1.5">
                    {icp.goals.map((g: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/15 rounded-lg text-[10px] font-medium text-emerald-300">{g}</span>
                    ))}
                  </div>
                </div>
              )}
              {icp.frustrations?.length > 0 && (
                <div className="mb-3">
                  <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-2">😤 FRUSTRATIONS</p>
                  <div className="flex flex-wrap gap-1.5">
                    {icp.frustrations.map((f: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-red-500/10 border border-red-500/15 rounded-lg text-[10px] font-medium text-red-300">{f}</span>
                    ))}
                  </div>
                </div>
              )}
              {icp.buyingBehavior && (
                <div className="p-3 bg-white/3 rounded-xl">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">BUYING BEHAVIOR</p>
                  <p className="text-white/70 text-xs">{icp.buyingBehavior}</p>
                </div>
              )}
              {icp.preferredChannels?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {icp.preferredChannels.map((c: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/15 rounded-lg text-[10px] font-bold text-cyan-300">{c}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      case "pain": {
        const pain = data.painAnalysis || {};
        const jtbd = data.jtbd || {};
        const severity = pain.painSeverityScore || 0;
        const severityLabel = severity >= 9 ? "Mission-Critical" : severity >= 7 ? "Significant Pain" : severity >= 4 ? "Moderate Problem" : "Minor Annoyance";
        const severityColor = severity >= 9 ? "text-red-400" : severity >= 7 ? "text-orange-400" : severity >= 4 ? "text-amber-400" : "text-emerald-400";
        return (
          <div className="space-y-4">
            <h4 className="font-black text-white text-sm uppercase tracking-wider">Pain & Jobs-To-Be-Done</h4>
            <div className="p-5 bg-red-500/5 border border-red-500/15 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">Pain Analysis</p>
                <div className="text-right">
                  <span className={`text-2xl font-black ${severityColor}`}>{severity}/10</span>
                  <p className={`text-[9px] font-black uppercase ${severityColor}`}>{severityLabel}</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Core Problem", value: pain.coreProblem, icon: "🎯" },
                  { label: "Root Cause", value: pain.rootCause, icon: "🔍" },
                  { label: "Emotional Impact", value: pain.emotionalImpact, icon: "💔" },
                  { label: "Financial Impact", value: pain.financialImpact, icon: "💸" },
                  { label: "Productivity Impact", value: pain.productivityImpact, icon: "⏱️" },
                ].map((item) => item.value ? (
                  <div key={item.label} className="flex items-start gap-3 p-2 bg-white/3 rounded-xl">
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-[8px] font-black text-white/30 uppercase tracking-wider">{item.label}</p>
                      <p className="text-white/80 text-xs font-medium">{item.value}</p>
                    </div>
                  </div>
                ) : null)}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] font-black text-amber-400">Frequency: {pain.frequency}</span>
              </div>
            </div>
            {(jtbd.functional || jtbd.emotional || jtbd.social) && (
              <div className="p-5 bg-violet-500/5 border border-violet-500/15 rounded-2xl">
                <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-3">🧠 JOBS-TO-BE-DONE</p>
                <div className="space-y-2">
                  {[
                    { label: "⚙️ Functional", value: jtbd.functional },
                    { label: "❤️ Emotional", value: jtbd.emotional },
                    { label: "👥 Social", value: jtbd.social },
                  ].map((j) => j.value ? (
                    <div key={j.label} className="flex items-start gap-3 p-2 bg-white/3 rounded-xl">
                      <span className="text-xs text-white/40 font-black w-20 flex-shrink-0">{j.label}</span>
                      <p className="text-white/80 text-xs font-medium">{j.value}</p>
                    </div>
                  ) : null)}
                </div>
              </div>
            )}
            {data.existingSolutions?.length > 0 && (
              <div className="p-4 bg-white/3 border border-white/8 rounded-2xl">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3">🔧 CURRENT WORKAROUNDS</p>
                <div className="space-y-2">
                  {data.existingSolutions.map((sol: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-white/3 rounded-xl">
                      <div>
                        <p className="text-white/80 text-xs font-semibold">{sol.name}</p>
                        <p className="text-red-400 text-[10px]">{sol.flaw}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-[8px] text-white/30 uppercase">Switching</p>
                        <p className={`text-sm font-black ${scoreColor(10 - sol.switchingDifficulty)}`}>{sol.switchingDifficulty}/10</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      case "triggers": return (
        <div className="space-y-4">
          <h4 className="font-black text-white text-sm uppercase tracking-wider">Buying Trigger Events</h4>
          <div className="space-y-3">
            {(data.buyingTriggers || []).map((t: any, i: number) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-white/3 border border-white/8 rounded-2xl">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${t.rank === 1 ? "bg-primary text-white" : "bg-white/10 text-white/60"}`}>
                  #{t.rank}
                </div>
                <div className="flex-1">
                  <p className="text-white/80 text-sm font-semibold">{t.trigger}</p>
                </div>
                <span className={`px-2 py-1 text-[9px] font-black border rounded-lg flex-shrink-0 ${importanceBadge(t.importance)}`}>
                  {t.importance}
                </span>
              </div>
            ))}
          </div>
        </div>
      );

      case "wtp": {
        const wtp = data.willingnessToPayAnalysis || {};
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-white text-sm uppercase tracking-wider">Willingness To Pay</h4>
              <div className="flex gap-3">
                <div className="text-center">
                  <p className={`text-xl font-black ${scoreColor(wtp.likelihoodToPayScore || 0)}`}>{wtp.likelihoodToPayScore || 0}/10</p>
                  <p className="text-[8px] text-white/30 uppercase tracking-wider">Likelihood</p>
                </div>
                <div className="text-center">
                  <p className={`text-xl font-black ${scoreColor(10 - (wtp.priceSensitivityScore || 5))}`}>{wtp.priceSensitivityScore || 0}/10</p>
                  <p className="text-[8px] text-white/30 uppercase tracking-wider">Sensitivity</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: "🆓 Free Tier Users", value: wtp.freeTier, color: "bg-white/3 border-white/8" },
                { label: "💵 Budget Buyers", value: wtp.budgetBuyers, color: "bg-blue-500/5 border-blue-500/15" },
                { label: "💎 Premium Buyers", value: wtp.premiumBuyers, color: "bg-violet-500/5 border-violet-500/15" },
              ].map((tier) => tier.value ? (
                <div key={tier.label} className={`p-4 ${tier.color} border rounded-2xl`}>
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">{tier.label}</p>
                  <p className="text-white/80 text-sm">{tier.value}</p>
                </div>
              ) : null)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl">
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">✅ WHY THEY PAY</p>
                <p className="text-white/80 text-xs">{wtp.whyTheyPay}</p>
              </div>
              <div className="p-4 bg-red-500/5 border border-red-500/15 rounded-2xl">
                <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-2">❌ WHY THEY REFUSE</p>
                <p className="text-white/80 text-xs">{wtp.whyTheyRefuse}</p>
              </div>
            </div>
          </div>
        );
      }

      case "channels": return (
        <div className="space-y-4">
          <h4 className="font-black text-white text-sm uppercase tracking-wider">Customer Acquisition Channels</h4>
          <div className="space-y-3">
            {(data.acquisitionChannels || []).map((ch: any, i: number) => (
              <div key={i} className={`p-4 rounded-2xl border ${ch.rank === 1 ? "bg-primary/8 border-primary/25" : "bg-white/3 border-white/8"}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${ch.rank === 1 ? "bg-primary text-white" : "bg-white/10 text-white/60"}`}>
                      #{ch.rank}
                    </div>
                    <div>
                      <p className="font-black text-white text-sm">{ch.channel}</p>
                      <p className="text-white/40 text-xs">{ch.platform}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-black border rounded-lg flex-shrink-0 ${costBadge(ch.cost)}`}>
                    {ch.cost}
                  </span>
                </div>
                <p className="text-white/60 text-xs ml-10">{ch.tactic}</p>
              </div>
            ))}
          </div>
        </div>
      );

      case "voice": {
        const voc = data.voiceOfCustomer || {};
        return (
          <div className="space-y-4">
            <h4 className="font-black text-white text-sm uppercase tracking-wider">Voice of Customer</h4>
            {voc.quotes?.length > 0 && (
              <div className="space-y-3">
                {voc.quotes.map((q: string, i: number) => (
                  <div key={i} className="p-4 bg-white/3 border border-white/8 rounded-2xl relative">
                    <span className="absolute top-2 left-3 text-3xl text-white/10 font-serif leading-none">"</span>
                    <p className="text-white/80 text-sm italic pl-5">{q}</p>
                  </div>
                ))}
              </div>
            )}
            {voc.commonComplaints?.length > 0 && (
              <div className="p-4 bg-red-500/5 border border-red-500/15 rounded-2xl">
                <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-3">🔴 MOST COMMON COMPLAINTS</p>
                <div className="space-y-2">
                  {voc.commonComplaints.map((c: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-white/70">
                      <XCircle className="h-3 w-3 text-red-400 flex-shrink-0 mt-0.5" />{c}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {voc.desiredOutcomes?.length > 0 && (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl">
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-3">✅ MOST DESIRED OUTCOMES</p>
                <div className="space-y-2">
                  {voc.desiredOutcomes.map((o: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-white/70">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0 mt-0.5" />{o}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      case "objections": return (
        <div className="space-y-4">
          <h4 className="font-black text-white text-sm uppercase tracking-wider">Objection Analysis</h4>
          <div className="space-y-3">
            {(data.objections || []).map((obj: any, i: number) => (
              <div key={i} className="p-4 bg-white/3 border border-white/8 rounded-2xl">
                <div className="flex items-start gap-3 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-white/90 text-sm font-semibold">{obj.objection}</p>
                </div>
                <div className="flex items-start gap-3 ml-7">
                  <Shield className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-emerald-400 text-xs">{obj.mitigation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

      case "questions": return (
        <div className="space-y-4">
          <h4 className="font-black text-white text-sm uppercase tracking-wider">Discovery Interview Questions</h4>
          <p className="text-white/40 text-xs">Ask these questions — never ask "Would you use this?"</p>
          <div className="space-y-2">
            {(data.discoveryQuestions || []).map((q: any, i: number) => (
              <div key={i} className="p-4 bg-white/3 border border-white/8 hover:border-primary/30 rounded-2xl transition-colors group">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-white/90 text-sm font-medium group-hover:text-white transition-colors">"{q.question}"</p>
                    <p className="text-primary text-[9px] font-black uppercase tracking-widest mt-1">Uncovers: {q.purpose}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

      case "roadmap": return (
        <div className="space-y-4">
          <h4 className="font-black text-white text-sm uppercase tracking-wider">Customer Validation Roadmap</h4>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-violet-500 to-transparent" />
            <div className="space-y-4">
              {(data.validationRoadmap || []).map((w: any, i: number) => (
                <div key={i} className="relative flex gap-4 pl-12">
                  <div className="absolute left-3 top-2 w-5 h-5 rounded-full bg-primary border-2 border-background flex items-center justify-center text-[10px] font-black text-white z-10">
                    {w.week}
                  </div>
                  <div className="flex-1 p-4 bg-white/3 border border-white/8 rounded-2xl hover:border-primary/30 transition-colors">
                    <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">WEEK {w.week}: {w.action}</p>
                    <p className="text-white/70 text-xs">{w.goal}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div className="space-y-8">

      {/* ── SECTION 1: Verdict Banner ────────────────────── */}
      <div className={`p-6 bg-gradient-to-br ${vc.bg} border-2 ${vc.border} rounded-3xl`}>
        <div className="flex items-start gap-4">
          <span className="text-3xl">{vc.icon}</span>
          <div>
            <p className={`text-xl font-black uppercase tracking-widest ${vc.text}`}>{verdict}</p>
            <p className={`text-sm font-bold ${vc.text} opacity-70 mt-1`}>{vc.sub}</p>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Customer Discovery Scorecard ─────── */}
      <div>
        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">📊 Customer Discovery Scorecard</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {scorecardItems.map((item) => {
            const score = sc[item.key] ?? 0;
            const col = score >= 7 ? "border-emerald-500/20 bg-emerald-500/5" : score >= 5 ? "border-amber-500/20 bg-amber-500/5" : "border-red-500/20 bg-red-500/5";
            return (
              <button
                key={item.key}
                className={`p-3 border rounded-2xl text-left transition-all duration-200 hover:scale-105 cursor-pointer ${col}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">{item.icon}</span>
                  <span className={`text-lg font-black ${scoreColor(score)}`}>{score}</span>
                </div>
                <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">{item.label}</p>
                <div className="w-full bg-white/5 rounded-full h-1.5 mt-1.5">
                  <div className={`h-1.5 rounded-full transition-all duration-1000 ${score >= 7 ? "bg-emerald-500" : score >= 5 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${score * 10}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 3: Deep Dive Tabs ────────────────────── */}
      <div>
        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">🔬 Customer Intelligence Deep Dive</h3>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 border
                ${activeSection === s.id
                  ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                  : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="p-5 bg-white/3 border border-white/8 rounded-3xl min-h-[200px]">
          {renderSection()}
        </div>
      </div>

      {/* ── SECTION 4: Strategic Recommendations ────────── */}
      {data.recommendations && (
        <div>
          <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">🚀 Strategic Founder Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { key: "bestSegmentFirst",    icon: "🎯", label: "Best Segment First",     color: "bg-primary/5 border-primary/20 text-primary" },
              { key: "fastest100Users",     icon: "⚡", label: "Fastest 100 Users",       color: "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" },
              { key: "pricingStrategy",     icon: "💰", label: "Pricing Strategy",        color: "bg-amber-500/5 border-amber-500/20 text-amber-400" },
              { key: "biggestCustomerRisk", icon: "⚠️", label: "Biggest Customer Risk",   color: "bg-red-500/5 border-red-500/20 text-red-400" },
              { key: "segmentToAvoid",      icon: "🚫", label: "Segment To Avoid",        color: "bg-rose-500/5 border-rose-500/20 text-rose-400" },
              { key: "mostValuableInsight", icon: "💡", label: "Most Valuable Insight",   color: "bg-violet-500/5 border-violet-500/20 text-violet-400" },
            ].map((rec) => (
              <div key={rec.key} className={`p-4 ${rec.color} border rounded-2xl`}>
                <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${rec.color.split(" ")[2]}`}>{rec.icon} {rec.label}</p>
                <p className="text-white/80 text-sm font-medium">{data.recommendations[rec.key]}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Hiring Result Renderer ────────────────────────────
export function HiringResult({ data }: { data: any }) {
  const [activeSection, setActiveSection] = useState<string>("roadmap");

  const verdict = data.verdict || "LEAN MVP CONTRACTORS";
  const verdictConfig: Record<string, { bg: string; border: string; text: string; icon: string; sub: string }> = {
    "AI-FIRST AUTOMATED":     { bg: "from-purple-500/20 to-indigo-500/10", border: "border-purple-500/50", text: "text-purple-400", icon: "🤖", sub: "Maximize AI agent efficiency before human payroll" },
    "LEAN MVP CONTRACTORS":   { bg: "from-blue-500/20 to-cyan-500/10",     border: "border-blue-500/50",    text: "text-blue-400",    icon: "🛠️", sub: "Utilize freelance & contract talent to build MVP" },
    "FULL-TIME BUILD":        { bg: "from-emerald-500/20 to-green-500/10", border: "border-emerald-500/50", text: "text-emerald-400", icon: "🏢", sub: "High complexity requiring a dedicated full-time team" },
    "HYBRID AGENCY-FOUNDER":  { bg: "from-amber-500/20 to-orange-500/10",  border: "border-amber-500/50",   text: "text-amber-400",   icon: "🤝", sub: "Partner with an agency while founders drive product" }
  };
  const vc = verdictConfig[verdict] || verdictConfig["LEAN MVP CONTRACTORS"];
  const sc = data.scorecard || {};

  const scorecardItems = [
    { key: "talentScarcity",       label: "Talent Scarcity",   icon: "🔍" },
    { key: "hiringUrgency",        label: "Hiring Urgency",    icon: "🚨" },
    { key: "costEfficiency",       label: "Cost Efficiency",   icon: "💡" },
    { key: "technicalComplexity",  label: "Tech Complexity",   icon: "⚙️" },
    { key: "automationPotential",  label: "AI Automation",     icon: "🤖" },
    { key: "founderGapScore",      label: "Founder Gap",       icon: "🧩" }
  ];

  const sections = [
    { id: "roadmap",      label: "Workforce Roadmap" },
    { id: "automation",   label: "AI Automation"     },
    { id: "skillsGap",    label: "Skills Gap"        },
    { id: "recruitment",  label: "Sourcing & Hiring" },
    { id: "firstHire",    label: "First Hire JD"     },
    { id: "strategy",     label: "Strategy Tips"     }
  ];

  const scoreColor = (s: number) => s >= 7 ? "text-emerald-400" : s >= 5 ? "text-amber-400" : "text-red-400";
  const urgencyBadge = (v: string) => {
    const l = (v || "").toLowerCase();
    if (l === "critical") return "bg-rose-500/10 border-rose-500/20 text-rose-400";
    if (l === "high") return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    return "bg-blue-500/10 border-blue-500/20 text-blue-400";
  };
  const roleTypeBadge = (v: string) => {
    const l = (v || "").toLowerCase();
    if (l === "full-time") return "bg-emerald-500/15 border-emerald-500/30 text-emerald-300";
    if (l === "part-time") return "bg-blue-500/15 border-blue-500/30 text-blue-300";
    if (l === "contractor") return "bg-violet-500/15 border-violet-500/30 text-violet-300";
    if (l === "freelancer") return "bg-indigo-500/15 border-indigo-500/30 text-indigo-300";
    if (l === "ai agent") return "bg-purple-500/15 border-purple-500/30 text-purple-300";
    return "bg-white/5 border-white/10 text-white/50";
  };

  const renderSection = () => {
    switch (activeSection) {
      case "roadmap": return (
        <div className="space-y-6">
          <h4 className="font-black text-white text-sm uppercase tracking-wider">Hiring Roadmap & Roles</h4>
          <div className="space-y-6">
            {(data.hiringRoadmap || []).map((phase: any, pi: number) => (
              <div key={pi} className="p-5 bg-white/3 border border-white/8 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-primary/20 text-primary flex items-center justify-center text-xs font-black">
                      P{phase.phase}
                    </span>
                    <span className="font-black text-white text-sm uppercase">{phase.title}</span>
                  </div>
                  <span className="text-xs font-semibold text-white/40">{phase.timeframe}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(phase.roles || []).map((role: any, ri: number) => (
                    <div key={ri} className="p-4 bg-white/5 border border-white/8 rounded-xl flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-black text-white text-xs">{role.role}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border flex-shrink-0 ${roleTypeBadge(role.type)}`}>
                            {role.type}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black border ${urgencyBadge(role.urgency)}`}>
                            {role.urgency}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-black border bg-white/5 border-white/10 text-white/70">
                            💰 {role.cost}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-black border bg-white/5 border-white/10 text-white/50">
                            ⏱️ {role.timeframe}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-wider mb-1">Why Critical</p>
                        <p className="text-white/80 text-xs mb-3 font-medium">{role.whyCritical}</p>

                        {role.skills?.length > 0 && (
                          <div className="mb-3">
                            <p className="text-[10px] text-white/40 font-black uppercase tracking-wider mb-1">Key Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {role.skills.map((s: string, idx: number) => (
                                <span key={idx} className="bg-white/5 text-white/70 text-[10px] px-2 py-0.5 rounded-md font-medium">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-wider mb-1">KPI</p>
                        <p className="text-emerald-400 text-xs font-semibold">{role.kpi}</p>
                      </div>

                      {role.redFlags?.length > 0 && (
                        <div className="border-t border-white/5 pt-2 mt-1">
                          <p className="text-[9px] text-rose-400/80 font-black uppercase tracking-widest mb-1">Candidate Red Flags</p>
                          <ul className="list-disc list-inside text-[11px] text-white/50 space-y-0.5">
                            {role.redFlags.map((rf: string, idx: number) => (
                              <li key={idx}>{rf}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

      case "automation": return (
        <div className="space-y-4">
          <h4 className="font-black text-white text-sm uppercase tracking-wider">AI Automation Strategy</h4>
          <p className="text-xs text-white/50 leading-relaxed">
            Outsource these non-core operational loads directly to existing generative tools or AI agents to preserve precious capital and focus co-founders on building IP.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(data.aiAutomation || []).map((item: any, i: number) => (
              <div key={i} className="p-4 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 border border-purple-500/25 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    🤖 {item.area}
                  </span>
                  <span className="bg-purple-500/20 text-purple-300 text-[10px] font-black border border-purple-500/30 px-2 py-0.5 rounded-full">
                    AI-Driven
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-[9px] text-white/40 font-black uppercase tracking-widest">Recommended Tool</p>
                    <p className="text-white text-xs font-semibold">{item.tool}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 bg-white/5 rounded-xl">
                      <p className="text-[8px] text-white/30 font-black uppercase tracking-widest">Savings</p>
                      <p className="text-emerald-400 text-xs font-black">{item.savings}</p>
                    </div>
                    <div className="p-2 bg-white/5 rounded-xl">
                      <p className="text-[8px] text-white/30 font-black uppercase tracking-widest">Safeguard</p>
                      <p className="text-amber-400 text-xs font-black">{item.safeguard}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

      case "skillsGap": {
        const gap = data.skillsGap || {};
        return (
          <div className="space-y-6">
            <h4 className="font-black text-white text-sm uppercase tracking-wider">Founding Team Skills Gap Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-3">Founding Team Strengths</p>
                <ul className="space-y-2">
                  {(gap.foundingStrengths || []).map((s: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-white/80 text-xs font-medium">
                      <span className="text-emerald-400">✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
                <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest mb-3">Critical Missing Capabilities</p>
                <ul className="space-y-2">
                  {(gap.criticalMissing || []).map((m: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-white/80 text-xs font-medium">
                      <span className="text-rose-400">✗</span> {m}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {gap.minimumViableTeam && (
              <div className="p-4 bg-white/3 border border-white/10 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-white/40 font-black uppercase tracking-widest mb-0.5">Minimum Viable Team Target</p>
                  <p className="text-white text-sm font-black">{gap.minimumViableTeam}</p>
                </div>
                <span className="text-2xl">⚡</span>
              </div>
            )}
          </div>
        );
      }

      case "recruitment": {
        const rec = data.recruitmentStrategy || {};
        return (
          <div className="space-y-6">
            <h4 className="font-black text-white text-sm uppercase tracking-wider">Sourcing & Recruitment Strategy</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-4">
                <div className="p-4 bg-white/3 border border-white/8 rounded-2xl space-y-3">
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Target Platforms</p>
                  <div className="flex flex-wrap gap-2">
                    {(rec.platforms || []).map((plat: string, idx: number) => (
                      <span key={idx} className="bg-primary/10 border border-primary/20 text-primary text-xs px-3 py-1 rounded-full font-black">
                        {plat}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-white/3 border border-white/8 rounded-2xl space-y-3">
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Sourcing Tactics</p>
                  <ul className="space-y-2">
                    {(rec.sourcingTactics || []).map((tac: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-white/80 text-xs leading-relaxed font-medium">
                        <span className="text-primary mt-0.5">•</span> {tac}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="p-4 bg-white/3 border border-white/8 rounded-2xl space-y-3">
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Interview Process Stages</p>
                <div className="space-y-2">
                  {(rec.interviewProcess || []).map((step: string, idx: number) => (
                    <div key={idx} className="p-2.5 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                      <span className="text-white/80 text-xs font-semibold">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "firstHire": {
        const jd = data.firstHireJD || {};
        return (
          <div className="space-y-6">
            <h4 className="font-black text-white text-sm uppercase tracking-wider">Critical First Hire Job Description (JD)</h4>
            <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden shadow-2xl">
              {/* JD Header */}
              <div className="p-5 bg-gradient-to-r from-primary/20 to-purple-500/10 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full mb-1 inline-block">
                    URGENT FIRST HIRE
                  </span>
                  <h5 className="text-white text-base font-black">{jd.role}</h5>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[8px] text-white/30 font-black uppercase tracking-widest">Proposed Compensation</p>
                  <p className="text-white text-xs font-bold">{jd.compensation}</p>
                </div>
              </div>
              
              {/* JD Body */}
              <div className="p-5 space-y-4">
                {jd.aboutUs && (
                  <div>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">About Us</p>
                    <p className="text-white/80 text-xs leading-relaxed font-medium">{jd.aboutUs}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jd.responsibilities?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1.5">What You'll Do</p>
                      <ul className="space-y-1.5">
                        {jd.responsibilities.map((r: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-white/70 text-xs font-medium">
                            <span className="text-primary mt-0.5">•</span> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {jd.requirements?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1.5">What We Look For</p>
                      <ul className="space-y-1.5">
                        {jd.requirements.map((req: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-white/70 text-xs font-medium">
                            <span className="text-indigo-400 mt-0.5">•</span> {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {jd.firstWeekGoal && (
                  <div className="border-t border-white/5 pt-3 mt-2">
                    <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mb-1">First Week Goal (Deliverable)</p>
                    <p className="text-white/80 text-xs font-semibold flex items-center gap-1.5">
                      🏁 {jd.firstWeekGoal}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      case "strategy": return (
        <div className="space-y-6">
          <h4 className="font-black text-white text-sm uppercase tracking-wider">Hiring Warnings & Recommendations</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest flex items-center gap-1">
                ⚠️ Mistakes to Avoid
              </p>
              <div className="space-y-3">
                {(data.mistakesToAvoid || []).map((m: string, idx: number) => (
                  <div key={idx} className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex items-start gap-3">
                    <span className="text-rose-400 text-sm font-black mt-0.5">✕</span>
                    <p className="text-white/80 text-xs font-medium leading-relaxed">{m}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-1">
                💡 Strategic Hiring Advice
              </p>
              <div className="space-y-3">
                {(data.strategicRecommendations || []).map((rec: string, idx: number) => (
                  <div key={idx} className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                    <span className="text-emerald-400 text-sm font-black mt-0.5">✓</span>
                    <p className="text-white/80 text-xs font-medium leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Verdict Banner */}
      <div className={`p-6 rounded-2xl border bg-gradient-to-br ${vc.bg} ${vc.border} flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden`}>
        <div className="space-y-1 z-10">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/50">WORKFORCE VERDICT</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{vc.icon}</span>
            <h3 className={`text-xl font-black ${vc.text}`}>{verdict}</h3>
          </div>
          <p className="text-white/85 text-xs font-semibold mt-1 leading-relaxed">
            {data.philosophy || vc.sub}
          </p>
        </div>
        <div className="flex items-center gap-4 z-10 flex-shrink-0">
          <div className="text-right">
            <p className="text-[9px] font-black text-white/40 uppercase tracking-wider">Hiring Urgency</p>
            <p className="text-xs text-white/60 font-semibold">Overall Priority Score</p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-white/5 flex items-center justify-center relative bg-black/20">
            <div className="text-center">
              <p className="text-white text-base font-black leading-none">{data.overallTalentUrgency || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Workforce Scorecard Grid */}
      <div className="space-y-3">
        <h4 className="font-black text-white text-xs uppercase tracking-widest">Workforce Metrics Scorecard</h4>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {scorecardItems.map((item) => {
            const val = sc[item.key] ?? 5;
            return (
              <div key={item.key} className="p-3 bg-white/3 border border-white/5 rounded-2xl flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-base">{item.icon}</span>
                  <span className={`text-xs font-black ${scoreColor(val)}`}>{val}/10</span>
                </div>
                <div>
                  <p className="text-[9px] font-black text-white/50 uppercase tracking-wide truncate mb-1.5">{item.label}</p>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${val >= 7 ? "bg-emerald-400" : val >= 5 ? "bg-amber-400" : "bg-red-400"}`}
                      style={{ width: `${val * 10}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10">
        {sections.map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition-all border flex-shrink-0 ${
              activeSection === sec.id
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                : "bg-white/3 border-white/5 text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="p-5 bg-white/3 border border-white/8 rounded-2xl">
        {renderSection()}
      </div>
    </div>
  );
}

// ── Result Dispatcher ──────────────────────────────────
export function ModuleResult({ module, data, idea }: { module: ModuleId; data: any; idea: string }) {
  switch (module) {
    case "validate": return <ValidationResult data={data} />;
    case "competitors": return <CompetitorsResult data={data} />;
    case "pitch-deck": return <PitchDeckResult data={data} idea={idea} />;
    case "financials": return <FinancialsResult data={data} />;
    case "investors": return <InvestorsResult data={data} />;
    case "schemes": return <SchemesResult data={data} />;
    case "discovery": return <DiscoveryResult data={data} />;
    case "hiring": return <HiringResult data={data} />;
    default: return <GenericResult data={data} />;
  }
}


// ── Main CoFounder Tab ─────────────────────────────────
export function CoFounderTab() {
  const { data: session } = useSession();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [profile, setProfile] = useState<StartupProfile>({
    idea: "",
    sector: "",
    stage: "Pre-Seed",
    revenueModel: "SaaS",
    targetMarket: "India",
    teamSize: "2 co-founders",
    location: "India",
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleId | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultsMap, setResultsMap] = useState<Record<ModuleId, any>>({} as Record<ModuleId, any>);

  // Load startup profile and cached results from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem("promptpilot_startup_profile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
        setProfileSaved(true);
      } catch (e) {
        console.error("Failed to parse saved startup profile:", e);
      }
    }

    const savedResults = localStorage.getItem("promptpilot_cofounder_results");
    if (savedResults) {
      try {
        setResultsMap(JSON.parse(savedResults));
      } catch (e) {
        console.error("Failed to parse saved co-founder results:", e);
      }
    }
  }, []);

  const handleSaveProfile = () => {
    if (!profile.idea.trim()) {
      toast({ variant: "destructive", title: "Missing Info", description: "Please enter your startup idea first." });
      return;
    }
    localStorage.setItem("promptpilot_startup_profile", JSON.stringify(profile));
    setProfileSaved(true);

    // Clear results map since startup profile changed
    setResultsMap({} as Record<ModuleId, any>);
    localStorage.removeItem("promptpilot_cofounder_results");
    setResult(null);
    setActiveModule(null);

    toast({ title: "Startup Profile Saved", description: "All caches cleared. Modules are updated with your new context." });
  };

  const handleSelectModule = (moduleId: ModuleId) => {
    setActiveModule(moduleId);
    setError(null);
    if (resultsMap[moduleId]) {
      setResult(resultsMap[moduleId]);
    } else {
      setResult(null);
    }
  };

  const handleRunModule = async (moduleId: ModuleId) => {
    if (!profile.idea.trim()) {
      toast({ variant: "destructive", title: "Set Your Startup First", description: "Enter your idea in the startup profile above." });
      return;
    }

    setActiveModule(moduleId);
    setLoading(true);
    setResult(null);
    setError(null);

    const mod = MODULES.find((m) => m.id === moduleId);

    try {
      const res = await fetch("/api/cofounder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: moduleId,
          idea: profile.idea,
          sector: profile.sector,
          stage: profile.stage,
          revenueModel: profile.revenueModel,
          targetMarket: profile.targetMarket,
          teamSize: profile.teamSize,
          location: profile.location,
          useOllama: settings.useOllama,
          ollamaBaseUrl: settings.ollamaBaseUrl,
          ollamaModel: settings.ollamaModel,
        }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Module execution failed");

      const newResult = json.result;
      setResult(newResult);

      // Update results map and cache
      const updatedResults = { ...resultsMap, [moduleId]: newResult };
      setResultsMap(updatedResults);
      localStorage.setItem("promptpilot_cofounder_results", JSON.stringify(updatedResults));

      // Save module run to user history if session is active
      if (session) {
        try {
          await saveMissionHistory({
            taskDescription: `Run Co-Founder Module: ${mod?.title || moduleId}`,
            selectedAI: settings.useOllama ? `Ollama Co-Founder (${settings.ollamaModel})` : "Cloud Co-Founder",
            aiUrl: settings.useOllama ? (settings.ollamaBaseUrl || "http://127.0.0.1:11434") : "Cloud Routing Fleet",
            reasoning: `Executed startup module: ${moduleId}`,
            optimizedPrompt: `Module: ${moduleId}\nIdea: ${profile.idea}`,
            isImageTask: false
          });
        } catch (historyErr) {
          console.warn("Failed to save co-founder history:", historyErr);
        }
      }

      toast({ title: `${mod?.title} Complete`, description: `AI co-founder has executed your mission via ${settings.useOllama ? 'Local LLM' : 'Cloud AI'}.` });
    } catch (err: any) {
      setError(err.message || "Execution failed");
      toast({ variant: "destructive", title: "Mission Failed", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const activeModuleDef = MODULES.find((m) => m.id === activeModule);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">

      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-2 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
          <Rocket className="h-3 w-3 animate-bounce" />
          AI Co-Founder — Active
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-[0.9]">
          Your Startup,<br /><span className="text-primary italic text-glow">Accelerated.</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          From idea validation to government funding — execute every startup milestone with AI precision.
        </p>
      </div>

      {/* Startup Profile Setup */}
      <Card className="glass-panel border-white/10 rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] pointer-events-none" />
        <CardHeader className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${profileSaved ? "bg-emerald-500" : "bg-primary"}`}>
                {profileSaved ? <CheckCircle2 className="h-5 w-5 text-white" /> : <Zap className="h-5 w-5 text-white" />}
              </div>
              <div>
                <p className="font-black text-white text-sm uppercase tracking-widest">Startup Profile</p>
                <p className="text-white/40 text-xs">{profileSaved ? "Active — all modules use your context" : "Set up your startup so all 10 modules are personalized"}</p>
              </div>
            </div>
            {profileSaved && (
              <button onClick={() => setProfileSaved(false)} className="text-white/30 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Textarea
              id="startup-idea"
              placeholder="Describe your startup idea in 1-3 sentences... (e.g. 'AI-powered invoice management for Indian SMEs')"
              className="min-h-[80px] text-base border-white/10 bg-white/5 text-white placeholder:text-white/30 rounded-2xl resize-none focus-visible:ring-primary/50"
              value={profile.idea}
              onChange={(e) => setProfile((p) => ({ ...p, idea: e.target.value }))}
            />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "Sector", key: "sector", placeholder: "e.g. SaaS, Fintech, Agritech" },
                { label: "Stage", key: "stage", placeholder: "Idea / Pre-Seed / Seed" },
                { label: "Revenue Model", key: "revenueModel", placeholder: "SaaS / Marketplace / D2C" },
                { label: "Target Market", key: "targetMarket", placeholder: "India / US / Global" },
                { label: "Team Size", key: "teamSize", placeholder: "Solo / 2 founders / 5 people" },
                { label: "Location", key: "location", placeholder: "City, State" },
              ].map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">{field.label}</label>
                  <input
                    id={`startup-${field.key}`}
                    type="text"
                    placeholder={field.placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors"
                    value={(profile as any)[field.key]}
                    onChange={(e) => setProfile((p) => ({ ...p, [field.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Button
                id="startup-activate-btn"
                onClick={handleSaveProfile}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest px-8 rounded-2xl gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {profileSaved ? "Update Profile" : "Activate Co-Founder"}
              </Button>
              {!settings.useOllama && (
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                  <Globe className="h-4 w-4 animate-pulse" />
                  Cloud Co-Founder Active (Hugging Face)
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          const isActive = activeModule === mod.id;
          const isLoading = isActive && loading;
          const isCached = !!resultsMap[mod.id];
          return (
            <button
              id={`cofounder-module-btn-${mod.id}`}
              key={mod.id}
              onClick={() => handleSelectModule(mod.id)}
              disabled={loading}
              className={`
                relative p-5 rounded-3xl border bg-gradient-to-br text-left transition-all duration-300 group
                ${mod.color}
                ${isActive ? `shadow-lg ${mod.glow} scale-[1.02] border-white/40` : "hover:scale-[1.01] hover:shadow-lg border-white/10"}
                ${loading && !isActive ? "opacity-50" : ""}
              `}
            >
              {mod.badge && (
                <span className="absolute top-3 right-3 px-2 py-0.5 bg-white/10 rounded-full text-[9px] font-black text-white/70 uppercase tracking-widest">
                  {mod.badge}
                </span>
              )}
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-2xl bg-white/10 group-hover:bg-white/20 transition-colors`}>
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white text-sm mb-1">{mod.title}</p>
                  <p className="text-white/50 text-xs leading-relaxed">{mod.description}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-white/40 text-[10px] font-black uppercase tracking-widest group-hover:text-white/60 transition-colors">
                {isCached ? "View Analysis" : "Select Module"} <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Result Panel */}
      {(loading || activeModule || error) && (
        <Card className={`glass-panel rounded-3xl overflow-hidden border animate-in zoom-in-95 duration-500 ${activeModuleDef ? "border-white/20" : "border-white/10"}`}>
          <CardHeader className="p-6 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeModuleDef && (
                  <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${activeModuleDef.color}`}>
                    {loading ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <activeModuleDef.icon className="h-5 w-5 text-white" />}
                  </div>
                )}
                <div>
                  <p className="font-black text-white uppercase tracking-widest text-sm">{activeModuleDef?.title}</p>
                  <p className="text-white/40 text-xs">
                    {loading ? "AI Co-Founder executing..." : error ? "Execution failed" : result ? "Analysis Complete" : "Ready to execute"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {result && !loading && (
                  <>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] uppercase tracking-widest">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                    </Badge>
                    <Button
                      id="cofounder-rerun-btn"
                      onClick={() => handleRunModule(activeModule!)}
                      disabled={loading}
                      size="sm"
                      className="h-8 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider gap-1.5 px-3"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Re-run
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-white/50 font-medium">Running <span className="text-primary font-black">{activeModuleDef?.title}</span> analysis...</p>
                <p className="text-white/30 text-xs">This may take 30–90 seconds on local Ollama</p>
              </div>
            )}
            {error && (
              <div className="p-5 bg-red-500/10 rounded-2xl border border-red-500/20 text-center space-y-4">
                <div className="flex flex-col items-center justify-center gap-2">
                  <AlertTriangle className="h-8 w-8 text-red-400 mx-auto" />
                  <p className="text-red-400 font-black">Execution Failed</p>
                </div>
                <p className="text-white/60 text-sm max-w-md mx-auto">{error}</p>
                <Button
                  onClick={() => handleRunModule(activeModule!)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest px-6 rounded-xl text-xs"
                >
                  Retry Analysis
                </Button>
                {error.includes("Ollama") && (
                  <p className="text-white/40 text-xs mt-3">
                    Make sure Ollama is running: <code className="bg-white/10 px-2 py-0.5 rounded">ollama serve</code>
                  </p>
                )}
              </div>
            )}
            {!loading && !error && !result && activeModule && (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 animate-in fade-in duration-300">
                <div className="bg-white/5 p-5 rounded-3xl border border-white/10 text-primary">
                  {activeModuleDef && <activeModuleDef.icon className="h-10 w-10" />}
                </div>
                <div className="space-y-2">
                  <h4 className="text-white font-black text-lg">No Analysis Generated</h4>
                  <p className="text-white/50 text-sm max-w-md leading-relaxed mx-auto">
                    Generate a personalized <strong className="text-white">{activeModuleDef?.title}</strong> report based on your startup profile.
                  </p>
                </div>
                <Button
                  id="cofounder-run-btn"
                  onClick={() => handleRunModule(activeModule)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest px-8 py-4 rounded-2xl text-xs gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  Run {activeModuleDef?.title}
                </Button>
              </div>
            )}
            {result && !loading && activeModule && (
              <ModuleResult module={activeModule} data={result} idea={profile.idea} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Static Scheme Preview (always visible) */}
      {!activeModule && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest px-3">Available Government Schemes</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {GOVERNMENT_SCHEMES.slice(0, 6).map((scheme, i) => (
              <div key={i} className="p-4 bg-white/3 rounded-2xl border border-white/5 hover:border-green-500/20 transition-colors group">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-white/80 font-bold text-sm group-hover:text-white transition-colors">{scheme.name}</p>
                    <p className="text-emerald-400 text-xs font-black">{scheme.amount}</p>
                    <p className="text-white/30 text-xs mt-1">{scheme.agency}</p>
                  </div>
                  <a href={scheme.link} target="_blank" rel="noopener noreferrer"
                    className="text-white/20 hover:text-primary transition-colors flex-shrink-0">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-white/30 text-xs">
            Run <span className="text-green-400 font-black">Govt Scheme Matching</span> above to get personalized matches with application checklists
          </p>
        </div>
      )}
    </div>
  );
}
