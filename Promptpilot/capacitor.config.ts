import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.promptpilot.app',
  appName: 'PromptPilot',
  webDir: 'out',
  server: {
    // Configured for hosted or local development servers
    url: 'http://localhost:9002',
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: [
      'localhost:9002',
      '10.0.2.2:9002',
      '*.ngrok-free.dev',
      '*.trycloudflare.com',
      '*.firebaseapp.com',
      '*.googleapis.com',
      '*.vercel.app'
    ]
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
