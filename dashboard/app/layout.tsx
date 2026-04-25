import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OniAnime Tracker',
  description: 'Anime statisztika dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <body className="grid-bg scanlines">
        {children}
      </body>
    </html>
  );
}
