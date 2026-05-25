import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.promptpilot.app',
  appName: 'PromptPilot',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true,
    url: 'http://localhost:9002',
    allowNavigation: [
      'localhost:9002',
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