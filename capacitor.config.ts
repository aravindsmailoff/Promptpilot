import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.promptpilot.app',
  appName: 'PromptPilot',
  webDir: 'out',
  overrideUserAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
  server: {
    androidScheme: 'https',
    cleartext: true,
    url: 'http://10.0.2.2:9002',
    allowNavigation: [
      '10.0.2.2',
      'localhost',
      '*.google.com',
      '*.googleusercontent.com',
      'accounts.google.com'
    ]
  },
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
  }
};

export default config;