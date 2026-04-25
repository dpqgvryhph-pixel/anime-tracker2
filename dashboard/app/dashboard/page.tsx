'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { calculateStats, formatDate, formatTimeSpent, type Episode, type DashboardStats } from '@/lib/stats';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

export default function DashboardPage() {
  const [data, setData] = useState<Episode[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'shows' | 'history'>('overview');
  const [showFilter, setShowFilter] = useState<'all' | 'watching' | 'completed'>('all');
  const router = useRouter();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/data');
      if (res.status === 401) { router.push('/'); return; }
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json.data || []);
      setStats(calculateStats(json.data || []));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} onRetry={loadData} />;
  if (!stats) return null;

  const filteredShows = stats.shows.filter(s => {
    if (showFilter === 'all') return true;
    return s.status === showFilter;
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-oni-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-oni-accent rounded flex items-center justify-center font-display text-white">鬼</div>
            <div>
              <h1 className="font-display text-xl tracking-widest text-white">ONIANIME TRACKER</h1>
              <p className="text-xs text-oni-dim">Statisztika Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-oni-dim">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Szinkronizálva
            </span>
            <button onClick={loadData} className="text-xs text-oni-dim hover:text-oni-accent transition-colors px-3 py-1.5 border border-oni-border rounded">
              ↻ Frissít
            </button>
            <button onClick={handleLogout} className="text-xs text-oni-dim hover:text-oni-accent transition-colors px-3 py-1.5 border border-oni-border rounded">
              Kilépés
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Time Spent Hero */}
        <TimeHero stats={stats} />

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 stagger">
          <StatCard label="Megnézett epizód" value={stats.totalEpisodes.toString()} icon="📺" />
          <StatCard label="Animék száma" value={stats.totalShows.toString()} icon="🎌" />
          <StatCard label="Ezen a héten" value={stats.epsThisWeek.toString()} icon="📅" sub="epizód" />
          <StatCard label="Napi átlag" value={stats.avgPerDay.toString()} icon="⚡" sub="ep/nap" />
        </div>

        {/* Show status row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 stagger">
          <StatCard label="Befejezett" value={stats.completedShows.toString()} icon="✅" accent="green" />
          <StatCard label="Folyamatban" value={stats.watchingShows.toString()} icon="▶️" accent="yellow" />
          <StatCard label="Ma nézett" value={stats.epsToday.toString()} icon="🌙" sub="epizód" />
          <StatCard label="Ebben a hónapban" value={stats.epsThisMonth.toString()} icon="📆" sub="epizód" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-oni-border">
          {(['overview', 'shows', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 font-display tracking-widest text-sm transition-all ${
                activeTab === tab
                  ? 'text-oni-accent border-b-2 border-oni-accent -mb-px'
                  : 'text-oni-dim hover:text-oni-text'
              }`}
            >
              {tab === 'overview' ? 'ÁTTEKINTÉS' : tab === 'shows' ? 'ANIMÉK' : 'ELŐZMÉNYEK'}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && <OverviewTab stats={stats} />}
        {activeTab === 'shows' && (
          <ShowsTab shows={filteredShows} filter={showFilter} onFilter={setShowFilter} />
        )}
        {activeTab === 'history' && <HistoryTab episodes={stats.recentEpisodes} />}
      </main>
    </div>
  );
}

// ─── TIME HERO ───────────────────────────────────────────────────────────────
function TimeHero({ stats }: { stats: DashboardStats }) {
  const parts = [
    { value: stats.years, label: 'ÉV' },
    { value: stats.months, label: 'HÓ' },
    { value: stats.weeks, label: 'HÉT' },
    { value: stats.days, label: 'NAP' },
    { value: stats.hours, label: 'ÓRA' },
    { value: stats.minutes, label: 'PERC' },
  ].filter(p => p.value > 0 || p.label === 'PERC');

  return (
    <div className="glass-panel rounded-lg p-8 mb-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,107,53,0.08) 0%, transparent 70%)' }} />
        <div className="absolute top-0 left-0 font-display text-[120px] text-white opacity-[0.02] leading-none select-none">
          鬼
        </div>
      </div>
      <div className="relative">
        <p className="text-xs text-oni-dim tracking-[0.3em] uppercase mb-3">Összesen eltöltött idő</p>
        <div className="flex flex-wrap gap-4 md:gap-8 items-end">
          {parts.map((p, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="font-display text-5xl md:text-7xl text-white glow-text leading-none" 
                style={{ textShadow: '0 0 40px rgba(255,107,53,0.5)' }}>
                {p.value.toString().padStart(2, '0')}
              </span>
              <span className="text-xs text-oni-dim tracking-widest mt-1">{p.label}</span>
            </div>
          ))}
          {parts.length > 1 && parts.slice(0, -1).map((_, i) => (
            <span key={`sep-${i}`} className="font-display text-4xl text-oni-accent opacity-40 -ml-6 mb-4">:</span>
          ))}
        </div>
        <p className="text-xs text-oni-muted mt-4">
          = kb. {formatTimeSpent(Math.round(stats.totalMinutes))} anime tartalom
        </p>
      </div>
    </div>
  );
}

// ─── STAT CARD ───────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, sub, accent }: {
  label: string; value: string; icon: string; sub?: string; accent?: 'green' | 'yellow';
}) {
  const color = accent === 'green' ? '#4ade80' : accent === 'yellow' ? '#fbbf24' : '#ff6b35';
  return (
    <div className="glass-panel rounded-lg p-4 hover:border-oni-accent/30 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xl">{icon}</span>
        <div className="w-1 h-1 rounded-full" style={{ background: color }} />
      </div>
      <div className="font-display text-3xl mb-1" style={{ color }}>{value}</div>
      <div className="text-xs text-oni-dim leading-tight">{label}</div>
      {sub && <div className="text-xs text-oni-muted mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function OverviewTab({ stats }: { stats: DashboardStats }) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="glass-panel rounded px-3 py-2 text-xs">
          <p className="text-oni-dim">{label}</p>
          <p className="text-oni-accent font-display text-base">{payload[0].value} ep</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-lg p-6">
          <h3 className="font-display tracking-widest text-sm text-oni-dim mb-6">ELMÚLT 7 NAP</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.weeklyData}>
              <XAxis dataKey="day" tick={{ fill: '#8892a4', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8892a4', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,107,53,0.05)' }} />
              <Bar dataKey="count" fill="#ff6b35" radius={[3, 3, 0, 0]} opacity={0.9} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel rounded-lg p-6">
          <h3 className="font-display tracking-widest text-sm text-oni-dim mb-6">ELMÚLT 12 HÓNAP</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={stats.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,107,53,0.07)" />
              <XAxis dataKey="month" tick={{ fill: '#8892a4', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8892a4', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" stroke="#ff6b35" strokeWidth={2} dot={{ fill: '#ff6b35', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top shows */}
      <div className="glass-panel rounded-lg p-6">
        <h3 className="font-display tracking-widest text-sm text-oni-dim mb-6">TOP ANIMÉK</h3>
        <div className="space-y-3">
          {stats.shows.slice(0, 8).map((show, i) => {
            const maxEps = stats.shows[0]?.episodeCount || 1;
            const pct = Math.round((show.episodeCount / maxEps) * 100);
            return (
              <div key={i} className="flex items-center gap-4 anime-row px-2 py-1 rounded">
                <span className="font-display text-oni-muted text-sm w-6 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-oni-text truncate pr-4">{show.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded ${show.status === 'watching' ? 'badge-watching' : 'badge-done'}`}>
                        {show.status === 'watching' ? 'Nézi' : 'Kész'}
                      </span>
                      <span className="badge-ep">{show.episodeCount} ep</span>
                    </div>
                  </div>
                  <div className="w-full bg-oni-border rounded-full h-0.5">
                    <div className="progress-bar" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── SHOWS TAB ───────────────────────────────────────────────────────────────
function ShowsTab({ shows, filter, onFilter }: {
  shows: any[]; filter: string; onFilter: (f: any) => void;
}) {
  return (
    <div>
      <div className="flex gap-2 mb-6">
        {(['all', 'watching', 'completed'] as const).map(f => (
          <button key={f} onClick={() => onFilter(f)}
            className={`px-4 py-1.5 rounded text-xs tracking-wider transition-all ${
              filter === f
                ? 'bg-oni-accent text-white'
                : 'border border-oni-border text-oni-dim hover:border-oni-accent/40'
            }`}>
            {f === 'all' ? 'MIND' : f === 'watching' ? 'NÉZI' : 'BEFEJEZETT'}
          </button>
        ))}
      </div>

      <div className="glass-panel rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-oni-border">
              <th className="text-left px-6 py-3 text-xs text-oni-dim tracking-widest">#</th>
              <th className="text-left px-6 py-3 text-xs text-oni-dim tracking-widest">ANIME CÍM</th>
              <th className="text-left px-6 py-3 text-xs text-oni-dim tracking-widest">EPIZÓDOK</th>
              <th className="text-left px-6 py-3 text-xs text-oni-dim tracking-widest">IDŐ</th>
              <th className="text-left px-6 py-3 text-xs text-oni-dim tracking-widest">STÁTUSZ</th>
              <th className="text-left px-6 py-3 text-xs text-oni-dim tracking-widest">UTOLJÁRA</th>
            </tr>
          </thead>
          <tbody>
            {shows.map((show, i) => (
              <tr key={i} className="anime-row border-b border-oni-border/50 last:border-0">
                <td className="px-6 py-4 text-oni-muted font-display text-sm">{i + 1}</td>
                <td className="px-6 py-4">
                  <span className="text-oni-text font-medium text-sm">{show.name}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="badge-ep">{show.episodeCount} ep</span>
                </td>
                <td className="px-6 py-4 text-xs text-oni-dim">
                  {formatTimeSpent(show.totalMinutes)}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded ${show.status === 'watching' ? 'badge-watching' : 'badge-done'}`}>
                    {show.status === 'watching' ? '▶ Nézi' : '✓ Kész'}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-oni-dim">{formatDate(show.lastWatched)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {shows.length === 0 && (
          <div className="text-center py-12 text-oni-muted">Nincs találat</div>
        )}
      </div>
    </div>
  );
}

// ─── HISTORY TAB ─────────────────────────────────────────────────────────────
function HistoryTab({ episodes }: { episodes: any[] }) {
  return (
    <div className="glass-panel rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-oni-border">
            <th className="text-left px-6 py-3 text-xs text-oni-dim tracking-widest">ANIME</th>
            <th className="text-left px-6 py-3 text-xs text-oni-dim tracking-widest">EPIZÓD</th>
            <th className="text-left px-6 py-3 text-xs text-oni-dim tracking-widest">MEGNÉZVE</th>
            <th className="text-left px-6 py-3 text-xs text-oni-dim tracking-widest">UTOLJÁRA</th>
          </tr>
        </thead>
        <tbody>
          {episodes.map((ep, i) => (
            <tr key={i} className="anime-row border-b border-oni-border/50 last:border-0">
              <td className="px-6 py-3 text-sm text-oni-text">{ep.anime_title || `Show #${ep.show_id}`}</td>
              <td className="px-6 py-3"><span className="badge-ep">{ep.episode}. rész</span></td>
              <td className="px-6 py-3 text-xs text-oni-dim">{ep.watched_count}×</td>
              <td className="px-6 py-3 text-xs text-oni-dim">{formatDate(ep.last_watched)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── LOADING ──────────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <div className="font-display text-6xl text-white glow-text animate-pulse">鬼</div>
      <div className="w-48 h-0.5 bg-oni-border rounded overflow-hidden">
        <div className="h-full bg-oni-accent rounded animate-[slide_1.5s_ease-in-out_infinite]"
          style={{ animation: 'loading 1.5s ease-in-out infinite' }} />
      </div>
      <style>{`@keyframes loading { 0% { width:0; margin-left:0; } 50% { width:100%; margin-left:0; } 100% { width:0; margin-left:100%; }}`}</style>
      <p className="text-oni-dim text-xs tracking-widest">ADATOK BETÖLTÉSE...</p>
    </div>
  );
}

function ErrorScreen({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-panel rounded-lg p-8 max-w-md text-center">
        <div className="text-red-400 text-4xl mb-4">⚠</div>
        <h2 className="font-display tracking-widest text-white mb-2">HIBA</h2>
        <p className="text-oni-dim text-sm mb-6">{error}</p>
        <button onClick={onRetry} className="px-6 py-2 bg-oni-accent text-white rounded text-sm font-display tracking-widest">
          ÚJRA
        </button>
      </div>
    </div>
  );
}
