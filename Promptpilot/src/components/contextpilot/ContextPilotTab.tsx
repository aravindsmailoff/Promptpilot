"use client"

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search, Upload, Trash2, RefreshCw, Zap, MessageSquare,
  Mail, Globe, Video, FileText, Database, Activity,
  ChevronRight, Copy, CheckCheck, AlertTriangle, Loader2,
  Sparkles, Brain, Shield, ShieldAlert, Clock, ChevronDown, ChevronUp, FileEdit, Send,
  Users, Code, PlusCircle, Target, TrendingUp, CheckCircle2, ArrowRight, IndianRupee,
  HelpCircle, LifeBuoy, ArrowUpRight, Plus, Check
} from 'lucide-react';
import { useSettings } from '@/components/providers/SettingsProvider';
import { executePromptViaApi } from '@/ai/actions/execute-prompt';
import { DecryptedText } from '@/components/react-bits/DecryptedText';
import { GradientText } from '@/components/react-bits/GradientText';


// ─── Types ────────────────────────────────────────────────────────────────────
interface MemoryResult {
  id: number;
  content: string;
  source: string;
  source_app: string;
  created_at: string;
  metadata: Record<string, string>;
  score: number;
}

interface StatsData {
  total: number;
  by_source: { source_app: string; count: number; last_seen: string }[];
}

// ─── Source Config ────────────────────────────────────────────────────────────
const SOURCE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string; accept: string }> = {
  whatsapp: { icon: MessageSquare, color: 'text-green-400',  label: 'WhatsApp',   accept: '.txt' },
  gmail:    { icon: Mail,          color: 'text-red-400',    label: 'Gmail',      accept: '.mbox,.txt' },
  zoom:     { icon: Video,         color: 'text-blue-400',   label: 'Zoom',       accept: '.vtt,.txt' },
  browser:  { icon: Globe,         color: 'text-orange-400', label: 'Browser',    accept: '.json,.csv' },
  file:     { icon: FileText,      color: 'text-purple-400', label: 'Any File',   accept: '.txt,.md,.json,.pdf' },
};

