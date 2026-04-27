'use client';
import { useState, useRef } from 'react';
import { useTheme, Theme } from '../lib/ThemeProvider';

const THEMES: { id: Theme; label: string; icon: string }[] = [
  { id: 'dark', label: 'Dark', icon: '🌙' },
  { id: 'modern', label: 'Modern', icon: '✨' },
  { id: 'win95', label: 'Win95', icon: '🖥️' },
  { id: 'ps1', label: 'PS1', icon: '🎮' },
  { id: 'custom', label: 'Egyedi', icon: '🛠️' },
];

export default function ThemeSettings() {
  const { 
    theme, setTheme, bgImage, setBgImage, accentColor, setAccentColor,
    fontFamily, setFontFamily, glassBlur, setGlassBlur, cardOpacity, setCardOpacity, borderRadius, setBorderRadius
  } = useTheme();
  
  const [open, setOpen] = useState(false);
  const [bgUrl, setBgUrl] = useState(bgImage);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setBgImage(result);
      setBgUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const applyBgUrl = () => {
    setBgImage(bgUrl);
  };

  const clearBg = () => {
    setBgImage('');
    setBgUrl('');
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg"
        style={{ background: 'var(--t-accent)', color: '#fff' }}
        title="Megjelenés beállítások"
      >
        🎨
      </button>

      {open && (
        <div
          className="fixed bottom-20 right-4 z-50 glass-panel p-6 rounded-xl w-80 shadow-2xl overflow-y-auto max-h-[80vh]"
          style={{ background: 'var(--t-surface)', border: '1px solid var(--t-border)' }}
        >
          {/* Theme name */}
          <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--t-accent)' }}>⚙️ Megjelenés</h3>

          {/* Theme selector */}
          <div className="mb-4">
            <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--t-dim)' }}>Téma</label>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className="p-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: theme === t.id ? 'var(--t-accent)' : 'var(--t-surface-2)',
                    color: theme === t.id ? '#fff' : 'var(--t-text)',
                    border: theme === t.id ? '2px solid var(--t-accent)' : '2px solid transparent',
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Accent color */}
          <div className="mb-4">
            <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--t-dim)' }}>Kiemelő szín</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0"
                style={{ background: 'none' }}
              />
              <span className="text-sm" style={{ color: 'var(--t-muted)' }}>{accentColor}</span>
              <button
                onClick={() => setAccentColor('#ff6b35')}
                className="ml-auto text-xs px-2 py-1 rounded"
                style={{ background: 'var(--t-surface-2)', color: 'var(--t-dim)' }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Background */}
          <div className="mb-4">
            <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--t-dim)' }}>Háttérkép</label>
            <div className="flex gap-2 mb-2">
              <input
                value={bgUrl.startsWith('data:') ? '' : bgUrl}
                onChange={(e) => setBgUrl(e.target.value)}
                placeholder="URL..."
                className="input-oni flex-1 text-xs px-2"
              />
              <button
                onClick={applyBgUrl}
                className="px-3 py-1 rounded text-xs font-bold"
                style={{ background: 'var(--t-accent)', color: '#fff' }}
              >
                OK
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex-1 py-1 rounded text-xs"
                style={{ background: 'var(--t-surface-2)', color: 'var(--t-text)' }}
              >
                📁 Feltöltés
              </button>
              <button
                onClick={clearBg}
                className="flex-1 py-1 rounded text-xs"
                style={{ background: 'var(--t-surface-2)', color: 'var(--t-dim)' }}
              >
                🗑️ Törlés
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </div>

          {/* Advanced Custom Settings */}
          {theme === 'custom' && (
            <div className="mt-4 pt-4 border-t border-[var(--t-border)]">
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--t-dim)' }}>🔧 Egyedi beállítások</h4>
              
              <div className="mb-3">
                <label className="text-xs flex justify-between mb-1" style={{ color: 'var(--t-text)' }}>
                  <span>Üveg homályosítás (Blur)</span>
                  <span>{glassBlur}px</span>
                </label>
                <input type="range" min="0" max="40" value={glassBlur} onChange={(e) => setGlassBlur(Number(e.target.value))} className="w-full" />
              </div>

              <div className="mb-3">
                <label className="text-xs flex justify-between mb-1" style={{ color: 'var(--t-text)' }}>
                  <span>Kártya átlátszóság</span>
                  <span>{Math.round(cardOpacity * 100)}%</span>
                </label>
                <input type="range" min="0" max="1" step="0.05" value={cardOpacity} onChange={(e) => setCardOpacity(Number(e.target.value))} className="w-full" />
              </div>

              <div className="mb-3">
                <label className="text-xs flex justify-between mb-1" style={{ color: 'var(--t-text)' }}>
                  <span>Lekerekítés (Radius)</span>
                  <span>{borderRadius}px</span>
                </label>
                <input type="range" min="0" max="32" value={borderRadius} onChange={(e) => setBorderRadius(Number(e.target.value))} className="w-full" />
              </div>

              <div className="mb-3">
                <label className="text-xs mb-1 block" style={{ color: 'var(--t-text)' }}>Betűtípus (Font)</label>
                <input 
                  type="text" 
                  value={fontFamily} 
                  onChange={(e) => setFontFamily(e.target.value)} 
                  className="input-oni w-full text-xs p-1"
                  placeholder="pl. 'Inter', 'Outfit', monospace"
                />
              </div>
            </div>
          )}

          <button
            onClick={() => setOpen(false)}
            className="w-full py-2 rounded-lg text-sm font-semibold mt-4"
            style={{ background: 'var(--t-surface-2)', color: 'var(--t-dim)' }}
          >
            Bezár
          </button>
        </div>
      )}
    </>
  );
}
