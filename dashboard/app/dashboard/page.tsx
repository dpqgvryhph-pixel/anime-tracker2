'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const DEFAULT_DURATION = 24;

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

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}p`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}p` : `${h}h`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} perce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} órája`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} napja`;
  const months = Math.floor(days / 30);
  return `${months} hónapja`;
}

export default function DashboardPage() {
  const [data, setData] = useState<WatchedEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'last_watched' | 'anime_title' | 'watched_count'>('last_watched');
  const [mounted, setMounted] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/data');
      if (res.status === 401) { router.push('/'); return; }
      const json = await res.json();
      setData(json.data || []);
      setLastSync(new Date());
    } catch {
      setError('Hiba a betöltés során');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (mounted) {
      loadData();
      const interval = setInterval(loadData, 10000);
      return () => clearInterval(interval);
    }
  }, [mounted, loadData]);

  const filtered = data
    .filter(d => !search || (d.anime_title || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'anime_title') return (a.anime_title || '').localeCompare(b.anime_title || '');
      if (sortBy === 'watched_count') return b.watched_count - a.watched_count;
      return new Date(b.last_watched).getTime() - new Date(a.last_watched).getTime();
    });

  const totalMinutes = data.reduce((acc, d) => acc + (d.duration_minutes || DEFAULT_DURATION) * (d.watched_count || 0), 0);
  const totalEpisodes = data.reduce((acc, d) => acc + (d.watched_count || 0), 0);
  const uniqueAnimes = data.length;
  const maxWatched = Math.max(...data.map(d => d.watched_count), 1);

  if (!mounted) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--t-bg)', color: 'var(--t-text)', fontFamily: 'var(--t-font)' }}>
      {/* Navbar */}
      <nav
        className="sticky top-0 z-40"
        style={{ background: 'var(--t-header-bg)', borderBottom: '1px solid var(--t-border)', backdropFilter: 'blur(var(--t-blur, 12px))' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 flex items-center justify-center text-white"
              style={{
                background: 'linear-gradient(135deg, var(--t-accent), color-mix(in srgb, var(--t-accent) 70%, #000))',
                borderRadius: 'var(--t-radius)',
              }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <div>
              <span className="font-bold tracking-tight" style={{ color: 'var(--t-text)' }}>Anime Tracker</span>
              <span className="ml-2 text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--t-muted)' }}>Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Live Sync Status */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'color-mix(in srgb, var(--t-accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--t-accent) 30%, transparent)' }}
              title={lastSync ? `Utolsó szinkronizáció: ${lastSync.toLocaleTimeString()}` : 'Várakozás...'}
            >
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--t-accent)' }}></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: 'var(--t-accent)' }}></span>
              </div>
              <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--t-accent)' }}>Live Sync</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                className="px-4 py-2 text-sm rounded-lg transition-all flex items-center gap-2"
                style={{ color: 'var(--t-dim)', background: 'transparent' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = 'var(--t-text)'; (e.target as HTMLElement).style.background = 'var(--t-surface-2)'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--t-dim)'; (e.target as HTMLElement).style.background = 'transparent'; }}
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Frissítés
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 text-sm rounded-lg transition-all"
                style={{ color: 'var(--t-dim)', background: 'transparent' }}
              >
                Admin
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-sm rounded-lg transition-all"
                style={{ background: 'var(--t-surface-2)', color: 'var(--t-text)', border: '1px solid var(--t-border)' }}
              >
                Kilépés
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 pb-24">
        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Anime', value: uniqueAnimes, color: 'var(--t-accent)' },
            { label: 'Epizód', value: totalEpisodes, color: 'color-mix(in srgb, var(--t-accent) 70%, #818cf8)' },
            { label: 'Nézési idő', value: formatTime(totalMinutes), color: '#22c55e' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass-panel p-5"
              style={{ borderRadius: 'var(--t-radius)' }}
            >
              <div className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-sm mt-1" style={{ color: 'var(--t-dim)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Search and sort */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--t-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Keresés anime neve alapján..."
              className="input-t w-full pl-11 pr-4 py-3 text-sm"
              style={{ borderRadius: 'var(--t-radius)' }}
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="input-t px-4 py-3 text-sm cursor-pointer"
            style={{ borderRadius: 'var(--t-radius)' }}
          >
            <option value="last_watched">Utolsó nézés</option>
            <option value="anime_title">Név szerint</option>
            <option value="watched_count">Legtöbb epizód</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-6 p-4 rounded-xl text-sm"
            style={{
              background: 'color-mix(in srgb, #ef4444 10%, transparent)',
              border: '1px solid color-mix(in srgb, #ef4444 30%, transparent)',
              color: '#ef4444',
              borderRadius: 'var(--t-radius)',
            }}
          >
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div
              className="w-10 h-10 rounded-full border-2 animate-spin mb-4"
              style={{ borderColor: 'color-mix(in srgb, var(--t-accent) 30%, transparent)', borderTopColor: 'var(--t-accent)' }}
            ></div>
            <p className="text-sm" style={{ color: 'var(--t-muted)' }}>Betöltés...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div
              className="w-16 h-16 flex items-center justify-center mb-4"
              style={{ background: 'var(--t-surface-2)', borderRadius: 'var(--t-radius)' }}
            >
              <svg className="w-8 h-8" style={{ color: 'var(--t-muted)' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <p className="text-sm" style={{ color: 'var(--t-muted)' }}>
              {search ? 'Nincs találat' : 'Még nincs nézett epizód'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 fade-in">
            {filtered.map((item) => {
              const mins = (item.duration_minutes || DEFAULT_DURATION) * (item.watched_count || 0);
              const pct = Math.min(100, Math.round((item.watched_count / maxWatched) * 100));
              return (
                <div
                  key={item.id}
                  className="glass-panel p-5 transition-all duration-200"
                  style={{ cursor: 'default' }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate" style={{ color: 'var(--t-text)' }}>
                        {item.anime_title || `Show #${item.show_id}`}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs" style={{ color: 'var(--t-muted)' }}>{timeAgo(item.last_watched)}</span>
                        <span style={{ color: 'var(--t-border)' }}>·</span>
                        <span className="text-xs" style={{ color: 'var(--t-muted)' }}>Ep. {item.episode}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-right">
                        <div className="text-lg font-bold" style={{ color: 'var(--t-text)' }}>{item.watched_count}</div>
                        <div className="text-xs" style={{ color: 'var(--t-muted)' }}>epizód</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold" style={{ color: 'var(--t-accent)' }}>{formatTime(mins)}</div>
                        <div className="text-xs" style={{ color: 'var(--t-muted)' }}>nézési idő</div>
                      </div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-4 h-1 rounded-full overflow-hidden" style={{ background: 'var(--t-surface-2)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: 'linear-gradient(to right, var(--t-accent), color-mix(in srgb, var(--t-accent) 60%, #ec4899))' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
