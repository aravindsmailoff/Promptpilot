"use client"

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Sparkles, Brain, Shield, Clock, ChevronDown, ChevronUp, FileEdit, Send
} from 'lucide-react';
import { useSettings } from '@/components/providers/SettingsProvider';
import { executePromptViaApi } from '@/ai/actions/execute-prompt';

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
  const [sendingWa, setSendingWa] = useState(false);
  const [waStatus, setWaStatus] = useState<{ status: string; qr: string | null }>({ status: 'disconnected', qr: null });
  const [showWaModal, setShowWaModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'Gmail' | 'WhatsApp'>('all');

  const searchTimer = useRef<NodeJS.Timeout | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // WhatsApp Auto-Reply Config states
  const [waAutoReplyUnknown, setWaAutoReplyUnknown] = useState(true);
  const [waAutoReplyGroups, setWaAutoReplyGroups] = useState(false);
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
    known: string[]
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
        }),
      });
      if (res.ok) {
        toast({ title: 'Config Saved', description: 'WhatsApp auto-reply settings updated.' });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Failed to save config', description: err.message });
    }
  };

  // Poll WhatsApp Service status
  useEffect(() => {
    const checkWa = async () => {
      try {
        const res = await fetch('http://localhost:8002/status');
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
                    signIn('google');
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
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">

      {/* ── Hero Header ───────────────────────────────────────────────────── */}
      <div className="text-center space-y-4 pt-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.2)]">
          <Brain className="h-3 w-3 animate-pulse" />
          Universal Memory Layer
        </div>
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none">
          Context<span className="text-primary text-glow">Pilot</span>
        </h2>
        <p className="text-slate-400 text-base max-w-xl mx-auto">
          Index everything. Find anything. Powered by local Gemma — your data never leaves your machine.
        </p>
      </div>

      {/* ── Server Status Bar ─────────────────────────────────────────────── */}
      <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border text-sm font-semibold transition-all ${
        serverOnline === null
          ? 'bg-white/5 border-white/10 text-slate-400'
          : serverOnline
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          : 'bg-red-500/10 border-red-500/20 text-red-400'
      }`}>
        <div className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-emerald-400 animate-pulse' : serverOnline === false ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'}`} />
        {serverOnline === null && 'Connecting to context_server.py...'}
        {serverOnline === true  && `✓ context_server.py online · ${stats?.total ?? 0} memories indexed`}
        {serverOnline === false && 'context_server.py offline — Run: python context_server.py'}
        <Button variant="ghost" size="sm" className="ml-auto h-7 px-3 text-xs" onClick={fetchStats}>
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Left: Search Panel (3/5) ─────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
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
                  onClick={() => setUseGemma(false)}
                  className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${!useGemma ? 'bg-primary text-primary-foreground shadow-lg' : 'text-slate-500 hover:text-white'}`}
                >
                  Fast (Hybrid)
                </button>
                <button
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
                <SelectTrigger className="w-full bg-[#1e293b] border-white/10 text-white rounded-xl h-11 focus:ring-primary/50">
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
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder="Paste any text here to index it — a message, note, article, meeting summary…"
                className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl resize-none focus-visible:ring-primary/50 text-sm"
                style={{ color: 'white', WebkitTextFillColor: 'white' }}
              />
              <Button
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
                  <Button
                    onClick={() => signIn('google')}
                    size="sm"
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-xs uppercase tracking-wider py-2 rounded-xl mt-1 h-9"
                  >
                    Connect Google Account
                  </Button>
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

          {/* Privacy notice */}
          <div className="flex items-start gap-3 px-4 py-3 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl">
            <Shield className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">100% Local</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                All embeddings computed locally. Data stored in <code className="text-slate-400">contextpilot.db</code>. Nothing sent to the cloud.
              </div>
            </div>
          </div>

          {/* How to use daemon */}
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 space-y-2">
            <div className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-yellow-400" />
              Enable Background Popup
            </div>
            <p className="text-[11px] text-slate-500">
              Start the daemon to get real-time popups whenever you copy text in any app:
            </p>
            <code className="block text-[11px] bg-black/40 text-cyan-400 px-3 py-2 rounded-lg font-mono">
              python context_daemon.py
            </code>
            <p className="text-[11px] text-slate-600">
              Hotkey: <span className="text-white font-bold">Ctrl+Shift+Space</span>
            </p>
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
                              useOllama: settings.useOllama,
                              ollamaBaseUrl: settings.ollamaBaseUrl,
                              ollamaModel: settings.ollamaModel,
                              localEngine: settings.localEngine,
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
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex-1"
                      >
                        {sendingWa ? (
                          <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Sending...</>
                        ) : (
                          'Send Directly'
                        )}
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
    </div>
  );
}
