// OniAnime Tracker - Popup v4.0
// Új arch: token kezelés + webes dashboard link
(async function() {

  // === TOKEN KEZELÉS ===
  async function checkToken() {
    const res = await chrome.runtime.sendMessage({ type: 'GET_TOKEN_STATUS' });
    return res && res.hasToken;
  }

  async function init() {
    const hasToken = await checkToken();
    if (!hasToken) {
      document.getElementById('tokenPanel').style.display = 'block';
      document.getElementById('statusPanel').style.display = 'none';
    } else {
      document.getElementById('tokenPanel').style.display = 'none';
      document.getElementById('statusPanel').style.display = 'block';
      await loadStatus();
    }
  }

  document.getElementById('saveToken').addEventListener('click', async () => {
    const token = document.getElementById('tokenInput').value.trim();
    if (!token) return;
    const res = await chrome.runtime.sendMessage({ type: 'SET_TOKEN', token });
    if (res && res.success) {
      init(); // Újraindul a panel
    }
  });

  document.getElementById('tokenInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('saveToken').click();
  });

  document.getElementById('resetToken').addEventListener('click', async () => {
    await chrome.storage.local.remove(['oni_api_token']);
    init();
  });

  // === STÁTUSZ BETÖLTÉSE ===
  async function loadStatus() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    const match = tab.url && tab.url.match(/onianime\.hu\/watch\/(\d+)\/(\d+)/);
    if (!match) {
      document.getElementById('animeName').textContent = '-';
      document.getElementById('episode').textContent = '-';
      document.getElementById('progress').textContent = 'Nem watch oldal';
      document.getElementById('watchStatus').textContent = '-';
      document.getElementById('syncStatus').textContent = '-';
      updateQueueBadge(0);
      return;
    }

    const showId = match[1], episode = match[2];
    document.getElementById('episode').textContent = episode;

    let animeName = `Show ID: ${showId}`;
    if (tab.title) {
      let dTitle = tab.title.replace(/\| OniAnime/i, '').trim();
      animeName = dTitle.includes(' - ') ? dTitle.split(' - ')[0].trim() : dTitle;
    }
    const nameEl = document.getElementById('animeName');
    nameEl.textContent = animeName;
    nameEl.title = animeName;

    // Státusz lekérése a webes API-ról
    const el = document.getElementById('watchStatus');
    el.textContent = 'Betöltés...';
    el.style.color = '#94a3b8';

    chrome.runtime.sendMessage({ type: 'CHECK_EPISODE_STATUS', showId, episode }, (res) => {
      if (res && res.success && res.data && res.data.watched) {
        const c = res.data.data.watched_count || 1;
        el.textContent = `✓ Megnézve (${c}x) [Web]`;
        el.style.color = '#4ade80';
        
        // Frissítjük a lokális cache-t is
        const key = `wc_${showId}_${episode}`;
        chrome.storage.local.set({ [key]: c });
      } else {
        // Fallback lokális cache-re, ha a web nem válaszol vagy nincs meg
        const key = `wc_${showId}_${episode}`;
        chrome.storage.local.get([key], r => {
          const c = r[key] || 0;
          el.textContent = c > 0 ? `✓ Megnézve (${c}x) [Lokális]` : '✗ Nincs';
          el.style.color = c > 0 ? '#fbbf24' : '#f87171';
        });
      }
    });

    // Offline sor
    try {
      const queueRes = await chrome.runtime.sendMessage({ type: 'GET_QUEUE_STATUS' });
      updateQueueBadge(queueRes ? queueRes.pending : 0);
    } catch(e) { updateQueueBadge(0); }

    // Élő státusz
    try {
      const res = await chrome.tabs.sendMessage(tab.id, { type: 'GET_STATUS' });
      if (res) {
        document.getElementById('progress').textContent = Math.round(res.progress || 0) + '%';
        const s = document.getElementById('syncStatus');
        s.textContent = res.syncText || '-';
        s.style.color = res.syncColor || '#94a3b8';
      }
    } catch (e) {
      document.getElementById('progress').textContent = '0%';
      document.getElementById('syncStatus').textContent = 'Oldal betöltésére vár...';
      document.getElementById('syncStatus').style.color = '#94a3b8';
    }
  }

  function updateQueueBadge(count) {
    const badge = document.getElementById('queueBadge');
    if (!badge) return;
    badge.textContent = count > 0 ? `⚠ ${count} szinkronizálatlan epizód` : '';
    badge.style.display = count > 0 ? 'block' : 'none';
  }

  document.getElementById('refresh').onclick = loadStatus;
  init();

})();
