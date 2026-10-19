"use client"

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HomeTab } from '@/components/prompt-pilot/HomeTab';
import { DirectoryTab } from '@/components/prompt-pilot/DirectoryTab';
import { SettingsTab } from '@/components/prompt-pilot/SettingsTab';
import { HistoryTab } from '@/components/prompt-pilot/HistoryTab';
import { ContextPilotTab } from '@/components/contextpilot/ContextPilotTab';
import { CompanyGrowthOS } from '@/components/prompt-pilot/CompanyGrowthOS';
import { Toaster } from '@/components/ui/toaster';
import { Home as HomeIcon, LayoutGrid, Settings, History, Brain, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spotlight } from '@/components/aceternity/Spotlight';
import { FloatingNavbar } from '@/components/watermelon-ui/FloatingNavbar';

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [relaunchTask, setRelaunchTask] = useState<string | null>(null);

  const handleRelaunch = (task: string) => {
    setRelaunchTask(task);
    setActiveTab('home');
  };

  return (
    <main className="min-h-screen bg-background pb-32 md:pb-0 overflow-x-hidden relative">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#00f2ff" />
      
      {/* Watermelon UI Floating Glass Command Bar */}
      <FloatingNavbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8 md:pt-12">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="home" className="mt-0 outline-none">
            <HomeTab relaunchTask={relaunchTask} clearRelaunchTask={() => setRelaunchTask(null)} />
          </TabsContent>

          <TabsContent value="growth" className="mt-0 outline-none">
            <CompanyGrowthOS onOpenModule={() => setActiveTab('home')} />
          </TabsContent>

          <TabsContent value="context" className="mt-0 outline-none">
            <ContextPilotTab />
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
          { id: 'growth', icon: Sparkles, label: 'Growth' },
          { id: 'context', icon: Brain, label: 'CRM' },
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