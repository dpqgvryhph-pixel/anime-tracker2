// OniAnime Tracker - Background Service Worker v4.0
// Új archítektúra: az extension CSAK jelzi az eseményt a webes API-nak.
// Minden logika (számláló, statisztika, frissítés) a weben történik.
// Így az extension nem igényel GitHub-frissítést, ha a backend változik.

const API_BASE = 'https://onianime-tracker2.pages.dev';

// Az API token a Supabase-ből kerül lekérésre bejelentkezéskor,
// vagy a felhasználó beállítja popup-ban egyszer.
async function getApiToken() {
  const r = await chrome.storage.local.get(['oni_api_token']);
  return r.oni_api_token || null;
}

async function syncEpisode(showId, episode, animeName) {
  const token = await getApiToken();
  if (!token) {
    console.warn('[OniAnime] Nincs API token - állítsd be a popup-ban');
    return { success: false, error: 'no_token' };
  }

  try {
    const response = await fetch(`${API_BASE}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Oni-Token': token
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

    // Token hibás/lejárt
    if (response.status === 401) {
      await chrome.storage.local.remove(['oni_api_token']);
      return { success: false, error: 'invalid_token' };
    }

    const err = await response.text();
    return { success: false, error: err, status: response.status };
  } catch (e) {
    // Offline esetén sorba állítjuk
    await queueForRetry(showId, episode, animeName);
    return { success: false, error: 'network', queued: true };
  }
}

async function queueForRetry(showId, episode, animeName) {
  const r = await chrome.storage.local.get(['oni_queue']);
  const queue = r.oni_queue || [];
  const exists = queue.some(i => i.showId === showId && i.episode === episode);
  if (!exists) {
    queue.push({ showId, episode, animeName, ts: Date.now() });
    await chrome.storage.local.set({ oni_queue: queue });
  }
}

async function processQueue() {
  const r = await chrome.storage.local.get(['oni_queue']);
  const queue = r.oni_queue || [];
  if (!queue.length) return;
  const remaining = [];
  for (const item of queue) {
    const res = await syncEpisode(item.showId, item.episode, item.animeName);
    if (!res.success && !res.queued) remaining.push(item);
    // Ha nincs token még, ne próbálja tovább
    if (res.error === 'no_token') break;
  }
  await chrome.storage.local.set({ oni_queue: remaining });
}

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
  if (msg.type === 'SET_TOKEN') {
    chrome.storage.local.set({ oni_api_token: msg.token }, () => {
      processQueue(); // azonnal feldolgozza a sort
      sendResponse({ success: true });
    });
    return true;
  }
  if (msg.type === 'GET_TOKEN_STATUS') {
    chrome.storage.local.get(['oni_api_token'], r => {
      sendResponse({ hasToken: !!r.oni_api_token });
    });
    return true;
  }
});

// 5 percenként feldolgozza az offline sort
chrome.alarms.create('retryQueue', { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'retryQueue') processQueue();
});

chrome.runtime.onStartup.addListener(processQueue);
