"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Zap, Info, Loader2, LogIn, LogOut, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useSettings } from '@/components/providers/SettingsProvider';
import { Framer3DCard } from '@/components/framer-3d/Framer3DCard';
import { DecryptedText } from '@/components/react-bits/DecryptedText';
import { GradientText } from '@/components/react-bits/GradientText';


const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '708444926819-u9lm4e3bmt2f3r47vdrabv0onud3k39p.apps.googleusercontent.com';

export function SettingsTab() {
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const [fbUser, setFbUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('promptpilot_fb_user');
        return saved ? JSON.parse(saved) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [authLoading, setAuthLoading] = useState(false);
  const { settings, updateSetting } = useSettings();
  const [isPrivateIp, setIsPrivateIp] = useState(false);

  const saveUserSession = (user: any) => {
    if (!user) {
      setFbUser(null);
      try { localStorage.removeItem('promptpilot_fb_user'); } catch (e) {}
      return;
    }
    const userObj = {
      displayName: user.displayName || user.email?.split('@')[0] || "User",
      email: user.email,
      photoURL: user.photoURL || user.photoUrl,
      uid: user.uid || user.localId,
    };
    setFbUser(userObj);
    try { localStorage.setItem('promptpilot_fb_user', JSON.stringify(userObj)); } catch (e) {}
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const isIp = /^[0-9.]+$/.test(hostname);
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '10.0.2.2';
      setIsPrivateIp(isIp && !isLocalhost);
    }

    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const setupAuthListeners = async () => {
      try {
        const { GoogleAuthProvider, getRedirectResult, onAuthStateChanged, setPersistence, browserLocalPersistence } = await import('firebase/auth');
        const { auth } = await import('@/lib/firebase');

        try { await setPersistence(auth, browserLocalPersistence); } catch (pErr) {}

        // Check if Firebase user is already logged in
        if (auth.currentUser && isMounted) {
          saveUserSession(auth.currentUser);
        }

        // 1. Process getRedirectResult (returning from Firebase redirect)
        const redirectResult = await getRedirectResult(auth).catch(() => null);
        if (redirectResult?.user && isMounted) {
          console.log('[Auth] Processing Firebase Redirect result for user:', redirectResult.user.email);
          saveUserSession(redirectResult.user);
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
              title: "Signed In Successfully",
              description: "Authenticated via Firebase."
            });
            return;
          }
        }

        // 2. Listen for active Firebase user state to sync with NextAuth session
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (isMounted) {
            saveUserSession(user);
          }
          if (user && isMounted && !session) {
            console.log('[Auth] Syncing active Firebase user session with NextAuth:', user.email);
            try {
              const idToken = await user.getIdToken();
              await signIn('google-native', {
                redirect: false,
                idToken,
                googleAccessToken: '',
                googleProviderAccountId: user.providerData?.[0]?.uid || ''
              });
            } catch (syncErr) {
              console.error('[Auth] Failed to sync Firebase session:', syncErr);
            }
          }
        });
      } catch (err: any) {
        console.error('[Auth] Error setting up auth listeners:', err);
      }
    };

    setupAuthListeners();
    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [session, toast]);

  const activeUser = session?.user || (fbUser ? {
    name: fbUser.displayName || fbUser.email?.split('@')[0] || "User",
    email: fbUser.email,
    image: fbUser.photoURL,
  } : null);

  const handleSignIn = async () => {
    setAuthLoading(true);
    try {
      // Check if Android native bridge is available (running in the Android app)
      const androidBridge = (window as any).AndroidBridge;
      const isAndroidApp = typeof androidBridge !== 'undefined' && typeof androidBridge.startGoogleSignIn === 'function';

      if (isAndroidApp) {
        // Use native Android Google Sign-In — bypasses WebView OAuth restriction completely
        console.log('[Auth] Android bridge detected. Starting native Google Sign-In...');

        // Register the callback that Android will call after successful sign-in
        (window as any)._nativeGoogleSignInCallback = async (idToken: string, email: string, displayName: string, photoUrl: string) => {
          console.log('[Auth] Native Google Sign-In succeeded for:', email);
          // Save user locally immediately so UI updates
          saveUserSession({ displayName, email, photoURL: photoUrl, uid: email });
          
          // Sync with NextAuth/Firebase in background
          try {
            const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
            const { auth } = await import('@/lib/firebase');
            const credential = GoogleAuthProvider.credential(idToken);
            const result = await signInWithCredential(auth, credential);
            if (result.user) {
              saveUserSession(result.user);
              await signIn('google-native', {
                redirect: false,
                idToken,
                googleAccessToken: '',
                googleProviderAccountId: result.user.providerData?.[0]?.uid || ''
              }).catch(() => {});
            }
          } catch (e) {
            console.warn('[Auth] Firebase credential sync failed (non-critical):', e);
          }

          toast({ title: "Signed In Successfully", description: `Welcome, ${displayName}!` });
          setAuthLoading(false);
        };

        (window as any)._nativeGoogleSignInError = (error: string) => {
          console.error('[Auth] Native Google Sign-In error:', error);
          toast({ variant: "destructive", title: "Sign-In Failed", description: error });
          setAuthLoading(false);
        };

        // Trigger the native sign-in dialog
        androidBridge.startGoogleSignIn();
        return; // loading state cleared by callback above
      }

      // Desktop/browser fallback: use Firebase popup
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      provider.addScope('https://www.googleapis.com/auth/gmail.readonly');

      const result = await signInWithPopup(auth, provider);
      if (result && result.user) {
        saveUserSession(result.user);
        const idToken = await result.user.getIdToken();
        await signIn('google-native', {
          redirect: false,
          idToken,
          googleAccessToken: GoogleAuthProvider.credentialFromResult(result)?.accessToken || '',
          googleProviderAccountId: result.user.providerData?.[0]?.uid || ''
        }).catch(() => {});
        toast({ title: "Signed In Successfully", description: "Authenticated via Firebase." });
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
      const { auth } = await import('@/lib/firebase');
      await auth.signOut().catch(() => {});
      await signOut({ redirect: false }).catch(() => {});
      saveUserSession(null);
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
      <div className="space-y-4 pt-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/25 text-primary text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.2)] backdrop-blur-md">
          <Zap className="h-3 w-3 text-cyan-400 animate-pulse" />
          <span>System & Engine Preferences</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white font-headline leading-tight">
          System <br className="sm:hidden" />
          <GradientText colors={["#00f2ff", "#38bdf8", "#818cf8", "#c084fc", "#00f2ff"]}>
            Configuration
          </GradientText>
        </h1>
        <p className="text-white/60 text-base md:text-lg font-medium max-w-2xl">
          Manage your orchestration engine, security protocols, and mission history.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-10">
          <Card className="rounded-3xl bg-gradient-to-b from-[#0f172a]/90 via-[#070b16]/95 to-[#030712] border border-white/10 shadow-2xl backdrop-blur-xl">
            <CardHeader className="p-8">
              <CardTitle className="flex items-center gap-3 text-2xl font-black">
                <Zap className="h-6 w-6 text-primary fill-primary" />
                Orchestration Engine
              </CardTitle>
              <CardDescription className="text-base">Fine-tune how SPARK selects models and generates prompts.</CardDescription>
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
          <Framer3DCard depth={25} glintColor="rgba(56, 189, 248, 0.2)">
            <Card className="glass-panel border-white/10 bg-primary/10 overflow-hidden group">
              <div className="p-10 space-y-8 relative">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                <User className="h-32 w-32" />
              </div>
              <div className="flex flex-col items-center text-center gap-6 relative z-10">
                <Avatar className="h-24 w-24 border-4 border-primary shadow-2xl">
                  <AvatarImage src={activeUser?.image || "https://picsum.photos/seed/user-avatar/200/200"} />
                  <AvatarFallback className="bg-primary/20 text-white text-2xl font-black">
                    {activeUser?.name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-black text-white truncate max-w-[200px]">
                    {activeUser?.name || "Local User"}
                  </h3>
                  {activeUser?.email && (
                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">{activeUser.email}</p>
                  )}
                  <Badge className={`${activeUser ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white/60'} border-none mt-2 px-4 py-1 font-black uppercase tracking-widest text-[10px]`}>
                    {status === 'loading' ? 'LOADING...' : activeUser ? 'CLOUD SESSION' : 'OFFLINE MODE'}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-3 text-center opacity-80 font-medium">
                <p className="text-sm">
                  {activeUser ? 'Synchronized with Cloud Database' : 'Offline-First Mode'}
                </p>
                <p className="text-xs font-black text-primary uppercase tracking-widest">
                  {activeUser ? 'Firebase / Cloud Session Active' : 'No Login Required'}
                </p>
              </div>

              {activeUser ? (
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
                <>
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
                  
                  {isPrivateIp && (
                    <div className="mt-4 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-left animate-in fade-in duration-300">
                      <div className="flex gap-2">
                        <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-red-400">Private LAN IP Warning</p>
                          <p className="text-[10px] text-muted-foreground mt-1 leading-normal font-normal">
                            Google OAuth does not support redirecting to private LAN IPs (like <span className="font-bold text-white">{typeof window !== 'undefined' ? window.location.hostname : ''}</span>).
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1.5 leading-normal font-normal">
                            Please access via <span className="font-bold text-white">http://localhost:9002</span> or enable the Ngrok tunnel to authenticate.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              </div>
            </Card>
          </Framer3DCard>

          <Framer3DCard depth={18} glintColor="rgba(168, 85, 247, 0.18)">
            <div className="glass-panel rounded-[2rem] p-8 space-y-6 border border-white/10">
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
          </Framer3DCard>
        </div>
      </div>
    </div>
  );
}