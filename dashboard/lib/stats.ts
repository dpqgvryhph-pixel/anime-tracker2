export interface Episode {
  id: number;
  show_id: number;
  episode: number;
  anime_title: string | null;
  watched_count: number;
  duration_minutes: number;
  first_watched: string;
  last_watched: string;
}

export interface ShowStats {
  name: string;
  showId: number;
  episodeCount: number;
  totalMinutes: number;
  lastWatched: string;
  firstWatched: string;
  episodes: number[];
  status: 'completed' | 'watching' | 'unknown';
}

export interface DashboardStats {
  totalEpisodes: number;
  totalMinutes: number;
  totalShows: number;
  completedShows: number;
  watchingShows: number;
  epsThisWeek: number;
  epsThisMonth: number;
  epsToday: number;
  avgPerDay: number;
  shows: ShowStats[];
  recentEpisodes: Episode[];
  weeklyData: { day: string; count: number }[];
  monthlyData: { month: string; count: number }[];
  // Time breakdown
  years: number;
  months: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
}

export function calculateStats(data: Episode[]): DashboardStats {
  if (!data || data.length === 0) {
    return {
      totalEpisodes: 0, totalMinutes: 0, totalShows: 0,
      completedShows: 0, watchingShows: 0,
      epsThisWeek: 0, epsThisMonth: 0, epsToday: 0,
      avgPerDay: 0, shows: [], recentEpisodes: [],
      weeklyData: [], monthlyData: [],
      years: 0, months: 0, weeks: 0, days: 0, hours: 0, minutes: 0,
    };
  }

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let totalMinutes = 0;
  let epsThisWeek = 0;
  let epsThisMonth = 0;
  let epsToday = 0;

  const showsMap: Map<string, ShowStats> = new Map();

  data.forEach(row => {
    const duration = row.duration_minutes || 24;
    totalMinutes += duration * (row.watched_count || 1);

    const lw = new Date(row.last_watched);
    if (lw > oneWeekAgo) epsThisWeek++;
    if (lw > oneMonthAgo) epsThisMonth++;
    if (lw >= todayStart) epsToday++;

    const name = row.anime_title || `Show #${row.show_id}`;
    if (!showsMap.has(name)) {
      showsMap.set(name, {
        name,
        showId: row.show_id,
        episodeCount: 0,
        totalMinutes: 0,
        lastWatched: row.last_watched,
        firstWatched: row.first_watched,
        episodes: [],
        status: 'unknown',
      });
    }
    const show = showsMap.get(name)!;
    show.episodeCount++;
    show.totalMinutes += duration;
    show.episodes.push(row.episode);
    if (new Date(row.last_watched) > new Date(show.lastWatched)) {
      show.lastWatched = row.last_watched;
    }
    if (new Date(row.first_watched) < new Date(show.firstWatched)) {
      show.firstWatched = row.first_watched;
    }
  });

  // Determine status: if last watched > 2 weeks ago, likely completed
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  let completedShows = 0;
  let watchingShows = 0;

  showsMap.forEach(show => {
    if (new Date(show.lastWatched) > twoWeeksAgo) {
      show.status = 'watching';
      watchingShows++;
    } else {
      show.status = 'completed';
      completedShows++;
    }
  });

  // Weekly chart (last 7 days)
  const weeklyData: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const count = data.filter(r => {
      const lw = new Date(r.last_watched);
      return lw >= dayStart && lw < dayEnd;
    }).length;
    weeklyData.push({
      day: d.toLocaleDateString('hu-HU', { weekday: 'short' }),
      count,
    });
  }

  // Monthly chart (last 12 months)
  const monthlyData: { month: string; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const count = data.filter(r => {
      const lw = new Date(r.last_watched);
      return lw >= d && lw < nextMonth;
    }).length;
    monthlyData.push({
      month: d.toLocaleDateString('hu-HU', { month: 'short' }),
      count,
    });
  }

  // Time breakdown
  const totalMins = Math.round(totalMinutes);
  const years = Math.floor(totalMins / (60 * 24 * 365));
  const remAfterYears = totalMins % (60 * 24 * 365);
  const months = Math.floor(remAfterYears / (60 * 24 * 30));
  const remAfterMonths = remAfterYears % (60 * 24 * 30);
  const weeks = Math.floor(remAfterMonths / (60 * 24 * 7));
  const remAfterWeeks = remAfterMonths % (60 * 24 * 7);
  const days = Math.floor(remAfterWeeks / (60 * 24));
  const remAfterDays = remAfterWeeks % (60 * 24);
  const hours = Math.floor(remAfterDays / 60);
  const minutes = remAfterDays % 60;

  // Avg per day (since first episode)
  const firstDate = data.reduce((min, r) => {
    const d = new Date(r.first_watched);
    return d < min ? d : min;
  }, new Date());
  const daysSinceFirst = Math.max(1, Math.ceil((now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
  const avgPerDay = parseFloat((data.length / daysSinceFirst).toFixed(2));

  const shows = Array.from(showsMap.values()).sort((a, b) => b.episodeCount - a.episodeCount);

  return {
    totalEpisodes: data.length,
    totalMinutes,
    totalShows: showsMap.size,
    completedShows,
    watchingShows,
    epsThisWeek,
    epsThisMonth,
    epsToday,
    avgPerDay,
    shows,
    recentEpisodes: data.slice(0, 15),
    weeklyData,
    monthlyData,
    years, months, weeks, days, hours, minutes,
  };
}

export function formatTimeSpent(minutes: number): string {
  if (minutes < 60) return `${minutes}p`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h < 24) return `${h}ó ${m}p`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return `${d}n ${rh}ó`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('hu-HU', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
