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

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/stats'),
      ]);

      if (usersRes.status === 401 || statsRes.status === 401) {
        router.push('/');
        return;
      }

      const usersData = await usersRes.json();
      const statsData = await statsRes.json();

      if (usersData.data) setUsers(usersData.data);
      if (!statsData.error) setStats(statsData);
    } catch (e) {
      setError('Adatok betöltése sikertelen');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    setCreateSuccess('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, display_name: newDisplayName }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreateSuccess(`✓ Felhasználó létrehozva: ${data.data.username}`);
        setNewUsername('');
        setNewDisplayName('');
        loadData();
      } else {
        setCreateError(data.error || 'Hiba történt');
      }
    } catch (e) {
      setCreateError('Hálózati hiba');
    } finally {
      setCreating(false);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return 'Soha';
    return new Date(dateStr).toLocaleString('hu-HU', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  }

  return (
    <div className="min-h-screen px-4 py-8 relative">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,107,53,0.04) 0%, transparent 70%)' }} />
      </div>

      <div className={`max-w-5xl mx-auto transition-all duration-700 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-oni-dim hover:text-oni-text text-sm transition-colors"
              >
                ← Dashboard
              </button>
            </div>
            <h1 className="font-display text-2xl tracking-widest text-white">ADMIN FELÜLET</h1>
            <p className="text-oni-dim text-xs tracking-wider mt-1">Felhasználók kezelése és rendszer áttekintés</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-oni-dim">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Admin mód
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Összes epizód', value: stats.totalEpisodes, icon: '📺' },
              { label: 'Összes megtekintés', value: stats.totalWatched, icon: '👁' },
              { label: 'Regisztrált felhasználók', value: stats.totalUsers, icon: '👥' },
            ].map(stat => (
              <div key={stat.label} className="glass-panel rounded-lg p-5 text-center">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="font-display text-3xl text-white mb-1">{stat.value.toLocaleString('hu-HU')}</div>
                <div className="text-oni-dim text-xs tracking-wider uppercase">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Új felhasználó létrehozása */}
          <div className="glass-panel rounded-lg p-6">
            <h2 className="font-display text-sm tracking-widest text-white mb-4 uppercase">Új felhasználó</h2>
            <p className="text-oni-dim text-xs mb-5 leading-relaxed">
              Új felhasználók automatikusan <span className="text-oni-accent">viewer</span> jogkörrel jönnek létre — csak megtekintési jog, módosítás nélkül.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs text-oni-dim tracking-[0.15em] uppercase mb-2">
                  Felhasználónév *
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="input-oni w-full px-3 py-2.5 rounded text-oni-text font-body text-sm"
                  placeholder="pl. vegfelhasznalo"
                  required
                  minLength={2}
                />
              </div>
              <div>
                <label className="block text-xs text-oni-dim tracking-[0.15em] uppercase mb-2">
                  Megjelenítendő név
                </label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={e => setNewDisplayName(e.target.value)}
                  className="input-oni w-full px-3 py-2.5 rounded text-oni-text font-body text-sm"
                  placeholder="pl. Végfelhasználó"
                />
              </div>

              {createError && (
                <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
                  ✗ {createError}
                </div>
              )}
              {createSuccess && (
                <div className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded px-3 py-2">
                  {createSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={creating}
                className="w-full py-2.5 rounded font-display tracking-widest text-white text-xs transition-all duration-200"
                style={{
                  background: creating ? 'rgba(255,107,53,0.3)' : 'linear-gradient(135deg, #ff6b35, #e85d2c)',
                  boxShadow: creating ? 'none' : '0 0 12px rgba(255,107,53,0.25)',
                }}
              >
                {creating ? 'LÉTREHOZÁS...' : '+ FELHASZNÁLÓ HOZZÁADÁSA'}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-oni-border">
              <div className="flex items-start gap-2">
                <span className="text-yellow-500 text-xs mt-0.5">ℹ</span>
                <p className="text-oni-muted text-xs leading-relaxed">
                  A viewer jogkörű felhasználók csak az adatokat láthatják, de nem módosíthatnak semmit.
                </p>
              </div>
            </div>
          </div>

          {/* Felhasználók listája */}
          <div className="lg:col-span-2 glass-panel rounded-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-sm tracking-widest text-white uppercase">Felhasználók</h2>
              <button
                onClick={loadData}
                className="text-xs text-oni-dim hover:text-oni-text transition-colors px-3 py-1.5 rounded border border-oni-border hover:border-oni-text/30"
              >
                ↻ Frissítés
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 rounded bg-oni-surface-2 animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="text-red-400 text-sm text-center py-8">{error}</div>
            ) : users.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">👤</div>
                <p className="text-oni-dim text-sm">Még nincsenek felhasználók</p>
                <p className="text-oni-muted text-xs mt-1">Adj hozzá egyet a bal oldali formmal</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3.5 rounded border border-oni-border bg-oni-surface-2/50 hover:bg-oni-surface-2 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ background: user.role === 'admin' ? 'rgba(255,107,53,0.2)' : 'rgba(148,163,184,0.1)', color: user.role === 'admin' ? '#ff6b35' : '#94a3b8' }}>
                        {user.display_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-oni-text text-sm font-medium">{user.display_name}</div>
                        <div className="text-oni-muted text-xs">@{user.username}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <div className="text-oni-muted text-xs">Utolsó belépés</div>
                        <div className="text-oni-dim text-xs">{formatDate(user.last_login)}</div>
                      </div>
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{
                          background: user.role === 'admin' ? 'rgba(255,107,53,0.15)' : 'rgba(148,163,184,0.1)',
                          color: user.role === 'admin' ? '#ff6b35' : '#94a3b8',
                          border: `1px solid ${user.role === 'admin' ? 'rgba(255,107,53,0.3)' : 'rgba(148,163,184,0.2)'}`,
                        }}
                      >
                        {user.role === 'admin' ? '⚡ Admin' : '👁 Viewer'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Jogkörök magyarázat */}
        <div className="mt-6 glass-panel rounded-lg p-5">
          <h3 className="font-display text-xs tracking-widest text-white uppercase mb-4">Jogkörök magyarázata</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <span className="text-base">⚡</span>
              <div>
                <div className="text-xs font-medium text-oni-text mb-1">Admin</div>
                <div className="text-xs text-oni-muted leading-relaxed">Teljes hozzáférés: adatok megtekintése, felhasználók kezelése, admin felület elérése. Csak te vagy admin.</div>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-base">👁</span>
              <div>
                <div className="text-xs font-medium text-oni-text mb-1">Viewer (csak megtekintés)</div>
                <div className="text-xs text-oni-muted leading-relaxed">Csak olvasási jog: látja az anime listát és statisztikákat, de nem módosíthat, nem törölhet, és nem érhet el admin funkciókat.</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
