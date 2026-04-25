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
      setError('Hiba a betoltesnél');
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

  const totalEpisodes = data.reduce((s, d) => s + (d.watched_count || 0), 0);
  const totalMinutes = data.reduce((s, d) => s + ((d.duration_minutes || 0) * (d.watched_count || 0)), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  const formatWatchTime = () => {
    if (totalMinutes === 0) return '0p';
    if (totalHours === 0) return `${remainingMinutes}p`;
    if (remainingMinutes === 0) return `${totalHours}ó`;
    return `${totalHours}ó ${remainingMinutes}p`;
  };

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
              className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'var(--t-accent)' }}
            >
              ▶
            </div>
            <span className="font-display text-xl tracking-widest glow-text" style={{ color: 'var(--t-text)' }}>ANIME TRACKER</span>
          </div>
          <p className="text-xs tracking-[0.25em] uppercase" style={{ color: 'var(--t-dim)' }}>Dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="glass-panel px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{ color: 'var(--t-dim)' }}
          >
            ↻ Frissítés
          </button>
          <a
            href="/admin"
            className="glass-panel px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{ color: 'var(--t-accent)' }}
          >
            Admin
          </a>
          <button
            onClick={handleLogout}
            className="glass-panel px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{ color: 'var(--t-dim)' }}
          >
            Kilépés
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-xl fade-in">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🎬</span>
            <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--t-dim)' }}>Anime</div>
          </div>
          <div className="text-4xl font-bold glow-text" style={{ color: 'var(--t-accent)' }}>{data.length}</div>
          <div className="mt-2 text-xs" style={{ color: 'var(--t-muted)' }}>sorozat követve</div>
        </div>

        <div className="glass-panel p-5 rounded-xl fade-in">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">📺</span>
            <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--t-dim)' }}>Részek</div>
          </div>
          <div className="text-4xl font-bold glow-text" style={{ color: 'var(--t-accent)' }}>{totalEpisodes}</div>
          <div className="mt-2 text-xs" style={{ color: 'var(--t-muted)' }}>epizód megnézve</div>
        </div>

        <div className="glass-panel p-5 rounded-xl fade-in">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">⏱️</span>
            <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--t-dim)' }}>Nézési idő</div>
          </div>
          <div className="text-4xl font-bold glow-text" style={{ color: 'var(--t-accent)' }}>{formatWatchTime()}</div>
          <div className="mt-2 text-xs" style={{ color: 'var(--t-muted)' }}>{totalMinutes} perc összesen</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--t-dim)' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Keresés anime neve alapján..."
            className="input-oni w-full pl-9 pr-4 py-2.5 rounded-lg"
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="input-oni md:w-52 px-3 py-2.5 rounded-lg"
        >
          <option value="last_watched">Utolsó nézés</option>
          <option value="anime_title">Cím szerint</option>
          <option value="watched_count">Részek száma</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-panel p-4 rounded-xl mb-6 border" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="text-5xl mb-4 animate-pulse" style={{ color: 'var(--t-accent)' }}>▶</div>
            <div className="text-sm tracking-widest uppercase" style={{ color: 'var(--t-dim)' }}>Betöltés...</div>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 fade-in">
          <div className="text-5xl mb-4">📭</div>
          <div className="text-lg font-medium mb-2" style={{ color: 'var(--t-dim)' }}>
            {search ? 'Nincs találat' : 'Még nincs követett anime'}
          </div>
          <div className="text-sm" style={{ color: 'var(--t-muted)' }}>
            {search ? `"${search}" nem található` : 'Adj hozzá animéket a bővítménnyel!'}
          </div>
        </div>
      ) : (
        <div className="grid gap-3 fade-in">
          {filtered.map((item, index) => {
            const episodePercent = item.episode > 0 ? Math.min((item.watched_count / item.episode) * 100, 100) : 0;
            const itemMinutes = (item.duration_minutes || 0) * (item.watched_count || 0);
            const itemHours = Math.floor(itemMinutes / 60);
            const itemMins = itemMinutes % 60;
            const timeStr = itemHours > 0 ? `${itemHours}ó ${itemMins}p` : `${itemMins}p`;

            return (
              <div
                key={item.id}
                className="glass-panel rounded-xl overflow-hidden fade-in"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="p-4 flex items-center justify-between gap-4">
                  {/* Rank + Title */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: 'var(--t-surface-2)', color: 'var(--t-dim)' }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate" style={{ color: 'var(--t-text)' }}>
                        {item.anime_title || `Show #${item.show_id}`}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--t-muted)' }}>
                        Utoljára: {new Date(item.last_watched).toLocaleDateString('hu-HU')} · {timeStr} nézve
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-5 shrink-0">
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

                {/* Progress bar */}
                {item.episode > 0 && (
                  <div className="px-4 pb-3">
                    <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--t-muted)' }}>
                      <span>Haladás</span>
                      <span>{Math.round(episodePercent)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--t-surface-2)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${episodePercent}%`, background: 'var(--t-accent)' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Theme settings floating button */}
      <ThemeSettings />
    </div>
  );
}
