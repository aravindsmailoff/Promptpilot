"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Zap, Info, Loader2, LogIn, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useSettings } from '@/components/providers/SettingsProvider';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '708444926819-u9lm4e3bmt2f3r47vdrabv0onud3k39p.apps.googleusercontent.com';

export function SettingsTab() {
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const [authLoading, setAuthLoading] = useState(false);
  const { settings, updateSetting } = useSettings();

  const handleSignIn = async () => {
    setAuthLoading(true);
    try {
      await signIn('google');
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
        <h1 className="text-5xl font-black tracking-tighter text-white font-headline">Account Settings</h1>
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
                  <SelectTrigger id="default-tone-profile" className="w-[200px] rounded-2xl bg-white/5 border-white/10 h-12">
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
                  id="sign-out-btn"
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
                  id="sign-in-btn"
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