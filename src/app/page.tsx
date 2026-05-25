"use client"

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HomeTab } from '@/components/prompt-pilot/HomeTab';
import { DirectoryTab } from '@/components/prompt-pilot/DirectoryTab';
import { SettingsTab } from '@/components/prompt-pilot/SettingsTab';
import { HistoryTab } from '@/components/prompt-pilot/HistoryTab';
import { Toaster } from '@/components/ui/toaster';
import { Home as HomeIcon, LayoutGrid, Settings, History } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [relaunchTask, setRelaunchTask] = useState<string | null>(null);

  const handleRelaunch = (task: string) => {
    setRelaunchTask(task);
    setActiveTab('home');
  };

  return (
    <main className="min-h-screen bg-background pb-32 md:pb-0 overflow-x-hidden">
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-4 group cursor-pointer" 
            onClick={() => setActiveTab('home')}
          >
            <div className="bg-primary p-2.5 rounded-2xl text-primary-foreground shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform duration-500">
              <HomeIcon className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tighter text-white block leading-none text-glow">PromptPilot</span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1 block opacity-80">AI Orchestrator</span>
            </div>
          </div>
          
          <nav className="hidden lg:block">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList className="bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-md">
                <TabsTrigger value="home" className="rounded-full px-8 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center gap-2">
                  <HomeIcon className="h-4 w-4" />
                  Home
                </TabsTrigger>
                
                <TabsTrigger value="history" className="rounded-full px-8 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center gap-2">
                  <History className="h-4 w-4" />
                  History
                </TabsTrigger>

                <TabsTrigger value="directory" className="rounded-full px-8 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Fleet
                </TabsTrigger>
                
                <TabsTrigger value="settings" className="rounded-full px-8 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </nav>

          <div className="hidden sm:flex items-center gap-3 px-5 py-2.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_rgba(0,242,255,0.8)]" />
            <span className="text-xs font-bold text-accent uppercase tracking-widest">Routing Online</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8 md:pt-12">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="home" className="mt-0 outline-none">
            <HomeTab relaunchTask={relaunchTask} clearRelaunchTask={() => setRelaunchTask(null)} />
          </TabsContent>

          <TabsContent value="history" className="mt-0 outline-none">
            <HistoryTab onRelaunch={handleRelaunch} />
          </TabsContent>

          <TabsContent value="directory" className="mt-0 outline-none">
            <DirectoryTab />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-0 outline-none">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Bottom Navigation optimized for Android Bottom Bar */}
      <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-md glass-panel rounded-3xl p-2 flex justify-around items-center z-50 shadow-2xl border-white/10 mb-[env(safe-area-inset-bottom)]">
        {[
          { id: 'home', icon: HomeIcon, label: 'Home' },
          { id: 'history', icon: History, label: 'History' },
          { id: 'directory', icon: LayoutGrid, label: 'Fleet' },
          { id: 'settings', icon: Settings, label: 'Settings' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 px-4 rounded-2xl transition-all duration-300",
              activeTab === item.id ? "bg-primary text-primary-foreground shadow-lg scale-105" : "text-muted-foreground hover:text-white"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      <Toaster />
    </main>
  );
}