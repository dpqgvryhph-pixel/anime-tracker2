import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '../lib/ThemeProvider';
import ThemeSettings from './ThemeSettings';

export const metadata: Metadata = {
  title: 'Anime Tracker',
  description: 'Anime statisztika dashboard',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'OniAnime',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: '#ff6b35',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <body>
        <ThemeProvider>
          {children}
          <ThemeSettings />
        </ThemeProvider>
      </body>
    </html>
  );
}
