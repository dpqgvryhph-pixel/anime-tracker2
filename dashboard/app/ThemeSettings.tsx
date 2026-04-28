'use client';
import { useState, useRef } from 'react';
import { useTheme, Theme } from '../lib/ThemeProvider';

const THEMES: { id: Theme; label: string; icon: string; desc: string }[] = [
  { id: 'dark',   label: 'Dark',   icon: '🌙', desc: 'Sötét, minimál' },
  { id: 'modern', label: 'Modern', icon: '✨', desc: 'Glass morphism' },
  { id: 'win95',  label: 'Win95',  icon: '🖥️', desc: 'Retro Windows' },
  { id: 'ps1',    label: 'PS1',    icon: '🎮', desc: 'Retro CRT' },
  { id: 'custom', label: 'Egyedi', icon: '🛠️', desc: 'Teljesen szabad' },
];

const FONT_PRESETS = [
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Outfit', value: "'Outfit', sans-serif" },
  { label: 'Roboto', value: "'Roboto', sans-serif" },
  { label: 'Courier New', value: "'Courier New', monospace" },
  { label: 'Georgia', value: 'Georgia, serif' },
];

const ACCENT_PRESETS = [
  '#ff6b35', '#6366f1', '#00ffff', '#ff00ff',
  '#22c55e', '#f59e0b', '#ec4899', '#3b82f6',
];

type Tab = 'theme' | 'colors' | 'layout' | 'background';

