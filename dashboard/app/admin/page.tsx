'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  display_name: string;
  role: 'admin' | 'viewer';
  created_at: string;
  last_login: string | null;
}

interface Stats {
  totalEpisodes: number;
  totalUsers: number;
  totalWatched: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); loadData(); }, []);

  async function loadData() {
    setLoading(true); setError('');
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/stats'),
      ]);
      if (usersRes.status === 401 || statsRes.status === 401) { router.push('/'); return; }
      const usersData = await usersRes.json();
      const statsData = await statsRes.json();
      if (usersData.users) setUsers(usersData.users);
      if (!statsData.error) setStats(statsData);
    } catch { setError('Adatok betöltése sikertelen'); }
    finally { setLoading(false); }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true); setCreateError(''); setCreateSuccess('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, display_name: newDisplayName }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreateSuccess(`✓ Létrehozva: ${data.user.username}`);
        setNewUsername(''); setNewDisplayName('');
        loadData();
      } else { setCreateError(data.error || 'Hiba történt'); }
    } catch { setCreateError('Hálózati hiba'); }
    finally { setCreating(false); }
  }

  function formatDate(d: string | null) {
    if (!d) return 'Soha';
    return new Date(d).toLocaleString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="min-h-screen px-4 py-8 relative" style={{ background: 'var(--t-bg)', color: 'var(--t-text)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--t-accent) 4%, transparent) 0%, transparent 70%)' }} />
      </div>

      <div className={`max-w-5xl mx-auto transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="mb-1">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm transition-colors"
                style={{ color: 'var(--t-dim)' }}
              >
                ← Dashboard
              </button>
            </div>
            <h1 className="font-bold text-2xl tracking-widest" style={{ color: 'var(--t-text)' }}>ADMIN FELÜLET</h1>
            <p className="text-xs tracking-wider mt-1" style={{ color: 'var(--t-dim)' }}>Felhasználók kezelése és rendszer áttekintés</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/token')}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ border: '1px solid var(--t-border)', color: 'var(--t-dim)' }}
            >
              🔑 API Token
            </button>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--t-dim)' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
              Admin mód
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Összes epizód', value: stats.totalEpisodes, icon: '📺' },
              { label: 'Összes megtekintés', value: stats.totalWatched, icon: '👁' },
              { label: 'Felhasználók', value: stats.totalUsers, icon: '👥' },
            ].map(s => (
              <div key={s.label} className="glass-panel p-5 text-center">
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="text-3xl font-bold mb-1" style={{ color: 'var(--t-text)' }}>{s.value.toLocaleString('hu-HU')}</div>
                <div className="text-xs tracking-wider uppercase" style={{ color: 'var(--t-dim)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Új felhasználó */}
          <div className="glass-panel p-6">
            <h2 className="font-bold text-sm tracking-widest uppercase mb-3" style={{ color: 'var(--t-text)' }}>Új felhasználó</h2>
            <p className="text-xs mb-5 leading-relaxed" style={{ color: 'var(--t-dim)' }}>
              Új felhasználók <span style={{ color: 'var(--t-accent)' }}>viewer</span> jogkörrel jönnek létre — csak olvasás.
            </p>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--t-dim)' }}>Felhasználónév *</label>
                <input
                  type="text" value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="input-t w-full px-3 py-2.5 text-sm"
                  placeholder="pl. vegfelhasznalo" required minLength={2}
                />
              </div>
              <div>
                <label className="block text-xs tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--t-dim)' }}>Megjelenítendő név</label>
                <input
                  type="text" value={newDisplayName}
                  onChange={e => setNewDisplayName(e.target.value)}
                  className="input-t w-full px-3 py-2.5 text-sm"
                  placeholder="pl. Végfelhasználó"
                />
              </div>
              {createError && (
                <div className="text-xs rounded px-3 py-2" style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  ✗ {createError}
                </div>
              )}
              {createSuccess && (
                <div className="text-xs rounded px-3 py-2" style={{ color: '#4ade80', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  {createSuccess}
                </div>
              )}
              <button
                type="submit" disabled={creating}
                className="w-full py-2.5 rounded-lg font-bold tracking-widest text-white text-xs transition-all"
                style={{
                  background: creating
                    ? 'color-mix(in srgb, var(--t-accent) 30%, transparent)'
                    : 'linear-gradient(135deg, var(--t-accent), color-mix(in srgb, var(--t-accent) 70%, #000))',
                  boxShadow: creating ? 'none' : '0 0 12px color-mix(in srgb, var(--t-accent) 25%, transparent)',
                }}
              >
                {creating ? 'LÉTREHOZÁS...' : '+ HOZZÁADÁS'}
              </button>
            </form>
          </div>

          {/* Felhasználók listája */}
          <div className="lg:col-span-2 glass-panel p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-sm tracking-widest uppercase" style={{ color: 'var(--t-text)' }}>Felhasználók</h2>
              <button
                onClick={loadData}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--t-dim)', border: '1px solid var(--t-border)' }}
              >
                ↻ Frissítés
              </button>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_,i) => (
                  <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: 'var(--t-surface-2)' }} />
                ))}
              </div>
            ) : error ? (
              <div className="text-sm text-center py-8" style={{ color: '#f87171' }}>{error}</div>
            ) : users.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">👤</div>
                <p className="text-sm" style={{ color: 'var(--t-dim)' }}>Még nincsenek felhasználók</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map(u => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3.5 rounded-lg transition-colors"
                    style={{ border: '1px solid var(--t-border)', background: 'var(--t-surface-2)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{
                          background: u.role === 'admin'
                            ? 'color-mix(in srgb, var(--t-accent) 20%, transparent)'
                            : 'rgba(148,163,184,0.1)',
                          color: u.role === 'admin' ? 'var(--t-accent)' : '#94a3b8',
                        }}
                      >
                        {u.display_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>{u.display_name}</div>
                        <div className="text-xs" style={{ color: 'var(--t-muted)' }}>@{u.username}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs" style={{ color: 'var(--t-muted)' }}>Utolsó belépés</div>
                        <div className="text-xs" style={{ color: 'var(--t-dim)' }}>{formatDate(u.last_login)}</div>
                      </div>
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{
                          background: u.role === 'admin'
                            ? 'color-mix(in srgb, var(--t-accent) 15%, transparent)'
                            : 'rgba(148,163,184,0.1)',
                          color: u.role === 'admin' ? 'var(--t-accent)' : '#94a3b8',
                          border: `1px solid ${u.role === 'admin' ? 'color-mix(in srgb, var(--t-accent) 30%, transparent)' : 'rgba(148,163,184,0.2)'}`,
                        }}
                      >
                        {u.role === 'admin' ? '⚡ Admin' : '👁 Viewer'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Jogkörök */}
        <div className="mt-6 glass-panel p-5">
          <h3 className="font-bold text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--t-text)' }}>Jogkörök</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <span>⚡</span>
              <div>
                <div className="text-xs font-medium mb-1" style={{ color: 'var(--t-text)' }}>Admin</div>
                <div className="text-xs leading-relaxed" style={{ color: 'var(--t-muted)' }}>Teljes hozzáférés: adatok, felhasználók, API token, admin felület.</div>
              </div>
            </div>
            <div className="flex gap-3">
              <span>👁</span>
              <div>
                <div className="text-xs font-medium mb-1" style={{ color: 'var(--t-text)' }}>Viewer (csak megtekintés)</div>
                <div className="text-xs leading-relaxed" style={{ color: 'var(--t-muted)' }}>Látja az anime listát, nem módosíthat, nem érhet el admin funkciókat.</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
