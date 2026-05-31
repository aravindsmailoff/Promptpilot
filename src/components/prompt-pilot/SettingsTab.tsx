"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Zap, Info, Loader2, LogIn, LogOut, Cpu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { useSettings } from '@/components/providers/SettingsProvider';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '708444926819-u9lm4e3bmt2f3r47vdrabv0onud3k39p.apps.googleusercontent.com';

export function SettingsTab() {
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const [authLoading, setAuthLoading] = useState(false);
  const { settings, updateSetting } = useSettings();
  const [activeGuideModel, setActiveGuideModel] = useState<'gemma4' | 'gemma2'>('gemma4');

  const handleSignIn = async () => {
    setAuthLoading(true);
    try {
      if (Capacitor.isNativePlatform()) {
        await SocialLogin.initialize({
          google: {
            webClientId: GOOGLE_CLIENT_ID,
          },
        });

        const result = await SocialLogin.login({
          provider: 'google',
          options: {},
        });

        const idToken = (result.result as any)?.idToken;
        if (!idToken) {
          throw new Error('No ID token returned from Google.');
        }

        const nextAuthResult = await signIn('google-native', {
          idToken,
          redirect: false,
        });

        if (nextAuthResult?.error) {
          throw new Error(nextAuthResult.error);
        }

        toast({
          title: "Authenticated Successfully",
          description: "Your cloud session is now active."
        });
      } else {
        await signIn('google');
      }
    } catch (err: any) {
      console.error("Sign-in error:", err);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: err.message || "Could not establish connection with identity provider."
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAuthLoading(true);
    try {
      if (Capacitor.isNativePlatform()) {
        try {
          await SocialLogin.logout({ provider: 'google' });
        } catch (logoutErr) {
          console.warn("Native logout warning:", logoutErr);
        }
      }
      await signOut({ redirect: false });
      toast({
        title: "Signed Out",
        description: "Your session has been terminated safely."
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Sign Out Failed",
        description: "Could not terminate your session."
      });
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-16 animate-in fade-in duration-1000 pb-24">
      <div className="space-y-4">
        <h2 className="text-5xl font-black tracking-tighter text-white font-headline">Account Settings</h2>
        <p className="text-xl text-muted-foreground font-medium max-w-2xl">Manage your orchestration engine, security protocols, and mission history.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-10">
          <Card className="glass-panel border-white/10">
            <CardHeader className="p-8">
              <CardTitle className="flex items-center gap-3 text-2xl font-black">
                <Zap className="h-6 w-6 text-primary fill-primary" />
                Orchestration Engine
              </CardTitle>
              <CardDescription className="text-base">Fine-tune how PromptPilot selects models and generates prompts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-10 p-8 pt-0">
              <div className="flex items-center justify-between gap-6">
                <div className="space-y-1">
                  <Label htmlFor="instant-copy-switch" className="text-xl font-black text-white">Instant Copy Output</Label>
                  <p className="text-muted-foreground font-medium">Automatically copy results to clipboard on completion.</p>
                </div>
                <Switch 
                  id="instant-copy-switch" 
                  checked={settings.instantCopy}
                  onCheckedChange={(checked) => updateSetting('instantCopy', checked)}
                  className="data-[state=checked]:bg-primary" 
                />
              </div>

              <div className="flex items-center justify-between gap-6">
                <div className="space-y-1">
                  <Label className="text-xl font-black text-white">Default Tone Profile</Label>
                  <p className="text-muted-foreground font-medium">The preferred communication style for engineering.</p>
                </div>
                <Select 
                  value={settings.toneProfile}
                  onValueChange={(value) => updateSetting('toneProfile', value)}
                >
                  <SelectTrigger className="w-[200px] rounded-2xl bg-white/5 border-white/10 h-12">
                    <SelectValue placeholder="Style" />
                  </SelectTrigger>
                  <SelectContent className="bg-secondary border-white/10">
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-6">
                <div className="space-y-1">
                  <Label htmlFor="manual-override-switch" className="text-xl font-black text-white">Manual Model Override</Label>
                  <p className="text-muted-foreground font-medium">Bypass auto-routing to manually select an AI agent.</p>
                </div>
                <Switch 
                  id="manual-override-switch"
                  checked={settings.manualModelOverride}
                  onCheckedChange={(checked) => updateSetting('manualModelOverride', checked)}
                  className="data-[state=checked]:bg-primary" 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-[80px] pointer-events-none" />
            <CardHeader className="p-8">
              <CardTitle className="flex items-center gap-3 text-2xl font-black text-glow">
                <Cpu className="h-6 w-6 text-accent animate-pulse" />
                Local Inference Integration
              </CardTitle>
              <CardDescription className="text-base">Connect to your local Ollama service or Python Transformers server to run Gemma offline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-8 pt-0">
              <div className="flex items-center justify-between gap-6">
                <div className="space-y-1">
                  <Label htmlFor="use-ollama-switch" className="text-xl font-black text-white">Use Local Inference</Label>
                  <p className="text-muted-foreground font-medium">Bypass cloud models and run all tasks on your local LLM engine.</p>
                </div>
                <Switch 
                  id="use-ollama-switch"
                  checked={settings.useOllama}
                  onCheckedChange={(checked) => updateSetting('useOllama', checked)}
                  className="data-[state=checked]:bg-accent" 
                />
              </div>

              {settings.useOllama && (
                <div className="space-y-6 pt-4 animate-in slide-in-from-top-4 duration-300">
                  {/* Local Engine Type Selector */}
                  <div className="space-y-2">
                    <Label className="text-sm font-black text-white uppercase tracking-wider">Local Engine Type</Label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          updateSetting('localEngine', 'ollama');
                          toast({ title: "Ollama Selected", description: "Local execution engine set to Ollama." });
                        }}
                        className={`px-6 h-12 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                          settings.localEngine === 'ollama'
                            ? 'bg-accent text-accent-foreground border-accent shadow-lg shadow-accent/20'
                            : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        Ollama Service
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateSetting('localEngine', 'python');
                          toast({ title: "Python Server Selected", description: "Local execution engine set to Python (Transformers)." });
                        }}
                        className={`px-6 h-12 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                          settings.localEngine === 'python'
                            ? 'bg-accent text-accent-foreground border-accent shadow-lg shadow-accent/20'
                            : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        Python (Transformers)
                      </button>
                    </div>
                  </div>

                  {settings.localEngine === 'python' ? (
                    /* Python Server Configurations */
                    <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                      <div className="space-y-2">
                        <Label htmlFor="python-url" className="text-sm font-black text-white uppercase tracking-wider">Python Server URL</Label>
                        <input 
                          id="python-url"
                          type="text" 
                          value={settings.pythonServerUrl}
                          onChange={(e) => updateSetting('pythonServerUrl', e.target.value)}
                          placeholder="http://127.0.0.1:8000"
                          className="w-full px-4 h-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-accent focus:outline-none transition-colors font-medium text-sm"
                        />
                      </div>

                      <div className="p-6 bg-black/40 border border-white/5 rounded-2xl space-y-4">
                        <h4 className="text-xs font-black text-accent uppercase tracking-widest flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          Python Server Setup Guide
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                          To run the local <span className="text-white font-bold">Gemma 4 4.5B Effective</span> model using Hugging Face <span className="text-white font-bold">transformers</span> in Python, run the preconfigured FastAPI server:
                        </p>
                        
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block">Start Local Server</span>
                          <div className="relative group flex items-center">
                            <pre className="p-4 bg-white/5 rounded-xl font-mono text-[10px] text-white/90 overflow-x-auto border border-white/5 w-full pr-20">
                              <code>python gemma_server.py</code>
                            </pre>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText('python gemma_server.py');
                                toast({ title: "Command Copied", description: "Command copied to clipboard." });
                              }}
                              className="absolute right-3 px-3 py-1.5 bg-accent text-[10px] font-black uppercase text-accent-foreground rounded-lg hover:scale-105 transition-all"
                            >
                              Copy
                            </button>
                          </div>
                        </div>

                        <p className="text-[10px] text-white/30 font-medium leading-normal">
                          Note: The script will automatically install missing dependencies (FastAPI, PyTorch, Transformers) on the first run, and load the <code>google/gemma-4-E4B-it</code> weights. Ensure you have an internet connection to download the model files first.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Ollama Configurations */
                    <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="ollama-url" className="text-sm font-black text-white uppercase tracking-wider">Ollama API URL</Label>
                          <input 
                            id="ollama-url"
                            type="text" 
                            value={settings.ollamaBaseUrl}
                            onChange={(e) => updateSetting('ollamaBaseUrl', e.target.value)}
                            placeholder="http://127.0.0.1:11434"
                            className="w-full px-4 h-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-accent focus:outline-none transition-colors font-medium text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ollama-model" className="text-sm font-black text-white uppercase tracking-wider">Active Model Tag</Label>
                          <input 
                            id="ollama-model"
                            type="text" 
                            value={settings.ollamaModel}
                            onChange={(e) => updateSetting('ollamaModel', e.target.value)}
                            placeholder="gemma2:2b"
                            className="w-full px-4 h-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-accent focus:outline-none transition-colors font-medium text-sm"
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => {
                                updateSetting('ollamaModel', 'gemma4:e4b');
                                toast({ title: "Gemma 4 Selected", description: "Active model tag updated to gemma4:e4b." });
                              }}
                              className={`text-[10px] font-black px-3 py-1.5 rounded-full border transition-all ${
                                settings.ollamaModel === 'gemma4:e4b'
                                  ? 'bg-accent/20 border-accent text-accent'
                                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                              }`}
                            >
                              Gemma 4 (gemma4:e4b)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                updateSetting('ollamaModel', 'gemma2:2b');
                                toast({ title: "Gemma 2 Selected", description: "Active model tag updated to gemma2:2b." });
                              }}
                              className={`text-[10px] font-black px-3 py-1.5 rounded-full border transition-all ${
                                settings.ollamaModel === 'gemma2:2b'
                                  ? 'bg-accent/20 border-accent text-accent'
                                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                              }`}
                            >
                              Gemma 2 (gemma2:2b)
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-black/40 border border-white/5 rounded-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <h4 className="text-xs font-black text-accent uppercase tracking-widest flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Ollama Setup Guide
                          </h4>
                          <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => setActiveGuideModel('gemma4')}
                              className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg transition-all ${
                                activeGuideModel === 'gemma4'
                                  ? 'bg-accent text-accent-foreground'
                                  : 'text-white/60 hover:text-white'
                              }`}
                            >
                              Gemma 4 (4.5B)
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveGuideModel('gemma2')}
                              className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg transition-all ${
                                activeGuideModel === 'gemma2'
                                  ? 'bg-accent text-accent-foreground'
                                  : 'text-white/60 hover:text-white'
                              }`}
                            >
                              Gemma 2 (2B)
                            </button>
                          </div>
                        </div>

                        {activeGuideModel === 'gemma4' ? (
                          <div className="space-y-4 animate-in fade-in duration-200">
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                              To run the local <span className="text-white font-bold">Gemma 4 4.5B Effective</span> model, ensure you have installed <a href="https://ollama.com" target="_blank" rel="noreferrer" className="text-accent hover:underline font-bold">Ollama</a>. You can build it from our preconfigured project <code className="text-white bg-white/5 px-1.5 py-0.5 rounded">Modelfile</code>, or pull the Hugging Face GGUF version directly.
                            </p>
                            
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block">Option A: Build via Modelfile (Recommended)</span>
                                <div className="relative group flex items-center">
                                  <pre className="p-4 bg-white/5 rounded-xl font-mono text-[10px] text-white/90 overflow-x-auto border border-white/5 w-full pr-20">
                                    <code>ollama create gemma4:e4b -f Modelfile</code>
                                  </pre>
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText('ollama create gemma4:e4b -f Modelfile');
                                      toast({ title: "Command Copied", description: "Command copied to clipboard." });
                                    }}
                                    className="absolute right-3 px-3 py-1.5 bg-accent text-[10px] font-black uppercase text-accent-foreground rounded-lg hover:scale-105 transition-all"
                                  >
                                    Copy
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block">Option B: Pull directly from Hugging Face</span>
                                <div className="relative group flex items-center">
                                  <pre className="p-4 bg-white/5 rounded-xl font-mono text-[10px] text-white/90 overflow-x-auto border border-white/5 w-full pr-20">
                                    <code>ollama pull hf.co/bartowski/google_gemma-4-E4B-it-GGUF:Q4_K_M</code>
                                  </pre>
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText('ollama pull hf.co/bartowski/google_gemma-4-E4B-it-GGUF:Q4_K_M');
                                      toast({ title: "Command Copied", description: "Command copied to clipboard." });
                                    }}
                                    className="absolute right-3 px-3 py-1.5 bg-accent text-[10px] font-black uppercase text-accent-foreground rounded-lg hover:scale-105 transition-all"
                                  >
                                    Copy
                                  </button>
                                </div>
                              </div>
                            </div>

                            <p className="text-[10px] text-white/30 font-medium leading-normal">
                              Note: Gemma 4 E4B is a 4.5B effective parameter model optimized for local execution with high instruction-following precision. It requires approx. 8 GB of free RAM.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4 animate-in fade-in duration-200">
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                              To run the lightweight <span className="text-white font-bold">Gemma 2 2B</span> model, make sure you have installed <a href="https://ollama.com" target="_blank" rel="noreferrer" className="text-accent hover:underline font-bold">Ollama</a> and pull the standard lightweight tag:
                            </p>
                            <div className="relative group flex items-center">
                              <pre className="p-4 bg-white/5 rounded-xl font-mono text-[11px] text-white/90 overflow-x-auto border border-white/5 w-full pr-20">
                                <code>ollama pull gemma2:2b</code>
                              </pre>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText('ollama pull gemma2:2b');
                                  toast({ title: "Command Copied", description: "Command copied to clipboard." });
                                }}
                                className="absolute right-3 px-3 py-1.5 bg-accent text-[10px] font-black uppercase text-accent-foreground rounded-lg hover:scale-105 transition-all"
                              >
                                Copy
                              </button>
                            </div>
                            <p className="text-[10px] text-white/30 font-medium leading-normal">
                              Note: Gemma 2 2B is a highly-optimized, lightweight model (~1.6 GB) ideal for systems with limited RAM.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-10">
          <Card className="glass-panel border-white/10 bg-primary/10 overflow-hidden group">
            <div className="p-10 space-y-8 relative">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                <User className="h-32 w-32" />
              </div>
              <div className="flex flex-col items-center text-center gap-6 relative z-10">
                <Avatar className="h-24 w-24 border-4 border-primary shadow-2xl">
                  <AvatarImage src={session?.user?.image || "https://picsum.photos/seed/user-avatar/200/200"} />
                  <AvatarFallback className="bg-primary/20 text-white text-2xl font-black">
                    {session?.user?.name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-black text-white truncate max-w-[200px]">
                    {session?.user?.name || "Local User"}
                  </h3>
                  {session?.user?.email && (
                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">{session.user.email}</p>
                  )}
                  <Badge className={`${session ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white/60'} border-none mt-2 px-4 py-1 font-black uppercase tracking-widest text-[10px]`}>
                    {status === 'loading' ? 'LOADING...' : session ? 'CLOUD SESSION' : 'OFFLINE MODE'}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-3 text-center opacity-80 font-medium">
                <p className="text-sm">
                  {session ? 'Synchronized with Cloud Database' : 'Offline-First Mode'}
                </p>
                <p className="text-xs font-black text-primary uppercase tracking-widest">
                  {session ? 'Railway PostgreSQL Enabled' : 'No Login Required'}
                </p>
              </div>

              {session ? (
                <Button 
                  variant="destructive" 
                  onClick={handleSignOut} 
                  disabled={authLoading}
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  {authLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
                  Sign Out
                </Button>
              ) : (
                <Button 
                  variant="secondary" 
                  onClick={handleSignIn} 
                  disabled={authLoading || status === 'loading'}
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-white text-black hover:bg-white/90 shadow-xl shadow-white/5 transition-all flex items-center justify-center gap-2"
                >
                  {authLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                  Sign In with Google
                </Button>
              )}
            </div>
          </Card>

          <div className="glass-panel rounded-[2rem] p-8 space-y-6">
            <h4 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest">
              <Info className="h-4 w-4 text-primary" />
              System Information
            </h4>
            <div className="space-y-4 text-xs text-muted-foreground font-black uppercase tracking-widest">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Orchestrator</span>
                <span className="text-white">v4.2.0</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Storage</span>
                <span className={session ? "text-primary" : "text-accent"}>
                  {session ? "PostgreSQL (Railway)" : "Local Storage (Fallback)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sync</span>
                <span className="text-white">{session ? "Cloud" : "Browser"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}