export default function ThemeSettings() {
  const {
    theme, setTheme, bgImage, setBgImage,
    accentColor, setAccentColor,
    fontFamily, setFontFamily,
    glassBlur, setGlassBlur,
    cardOpacity, setCardOpacity,
    borderRadius, setBorderRadius,
    overrides, resetOverride, resetAllOverrides,
  } = useTheme();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('theme');
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

  const applyBgUrl = () => setBgImage(bgUrl);
  const clearBg = () => { setBgImage(''); setBgUrl(''); };

  const hasAnyOverride = overrides.size > 0;

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'theme',      label: 'Téma',      icon: '🎨' },
    { id: 'colors',     label: 'Színek',    icon: '🎭' },
    { id: 'layout',     label: 'Elrendezés',icon: '📐' },
    { id: 'background', label: 'Háttér',    icon: '🖼️' },
  ];

  return (
    <>
      {/* Floating button */}
      <button
        id="theme-settings-btn"
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95"
        style={{
          background: open
            ? 'var(--t-accent)'
            : 'linear-gradient(135deg, var(--t-accent), color-mix(in srgb, var(--t-accent) 70%, #000))',
          color: '#fff',
          boxShadow: '0 4px 24px color-mix(in srgb, var(--t-accent) 50%, transparent)',
        }}
        title="Megjelenés beállítások"
        aria-label="Megjelenés beállítások megnyitása"
      >
        {open ? '✕' : '🎨'}
        {hasAnyOverride && !open && (
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold"
            style={{ background: '#f59e0b', color: '#000' }}
          >
            {overrides.size}
          </span>
        )}
      </button>

      {/* Settings panel */}
      {open && (
        <div
          id="theme-settings-panel"
          className="fixed bottom-20 right-4 z-50 rounded-2xl w-84 shadow-2xl overflow-hidden"
          style={{
            background: 'var(--t-surface)',
            border: '1px solid var(--t-border)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            width: '340px',
          }}
        >
          {/* Header */}
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--t-border)' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">⚙️</span>
              <span className="font-bold text-sm" style={{ color: 'var(--t-text)' }}>Megjelenés</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'color-mix(in srgb, var(--t-accent) 20%, transparent)', color: 'var(--t-accent)' }}
              >
                {THEMES.find(t => t.id === theme)?.icon} {THEMES.find(t => t.id === theme)?.label}
              </span>
            </div>
            {hasAnyOverride && (
              <button
                onClick={resetAllOverrides}
                className="text-xs px-2 py-1 rounded-lg transition-all hover:opacity-80"
                style={{ background: 'color-mix(in srgb, #ef4444 15%, transparent)', color: '#ef4444' }}
                title="Összes egyéni beállítás visszaállítása"
              >
                Reset all
              </button>
            )}
          </div>

          {/* Tab bar */}
          <div
            className="flex"
            style={{ borderBottom: '1px solid var(--t-border)', background: 'var(--t-surface-2)' }}
          >
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-1 py-2 text-xs font-medium transition-all"
                style={{
                  color: tab === t.id ? 'var(--t-accent)' : 'var(--t-dim)',
                  borderBottom: tab === t.id ? '2px solid var(--t-accent)' : '2px solid transparent',
                  background: 'transparent',
                }}
                title={t.label}
              >
                {t.icon}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-5 overflow-y-auto" style={{ maxHeight: '60vh' }}>

            {/* ====== TÉMA TAB ====== */}
            {tab === 'theme' && (
              <div>
                <p className="text-xs mb-3" style={{ color: 'var(--t-dim)' }}>Válassz egy előre definiált témát, majd testreszabhatod a többi fülön.</p>
                <div className="grid grid-cols-1 gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                      style={{
                        background: theme === t.id
                          ? 'color-mix(in srgb, var(--t-accent) 15%, transparent)'
                          : 'var(--t-surface-2)',
                        border: theme === t.id
                          ? '1.5px solid var(--t-accent)'
                          : '1.5px solid transparent',
                        color: 'var(--t-text)',
                      }}
                    >
                      <span className="text-2xl">{t.icon}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{t.label}</div>
                        <div className="text-xs" style={{ color: 'var(--t-dim)' }}>{t.desc}</div>
                      </div>
                      {theme === t.id && (
                        <span style={{ color: 'var(--t-accent)' }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-3 text-center" style={{ color: 'var(--t-muted)' }}>
                  💡 Minden témán belül testreszabhatod a színeket, elrendezést és hátteret
                </p>
              </div>
            )}

            {/* ====== SZÍNEK TAB ====== */}
            {tab === 'colors' && (
              <div className="space-y-5">
                {/* Accent color */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold" style={{ color: 'var(--t-dim)' }}>
                      🎨 Kiemelő szín
                    </label>
                    {overrides.has('accent') && (
                      <button
                        onClick={() => resetOverride('accent')}
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: 'color-mix(in srgb, #ef4444 15%, transparent)', color: '#ef4444' }}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  {/* Presets */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {ACCENT_PRESETS.map(color => (
                      <button
                        key={color}
                        onClick={() => setAccentColor(color)}
                        className="w-7 h-7 rounded-lg transition-all hover:scale-110"
                        style={{
                          background: color,
                          outline: accentColor === color ? '2px solid #fff' : '2px solid transparent',
                          outlineOffset: '2px',
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                  {/* Custom color picker */}
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0.5"
                      style={{ background: 'var(--t-surface-2)' }}
                    />
                    <span
                      className="text-xs font-mono flex-1 px-2 py-1 rounded-lg"
                      style={{ background: 'var(--t-surface-2)', color: 'var(--t-text)' }}
                    >
                      {accentColor}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ====== ELRENDEZÉS TAB ====== */}
            {tab === 'layout' && (
              <div className="space-y-5">
                {/* Blur */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold" style={{ color: 'var(--t-dim)' }}>
                      Üveg blur
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono" style={{ color: 'var(--t-accent)' }}>{glassBlur}px</span>
                      {overrides.has('blur') && (
                        <button
                          onClick={() => resetOverride('blur')}
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: 'color-mix(in srgb, #ef4444 15%, transparent)', color: '#ef4444' }}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="range" min="0" max="40" value={glassBlur}
                    onChange={(e) => setGlassBlur(Number(e.target.value))}
                    className="w-full accent-[var(--t-accent)]"
                    style={{ accentColor: 'var(--t-accent)' }}
                  />
                  <div className="flex justify-between text-[10px] mt-0.5" style={{ color: 'var(--t-muted)' }}>
                    <span>Nincs</span><span>Erős</span>
                  </div>
                </div>

                {/* Card Opacity */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold" style={{ color: 'var(--t-dim)' }}>
                      Kártya átlátszóság
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono" style={{ color: 'var(--t-accent)' }}>{Math.round(cardOpacity * 100)}%</span>
                      {overrides.has('opacity') && (
                        <button
                          onClick={() => resetOverride('opacity')}
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: 'color-mix(in srgb, #ef4444 15%, transparent)', color: '#ef4444' }}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.05" value={cardOpacity}
                    onChange={(e) => setCardOpacity(Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: 'var(--t-accent)' }}
                  />
                  <div className="flex justify-between text-[10px] mt-0.5" style={{ color: 'var(--t-muted)' }}>
                    <span>Áttetsző</span><span>Tömör</span>
                  </div>
                </div>

                {/* Border Radius */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold" style={{ color: 'var(--t-dim)' }}>
                      Sarkok lekerekítése
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono" style={{ color: 'var(--t-accent)' }}>{borderRadius}px</span>
                      {overrides.has('radius') && (
                        <button
                          onClick={() => resetOverride('radius')}
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: 'color-mix(in srgb, #ef4444 15%, transparent)', color: '#ef4444' }}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="range" min="0" max="32" value={borderRadius}
                    onChange={(e) => setBorderRadius(Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: 'var(--t-accent)' }}
                  />
                  <div className="flex justify-between text-[10px] mt-0.5" style={{ color: 'var(--t-muted)' }}>
                    <span>Szögletes</span><span>Lekerekített</span>
                  </div>
                </div>

                {/* Font */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold" style={{ color: 'var(--t-dim)' }}>
                      Betűtípus
                    </label>
                    {overrides.has('font') && (
                      <button
                        onClick={() => resetOverride('font')}
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: 'color-mix(in srgb, #ef4444 15%, transparent)', color: '#ef4444' }}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {FONT_PRESETS.map(fp => (
                      <button
                        key={fp.value}
                        onClick={() => setFontFamily(fp.value)}
                        className="py-1.5 px-2 rounded-lg text-xs transition-all text-left"
                        style={{
                          fontFamily: fp.value,
                          background: fontFamily === fp.value
                            ? 'color-mix(in srgb, var(--t-accent) 20%, transparent)'
                            : 'var(--t-surface-2)',
                          color: fontFamily === fp.value ? 'var(--t-accent)' : 'var(--t-text)',
                          border: fontFamily === fp.value ? '1px solid var(--t-accent)' : '1px solid transparent',
                        }}
                      >
                        {fp.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    placeholder="Egyedi: pl. 'Outfit', sans-serif"
                    className="w-full text-xs px-3 py-2 rounded-lg outline-none"
                    style={{
                      background: 'var(--t-input-bg)',
                      border: '1px solid var(--t-border)',
                      color: 'var(--t-text)',
                      fontFamily: fontFamily,
                    }}
                  />
                </div>

                {/* Live preview */}
                <div
                  className="rounded-xl p-4 text-center"
                  style={{
                    background: 'var(--t-card-bg)',
                    border: '1px solid var(--t-border)',
                    backdropFilter: `blur(${glassBlur}px)`,
                    borderRadius: `${borderRadius}px`,
                    fontFamily: fontFamily,
                  }}
                >
                  <div className="text-xs font-bold mb-1" style={{ color: 'var(--t-accent)' }}>Előnézet</div>
                  <div className="text-sm" style={{ color: 'var(--t-text)' }}>Így néz ki a kártya</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--t-dim)' }}>Anime · Epizód · Idő</div>
                </div>
              </div>
            )}

            {/* ====== HÁTTÉR TAB ====== */}
            {tab === 'background' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--t-dim)' }}>
                    🌐 URL megadása
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={bgUrl.startsWith('data:') ? '' : bgUrl}
                      onChange={(e) => setBgUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 text-xs px-3 py-2 rounded-lg outline-none"
                      style={{
                        background: 'var(--t-input-bg)',
                        border: '1px solid var(--t-border)',
                        color: 'var(--t-text)',
                      }}
                    />
                    <button
                      onClick={applyBgUrl}
                      className="px-3 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                      style={{ background: 'var(--t-accent)', color: '#fff' }}
                    >
                      OK
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                    style={{ background: 'var(--t-surface-2)', color: 'var(--t-text)' }}
                  >
                    📁 Kép feltöltése
                  </button>
                  <button
                    onClick={clearBg}
                    className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                    style={{ background: 'var(--t-surface-2)', color: 'var(--t-dim)' }}
                  >
                    🗑️ Törlés
                  </button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                {bgImage && (
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ border: '1px solid var(--t-border)' }}
                  >
                    <img
                      src={bgImage.startsWith('data:') ? bgImage : bgImage}
                      alt="Háttérkép előnézet"
                      className="w-full h-20 object-cover"
                    />
                    <div className="px-3 py-2 text-xs" style={{ color: 'var(--t-dim)' }}>
                      ✅ Háttérkép aktív
                    </div>
                  </div>
                )}
                {!bgImage && (
                  <div
                    className="rounded-xl p-4 text-center text-xs"
                    style={{ background: 'var(--t-surface-2)', color: 'var(--t-muted)', border: '1px dashed var(--t-border)' }}
                  >
                    Nincs háttérkép beállítva
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer */}
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--t-border)', background: 'var(--t-surface-2)' }}
          >
            <span className="text-xs" style={{ color: 'var(--t-muted)' }}>
              Beállítások automatikusan mentve
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80"
              style={{ background: 'var(--t-surface)', color: 'var(--t-dim)', border: '1px solid var(--t-border)' }}
            >
              Bezár
            </button>
          </div>
        </div>
      )}
    </>
  );
}
