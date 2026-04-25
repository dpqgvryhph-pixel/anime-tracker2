import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '../lib/ThemeProvider';

export const metadata: Metadata = {
  title: 'Anime Tracker',
  description: 'Anime statisztika dashboard',
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
