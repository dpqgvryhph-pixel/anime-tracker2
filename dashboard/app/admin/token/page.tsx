'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TokenPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadToken();
  }, []);

  async function loadToken() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/token');
      if (res.status === 401) { router.push('/'); return; }
      const data = await res.json();
      setToken(data.token || null);
    } catch(e) {
      setToken(null);
    } finally {
      setLoading(false);
    }
  }

  async function copyToken() {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: 'var(--t-bg)', color: 'var(--t-text)' }}>
      <div className={`max-w-lg mx-auto transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="text-sm transition-colors"
            style={{ color: 'var(--t-dim)' }}
          >
            ← Admin
          </button>
        </div>
        <h1 className="font-bold text-2xl tracking-widest mb-2" style={{ color: 'var(--t-text)' }}>API TOKEN</h1>
        <p className="text-xs tracking-wider mb-8" style={{ color: 'var(--t-dim)' }}>
          Az extension ezzel a tokennel kommunikál a websittal. Soha ne oszd meg mással.
        </p>
        <div className="glass-panel p-6 space-y-5">
          <div>
            <label className="block text-xs tracking-[0.15em] uppercase mb-3" style={{ color: 'var(--t-dim)' }}>API Token</label>
            {loading ? (
              <div className="h-12 rounded-lg animate-pulse" style={{ background: 'var(--t-surface-2)' }} />
            ) : token ? (
              <div className="flex gap-2">
                <div
                  className="flex-1 px-4 py-3 rounded-lg font-mono text-sm break-all select-all"
                  style={{ background: 'color-mix(in srgb, var(--t-accent) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--t-accent) 30%, transparent)', color: 'var(--t-accent)' }}
                >
                  {token}
                </div>
                <button
                  onClick={copyToken}
                  className="px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition-all"
                  style={{
                    background: copied ? 'rgba(74,222,128,0.2)' : 'color-mix(in srgb, var(--t-accent) 20%, transparent)',
                    border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : 'color-mix(in srgb, var(--t-accent) 40%, transparent)'}`,
                    color: copied ? '#4ade80' : 'var(--t-accent)'
                  }}
                >
                  {copied ? '✓ Másolva' : 'Másolás'}
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-lg text-sm"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
                ⚠️ EXTENSION_API_TOKEN nincs beállítva! Add hozzá a Cloudflare környezeti változókhoz.
              </div>
            )}
          </div>
          <div className="pt-4" style={{ borderTop: '1px solid var(--t-border)' }}>
            <h3 className="text-xs font-medium mb-3 tracking-wider uppercase" style={{ color: 'var(--t-text)' }}>Hogyan állítsd be az extensionban?</h3>
            <ol className="space-y-2 text-xs" style={{ color: 'var(--t-dim)' }}>
              <li className="flex gap-2"><span className="font-bold" style={{ color: 'var(--t-accent)' }}>1.</span><span>Kattints a böngészőben a Tracker ikonra</span></li>
              <li className="flex gap-2"><span className="font-bold" style={{ color: 'var(--t-accent)' }}>2.</span><span>Másold be a fenti tokent a popup-ban megjelenő mezőbe</span></li>
              <li className="flex gap-2"><span className="font-bold" style={{ color: 'var(--t-accent)' }}>3.</span><span>Kattints a &quot;Mentés&quot; gombra — kész!</span></li>
            </ol>
          </div>
          <div className="p-3 rounded-lg text-xs leading-relaxed"
            style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', color: '#fbbf24' }}>
            <strong>ℹ Biztonság:</strong> A token az extension local storage-ban tárolódik, nem kerül kódba. Ha kompromittált, állíts be új tokent a Cloudflare környezeti változókban.
          </div>
        </div>
      </div>
    </div>
  );
}
