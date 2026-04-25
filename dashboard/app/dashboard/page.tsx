'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface WatchedEpisode {
  id: number;
  show_id: number;
  episode: number;
  anime_title: string | null;
  watched_count: number;
  duration_minutes: number;
  first_watched: string;
  last_watched: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<WatchedEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'last_watched' | 'anime_title' | 'watched_count'>('last_watched');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/data');
      if (res.status === 401) {
        router.push('/');
        return;
      }
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json.data || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Hiba az adatok betöltésekor');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = data
    .filter(ep => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        (ep.anime_title || '').toLowerCase().includes(s) ||
        String(ep.show_id).includes(s)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'last_watched') return new Date(b.last_watched).getTime() - new Date(a.last_watched).getTime();
      if (sortBy === 'watched_count') return b.watched_count - a.watched_count;
      return (a.anime_title || '').localeCompare(b.anime_title || '', 'hu');
    });

  const stats = {
    totalAnime: new Set(data.map(d => d.show_id)).size,
    totalEpisodes: data.length,
    totalWatched: data.reduce((s, d) => s + d.watched_count, 0),
    totalMinutes: data.reduce((s, d) => s + (d.watched_count * (d.duration_minutes || 24)), 0),
  };

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  return (
    <div className="min-h-screen px-4 py-8 relative">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,107,53,0.04) 0%, transparent 70%)' }} />
      </div>

      <div className={`max-w-6xl mx-auto transition-all duration-700 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-7 h-7 rounded bg-oni-accent flex items-center justify-center text-white text-sm font-bold">
                鬼
              </div>
              <span className="font-display text-xl tracking-widest text-white glow-text">ONIANIME</span>
            </div>
            <p className="text-oni-dim text-xs tracking-[0.25em] uppercase">Tracker Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin')}
              className="text-xs text-oni-dim hover:text-oni-accent transition-colors px-3 py-1.5 rounded border border-oni-border hover:border-oni-accent/30"
            >
              ⚡ Admin
            </button>
            <button
              onClick={loadData}
              className="text-xs text-oni-dim hover:text-oni-text transition-colors px-3 py-1.5 rounded border border-oni-border hover:border-oni-text/30"
            >
              ↻ Frissítés
            </button>
            <button
              onClick={handleLogout}
              className="text-xs text-oni-muted hover:text-red-400 transition-colors px-3 py-1.5 rounded border border-oni-border hover:border-red-400/30"
            >
              Kilépés
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Anime sorozat', value: stats.totalAnime, icon: '🎌' },
            { label: 'Epizód', value: stats.totalEpisodes, icon: '📺' },
            { label: 'Összes megtekintés', value: stats.totalWatched, icon: '👁' },
            { label: 'Percek', value: stats.totalMinutes.toLocaleString('hu-HU'), icon: '⏱' },
          ].map(stat => (
            <div key={stat.label} className="glass-panel rounded-lg p-4">
              <div className="text-xl mb-1">{stat.icon}</div>
              <div className="font-display text-2xl text-white mb-0.5">{stat.value}</div>
              <div className="text-oni-dim text-xs tracking-wider uppercase">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Keresés anime neve vagy Show ID alapján..."
            className="input-oni flex-1 px-4 py-2.5 rounded text-oni-text text-sm"
          />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="input-oni px-4 py-2.5 rounded text-oni-text text-sm cursor-pointer"
          >
            <option value="last_watched">Utoljára nézett</option>
            <option value="watched_count">Megtekintések száma</option>
            <option value="anime_title">Cím szerint (A-Z)</option>
          </select>
        </div>

        {/* Data */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass-panel rounded-lg h-16 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="glass-panel rounded-lg p-8 text-center">
            <div className="text-red-400 text-sm">{error}</div>
            <button onClick={loadData} className="mt-4 text-xs text-oni-dim hover:text-oni-text transition-colors">
              Újrapróbálkozás
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel rounded-lg p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-oni-dim text-sm">{search ? 'Nincs találat a keresésre' : 'Még nincs rögzített epizód'}</p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-3 text-xs text-oni-accent hover:underline">
                Keresés törlése
              </button>
            )}
          </div>
        ) : (
          <div className="glass-panel rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-oni-border">
                    {['Anime', 'Show ID', 'Epizód', 'Megtekintés', 'Utoljára nézve', 'Először nézve'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-oni-dim tracking-wider uppercase font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ep, i) => (
                    <tr key={ep.id} className={`border-b border-oni-border/50 hover:bg-white/[0.02] transition-colors ${
                      i === filtered.length - 1 ? 'border-b-0' : ''
                    }`}>
                      <td className="px-4 py-3 text-oni-text font-medium max-w-[200px]">
                        <div className="truncate" title={ep.anime_title || '-'}>
                          {ep.anime_title || <span className="text-oni-muted italic">Ismeretlen</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-oni-muted font-mono text-xs">{ep.show_id}</td>
                      <td className="px-4 py-3">
                        <span className="text-oni-accent font-bold">{ep.episode}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,107,53,0.1)', color: '#ff6b35', border: '1px solid rgba(255,107,53,0.2)' }}>
                          {ep.watched_count}x
                        </span>
                      </td>
                      <td className="px-4 py-3 text-oni-dim text-xs">{formatDate(ep.last_watched)}</td>
                      <td className="px-4 py-3 text-oni-muted text-xs">{formatDate(ep.first_watched)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-oni-border text-xs text-oni-muted">
              {filtered.length} találat {data.length !== filtered.length ? `(összesen: ${data.length})` : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
