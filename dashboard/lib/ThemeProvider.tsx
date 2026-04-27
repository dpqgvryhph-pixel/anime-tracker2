'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'dark' | 'win95' | 'ps1' | 'modern' | 'custom';

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  bgImage: string;
  setBgImage: (url: string) => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
  fontFamily: string;
  setFontFamily: (f: string) => void;
  glassBlur: number;
  setGlassBlur: (b: number) => void;
  cardOpacity: number;
  setCardOpacity: (o: number) => void;
  borderRadius: number;
  setBorderRadius: (r: number) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  bgImage: '',
  setBgImage: () => {},
  accentColor: '#ff6b35',
  setAccentColor: () => {},
  fontFamily: 'Inter, sans-serif',
  setFontFamily: () => {},
  glassBlur: 12,
  setGlassBlur: () => {},
  cardOpacity: 0.9,
  setCardOpacity: () => {},
  borderRadius: 6,
  setBorderRadius: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [bgImage, setBgImageState] = useState('');
  const [accentColor, setAccentColorState] = useState('#ff6b35');
  const [fontFamily, setFontFamilyState] = useState('Inter, sans-serif');
  const [glassBlur, setGlassBlurState] = useState(12);
  const [cardOpacity, setCardOpacityState] = useState(0.9);
  const [borderRadius, setBorderRadiusState] = useState(6);

  useEffect(() => {
    const saved = localStorage.getItem('tracker-theme') as Theme;
    if (saved) setThemeState(saved);
    const savedBg = localStorage.getItem('tracker-bg') || '';
    setBgImageState(savedBg);
    const savedAccent = localStorage.getItem('tracker-accent') || '#ff6b35';
    setAccentColorState(savedAccent);
    const savedFont = localStorage.getItem('tracker-font');
    if (savedFont) setFontFamilyState(savedFont);
    const savedBlur = localStorage.getItem('tracker-blur');
    if (savedBlur) setGlassBlurState(Number(savedBlur));
    const savedOpacity = localStorage.getItem('tracker-opacity');
    if (savedOpacity) setCardOpacityState(Number(savedOpacity));
    const savedRadius = localStorage.getItem('tracker-radius');
    if (savedRadius) setBorderRadiusState(Number(savedRadius));
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

  useEffect(() => {
    if (theme === 'custom') {
      document.documentElement.style.setProperty('--t-font', fontFamily);
      document.documentElement.style.setProperty('--t-blur', `${glassBlur}px`);
      document.documentElement.style.setProperty('--t-card-opacity', `${cardOpacity}`);
      document.documentElement.style.setProperty('--t-radius', `${borderRadius}px`);
    } else {
      document.documentElement.style.removeProperty('--t-font');
      document.documentElement.style.removeProperty('--t-blur');
      document.documentElement.style.removeProperty('--t-card-opacity');
      document.documentElement.style.removeProperty('--t-radius');
    }
    localStorage.setItem('tracker-font', fontFamily);
    localStorage.setItem('tracker-blur', String(glassBlur));
    localStorage.setItem('tracker-opacity', String(cardOpacity));
    localStorage.setItem('tracker-radius', String(borderRadius));
  }, [fontFamily, glassBlur, cardOpacity, borderRadius, theme]);

  const setTheme = (t: Theme) => setThemeState(t);
  const setBgImage = (url: string) => setBgImageState(url);
  const setAccentColor = (c: string) => setAccentColorState(c);
  const setFontFamily = (f: string) => setFontFamilyState(f);
  const setGlassBlur = (b: number) => setGlassBlurState(b);
  const setCardOpacity = (o: number) => setCardOpacityState(o);
  const setBorderRadius = (r: number) => setBorderRadiusState(r);

  return (
    <ThemeContext.Provider value={{ 
      theme, setTheme, bgImage, setBgImage, accentColor, setAccentColor,
      fontFamily, setFontFamily, glassBlur, setGlassBlur, cardOpacity, setCardOpacity, borderRadius, setBorderRadius
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
