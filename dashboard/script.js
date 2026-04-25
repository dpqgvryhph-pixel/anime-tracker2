// OniAnime Dashboard - Supabase config beegetve
const SUPABASE_URL = 'https://uctzsndnlmpsmniufrzg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdHpzbmRubG1wc21uaXVmcnpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTM5MTUsImV4cCI6MjA5MjY4OTkxNX0.anzOAGIclTRNtF8DwA6mqQIt0nSvAbwACGN76-rolHc';
const DASHBOARD_USERNAME = 'adminemma';
const DASHBOARD_PASSWORD = 'adminanime';

const configSection = document.getElementById('config-section');
const dashboardSection = document.getElementById('dashboard-section');
const loader = document.getElementById('loader');
const content = document.getElementById('dashboard-content');

let supabaseClient = null;

function init() {
  if (sessionStorage.getItem('dashboard_auth') === 'true') {
    showDashboard();
  } else {
    showLogin();
  }
}

function showLogin() {
  configSection.style.display = 'flex';
  dashboardSection.style.display = 'none';
  document.getElementById('full-login-fields').style.display = 'none';
  document.getElementById('simple-login-fields').style.display = 'block';
  document.getElementById('login-title').textContent = 'OniAnime Statisztika';
  document.getElementById('login-desc').textContent = 'Jelentkezz be a statisztikáidhoz!';
}

function showDashboard() {
  configSection.style.display = 'none';
  dashboardSection.style.display = 'block';
  loader.style.display = 'block';
  content.style.display = 'none';
  try {
    if (!window.supabase) throw new Error('Supabase könyvtár nem töltődött be!');
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    loadData();
  } catch (e) {
    alert('Hiba a csatlakozáskor: ' + e.message);
    sessionStorage.removeItem('dashboard_auth');
    showLogin();
  }
}

document.getElementById('btn-connect').addEventListener('click', () => {
  const user = document.getElementById('config-username').value.trim();
  const pw = document.getElementById('config-password').value.trim();
  if (user === DASHBOARD_USERNAME && pw === DASHBOARD_PASSWORD) {
    sessionStorage.setItem('dashboard_auth', 'true');
    showDashboard();
  } else {
    alert('Helytelen felhasználónév vagy jelszó!');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && configSection.style.display !== 'none') {
    document.getElementById('btn-connect').click();
  }
});

document.getElementById('btn-logout').addEventListener('click', () => {
  sessionStorage.removeItem('dashboard_auth');
  showLogin();
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
  return m > 0 ? `${hours}ó ${m}p` : `${hours}ó`;
}

async function loadData() {
  try {
    const { data, error } = await supabaseClient
      .from('watched_episodes')
      .select('*')
      .order('last_watched', { ascending: false });
    if (error) throw error;

    loader.style.display = 'none';
    content.style.display = 'block';

    if (!data || data.length === 0) {
      document.getElementById('stat-total-eps').textContent = '0';
      document.getElementById('stat-total-time').textContent = '0p';
      document.getElementById('stat-total-shows').textContent = '0';
      document.getElementById('stat-this-week').textContent = '0';
      document.getElementById('recent-tbody').innerHTML = '<tr><td colspan="3" style="text-align:center;color:#888">Még nincs megnézett epizód</td></tr>';
      document.getElementById('shows-tbody').innerHTML = '<tr><td colspan="2" style="text-align:center;color:#888">Még nincs adat</td></tr>';
      return;
    }

    let totalMinutes = 0;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    let epsThisWeek = 0;
    const showsMap = {};

    data.forEach(row => {
      totalMinutes += row.duration_minutes || 24;
      if (new Date(row.last_watched) > oneWeekAgo) epsThisWeek++;
      const name = row.anime_title || `Show ID: ${row.show_id}`;
      if (!showsMap[name]) showsMap[name] = { count: 0, last: row.last_watched };
      showsMap[name].count++;
    });

    document.getElementById('stat-total-eps').textContent = data.length;
    document.getElementById('stat-total-time').textContent = calculateTimeSpent(totalMinutes);
    document.getElementById('stat-total-shows').textContent = Object.keys(showsMap).length;
    document.getElementById('stat-this-week').textContent = epsThisWeek;

    const tbody = document.getElementById('recent-tbody');
    tbody.innerHTML = '';
    data.slice(0, 10).forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="anime-title">${row.anime_title || `Show ID: ${row.show_id}`}</td>
        <td><span class="badge">${row.episode}. rész</span></td>
        <td>${formatDate(row.last_watched)}</td>
      `;
      tbody.appendChild(tr);
    });

    const showsTbody = document.getElementById('shows-tbody');
    showsTbody.innerHTML = '';
    Object.entries(showsMap)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([name, info]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="anime-title">${name}</td><td>${info.count} epizód</td>`;
        showsTbody.appendChild(tr);
      });

  } catch (err) {
    console.error(err);
    loader.style.display = 'none';
    alert('Hiba az adatok betöltésekor: ' + err.message);
  }
}

document.addEventListener('DOMContentLoaded', init);
