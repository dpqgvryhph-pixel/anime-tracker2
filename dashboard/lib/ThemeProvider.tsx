'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'dark' | 'win95' | 'ps1' | 'modern';

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  bgImage: string;
  setBgImage: (url: string) => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  bgImage: '',
  setBgImage: () => {},
  accentColor: '#ff6b35',
  setAccentColor: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [bgImage, setBgImageState] = useState('');
  const [accentColor, setAccentColorState] = useState('#ff6b35');

  useEffect(() => {
    const saved = localStorage.getItem('tracker-theme') as Theme;
    if (saved) setThemeState(saved);
    const savedBg = localStorage.getItem('tracker-bg') || '';
    setBgImageState(savedBg);
    const savedAccent = localStorage.getItem('tracker-accent') || '#ff6b35';
    setAccentColorState(savedAccent);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tracker-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (bgImage) {
      document.body.style.backgroundImage = `url(${bgImage})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      document.body.style.backgroundImage = '';
    }
    localStorage.setItem('tracker-bg', bgImage);
  }, [bgImage]);

  useEffect(() => {
    document.documentElement.style.setProperty('--t-accent', accentColor);
    localStorage.setItem('tracker-accent', accentColor);
  }, [accentColor]);

  const setTheme = (t: Theme) => setThemeState(t);
  const setBgImage = (url: string) => setBgImageState(url);
  const setAccentColor = (c: string) => setAccentColorState(c);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, bgImage, setBgImage, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
