import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '../lib/ThemeProvider';

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
      <body className="grid-bg scanlines">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
