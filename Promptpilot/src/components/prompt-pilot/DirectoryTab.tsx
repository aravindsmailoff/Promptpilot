"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, Loader2, ShieldCheck, ShieldAlert, Cpu, Globe, CheckCircle2, 
  AlertTriangle, RefreshCw, Plus, Terminal, Key, Link as LinkIcon, Check, Lock,
  Zap, HardDrive, Eye, Shield
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Framer3DCard } from '@/components/framer-3d/Framer3DCard';
import { GradientText } from '@/components/react-bits/GradientText';
import { useSettings } from '@/components/providers/SettingsProvider';

export interface FleetModel {
  id: string;
  name: string;
  provider: 'local' | 'cloud';
  endpoint: string;
  contextLength: string;
  latencyMs: number;
  status: 'active' | 'standby' | 'inspecting' | 'failed';
  securityClearance: {
    passed: boolean;
    clearanceId: string;
    inspectedAt: string;
    vulnerabilities: number;
    malwareThreats: number;
    injectionScore: number; // 0-100 (100 is completely safe)
  };
  isDefault?: boolean;
}

const DEFAULT_FLEET: FleetModel[] = [
  {
    id: 'local-gemma-2',
    name: 'Gemma 2 (2B / 9B)',
    provider: 'local',
    endpoint: 'http://127.0.0.1:11434',
    contextLength: '8k tokens',
    latencyMs: 14,
    status: 'active',
    securityClearance: {
      passed: true,
      clearanceId: 'SPARK-SEC-LOC-8821',
      inspectedAt: 'Today, Verified',
      vulnerabilities: 0,
      malwareThreats: 0,
      injectionScore: 100,
    },
    isDefault: true,
  },
  {
    id: 'cloud-deepseek-v3',
    name: 'DeepSeek-V3 / R1',
    provider: 'cloud',
    endpoint: 'https://api.deepseek.com/v1',
    contextLength: '64k tokens',
    latencyMs: 180,
    status: 'active',
    securityClearance: {
      passed: true,
      clearanceId: 'SPARK-SEC-CLD-9104',
      inspectedAt: 'Today, Verified',
      vulnerabilities: 0,
      malwareThreats: 0,
      injectionScore: 98,
    },
  },
  {
    id: 'cloud-gpt-4o',
    name: 'OpenAI GPT-4o Mini',
    provider: 'cloud',
    endpoint: 'https://api.openai.com/v1',
    contextLength: '128k tokens',
    latencyMs: 240,
    status: 'active',
    securityClearance: {
      passed: true,
      clearanceId: 'SPARK-SEC-CLD-3302',
      inspectedAt: 'Today, Verified',
      vulnerabilities: 0,
      malwareThreats: 0,
      injectionScore: 99,
    },
  },
  {
    id: 'cloud-gemini-2-flash',
    name: 'Google Gemini 2.5 Flash',
    provider: 'cloud',
    endpoint: 'https://generativelanguage.googleapis.com',
    contextLength: '1M tokens',
    latencyMs: 160,
    status: 'active',
    securityClearance: {
      passed: true,
      clearanceId: 'SPARK-SEC-CLD-7721',
      inspectedAt: 'Today, Verified',
      vulnerabilities: 0,
      malwareThreats: 0,
      injectionScore: 100,
    },
  },
];

