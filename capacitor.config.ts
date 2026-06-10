import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.promptpilot.app',
  appName: 'PromptPilot',
  webDir: 'out',
  overrideUserAgent: 'PromptPilot/1.0 (Android; Mobile)',
  backgroundColor: '#020617',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#020617',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#3b82f6'
    }
  },
  server: {
    url: 'https://drudgingly-unshivered-sarah.ngrok-free.dev',
    cleartext: true
  }
};

export default config;