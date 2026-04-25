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
  if (hours < 24) return `${hours} oraja`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} napja`;
  const months = Math.floor(days / 30);
  return `${months} honapja`;
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
      if (res.status === 401) { router.push('/'); return; }
      const json = await res.json();
      setData(json.data || []);
    } catch {
      setError('Hiba a betoltes koren');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { if (mounted) loadData(); }, [mounted, loadData]);

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

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#0d0d14]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <div>
              <span className="font-bold text-white tracking-tight">Anime Tracker</span>
              <span className="ml-2 text-xs text-white/30 font-medium uppercase tracking-widest">Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Frissites
            </button>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              Admin
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm bg-white/5 hover:bg-white/10 rounded-lg transition-all"
            >
              Kilepes
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-orange-500/10 to-pink-600/5 border border-orange-500/20 rounded-2xl p-5">
            <div className="text-3xl font-bold text-orange-400">{uniqueAnimes}</div>
            <div className="text-sm text-white/50 mt-1">Anime</div>
          </div>
          <div className="bg-gradient-to-br from-violet-500/10 to-blue-600/5 border border-violet-500/20 rounded-2xl p-5">
            <div className="text-3xl font-bold text-violet-400">{totalEpisodes}</div>
            <div className="text-sm text-white/50 mt-1">Epizod</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-600/5 border border-emerald-500/20 rounded-2xl p-5">
            <div className="text-3xl font-bold text-emerald-400">{formatTime(totalMinutes)}</div>
            <div className="text-sm text-white/50 mt-1">Nezesi ido</div>
          </div>
        </div>

        {/* Search and sort */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Kereses anime neve alapjan..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50 focus:bg-white/8 transition-all"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all cursor-pointer"
          >
            <option value="last_watched">Utolso nezes</option>
            <option value="anime_title">Nev szerint</option>
            <option value="watched_count">Legtobb epizod</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-10 h-10 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin mb-4"></div>
            <p className="text-white/30 text-sm">Betoltes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <p className="text-white/30 text-sm">{search ? 'Nincs talalat' : 'Meg nincs nezett epizod'}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((item) => {
              const mins = (item.duration_minutes || DEFAULT_DURATION) * (item.watched_count || 0);
              const pct = Math.min(100, Math.round((item.watched_count / Math.max(...data.map(d => d.watched_count))) * 100));
              return (
                <div
                  key={item.id}
                  className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-5 transition-all duration-200"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate group-hover:text-orange-300 transition-colors">
                        {item.anime_title || `Show #${item.show_id}`}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-white/40">{timeAgo(item.last_watched)}</span>
                        <span className="text-white/20">·</span>
                        <span className="text-xs text-white/40">Ep. {item.episode}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{item.watched_count}</div>
                        <div className="text-xs text-white/30">epizod</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-emerald-400">{formatTime(mins)}</div>
                        <div className="text-xs text-white/30">nezesi ido</div>
                      </div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
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
