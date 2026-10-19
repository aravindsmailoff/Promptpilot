"use client";

import { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { HomeTab } from '@/components/prompt-pilot/HomeTab';
import { DirectoryTab } from '@/components/prompt-pilot/DirectoryTab';
import { SettingsTab } from '@/components/prompt-pilot/SettingsTab';
import { HistoryTab } from '@/components/prompt-pilot/HistoryTab';
import { ContextPilotTab } from '@/components/contextpilot/ContextPilotTab';
import { CompanyGrowthOS } from '@/components/prompt-pilot/CompanyGrowthOS';
import { Toaster } from '@/components/ui/toaster';
import { 
  Zap, 
  Rocket, 
  Brain, 
  History as HistoryIcon, 
  LayoutGrid, 
  Settings as SettingsIcon,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [relaunchTask, setRelaunchTask] = useState<string | null>(null);

  const handleRelaunch = (task: string) => {
    setRelaunchTask(task);
    setActiveTab('home');
  };

  const navItems = [
    { id: 'home', label: 'Prompt', icon: Zap, color: '#00f2ff' },
    { id: 'growth', label: 'Startup', icon: Rocket, color: '#a855f7' },
    { id: 'context', label: 'CRM', icon: Brain, color: '#3b82f6' },
    { id: 'directory', label: 'Fleet', icon: LayoutGrid, color: '#10b981' },
    { id: 'history', label: 'History', icon: HistoryIcon, color: '#f59e0b' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, color: '#64748b' },
  ];

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[#020617] text-foreground overflow-hidden select-none antialiased">
      
      {/* ======================================================== */}
      {/* NATIVE REACT NATIVE STYLE APP HEADER                     */}
      {/* ======================================================== */}
      <header className="flex-none w-full bg-[#070b16]/95 backdrop-blur-2xl border-b border-white/10 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* App Brand & Logo */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
              <Sparkles className="h-5 w-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-lg font-black tracking-tight text-white">SPARK</span>
                <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  2.0
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wide mt-0.5 block">
                Neural Mobile Engine
              </span>
            </div>
          </div>

          {/* Native Status Badge & Quick Actions */}
          <div className="flex items-center gap-2">
            <div 
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-bold text-cyan-300 tracking-wide">
                RTX GPU
              </span>
            </div>

            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.location.reload();
              }}
              title="Refresh Engine"
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white active:rotate-180 transition-all duration-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* NATIVE SCROLLABLE SCREEN CONTAINER                       */}
      {/* ======================================================== */}
      <main className="flex-1 overflow-y-auto overscroll-none px-3 md:px-6 pt-4 pb-28 md:pb-24 no-scrollbar">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <AnimatePresence mode="wait">
              {activeTab === 'home' && (
                <TabsContent value="home" className="mt-0 outline-none" forceMount>
                  <motion.div
                    key="home"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <HomeTab relaunchTask={relaunchTask} clearRelaunchTask={() => setRelaunchTask(null)} />
                  </motion.div>
                </TabsContent>
              )}

              {activeTab === 'growth' && (
                <TabsContent value="growth" className="mt-0 outline-none" forceMount>
                  <motion.div
                    key="growth"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <CompanyGrowthOS onOpenModule={() => setActiveTab('home')} />
                  </motion.div>
                </TabsContent>
              )}

              {activeTab === 'context' && (
                <TabsContent value="context" className="mt-0 outline-none" forceMount>
                  <motion.div
                    key="context"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <ContextPilotTab />
                  </motion.div>
                </TabsContent>
              )}

              {activeTab === 'history' && (
                <TabsContent value="history" className="mt-0 outline-none" forceMount>
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <HistoryTab onRelaunch={handleRelaunch} />
                  </motion.div>
                </TabsContent>
              )}

              {activeTab === 'directory' && (
                <TabsContent value="directory" className="mt-0 outline-none" forceMount>
                  <motion.div
                    key="directory"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <DirectoryTab />
                  </motion.div>
                </TabsContent>
              )}
              
              {activeTab === 'settings' && (
                <TabsContent value="settings" className="mt-0 outline-none" forceMount>
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <SettingsTab />
                  </motion.div>
                </TabsContent>
              )}
            </AnimatePresence>
          </Tabs>
        </div>
      </main>

      {/* ======================================================== */}
      {/* NATIVE REACT NATIVE BOTTOM TAB BAR                       */}
      {/* ======================================================== */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#060a17]/95 backdrop-blur-2xl border-t border-white/10 px-2 pt-2 pb-[max(env(safe-area-inset-bottom,0px),10px)] shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 active:scale-90",
                  isActive ? "text-cyan-400" : "text-slate-400 hover:text-slate-200"
                )}
              >
                <div className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute -inset-1.5 bg-cyan-500/20 rounded-xl -z-10 border border-cyan-500/30"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    />
                  )}
                  <Icon className={cn("h-5 w-5 transition-transform", isActive ? "scale-110 stroke-[2.5]" : "stroke-[1.8]")} />
                </div>
                <span className={cn(
                  "text-[10px] font-bold mt-1 tracking-wider uppercase transition-colors",
                  isActive ? "text-cyan-300 font-black" : "text-slate-400"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <Toaster />
    </div>
  );
}