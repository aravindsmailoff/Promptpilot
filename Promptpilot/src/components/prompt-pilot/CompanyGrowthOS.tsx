"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  DollarSign,
  Users,
  Globe,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  Award,
  Zap,
  Clock,
  Check,
  Copy,
  Lightbulb,
  HelpCircle,
  BarChart3,
  Search,
  Building,
  UserPlus,
  Play
} from "lucide-react";
import { Framer3DCard } from "@/components/framer-3d/Framer3DCard";
import { useToast } from "@/hooks/use-toast";

export interface CompanyProfile {
  companyName: string;
  archetype: "saas" | "manufacturing" | "marketplace" | "d2c" | "services" | "healthcare";
  whatBuilding: string;
  whoBuys: string;
  problemSolved: string;
  revenueModel: string;
  currentStage: "idea" | "mvp" | "early_traction" | "repeatable_growth" | "scaling";
  resourcesTeam: string;
  runwayMonths: string;
  ultimateAmbition: "cash_cow" | "million_arr" | "ten_million" | "hundred_million" | "unicorn";
}

interface ActionTask {
  id: string;
  title: string;
  whyItMatters: string;
  steps: string[];
  effort: string;
  cost: string;
  metric: string;
  done: boolean;
  toolPayload?: {
    type: "outbound_email" | "interview_script" | "landing_spec" | "pricing_matrix";
    title: string;
    content: string;
  };
}

interface GrowthDiagnostic {
  whereNow: {
    stageLabel: string;
    stageProgress: number; // 0 to 100
    nextMilestone: string;
    confirmedFacts: string[];
    founderInputs: string[];
    untestedAssumptions: string[];
  };
  biggestBottleneck: {
    title: string;
    severity: "Critical" | "High" | "Medium";
    plainEnglishWhy: string;
    costOfInaction: string;
  };
  nextThreeActions: ActionTask[];
  growthBridge: {
    explanation: string;
    financialImpact: string;
    longTermAlignment: string;
  };
}

const ARCHETYPE_CONFIG = {
  saas: {
    label: "B2B SaaS / Enterprise AI",
    icon: Zap,
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    defaultFocus: "Time-to-Value, CAC Payback, Net Revenue Retention"
  },
  manufacturing: {
    label: "Manufacturing / Hardware",
    icon: Building2,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    defaultFocus: "Supplier Reliability, BOM Optimization, Production Yield"
  },
  marketplace: {
    label: "Multi-Sided Marketplace",
    icon: Globe,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    defaultFocus: "Liquidity Balance, Cold-Start Ratio, Take-Rate"
  },
  d2c: {
    label: "D2C Brand / Physical Consumer",
    icon: Flame,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    defaultFocus: "ROAS, Repeat Purchase Cohorts, Gross Margin"
  },
  services: {
    label: "B2B Services / High-Ticket Agency",
    icon: Users,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    defaultFocus: "Delivery SOPs, Utilization Rate, Retainer Contract Value"
  },
  healthcare: {
    label: "Healthcare / MedTech / Bio",
    icon: ShieldCheck,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    defaultFocus: "Clinical Validation, Regulatory Approval, Procurement Cycles"
  }
};

const PRESET_COMPANIES: Record<string, CompanyProfile> = {
  nexa: {
    companyName: "NexaPay AI",
    archetype: "saas",
    whatBuilding: "Autonomous accounts receivable and payment reconciliation AI for Indian SMEs and exporters.",
    whoBuys: "CFOs, Finance Heads, and B2B Founders doing ₹10 Cr - ₹200 Cr annual revenue.",
    problemSolved: "Businesses lose 4-8% EBITDA due to delayed invoices, payment reconciliation errors, and manual dispute follow-ups.",
    revenueModel: "Monthly SaaS (₹15,000/mo) + 0.15% successful collections take-rate.",
    currentStage: "early_traction",
    resourcesTeam: "2 technical co-founders + 1 frontend engineer. Bootstrapped with ₹25L personal savings.",
    runwayMonths: "8 Months",
    ultimateAmbition: "million_arr"
  },
  aura: {
    companyName: "Aura Diagnostics",
    archetype: "healthcare",
    whatBuilding: "Point-of-care rapid blood biomarker analyzer with AI-assisted pathology reporting for tier-2/3 clinics.",
    whoBuys: "Independent pathology labs, diagnostic chains, and rural nursing homes.",
    problemSolved: "Standard blood test turnaround takes 24–48 hours in non-metro clinics; Aura delivers accredited results in 12 minutes.",
    revenueModel: "Razor/blade model: Hardware lease (₹40,000/yr) + disposable test cartridge margin (₹120/test).",
    currentStage: "mvp",
    resourcesTeam: "1 biomedical scientist + 1 embedded systems engineer. ₹50L BIRAC grant approved.",
    runwayMonths: "14 Months",
    ultimateAmbition: "hundred_million"
  },
  craft: {
    companyName: "Vana Goods",
    archetype: "d2c",
    whatBuilding: "Clean botanical personal care formulated with Himalayan forest botanicals and zero synthetic fillers.",
    whoBuys: "Conscious urban millennials and gen-Z consumers aged 22–38 seeking clean skincare.",
    problemSolved: "Mainstream skincare is loaded with greenwashed micro-plastics and parabens that disrupt skin microbiome.",
    revenueModel: "Direct-to-Consumer e-commerce (AOV ₹1,400) + recurring quarterly subscription box.",
    currentStage: "early_traction",
    resourcesTeam: "Solo founder + 2 contract supply chain operators. ₹15L angel round closed.",
    runwayMonths: "6 Months",
    ultimateAmbition: "ten_million"
  }
};

