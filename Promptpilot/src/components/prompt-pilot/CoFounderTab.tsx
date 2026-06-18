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
export function ScoreGauge({ score }: { score: number }) {
  const color = score >= 70 ? "#22c55e" : score >= 45 ? "#eab308" : "#ef4444";
  const label = score >= 70 ? "HIGH DEMAND" : score >= 45 ? "MODERATE" : "LOW / RISKY";
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
        <circle
          cx="70" cy="70" r="54" fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x="70" y="66" textAnchor="middle" fill="white" fontSize="28" fontWeight="900" fontFamily="Inter">
          {score}
        </text>
        <text x="70" y="82" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10" fontWeight="700">
          / 100
        </text>
      </svg>
      <span className="text-xs font-black uppercase tracking-widest" style={{ color }}>{label}</span>
    </div>
  );
}

// ── Validation Result Renderer ─────────────────────────
export function ValidationResult({ data }: { data: any }) {
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
            {[
              { label: "TAM", value: data.marketSize?.TAM },
              { label: "SAM", value: data.marketSize?.SAM },
              { label: "SOM", value: data.marketSize?.SOM },
            ].map((m) => (
              <div key={m.label} className="p-3 bg-primary/10 rounded-xl text-center">
                <div className="text-[9px] font-black text-primary/80 uppercase tracking-widest">{m.label}</div>
                <div className="text-xs font-bold text-white mt-1">{m.value}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-white/5 rounded-xl">
              <span className="text-white/40 font-bold uppercase text-[9px] tracking-wider block">Reddit Signal</span>
              <span className="text-white/80">{data.redditSignal}</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl">
              <span className="text-white/40 font-bold uppercase text-[9px] tracking-wider block">Google Trends</span>
              <span className="text-white/80">{data.googleTrendSignal}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
          <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-2">⚠ KEY RISKS</p>
          {data.keyRisks?.map((r: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-sm text-white/80 mb-1">
              <XCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 flex-shrink-0" />{r}
            </div>
          ))}
        </div>
        <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">✅ OPPORTUNITIES</p>
          {data.keyOpportunities?.map((o: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-sm text-white/80 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />{o}
            </div>
          ))}
        </div>
      </div>

      {data.suggestedNiche && (
        <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
          <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1">🎯 SUGGESTED NICHE</p>
          <p className="text-white/90 font-medium">{data.suggestedNiche}</p>
        </div>
      )}

      {/* Government Funding CTA */}
      {qualifies && (
        <div className="p-5 bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-2xl border-2 border-green-500/40 shadow-xl shadow-green-500/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-500 p-2 rounded-xl">
              <IndianRupee className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-green-400 font-black text-sm uppercase tracking-widest">🎉 You Qualify for Government Funding!</p>
              <p className="text-white/60 text-xs">{data.govtFundingReason}</p>
            </div>
          </div>
          <p className="text-white/80 text-sm mb-4">
            Your idea is eligible for <strong>non-dilutive grants</strong> from Indian government programs. 
            You could access <strong>₹10L – ₹50L+</strong> without giving away equity.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-green-500/20 rounded-full text-green-300 text-xs font-bold">Startup India Seed Fund (₹50L)</span>
            <span className="px-3 py-1 bg-green-500/20 rounded-full text-green-300 text-xs font-bold">NIDHI-PRAYAS (₹10L)</span>
            <span className="px-3 py-1 bg-green-500/20 rounded-full text-green-300 text-xs font-bold">DPIIT Recognition</span>
          </div>
          <p className="text-green-400 font-black text-xs mt-3 uppercase tracking-wider">
            → Run the "Govt Scheme Matching" module to get your personalized application checklist
          </p>
        </div>
      )}

      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">⚡ NEXT ACTIONS</p>
        {data.validationSteps?.map((s: string, i: number) => (
          <div key={i} className="flex items-start gap-3 text-sm text-white/80 mb-2">
            <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black flex-shrink-0">{i + 1}</span>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Competitors Result Renderer ────────────────────────
export function CompetitorsResult({ data }: { data: any }) {
  return (
    <div className="space-y-5">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {["Company", "Type", "Funding", "Pricing", "Key Feature", "Weakness"].map((h) => (
                <th key={h} className="text-left py-2 px-3 text-[9px] font-black text-white/40 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.competitors?.map((c: any, i: number) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 px-3 font-bold text-white">{c.name}</td>
                <td className="py-3 px-3">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${c.type === 'Direct' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {c.type}
                  </span>
                </td>
                <td className="py-3 px-3 text-white/70">{c.funding}</td>
                <td className="py-3 px-3 text-white/70">{c.pricing}</td>
                <td className="py-3 px-3 text-emerald-400 font-medium">{c.keyFeature}</td>
                <td className="py-3 px-3 text-red-400/80">{c.weakness}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

// ── Schemes Result Renderer ────────────────────────────
export function SchemesResult({ data }: { data: any }) {
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

      {data.dpiitRegistrationGuide?.isRequired && (
        <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/30">
          <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-2">⚡ DO THIS FIRST: DPIIT RECOGNITION</p>
          <p className="text-white/80 text-sm mb-2">{data.dpiitRegistrationGuide.benefit}</p>
          <p className="text-white/60 text-xs">{data.dpiitRegistrationGuide.howToApply}</p>
          <a href="https://www.nsws.gov.in/" target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-amber-400 text-xs font-black hover:text-amber-300">
            Apply on National Single Window System (NSWS) <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">🎯 TOP RECOMMENDATION</p>
        <p className="text-white/90 text-sm font-medium">{data.topRecommendation}</p>
      </div>

      <div className="space-y-3">
        {data.matchedSchemes?.map((scheme: any, i: number) => {
          const cleanName = scheme.name.toLowerCase();
          const dbScheme = GOVERNMENT_SCHEMES.find(s => {
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

          const nameToUse = dbScheme ? dbScheme.name : scheme.name;
          const agencyToUse = dbScheme ? dbScheme.agency : scheme.agency;
          const amountToUse = dbScheme ? dbScheme.amount : scheme.amount;
          const linkToUse = dbScheme ? dbScheme.link : (scheme.link && scheme.link.startsWith('http') ? scheme.link : 'https://www.startupindia.gov.in');
          const descriptionToUse = dbScheme ? dbScheme.description : '';

          return (
            <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-green-500/30 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-white text-sm">{nameToUse}</span>
                    <Badge className={`text-[9px] px-2 py-0.5 ${scheme.type === 'Grant' ? 'bg-green-500/20 text-green-400' : scheme.type === 'Loan' ? 'bg-blue-500/20 text-blue-400' : 'bg-violet-500/20 text-violet-400'}`}>
                      {scheme.type}
                    </Badge>
                    <Badge className={`text-[9px] px-2 py-0.5 font-black ${scheme.urgency?.includes('Now') ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {scheme.urgency}
                    </Badge>
                  </div>
                  <p className="text-emerald-400 font-black text-sm">{amountToUse}</p>
                  <p className="text-white/50 text-xs">{agencyToUse}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xl font-black text-emerald-400">{scheme.fitScore}</div>
                  <div className="text-[9px] text-white/30 uppercase tracking-widest">FIT</div>
                </div>
              </div>
              
              {descriptionToUse && (
                <p className="text-white/70 text-xs mb-3 italic bg-white/5 p-2.5 rounded-xl border border-white/5">
                  {descriptionToUse}
                </p>
              )}

              <p className="text-white/60 text-xs mb-3">{scheme.fitReason}</p>
              <div className="mb-3">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">APPLICATION STEPS</p>
                {scheme.applicationSteps?.map((step: string, si: number) => (
                  <div key={si} className="flex items-start gap-2 text-xs text-white/70 mb-1">
                    <span className="text-primary font-black">{si + 1}.</span> {step}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-white/30">Deadline: <span className="text-white/60">{scheme.deadline}</span></span>
                <a href={linkToUse} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary text-xs font-black hover:text-primary/80">
                  Apply Now <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20">
        <p className="text-[9px] font-black text-green-400 uppercase tracking-widest mb-1">⚡ DO THIS TODAY</p>
        <p className="text-white/80 font-medium text-sm">{data.firstStepToday}</p>
      </div>
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

// ── Result Dispatcher ──────────────────────────────────
export function ModuleResult({ module, data, idea }: { module: ModuleId; data: any; idea: string }) {
  switch (module) {
    case "validate": return <ValidationResult data={data} />;
    case "competitors": return <CompetitorsResult data={data} />;
    case "pitch-deck": return <PitchDeckResult data={data} idea={idea} />;
    case "financials": return <FinancialsResult data={data} />;
    case "investors": return <InvestorsResult data={data} />;
    case "schemes": return <SchemesResult data={data} />;
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
