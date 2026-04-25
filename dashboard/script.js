// === BEÁLLÍTÁSOK (Ha Vercelen futtatod, ide írd be az adataidat!) ===
// Ha ezeket kitöltöd, a weboldalon már csak a jelszót fogja kérni!
const CONFIG = {
  SUPABASE_URL: "", // pl: "https://xxx.supabase.co"
  SUPABASE_KEY: "", // pl: "eyJhb..."
  USERNAME: "admin", // Ezzel a névvel tudsz majd belépni
  PASSWORD: "anime" // Ezzel a jelszóval tudsz majd belépni
};

const configSection = document.getElementById('config-section');
const dashboardSection = document.getElementById('dashboard-section');
const loader = document.getElementById('loader');
const content = document.getElementById('dashboard-content');

let supabase = null;
let isSimplifiedLogin = CONFIG.SUPABASE_URL !== "" && CONFIG.SUPABASE_KEY !== "";

function init() {
  // If running inside the extension, sync with background script
  let extensionContext = false;
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      extensionContext = true;
      chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, (config) => {
        if (chrome.runtime.lastError) {
          console.warn(chrome.runtime.lastError);
          fallbackInit();
          return;
        }
        const url = config?.url || localStorage.getItem('supa_url');
        const key = config?.anonKey || localStorage.getItem('supa_key');
        startDashboard(url, key);
      });
    }
  } catch(e) {
    console.warn("Nem extension környezetben futunk", e);
    extensionContext = false;
  }
  
  if (!extensionContext) {
    fallbackInit();
  }
}

function fallbackInit() {
  let url = localStorage.getItem('supa_url');
  let key = localStorage.getItem('supa_key');
  
  if (isSimplifiedLogin && localStorage.getItem('dashboard_auth') === 'true') {
    url = CONFIG.SUPABASE_URL;
    key = CONFIG.SUPABASE_KEY;
  }
  
  startDashboard(url, key);
}

function startDashboard(url, key) {
  if (url && key) {
      configSection.style.display = 'none';
      dashboardSection.style.display = 'block';
      loader.style.display = 'block';
      content.style.display = 'none';
    
    // Initialize Supabase Client
    try {
      if (!window.supabase) {
        throw new Error("A Supabase könyvtár nem töltődött be (lehet, hogy egy reklámblokkoló megfogta, vagy nincs internet).");
      }
      if (!url.startsWith('http')) {
        throw new Error("A Project URL-nek 'https://'-el kell kezdődnie!");
      }
      supabase = window.supabase.createClient(url, key);
      loadData();
    } catch (e) {
      alert("Hiba a csatlakozáskor: " + e.message);
      configSection.style.display = 'flex';
      dashboardSection.style.display = 'none';
      localStorage.removeItem('supa_url');
      localStorage.removeItem('supa_key');
      localStorage.removeItem('dashboard_auth');
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ type: 'SAVE_CONFIG', url: '', anonKey: '' }, () => {
             let err = chrome.runtime.lastError;
          });
        }
      } catch(e){}
    }
  } else {
    configSection.style.display = 'flex';
    dashboardSection.style.display = 'none';
    
    if (isSimplifiedLogin) {
      document.getElementById('full-login-fields').style.display = 'none';
      document.getElementById('simple-login-fields').style.display = 'block';
      document.getElementById('login-title').textContent = "Védett Statisztika";
      document.getElementById('login-desc').textContent = "Jelentkezz be az adataidhoz!";
    } else {
      document.getElementById('full-login-fields').style.display = 'block';
      document.getElementById('simple-login-fields').style.display = 'none';
    }
  }
}

document.getElementById('btn-connect').addEventListener('click', () => {
  if (isSimplifiedLogin) {
    const user = document.getElementById('config-username').value.trim();
    const pw = document.getElementById('config-password').value.trim();
    if (user === CONFIG.USERNAME && pw === CONFIG.PASSWORD) {
      localStorage.setItem('dashboard_auth', 'true');
      init();
    } else {
      alert("Helytelen felhasználónév vagy jelszó!");
    }
    return;
  }

  const url = document.getElementById('config-url').value.trim();
  const key = document.getElementById('config-key').value.trim();
  if (!url || !key) {
    alert("Kérlek add meg a projekt URL-t és a kulcsot!");
    return;
  }
  localStorage.setItem('supa_url', url);
  localStorage.setItem('supa_key', key);
  
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'SAVE_CONFIG', url: url, anonKey: key }, () => {
        let err = chrome.runtime.lastError;
        init();
      });
    } else {
      init();
    }
  } catch(e) {
    init();
  }
});

document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.removeItem('supa_url');
  localStorage.removeItem('supa_key');
  localStorage.removeItem('dashboard_auth');
  
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'SAVE_CONFIG', url: '', anonKey: '' }, () => {
        let err = chrome.runtime.lastError;
        init();
      });
    } else {
      init();
    }
  } catch(e) {
    init();
  }
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
