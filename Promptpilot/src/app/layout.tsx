
import type {Metadata, Viewport} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SPARK | AI Router & Prompt Optimizer',
  description: 'Describe your task. We pick the best AI, write the perfect prompt, and send you straight there.',
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

import { SessionProvider } from '@/components/providers/SessionProvider';
import { SettingsProvider } from '@/components/providers/SettingsProvider';
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';
import { VantaBackground } from '@/components/3d/VantaBackground';
import { GlobalCursorGlow } from '@/components/effects/GlobalCursorGlow';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-body antialiased bg-background text-foreground selection:bg-accent/30 overflow-x-hidden">
        <SessionProvider>
          <SettingsProvider>
            <SmoothScrollProvider>
              <VantaBackground opacity={0.35} />
              <GlobalCursorGlow />
              <div className="relative z-10">
                {children}
              </div>
            </SmoothScrollProvider>
          </SettingsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