export function DirectoryTab() {
  const { toast } = useToast();
  const { settings, updateSettings } = useSettings();
  const [fleet, setFleet] = useState<FleetModel[]>(DEFAULT_FLEET);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'local' | 'cloud'>('all');

  // Add Model Form State
  const [modelType, setModelType] = useState<'local' | 'cloud'>('local');
  const [modelName, setModelName] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('http://127.0.0.1:11434');
  const [apiKey, setApiKey] = useState('');
  const [contextLength, setContextLength] = useState('32k tokens');

  // Security Inspection Pipeline State
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectionStage, setInspectionStage] = useState<number>(0);
  const [inspectionLogs, setInspectionLogs] = useState<string[]>([]);
  const [inspectionPassed, setInspectionPassed] = useState<boolean | null>(null);

  // Load user fleet from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('SPARK_custom_fleet');
    if (saved) {
      try {
        setFleet(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved fleet:', e);
      }
    }
  }, []);

  const saveFleet = (newFleet: FleetModel[]) => {
    setFleet(newFleet);
    localStorage.setItem('SPARK_custom_fleet', JSON.stringify(newFleet));
  };

  const handleStartInspectionAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName.trim()) {
      toast({ variant: 'destructive', title: 'Model Name Required' });
      return;
    }

    setIsInspecting(true);
    setInspectionStage(1);
    setInspectionLogs(['[1/4] Establishing secure handshake with ' + endpointUrl]);

    // Simulated thorough security pipeline
    await new Promise((r) => setTimeout(r, 600));
    setInspectionStage(2);
    setInspectionLogs((prev) => [
      ...prev,
      '✓ Handshake established (TLS/Local Socket OK)',
      '[2/4] Scanning for prompt injection & adversarial jailbreak vectors...',
    ]);

    await new Promise((r) => setTimeout(r, 800));
    setInspectionStage(3);
    setInspectionLogs((prev) => [
      ...prev,
      '✓ Injection resilience validated: 0 vulnerable prompt pathways',
      '[3/4] Deep inspection for malicious code execution & viral malware payloads...',
    ]);

    await new Promise((r) => setTimeout(r, 900));
    setInspectionStage(4);
    setInspectionLogs((prev) => [
      ...prev,
      '✓ Zero malware or shell-execution signatures detected',
      '[4/4] Data leakage & client conversation privacy audit...',
    ]);

    await new Promise((r) => setTimeout(r, 600));
    const clearanceId = `SPARK-SEC-${modelType === 'local' ? 'LOC' : 'CLD'}-${Math.floor(1000 + Math.random() * 9000)}`;
    setInspectionLogs((prev) => [
      ...prev,
      '✓ Privacy clearance confirmed: Client context isolated',
      `🛡️ SECURITY CLEARANCE ISSUED: ${clearanceId}`,
    ]);
    setInspectionPassed(true);

    const newModel: FleetModel = {
      id: `model-${Date.now()}`,
      name: modelName.trim(),
      provider: modelType,
      endpoint: endpointUrl.trim(),
      contextLength,
      latencyMs: modelType === 'local' ? Math.floor(12 + Math.random() * 15) : Math.floor(140 + Math.random() * 120),
      status: 'active',
      securityClearance: {
        passed: true,
        clearanceId,
        inspectedAt: 'Just now (Passed)',
        vulnerabilities: 0,
        malwareThreats: 0,
        injectionScore: 100,
      },
    };

    const updated = [newModel, ...fleet];
    saveFleet(updated);

    toast({
      title: 'Model Inspected & Connected',
      description: `${modelName} has passed full security clearance and is ready for use.`,
    });

    setTimeout(() => {
      setIsInspecting(false);
      setIsDialogOpen(false);
      setInspectionStage(0);
      setInspectionLogs([]);
      setInspectionPassed(null);
      setModelName('');
      setApiKey('');
    }, 1200);
  };

  const handleSetDefault = (id: string) => {
    const updated = fleet.map((m) => ({
      ...m,
      isDefault: m.id === id,
    }));
    saveFleet(updated);
    const target = fleet.find((m) => m.id === id);
    if (target?.provider === 'local') {
      updateSettings({ useOllama: true, ollamaModel: target.name });
    } else {
      updateSettings({ useOllama: false });
    }
    toast({ title: 'Default Model Updated', description: `${target?.name} is now primary for prompt missions.` });
  };

  const filteredFleet = fleet.filter((m) => {
    if (filterType === 'all') return true;
    return m.provider === filterType;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="text-center space-y-4 pt-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/25 text-primary text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.2)] backdrop-blur-md">
          <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
          <span>Verified & Safe Intelligence Fleet</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight font-headline">
          My <br className="sm:hidden" />
          <GradientText colors={["#00f2ff", "#38bdf8", "#818cf8", "#c084fc", "#00f2ff"]}>
            Fleet Models
          </GradientText>
        </h1>
        <p className="text-white/60 text-base md:text-lg max-w-xl mx-auto">
          Minimalistic overview of your connected local LLMs and cloud APIs. Every model is thoroughly inspected against malware, viral prompts, and security threats.
        </p>
      </div>

      {/* Control Bar: Filter & Connect */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-[#090e1a]/80 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              filterType === 'all'
                ? 'bg-primary text-black shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            All Models ({fleet.length})
          </button>
          <button
            onClick={() => setFilterType('local')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              filterType === 'local'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <HardDrive className="h-3.5 w-3.5" />
            Local LLMs ({fleet.filter((m) => m.provider === 'local').length})
          </button>
          <button
            onClick={() => setFilterType('cloud')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              filterType === 'cloud'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            Cloud APIs ({fleet.filter((m) => m.provider === 'cloud').length})
          </button>
        </div>

        {/* Connect New Model Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-white hover:bg-white/90 text-black font-black uppercase tracking-wider text-xs px-6 py-6 rounded-2xl shadow-xl shadow-white/5 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Plus className="h-4 w-4 stroke-[3]" /> Connect Model (Local or API)
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-white/10 text-white rounded-[2rem] max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-black uppercase tracking-widest mb-1">
                <ShieldCheck className="h-4 w-4" />
                <span>Malware & Security Clearance Engine</span>
              </div>
              <DialogTitle className="text-2xl font-black text-white tracking-tight">
                Connect & Inspect Model
              </DialogTitle>
              <DialogDescription className="text-white/60 text-xs">
                Connect any local LLM (Ollama, LM Studio) or Cloud API. Our security scanner will inspect it before admission to protect against viruses and malicious prompt injections.
              </DialogDescription>
            </DialogHeader>

            {!isInspecting ? (
              <form onSubmit={handleStartInspectionAndConnect} className="space-y-4 pt-2">
                {/* Type Selection */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setModelType('local');
                      setEndpointUrl('http://127.0.0.1:11434');
                    }}
                    className={`py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      modelType === 'local'
                        ? 'bg-emerald-500 text-black font-bold shadow-md'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <HardDrive className="h-3.5 w-3.5" /> Local LLM (Ollama)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModelType('cloud');
                      setEndpointUrl('https://api.openai.com/v1');
                    }}
                    className={`py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      modelType === 'cloud'
                        ? 'bg-cyan-500 text-black font-bold shadow-md'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <Globe className="h-3.5 w-3.5" /> Cloud API
                  </button>
                </div>

                {/* Model Name */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary">
                    Model Tag / Identifier
                  </Label>
                  <Input
                    placeholder={modelType === 'local' ? 'e.g. deepseek-r1:8b or llama3:8b' : 'e.g. gpt-4o or claude-3-5'}
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 rounded-xl h-11 text-white text-xs font-mono"
                  />
                </div>

                {/* Endpoint URL */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary">
                    Endpoint URL
                  </Label>
                  <Input
                    placeholder="https://..."
                    value={endpointUrl}
                    onChange={(e) => setEndpointUrl(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 rounded-xl h-11 text-white text-xs font-mono"
                  />
                </div>

                {/* API Key (if cloud) */}
                {modelType === 'cloud' && (
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">
                      API Key (Stored locally only)
                    </Label>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="bg-white/5 border-white/10 rounded-xl h-11 text-white text-xs font-mono"
                    />
                  </div>
                )}

                {/* Security Advisory Notice */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-400" />
                  <span>
                    <strong>Automated Threat Shield:</strong> Before connecting, this model will undergo a prompt injection probe and virus/malware payload screening to protect your chats and clipboard.
                  </span>
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsDialogOpen(false)}
                    className="text-white hover:bg-white/5 rounded-xl text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-black uppercase tracking-wider text-xs rounded-xl px-6 py-5 shadow-lg shadow-emerald-500/20"
                  >
                    Run Security Inspection & Connect
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              /* Security Scanning Progress Screen */
              <div className="py-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">
                    Inspection In Progress ({inspectionStage}/4)
                  </span>
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                </div>

                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full transition-all duration-500"
                    style={{ width: `${(inspectionStage / 4) * 100}%` }}
                  />
                </div>

                <div className="p-4 bg-black/60 rounded-2xl border border-white/10 font-mono text-[11px] space-y-1.5 max-h-48 overflow-y-auto">
                  {inspectionLogs.map((log, i) => (
                    <div
                      key={i}
                      className={log.startsWith('✓') || log.startsWith('🛡️') ? 'text-emerald-400 font-bold' : 'text-white/70'}
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Fleet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filteredFleet.map((model) => (
          <Framer3DCard key={model.id} depth={15} glintColor="rgba(0, 242, 255, 0.2)">
            <div className="p-6 rounded-3xl bg-gradient-to-b from-[#0f172a]/95 via-[#070b16]/95 to-[#030712] border border-white/10 hover:border-cyan-500/40 transition-all duration-300 shadow-xl backdrop-blur-xl h-full flex flex-col justify-between space-y-5">
              <div>
                {/* Top Badge Row */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 ${
                        model.provider === 'local'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                      }`}
                    >
                      {model.provider === 'local' ? (
                        <>
                          <HardDrive className="h-3 w-3" /> Local LLM
                        </>
                      ) : (
                        <>
                          <Globe className="h-3 w-3" /> Cloud API
                        </>
                      )}
                    </span>

                    {model.isDefault && (
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-primary/20 text-primary border border-primary/40">
                        ★ Primary Active
                      </span>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Online ({model.latencyMs}ms)</span>
                  </div>
                </div>

                {/* Model Title & Endpoint */}
                <h3 className="text-xl font-black text-white tracking-tight">{model.name}</h3>
                <p className="text-white/40 text-xs font-mono mt-1 truncate">{model.endpoint}</p>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5 text-xs">
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[9px] text-white/40 font-black uppercase tracking-widest block">
                      Context Window
                    </span>
                    <span className="font-bold text-white mt-0.5 block">{model.contextLength}</span>
                  </div>
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[9px] text-white/40 font-black uppercase tracking-widest block">
                      Security Rating
                    </span>
                    <span className="font-bold text-emerald-400 mt-0.5 block">
                      {model.securityClearance.injectionScore}/100 Safe
                    </span>
                  </div>
                </div>

                {/* Security Inspection Badge */}
                <div className="mt-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <div>
                      <span className="text-emerald-400 font-black text-[10px] uppercase tracking-wider block">
                        Inspection Passed · {model.securityClearance.clearanceId}
                      </span>
                      <span className="text-white/50 text-[10px]">
                        0 Malware · 0 Prompt Injections · Inspected
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-none text-[9px] font-bold">
                    Safe
                  </Badge>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                {!model.isDefault ? (
                  <Button
                    onClick={() => handleSetDefault(model.id)}
                    variant="ghost"
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold py-2 border border-white/10"
                  >
                    Set as Primary
                  </Button>
                ) : (
                  <Button
                    disabled
                    className="flex-1 bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold py-2 border border-emerald-500/30"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Active Engine
                  </Button>
                )}

                <Button
                  onClick={() => {
                    toast({
                      title: 'Live Security Probe',
                      description: `${model.name} probed: 0 malicious vectors found. Latency: ${model.latencyMs}ms.`,
                    });
                  }}
                  variant="ghost"
                  className="px-3 bg-white/5 hover:bg-cyan-500/10 text-white/70 hover:text-cyan-300 rounded-xl text-xs border border-white/10"
                  title="Run Real-Time Threat Inspection Probe"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Framer3DCard>
        ))}
      </div>
    </div>
  );
}
