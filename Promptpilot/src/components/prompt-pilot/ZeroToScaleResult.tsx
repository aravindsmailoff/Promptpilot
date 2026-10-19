"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Target,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Calculator,
  ArrowRight,
  Flame,
  Award,
  Sparkles,
  Users,
  Building,
  Zap,
  Globe,
  Copy,
  Check,
  Lightbulb,
  Heart,
  HelpCircle,
  Clock,
  Compass
} from "lucide-react";
import { Framer3DCard } from "@/components/framer-3d/Framer3DCard";
import { ScoreGauge } from "./CoFounderTab";
import { useToast } from "@/hooks/use-toast";

interface ZeroToScaleResultProps {
  data: any;
  idea: string;
}

export function ZeroToScaleResult({ data, idea }: ZeroToScaleResultProps) {
  const { toast } = useToast();
  const [selectedMilestone, setSelectedMilestone] = useState<"million" | "tenMillion" | "hundredMillion" | "billion">("million");
  const [selectedModel, setSelectedModel] = useState<"enterprise" | "midMarket" | "prosumer" | "massConsumer">("enterprise");
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  // ── 1. The 4 Big Milestones in Everyday Terms ──
  const MILESTONES_INFO = {
    million: {
      tag: "Level 1 • Traction",
      title: "Making ₹8.5 Crore ($1 Million) a Year",
      sub: "Proving people love what you made and will gladly pay for it.",
      monthlyBreakdown: "That's about ₹70 Lakhs ($83,300) every month.",
      timeline: "18 to 24 Months",
      whatToFocusOn: "Keeping your customers happy so they don't leave, and making sure getting a new customer costs less than they pay you in 5 months.",
      whyItMatters: "Once you hit ₹8.5 Crore a year with happy customers, you have a proven, sustainable business that can survive on its own."
    },
    tenMillion: {
      tag: "Level 2 • Growth",
      title: "Reaching ₹85 Crore ($10 Million) a Year",
      sub: "Turning your product into a growing, well-known brand.",
      monthlyBreakdown: "That's about ₹7 Crore ($833,000) every month.",
      timeline: "3 to 4 Years",
      whatToFocusOn: "Hiring dedicated sales managers, expanding to multiple products, and serving customers in international markets.",
      whyItMatters: "At this size, the company no longer depends on the founders doing everything manually. A real management team runs operations."
    },
    hundredMillion: {
      tag: "Level 3 • Industry Giant",
      title: "Reaching ₹850 Crore ($100 Million) a Year",
      sub: "Becoming a recognized market leader in your industry.",
      monthlyBreakdown: "That's about ₹70 Crore ($8.3 Million) every month.",
      timeline: "5 to 7 Years",
      whatToFocusOn: "Serving the largest global enterprises, preparing for a stock market listing (IPO), and building an unbeatable brand reputation.",
      whyItMatters: "Very few companies in the world ever reach this level. You become a recognized household or industry name."
    },
    billion: {
      tag: "Level 4 • Unicorn Status",
      title: "The $1 Billion Valuation (₹8,500 Crore Company)",
      sub: "Building a company so valuable that it reshapes an entire industry.",
      monthlyBreakdown: "Requires around ₹700–850 Cr ($80M–$100M) annual revenue.",
      timeline: "Long-Term Vision",
      whatToFocusOn: "Proprietary technology, deep customer workflows that competitors cannot replace, and huge profit margins.",
      whyItMatters: "Investors value companies at $1 Billion when they make reliable revenue with 80%+ profit margins and have a massive moat."
    }
  };

  // ── 2. The 4 Simple Math Models (Price × Customers = ₹8.5 Cr / $1M) ──
  const SIMPLE_MODELS = {
    enterprise: {
      emoji: "🐘",
      name: "The Big Company Path",
      tagline: "High price, few customers",
      formula: "100 big companies × ₹8.5 Lakhs ($10,000) per year = ₹8.5 Crore ($1M) a year",
      customersNeeded: "100 Companies",
      pricePerCustomer: "₹8.5 Lakhs / year ($10,000)",
      howYouSell: "Direct phone calls, executive dinners, personalized video demos with company leaders.",
      howLongItTakesToClose: "2 to 3 months per deal",
      whoThisIsBestFor: "B2B software, enterprise security, compliance, automated billing, or corporate logistics.",
      realLifeExample: "Like selling enterprise cybersecurity or ERP software to large hospitals or banks."
    },
    midMarket: {
      emoji: "🏢",
      name: "The Medium Business Path",
      tagline: "Medium price, moderate customers",
      formula: "500 medium businesses × ₹1.7 Lakhs ($2,000) per year = ₹8.5 Crore ($1M) a year",
      customersNeeded: "500 Businesses",
      pricePerCustomer: "₹1.7 Lakhs / year ($166/month)",
      howYouSell: "Helpful blog posts, webinar demos, free 14-day trials, and quick 15-minute zoom calls.",
      howLongItTakesToClose: "2 to 4 weeks per deal",
      whoThisIsBestFor: "Operations tools, marketing software, customer support automation, or HR platforms.",
      realLifeExample: "Like selling a team chat tool or automated payroll software to companies with 50 employees."
    },
    prosumer: {
      emoji: "👥",
      name: "The Professional & Small Team Path",
      tagline: "Low price, self-serve signups",
      formula: "3,500 professionals × ₹2,000 ($24) per month = ₹8.5 Crore ($1M) a year",
      customersNeeded: "3,500 People",
      pricePerCustomer: "₹2,000 / month ($24/mo)",
      howYouSell: "People find your website from Google or social media, test a free trial, and enter their credit card.",
      howLongItTakesToClose: "Instant self-serve checkout",
      whoThisIsBestFor: "Tools for designers, software developers, accountants, digital marketers, or freelance creators.",
      realLifeExample: "Like paying a monthly subscription for Canva, Notion, or Grammarly."
    },
    massConsumer: {
      emoji: "🌍",
      name: "The Everyday Consumer Path",
      tagline: "Tiny fee, massive audience",
      formula: "100,000 users × ₹70 ($1) per month = ₹8.5 Crore ($1M) a year",
      customersNeeded: "100,000 Users",
      pricePerCustomer: "₹70 / month or small transaction fees",
      howYouSell: "Viral sharing between friends, mobile app store recommendations, and social media buzz.",
      howLongItTakesToClose: "Instant download & signup",
      whoThisIsBestFor: "Mobile games, community marketplaces, fitness apps, or consumer payment apps.",
      realLifeExample: "Like Duolingo subscriptions or taking a tiny ₹5 convenience fee on millions of food orders."
    }
  };

  // ── 3. The 4 Golden Rules of Business Health (In Plain English) ──
  const GOLDEN_RULES = [
    {
      emoji: "🎯",
      rule: "Customer Acquisition Cost",
      plainExplanation: "Spend less to get a customer than what they pay you in their first 5 months.",
      target: "Under 5 Months Payback",
      goodSign: "If you spend ₹1,000 on ads to win a customer, they should pay you back ₹1,000+ within 5 months."
    },
    {
      emoji: "💎",
      rule: "Total Customer Value",
      plainExplanation: "Every customer should bring in at least 3x to 4x what you spent to win them over time.",
      target: "3x – 4x Return",
      goodSign: "If a customer costs ₹2,000 to acquire, their lifetime payments to you should total ₹8,000+."
    },
    {
      emoji: "🛡️",
      rule: "Keep Customers Happy",
      plainExplanation: "Less than 1 or 2 out of every 100 customers should cancel or leave you each month.",
      target: "<1.5% Leave Monthly",
      goodSign: "A great product keeps 98% of users returning every month without needing to re-sell them."
    },
    {
      emoji: "📈",
      rule: "Keep Healthy Profits",
      plainExplanation: "Keep 80% or more of what you make after basic software, cloud, and server costs.",
      target: "80%+ Profit Margin",
      goodSign: "For every ₹100 of revenue, spending less than ₹20 on server hosting leaves ₹80 for growth."
    }
  ];

  // ── 4. The 6 Easy Levels from Day 1 to Scale ──
  const SIMPLE_STAGES = [
    {
      level: 1,
      name: "Level 1: Find a Problem People Care About",
      time: "Weeks 1–4",
      simpleGoal: "Talk to 10 real people. Make sure the problem is genuinely painful before writing code or spending money.",
      whatToDoThisWeek: [
        "Find 10 people who match your target customer",
        "Ask how they solve this headache today and what it costs them",
        "Check if they would eagerly test a prototype next week"
      ],
      warningSign: "If people say 'that sounds nice' but cannot remember the last time it bothered them, stop and rethink the problem."
    },
    {
      level: 2,
      name: "Level 2: Build a Simple Version That Works",
      time: "Weeks 5–8",
      simpleGoal: "Build the simplest version that solves the main problem. Don't add extra bells and whistles.",
      whatToDoThisWeek: [
        "Focus on the ONE thing your product must do extraordinarily well",
        "Put a working demo online so people can try it with a link",
        "Watch 5 friendly testers use it live and fix where they get stuck"
      ],
      warningSign: "If building the first version takes more than 6 weeks, you are building too much. Cut half the features."
    },
    {
      level: 3,
      name: "Level 3: Get Your First 10 Paying Customers",
      time: "Weeks 9–14",
      simpleGoal: "Get 10 real customers (not friends or family) to pay you real, non-discounted money.",
      whatToDoThisWeek: [
        "Send 50 personalized messages to people with the problem",
        "Show a 2-minute video demo of how it works",
        "Ask directly: 'Would you like to start a paid pilot today?'"
      ],
      warningSign: "If people love the demo but make excuses when it's time to pay, the pricing or positioning needs work."
    },
    {
      level: 4,
      name: "Level 4: Make It Repeatable (The Growth Engine)",
      time: "Months 4–8",
      simpleGoal: "Build a predictable machine that brings in new paying customers every single week.",
      whatToDoThisWeek: [
        "Make onboarding so smooth that a customer gets value in under 5 minutes",
        "Find 1 or 2 reliable channels (like Google search, cold email, or social posts)",
        "Check that customers continue using it week after week"
      ],
      warningSign: "If more than 3 out of 100 customers cancel every month, stop spending on marketing and fix the product experience."
    },
    {
      level: 5,
      name: "Level 5: Pour Fuel on the Fire",
      time: "Months 9–16",
      simpleGoal: "Scale to ₹25–50 Lakhs ($30k–$60k) every month and build a small, high-output team.",
      whatToDoThisWeek: [
        "Hire your first dedicated growth or sales specialist",
        "Offer annual plans with a discount so customers pay for 12 months upfront",
        "Partner with other companies that already have your ideal customers"
      ],
      warningSign: "Don't hire too quickly. Every new hire should directly help bring in more customers or improve the product."
    },
    {
      level: 6,
      name: "Level 6: Scale to $1M ARR and Beyond",
      time: "Months 17–24+",
      simpleGoal: "Cross ₹8.5 Crore ($1 Million) a year and set your sights on becoming an industry giant.",
      whatToDoThisWeek: [
        "Automate repetitive support and operations tasks",
        "Prepare to raise institutional investment if you want to expand faster",
        "Build brand authority through case studies and customer stories"
      ],
      warningSign: "Watch your cash balance every single week. Profitable growth always beats burning money recklessly."
    }
  ];

  // ── 5. Three Speeds to Reach $1M ARR ──
  const THREE_SPEEDS = [
    {
      name: "The Steady Path (Self-Funded)",
      speed: "2.5 to 3 Years",
      capital: "₹10–25 Lakhs (Bootstrapped)",
      howItWorks: "You grow using your customer's money. You keep 100% of your company and stay profitable from early days.",
      risk: "Low Financial Risk",
      badge: "Founder-Owned"
    },
    {
      name: "The Venture Path (Recommended)",
      speed: "18 to 22 Months",
      capital: "₹4 Crore ($500k) Seed Round",
      howItWorks: "You raise money from early angel investors, hire 3 to 5 specialists, and focus on capturing the market quickly.",
      risk: "Balanced Growth",
      badge: "Most Popular"
    },
    {
      name: "The Blitzscale Path (Hyper-Speed)",
      speed: "12 to 15 Months",
      capital: "₹15–25 Crore Venture Fund",
      howItWorks: "Backed by large venture funds, you hire aggressively, run nationwide marketing, and aim to dominate before competitors react.",
      risk: "High Stakes",
      badge: "Fastest Speed"
    }
  ];

  const toggleTask = (taskKey: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskKey]: !prev[taskKey],
    }));
  };

  const handleCopyBlueprint = () => {
    const text = `SPARK AI — THE SIMPLE PATH FROM DAY 1 TO $1 BILLION
Startup: ${idea}
The 4 Simple Ways to Make ₹8.5 Crore ($1M):
1. Enterprise: 100 big companies at ₹8.5L/year
2. Mid-Market: 500 growing businesses at ₹1.7L/year
3. Prosumer: 3,500 professionals at ₹2,000/month
4. Consumer: 100,000 users at ₹70/month

The 6 Levels:
Level 1: Find a Problem People Care About (10 real interviews)
Level 2: Build a Simple Version That Works (ship in 4 weeks)
Level 3: Get First 10 Paying Customers (no discounts)
Level 4: Make It Repeatable (sub-5-month customer payback)
Level 5: Pour Fuel on the Fire (hire first growth lead)
Level 6: Scale to $1M ARR and Beyond (industry leadership)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Roadmap Copied", description: "Simple growth roadmap copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-10 text-white pb-10">
      {/* ── TOP HERO BANNER (SIMPLE & HUMAN) ── */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-cyan-500/10 p-6 md:p-8 backdrop-blur-2xl shadow-2xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1 text-xs font-black tracking-widest text-amber-300 uppercase">
              <Rocket className="h-3.5 w-3.5 text-amber-400" />
              The Simple Path to Scale
            </div>

            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
              How to Turn an Idea into a{" "}
              <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200 bg-clip-text text-transparent">
                $1 Billion Business
              </span>
            </h2>

            <p className="text-xs md:text-sm text-white/80 leading-relaxed">
              Building a massive company is not magic—it's simply solving a painful problem for more and more people over time. Here is the step-by-step path in plain words that anyone can follow.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <span className="rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-bold text-white/90 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-cyan-400" />
                Venture: <strong className="text-white">{idea.slice(0, 35)}{idea.length > 35 ? "..." : ""}</strong>
              </span>
              <span className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-black text-emerald-300 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-emerald-400" />
                Plain English Edition
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md min-w-[170px] text-center shrink-0">
            <ScoreGauge score={data?.scaleReadinessScore || 88} size={110} />
            <span className="text-[10px] font-black tracking-widest text-white/50 uppercase mt-1">Growth Readiness</span>
            <span className="text-xs font-extrabold text-emerald-400 mt-0.5">Top Tier Opportunity</span>
            <button
              onClick={handleCopyBlueprint}
              className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-white/80 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1 rounded-lg border border-white/10 transition-colors"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy Simple Plan"}
            </button>
          </div>
        </div>
      </div>

      {/* ── STEP 1: THE 4 BIG MILESTONES (SIMPLE & CLEAR) ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">Part 01 • The Big Picture</span>
            <h3 className="text-xl font-black text-white">The 4 Big Milestones Every Great Company Crosses</h3>
          </div>
          <span className="text-xs text-white/50 font-medium">Click each milestone to see what it takes</span>
        </div>

        {/* Milestone Selector Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { id: "million", level: "Level 1", title: "₹8.5 Cr ($1M)", sub: "Traction & First Scale", color: "border-emerald-500/40 text-emerald-300" },
            { id: "tenMillion", level: "Level 2", title: "₹85 Cr ($10M)", sub: "Growth & Brand", color: "border-cyan-500/40 text-cyan-300" },
            { id: "hundredMillion", level: "Level 3", title: "₹850 Cr ($100M)", sub: "Industry Leader", color: "border-purple-500/40 text-purple-300" },
            { id: "billion", level: "Level 4", title: "$1 Billion", sub: "Unicorn Status", color: "border-amber-500/40 text-amber-300" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedMilestone(tab.id as any)}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 relative ${
                selectedMilestone === tab.id
                  ? `bg-white/10 ${tab.color} shadow-lg ring-1 ring-white/20 scale-[1.02]`
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20"
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-wider opacity-60 block">{tab.level}</span>
              <div className="text-lg font-black text-white mt-0.5">{tab.title}</div>
              <div className="text-[11px] font-medium text-white/50">{tab.sub}</div>
            </button>
          ))}
        </div>

        {/* Selected Milestone Card in Everyday Words */}
        {MILESTONES_INFO[selectedMilestone] && (
          <div className="p-6 md:p-7 rounded-3xl bg-[#090e1a]/90 border border-white/10 shadow-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-[9px] font-black text-cyan-300 uppercase tracking-widest">
                  {MILESTONES_INFO[selectedMilestone].tag}
                </span>
                <h4 className="text-xl md:text-2xl font-black text-white mt-1.5">
                  {MILESTONES_INFO[selectedMilestone].title}
                </h4>
                <p className="text-xs text-white/70 mt-0.5">
                  {MILESTONES_INFO[selectedMilestone].sub}
                </p>
              </div>

              <div className="flex items-center gap-3 self-start md:self-center">
                <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/80">
                  ⏱️ Timeline: {MILESTONES_INFO[selectedMilestone].timeline}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Monthly Revenue Goal</span>
                <p className="text-xs text-white font-semibold leading-relaxed">
                  {MILESTONES_INFO[selectedMilestone].monthlyBreakdown}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">What You Need to Do</span>
                <p className="text-xs text-white/90 leading-relaxed">
                  {MILESTONES_INFO[selectedMilestone].whatToFocusOn}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Why This Matters</span>
                <p className="text-xs text-white/90 leading-relaxed">
                  {MILESTONES_INFO[selectedMilestone].whyItMatters}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── STEP 2: THE 4 SIMPLE WAYS TO MAKE $1M (SIMPLE CUSTOMER MATH) ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase">Part 02 • Simple Math</span>
            <h3 className="text-xl font-black text-white">4 Easy Ways to Make ₹8.5 Crore ($1 Million) a Year</h3>
          </div>
          <span className="text-xs text-white/50">Pick the customer type that fits your vision</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(["enterprise", "midMarket", "prosumer", "massConsumer"] as const).map((key) => {
            const m = SIMPLE_MODELS[key];
            const isSelected = selectedModel === key;
            return (
              <Framer3DCard key={key} depth={10}>
                <div
                  onClick={() => setSelectedModel(key)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer h-full flex flex-col justify-between ${
                    isSelected
                      ? "bg-white/10 border-cyan-500/50 shadow-xl shadow-cyan-500/10 scale-[1.02]"
                      : "bg-[#090e1a]/85 border-white/10 hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{m.emoji}</span>
                      {isSelected ? (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-[9px] font-black text-cyan-300 uppercase">
                          Selected
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-white/40">{m.tagline}</span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-base font-black text-white">{m.name}</h4>
                      <div className="text-xs font-bold text-emerald-400 mt-1">
                        {m.customersNeeded}
                      </div>
                      <div className="text-[11px] text-white/50">
                        @ {m.pricePerCustomer}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/80 space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400 block">The Simple Formula</span>
                      <p className="leading-snug">{m.formula}</p>
                    </div>

                    <p className="text-[11px] text-white/60 line-clamp-2">
                      {m.whoThisIsBestFor}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-cyan-400">
                    <span>Inspect How It Works</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Framer3DCard>
            );
          })}
        </div>

        {/* Selected Model Breakdown in Human Terms */}
        <div className="p-6 rounded-3xl bg-cyan-500/5 border border-cyan-500/25 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{SIMPLE_MODELS[selectedModel].emoji}</span>
            <h4 className="text-base font-black text-white">
              How to execute: {SIMPLE_MODELS[selectedModel].name}
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-[10px] font-black uppercase text-cyan-400">How You Sell It</span>
              <p className="text-white/80 leading-relaxed">{SIMPLE_MODELS[selectedModel].howYouSell}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-400">Sales Speed</span>
              <p className="text-white/80 leading-relaxed">{SIMPLE_MODELS[selectedModel].howLongItTakesToClose}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-[10px] font-black uppercase text-emerald-400">Real-World Analogy</span>
              <p className="text-white/80 leading-relaxed">{SIMPLE_MODELS[selectedModel].realLifeExample}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── STEP 3: THE 4 SIMPLE RULES OF BUSINESS HEALTH (NO JARGON) ── */}
      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">Part 03 • The Golden Rules</span>
          <h3 className="text-xl font-black text-white">The 4 Simple Rules That Keep Any Business Healthy</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {GOLDEN_RULES.map((rule, idx) => (
            <div key={idx} className="p-5 rounded-3xl bg-[#090e1a]/85 border border-white/10 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{rule.emoji}</span>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-black text-emerald-300">
                    {rule.target}
                  </span>
                </div>
                <h4 className="text-sm font-black text-white">{rule.rule}</h4>
                <p className="text-xs text-white/80 leading-relaxed font-medium">
                  {rule.plainExplanation}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-white/60">
                <strong className="text-white/80">In plain words: </strong>
                {rule.goodSign}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── STEP 4: THE 6 EASY LEVELS (PRACTICAL CHECKLIST) ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <span className="text-[10px] font-black tracking-widest text-purple-400 uppercase">Part 04 • The Step-by-Step Levels</span>
            <h3 className="text-xl font-black text-white">The 6 Levels from Day 1 to Scale</h3>
          </div>
          <span className="text-xs text-white/50">Click each level to see your practical tasks</span>
        </div>

        {/* Level Navigation Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {SIMPLE_STAGES.map((st, idx) => {
            const isActive = activeStageIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveStageIndex(idx)}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  isActive
                    ? "bg-purple-500/20 border-purple-500/60 shadow-lg shadow-purple-500/20 scale-[1.02]"
                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-purple-400">
                    Level 0{st.level}
                  </span>
                  <span className="text-[9px] font-bold text-white/40">{st.time}</span>
                </div>
                <div className="text-xs font-black text-white truncate">
                  {st.name.replace(/^Level \d+:\s*/, "")}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Level Card */}
        {SIMPLE_STAGES[activeStageIndex] && (
          <div className="p-6 md:p-8 rounded-3xl bg-[#090e1a]/90 border border-purple-500/30 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-[9px] font-black text-purple-300 uppercase tracking-widest">
                  Level {SIMPLE_STAGES[activeStageIndex].level}
                </span>
                <h4 className="text-xl md:text-2xl font-black text-white mt-1">
                  {SIMPLE_STAGES[activeStageIndex].name}
                </h4>
                <p className="text-xs text-white/70 mt-1">
                  {SIMPLE_STAGES[activeStageIndex].simpleGoal}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start md:self-center">
                <button
                  disabled={activeStageIndex === 0}
                  onClick={() => setActiveStageIndex((p) => Math.max(0, p - 1))}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-xs font-bold border border-white/10"
                >
                  Previous
                </button>
                <button
                  disabled={activeStageIndex === SIMPLE_STAGES.length - 1}
                  onClick={() => setActiveStageIndex((p) => Math.min(SIMPLE_STAGES.length - 1, p + 1))}
                  className="px-4 py-1.5 rounded-xl bg-purple-500 text-black hover:bg-purple-400 disabled:opacity-30 text-xs font-black flex items-center gap-1"
                >
                  Next Level <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* What to do checklist */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                What to do during this level (Check off as you complete)
              </span>

              <div className="space-y-2.5">
                {SIMPLE_STAGES[activeStageIndex].whatToDoThisWeek.map((taskText, tidx) => {
                  const taskKey = `stage-${activeStageIndex}-${tidx}`;
                  const isChecked = !!completedTasks[taskKey];
                  return (
                    <div
                      key={tidx}
                      onClick={() => toggleTask(taskKey)}
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isChecked
                          ? "bg-emerald-500/10 border-emerald-500/30 text-white/50"
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-colors ${
                            isChecked
                              ? "bg-emerald-500 border-emerald-500 text-black"
                              : "border-white/30 bg-black/20"
                          }`}
                        >
                          {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                        <span className={`text-xs font-bold ${isChecked ? "line-through text-white/40" : "text-white"}`}>
                          {taskText}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/40 font-semibold">Priority</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Red flag to watch out for */}
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs">
                <strong className="text-red-300 font-bold block">Red Flag to Watch Out For:</strong>
                <p className="text-red-200/90 leading-relaxed">{SIMPLE_STAGES[activeStageIndex].warningSign}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── STEP 5: HOW LONG DOES IT TAKE? (3 REALISTIC SPEEDS) ── */}
      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-black tracking-widest text-yellow-400 uppercase">Part 05 • Realistic Speeds</span>
          <h3 className="text-xl font-black text-white">How Long Does It Take to Reach ₹8.5 Crore ($1 Million)?</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {THREE_SPEEDS.map((sp, idx) => (
            <div key={idx} className="p-6 rounded-3xl bg-[#090e1a]/85 border border-white/10 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[9px] font-bold text-white/70">
                    {sp.badge}
                  </span>
                  <span className="text-xs font-black text-cyan-400">{sp.speed}</span>
                </div>

                <h4 className="text-base font-black text-white">{sp.name}</h4>

                <div className="text-xs space-y-1.5 text-white/80">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/50">Money Needed:</span>
                    <strong className="text-amber-300">{sp.capital}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/50">Risk Level:</span>
                    <strong className="text-emerald-400">{sp.risk}</strong>
                  </div>
                </div>

                <p className="text-xs text-white/70 leading-relaxed">
                  {sp.howItWorks}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── STEP 6: PLAIN TRUTH & REALITY CHECK ── */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-red-500/10 via-amber-500/5 to-cyan-500/10 border border-white/15 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-amber-400" />
          <h4 className="text-sm font-black text-white uppercase tracking-wider">The Plain Reality Check</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">What Kills Most Startups</span>
            <p className="text-white/90 leading-relaxed font-medium">
              Building a complicated product for 6 months before asking anyone to pay money. Start selling on Day 1.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Your Secret Superpower</span>
            <p className="text-white/90 leading-relaxed font-medium">
              Moving fast and giving personal care to your first 10 customers. Big slow incumbents can never do that.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">The One Number to Watch</span>
            <p className="text-white/90 leading-relaxed font-medium">
              How many customers actively used your product to solve their problem this week. If this goes up, you win.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
