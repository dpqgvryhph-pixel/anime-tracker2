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
  // Track which properties have been manually overridden
  overrides: Set<string>;
  resetOverride: (key: string) => void;
  resetAllOverrides: () => void;
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
  overrides: new Set(),
  resetOverride: () => {},
  resetAllOverrides: () => {},
});

// Default values per theme (mirrors globals.css)
const THEME_DEFAULTS: Record<Theme, {
  accentColor: string;
  fontFamily: string;
  glassBlur: number;
  cardOpacity: number;
  borderRadius: number;
}> = {
  dark:   { accentColor: '#ff6b35', fontFamily: 'Inter, sans-serif', glassBlur: 12, cardOpacity: 0.9, borderRadius: 6 },
  modern: { accentColor: '#6366f1', fontFamily: 'Inter, sans-serif', glassBlur: 20, cardOpacity: 0.07, borderRadius: 16 },
  win95:  { accentColor: '#000080', fontFamily: "'Courier New', monospace", glassBlur: 0, cardOpacity: 1, borderRadius: 0 },
  ps1:    { accentColor: '#00ffff', fontFamily: "'Courier New', monospace", glassBlur: 0, cardOpacity: 0.9, borderRadius: 0 },
  custom: { accentColor: '#ff6b35', fontFamily: 'Inter, sans-serif', glassBlur: 12, cardOpacity: 0.9, borderRadius: 6 },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [bgImage, setBgImageState] = useState('');
  const [accentColor, setAccentColorState] = useState('#ff6b35');
  const [fontFamily, setFontFamilyState] = useState('Inter, sans-serif');
  const [glassBlur, setGlassBlurState] = useState(12);
  const [cardOpacity, setCardOpacityState] = useState(0.9);
  const [borderRadius, setBorderRadiusState] = useState(6);
  const [overrides, setOverrides] = useState<Set<string>>(new Set());

  // Load all saved settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tracker-theme') as Theme;
    const savedTheme: Theme = saved || 'dark';
    setThemeState(savedTheme);

    const savedBg = localStorage.getItem('tracker-bg') || '';
    setBgImageState(savedBg);

    // Load saved overrides set
    const savedOverridesJson = localStorage.getItem('tracker-overrides');
    const savedOverrides: string[] = savedOverridesJson ? JSON.parse(savedOverridesJson) : [];
    setOverrides(new Set(savedOverrides));

    const defaults = THEME_DEFAULTS[savedTheme];

    // Only load saved values if they were explicitly overridden
    const savedAccent = localStorage.getItem('tracker-accent');
    setAccentColorState(savedAccent || defaults.accentColor);

    const savedFont = localStorage.getItem('tracker-font');
    setFontFamilyState(savedFont || defaults.fontFamily);

    const savedBlur = localStorage.getItem('tracker-blur');
    setGlassBlurState(savedBlur !== null ? Number(savedBlur) : defaults.glassBlur);

    const savedOpacity = localStorage.getItem('tracker-opacity');
    setCardOpacityState(savedOpacity !== null ? Number(savedOpacity) : defaults.cardOpacity);

    const savedRadius = localStorage.getItem('tracker-radius');
    setBorderRadiusState(savedRadius !== null ? Number(savedRadius) : defaults.borderRadius);
  }, []);

  // Apply theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tracker-theme', theme);
  }, [theme]);

  // Apply background image
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

  // Apply accent color (always)
  useEffect(() => {
    document.documentElement.style.setProperty('--t-accent', accentColor);
    localStorage.setItem('tracker-accent', accentColor);
  }, [accentColor]);

  // Apply advanced settings (blur, opacity, radius, font) always — not just for 'custom'
  useEffect(() => {
    document.documentElement.style.setProperty('--t-font', fontFamily);
    document.documentElement.style.setProperty('--t-blur', `${glassBlur}px`);
    document.documentElement.style.setProperty('--t-card-opacity', `${cardOpacity}`);
    document.documentElement.style.setProperty('--t-radius', `${borderRadius}px`);

    localStorage.setItem('tracker-font', fontFamily);
    localStorage.setItem('tracker-blur', String(glassBlur));
    localStorage.setItem('tracker-opacity', String(cardOpacity));
    localStorage.setItem('tracker-radius', String(borderRadius));
  }, [fontFamily, glassBlur, cardOpacity, borderRadius]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    // When switching themes, apply theme defaults for non-overridden properties
    const defaults = THEME_DEFAULTS[t];
    if (!overrides.has('accent')) setAccentColorState(defaults.accentColor);
    if (!overrides.has('font')) setFontFamilyState(defaults.fontFamily);
    if (!overrides.has('blur')) setGlassBlurState(defaults.glassBlur);
    if (!overrides.has('opacity')) setCardOpacityState(defaults.cardOpacity);
    if (!overrides.has('radius')) setBorderRadiusState(defaults.borderRadius);
  };

  const setBgImage = (url: string) => setBgImageState(url);

  const setAccentColor = (c: string) => {
    setAccentColorState(c);
    addOverride('accent');
  };

  const setFontFamily = (f: string) => {
    setFontFamilyState(f);
    addOverride('font');
  };

  const setGlassBlur = (b: number) => {
    setGlassBlurState(b);
    addOverride('blur');
  };

  const setCardOpacity = (o: number) => {
    setCardOpacityState(o);
    addOverride('opacity');
  };

  const setBorderRadius = (r: number) => {
    setBorderRadiusState(r);
    addOverride('radius');
  };

  const addOverride = (key: string) => {
    setOverrides(prev => {
      const next = new Set(prev);
      next.add(key);
      localStorage.setItem('tracker-overrides', JSON.stringify([...next]));
      return next;
    });
  };

  const resetOverride = (key: string) => {
    setOverrides(prev => {
      const next = new Set(prev);
      next.delete(key);
      localStorage.setItem('tracker-overrides', JSON.stringify([...next]));
      return next;
    });
    // Reset to theme default
    const defaults = THEME_DEFAULTS[theme];
    if (key === 'accent') { setAccentColorState(defaults.accentColor); localStorage.removeItem('tracker-accent'); }
    if (key === 'font') { setFontFamilyState(defaults.fontFamily); localStorage.removeItem('tracker-font'); }
    if (key === 'blur') { setGlassBlurState(defaults.glassBlur); localStorage.removeItem('tracker-blur'); }
    if (key === 'opacity') { setCardOpacityState(defaults.cardOpacity); localStorage.removeItem('tracker-opacity'); }
    if (key === 'radius') { setBorderRadiusState(defaults.borderRadius); localStorage.removeItem('tracker-radius'); }
  };

  const resetAllOverrides = () => {
    setOverrides(new Set());
    localStorage.removeItem('tracker-overrides');
    localStorage.removeItem('tracker-accent');
    localStorage.removeItem('tracker-font');
    localStorage.removeItem('tracker-blur');
    localStorage.removeItem('tracker-opacity');
    localStorage.removeItem('tracker-radius');
    const defaults = THEME_DEFAULTS[theme];
    setAccentColorState(defaults.accentColor);
    setFontFamilyState(defaults.fontFamily);
    setGlassBlurState(defaults.glassBlur);
    setCardOpacityState(defaults.cardOpacity);
    setBorderRadiusState(defaults.borderRadius);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, setTheme, bgImage, setBgImage, accentColor, setAccentColor,
      fontFamily, setFontFamily, glassBlur, setGlassBlur, cardOpacity, setCardOpacity,
      borderRadius, setBorderRadius, overrides, resetOverride, resetAllOverrides
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
