// OniAnime Tracker - Background Service Worker v3.1
// JAVÍTÁS: Retry logika + jobb hibakezelés a szinkronizáláshoz

const SUPABASE_URL = 'https://uctzsndnlmpsmniufrzg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdHpzbmRubG1wc21uaXVmcnpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTM5MTUsImV4cCI6MjA5MjY4OTkxNX0.anzOAGIclTRNtF8DwA6mqQIt0nSvAbwACGN76-rolHc';

async function sendToSupabase(showId, episode, animeName, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_watched_count`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          p_show_id: parseInt(showId),
          p_episode: parseInt(episode),
          p_anime_title: animeName
        })
      });

      if (response.ok) {
        console.log(`[OniAnime] ✓ Szinkronizálva (${attempt}. kísérlet): show ${showId}, ep ${episode}`);
        return { success: true };
      }

      const err = await response.text();
      console.warn(`[OniAnime] Kísérlet ${attempt}/${retries} sikertelen:`, err);

      // Ne próbálja újra ha 4xx hiba (kliens hiba)
      if (response.status >= 400 && response.status < 500) {
        return { success: false, error: err, status: response.status };
      }

      // Várj exponenciálisan növekvő időt (500ms, 1000ms, 2000ms)
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
      }
    } catch (e) {
      console.warn(`[OniAnime] Hálózati hiba (${attempt}/${retries}):`, e.message);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
      } else {
        return { success: false, error: e.message, network: true };
      }
    }
  }
  return { success: false, error: 'Max kísérletek kimerültek' };
}

// Offline sorba állítás
async function queueForRetry(showId, episode, animeName) {
  const key = 'oni_retry_queue';
  const stored = await chrome.storage.local.get([key]);
  const queue = stored[key] || [];
  
  // Duplikátum ellenőrzés
  const exists = queue.some(item => item.showId === showId && item.episode === episode);
  if (!exists) {
    queue.push({ showId, episode, animeName, timestamp: Date.now() });
    await chrome.storage.local.set({ [key]: queue });
    console.log(`[OniAnime] Sorba állítva offline feldolgozásra: show ${showId}, ep ${episode}`);
  }
}

async function processRetryQueue() {
  const key = 'oni_retry_queue';
  const stored = await chrome.storage.local.get([key]);
  const queue = stored[key] || [];
  if (queue.length === 0) return;

  console.log(`[OniAnime] Offline sor feldolgozása: ${queue.length} elem`);
  const remaining = [];

  for (const item of queue) {
    const result = await sendToSupabase(item.showId, item.episode, item.animeName, 1);
    if (!result.success) {
      remaining.push(item);
    }
  }

  await chrome.storage.local.set({ [key]: remaining });
  if (remaining.length < queue.length) {
    console.log(`[OniAnime] Sikeresen feldolgozva: ${queue.length - remaining.length} elem`);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EPISODE_WATCHED') {
    sendToSupabase(message.showId, message.episode, message.animeName)
      .then(async result => {
        if (!result.success && result.network) {
          // Hálózati hiba esetén sorba állítjuk
          await queueForRetry(message.showId, message.episode, message.animeName);
        }
        sendResponse(result);
      });
    return true;
  }

  if (message.type === 'GET_QUEUE_STATUS') {
    chrome.storage.local.get(['oni_retry_queue'], (r) => {
      sendResponse({ pending: (r.oni_retry_queue || []).length });
    });
    return true;
  }
});

// Online visszatéréskor feldolgozzuk a sort
self.addEventListener('fetch', () => {});
chrome.runtime.onStartup.addListener(processRetryQueue);

// Alarm a rendszeres retry-hoz (5 percenként)
chrome.alarms && chrome.alarms.create('retryQueue', { periodInMinutes: 5 });
chrome.alarms && chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'retryQueue') processRetryQueue();
});
