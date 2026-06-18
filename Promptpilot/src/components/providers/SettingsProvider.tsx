'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AppSettings {
  instantCopy: boolean;
  toneProfile: string;
  manualModelOverride: boolean;
  useOllama: boolean;
  ollamaBaseUrl: string;
  ollamaModel: string;
  localEngine: 'ollama' | 'python';
  pythonServerUrl: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  instantCopy: true,
  toneProfile: 'professional',
  manualModelOverride: false,
  useOllama: true,
  ollamaBaseUrl: 'http://127.0.0.1:11434',
  ollamaModel: 'gemma2:2b',
  localEngine: 'ollama',
  pythonServerUrl: 'http://127.0.0.1:8000'
};

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  setAllSettings: (settings: AppSettings) => void;
  isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage and server on mount
  useEffect(() => {
    async function loadSettings() {
      let finalSettings = { ...DEFAULT_SETTINGS };
      try {
        const stored = localStorage.getItem('promptpilot_settings');
        if (stored) {
          finalSettings = { ...finalSettings, ...JSON.parse(stored) };
        }
        
        const res = await fetch('/api/settings');
        if (res.ok) {
          const serverSettings = await res.json();
          finalSettings = { ...finalSettings, ...serverSettings };
          localStorage.setItem('promptpilot_settings', JSON.stringify(finalSettings));
        }
      } catch (e) {
        console.warn('Failed to load settings:', e);
      } finally {
        setSettings(finalSettings);
        setIsLoaded(true);
      }
    }
    loadSettings();
  }, []);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem('promptpilot_settings', JSON.stringify(updated));
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        }).catch(err => console.warn('Failed to sync settings to server:', err));
      } catch (e) {
        console.warn('Failed to save settings to localStorage:', e);
      }
      return updated;
    });
  };

  const setAllSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('promptpilot_settings', JSON.stringify(newSettings));
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      }).catch(err => console.warn('Failed to sync settings to server:', err));
    } catch (e) {
      console.warn('Failed to save settings to localStorage:', e);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, setAllSettings, isLoaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