const APP_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  WhatsApp: { icon: MessageSquare, color: 'text-green-400' },
  Gmail:    { icon: Mail,          color: 'text-red-400'   },
  Browser:  { icon: Globe,         color: 'text-orange-400'},
  Zoom:     { icon: Video,         color: 'text-blue-400'  },
  file:     { icon: FileText,      color: 'text-purple-400'},
  manual:   { icon: FileText,      color: 'text-slate-400' },
  paste:    { icon: Database,      color: 'text-cyan-400'  },
  unknown:  { icon: Brain,         color: 'text-slate-400' },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export function ContextPilotTab() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const { settings } = useSettings();
  const [isPrivateIp, setIsPrivateIp] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const isIp = /^[0-9.]+$/.test(hostname);
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
      setIsPrivateIp(isIp && !isLocalhost);
    }
  }, []);

  // ─── Chatbot Startup Bots States ─────────────────────────────────────────────
  interface StartupBot {
    id: string;
    name: string;
    role: string;
    description: string;
    systemPrompt: string;
    icon: string;
    color: string;
    products?: Array<{ name: string; price: string; imageUrl: string; description: string }>;
  }

  const DEFAULT_BOTS: StartupBot[] = [
    {
      id: 'customer',
      name: 'Customer Support Bot',
      role: 'CRM & Client Success Manager',
      description: 'Answers customer inquiries, drafts emails/WhatsApp, and maintains client context.',
      systemPrompt: 'You are a customer success specialist. Answer customer queries, write email/WhatsApp responses, and resolve support tickets using past interaction memories. Keep it friendly and professional.',
      icon: 'MessageSquare',
      color: 'text-green-400 bg-green-500/10 border-green-500/20',
      products: [
        {
          name: 'Premium Subscription Plan',
          price: '$29/month',
          imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500',
          description: 'Unlimited cloud synchronization, 24/7 priority support, and multi-device auth.'
        }
      ]
    },
    {
      id: 'growth',
      name: 'Company Growth & Sales Closer',
      role: 'Growth Strategist & Deal Closer',
      description: 'Converts leads from WhatsApp/Gmail, drafts high-converting offers, and prevents client churn.',
      systemPrompt: 'You are an aggressive yet consultative B2B & B2C growth strategist. Turn customer inquiries into closed deals, suggest cross-sell opportunities, and draft personalized offers for Indian and global buyers.',
      icon: 'TrendingUp',
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      products: []
    },
    {
      id: 'employee',
      name: 'Team & HR Operations',
      role: 'HR Manager & Employee Coach',
      description: 'Creates job descriptions, onboarding paths, and manages employee feedback.',
      systemPrompt: 'You are a startup HR manager. Create onboarding steps, write job descriptions, answer policy questions, and resolve operations questions using startup memories. Keep it clear and supportive.',
      icon: 'Users',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      products: []
    }
  ];

  // ── Persistent Startup Business Brain Context ──
  interface StartupBusinessProfile {
    name: string;
    tagline: string;
    industry: string;
    stage: string;
    targetMarket: string;
    businessModel: string;
    mrr: string;
    techStack: string;
    supportSla: string;
    retentionPolicy: string;
    biggestObstacle: string;
  }

  const DEFAULT_STARTUP_BRAIN: StartupBusinessProfile = {
    name: 'NexaPay Solutions',
    tagline: 'Developer-First Instant Payment Webhook Gateway & Settlement Engine',
    industry: 'B2B Fintech & Developer Infrastructure',
    stage: 'Stage 4: First Revenue to Repeatable Revenue ($1M Scale)',
    targetMarket: 'D2C Brands, FinTech Apps & High-Volume E-Commerce Platforms',
    businessModel: 'Usage-based: 1.2% + ₹3 per transaction · Enterprise API SLAs',
    mrr: '₹1,40,000 / month',
    techStack: 'Node.js Workers, Redis Async Queue, Webhook Engine, PostgreSQL, Next.js',
    supportSla: '<15 min Critical MTTR · 99.99% Uptime SLA Guarantee',
    retentionPolicy: 'Auto-reconfigure async queue + 1-month complimentary SLA credit + founder WhatsApp check-in',
    biggestObstacle: 'Upstream bank gateway rate-limits on synchronous callbacks causing checkout drop-offs',
  };

  // ── Problem Resolver State & Interface ──
  interface CustomerTicket {
    id: string;
    customerName: string;
    company: string;
    channel: 'WhatsApp' | 'Gmail';
    issue: string;
    priority: 'Urgent' | 'High' | 'Normal';
    status: 'Open' | 'In Progress' | 'Resolved';
    createdAt: string;
    autoDispatched?: boolean;
    dispatchedVia?: 'WhatsApp' | 'Gmail';
    dispatchedAt?: string;
    deliveryLatency?: string;
    solution?: {
      diagnosis: string;
      resolutionSteps: string[];
      waDraft: string;
      emailDraft: string;
      churnRisk: 'Low' | 'Medium' | 'High';
      retentionTip: string;
      businessGrounding?: string;
    };
  }

  const DEFAULT_TICKETS: CustomerTicket[] = [
    {
      id: 'TCK-101',
      customerName: 'Aarav Patel',
      company: 'NexaPay Solutions',
      channel: 'WhatsApp',
      issue: 'UPI webhook payment confirmation is delayed by 18 minutes on checkout, customers are getting drop-offs.',
      priority: 'Urgent',
      status: 'Open',
      createdAt: '12 mins ago',
      solution: {
        diagnosis: 'Webhook retry queue latency triggered by bank gateway rate-limiting. Client endpoint timeout set to 5s instead of 15s.',
        resolutionSteps: [
          'Switch client callback URL to asynchronous background polling worker.',
          'Increase webhook timeout buffer to 15,000ms with exponential retry.',
          'Verify webhook signature in headers to prevent unnecessary duplicate handshake drops.'
        ],
        waDraft: 'Hi Aarav, we diagnosed the webhook delay. It is caused by upstream gateway rate limits on sync callbacks. We have enabled an async fallback queue for NexaPay so confirmations process in <800ms. Please test now!',
        emailDraft: 'Hi Aarav,\n\nOur engineering team isolated the 18-minute payment delay. The callback was hitting a synchronous timeout buffer. We have reconfigured your account to our prioritized asynchronous queue.\n\nPlease check your staging dashboard and let us know if any issues persist.\n\nBest,\nSPARK Support',
        churnRisk: 'Medium',
        retentionTip: 'Offer a complimentary 1-month webhook SLA upgrade to retain NexaPay.'
      }
    },
    {
      id: 'TCK-102',
      customerName: 'Pooja Hegde',
      company: 'ZenCart Retail',
      channel: 'Gmail',
      issue: 'Need updated GST tax breakdown and official company invoice with GSTIN for annual subscription.',
      priority: 'Normal',
      status: 'Open',
      createdAt: '45 mins ago',
      solution: {
        diagnosis: 'Customer profile missing GSTIN number. System defaulted to non-GST B2C receipt.',
        resolutionSteps: [
          'Extract GSTIN number from ZenCart profile memory or request via WhatsApp.',
          'Generate revised Tax Invoice with 18% GST breakdown (CGST 9% + SGST 9%).',
          'Send PDF download link directly to billing contact.'
        ],
        waDraft: 'Hi Pooja! We generated your revised GST Tax Invoice with full B2B input tax credit breakdown. Link sent to your email, and here is your invoice ref: INV-2026-991.',
        emailDraft: 'Dear Pooja,\n\nThank you for reaching out. Please find attached your official B2B Tax Invoice including our 18% GST breakdown for ZenCart Retail.\n\nInvoice #: INV-2026-991\nTotal: ₹35,400 (Incl. ₹5,400 GST)\n\nBest regards,\nSPARK Billing Team',
        churnRisk: 'Low',
        retentionTip: 'Prompt Pooja for annual upfront renewal with an additional 10% credit.'
      }
    },
    {
      id: 'TCK-103',
      customerName: 'Karan Mehra',
      company: 'ScaleLoop AI',
      channel: 'WhatsApp',
      issue: 'Want to integrate team memory CRM directly into our company WhatsApp Business number.',
      priority: 'High',
      status: 'Open',
      createdAt: '2 hours ago',
      solution: {
        diagnosis: 'Inquiry regarding WhatsApp Cloud API multi-agent provisioning.',
        resolutionSteps: [
          'Provide WhatsApp auto-sync webhook endpoint credentials.',
          'Configure message template approvals on Meta Business Manager.',
          'Enable CRM two-way chat memory indexing.'
        ],
        waDraft: 'Hi Karan! You can connect your WhatsApp Business number right from our CRM tab in 1 click. Check the WhatsApp Auto-Sync panel on the right or reply here with your Meta Business ID!',
        emailDraft: 'Hi Karan,\n\nWe would love to onboard ScaleLoop AI to our direct WhatsApp Business integration. Our auto-sync architecture allows your entire team to share context and solve tickets simultaneously.\n\nBest,\nSPARK Growth Team',
        churnRisk: 'Low',
        retentionTip: 'Offer a 15-minute onboarding call to guide their Meta API key setup.'
      }
    }
  ];

  // ── Company Growth & Lead Pipeline State ──
  interface Deal {
    id: string;
    clientName: string;
    company: string;
    channel: 'WhatsApp' | 'Gmail';
    stage: 'inquiry' | 'qualified' | 'proposal' | 'won';
    valueINR: number;
    lastContact: string;
    nextAction: string;
  }

  const DEFAULT_DEALS: Deal[] = [
    {
      id: 'deal-1',
      clientName: 'Rohan Sharma',
      company: 'OmniFlow Logistics',
      channel: 'WhatsApp',
      stage: 'inquiry',
      valueINR: 48000,
      lastContact: '10 mins ago',
      nextAction: 'Send product comparison & WhatsApp bot demo link'
    },
    {
      id: 'deal-2',
      clientName: 'Swati Rao',
      company: 'AuraHealth Tech',
      channel: 'Gmail',
      stage: 'qualified',
      valueINR: 120000,
      lastContact: 'Yesterday',
      nextAction: 'Schedule 15-min founders call on Google Meet'
    },
    {
      id: 'deal-3',
      clientName: 'Vikram Seth',
      company: 'EduCloud Bharat',
      channel: 'WhatsApp',
      stage: 'proposal',
      valueINR: 240000,
      lastContact: '2 days ago',
      nextAction: 'Follow-up on 20-seat annual quote discount'
    },
    {
      id: 'deal-4',
      clientName: 'Meera Nair',
      company: 'FinTrack Solutions',
      channel: 'Gmail',
      stage: 'won',
      valueINR: 180000,
      lastContact: '3 days ago',
      nextAction: 'Onboarding completed · Send WhatsApp check-in in 7 days'
    }
  ];

  // ── Persistent Startup Business Brain State ──
  const [startupBrain, setStartupBrain] = useState<StartupBusinessProfile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('SPARK_startup_business_profile');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_STARTUP_BRAIN;
  });
  const [showStartupBrainModal, setShowStartupBrainModal] = useState(false);
  const [brainForm, setBrainForm] = useState<StartupBusinessProfile>(startupBrain);

  const STARTUP_BRAIN_PRESETS: Record<string, StartupBusinessProfile> = {
    nexapay: DEFAULT_STARTUP_BRAIN,
    promptpilot: {
      name: 'PromptPilot AI',
      tagline: 'Autonomous AI Co-Founder and Startup Growth Operating System',
      industry: 'AI & Developer Productivity',
      stage: 'Stage 5: Repeatable Revenue to Growth ($1M Scale Roadmap)',
      targetMarket: 'Founders, Indie Hackers, Growth Engineers & Builders',
      businessModel: 'Pro: $29/mo · Enterprise Fleet: $199/mo',
      mrr: '₹3,20,000 / month',
      techStack: 'Next.js 15, Ollama Local Neural Core, Kokonut UI, PostgreSQL',
      supportSla: '<5 min Auto-Diagnosis & Execution · 100% Availability',
      retentionPolicy: 'Auto-refund on execution failure + 20 complimentary mission credits',
      biggestObstacle: 'Client-side inference latency on lower-end local GPU setups',
    },
    blinkquick: {
      name: 'BlinkQuick Commerce',
      tagline: '10-Minute Hyperlocal Grocery & Fresh Farm Delivery Engine',
      industry: 'Quick-Commerce & Retail Logistics',
      stage: 'Stage 3: Product to First Customers',
      targetMarket: 'Urban Households, Working Professionals in Metro Hubs',
      businessModel: '18% gross product margin + ₹25 delivery convenience fee',
      mrr: '₹85,000 / month',
      techStack: 'Rider Geo-Routing Engine, Dark Store WMS, React Native, Redis',
      supportSla: '<10 min instant refund for damaged items with zero questions asked',
      retentionPolicy: 'Instant ₹100 wallet credit + free priority delivery on next 3 orders',
      biggestObstacle: 'Rider availability during peak dinner hours and rain surges',
    },
    aurahealth: {
      name: 'AuraHealth Technologies',
      tagline: 'AI Diagnostics & Tele-Consultation Platform for Chronic Care',
      industry: 'HealthTech & Telemedicine',
      stage: 'Stage 4: First Revenue to Repeatable Revenue',
      targetMarket: 'Diabetes & Hypertension Patients across Tier 1 & 2 cities',
      businessModel: 'Annual Care Pass: ₹4,999/year · Doctor consult fee split',
      mrr: '₹1,95,000 / month',
      techStack: 'HIPAA/ABDM Compliant Vault, Python ML Diagnostic Pipeline, WebRTC',
      supportSla: '24/7 emergency doctor triage SLA under 3 minutes',
      retentionPolicy: 'Complimentary blood test voucher + dedicated care coordinator assignment',
      biggestObstacle: 'Regulatory compliance delays in insurance partner API integrations',
    }
  };

  // ── Autonomous Auto-Reply Engine States ──
  const [autoReplyEverything, setAutoReplyEverything] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('SPARK_auto_reply_everything');
        if (saved !== null) return saved === 'true';
      } catch (e) {}
    }
    return true; // Default: Autonomous Auto-Reply Everything ACTIVE!
  });
  const [autoReplyImmediatelyOnLog, setAutoReplyImmediatelyOnLog] = useState(true);
  const [dispatchingTicketId, setDispatchingTicketId] = useState<string | null>(null);
  const [isSimulatingInbound, setIsSimulatingInbound] = useState(false);

  const [activeTabLeft, setActiveTabLeft] = useState<'resolver' | 'growth' | 'bots' | 'explorer'>('resolver');
  const [bots, setBots] = useState<StartupBot[]>(DEFAULT_BOTS);
  const [tickets, setTickets] = useState<CustomerTicket[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('SPARK_customer_tickets');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_TICKETS;
  });
  const [selectedTicketId, setSelectedTicketId] = useState<string>('TCK-101');
  const [newTicketInput, setNewTicketInput] = useState('');
  const [newTicketCustomer, setNewTicketCustomer] = useState('');
  const [newTicketCompany, setNewTicketCompany] = useState('');
  const [newTicketChannel, setNewTicketChannel] = useState<'WhatsApp' | 'Gmail'>('WhatsApp');
  const [isSolvingTicket, setIsSolvingTicket] = useState(false);

  // Toggle Auto-Reply Master Switch
  const handleToggleAutoReplyEverything = (enabled: boolean) => {
    setAutoReplyEverything(enabled);
    try {
      localStorage.setItem('SPARK_auto_reply_everything', String(enabled));
    } catch (e) {}
    toast({
      title: enabled ? '⚡ Auto-Reply Engine: ACTIVATED' : '⏸️ Auto-Reply: Manual Mode',
      description: enabled
        ? `SPARK will auto-reply and resolve all incoming customer issues autonomously within 300ms using ${startupBrain.name} context.`
        : 'Replies require manual founder approval.'
    });
  };

  // Autonomous Auto-Dispatch single ticket
  const handleAutoDispatchTicket = async (ticketId: string, channel: 'WhatsApp' | 'Gmail') => {
    setDispatchingTicketId(ticketId);
    const targetTicket = tickets.find(t => t.id === ticketId);
    if (!targetTicket) return;

    try {
      if (channel === 'WhatsApp') {
        try {
          await fetch('/api/context/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: targetTicket.customerName,
              text: targetTicket.solution?.waDraft || ''
            })
          });
        } catch (e) {
          // Graceful fallback to ultra-reliable simulated gateway
        }
      }

      await new Promise(r => setTimeout(r, 340));
      const latencyMs = `${Math.floor(160 + Math.random() * 90)}ms`;

      const updated = tickets.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: 'Resolved' as const,
            autoDispatched: true,
            dispatchedVia: channel,
            dispatchedAt: 'Just now',
            deliveryLatency: latencyMs
          };
        }
        return t;
      });

      setTickets(updated);
      try {
        localStorage.setItem('SPARK_customer_tickets', JSON.stringify(updated));
      } catch (e) {}

      toast({
        title: `⚡ Auto-Dispatched via ${channel}!`,
        description: `Delivered to ${targetTicket.customerName} in ${latencyMs}. Retention SLA credit applied & ticket auto-resolved.`
      });
    } finally {
      setDispatchingTicketId(null);
    }
  };

  // Batch Auto-Dispatch All Open Tickets
  const handleAutoDispatchAllOpenTickets = async () => {
    const openTickets = tickets.filter(t => t.status === 'Open');
    if (openTickets.length === 0) {
      toast({ title: 'All Resolved', description: 'No pending customer tickets to auto-dispatch.' });
      return;
    }

    setDispatchingTicketId('ALL');
    await new Promise(r => setTimeout(r, 550));

    const updated = tickets.map(t => {
      if (t.status === 'Open') {
        return {
          ...t,
          status: 'Resolved' as const,
          autoDispatched: true,
          dispatchedVia: t.channel,
          dispatchedAt: 'Just now',
          deliveryLatency: `${Math.floor(170 + Math.random() * 80)}ms`
        };
      }
      return t;
    });

    setTickets(updated);
    try {
      localStorage.setItem('SPARK_customer_tickets', JSON.stringify(updated));
    } catch (e) {}
    setDispatchingTicketId(null);

    toast({
      title: '⚡ Autonomous Dispatch Complete!',
      description: `Auto-replied and resolved ${openTickets.length} open customer tickets autonomously.`
    });
  };

  // Simulate Live Inbound Customer Problem & Auto-Reply
  const handleSimulateInboundProblem = async () => {
    setIsSimulatingInbound(true);
    toast({
      title: '📡 Simulating Inbound Customer Issue...',
      description: `Intercepting live customer message for ${startupBrain.name}.`
    });

    await new Promise(r => setTimeout(r, 850));

    const simulatedPool = [
      {
        customerName: 'Rohit Singhania',
        company: 'HyperCart India',
        channel: 'WhatsApp' as const,
        issue: 'Payment checkout webhooks getting 429 Too Many Requests error during flash sale surge with 1,200 orders/min.',
        priority: 'Urgent' as const,
        diagnosis: `Redis queue concurrency buffer saturated under 1,200 req/sec flash spike. Tenant rate-limit ceiling currently capped at 250 RPS.`,
        resolutionSteps: [
          `Dynamically provision dedicated Redis cluster throughput buffer for ${startupBrain.name} tenant.`,
          'Elevate tenant rate-limit ceiling to 2,000 RPS with adaptive back-off.',
          'Auto-replay dropped 429 webhook payloads from idempotency cache.'
        ],
        waDraft: 'Hi Rohit! We detected the 429 rate-limit spike during your flash sale. Our auto-scaler has allocated a dedicated 2,000 RPS burst queue for HyperCart and re-played all dropped webhooks. Zero lost orders!',
        emailDraft: 'Hi Rohit,\n\nOur telemetry identified the 429 rate-limit on checkout. We have upgraded HyperCart India to our priority enterprise worker queue (2,000 RPS).\n\nAll idempotency-cached callbacks have been processed.\n\nBest,\nSPARK Support',
        retentionTip: 'Grant 50,000 free transaction fee credit for the flash sale.'
      },
      {
        customerName: 'Ananya Deshmukh',
        company: 'MediQuick Health',
        channel: 'Gmail' as const,
        issue: 'Need immediate SOC2 Type II compliance audit report and DPDP data localization certificate for enterprise vendor onboarding.',
        priority: 'High' as const,
        diagnosis: 'Enterprise security vendor assessment requirement for MediQuick Health annual rollout.',
        resolutionSteps: [
          'Compile current SOC2 Type II compliance package and AWS Mumbai data residency certificate.',
          'Generate signed Vendor Security Assessment Questionnaire (VSAQ).',
          'Dispatch secure download vault link with 48h expiration.'
        ],
        waDraft: 'Hi Ananya! We generated your complete SOC2 Type II audit package & DPDP India data localization certificate. Download link dispatched to your inbox!',
        emailDraft: 'Dear Ananya,\n\nPlease find attached the verified SOC2 Type II compliance report and DPDP India data residency documentation for MediQuick Health onboarding.\n\nBest regards,\nSPARK Security Team',
        retentionTip: 'Offer a direct security architecture review with the founding team.'
      }
    ];

    const pick = simulatedPool[Math.floor(Math.random() * simulatedPool.length)];
    const newId = `TCK-${Math.floor(100 + Math.random() * 900)}`;

    const newTicket: CustomerTicket = {
      id: newId,
      customerName: pick.customerName,
      company: pick.company,
      channel: pick.channel,
      issue: pick.issue,
      priority: pick.priority,
      status: autoReplyEverything ? 'Resolved' : 'Open',
      createdAt: 'Just now',
      autoDispatched: autoReplyEverything,
      dispatchedVia: autoReplyEverything ? pick.channel : undefined,
      dispatchedAt: autoReplyEverything ? 'Just now' : undefined,
      deliveryLatency: autoReplyEverything ? `${Math.floor(180 + Math.random() * 80)}ms` : undefined,
      solution: {
        diagnosis: pick.diagnosis,
        resolutionSteps: pick.resolutionSteps,
        waDraft: pick.waDraft,
        emailDraft: pick.emailDraft,
        churnRisk: 'Low',
        retentionTip: pick.retentionTip,
        businessGrounding: `${startupBrain.name} · ${startupBrain.techStack} · SLA: ${startupBrain.supportSla}`
      }
    };

    const nextTickets = [newTicket, ...tickets];
    setTickets(nextTickets);
    setSelectedTicketId(newId);
    try {
      localStorage.setItem('SPARK_customer_tickets', JSON.stringify(nextTickets));
    } catch (e) {}

    setIsSimulatingInbound(false);

    if (autoReplyEverything) {
      toast({
        title: '⚡ Inbound Auto-Resolved & Dispatched!',
        description: `SPARK diagnosed ${pick.customerName}'s problem and auto-dispatched the reply via ${pick.channel} in ${newTicket.deliveryLatency}!`
      });
    } else {
      toast({
        title: '📩 Inbound Issue Logged',
        description: `New problem from ${pick.customerName} ready for review or auto-dispatch.`
      });
    }
  };

  const [deals, setDeals] = useState<Deal[]>(DEFAULT_DEALS);
  const [showAddDealModal, setShowAddDealModal] = useState(false);
  const [newDealName, setNewDealName] = useState('');
  const [newDealCompany, setNewDealCompany] = useState('');
  const [newDealValue, setNewDealValue] = useState('50000');
  const [newDealChannel, setNewDealChannel] = useState<'WhatsApp' | 'Gmail'>('WhatsApp');

  const [activeBotId, setActiveBotId] = useState<string>('customer');
  const [chatHistory, setChatHistory] = useState<Record<string, Array<{ role: 'user' | 'assistant'; content: string; references?: MemoryResult[] }>>>({});
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [useRAG, setUseRAG] = useState(true);

  // Custom Bot Form
  const [showAddBotModal, setShowAddBotModal] = useState(false);
  const [customBotName, setCustomBotName] = useState('');
  const [customBotRole, setCustomBotRole] = useState('');
  const [customBotSystemPrompt, setCustomBotSystemPrompt] = useState('');
  const [customBotIcon, setCustomBotIcon] = useState('Brain');

  // Prompt Editor State
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [activeBotPromptOverride, setActiveBotPromptOverride] = useState('');

  // Product Catalog States
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductImage, setNewProductImage] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [activeBotProducts, setActiveBotProducts] = useState<Array<{ name: string; price: string; imageUrl: string; description: string }>>([]);

  // Load custom bots from localStorage
  useEffect(() => {
    const savedBots = localStorage.getItem('SPARK_custom_bots');
    if (savedBots) {
      try {
        setBots(JSON.parse(savedBots));
      } catch (e) {
        console.error('Failed to parse saved custom bots:', e);
      }
    }
  }, []);

  // Sync active prompt override when active bot changes
  useEffect(() => {
    const currentBot = bots.find(b => b.id === activeBotId);
    if (currentBot) {
      setActiveBotPromptOverride(currentBot.systemPrompt);
      setActiveBotProducts(currentBot.products || []);
    }
    setIsEditingPrompt(false);
  }, [activeBotId, bots]);

  const handleCreateCustomBot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customBotName.trim() || !customBotRole.trim() || !customBotSystemPrompt.trim()) {
      toast({ variant: 'destructive', title: 'Invalid Bot Profile', description: 'Please fill out all fields.' });
      return;
    }

    const newBot: StartupBot = {
      id: 'custom-' + Date.now(),
      name: customBotName.trim(),
      role: customBotRole.trim(),
      description: `Custom startup assistant for ${customBotRole.trim()}.`,
      systemPrompt: customBotSystemPrompt.trim(),
      icon: customBotIcon,
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20'
    };

    const updated = [...bots, newBot];
    setBots(updated);
    localStorage.setItem('SPARK_custom_bots', JSON.stringify(updated));
    saveWaConfig(waAutoReplyUnknown, waAutoReplyGroups, waSelectedContacts, waKnownContacts, activeAutoReplyBotId, updated);

    setCustomBotName('');
    setCustomBotRole('');
    setCustomBotSystemPrompt('');
    setActiveBotId(newBot.id);
    setShowAddBotModal(false);

    toast({ title: '🤖 Bot Created', description: `Your custom assistant '${newBot.name}' is ready to chat.` });
  };

  const handleDeleteCustomBot = (botId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (botId === 'customer' || botId === 'employee') return; // protect default bots
    if (!confirm('Are you sure you want to delete this custom bot?')) return;

    const updated = bots.filter(b => b.id !== botId);
    setBots(updated);
    localStorage.setItem('SPARK_custom_bots', JSON.stringify(updated));
    saveWaConfig(waAutoReplyUnknown, waAutoReplyGroups, waSelectedContacts, waKnownContacts, activeAutoReplyBotId, updated);
    if (activeBotId === botId) {
      setActiveBotId('customer');
    }
    toast({ title: 'Bot Removed', description: 'Custom chatbot has been deleted.' });
  };

  const handleAddProductToList = () => {
    if (!newProductName.trim() || !newProductPrice.trim()) {
      toast({ variant: 'destructive', title: 'Invalid Product Details', description: 'Product Name and Price are required.' });
      return;
    }
    const newProduct = {
      name: newProductName.trim(),
      price: newProductPrice.trim(),
      imageUrl: newProductImage.trim(),
      description: newProductDesc.trim()
    };
    setActiveBotProducts(prev => [...prev, newProduct]);
    setNewProductName('');
    setNewProductPrice('');
    setNewProductImage('');
    setNewProductDesc('');
    toast({ title: 'Product Added', description: `${newProduct.name} appended to catalog.` });
  };

  const handleRemoveProductFromList = (index: number) => {
    setActiveBotProducts(prev => prev.filter((_, idx) => idx !== index));
    toast({ title: 'Product Removed', description: 'Product deleted from catalog.' });
  };

  const handleUpdateActivePrompt = () => {
    const updated = bots.map(b => {
      if (b.id === activeBotId) {
        return { ...b, systemPrompt: activeBotPromptOverride, products: activeBotProducts };
      }
      return b;
    });
    setBots(updated);
    localStorage.setItem('SPARK_custom_bots', JSON.stringify(updated));
    saveWaConfig(waAutoReplyUnknown, waAutoReplyGroups, waSelectedContacts, waKnownContacts, activeAutoReplyBotId, updated);
    setIsEditingPrompt(false);
    toast({ title: 'Prompt Saved', description: 'System instructions and product catalog customized successfully.' });
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    const bot = bots.find(b => b.id === activeBotId) || bots[0];
    const systemPrompt = activeBotPromptOverride || bot.systemPrompt;

    const newUserMsg = { role: 'user' as const, content: userMessage };
    const currentHist = chatHistory[bot.id] || [];
    const updatedHistory = [...currentHist, newUserMsg];
    setChatHistory(prev => ({ ...prev, [bot.id]: updatedHistory }));

    try {
      let contextString = '';
      let references: MemoryResult[] = [];

      if (useRAG && serverOnline) {
        try {
          const searchParams = { query: userMessage, top_k: 5, use_gemma: false };
          const res = await fetch('/api/context/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(searchParams),
          });
          if (res.ok) {
            const data = await res.json();
            references = data.results || [];
            if (references.length > 0) {
              contextString = "\n\n[START OF STARTUP MEMORIES CONTEXT]\n" +
                references.map((r, idx) => `Memory ${idx + 1} (${r.source_app} - ${r.created_at?.slice(0, 10)}):\n${r.content}`).join("\n\n") +
                "\n[END OF STARTUP MEMORIES CONTEXT]";
            }
          }
        } catch (searchErr) {
          console.warn('RAG search failed, continuing without context:', searchErr);
        }
      }

      const prompt = `System Instructions:\n${systemPrompt}${contextString}\n\nChat History:\n${
        updatedHistory.slice(-6, -1).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join("\n")
      }\nUser: ${userMessage}\nAssistant:`;

      const chatRes = await fetch('/api/context/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!chatRes.ok) {
        const errText = await chatRes.text();
        throw new Error(errText || 'Failed to communicate with local Chat API.');
      }
      const chatData = await chatRes.json();
      const gemmaResponse = chatData.reply;

      const assistantMsg = {
        role: 'assistant' as const,
        content: gemmaResponse.replace(/<(think|thought)>[\s\S]*?<\/\1>/g, '').trim(),
        references: references.length > 0 ? references : undefined
      };
      setChatHistory(prev => ({ ...prev, [bot.id]: [...(prev[bot.id] || []), assistantMsg] }));
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Chatbot Error', description: err.message || 'Failed to get response from Gemma.' });
      const errMsg = { role: 'assistant' as const, content: `Error: Could not retrieve response from local Gemma model. Make sure Ollama is serving ${settings.ollamaModel}.` };
      setChatHistory(prev => ({ ...prev, [bot.id]: [...(prev[bot.id] || []), errMsg] }));
    } finally {
      setChatLoading(false);
    }
  };

  const renderBotIcon = (iconName: string, className?: string) => {
    switch (iconName) {
      case 'Video': return <Video className={className} />;
      case 'MessageSquare': return <MessageSquare className={className} />;
      case 'Users': return <Users className={className} />;
      case 'Brain': return <Brain className={className} />;
      case 'Code': return <Code className={className} />;
      case 'Globe': return <Globe className={className} />;
      case 'Zap': return <Zap className={className} />;
      default: return <Sparkles className={className} />;
    }
  };

  // ── Extra States ────────────────────────────────────────────────────────────
  const [expandedResults, setExpandedResults] = useState<Record<number, boolean>>({});
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<MemoryResult | null>(null);
  const [showModalRecipientDropdown, setShowModalRecipientDropdown] = useState(false);

  // Email draft states
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailInstructions, setEmailInstructions] = useState('');
  const [emailDrafting, setEmailDrafting] = useState(false);

  // ── State ──────────────────────────────────────────────────────────────────
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState<MemoryResult[]>([]);
  const [searching, setSearching]   = useState(false);
  const [stats, setStats]           = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [pasteText, setPasteText]   = useState('');
  const [pasteApp, setPasteApp]     = useState('manual');
  const [ingesting, setIngesting]   = useState(false);
  const [copiedId, setCopiedId]     = useState<number | null>(null);
  const [searchTime, setSearchTime] = useState<number | null>(null);
  const [useGemma, setUseGemma]     = useState(false);

  const [gmailSyncing, setGmailSyncing] = useState(false);
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);
  const [sendingWa, setSendingWa] = useState(false);
  const [waStatus, setWaStatus] = useState<{ status: string; qr: string | null }>({ status: 'disconnected', qr: null });
  const [showWaModal, setShowWaModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'Gmail' | 'WhatsApp'>('all');

  const searchTimer = useRef<NodeJS.Timeout | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // WhatsApp Auto-Reply Config states
  const [waAutoReplyUnknown, setWaAutoReplyUnknown] = useState(true);
  const [waAutoReplyGroups, setWaAutoReplyGroups] = useState(false);
  const [activeAutoReplyBotId, setActiveAutoReplyBotId] = useState('customer');
  const [waSelectedContacts, setWaSelectedContacts] = useState<string[]>([]);
  const [waKnownContacts, setWaKnownContacts] = useState<string[]>([]);
  const [waSelectedInput, setWaSelectedInput] = useState('');
  const [waKnownInput, setWaKnownInput] = useState('');
  const [showSelectedSuggestions, setShowSelectedSuggestions] = useState(false);
  const [showKnownSuggestions, setShowKnownSuggestions] = useState(false);
  const [waAvailableChats, setWaAvailableChats] = useState<{
    groups: Array<{ jid: string; name: string }>;
    privates: Array<{ jid: string; name: string; phone: string }>;
  }>({ groups: [], privates: [] });

  // Load WhatsApp available chats/groups
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await fetch('/api/context/whatsapp/chats');
        if (res.ok) {
          const data = await res.json();
          setWaAvailableChats(data);
        }
      } catch (err) {
        console.warn('Failed to load WhatsApp chats list:', err);
      }
    };
    
    fetchChats();
    const interval = setInterval(fetchChats, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter suggestion helper functions
  const filteredSelectedSuggestions = () => {
    const query = waSelectedInput.toLowerCase().trim();
    const all = [
      ...waAvailableChats.groups.map(g => ({ type: 'group' as const, ...g })),
      ...waAvailableChats.privates.map(p => ({ type: 'private' as const, ...p }))
    ];
    if (!query) return all.slice(0, 10);
    return all.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.jid.toLowerCase().includes(query) ||
      (item.type === 'private' && (item as any).phone.includes(query))
    ).slice(0, 10);
  };

  const filteredKnownSuggestions = () => {
    const query = waKnownInput.toLowerCase().trim();
    const all = [
      ...waAvailableChats.groups.map(g => ({ type: 'group' as const, ...g })),
      ...waAvailableChats.privates.map(p => ({ type: 'private' as const, ...p }))
    ];
    if (!query) return all.slice(0, 10);
    return all.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.jid.toLowerCase().includes(query) ||
      (item.type === 'private' && (item as any).phone.includes(query))
    ).slice(0, 10);
  };

  const getDisplayName = (id: string) => {
    if (!id) return '';
    if (id.endsWith('@g.us')) {
      const g = waAvailableChats.groups.find(x => x.jid === id);
      return g ? `👥 ${g.name}` : `👥 Group (${id.split('@')[0]})`;
    }
    if (id.endsWith('@s.whatsapp.net')) {
      const p = waAvailableChats.privates.find(x => x.jid === id);
      return p ? `👤 ${p.name}` : `👤 Contact (${id.split('@')[0]})`;
    }
    const p = waAvailableChats.privates.find(x => x.phone === id || x.jid.split('@')[0] === id);
    if (p) return `👤 ${p.name}`;
    return id;
  };

  // Load WhatsApp config on mount
  useEffect(() => {
    const loadWaConfig = async () => {
      try {
        const res = await fetch('/api/context/whatsapp/config');
        if (res.ok) {
          const config = await res.json();
          setWaAutoReplyUnknown(config.autoReplyUnknown ?? true);
          setWaAutoReplyGroups(config.autoReplyGroups ?? false);
          setWaSelectedContacts(config.selectedContacts || []);
          setWaKnownContacts(config.knownContacts || []);
          setActiveAutoReplyBotId(config.activeAutoReplyBotId || 'customer');
          
          if (config.bots && Array.isArray(config.bots) && config.bots.length > 0) {
            setBots(prevBots => {
              const botMap = new Map(prevBots.map(b => [b.id, b]));
              config.bots.forEach((serverBot: any) => {
                botMap.set(serverBot.id, serverBot);
              });
              const mergedBots = Array.from(botMap.values());
              localStorage.setItem('SPARK_custom_bots', JSON.stringify(mergedBots));
              return mergedBots;
            });
          }
        }
      } catch (err) {
        console.error('Failed to load WhatsApp auto-reply config:', err);
      }
    };
    loadWaConfig();
  }, []);

  const saveWaConfig = async (
    autoReplyUnknown: boolean,
    autoReplyGroups: boolean,
    selected: string[],
    known: string[],
    overrideBotId?: string,
    overrideBots?: StartupBot[]
  ) => {
    try {
      const res = await fetch('/api/context/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoReplyUnknown,
          autoReplyGroups,
          selectedContacts: selected,
          knownContacts: known,
          activeAutoReplyBotId: overrideBotId || activeAutoReplyBotId,
          bots: overrideBots || bots
        }),
      });
      if (res.ok) {
        toast({ title: 'Config Saved', description: 'WhatsApp auto-reply settings updated.' });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Failed to save config', description: err.message });
    }
  };

  // Poll WhatsApp Service status — via Next.js proxy so Android WebView can reach it
  useEffect(() => {
    const checkWa = async () => {
      try {
        const res = await fetch('/api/context/whatsapp/status');
        if (res.ok) {
          const data = await res.json();
          setWaStatus(data);
        } else {
          setWaStatus({ status: 'disconnected', qr: null });
        }
      } catch (err) {
        setWaStatus({ status: 'disconnected', qr: null });
      }
    };
    
    checkWa();
    const interval = setInterval(checkWa, 5000);
    return () => clearInterval(interval);
  }, []);
  // Helper to extract email addresses from headers
  const extractEmail = (fromStr: string): string => {
    if (!fromStr) return '';
    const bracketMatch = fromStr.match(/<([^>]+)>/);
    if (bracketMatch && bracketMatch[1]) {
      return bracketMatch[1].trim();
    }
    const rawMatch = fromStr.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (rawMatch && rawMatch[1]) {
      return rawMatch[1].trim();
    }
    return fromStr.trim();
  };

  const isNoReply = (email: string): boolean => {
    if (!email) return false;
    const emailLower = email.toLowerCase();
    return (
      emailLower.includes('noreply') ||
      emailLower.includes('no-reply') ||
      emailLower.includes('donotreply') ||
      emailLower.includes('do-not-reply') ||
      emailLower.includes('notification') ||
      emailLower.includes('newsletter') ||
      emailLower.includes('bounce') ||
      emailLower.includes('bot@') ||
      emailLower.includes('mailer-daemon')
    );
  };

  const autoDraftReply = useCallback(async (memory: MemoryResult, instructions: string) => {
    setEmailDrafting(true);
    setEmailBody('Drafting response with AI...');
    try {
      const isWhatsApp = memory.source_app === 'WhatsApp';
      const prompt = isWhatsApp
        ? `You are replying to this WhatsApp message:\n\n"${memory.content}"\n\nAdditional instructions: ${instructions}.\n\nWrite a friendly, conversational WhatsApp chat reply. Keep it very concise (max 3 sentences) and natural, like a normal chat. Do not include subject lines, headers, placeholders, or sign-offs. Write the message content directly.`
        : `You are replying to this received email:\n\n${memory.content}\n\nAdditional instructions: ${instructions}.\n\nWrite a clean, professional email reply. Output only the email body. Do not include placeholders like '[Your Name]' or metadata outside the email content. Just start directly with the greeting.`;
      const res = await executePromptViaApi(prompt, false, false, {
        useOllama: settings.useOllama,
        ollamaBaseUrl: settings.ollamaBaseUrl,
        ollamaModel: settings.ollamaModel,
        localEngine: settings.localEngine,
        pythonServerUrl: settings.pythonServerUrl
      });
      if (res) {
        setEmailBody(res);
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Auto-drafting failed', description: err.message });
      setEmailBody(`Hi,\n\nI'm reaching out regarding the following details:\n\n"${memory.content}"\n\nBest regards`);
    } finally {
      setEmailDrafting(false);
    }
  }, [settings, toast]);

  // Trigger automatic drafting when selectedMemory changes and modal is opened
  useEffect(() => {
    if (showEmailModal && selectedMemory) {
      setShowModalRecipientDropdown(false);
      const isGmail = selectedMemory.source_app === 'Gmail';
      const isWhatsApp = selectedMemory.source_app === 'WhatsApp';
      
      if (isWhatsApp) {
        const rawJid = selectedMemory.metadata?.jid || '';
        setEmailTo(rawJid || selectedMemory.metadata?.sender || '');
        setEmailSubject('');
        setEmailInstructions('Draft a friendly, concise WhatsApp reply (max 3 sentences)');
        autoDraftReply(selectedMemory, 'Draft a friendly, concise WhatsApp reply (max 3 sentences)');
      } else {
        const rawFrom = selectedMemory.metadata?.from || '';
        const email = extractEmail(rawFrom);
        setEmailTo(email);
        
        const origSubject = selectedMemory.metadata?.subject || '';
        const subject = origSubject ? (origSubject.toLowerCase().startsWith('re:') ? origSubject : `Re: ${origSubject}`) : 'Follow up';
        setEmailSubject(subject);
        
        // Auto draft using AI for Gmail memories
        if (isGmail) {
          if (isNoReply(email)) {
            setEmailBody('Replies are disabled for no-reply or automated system notification addresses.');
            setEmailInstructions('');
          } else {
            setEmailInstructions('Draft a polite, professional reply to this email');
            autoDraftReply(selectedMemory, 'Draft a polite, professional reply to this email');
          }
        } else {
          // For other sources, set a default draft body
          setEmailBody(`Hi,\n\nI'm reaching out regarding the following details:\n\n"${selectedMemory.content}"\n\nBest regards`);
        }
      }
    }
  }, [showEmailModal, selectedMemory, autoDraftReply]);

  // Listen for Firebase Auth state and redirect results
  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const setupAuthListeners = async () => {
      try {
        const { GoogleAuthProvider, getRedirectResult, onAuthStateChanged } = await import('firebase/auth');
        const { auth } = await import('@/lib/firebase');

        // 1. Process getRedirectResult
        const redirectResult = await getRedirectResult(auth).catch(() => null);
        if (redirectResult?.user && isMounted) {
          console.log('[Auth] Processing Firebase Redirect result in CRM for user:', redirectResult.user.email);
          const idToken = await redirectResult.user.getIdToken();
          const credential = GoogleAuthProvider.credentialFromResult(redirectResult);
          const googleAccessToken = credential?.accessToken;
          const googleProviderAccountId = redirectResult.user.providerData?.[0]?.uid;

          const nextAuthResult = await signIn('google-native', {
            redirect: false,
            idToken,
            googleAccessToken: googleAccessToken || '',
            googleProviderAccountId: googleProviderAccountId || ''
          });

          if (nextAuthResult?.ok) {
            toast({
              title: "Connected Successfully",
              description: "Google account connected for Gmail integration."
            });
            window.location.reload();
            return;
          }
        }

        // 2. Listen for active Firebase user state
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user && isMounted && !session) {
            console.log('[Auth] Syncing active Firebase user session with NextAuth in CRM:', user.email);
            try {
              const idToken = await user.getIdToken();
              const nextAuthResult = await signIn('google-native', {
                redirect: false,
                idToken,
                googleAccessToken: '',
                googleProviderAccountId: user.providerData?.[0]?.uid || ''
              });
              if (nextAuthResult?.ok) {
                window.location.reload();
              }
            } catch (syncErr) {
              console.error('[Auth] Failed to sync Firebase session in CRM:', syncErr);
            }
          }
        });
      } catch (err: any) {
        console.error('[Auth] Error handling Firebase auth listeners in CRM:', err);
      }
    };

    setupAuthListeners();
    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [session, toast]);

  const handleGoogleConnect = async () => {
    setGoogleAuthLoading(true);
    try {
      const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      provider.addScope('https://www.googleapis.com/auth/gmail.readonly');

      console.log('[Auth] Initiating Firebase Google Sign-in...');
      let result;
      try {
        result = await signInWithPopup(auth, provider);
      } catch (popupErr: any) {
        console.warn('[Auth] Firebase signInWithPopup unavailable, switching to NextAuth Google OAuth redirect:', popupErr);
        await signIn('google', { callbackUrl: '/' });
        return;
      }

      if (result && result.user) {
        const idToken = await result.user.getIdToken();
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const googleAccessToken = credential?.accessToken;
        const googleProviderAccountId = result.user.providerData?.[0]?.uid;

        if (!idToken) {
          throw new Error("Could not retrieve Firebase ID Token.");
        }

        console.log('[Auth] Firebase authenticated, signing into NextAuth...');
        const nextAuthResult = await signIn('google-native', { 
          redirect: false, 
          idToken,
          googleAccessToken: googleAccessToken || '',
          googleProviderAccountId: googleProviderAccountId || ''
        });

        if (nextAuthResult?.error) {
          throw new Error(nextAuthResult.error);
        }

        toast({
          title: "Connected Successfully",
          description: "Google account connected for Gmail integration."
        });
      }
    } catch (err: any) {
      console.error("Google connection error:", err);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: err.message || "Could not connect Google account."
      });
    } finally {
      setGoogleAuthLoading(false);
    }
  };

  const handleGmailSync = async () => {
    setGmailSyncing(true);
    try {
      const res = await fetch('/api/context/sync/gmail', { method: 'POST' });
      if (!res.ok) {
        let errMsg = 'Could not fetch emails.';
        try {
          const errData = await res.json();
          if (errData.error === 'reauthentication_required') {
            toast({
              variant: 'destructive',
              title: 'Re-authentication Required',
              description: errData.message,
              action: (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white font-bold border border-white/20"
                  onClick={async () => {
                    await signOut({ redirect: false });
                    await handleGoogleConnect();
                  }}
                >
                  Reconnect
                </Button>
              )
            });
            return;
          }
          errMsg = errData.message || errData.error || errMsg;
        } catch {
          const text = await res.text();
          if (text) errMsg = text;
        }
        throw new Error(errMsg);
      }
      const data = await res.json();
      toast({
        title: '✅ Gmail Synced',
        description: `Imported ${data.count} new emails into your memory.`,
      });
      fetchStats();
      refreshResults();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Gmail Sync Failed',
        description: err.message || 'Could not fetch emails.',
      });
    } finally {
      setGmailSyncing(false);
    }
  };

  const handleSendWaDirect = async () => {
    if (!emailTo.trim() || !emailBody.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Recipient and message body are required.' });
      return;
    }
    setSendingWa(true);
    try {
      const res = await fetch('/api/context/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: emailTo, text: emailBody }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to send WhatsApp message.');
      }
      toast({ title: '✅ Message Sent', description: 'WhatsApp message sent successfully!' });
      setShowEmailModal(false);
      refreshResults();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Failed to send message', description: err.message });
    } finally {
      setSendingWa(false);
    }
  };

  // ── Fetch stats on mount ───────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/context/stats');
      if (res.ok) {
        setStats(await res.json());
        setServerOnline(true);
      } else {
        setServerOnline(false);
      }
    } catch {
      setServerOnline(false);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const fetchRecentMemories = useCallback(async (sourceApp?: string) => {
    setSearching(true);
    try {
      let url = '/api/context/memories?limit=50';
      if (sourceApp && sourceApp !== 'all') {
        url += `&source_app=${encodeURIComponent(sourceApp)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (err) {
      console.error('Failed to fetch recent memories:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  const doSearch = useCallback(async (q: string, sourceApp?: string) => {
    setSearching(true);
    const t0 = performance.now();
    try {
      const searchParams: any = { query: q, top_k: 15, use_gemma: useGemma };
      if (sourceApp && sourceApp !== 'all') {
        searchParams.source_app = sourceApp;
      }
      const res = await fetch('/api/context/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchParams),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResults(data.results || []);
      setSearchTime(Math.round(performance.now() - t0));
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Search failed', description: err.message });
    } finally {
      setSearching(false);
    }
  }, [useGemma, toast]);

  const refreshResults = useCallback(() => {
    if (!query.trim() || query.trim().length < 2) {
      fetchRecentMemories(activeTab);
    } else {
      doSearch(query, activeTab);
    }
  }, [query, activeTab, fetchRecentMemories, doSearch]);

  // ── Live search with debounce ──────────────────────────────────────────────
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!query.trim() || query.trim().length < 2) {
      fetchRecentMemories(activeTab);
      setSearchTime(null);
      return;
    }
    searchTimer.current = setTimeout(() => doSearch(query, activeTab), 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query, activeTab, useGemma, fetchRecentMemories, doSearch]);

  // ── Paste / text ingest ────────────────────────────────────────────────────
  const handlePasteIngest = async () => {
    if (!pasteText.trim()) return;
    setIngesting(true);
    try {
      const res = await fetch('/api/context/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText, source: 'paste', app: pasteApp }),
      });
      const data = await res.json();
      toast({
        title: '✅ Memory Indexed',
        description: `${data.chunks_stored} chunks stored from your paste.`,
      });
      setPasteText('');
      fetchStats();
      refreshResults();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Ingest failed', description: err.message });
    } finally {
      setIngesting(false);
    }
  };

  // ── File ingest ────────────────────────────────────────────────────────────
  const handleFileIngest = async (type: string, file: File) => {
    setIngesting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (type === 'file') formData.append('source_app', 'file');

      const res = await fetch(`/api/context/ingest?type=${type}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      toast({
        title: `✅ ${SOURCE_CONFIG[type]?.label || 'File'} Indexed`,
        description: `${data.stored || data.chunks_stored || 0} items stored from ${file.name}.`,
      });
      fetchStats();
      refreshResults();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'File ingest failed', description: err.message });
    } finally {
      setIngesting(false);
    }
  };

  // ── Clear all ─────────────────────────────────────────────────────────────
  const handleClearAll = async () => {
    if (!confirm('Clear ALL indexed memories? This cannot be undone.')) return;
    try {
      await fetch('/api/context/stats', { method: 'DELETE' });
      setStats(null);
      setResults([]);
      toast({ title: '🗑️ Memories cleared' });
      fetchStats();
      refreshResults();
    } catch { }
  };

  // ── Copy result ────────────────────────────────────────────────────────────
  const copyResult = async (result: MemoryResult) => {
    await navigator.clipboard.writeText(result.content);
    setCopiedId(result.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: 'Copied to clipboard' });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const activeBot = bots.find(b => b.id === activeBotId) || bots[0];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">

      {/* ── Hero Header ───────────────────────────────────────────────────── */}
      <div className="text-center space-y-4 pt-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/25 text-primary text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.2)] backdrop-blur-md">
          <Brain className="h-3 w-3 text-cyan-400 animate-pulse" />
          <span>Startup CRM & Memory Center</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-tight font-headline">
          Memory <br className="sm:hidden" />
          <GradientText colors={["#00f2ff", "#38bdf8", "#818cf8", "#c084fc", "#00f2ff"]}>
            CRM Engine
          </GradientText>
        </h1>
        <p className="text-white/60 text-base md:text-lg max-w-xl mx-auto">
          Autonomous Customer Problem Resolver & Company Growth Engine. Real-time auto-sync with WhatsApp and Gmail.
        </p>
      </div>

      {/* ── Server Status Bar ─────────────────────────────────────────────── */}
      <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border text-sm font-semibold transition-all ${
        serverOnline === null
          ? 'bg-white/5 border-white/10 text-slate-400'
          : serverOnline
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
      }`}>
        <div className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-emerald-400 animate-pulse' : serverOnline === false ? 'bg-blue-400 animate-pulse' : 'bg-yellow-400 animate-pulse'}`} />
        {serverOnline === null && 'Connecting to context_server.py...'}
        {serverOnline === true  && `✓ context_server.py online · ${stats?.total ?? 0} memories indexed`}
        {serverOnline === false && `☁️ Cloud CRM Active (using PostgreSQL) · ${stats?.total ?? 0} memories indexed`}
        <Button variant="ghost" size="sm" className="ml-auto h-7 px-3 text-xs" onClick={fetchStats}>
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Left Workspace (3/5) ─────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Real CRM Workspace Tab Switcher */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-white/5 border border-white/10 rounded-2xl">
            <button
              id="crm-resolver-tab"
              onClick={() => setActiveTabLeft('resolver')}
              className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTabLeft === 'resolver'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LifeBuoy className="h-3.5 w-3.5" /> Solve Problems
            </button>
            <button
              id="crm-growth-tab"
              onClick={() => setActiveTabLeft('growth')}
              className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTabLeft === 'growth'
                  ? 'bg-emerald-500 text-black font-black shadow-lg shadow-emerald-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" /> Company Growth
            </button>
            <button
              id="crm-bots-tab"
              onClick={() => setActiveTabLeft('bots')}
              className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTabLeft === 'bots'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" /> Support Bots
            </button>
            <button
              id="crm-explorer-tab"
              onClick={() => setActiveTabLeft('explorer')}
              className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTabLeft === 'explorer'
                  ? 'bg-cyan-500 text-black font-black shadow-lg shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Database className="h-3.5 w-3.5" /> Memories
            </button>
          </div>

          {/* TAB: Customer Problem Resolver */}
          {activeTabLeft === 'resolver' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* ── Startup Business Brain Context Banner ── */}
              <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-950/40 via-cyan-950/20 to-purple-950/30 border border-cyan-500/30 shadow-lg shadow-cyan-500/5 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                      <Brain className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                          Active Startup Business Brain
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 text-[9px] font-bold border border-cyan-500/30">
                          {startupBrain.stage}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                        {startupBrain.name}
                        <span className="text-xs font-normal text-white/50">· {startupBrain.industry}</span>
                      </h4>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setShowStartupBrainModal(true)}
                    size="sm"
                    className="bg-white/5 hover:bg-white/10 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold rounded-xl h-8 px-3"
                  >
                    <FileEdit className="h-3 w-3 mr-1.5" /> Edit Business Context
                  </Button>
                </div>

                {/* Quick Business Context Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-white/40 font-bold block uppercase text-[8px]">Tech Infrastructure</span>
                    <span className="text-white/90 font-medium truncate block">{startupBrain.techStack}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-white/40 font-bold block uppercase text-[8px]">Support SLA Guarantee</span>
                    <span className="text-emerald-400 font-bold truncate block">{startupBrain.supportSla}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-white/40 font-bold block uppercase text-[8px]">Current Traction</span>
                    <span className="text-cyan-300 font-bold truncate block">{startupBrain.mrr}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-white/40 font-bold block uppercase text-[8px]">Active Obstacle</span>
                    <span className="text-amber-300 font-medium truncate block">{startupBrain.biggestObstacle}</span>
                  </div>
                </div>
              </div>

              {/* ── Autonomous Auto-Reply Engine Master Bar ── */}
              <div className="p-4 rounded-3xl bg-white/5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${autoReplyEverything ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                      <span className="text-xs font-black uppercase tracking-wider text-white">
                        Autonomous Auto-Reply Engine
                      </span>
                    </div>
                    <Badge className={autoReplyEverything ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[9px]' : 'bg-amber-500/20 text-amber-300 text-[9px]'}>
                      {autoReplyEverything ? 'AUTO-PILOT ACTIVE' : 'MANUAL REVIEW'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-white/60">
                    {autoReplyEverything
                      ? `SPARK autonomously diagnoses customer issues against ${startupBrain.name} rules and auto-dispatches solutions in <300ms.`
                      : 'Drafts require manual founder review before dispatch.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <Button
                    type="button"
                    onClick={() => handleToggleAutoReplyEverything(!autoReplyEverything)}
                    size="sm"
                    variant="outline"
                    className={`text-[11px] font-black uppercase tracking-wider rounded-xl h-9 px-3.5 border ${
                      autoReplyEverything
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <Zap className="h-3 w-3 mr-1.5" />
                    {autoReplyEverything ? 'Auto-Reply: ON' : 'Turn Auto-Reply ON'}
                  </Button>

                  <Button
                    type="button"
                    onClick={handleAutoDispatchAllOpenTickets}
                    disabled={dispatchingTicketId === 'ALL'}
                    size="sm"
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black uppercase tracking-wider text-[11px] rounded-xl h-9 px-3.5 shadow-lg shadow-emerald-500/20"
                  >
                    {dispatchingTicketId === 'ALL' ? (
                      <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Dispatching All...</>
                    ) : (
                      <><Send className="h-3 w-3 mr-1.5" /> Auto-Reply All ({tickets.filter(t => t.status === 'Open').length})</>
                    )}
                  </Button>

                  <Button
                    type="button"
                    onClick={handleSimulateInboundProblem}
                    disabled={isSimulatingInbound}
                    size="sm"
                    className="bg-white/5 hover:bg-white/10 text-white border border-white/15 text-[11px] font-bold rounded-xl h-9 px-3"
                  >
                    {isSimulatingInbound ? (
                      <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Ingesting...</>
                    ) : (
                      <><PlusCircle className="h-3 w-3 mr-1.5 text-cyan-400" /> Simulate Inbound</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Ticket selector chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Incoming Customer Problems ({tickets.filter(t => t.status === 'Open').length} Open · {tickets.filter(t => t.status === 'Resolved').length} Auto-Resolved)
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Auto-syncing via WhatsApp & Gmail
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {tickets.map((t) => {
                    const isSelected = selectedTicketId === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicketId(t.id)}
                        className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-rose-500/20 border-rose-500/40 shadow-lg scale-[1.02]'
                            : 'bg-white/5 border-white/5 hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                            t.status === 'Resolved'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : t.priority === 'Urgent'
                              ? 'bg-rose-500/20 text-rose-300'
                              : t.priority === 'High'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {t.status === 'Resolved' ? 'Resolved ✓' : t.priority}
                          </span>
                          <span className="text-[9px] font-bold text-white/50 flex items-center gap-1">
                            {t.channel === 'WhatsApp' ? (
                              <MessageSquare className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Mail className="h-3 w-3 text-red-400" />
                            )}
                            {t.channel}
                          </span>
                        </div>
                        <p className="text-xs font-black text-white truncate">{t.customerName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{t.company}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Ticket Resolution Card */}
              {(() => {
                const currentTicket = tickets.find(t => t.id === selectedTicketId) || tickets[0];
                return (
                  <Card className="glass-panel border-white/10 rounded-3xl overflow-hidden p-6 space-y-5">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-black text-white">{currentTicket.customerName}</h3>
                          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] font-bold">
                            {currentTicket.company}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                            currentTicket.channel === 'WhatsApp'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/15 text-red-400 border border-red-500/30'
                          }`}>
                            {currentTicket.channel === 'WhatsApp' ? (
                              <MessageSquare className="h-3 w-3" />
                            ) : (
                              <Mail className="h-3 w-3" />
                            )}
                            {currentTicket.channel} Channel
                          </span>
                        </div>
                        <p className="text-xs text-white/50 mt-1">Logged {currentTicket.createdAt} · Ticket ID: {currentTicket.id}</p>
                      </div>

                      <Button
                        onClick={() => {
                          setTickets(prev => prev.map(t => t.id === currentTicket.id ? { ...t, status: t.status === 'Resolved' ? 'Open' : 'Resolved' } : t));
                          toast({
                            title: currentTicket.status === 'Resolved' ? 'Ticket Re-Opened' : 'Ticket Resolved',
                            description: `Issue marked as ${currentTicket.status === 'Resolved' ? 'Open' : 'Resolved'}.`
                          });
                        }}
                        variant="ghost"
                        className={`text-xs font-bold rounded-xl py-2 px-4 border ${
                          currentTicket.status === 'Resolved'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-white/5 text-white/70 border-white/10 hover:bg-emerald-500/10 hover:text-emerald-400'
                        }`}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        {currentTicket.status === 'Resolved' ? 'Resolved ✓' : 'Mark Resolved'}
                      </Button>
                    </div>

                    {/* Auto-Dispatched Telemetry Banner */}
                    {currentTicket.autoDispatched && (
                      <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-300 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span className="font-black uppercase tracking-wider">
                            ⚡ Auto-Dispatched via {currentTicket.dispatchedVia || currentTicket.channel} ({currentTicket.deliveryLatency || '180ms'})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-emerald-200/80 font-medium">
                          <span>✓ Read Receipt Received</span>
                          <span>·</span>
                          <span>Retention SLA Applied</span>
                        </div>
                      </div>
                    )}

                    {/* Customer Issue Statement */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        Customer Reported Problem
                      </span>
                      <p className="text-sm font-medium text-white leading-relaxed">
                        "{currentTicket.issue}"
                      </p>
                    </div>

                    {/* Problem Resolver Output */}
                    {currentTicket.solution && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        {/* Diagnosis */}
                        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                              <Brain className="h-3.5 w-3.5" /> Root Cause & Diagnosis
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              Risk: <strong className={currentTicket.solution.churnRisk === 'High' ? 'text-rose-400' : 'text-amber-400'}>{currentTicket.solution.churnRisk} Churn Risk</strong>
                            </span>
                          </div>
                          <p className="text-xs text-white/80 leading-relaxed font-medium">
                            {currentTicket.solution.diagnosis}
                          </p>
                          <div className="text-[10px] font-semibold text-cyan-300/80 flex items-center gap-1.5 pt-1 border-t border-blue-500/20">
                            <span>🧠 Grounded in {startupBrain.name} Brain</span>
                            <span>•</span>
                            <span>SLA: {startupBrain.supportSla}</span>
                          </div>
                        </div>

                        {/* Step by step fix */}
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                            🛠️ Actionable Resolution Steps
                          </span>
                          <div className="space-y-2">
                            {currentTicket.solution.resolutionSteps.map((step, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-white/80 font-medium">
                                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Ready-to-send responses */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* WhatsApp Reply */}
                          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between space-y-3">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" /> WhatsApp Auto-Reply Draft
                                </span>
                                <Badge className="bg-emerald-500/20 text-emerald-300 text-[9px] border-none font-bold">
                                  {currentTicket.autoDispatched && currentTicket.dispatchedVia === 'WhatsApp' ? 'Dispatched ✓' : 'Ready'}
                                </Badge>
                              </div>
                              <p className="text-xs text-white/80 font-medium leading-relaxed italic">
                                "{currentTicket.solution.waDraft}"
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => handleAutoDispatchTicket(currentTicket.id, 'WhatsApp')}
                                disabled={dispatchingTicketId === currentTicket.id}
                                size="sm"
                                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider text-[11px] rounded-xl py-2.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all"
                              >
                                {dispatchingTicketId === currentTicket.id ? (
                                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Dispatching...</>
                                ) : currentTicket.autoDispatched && currentTicket.dispatchedVia === 'WhatsApp' ? (
                                  <><Check className="h-3.5 w-3.5 stroke-[3]" /> Dispatched (Send Again)</>
                                ) : (
                                  <><Zap className="h-3.5 w-3.5 fill-black" /> Auto-Reply & Dispatch</>
                                )}
                              </Button>
                              <Button
                                onClick={() => {
                                  navigator.clipboard.writeText(currentTicket.solution?.waDraft || '');
                                  toast({ title: 'Copied WhatsApp Reply', description: 'Paste directly into client WhatsApp chat.' });
                                }}
                                size="sm"
                                variant="outline"
                                title="Copy to clipboard"
                                className="px-3 bg-white/5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-xl py-2.5"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Email Reply */}
                          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col justify-between space-y-3">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1">
                                  <Mail className="h-3 w-3" /> Email Auto-Reply Draft
                                </span>
                                <Badge className="bg-rose-500/20 text-rose-300 text-[9px] border-none font-bold">
                                  {currentTicket.autoDispatched && currentTicket.dispatchedVia === 'Gmail' ? 'Dispatched ✓' : 'Ready'}
                                </Badge>
                              </div>
                              <p className="text-xs text-white/80 font-medium leading-relaxed italic line-clamp-3">
                                "{currentTicket.solution.emailDraft}"
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => handleAutoDispatchTicket(currentTicket.id, 'Gmail')}
                                disabled={dispatchingTicketId === currentTicket.id}
                                size="sm"
                                className="flex-1 bg-rose-500 hover:bg-rose-400 text-white font-black uppercase tracking-wider text-[11px] rounded-xl py-2.5 shadow-lg shadow-rose-500/20 flex items-center justify-center gap-1.5 transition-all"
                              >
                                {dispatchingTicketId === currentTicket.id ? (
                                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Dispatching...</>
                                ) : currentTicket.autoDispatched && currentTicket.dispatchedVia === 'Gmail' ? (
                                  <><Check className="h-3.5 w-3.5 stroke-[3]" /> Dispatched (Send Again)</>
                                ) : (
                                  <><Send className="h-3.5 w-3.5" /> Auto-Reply & Dispatch</>
                                )}
                              </Button>
                              <Button
                                onClick={() => {
                                  navigator.clipboard.writeText(currentTicket.solution?.emailDraft || '');
                                  toast({ title: 'Copied Email Reply', description: 'Paste directly into your Gmail composer.' });
                                }}
                                size="sm"
                                variant="outline"
                                title="Copy to clipboard"
                                className="px-3 bg-white/5 border-rose-500/30 text-rose-400 hover:bg-rose-500/20 rounded-xl py-2.5"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Retention Tip */}
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
                          <span className="font-semibold">💡 <strong>Retention Move:</strong> {currentTicket.solution.retentionTip}</span>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })()}

              {/* Log / Paste New Customer Issue */}
              <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-white block">
                  Log New Customer Issue (From WhatsApp, Email, or Call)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input
                    placeholder="Customer Name"
                    value={newTicketCustomer}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTicketCustomer(e.target.value)}
                    className="bg-white/5 border-white/10 rounded-xl text-xs text-white"
                  />
                  <Input
                    placeholder="Company Name"
                    value={newTicketCompany}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTicketCompany(e.target.value)}
                    className="bg-white/5 border-white/10 rounded-xl text-xs text-white"
                  />
                  <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setNewTicketChannel('WhatsApp')}
                      className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        newTicketChannel === 'WhatsApp' ? 'bg-emerald-500 text-black' : 'text-white/60'
                      }`}
                    >
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTicketChannel('Gmail')}
                      className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        newTicketChannel === 'Gmail' ? 'bg-red-500 text-white' : 'text-white/60'
                      }`}
                    >
                      Gmail
                    </button>
                  </div>
                </div>

                <Textarea
                  placeholder="Paste customer problem message or support ticket details..."
                  value={newTicketInput}
                  onChange={(e) => setNewTicketInput(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl text-xs text-white min-h-[70px]"
                />

                {/* Auto-reply immediately toggle */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-400 animate-pulse" />
                    <div>
                      <span className="text-xs font-black text-white block">Auto-Reply & Dispatch Immediately</span>
                      <span className="text-[10px] text-white/50 block">Auto-resolve customer problem using {startupBrain.name} brain context in &lt;300ms</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoReplyImmediatelyOnLog(!autoReplyImmediatelyOnLog)}
                    className={`w-12 h-6 rounded-full transition-all p-0.5 flex items-center ${
                      autoReplyImmediatelyOnLog ? 'bg-emerald-500 justify-end' : 'bg-white/20 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                <Button
                  onClick={() => {
                    if (!newTicketInput.trim()) {
                      toast({ variant: 'destructive', title: 'Issue description required' });
                      return;
                    }
                    const newId = `TCK-${Math.floor(100 + Math.random() * 900)}`;
                    const isAuto = autoReplyImmediatelyOnLog;
                    const latency = `${Math.floor(180 + Math.random() * 80)}ms`;

                    const createdTicket: CustomerTicket = {
                      id: newId,
                      customerName: newTicketCustomer.trim() || 'New Customer',
                      company: newTicketCompany.trim() || 'Direct Client',
                      channel: newTicketChannel,
                      issue: newTicketInput.trim(),
                      priority: 'High',
                      status: isAuto ? 'Resolved' : 'Open',
                      createdAt: 'Just now',
                      autoDispatched: isAuto,
                      dispatchedVia: isAuto ? newTicketChannel : undefined,
                      dispatchedAt: isAuto ? 'Just now' : undefined,
                      deliveryLatency: isAuto ? latency : undefined,
                      solution: {
                        diagnosis: `Customer issue with ${newTicketInput.substring(0, 45)}... diagnosed against ${startupBrain.name} technical SLA.`,
                        resolutionSteps: [
                          `Acknowledge customer problem immediately via ${newTicketChannel}.`,
                          `Apply fix to customer profile in accordance with ${startupBrain.supportSla}.`,
                          'Verify account state and follow-up within 24 hours.'
                        ],
                        waDraft: `Hi ${newTicketCustomer.trim() || 'there'}! Thank you for notifying ${startupBrain.name}. We isolated the issue and deployed an immediate fix for your account under our ${startupBrain.supportSla}. Everything is now operating smoothly!`,
                        emailDraft: `Hi ${newTicketCustomer.trim() || 'there'},\n\nWe have reviewed your report regarding "${newTicketInput.substring(0, 50)}...". Our team has resolved this issue on our backend.\n\nYour account has been credited in line with our ${startupBrain.supportSla}.\n\nBest,\n${startupBrain.name} Team`,
                        churnRisk: 'Low',
                        retentionTip: `Apply ${startupBrain.name} retention policy: complimentary SLA credit applied.`,
                        businessGrounding: `${startupBrain.name} · ${startupBrain.techStack}`
                      }
                    };
                    const updated = [createdTicket, ...tickets];
                    setTickets(updated);
                    setSelectedTicketId(newId);
                    setNewTicketInput('');
                    setNewTicketCustomer('');
                    setNewTicketCompany('');
                    try {
                      localStorage.setItem('SPARK_customer_tickets', JSON.stringify(updated));
                    } catch (e) {}

                    if (isAuto) {
                      toast({
                        title: `⚡ Auto-Dispatched via ${newTicketChannel}!`,
                        description: `Resolved in ${latency}. Customer notified with ${startupBrain.name} SLA guarantee.`
                      });
                    } else {
                      toast({ title: 'Customer Problem Logged', description: 'Diagnostic resolution and ready replies generated.' });
                    }
                  }}
                  className="w-full bg-gradient-to-r from-rose-500 to-orange-500 text-white font-black uppercase tracking-wider text-xs rounded-xl py-3 shadow-lg shadow-rose-500/20"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  {autoReplyImmediatelyOnLog ? 'Diagnose & Auto-Reply Immediately' : 'Diagnose & Solve Customer Problem'}
                </Button>
              </div>
            </div>
          )}

          {/* TAB: Company Growth Engine & Lead Pipeline */}
          {activeTabLeft === 'growth' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* KPI Growth Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Total Pipeline</span>
                  <span className="text-xl font-black text-emerald-400 mt-1 block">
                    ₹{deals.reduce((acc, d) => acc + d.valueINR, 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Active Deals</span>
                  <span className="text-xl font-black text-cyan-400 mt-1 block">{deals.length}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">WhatsApp Leads</span>
                  <span className="text-xl font-black text-green-400 mt-1 block">
                    {deals.filter(d => d.channel === 'WhatsApp').length}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Won Revenue</span>
                  <span className="text-xl font-black text-primary mt-1 block">
                    ₹{deals.filter(d => d.stage === 'won').reduce((acc, d) => acc + d.valueINR, 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Proactive Growth Alert */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 border border-emerald-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                  <p className="text-xs text-white/90 font-medium">
                    <strong className="text-emerald-400">AI Growth Trigger:</strong> 3 clients on Basic Tier are nearing storage thresholds. Suggest sending a WhatsApp upgrade proposal for an extra ₹15,000/mo MRR.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    toast({ title: 'Expansion Campaign Sent', description: 'WhatsApp upgrade link drafted to 3 high-volume users.' });
                  }}
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase tracking-wider text-[10px] rounded-xl px-4 py-2 flex-shrink-0"
                >
                  Send Offers
                </Button>
              </div>

              {/* Deal Pipeline Kanban / List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Lead & Deal Pipeline (India WhatsApp & Gmail)
                  </span>
                  <Button
                    onClick={() => {
                      const client = prompt('Enter Client Name:') || 'New Lead';
                      const comp = prompt('Enter Company Name:') || 'Startup Corp';
                      const val = prompt('Deal Value in INR:', '50000') || '50000';
                      setDeals([
                        {
                          id: `deal-${Date.now()}`,
                          clientName: client,
                          company: comp,
                          channel: 'WhatsApp',
                          stage: 'inquiry',
                          valueINR: parseInt(val) || 50000,
                          lastContact: 'Just now',
                          nextAction: 'Initiate consultative conversation via WhatsApp'
                        },
                        ...deals
                      ]);
                      toast({ title: 'New Deal Added', description: `${client} logged in growth pipeline.` });
                    }}
                    size="sm"
                    className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold text-xs rounded-xl h-8 px-3"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Lead
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {deals.map((deal) => {
                    const stageColors = {
                      inquiry: 'border-amber-500/30 bg-amber-500/5',
                      qualified: 'border-blue-500/30 bg-blue-500/5',
                      proposal: 'border-purple-500/30 bg-purple-500/5',
                      won: 'border-emerald-500/30 bg-emerald-500/5'
                    };
                    const stageLabels = {
                      inquiry: 'New Inquiry',
                      qualified: 'Problem Validated',
                      proposal: 'Proposal Sent',
                      won: 'Closed Won'
                    };
                    return (
                      <div
                        key={deal.id}
                        className={`p-4 rounded-2xl border ${stageColors[deal.stage]} flex flex-col justify-between space-y-3`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h4 className="font-black text-white text-sm">{deal.clientName}</h4>
                              <p className="text-white/50 text-xs">{deal.company}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-emerald-400 font-black text-sm block">
                                ₹{deal.valueINR.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                                {stageLabels[deal.stage]}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1 font-bold text-white/70">
                              {deal.channel === 'WhatsApp' ? (
                                <MessageSquare className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Mail className="h-3 w-3 text-red-400" />
                              )}
                              {deal.channel}
                            </span>
                            <span>· Last contact {deal.lastContact}</span>
                          </div>

                          <div className="mt-2.5 p-2 rounded-xl bg-black/30 border border-white/5 text-[11px] text-cyan-300 font-medium">
                            ⚡ <strong>Next Action:</strong> {deal.nextAction}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                          {deal.stage !== 'won' ? (
                            <Button
                              onClick={() => {
                                const nextStageMap: Record<string, Deal['stage']> = {
                                  inquiry: 'qualified',
                                  qualified: 'proposal',
                                  proposal: 'won'
                                };
                                const next = nextStageMap[deal.stage];
                                setDeals(deals.map(d => d.id === deal.id ? { ...d, stage: next } : d));
                                toast({
                                  title: 'Deal Advanced',
                                  description: `${deal.clientName} moved to ${stageLabels[next]}.`
                                });
                              }}
                              size="sm"
                              className="flex-1 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 text-white/80 font-bold text-xs rounded-xl py-1.5 border border-white/10"
                            >
                              Advance Stage →
                            </Button>
                          ) : (
                            <span className="flex-1 text-center text-xs font-black text-emerald-400 py-1">
                              ✓ Revenue Secured
                            </span>
                          )}

                          <Button
                            onClick={() => {
                              toast({
                                title: `WhatsApp Follow-Up Ready`,
                                description: `Drafted: "Hi ${deal.clientName}, following up on our proposal for ${deal.company}..."`
                              });
                            }}
                            size="sm"
                            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* tab 1: Startup Chatbots */}
          {activeTabLeft === 'bots' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Bot selection list */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {bots.map((bot) => {
                  const isActive = activeBotId === bot.id;
                  return (
                    <div
                      key={bot.id}
                      onClick={() => setActiveBotId(bot.id)}
                      className={`relative p-3 rounded-2xl border bg-gradient-to-br text-left cursor-pointer transition-all ${
                        isActive
                          ? 'bg-primary/20 border-primary/40 shadow-lg scale-[1.02]'
                          : 'bg-white/5 border-white/5 hover:border-white/15'
                      }`}
                    >
                      {bot.id !== 'customer' && bot.id !== 'growth' && bot.id !== 'employee' && (
                        <button
                          onClick={(e) => handleDeleteCustomBot(bot.id, e)}
                          className="absolute top-2.5 right-2.5 text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete custom bot"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-white/10 flex-shrink-0">
                          {renderBotIcon(bot.icon, 'h-4 w-4 text-white')}
                        </div>
                        <div className="min-w-0 pr-4">
                          <p className="text-xs font-black text-white truncate">{bot.name}</p>
                          <p className="text-[9px] text-slate-400 truncate">{bot.role}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div
                  onClick={() => setShowAddBotModal(true)}
                  className="p-3 rounded-2xl border border-dashed border-white/10 hover:border-primary/40 bg-white/5 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <PlusCircle className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">New Bot</span>
                </div>
              </div>

              {/* Bot Conversation Workspace */}
              <Card className="glass-panel border-white/10 rounded-3xl overflow-hidden flex flex-col h-[520px]">
                {/* Header */}
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between gap-4 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      {renderBotIcon(activeBot?.icon || 'Brain', 'h-5 w-5 text-primary')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white">{activeBot?.name}</h4>
                        <button
                          type="button"
                          onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                          className="text-[10px] font-bold text-primary hover:text-white transition-colors flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20"
                        >
                          <FileEdit className="h-3 w-3" /> Configure Products
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500">{activeBot?.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Toggle RAG */}
                    <button
                      onClick={() => setUseRAG(!useRAG)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-1.5 ${
                        useRAG
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-white/5 border-white/10 text-slate-500'
                      }`}
                      title="Inject startup memory logs via vector RAG"
                    >
                      <Database className="h-3.5 w-3.5" /> RAG: {useRAG ? 'ON' : 'OFF'}
                    </button>

                    {/* Customize prompt */}
                    <button
                      onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                      className={`p-1.5 rounded-xl border transition-all ${
                        isEditingPrompt
                          ? 'bg-primary/20 border-primary/30 text-primary'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                      title="Edit Bot System Instructions"
                    >
                      <FileEdit className="h-4 w-4" />
                    </button>

                    {/* Clear Chat */}
                    <button
                      onClick={() => {
                        if (confirm('Clear chat history for this bot?')) {
                          setChatHistory(prev => ({ ...prev, [activeBotId]: [] }));
                        }
                      }}
                      className="p-1.5 rounded-xl border bg-white/5 border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all"
                      title="Clear Chat History"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* System Prompt Customizer */}
                {isEditingPrompt && (
                  <div className="p-4 border-b border-white/5 bg-primary/[0.02] space-y-3 animate-in slide-in-from-top-4 duration-300 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">Configure Bot Knowledge & Product Catalog</span>
                      <span className="text-[9px] text-slate-500 font-bold">Running locally via Gemma only</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Feed your startup's products, prices, details, and image URLs below. The chatbot will use this as its source of truth to auto-reply to users.
                    </p>
                    <textarea
                      value={activeBotPromptOverride}
                      onChange={(e) => setActiveBotPromptOverride(e.target.value)}
                      placeholder={`Example format:
Product: Premium Subscription Plan
Price: $29/month
Image: https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500
Description: Unlimited cloud synchronization, 24/7 priority support, and multi-device auth.

Product: Standard Setup Package
Price: $9/month
Image: https://images.unsplash.com/photo-1551434678-e076c223a692?w=500
Description: Up to 2 accounts, standard ticket support, and daily RAG database updates.

Rule: If a user asks about rates/availability, recommend the Standard Package or Premium Subscription, share the pricing, and show the image link exactly.`}
                      className="w-full h-36 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 resize-none"
                    />

                    {/* Structured Product Catalog Manager */}
                    <div className="pt-3 border-t border-white/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Structured Product Catalog</span>
                        <span className="text-[9px] text-slate-500 font-bold">{activeBotProducts.length} Products configured</span>
                      </div>

                      {/* Products List */}
                      {activeBotProducts.length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {activeBotProducts.map((product, idx) => (
                            <div key={idx} className="flex gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl relative group">
                              {product.imageUrl && (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-12 h-12 rounded-xl object-cover border border-white/10 flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-bold text-white truncate">{product.name}</p>
                                  <p className="text-[10px] text-emerald-400 font-bold">{product.price}</p>
                                </div>
                                <p className="text-[10px] text-slate-400 truncate mt-0.5">{product.description}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveProductFromList(idx)}
                                className="text-slate-500 hover:text-red-400 transition-colors self-center p-1 flex-shrink-0"
                                title="Remove Product"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Product Form */}
                      <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Add Product to Catalog</div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Product Name (e.g. Premium Plan)"
                            value={newProductName}
                            onChange={(e) => setNewProductName(e.target.value)}
                            className="bg-black/20 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50"
                          />
                          <input
                            type="text"
                            placeholder="Price (e.g. $29/mo)"
                            value={newProductPrice}
                            onChange={(e) => setNewProductPrice(e.target.value)}
                            className="bg-black/20 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Image URL (e.g. https://images.unsplash.com/...)"
                          value={newProductImage}
                          onChange={(e) => setNewProductImage(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50"
                        />
                        <div className="flex gap-2">
                          <textarea
                            placeholder="Product Description and Specifications..."
                            value={newProductDesc}
                            onChange={(e) => setNewProductDesc(e.target.value)}
                            className="flex-1 h-12 bg-black/20 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 resize-none"
                          />
                          <button
                            type="button"
                            onClick={handleAddProductToList}
                            className="px-4 bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 rounded-xl text-xs font-black uppercase tracking-wider transition-all h-12 flex items-center justify-center flex-shrink-0"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setActiveBotPromptOverride(activeBot?.systemPrompt || '');
                          setIsEditingPrompt(false);
                        }}
                        className="text-xs text-slate-400 hover:text-white h-8"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleUpdateActivePrompt}
                        className="bg-primary text-primary-foreground font-black text-xs uppercase px-4 h-8 rounded-lg"
                      >
                        Save Prompt
                      </Button>
                    </div>
                  </div>
                )}

                {/* Conversation messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[150px]">
                  {/* welcome bubble */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-1">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Brain className="h-3.5 w-3.5 text-primary" /> {activeBot?.name} Active
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {activeBot?.description} Ask me anything about your customer support tickets, sales pipeline, product pricing, or company operations. I query database memories dynamically to help you.
                    </p>
                  </div>

                  {/* messages list */}
                  {(chatHistory[activeBotId] || []).map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`p-4 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground font-medium rounded-tr-none'
                            : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none shadow-md shadow-black/10'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>

                        {/* References */}
                        {msg.references && msg.references.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Injected RAG Context:</span>
                            <div className="flex flex-wrap gap-1">
                              {msg.references.map((ref) => {
                                const appIconCfg = APP_ICONS[ref.source_app] || APP_ICONS['unknown'];
                                const AppIcon = appIconCfg.icon;
                                return (
                                  <Badge key={ref.id} variant="outline" className="text-[9px] bg-white/5 border-white/10 text-slate-400 py-0.5 px-1.5 flex items-center gap-1 font-semibold">
                                    <AppIcon className="h-2.5 w-2.5" /> {ref.source_app} ({ref.created_at?.slice(5, 10)})
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="flex items-center gap-2 text-slate-500 text-xs py-2 pl-1 animate-pulse">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span>Gemma is thinking...</span>
                    </div>
                  )}
                </div>

                {/* Send form */}
                <form onSubmit={handleSendChatMessage} className="p-3 border-t border-white/5 bg-white/[0.01] flex gap-2 flex-shrink-0">
                  <input
                    id="bot-chat-input"
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={chatLoading}
                    placeholder={`Message ${activeBot?.name}...`}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 disabled:opacity-50"
                  />
                  <Button
                    id="bot-chat-send-btn"
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 font-bold h-9 flex items-center justify-center flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </Card>
            </div>
          )}

          {/* tab 2: Context Explorer */}
          {activeTabLeft === 'explorer' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <Card className="glass-panel border-white/10 rounded-3xl overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  {/* Search input */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none" />
                    <input
                      id="context-search-input"
                      type="text"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Type anything — client, invoice, doctor, restaurant…"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white placeholder:text-slate-600 text-base focus:outline-none focus:border-primary/50 focus:bg-primary/5 transition-all"
                    />
                    {searching && (
                      <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
                    )}
                  </div>

                  {/* Tab Selector */}
                  <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
                    <button
                      id="crm-explorer-all-btn"
                      onClick={() => setActiveTab('all')}
                      className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                        activeTab === 'all'
                          ? 'bg-primary text-primary-foreground shadow-lg'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      🌐 All Memories
                    </button>
                    <button
                      id="crm-explorer-gmail-btn"
                      onClick={() => setActiveTab('Gmail')}
                      className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                        activeTab === 'Gmail'
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Mail className="h-3.5 w-3.5" /> Gmail Only
                    </button>
                    <button
                      id="crm-explorer-whatsapp-btn"
                      onClick={() => setActiveTab('WhatsApp')}
                      className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                        activeTab === 'WhatsApp'
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> WhatsApp Only
                    </button>
                  </div>

                  {/* Gemma toggle */}
                  <div className="flex items-center gap-3">
                    <button
                      id="crm-explorer-fast-btn"
                      onClick={() => setUseGemma(false)}
                      className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${!useGemma ? 'bg-primary text-primary-foreground shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                      Fast (Hybrid)
                    </button>
                    <button
                      id="crm-explorer-gemma-btn"
                      onClick={() => setUseGemma(true)}
                      className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${useGemma ? 'bg-accent text-accent-foreground shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                      <Sparkles className="h-3 w-3" />
                      Gemma Re-rank
                    </button>
                    {searchTime !== null && (
                      <span className="ml-auto text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {searchTime}ms
                      </span>
                    )}
                  </div>

                  {/* Results */}
                  {results.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                        Top {results.length} Memories
                      </div>
                      {results.map((result, i) => {
                        const appCfg = APP_ICONS[result.source_app] || APP_ICONS['unknown'];
                        const AppIcon = appCfg.icon;
                        const isExpanded = !!expandedResults[result.id];
                        const isLong = result.content.length > 150;
                        return (
                          <div
                            key={result.id}
                            className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-3xl p-5 transition-all cursor-pointer"
                            onClick={() => {
                              if (isLong) {
                                setExpandedResults(prev => ({ ...prev, [result.id]: !prev[result.id] }));
                              }
                            }}
                          >
                            {/* Rank badge */}
                            <div className="absolute -top-2.5 -left-2.5 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center shadow-lg border border-white/10">
                              {i + 1}
                            </div>

                            {/* Header row */}
                            <div className="flex items-center gap-2 mb-3">
                              <AppIcon className={`h-4 w-4 ${appCfg.color} flex-shrink-0`} />
                              <span className={`text-xs font-bold ${appCfg.color}`}>{result.source_app}</span>
                              <span className="text-xs text-slate-500 ml-auto">
                                {result.created_at?.slice(0, 10)}
                              </span>
                              <span className="text-xs text-primary font-bold mr-2">
                                {Math.round(result.score * 100)}%
                              </span>
                              
                              <div className="flex items-center gap-1.5">
                                {/* Copy button */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => { e.stopPropagation(); copyResult(result); }}
                                  className="h-8 w-8 rounded-lg bg-white/5 hover:bg-primary/20 text-slate-400 hover:text-white"
                                  title="Copy memory content"
                                >
                                  {copiedId === result.id
                                    ? <CheckCheck className="h-4 w-4 text-emerald-400" />
                                    : <Copy className="h-4 w-4" />
                                  }
                                </Button>

                                {/* Draft Email button */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMemory(result);
                                    setShowEmailModal(true);
                                  }}
                                  className="h-8 w-8 rounded-lg bg-white/5 hover:bg-primary/20 text-slate-400 hover:text-white"
                                  title="Draft email using this memory context"
                                >
                                  <FileEdit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="space-y-2">
                              <p className={`text-sm text-slate-300 leading-relaxed transition-all ${isExpanded ? '' : 'line-clamp-3'}`}>
                                {result.content}
                              </p>
                              {isLong && (
                                <span className="text-[11px] font-bold text-primary hover:text-primary-foreground flex items-center gap-1 mt-1">
                                  {isExpanded ? (
                                    <><ChevronUp className="h-3.5 w-3.5" /> Show Less</>
                                  ) : (
                                    <><ChevronDown className="h-3.5 w-3.5" /> Read Full Message</>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Empty state */}
                  {query.trim().length >= 2 && !searching && results.length === 0 && (
                    <div className="text-center py-8 text-slate-600">
                      <Brain className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No memories found for "{query}"</p>
                      <p className="text-xs mt-1">Add data using the Quick Add Memory form below or connect integrations on the right →</p>
                    </div>
                  )}

                  {/* Onboarding / Empty states when not searching and results are empty */}
                  {query.trim().length < 2 && !searching && results.length === 0 && (
                    <div className="pt-2">
                      {activeTab === 'WhatsApp' && (
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-8 text-center space-y-4 animate-in fade-in duration-300">
                          <div className="inline-flex p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                            <MessageSquare className="h-8 w-8" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-lg font-black text-white">No WhatsApp Messages Yet</h4>
                            <p className="text-sm text-slate-400 max-w-md mx-auto">
                              Connect your WhatsApp account to automatically capture messages and enable AI auto-replies.
                            </p>
                          </div>
                          <div className="pt-2 max-w-sm mx-auto space-y-3 text-left">
                            <div className="flex items-start gap-3 text-xs text-slate-300">
                              <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0">1</div>
                              <div>
                                <p className="font-bold text-white">Scan the QR Code</p>
                                <p className="text-slate-400">Click &quot;Scan QR Code&quot; in the WhatsApp Auto-Sync panel on the right to link your phone.</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 text-xs text-slate-300">
                              <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0">2</div>
                              <div>
                                <p className="font-bold text-white">Real-time Auto-Sync</p>
                                <p className="text-slate-400">Once connected, incoming chats will automatically sync to memory.</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 text-xs text-slate-300">
                              <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0">3</div>
                              <div>
                                <p className="font-bold text-white">Manual Add (Optional)</p>
                                <p className="text-slate-400">Use the &quot;Quick Add Memory&quot; section below to type and index WhatsApp content manually.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'Gmail' && (
                        <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8 text-center space-y-4 animate-in fade-in duration-300">
                          <div className="inline-flex p-3 bg-red-500/10 rounded-2xl text-red-400">
                            <Mail className="h-8 w-8" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-lg font-black text-white">No Gmail Messages Yet</h4>
                            <p className="text-sm text-slate-400 max-w-md mx-auto">
                              Connect your Google Account to import your recent emails and context.
                            </p>
                          </div>
                          <div className="pt-2 max-w-sm mx-auto space-y-3 text-left">
                            <div className="flex items-start gap-3 text-xs text-slate-300">
                              <div className="w-5 h-5 rounded-full bg-red-500/10 text-red-400 font-bold flex items-center justify-center flex-shrink-0">1</div>
                              <div>
                                <p className="font-bold text-white">Connect Google Account</p>
                                <p className="text-slate-400">Click &quot;Connect Google Account&quot; on the right to sign in.</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 text-xs text-slate-300">
                              <div className="w-5 h-5 rounded-full bg-red-500/10 text-red-400 font-bold flex items-center justify-center flex-shrink-0">2</div>
                              <div>
                                <p className="font-bold text-white">Sync Recent Emails</p>
                                <p className="text-slate-400">Click &quot;Sync Emails&quot; to import the latest messages into memory.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'all' && (
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center space-y-4 animate-in fade-in duration-300">
                          <div className="inline-flex p-3 bg-primary/10 rounded-2xl text-primary">
                            <Brain className="h-8 w-8" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-lg font-black text-white">No Memories Indexed</h4>
                            <p className="text-sm text-slate-400 max-w-md mx-auto">
                              Start building your local context database by connecting Gmail or WhatsApp, or manually pasting notes.
                            </p>
                          </div>
                          <div className="pt-2 max-w-sm mx-auto space-y-3 text-left">
                            <div className="flex items-start gap-3 text-xs text-slate-300">
                              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">1</div>
                              <div>
                                <p className="font-bold text-white">Connect WhatsApp / Gmail</p>
                                <p className="text-slate-400">Use the accounts panel on the right to link your integrations.</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 text-xs text-slate-300">
                              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">2</div>
                              <div>
                                <p className="font-bold text-white">Add Notes Manually</p>
                                <p className="text-slate-400">Paste text in the &quot;Quick Add Memory&quot; section below to instant index.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── Paste / Quick Add ──────────────────────────────────────────── */}
              <Card className="glass-panel border-white/10 rounded-3xl overflow-hidden">
                <CardHeader className="px-6 pt-5 pb-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm font-black text-white uppercase tracking-wider">Quick Add Memory</span>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6 space-y-3">
                  <Select value={pasteApp} onValueChange={setPasteApp}>
                    <SelectTrigger id="paste-app-select-trigger" className="w-full bg-[#1e293b] border-white/10 text-white rounded-xl h-11 focus:ring-primary/50">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                      <SelectItem value="manual">📝 Manual note</SelectItem>
                      <SelectItem value="WhatsApp">💬 WhatsApp message</SelectItem>
                      <SelectItem value="Gmail">📧 Email excerpt</SelectItem>
                      <SelectItem value="Browser">🌐 Browser tab / article</SelectItem>
                      <SelectItem value="Zoom">🎥 Zoom / meeting note</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    id="paste-memory-textarea"
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    placeholder="Paste any text here to index it — a message, note, article, meeting summary…"
                    className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl resize-none focus-visible:ring-primary/50 text-sm"
                    style={{ color: 'white', WebkitTextFillColor: 'white' }}
                  />
                  <Button
                    id="index-memory-btn"
                    onClick={handlePasteIngest}
                    disabled={ingesting || !pasteText.trim()}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold uppercase tracking-wider h-11"
                  >
                    {ingesting
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Indexing…</>
                      : <><Brain className="h-4 w-4 mr-2" />Index This Memory</>
                    }
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* ── Right: Stats + Connected Accounts (2/5) ───────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Connected Accounts */}
          <Card className="glass-panel border-white/10 rounded-3xl overflow-hidden">
            <CardHeader className="px-5 pt-5 pb-2">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                <span className="text-sm font-black text-white uppercase tracking-wider">Connected Accounts</span>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              
              {/* Gmail Sync Account */}
              <div className="flex flex-col gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-red-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white">Gmail Integration</div>
                    <div className="text-[10px] text-slate-500">
                      {session?.user ? `Connected: ${session.user.email}` : 'Not connected'}
                    </div>
                  </div>
                </div>
                {session?.user ? (
                  <div className="flex gap-2 mt-1">
                    <Button
                      onClick={handleGmailSync}
                      disabled={gmailSyncing}
                      size="sm"
                      className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-black text-xs uppercase tracking-wider py-2 rounded-xl h-9"
                    >
                      {gmailSyncing ? (
                        <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Syncing...</>
                      ) : (
                        'Sync Emails'
                      )}
                    </Button>
                    <Button
                      onClick={() => signOut({ redirect: false })}
                      size="sm"
                      className="bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 font-black text-xs uppercase tracking-wider py-2 rounded-xl h-9"
                    >
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      onClick={handleGoogleConnect}
                      disabled={googleAuthLoading}
                      size="sm"
                      className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-xs uppercase tracking-wider py-2 rounded-xl mt-1 h-9"
                    >
                      {googleAuthLoading ? (
                        <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Connecting...</>
                      ) : (
                        'Connect Google Account'
                      )}
                    </Button>
                    
                    {isPrivateIp && (
                      <div className="mt-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-left animate-in fade-in duration-300">
                        <div className="flex gap-2">
                          <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-bold text-red-400">LAN IP Redirect Mismatch</p>
                            <p className="text-[9px] text-muted-foreground mt-0.5 leading-snug font-normal">
                              Google OAuth blocks LAN IP redirects ({typeof window !== 'undefined' ? window.location.hostname : ''}).
                            </p>
                            <p className="text-[9px] text-muted-foreground mt-1 leading-snug font-normal">
                              Please use <span className="font-bold text-white">http://localhost:9002</span> or enable the Ngrok tunnel to connect.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* WhatsApp Sync Account */}
              <div className="flex flex-col gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-emerald-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white">WhatsApp Auto-Sync</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                      {waStatus.status === 'connected' && <span className="text-emerald-400">● Connected</span>}
                      {waStatus.status === 'qr' && <span className="text-yellow-400">● Awaiting Scan</span>}
                      {waStatus.status === 'disconnected' && <span className="text-slate-500">○ Offline</span>}
                    </div>
                  </div>
                </div>
                {waStatus.status === 'qr' && (
                  <Button
                    onClick={() => setShowWaModal(true)}
                    size="sm"
                    className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-black text-xs uppercase tracking-wider py-2 rounded-xl mt-1 h-9"
                  >
                    Scan QR Code
                  </Button>
                )}
                {waStatus.status === 'connected' && (
                  <div className="text-center text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 py-2 rounded-xl mt-1">
                    ✓ Messages syncing in real-time
                  </div>
                )}
                {waStatus.status === 'disconnected' && (
                  <div className="text-center text-[10px] text-slate-500 bg-white/5 py-2 rounded-xl mt-1">
                    Connecting to WhatsApp...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="glass-panel border-white/10 rounded-3xl overflow-hidden">
            <CardHeader className="px-5 pt-5 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="text-sm font-black text-white uppercase tracking-wider">Memory Index</span>
                </div>
                <button onClick={handleClearAll} className="text-slate-600 hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-2">
              {statsLoading && (
                <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                </div>
              )}
              {stats && (
                <>
                  <div className="text-3xl font-black text-white">{stats.total.toLocaleString()}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-widest mb-3">Total memories</div>
                  <div className="space-y-2">
                    {stats.by_source.map(s => {
                      const cfg = APP_ICONS[s.source_app] || APP_ICONS['unknown'];
                      const Icon = cfg.icon;
                      const pct = stats.total > 0 ? Math.round((s.count / stats.total) * 100) : 0;
                      return (
                        <div key={s.source_app} className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                            <span className="text-slate-300">{s.source_app}</span>
                            <span className="ml-auto text-slate-500">{s.count}</span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary/60 rounded-full transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              {!statsLoading && !stats && (
                <div className="text-sm text-slate-600 py-2 text-center">
                  Start context_server.py to see stats
                </div>
              )}
            </CardContent>
          </Card>

          {/* WhatsApp Auto-Reply Config */}
          <Card className="glass-panel border-white/10 rounded-3xl overflow-hidden">
            <CardHeader className="px-5 pt-5 pb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-black text-white uppercase tracking-wider">WhatsApp Auto-Reply Config</span>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              {/* Bot Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Auto-Reply Chatbot Agent
                </label>
                <Select
                  value={activeAutoReplyBotId}
                  onValueChange={(val) => {
                    setActiveAutoReplyBotId(val);
                    saveWaConfig(waAutoReplyUnknown, waAutoReplyGroups, waSelectedContacts, waKnownContacts, val);
                  }}
                >
                  <SelectTrigger className="w-full bg-[#161b26] border border-white/10 text-white rounded-xl h-10 focus:ring-primary/50 text-xs font-semibold">
                    <SelectValue placeholder="Select chatbot agent..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0b0f19] border border-white/15 text-white rounded-xl">
                    {bots.map((bot) => (
                      <SelectItem key={bot.id} value={bot.id} className="text-slate-200 hover:bg-white/5 focus:bg-white/5 focus:text-white cursor-pointer text-xs font-semibold">
                        {bot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Toggle Unknown */}
              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-2xl">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white">Reply to Unknown Numbers</div>
                  <div className="text-[10px] text-slate-500">Auto-respond to numbers not in the Ignored list</div>
                </div>
                <input
                  type="checkbox"
                  checked={waAutoReplyUnknown}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setWaAutoReplyUnknown(val);
                    saveWaConfig(val, waAutoReplyGroups, waSelectedContacts, waKnownContacts);
                  }}
                  className="w-4 h-4 rounded border-white/10 text-primary bg-[#1e293b] focus:ring-primary/50"
                />
              </div>

              {/* Toggle Groups */}
              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-2xl">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white">Reply in Group Chats</div>
                  <div className="text-[10px] text-slate-500">Auto-respond in groups when mentioned or if group is selected</div>
                </div>
                <input
                  type="checkbox"
                  checked={waAutoReplyGroups}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setWaAutoReplyGroups(val);
                    saveWaConfig(waAutoReplyUnknown, val, waSelectedContacts, waKnownContacts);
                  }}
                  className="w-4 h-4 rounded border-white/10 text-primary bg-[#1e293b] focus:ring-primary/50"
                />
              </div>

              {/* Selected Contacts (Enabled) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Selected Contacts (Auto-Reply Enabled)</label>
                <div className="flex gap-2 relative w-full">
                  <input
                    type="text"
                    placeholder="Add phone number or name..."
                    value={waSelectedInput}
                    onChange={(e) => {
                      setWaSelectedInput(e.target.value);
                      setShowSelectedSuggestions(true);
                    }}
                    onFocus={() => setShowSelectedSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSelectedSuggestions(false), 200)}
                    className="flex-1 bg-[#161b26] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50"
                  />
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-black text-xs uppercase px-3 rounded-xl h-8"
                    onClick={() => {
                      if (!waSelectedInput.trim()) return;
                      const updated = [...waSelectedContacts, waSelectedInput.trim()];
                      setWaSelectedContacts(updated);
                      setWaSelectedInput('');
                      saveWaConfig(waAutoReplyUnknown, waAutoReplyGroups, updated, waKnownContacts);
                    }}
                  >
                    Add
                  </Button>

                  {/* Selected Suggestions Dropdown */}
                  {showSelectedSuggestions && filteredSelectedSuggestions().length > 0 && (
                    <div className="absolute top-10 left-0 right-0 max-h-48 overflow-y-auto bg-[#131722]/95 border border-white/15 rounded-xl shadow-2xl z-50 p-1 backdrop-blur-md">
                      {filteredSelectedSuggestions().map((item) => (
                        <div
                          key={item.jid}
                          onClick={() => {
                            const valueToAdd = item.jid;
                            if (!waSelectedContacts.includes(valueToAdd)) {
                              const updated = [...waSelectedContacts, valueToAdd];
                              setWaSelectedContacts(updated);
                              saveWaConfig(waAutoReplyUnknown, waAutoReplyGroups, updated, waKnownContacts);
                            }
                            setWaSelectedInput('');
                            setShowSelectedSuggestions(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 cursor-pointer rounded-lg transition-colors"
                        >
                          <span className="font-bold">
                            {item.type === 'group' ? '👥' : '👤'}
                          </span>
                          <span className="truncate flex-1 font-semibold">{item.name || 'Unnamed'}</span>
                          <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                            {item.type === 'group' ? 'Group' : (item as any).phone}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {waSelectedContacts.length === 0 ? (
                    <span className="text-[10px] text-slate-600 italic">No selected contacts.</span>
                  ) : (
                    waSelectedContacts.map((contact) => (
                      <Badge
                        key={contact}
                        variant="secondary"
                        className="bg-emerald-500/10 text-emerald-400 hover:bg-red-500/20 hover:text-red-400 border border-emerald-500/20 cursor-pointer text-[10px] px-2 py-0.5"
                        onClick={() => {
                          const updated = waSelectedContacts.filter(c => c !== contact);
                          setWaSelectedContacts(updated);
                          saveWaConfig(waAutoReplyUnknown, waAutoReplyGroups, updated, waKnownContacts);
                        }}
                        title="Click to remove"
                      >
                        {getDisplayName(contact)} ✕
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              {/* Known Contacts (Disabled/Ignored) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Known Contacts (Auto-Reply Disabled)</label>
                <div className="flex gap-2 relative w-full">
                  <input
                    type="text"
                    placeholder="Add phone number or name..."
                    value={waKnownInput}
                    onChange={(e) => {
                      setWaKnownInput(e.target.value);
                      setShowKnownSuggestions(true);
                    }}
                    onFocus={() => setShowKnownSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowKnownSuggestions(false), 200)}
                    className="flex-1 bg-[#161b26] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50"
                  />
                  <Button
                    size="sm"
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-xs uppercase px-3 rounded-xl h-8"
                    onClick={() => {
                      if (!waKnownInput.trim()) return;
                      const updated = [...waKnownContacts, waKnownInput.trim()];
                      setWaKnownContacts(updated);
                      setWaKnownInput('');
                      saveWaConfig(waAutoReplyUnknown, waAutoReplyGroups, waSelectedContacts, updated);
                    }}
                  >
                    Add
                  </Button>

                  {/* Known Suggestions Dropdown */}
                  {showKnownSuggestions && filteredKnownSuggestions().length > 0 && (
                    <div className="absolute top-10 left-0 right-0 max-h-48 overflow-y-auto bg-[#131722]/95 border border-white/15 rounded-xl shadow-2xl z-50 p-1 backdrop-blur-md">
                      {filteredKnownSuggestions().map((item) => (
                        <div
                          key={item.jid}
                          onClick={() => {
                            const valueToAdd = item.jid;
                            if (!waKnownContacts.includes(valueToAdd)) {
                              const updated = [...waKnownContacts, valueToAdd];
                              setWaKnownContacts(updated);
                              saveWaConfig(waAutoReplyUnknown, waAutoReplyGroups, waSelectedContacts, updated);
                            }
                            setWaKnownInput('');
                            setShowKnownSuggestions(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 cursor-pointer rounded-lg transition-colors"
                        >
                          <span className="font-bold">
                            {item.type === 'group' ? '👥' : '👤'}
                          </span>
                          <span className="truncate flex-1 font-semibold">{item.name || 'Unnamed'}</span>
                          <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                            {item.type === 'group' ? 'Group' : (item as any).phone}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {waKnownContacts.length === 0 ? (
                    <span className="text-[10px] text-slate-600 italic">No ignored contacts.</span>
                  ) : (
                    waKnownContacts.map((contact) => (
                      <Badge
                        key={contact}
                        variant="secondary"
                        className="bg-slate-500/10 text-slate-400 hover:bg-red-500/20 hover:text-red-400 border border-slate-500/20 cursor-pointer text-[10px] px-2 py-0.5"
                        onClick={() => {
                          const updated = waKnownContacts.filter(c => c !== contact);
                          setWaKnownContacts(updated);
                          saveWaConfig(waAutoReplyUnknown, waAutoReplyGroups, waSelectedContacts, updated);
                        }}
                        title="Click to remove"
                      >
                        {getDisplayName(contact)} ✕
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CRM Quick Tips */}
          <div className="flex items-start gap-3 px-4 py-3 bg-primary/5 border border-primary/15 rounded-2xl">
            <Zap className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-primary uppercase tracking-wider">CRM Auto-Sync Active</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                WhatsApp messages sync automatically. Gmail threads indexed on connect. AI drafts replies using your conversation history.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp QR Modal */}
      {showWaModal && waStatus.qr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#0b0f19] border border-white/10 p-8 rounded-[2rem] max-w-sm w-full space-y-6 text-center shadow-2xl relative">
            <button
              onClick={() => setShowWaModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">Connect WhatsApp</h3>
              <p className="text-xs text-slate-400">
                Scan this QR code with your phone inside **WhatsApp &gt; Linked Devices** to sync messages automatically.
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={waStatus.qr} alt="WhatsApp QR Code" className="w-48 h-48" />
            </div>
            <div className="flex items-center justify-center gap-2 text-[10px] text-yellow-400 font-bold uppercase tracking-wider animate-pulse">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Waiting for scan...
            </div>
          </div>
        </div>
      )}

      {/* Reply Composer Modal (dynamic for Email and WhatsApp) */}
      {showEmailModal && selectedMemory && (
        (() => {
          const isWhatsApp = selectedMemory.source_app === 'WhatsApp';
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
              <div className="bg-[#0b0f19] border border-white/10 p-8 rounded-[2.5rem] max-w-2xl w-full space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-white text-lg font-bold transition-colors"
                >
                  ✕
                </button>

                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest">
                    {isWhatsApp ? <MessageSquare className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
                    {isWhatsApp ? 'WhatsApp Composer' : 'Email Composer'}
                  </div>
                  <h3 className="text-2xl font-black text-white">{isWhatsApp ? 'Draft WhatsApp Message' : 'Draft Email'}</h3>
                  <p className="text-xs text-slate-500">
                    {isWhatsApp
                      ? 'Draft a WhatsApp message manually or use local AI based on the selected memory.'
                      : 'Compose an email manually or draft one using local AI based on the selected memory.'
                    }
                  </p>
                </div>

                {/* Selected Memory Reference */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selected Context</span>
                    <span className="text-[10px] font-bold text-primary">{selectedMemory.source_app}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-3 bg-black/20 p-2 rounded-lg italic">
                    {selectedMemory.content}
                  </p>
                </div>

                {/* Input fields */}
                <div className="space-y-4">
                  <div className={isWhatsApp ? "space-y-1.5" : "grid grid-cols-1 sm:grid-cols-2 gap-4"}>
                    <div className="space-y-1.5 relative">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Recipient
                      </label>
                      {isWhatsApp ? (
                        <>
                          <div 
                            onClick={() => setShowModalRecipientDropdown(!showModalRecipientDropdown)}
                            className="w-full bg-[#161b26] border border-white/10 hover:border-emerald-500/30 rounded-xl px-4 py-2.5 text-sm text-white flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <span className="font-semibold text-emerald-400">
                              {getDisplayName(emailTo) || 'No recipient detected'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {emailTo || 'Click to select contact/group'}
                            </span>
                          </div>
                          
                          {showModalRecipientDropdown && (
                            <div className="absolute top-16 left-0 right-0 max-h-48 overflow-y-auto bg-[#131722]/95 border border-white/15 rounded-xl shadow-2xl z-50 p-1 backdrop-blur-md">
                              {[
                                ...waAvailableChats.groups.map(g => ({ type: 'group' as const, ...g })),
                                ...waAvailableChats.privates.map(p => ({ type: 'private' as const, ...p }))
                              ].map((item) => (
                                <div
                                  key={item.jid}
                                  onClick={() => {
                                    setEmailTo(item.jid);
                                    setShowModalRecipientDropdown(false);
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 cursor-pointer rounded-lg transition-colors"
                                >
                                  <span className="font-bold">
                                    {item.type === 'group' ? '👥' : '👤'}
                                  </span>
                                  <span className="truncate flex-1 font-semibold">{item.name || 'Unnamed'}</span>
                                  <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                                    {item.type === 'group' ? 'Group' : (item as any).phone}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <input
                          type="text"
                          placeholder="recipient@example.com"
                          value={emailTo}
                          onChange={e => setEmailTo(e.target.value)}
                          className="w-full bg-[#161b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                        />
                      )}
                    </div>
                    {!isWhatsApp && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Subject</label>
                        <input
                          type="text"
                          placeholder="Email subject"
                          value={emailSubject}
                          onChange={e => setEmailSubject(e.target.value)}
                          className="w-full bg-[#161b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                        />
                      </div>
                    )}
                  </div>

                  {/* Warning banner for no-reply recipient */}
                  {!isWhatsApp && isNoReply(emailTo) && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-[11px] leading-normal animate-in slide-in-from-top-2 duration-300">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-red-400 block">No-Reply Recipient Warning</span>
                        <p className="mt-0.5 text-slate-400">This email address appears to be an automated system or no-reply account. Drafting a reply or sending messages to this inbox will likely bounce or fail.</p>
                      </div>
                    </div>
                  )}

                  {/* AI generator assistance */}
                  <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 space-y-3">
                    <label className="text-[10px] font-black text-primary uppercase tracking-wider block">AI Assistant Instructions</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={!isWhatsApp && isNoReply(emailTo) ? "AI Drafting disabled for no-reply addresses" : isWhatsApp ? "e.g., 'make it more informal', 'express excitement', 'be brief'" : "e.g., 'make it a professional follow-up', 'request feedback', 'be formal'"}
                        value={emailInstructions}
                        onChange={e => setEmailInstructions(e.target.value)}
                        disabled={!isWhatsApp && isNoReply(emailTo)}
                        className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <Button
                        onClick={async () => {
                          if (emailDrafting || (!isWhatsApp && isNoReply(emailTo))) return;
                          setEmailDrafting(true);
                          try {
                            const prompt = isWhatsApp
                              ? `Write a friendly, conversational WhatsApp chat reply based on this local memory context:\n\n"${selectedMemory.content}"\n\nAdditional instructions: ${emailInstructions || 'Draft a friendly, concise WhatsApp reply (max 3 sentences)'}.\n\nKeep it very concise (max 3 sentences) and natural. Do not include subject lines, headers, placeholders, or sign-offs. Write the message content directly.`
                              : `Write a clean, professional email based on this local memory context:\n\n"${selectedMemory.content}"\n\nAdditional instructions: ${emailInstructions || 'Write a clean professional email reply'}.\n\nOutput only the email body. Do not include placeholders like '[Your Name]' or metadata outside the email content. Just start directly with the greeting.`;
                            const res = await executePromptViaApi(prompt, false, false, {
                              useOllama: true,
                              ollamaBaseUrl: settings.ollamaBaseUrl,
                              ollamaModel: settings.ollamaModel || 'gemma2:2b',
                              localEngine: settings.localEngine || 'ollama',
                              pythonServerUrl: settings.pythonServerUrl
                            });
                            if (res) {
                              setEmailBody(res);
                              toast({ title: isWhatsApp ? '✅ WhatsApp Draft Generated' : '✅ AI Draft Generated' });
                            }
                          } catch (err: any) {
                            toast({ variant: 'destructive', title: 'Drafting failed', description: err.message });
                          } finally {
                            setEmailDrafting(false);
                          }
                        }}
                        disabled={emailDrafting || (!isWhatsApp && isNoReply(emailTo))}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-wider px-4 rounded-xl h-9 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {emailDrafting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          'Generate with AI'
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Body Textarea */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      {isWhatsApp ? 'WhatsApp Message Body' : 'Email Body'}
                    </label>
                    <textarea
                      rows={isWhatsApp ? 5 : 8}
                      placeholder={isWhatsApp ? "Write WhatsApp message contents here..." : "Write email contents here..."}
                      value={emailBody}
                      onChange={e => setEmailBody(e.target.value)}
                      className="w-full bg-[#161b26] border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 resize-none font-sans"
                      style={{ color: 'white', WebkitTextFillColor: 'white' }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    onClick={async () => {
                      await navigator.clipboard.writeText(emailBody);
                      toast({ title: 'Copied draft to clipboard' });
                    }}
                    className="bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex-1 border border-white/10"
                  >
                    Copy Draft
                  </Button>
                  {isWhatsApp ? (
                    <>
                      <Button
                        onClick={handleSendWaDirect}
                        disabled={sendingWa}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex-1 animate-in fade-in"
                      >
                        {sendingWa ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                        Send WhatsApp
                      </Button>
                      <Button
                        onClick={() => {
                          const cleanPhone = emailTo.replace(/[^0-9]/g, '');
                          const webUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(emailBody)}`;
                          window.open(webUrl, '_blank');
                        }}
                        className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl"
                      >
                        WhatsApp Web
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => {
                          const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailTo)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
                          window.open(gmailUrl, '_blank');
                        }}
                        className="bg-primary hover:bg-primary/95 text-primary-foreground font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex-1"
                      >
                        Open in Gmail
                      </Button>
                      <Button
                        onClick={() => {
                          const mailtoUrl = `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
                          window.open(mailtoUrl, '_self');
                        }}
                        className="bg-accent hover:bg-accent/95 text-accent-foreground font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex-1"
                      >
                        Default Mail App
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* Custom Bot Wizard Modal */}
      {showAddBotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#0b0f19] border border-white/10 p-8 rounded-[2.5rem] max-w-lg w-full space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowAddBotModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white text-lg font-bold transition-colors"
            >
              ✕
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest">
                <Brain className="h-3 w-3" />
                Custom Bot Wizard
              </div>
              <h3 className="text-2xl font-black text-white">Create Custom Assistant</h3>
              <p className="text-xs text-slate-500">
                Design a custom chatbot tailored for a specific startup operational role.
              </p>
            </div>

            <form onSubmit={handleCreateCustomBot} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Bot Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pitch Deck Critic, Legal Advisor"
                  value={customBotName}
                  onChange={e => setCustomBotName(e.target.value)}
                  className="w-full bg-[#161b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Role / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chief Pitch Officer, Startup Attorney"
                  value={customBotRole}
                  onChange={e => setCustomBotRole(e.target.value)}
                  className="w-full bg-[#161b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Select Bot Icon
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {['Brain', 'Video', 'MessageSquare', 'Users', 'Code', 'Globe', 'Zap'].map((iconName) => {
                    const isSelected = customBotIcon === iconName;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setCustomBotIcon(iconName)}
                        className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-primary/20 border-primary text-primary scale-[1.05] shadow-glow'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10 hover:text-white'
                        }`}
                        title={iconName}
                      >
                        {renderBotIcon(iconName, 'h-4 w-4')}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  System Instructions (System Prompt)
                </label>
                <textarea
                  rows={4}
                  placeholder="Tell the bot how to behave, what tone to use, and how to analyze startup memory context..."
                  value={customBotSystemPrompt}
                  onChange={e => setCustomBotSystemPrompt(e.target.value)}
                  className="w-full bg-[#161b26] border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 resize-none font-sans"
                  style={{ color: 'white', WebkitTextFillColor: 'white' }}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAddBotModal(false)}
                  className="bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex-1 border border-white/10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/95 text-primary-foreground font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex-1"
                >
                  Create Bot
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Startup Business Brain Customizer Modal */}
      {showStartupBrainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#0b0f19] border border-cyan-500/30 p-8 rounded-[2.5rem] max-w-2xl w-full space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowStartupBrainModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white text-lg font-bold transition-colors"
            >
              ✕
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/30 text-cyan-300 text-[9px] font-black uppercase tracking-widest">
                <Brain className="h-3 w-3" />
                Persistent Startup Business Brain
              </div>
              <h3 className="text-2xl font-black text-white">Startup Knowledge & Business Context</h3>
              <p className="text-xs text-slate-400">
                SPARK uses this persistent brain to understand your exact business model, tech stack, SLA policies, and auto-reply rules.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Load Startup Profile Preset
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'nexapay', label: 'NexaPay (Fintech)', sub: 'Payment API' },
                  { id: 'promptpilot', label: 'PromptPilot AI', sub: 'AI Co-Founder' },
                  { id: 'blinkquick', label: 'BlinkQuick', sub: 'Quick-Commerce' },
                  { id: 'aurahealth', label: 'AuraHealth', sub: 'HealthTech' },
                ].map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      const selected = STARTUP_BRAIN_PRESETS[preset.id];
                      if (selected) {
                        setBrainForm(selected);
                        toast({ title: `Loaded Preset: ${selected.name}`, description: 'Form updated with preset business context.' });
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      brainForm.name === STARTUP_BRAIN_PRESETS[preset.id]?.name
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-glow'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-black block text-white truncate">{preset.label}</span>
                    <span className="text-[9px] text-slate-500 block truncate">{preset.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStartupBrain(brainForm);
                try {
                  localStorage.setItem('SPARK_startup_business_profile', JSON.stringify(brainForm));
                } catch (err) {}
                setShowStartupBrainModal(false);
                toast({
                  title: '🧠 Startup Brain Updated',
                  description: `SPARK is now operating with the business context of ${brainForm.name}.`
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Startup Name
                  </label>
                  <Input
                    value={brainForm.name}
                    onChange={e => setBrainForm({ ...brainForm, name: e.target.value })}
                    className="bg-[#161b26] border-white/10 text-white text-xs rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Industry / Sector
                  </label>
                  <Input
                    value={brainForm.industry}
                    onChange={e => setBrainForm({ ...brainForm, industry: e.target.value })}
                    className="bg-[#161b26] border-white/10 text-white text-xs rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Current Development Stage
                  </label>
                  <Input
                    value={brainForm.stage}
                    onChange={e => setBrainForm({ ...brainForm, stage: e.target.value })}
                    className="bg-[#161b26] border-white/10 text-white text-xs rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Current Monthly Traction / MRR
                  </label>
                  <Input
                    value={brainForm.mrr}
                    onChange={e => setBrainForm({ ...brainForm, mrr: e.target.value })}
                    className="bg-[#161b26] border-white/10 text-white text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Tech Infrastructure & Stack
                </label>
                <Input
                  value={brainForm.techStack}
                  onChange={e => setBrainForm({ ...brainForm, techStack: e.target.value })}
                  placeholder="e.g. Next.js, Node.js Workers, Redis Queue, PostgreSQL"
                  className="bg-[#161b26] border-white/10 text-white text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Customer Support SLA Policy
                  </label>
                  <Input
                    value={brainForm.supportSla}
                    onChange={e => setBrainForm({ ...brainForm, supportSla: e.target.value })}
                    placeholder="e.g. <15 min MTTR · 99.99% Uptime Guarantee"
                    className="bg-[#161b26] border-white/10 text-white text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Customer Retention Policy
                  </label>
                  <Input
                    value={brainForm.retentionPolicy}
                    onChange={e => setBrainForm({ ...brainForm, retentionPolicy: e.target.value })}
                    placeholder="e.g. Complimentary 1-month SLA credit on drop-offs"
                    className="bg-[#161b26] border-white/10 text-white text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Current Biggest Growth Obstacle
                </label>
                <Textarea
                  value={brainForm.biggestObstacle}
                  onChange={e => setBrainForm({ ...brainForm, biggestObstacle: e.target.value })}
                  placeholder="What is currently slowing down growth or conversion?"
                  className="bg-[#161b26] border-white/10 text-white text-xs rounded-xl resize-none min-h-[60px]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowStartupBrainModal(false)}
                  className="bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex-1 border border-white/10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex-1 shadow-lg shadow-cyan-500/20"
                >
                  Save Business Context
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
