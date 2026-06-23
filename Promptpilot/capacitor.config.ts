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
    url: 'http://localhost:9002',
    cleartext: true,
    allowNavigation: [
      'localhost:9002',
      'localhost:*',
      '127.0.0.1:9002',
      '127.0.0.1:*',
      '10.0.2.2:9002',
      '10.0.2.2:*',
      '*.google.com',
      '*.googleusercontent.com',
      'accounts.google.com'
    ]
  }
};

export default config;