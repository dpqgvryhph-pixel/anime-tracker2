const configSection = document.getElementById('config-section');
const dashboardSection = document.getElementById('dashboard-section');
const loader = document.getElementById('loader');
const content = document.getElementById('dashboard-content');

let supabase = null;

function init() {
  const url = localStorage.getItem('supa_url');
  const key = localStorage.getItem('supa_key');
  
  if (url && key) {
    configSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    loader.style.display = 'block';
    content.style.display = 'none';
    
    // Initialize Supabase Client
    supabase = window.supabase.createClient(url, key);
    loadData();
  } else {
    configSection.style.display = 'flex';
    dashboardSection.style.display = 'none';
  }
}

document.getElementById('btn-connect').addEventListener('click', () => {
  const url = document.getElementById('config-url').value.trim();
  const key = document.getElementById('config-key').value.trim();
  if (!url || !key) {
    alert("Kérlek add meg a projekt URL-t és a kulcsot!");
    return;
  }
  localStorage.setItem('supa_url', url);
  localStorage.setItem('supa_key', key);
  init();
});

document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.removeItem('supa_url');
  localStorage.removeItem('supa_key');
  init();
});

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString('hu-HU', { 
    year: 'numeric', month: 'short', day: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });
}

function calculateTimeSpent(minutes) {
  if (minutes < 60) return `${minutes}p`;
  const hours = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${hours}ó ${m}p`;
}

async function loadData() {
  try {
    const { data, error } = await supabase
      .from('watched_episodes')
      .select('*')
      .order('last_watched', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      alert("Nincsenek még adatok az adatbázisban.");
      loader.style.display = 'none';
      content.style.display = 'block';
      return;
    }

    // Kalkulációk
    const totalEps = data.length;
    let totalMinutes = 0;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    let epsThisWeek = 0;

    const showsMap = {};

    data.forEach(row => {
      const duration = row.duration_minutes || 24;
      totalMinutes += duration;
      
      const lastWatched = new Date(row.last_watched);
      if (lastWatched > oneWeekAgo) {
        epsThisWeek++;
      }

      const showName = row.anime_title || `Show ID: ${row.show_id}`;
      if (!showsMap[showName]) {
        showsMap[showName] = { count: 0, last_watched: row.last_watched };
      }
      showsMap[showName].count++;
    });

    // Populate stat cards
    document.getElementById('stat-total-eps').textContent = totalEps;
    document.getElementById('stat-total-time').textContent = calculateTimeSpent(totalMinutes);
    document.getElementById('stat-total-shows').textContent = Object.keys(showsMap).length;
    document.getElementById('stat-this-week').textContent = epsThisWeek;

    // Populate Legutóbbi Epizódok table
    const tbody = document.getElementById('recent-tbody');
    tbody.innerHTML = '';
    const recentLimit = Math.min(10, data.length);
    for (let i = 0; i < recentLimit; i++) {
      const row = data[i];
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="anime-title">${row.anime_title || `Show ID: ${row.show_id}`}</td>
        <td><span class="badge">${row.episode}. rész</span></td>
        <td>${formatDate(row.last_watched)}</td>
      `;
      tbody.appendChild(tr);
    }

    // Populate Shows table
    const showsArray = Object.keys(showsMap).map(k => ({
      name: k,
      count: showsMap[k].count,
      last: showsMap[k].last_watched
    })).sort((a, b) => b.count - a.count);

    const showsTbody = document.getElementById('shows-tbody');
    showsTbody.innerHTML = '';
    showsArray.forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="anime-title">${s.name}</td>
        <td>${s.count} epizód</td>
      `;
      showsTbody.appendChild(tr);
    });

    loader.style.display = 'none';
    content.style.display = 'block';

  } catch (err) {
    console.error(err);
    alert("Hiba történt az adatok letöltésekor: " + err.message);
    loader.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', init);
