// OniAnime Tracker - Background Service Worker v4.1
// Átdolgozva: Basic Auth login és stabil Offline-first queue rendszer
const API_BASE = 'https://onianime-tracker2.pages.dev';

async function getAuthHeader() {
  const r = await chrome.storage.local.get(['oni_creds']);
  if (!r.oni_creds || !r.oni_creds.username || !r.oni_creds.password) return null;
  return 'Basic ' + btoa(r.oni_creds.username + ':' + r.oni_creds.password);
}

// 1. EPIZÓD SZINKRONIZÁLÁSA
async function syncEpisode(showId, episode, animeName) {
  const authHeader = await getAuthHeader();
  if (!authHeader) {
    console.warn('[OniAnime] Nincs bejelentkezve');
    return { success: false, error: 'no_auth' };
  }

  try {
    const response = await fetch(`${API_BASE}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        show_id: parseInt(showId),
        episode: parseInt(episode),
        anime_title: animeName
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[OniAnime] ✓ Szinkronizálva: ${animeName} ep${episode}`, data);
      return { success: true, data };
    }

    if (response.status === 401) {
      await chrome.storage.local.remove(['oni_creds']);
      return { success: false, error: 'invalid_auth' };
    }

    const err = await response.text();
    return { success: false, error: err, status: response.status };
  } catch (e) {
    await queueForRetry(showId, episode, animeName);
    return { success: false, error: 'network', queued: true };
  }
}

// 2. OFFLINE SOR KEZELÉS
async function queueForRetry(showId, episode, animeName) {
  const r = await chrome.storage.local.get(['oni_queue']);
  const queue = r.oni_queue || [];
  const exists = queue.some(i => i.showId === showId && i.episode === episode);
  if (!exists) {
    queue.push({ showId, episode, animeName, ts: Date.now() });
    await chrome.storage.local.set({ oni_queue: queue });
    console.log(`[OniAnime] ⏳ Offline sorba rakva: ${animeName} ep${episode}`);
  }
}

async function processQueue() {
  const r = await chrome.storage.local.get(['oni_queue']);
  const queue = r.oni_queue || [];
  if (!queue.length) return;
  
  if (!navigator.onLine) {
    console.log('[OniAnime] ⏳ Nincs internet, sor várakozik...');
    return;
  }

  console.log(`[OniAnime] 🔄 Sor feldolgozása (${queue.length} elem)...`);
  const remaining = [];
  for (const item of queue) {
    const res = await syncEpisode(item.showId, item.episode, item.animeName);
    if (!res.success && !res.queued) remaining.push(item);
    if (res.error === 'no_auth') break; // Ha kijelentkezett, álljunk le
  }
  await chrome.storage.local.set({ oni_queue: remaining });
}

// 3. EVENT LISTENEREK
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'EPISODE_WATCHED') {
    syncEpisode(msg.showId, msg.episode, msg.animeName).then(sendResponse);
    return true;
  }
  
  if (msg.type === 'GET_QUEUE_STATUS') {
    chrome.storage.local.get(['oni_queue'], r => {
      sendResponse({ pending: (r.oni_queue || []).length });
    });
    return true;
  }
  
  if (msg.type === 'LOGIN') {
    const { username, password } = msg;
    const authHeader = 'Basic ' + btoa(username + ':' + password);
    // Próbáljuk meg ellenőrizni az auth headert egy teszt hívással
    fetch(`${API_BASE}/api/sync?show_id=0&episode=0`, {
      headers: { 'Authorization': authHeader }
    }).then(async r => {
      if (r.ok || r.status === 400) { // 400 is ok, means auth passed but params wrong
        await chrome.storage.local.set({ oni_creds: { username, password } });
        processQueue();
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Hibás felhasználónév vagy jelszó!' });
      }
    }).catch(e => {
      // Ha nincs net, mentsük el és majd próbálja meg később
      chrome.storage.local.set({ oni_creds: { username, password } }).then(() => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
  
  if (msg.type === 'LOGOUT') {
    chrome.storage.local.remove(['oni_creds'], () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (msg.type === 'GET_AUTH_STATUS') {
    chrome.storage.local.get(['oni_creds'], r => {
      sendResponse({ isLoggedIn: !!(r.oni_creds && r.oni_creds.username) });
    });
    return true;
  }
  
  if (msg.type === 'CHECK_EPISODE_STATUS') {
    getAuthHeader().then(authHeader => {
      if (!authHeader) return sendResponse({ success: false, error: 'no_auth' });
      fetch(`${API_BASE}/api/sync?show_id=${msg.showId}&episode=${msg.episode}`, {
        headers: { 'Authorization': authHeader }
      }).then(r => r.json())
        .then(data => sendResponse({ success: true, data }))
        .catch(e => sendResponse({ success: false, error: e.message }));
    });
    return true;
  }
});

// Háttérfolyamatok és hálózati figyelés
chrome.alarms.create('retryQueue', { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'retryQueue') processQueue();
});

// Ha online lett a böngésző, azonnal dolgozza fel a sort
self.addEventListener('online', processQueue);

chrome.runtime.onStartup.addListener(processQueue);
