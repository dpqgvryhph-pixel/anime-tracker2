'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'Hibás adatok');
      }
    } catch {
      setError('Hálózati hiba');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,107,53,0.06) 0%, transparent 70%)' }} />
      </div>

      <div className={`w-full max-w-md transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded bg-oni-accent flex items-center justify-center text-white font-display text-lg">
              鬼
            </div>
            <span className="font-display text-4xl tracking-widest text-white glow-text">ONIANIME</span>
          </div>
          <p className="text-oni-dim text-sm tracking-[0.3em] uppercase font-body">Tracker Dashboard</p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-lg p-8 relative login-card corner-tl corner-br">
          <h2 className="font-display text-2xl tracking-widest text-white mb-1">BEJELENTKEZÉS</h2>
          <p className="text-oni-dim text-xs mb-8 tracking-wider">Csak te férhetsz hozzá az adataidhoz</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs text-oni-dim tracking-[0.2em] uppercase mb-2">
                Felhasználónév
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="input-oni w-full px-4 py-3 rounded text-oni-text font-body text-sm"
                placeholder="felhasználónév"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs text-oni-dim tracking-[0.2em] uppercase mb-2">
                Jelszó
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-oni w-full px-4 py-3 rounded text-oni-text font-body text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="text-center py-2 px-4 rounded text-xs text-red-400 bg-red-400/10 border border-red-400/20">
                ✗ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded font-display tracking-widest text-white text-sm transition-all duration-200 relative overflow-hidden"
              style={{
                background: loading ? 'rgba(255,107,53,0.4)' : 'linear-gradient(135deg, #ff6b35, #e85d2c)',
                boxShadow: loading ? 'none' : '0 0 20px rgba(255,107,53,0.3)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  BETÖLTÉS...
                </span>
              ) : 'BELÉPÉS'}
            </button>
          </form>

          {/* Bottom decoration */}
          <div className="mt-8 pt-6 border-t border-oni-border flex justify-between text-xs text-oni-muted">
            <span>OniAnime Tracker v2.2</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Online
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