interface CompanyGrowthOSProps {
  onOpenModule?: (moduleId: string) => void;
}

export function CompanyGrowthOS({ onOpenModule }: CompanyGrowthOSProps) {
  const { toast } = useToast();

  const [profile, setProfile] = useState<CompanyProfile>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("SPARK_company_os_profile");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return PRESET_COMPANIES.nexa;
  });

  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [activeActionModal, setActiveActionModal] = useState<ActionTask | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [reportedMilestone, setReportedMilestone] = useState<string>("");
  const [isMilestoneDrawerOpen, setIsMilestoneDrawerOpen] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Generate dynamic, evidence-grounded strategy based on company archetype, stage, and ambitions
  const diagnostic: GrowthDiagnostic = computeDiagnostic(profile, completedTasks);

  // Save profile changes
  const saveProfile = (newProfile: CompanyProfile) => {
    setProfile(newProfile);
    if (typeof window !== "undefined") {
      localStorage.setItem("SPARK_company_os_profile", JSON.stringify(newProfile));
      // Also update the legacy startup profile for compatibility with older modules
      localStorage.setItem("SPARK_startup_profile", JSON.stringify({
        idea: newProfile.whatBuilding,
        sector: ARCHETYPE_CONFIG[newProfile.archetype].label,
        stage: formatStage(newProfile.currentStage),
        revenueModel: newProfile.revenueModel,
        targetMarket: "India / Global",
        teamSize: newProfile.resourcesTeam,
        location: "India"
      }));
    }
    setIsEditingProfile(false);
    toast({
      title: "Company Intelligence Synced",
      description: `Growth engine customized for ${newProfile.companyName || "your venture"}.`
    });
  };

  const handleToggleTask = (taskId: string) => {
    setCompletedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
    toast({
      title: !completedTasks[taskId] ? "Task Completed" : "Task Re-Opened",
      description: "Company execution record updated."
    });
  };

  const handleApplyMilestone = () => {
    if (!reportedMilestone.trim()) return;
    toast({
      title: "Growth Milestone Logged",
      description: `SPARK has updated ${profile.companyName}'s growth priorities based on your new evidence.`
    });
    // Dynamically advance stage if user hit 10 customers
    if (reportedMilestone.toLowerCase().includes("customer") && profile.currentStage === "idea") {
      saveProfile({ ...profile, currentStage: "early_traction" });
    }
    setReportedMilestone("");
    setIsMilestoneDrawerOpen(false);
  };

  const copyExecutionContent = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedText(true);
    toast({ title: "Copied to Clipboard", description: "Material ready to deploy." });
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-10 text-white pb-12">
      {/* ── TOP HEADER & COMPANY CONTEXT BAR ── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0c1427]/90 via-[#070b14]/95 to-[#05070f] p-6 md:p-8 backdrop-blur-2xl shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center gap-1.5">
                  <Rocket className="h-3 w-3" /> SPARK AI Operating System
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${ARCHETYPE_CONFIG[profile.archetype].color}`}>
                  {ARCHETYPE_CONFIG[profile.archetype].label}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-white/70">
                  Stage: {formatStage(profile.currentStage)}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                {profile.companyName || "Your Company"}
                <span className="text-xs font-semibold text-white/40 tracking-normal hidden sm:inline">
                  | Customized Growth Engine
                </span>
              </h1>

              <p className="text-xs md:text-sm text-white/70 max-w-2xl leading-relaxed">
                {profile.whatBuilding}
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
              <button
                onClick={() => setIsMilestoneDrawerOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/10"
              >
                <PlusIcon className="h-3.5 w-3.5" /> Report Progress
              </button>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-400" />
                {isEditingProfile ? "Close Profile" : "Edit Business"}
              </button>
            </div>
          </div>

          {/* Preset Company Switcher Bar (Quick Test & Learn) */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/5 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-white/40 shrink-0">
              Try Different Archetypes:
            </span>
            {Object.entries(PRESET_COMPANIES).map(([key, item]) => (
              <button
                key={key}
                onClick={() => saveProfile(item)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all shrink-0 ${
                  profile.companyName === item.companyName
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                    : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                {item.companyName} ({ARCHETYPE_CONFIG[item.archetype].label.split('/')[0].trim()})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONVERSATIONAL ONBOARDING / EDITING DRAWER ── */}
      <AnimatePresence>
        {isEditingProfile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-3xl border border-cyan-500/40 bg-[#090e1a]/95 p-6 md:p-8 space-y-6 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Step 2: Understand the Company</span>
                <h3 className="text-lg font-black text-white">How Does Your Business Work?</h3>
                <p className="text-xs text-white/60">
                  SPARK uses this foundation to build a growth strategy custom-tailored to your exact constraints, buyers, and economics.
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-bold">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setActiveStep(s)}
                    className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${
                      activeStep === s
                        ? "bg-cyan-500 text-black font-black"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 1: Concept & Problem */}
            {activeStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    What is your company name?
                  </label>
                  <input
                    type="text"
                    value={profile.companyName}
                    onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                    placeholder="e.g. NexaPay AI"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white">
                    What business archetype best describes how you create value?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                    {Object.entries(ARCHETYPE_CONFIG).map(([key, item]) => {
                      const Icon = item.icon;
                      const isSelected = profile.archetype === key;
                      return (
                        <div
                          key={key}
                          onClick={() => setProfile({ ...profile, archetype: key as any })}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md"
                              : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-4 w-4" />
                            <span className="text-xs font-bold">{item.label}</span>
                          </div>
                          <p className="text-[10px] text-white/50">{item.defaultFocus}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white">What are you building & what problem does it solve?</label>
                  <textarea
                    rows={3}
                    value={profile.whatBuilding}
                    onChange={(e) => setProfile({ ...profile, whatBuilding: e.target.value })}
                    placeholder="Describe the product and the core pain it eliminates in plain words..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5"
                  >
                    Next: Target Customers <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Customer & Revenue */}
            {activeStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white">Who will buy this? (Your exact customer profile)</label>
                  <input
                    type="text"
                    value={profile.whoBuys}
                    onChange={(e) => setProfile({ ...profile, whoBuys: e.target.value })}
                    placeholder="e.g. CFOs and Finance Heads of mid-size logistics companies"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white">How will the business make money?</label>
                  <input
                    type="text"
                    value={profile.revenueModel}
                    onChange={(e) => setProfile({ ...profile, revenueModel: e.target.value })}
                    placeholder="e.g. ₹15,000/month recurring subscription or 10% transaction take-rate"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setActiveStep(1)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:text-white text-xs font-bold"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setActiveStep(3)}
                    className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5"
                  >
                    Next: Current Stage <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Stage */}
            {activeStep === 3 && (
              <div className="space-y-4">
                <label className="text-xs font-bold text-white">Where is the company right now?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { id: "idea", title: "1. Idea & Problem Discovery", desc: "No product yet. Testing if the problem is painful and real." },
                    { id: "mvp", title: "2. Working Prototype / MVP", desc: "Product built or in progress. Testing with first beta users." },
                    { id: "early_traction", title: "3. First Paying Customers", desc: "Have 1 to 10 paying customers. Learning why they bought." },
                    { id: "repeatable_growth", title: "4. Repeatable Sales Engine", desc: "Proven demand. Building predictable acquisition and retention." },
                    { id: "scaling", title: "5. Scale & Market Expansion", desc: "Crossing $500k+ ARR. Scaling team, ops, and international markets." },
                  ].map((st) => (
                    <div
                      key={st.id}
                      onClick={() => setProfile({ ...profile, currentStage: st.id as any })}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        profile.currentStage === st.id
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-lg"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div className="font-black text-xs">{st.title}</div>
                      <div className="text-[11px] text-white/50 mt-1 leading-relaxed">{st.desc}</div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:text-white text-xs font-bold"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setActiveStep(4)}
                    className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5"
                  >
                    Next: Resources & Runway <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Resources & Team */}
            {activeStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white">What team, money, and resources do you have today?</label>
                  <input
                    type="text"
                    value={profile.resourcesTeam}
                    onChange={(e) => setProfile({ ...profile, resourcesTeam: e.target.value })}
                    placeholder="e.g. 2 co-founders (1 tech, 1 sales), bootstrapped with ₹15L capital"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white">How many months of runway do you have remaining?</label>
                  <input
                    type="text"
                    value={profile.runwayMonths}
                    onChange={(e) => setProfile({ ...profile, runwayMonths: e.target.value })}
                    placeholder="e.g. 6 Months"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setActiveStep(3)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:text-white text-xs font-bold"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setActiveStep(5)}
                    className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5"
                  >
                    Next: Long-Term Ambition <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Ambition & Destination */}
            {activeStep === 5 && (
              <div className="space-y-4">
                <label className="text-xs font-bold text-white">What do you want this company to become?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { id: "cash_cow", title: "Profitable Cash-Flow Engine", desc: "Self-sustaining, profitable, zero dilution, founder dividends." },
                    { id: "million_arr", title: "$1M ARR ($83k/mo)", desc: "Proven product-market fit, sustainable unit economics, initial scale." },
                    { id: "ten_million", title: "$10M ARR Growth Company", desc: "Multi-product lines, national industry leader, institutional backing." },
                    { id: "hundred_million", title: "$100M ARR Industry Giant", desc: "Global enterprise footprint, IPO-ready compliance & cash flows." },
                    { id: "unicorn", title: "$1B+ Unicorn Scale", desc: "Category-defining platform with massive proprietary data moats." },
                  ].map((amb) => (
                    <div
                      key={amb.id}
                      onClick={() => setProfile({ ...profile, ultimateAmbition: amb.id as any })}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        profile.ultimateAmbition === amb.id
                          ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div className="font-black text-xs">{amb.title}</div>
                      <div className="text-[11px] text-white/50 mt-1 leading-relaxed">{amb.desc}</div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                  <button
                    onClick={() => setActiveStep(4)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:text-white text-xs font-bold"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => saveProfile(profile)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
                  >
                    Save & Generate Custom Plan ✨
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── THE 4 EXECUTIVE QUESTIONS (CORE UI — USER SECTION 8) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── QUESTION 1: WHERE IS MY COMPANY NOW? ── */}
        <div className="rounded-3xl border border-white/10 bg-[#090e1a]/80 p-6 md:p-7 space-y-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-xs">
                  Q1
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-blue-400">Where Is My Company Now?</span>
              </div>
              <span className="text-[10px] font-bold text-white/40 uppercase">Verified State</span>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <h3 className="text-lg font-black text-white">{diagnostic.whereNow.stageLabel}</h3>
                <span className="text-xs font-black text-blue-400">{diagnostic.whereNow.stageProgress}% Complete</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-1000"
                  style={{ width: `${diagnostic.whereNow.stageProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-white/50 mt-1.5">
                Target Milestone: <strong className="text-white/80">{diagnostic.whereNow.nextMilestone}</strong>
              </p>
            </div>

            {/* Evidence Classification (Section 7) */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="text-[10px] font-black uppercase tracking-wider text-white/40">Evidence Grounding</div>

              <div className="space-y-1.5 text-xs">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-0.5">
                  <div className="font-bold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="h-3 w-3" /> Confirmed Facts
                  </div>
                  <ul className="text-[11px] text-emerald-200/80 list-disc list-inside">
                    {diagnostic.whereNow.confirmedFacts.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-0.5">
                  <div className="font-bold flex items-center gap-1 text-[11px]">
                    <Lightbulb className="h-3 w-3" /> Founder Inputs
                  </div>
                  <ul className="text-[11px] text-amber-200/80 list-disc list-inside">
                    {diagnostic.whereNow.founderInputs.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 space-y-0.5">
                  <div className="font-bold flex items-center gap-1 text-[11px]">
                    <HelpCircle className="h-3 w-3" /> Untested Assumptions
                  </div>
                  <ul className="text-[11px] text-red-200/80 list-disc list-inside">
                    {diagnostic.whereNow.untestedAssumptions.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── QUESTION 2: WHAT IS STOPPING IT FROM GROWING? ── */}
        <div className="rounded-3xl border border-red-500/30 bg-[#090e1a]/80 p-6 md:p-7 space-y-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 font-black text-xs">
                  Q2
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-red-400">What Is Stopping It From Growing?</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-[9px] font-black text-red-300 uppercase">
                {diagnostic.biggestBottleneck.severity} Priority
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-red-400">Primary Growth Blocker</div>
              <h4 className="text-lg font-black text-white">{diagnostic.biggestBottleneck.title}</h4>
              <p className="text-xs text-white/80 leading-relaxed">
                {diagnostic.biggestBottleneck.plainEnglishWhy}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Cost of Inaction</span>
              <p className="text-xs text-amber-300 font-medium">
                {diagnostic.biggestBottleneck.costOfInaction}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-[11px] text-white/50 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>Overcoming this blocker is the single requirement to unlock the next 3 execution actions below.</span>
          </div>
        </div>
      </div>

      {/* ── QUESTION 3: WHAT SHOULD I DO NEXT? (TOP 3 ACTIONS) ── */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xs">
              Q3
            </span>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">What Should I Do Next?</span>
              <h3 className="text-xl font-black text-white">The Next 3 High-Impact Growth Actions</h3>
            </div>
          </div>
          <span className="text-xs text-white/50">Each action directly solves the primary bottleneck</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {diagnostic.nextThreeActions.map((action, idx) => {
            const isCompleted = completedTasks[action.id];
            return (
              <Framer3DCard key={action.id} depth={10}>
                <div
                  className={`p-6 rounded-3xl border transition-all flex flex-col justify-between h-full space-y-5 ${
                    isCompleted
                      ? "bg-emerald-500/10 border-emerald-500/40 shadow-emerald-500/10 shadow-lg"
                      : "bg-[#090e1a]/85 border-white/10 hover:border-amber-500/40 shadow-xl"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="h-6 w-6 rounded-full bg-white/10 text-white font-black text-xs flex items-center justify-center">
                        0{idx + 1}
                      </span>
                      <button
                        onClick={() => handleToggleTask(action.id)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
                          isCompleted
                            ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30"
                            : "bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {isCompleted ? <Check className="h-3 w-3 stroke-[3]" /> : null}
                        {isCompleted ? "Completed" : "Mark Done"}
                      </button>
                    </div>

                    <h4 className={`text-base font-black leading-snug ${isCompleted ? "line-through text-white/50" : "text-white"}`}>
                      {action.title}
                    </h4>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-white/80 space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">Why It Matters</span>
                      <p className="leading-relaxed">{action.whyItMatters}</p>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Execution Steps</span>
                      <ul className="space-y-1 text-white/70">
                        {action.steps.map((st, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[11px]">
                            <span className="text-cyan-400 font-bold">•</span>
                            <span>{st}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px]">
                      <div>
                        <span className="text-[9px] font-black uppercase text-white/40">Effort & Cost</span>
                        <div className="text-white font-bold">{action.effort} ({action.cost})</div>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase text-white/40">Success Metric</span>
                        <div className="text-emerald-400 font-bold">{action.metric}</div>
                      </div>
                    </div>
                  </div>

                  {action.toolPayload && (
                    <button
                      onClick={() => setActiveActionModal(action)}
                      className="w-full py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 hover:bg-cyan-500/25 text-cyan-300 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-500/10"
                    >
                      <Play className="h-3.5 w-3.5 fill-cyan-400" /> Execute with SPARK AI
                    </button>
                  )}
                </div>
              </Framer3DCard>
            );
          })}
        </div>
      </div>

      {/* ── QUESTION 4: HOW WILL THIS HELP MY COMPANY GROW? ── */}
      <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-[#0c1427]/90 via-[#090e1a]/95 to-purple-950/20 p-6 md:p-8 space-y-4 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-black text-xs">
              Q4
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-purple-400">How Will This Help My Company Grow?</span>
          </div>
          <span className="text-xs font-bold text-purple-300">Long-Term Vision Alignment</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400">Strategic Breakthrough</span>
            <p className="text-xs text-white/90 leading-relaxed font-medium">
              {diagnostic.growthBridge.explanation}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Financial Revenue Impact</span>
            <p className="text-xs text-white/90 leading-relaxed font-medium">
              {diagnostic.growthBridge.financialImpact}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">Alignment with Ambition</span>
            <p className="text-xs text-white/90 leading-relaxed font-medium">
              {diagnostic.growthBridge.longTermAlignment}
            </p>
          </div>
        </div>
      </div>

      {/* ── DEEP STRATEGIC MODULES (PROGRESSIVE DISCLOSURE — SECTION 4 & 10) ── */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Section 4 & 10 / Deep Intelligence</span>
            <h3 className="text-lg font-black text-white">Full-Stack Capability Engines</h3>
          </div>
          <span className="text-xs text-white/50">Context pre-injected for {profile.companyName}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { id: "zero-to-scale", title: "0 to $1B Scale", icon: Rocket, color: "text-amber-400 border-amber-500/30 hover:border-amber-500/60" },
            { id: "validate", title: "Validation", icon: Target, color: "text-blue-400 border-blue-500/30 hover:border-blue-500/60" },
            { id: "competitors", title: "Competitors", icon: Search, color: "text-violet-400 border-violet-500/30 hover:border-violet-500/60" },
            { id: "discovery", title: "Discovery", icon: Users, color: "text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60" },
            { id: "financials", title: "Financials", icon: BarChart3, color: "text-yellow-400 border-yellow-500/30 hover:border-yellow-500/60" },
            { id: "investors", title: "Investors", icon: DollarSign, color: "text-pink-400 border-pink-500/30 hover:border-pink-500/60" },
            { id: "hiring", title: "Hiring", icon: UserPlus, color: "text-sky-400 border-sky-500/30 hover:border-sky-500/60" },
            { id: "schemes", title: "Govt Grants", icon: Building, color: "text-teal-400 border-teal-500/30 hover:border-teal-500/60" },
          ].map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                onClick={() => onOpenModule?.(mod.id)}
                className={`p-3 rounded-2xl bg-white/5 border ${mod.color} flex flex-col items-center justify-center text-center gap-2 hover:bg-white/10 hover:scale-105 active:scale-95 transition-all`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[11px] font-bold text-white truncate max-w-full">{mod.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ACTION EXECUTION MODAL ── */}
      <AnimatePresence>
        {activeActionModal && activeActionModal.toolPayload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-2xl w-full rounded-3xl border border-cyan-500/40 bg-[#090e1a] p-6 md:p-8 space-y-5 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  <h4 className="text-base font-black text-white">{activeActionModal.toolPayload.title}</h4>
                </div>
                <button
                  onClick={() => setActiveActionModal(null)}
                  className="text-white/50 hover:text-white p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-white/50">
                  <span>Generated specifically for {profile.companyName} ({ARCHETYPE_CONFIG[profile.archetype].label}):</span>
                  <button
                    onClick={() => copyExecutionContent(activeActionModal.toolPayload!.content)}
                    className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                  >
                    {copiedText ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedText ? "Copied" : "Copy Material"}
                  </button>
                </div>
                <div className="p-4 rounded-2xl bg-black/50 border border-white/10 font-mono text-xs text-white/90 whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
                  {activeActionModal.toolPayload.content}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setActiveActionModal(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white/70"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleToggleTask(activeActionModal.id);
                    setActiveActionModal(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider"
                >
                  Mark Task Complete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── REPORT MILESTONE / UPDATE EVIDENCE MODAL (SECTION 9) ── */}
      <AnimatePresence>
        {isMilestoneDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-lg w-full rounded-3xl border border-emerald-500/40 bg-[#090e1a] p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-base font-black text-white">Log Actual Business Results</h4>
                </div>
                <button onClick={() => setIsMilestoneDrawerOpen(false)} className="text-white/50 hover:text-white">✕</button>
              </div>

              <p className="text-xs text-white/70">
                SPARK maintains an updated understanding of your venture. When real numbers or customer results arrive, the plan automatically adapts.
              </p>

              <div className="space-y-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-white/40">Quick Milestones:</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Completed 10 customer discovery interviews",
                    "Acquired first 3 paying customers",
                    "Achieved 90-day churn under 2%",
                    "Closed ₹25 Lakhs pre-seed grant"
                  ].map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => setReportedMilestone(preset)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 font-medium text-left"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  value={reportedMilestone}
                  onChange={(e) => setReportedMilestone(e.target.value)}
                  placeholder="Or describe the result (e.g. 'We interviewed 6 hospital procurement heads and all 6 requested a 14-day trial if approved by ethics committee.')..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsMilestoneDrawerOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white/70"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyMilestone}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider"
                >
                  Submit & Adapt Plan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── COMPUTATION HELPER: COMPUTE DIAGNOSTIC BASED ON ARCHETYPE & STAGE ──
function computeDiagnostic(profile: CompanyProfile, completedTasks: Record<string, boolean>): GrowthDiagnostic {
  const name = profile.companyName || "Your Company";
  const arch = profile.archetype;
  const stage = profile.currentStage;

  // Question 1: Where are you now?
  let stageLabel = "Stage 1: Problem Discovery & Idea Validation";
  let stageProgress = 35;
  let nextMilestone = "Validate 10 target buyers with acute, budget-backed pain";
  if (stage === "mvp") {
    stageLabel = "Stage 2: Validation to Functional MVP";
    stageProgress = 60;
    nextMilestone = "5 design partners successfully completing the core workflow";
  } else if (stage === "early_traction") {
    stageLabel = "Stage 3: First 10 Paying Customers";
    stageProgress = 80;
    nextMilestone = "10 non-discounted customer payments with zero 30-day churn";
  } else if (stage === "repeatable_growth") {
    stageLabel = "Stage 4: Repeatable Acquisition & Unit Economics";
    stageProgress = 88;
    nextMilestone = "Sub-6-month CAC payback period and predictable monthly pipeline";
  } else if (stage === "scaling") {
    stageLabel = "Stage 5: Growth Engine to $1M+ ARR";
    stageProgress = 95;
    nextMilestone = "$83,333 / month ($1M ARR) with >115% net revenue retention";
  }

  // Confirmed Facts vs Founder Inputs vs Untested Assumptions
  const confirmedFacts = [
    `Product Focus: ${profile.whatBuilding.slice(0, 60)}...`,
    `Business Archetype: ${ARCHETYPE_CONFIG[arch].label}`,
    `Declared Revenue Model: ${profile.revenueModel.slice(0, 45)}`
  ];

  const founderInputs = [
    `Target Customer: ${profile.whoBuys.slice(0, 50)}`,
    `Team & Capital: ${profile.resourcesTeam.slice(0, 50)}`,
    `Declared Runway: ${profile.runwayMonths}`
  ];

  const untestedAssumptions = [
    arch === "saas"
      ? "Buyers will adopt without demanding custom on-premise integrations."
      : arch === "manufacturing"
      ? "Suppliers can maintain <2% defect rate at batch volume."
      : arch === "d2c"
      ? "Repeat purchase rate will exceed 30% without continuous ad discounting."
      : "Target users are willing to abandon current manual alternatives."
  ];

  // Question 2: Biggest Bottleneck
  let bottleneck: {
    title: string;
    severity: "Critical" | "High" | "Medium";
    plainEnglishWhy: string;
    costOfInaction: string;
  } = {
    title: "Unvalidated Willingness to Pay Upfront",
    severity: "Critical",
    plainEnglishWhy: `Customers acknowledge the pain in ${profile.problemSolved.slice(0, 40)}..., but you have not yet proven they will re-allocate an existing line-item budget to purchase without extensive custom work.`,
    costOfInaction: "Building more product features before confirming price tolerance risks burning runway on unwanted capabilities."
  };

  if (stage === "mvp") {
    bottleneck = {
      title: "Core Workflow Time-to-Value (Aha! Moment Latency)",
      severity: "Critical" as const,
      plainEnglishWhy: `Early testers find the prototype intriguing, but onboarding takes too many steps before they experience the core automation benefit.`,
      costOfInaction: "Over 60% of trial users drop off within 72 hours if initial setup exceeds 10 minutes."
    };
  } else if (stage === "early_traction") {
    bottleneck = {
      title: "Founder-Dependent Sales Channel",
      severity: "High" as const,
      plainEnglishWhy: `Every current customer was closed through personal founder hustle. You lack a repeatable, written outbound or inbound playbook that an employee or partner can execute.`,
      costOfInaction: "Growth stalls the moment founders get pulled into product development or client operations."
    };
  }

  // Question 3: Next Three Actions
  const nextThreeActions: ActionTask[] = [
    {
      id: "action-1",
      title: stage === "idea" ? "Run 10 Problem Discovery Calls Using 'The Mom Test'" : "Conduct 5 Onboarding Shadowing Sessions",
      whyItMatters: `Directly attacks the ${bottleneck.title} bottleneck by observing where users hesitate in real time.`,
      steps: [
        "Reach out to 15 qualified target personas matching your ICP",
        "Record exact phrases they use to describe their current daily bottleneck",
        "Document whether they have attempted to solve it with paid tools in the past 6 months"
      ],
      effort: "8 Hours",
      cost: "₹0",
      metric: "≥7 of 10 confirm acute budget priority",
      done: !!completedTasks["action-1"],
      toolPayload: {
        type: "interview_script",
        title: "Customer Discovery Interview Guide (Mom Test Protocol)",
        content: `CUSTOMER DISCOVERY SCRIPT FOR: ${name}
Target Persona: ${profile.whoBuys}
Core Problem: ${profile.problemSolved}

1. Icebreaker & Context:
"Tell me about the last time you had to deal with [problem area] in your team?"

2. Measuring Real Severity (No hypothetical questions):
"How are you currently handling this today? What tools or spreadsheets are you using?"
"How much time or money does that manual workaround cost you every week?"

3. The Commitment Test:
"If a dedicated automated system solved this by next Monday with guaranteed 99% accuracy, what would prevent your company from signing up for a 14-day trial at ${profile.revenueModel.split('+')[0]}?"`
      }
    },
    {
      id: "action-2",
      title: "Deploy 1-Click Interactive Demonstration",
      whyItMatters: "Eliminates friction so prospective buyers immediately experience the solution without scheduling a 30-minute sales call.",
      steps: [
        "Build an interactive preview or video walkthrough showing the exact before/after outcome",
        "Embed transparent pricing and clear onboarding expectations",
        "Track viewer completion rates with basic telemetry"
      ],
      effort: "12 Hours",
      cost: "₹0",
      metric: "≥20% visitor-to-demo conversion rate",
      done: !!completedTasks["action-2"],
      toolPayload: {
        type: "landing_spec",
        title: "High-Converting Landing Page & Value Proposition Spec",
        content: `VALUE PROPOSITION BLUEPRINT FOR: ${name}

Headline (The Clear Outcome):
"Eliminate ${profile.problemSolved.slice(0, 50)} Autonomously."

Sub-Headline:
"Engineered specifically for ${profile.whoBuys}. Stop losing hours on fragmented tools."

Social Proof Hook:
"Designed for high-output operators needing reliability, zero setup friction, and sub-second execution."

Primary Call-to-Action:
[Start 14-Day Free Pilot — No Credit Card Required]`
      }
    },
    {
      id: "action-3",
      title: "Launch 50-Account Targeted Outbound Sequence",
      whyItMatters: "Tests repeatable customer acquisition without waiting months for passive organic inbound traffic.",
      steps: [
        "Build a curated list of 50 decision makers matching your ICP",
        "Personalize the opening sentence with their company's specific public bottleneck",
        "Send a 3-part concise follow-up email sequence focused on outcomes, not features"
      ],
      effort: "6 Hours",
      cost: "₹0",
      metric: "≥12% positive response rate",
      done: !!completedTasks["action-3"],
      toolPayload: {
        type: "outbound_email",
        title: "High-Response Cold Outbound Sequence",
        content: `SUBJECT: Quick question about [Company]'s ${profile.problemSolved.slice(0, 25)} workflow

Hi [First Name],

Noticed that your team at [Company] has been expanding its operations in [Sector].

Most leaders in your space tell us that their biggest recurring headache is ${profile.problemSolved.slice(0, 60)}.

At ${name}, we built an autonomous system that cuts this turnaround time by 75% without requiring custom integrations.

Would you be open to a 6-minute async video showing how we solve this for teams like yours?

Best,
[Founder Name]
Founder, ${name}`
      }
    }
  ];

  // Question 4: Growth Bridge
  const growthBridge = {
    explanation: `By solving the ${bottleneck.title} bottleneck with these 3 actions, ${name} moves from unproven assumptions to real customer evidence.`,
    financialImpact: `Unlocks predictable conversion from outreach to closed contracts at ${profile.revenueModel.split('+')[0]}, putting you on track to reach cash-flow breakeven before exhausting your ${profile.runwayMonths} runway.`,
    longTermAlignment: `Every validated paying customer strengthens your unit economics (CAC payback < 6 months), creating the foundational engine required to reach ${formatAmbition(profile.ultimateAmbition)}.`
  };

  return {
    whereNow: {
      stageLabel,
      stageProgress,
      nextMilestone,
      confirmedFacts,
      founderInputs,
      untestedAssumptions
    },
    biggestBottleneck: bottleneck,
    nextThreeActions,
    growthBridge
  };
}

function formatStage(stage: string): string {
  switch (stage) {
    case "idea": return "Idea & Discovery";
    case "mvp": return "MVP / Prototype";
    case "early_traction": return "Early Traction (1–10 Customers)";
    case "repeatable_growth": return "Repeatable Growth";
    case "scaling": return "Scale ($1M+ ARR)";
    default: return "Pre-Seed";
  }
}

function formatAmbition(amb: string): string {
  switch (amb) {
    case "cash_cow": return "Profitable Cash-Flow Independence";
    case "million_arr": return "$1M ARR Milestone";
    case "ten_million": return "$10M Scale Leader";
    case "hundred_million": return "$100M Enterprise Giant";
    case "unicorn": return "$1B Unicorn Status";
    default: return "$1M ARR";
  }
}

function PlusIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
    </svg>
  );
}
