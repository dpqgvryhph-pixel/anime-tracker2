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
    <div className="min-h-screen px-4 py-8">
      <div className={`max-w-lg mx-auto transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push('/admin')} className="text-oni-dim hover:text-oni-text text-sm transition-colors">
            ← Admin
          </button>
        </div>

        <h1 className="font-display text-2xl tracking-widest text-white mb-2">API TOKEN</h1>
        <p className="text-oni-dim text-xs tracking-wider mb-8">
          Az extension ezzel a tokennel kommunikál a websittal. Soha ne oszd meg mással.
        </p>

        <div className="glass-panel rounded-lg p-6 space-y-5">

          {/* Token megjelenítés */}
          <div>
            <label className="block text-xs text-oni-dim tracking-[0.15em] uppercase mb-3">API Token</label>
            {loading ? (
              <div className="h-12 rounded bg-oni-surface-2 animate-pulse" />
            ) : token ? (
              <div className="flex gap-2">
                <div
                  className="flex-1 px-4 py-3 rounded font-mono text-xs break-all"
                  style={{ background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.2)', color: '#ff6b35' }}
                >
                  {token}
                </div>
                <button
                  onClick={copyToken}
                  className="px-4 py-2 rounded text-xs font-display tracking-wider text-white transition-all"
                  style={{ background: copied ? 'rgba(74,222,128,0.2)' : 'rgba(255,107,53,0.15)', border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : 'rgba(255,107,53,0.3)'}`, color: copied ? '#4ade80' : '#ff6b35' }}
                >
                  {copied ? '✓ Másolva' : 'Másolás'}
                </button>
              </div>
            ) : (
              <div className="text-red-400 text-sm">
                EXTENSION_API_TOKEN nincs beállítva! Add hozzá a Vercel környezeti változókhoz.
              </div>
            )}
          </div>

          {/* Beállítási útmutató */}
          <div className="pt-4 border-t border-oni-border">
            <h3 className="text-xs text-oni-text font-medium mb-3 tracking-wider uppercase">Hogyan állítsd be az extensionban?</h3>
            <ol className="space-y-2 text-xs text-oni-dim">
              <li className="flex gap-2"><span className="text-oni-accent font-bold">1.</span><span>Kattints a böngészőben a OniAnime Tracker ikonra</span></li>
              <li className="flex gap-2"><span className="text-oni-accent font-bold">2.</span><span>Másold be a tokent a popup-ban megjelenő mezőbe</span></li>
              <li className="flex gap-2"><span className="text-oni-accent font-bold">3.</span><span>Kattints a "Mentés" gombra — kész!</span></li>
            </ol>
          </div>

          <div className="p-3 rounded text-xs text-yellow-400/80 leading-relaxed"
            style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)' }}>
            <strong>ℹ Biztonság:</strong> A token az extension local storage-ban tárolódik, nem kerül kódba. Ha kompromittált, állíts be új tokent a Vercel környezeti változókban.
          </div>
        </div>
      </div>
    </div>
  );
}
