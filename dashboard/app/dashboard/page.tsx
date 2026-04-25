'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ThemeSettings from '../ThemeSettings';

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
      setData(json.data || []);
    } catch (e: unknown) {
      setError('Hiba a betoltésnél');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (mounted) loadData();
  }, [mounted, loadData]);

  const filtered = data
    .filter(d => !search || (d.anime_title || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'anime_title') return (a.anime_title || '').localeCompare(b.anime_title || '');
      if (sortBy === 'watched_count') return b.watched_count - a.watched_count;
      return new Date(b.last_watched).getTime() - new Date(a.last_watched).getTime();
    });

  const totalEpisodes = data.reduce((s, d) => s + d.watched_count, 0);
  const totalMinutes = data.reduce((s, d) => s + d.duration_minutes * d.watched_count, 0);
  const totalHours = Math.floor(totalMinutes / 60);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/');
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-7 h-7 rounded flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'var(--t-accent)' }}
            >
              ▶
            </div>
            <span className="font-display text-xl tracking-widest glow-text" style={{ color: 'var(--t-text)' }}>ANIME TRACKER</span>
          </div>
          <p className="text-xs tracking-[0.25em] uppercase" style={{ color: 'var(--t-dim)' }}>Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="glass-panel px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{ color: 'var(--t-dim)' }}
          >
            ↻ Frissítés
          </button>
          <a
            href="/admin"
            className="glass-panel px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{ color: 'var(--t-accent)' }}
          >
            Admin
          </a>
          <button
            onClick={handleLogout}
            className="glass-panel px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{ color: 'var(--t-dim)' }}
          >
            Kilépés
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="glass-panel p-4 rounded-xl">
          <div className="text-3xl font-bold glow-text" style={{ color: 'var(--t-accent)' }}>{data.length}</div>
          <div className="text-xs uppercase tracking-widest mt-1" style={{ color: 'var(--t-dim)' }}>Anime</div>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <div className="text-3xl font-bold glow-text" style={{ color: 'var(--t-accent)' }}>{totalEpisodes}</div>
          <div className="text-xs uppercase tracking-widest mt-1" style={{ color: 'var(--t-dim)' }}>Részek</div>
        </div>
        <div className="glass-panel p-4 rounded-xl col-span-2 md:col-span-1">
          <div className="text-3xl font-bold glow-text" style={{ color: 'var(--t-accent)' }}>{totalHours}h</div>
          <div className="text-xs uppercase tracking-widest mt-1" style={{ color: 'var(--t-dim)' }}>Nézési idő</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Keresés..."
          className="input-oni flex-1"
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="input-oni md:w-48"
        >
          <option value="last_watched">Utolsó nézés</option>
          <option value="anime_title">Cím szerint</option>
          <option value="watched_count">Részek száma</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-panel p-4 rounded-xl mb-6 border" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-4xl mb-4 animate-pulse" style={{ color: 'var(--t-accent)' }}>▶</div>
            <div className="text-sm" style={{ color: 'var(--t-dim)' }}>Betöltés...</div>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--t-muted)' }}>
          {search ? 'Nincs találat' : 'Még nincs követés'}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(item => (
            <div key={item.id} className="glass-panel p-5 rounded-xl flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-lg truncate" style={{ color: 'var(--t-text)' }}>
                  {item.anime_title || `Show #${item.show_id}`}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--t-muted)' }}>
                  Utoljára nézve: {new Date(item.last_watched).toLocaleDateString('hu-HU')}
                </div>
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <div className="text-center">
                  <div className="text-xl font-bold" style={{ color: 'var(--t-accent)' }}>{item.watched_count}</div>
                  <div className="text-xs" style={{ color: 'var(--t-dim)' }}>rész</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold" style={{ color: 'var(--t-text)' }}>{item.episode}</div>
                  <div className="text-xs" style={{ color: 'var(--t-dim)' }}>epizód</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Theme settings floating button */}
      <ThemeSettings />
    </div>
  );
}
