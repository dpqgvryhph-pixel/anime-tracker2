// OniAnime Tracker - Popup v3.1
// JAVÍTÁS: Jobb státusz megjelenítés + offline sor jelzés
(async function() {

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

    // Anime neve a tab titleből
    let animeName = `Show ID: ${showId}`;
    if (tab.title) {
      let dTitle = tab.title.replace(/\| OniAnime/i, '').trim();
      animeName = dTitle.includes(' - ') ? dTitle.split(' - ')[0].trim() : dTitle;
    }
    const nameEl = document.getElementById('animeName');
    nameEl.textContent = animeName;
    nameEl.title = animeName;

    // Lokális megnézési szám
    const key = `watched_${showId}_${episode}`;
    chrome.storage.local.get([key], (r) => {
      const c = r[key] || 0;
      const el = document.getElementById('watchStatus');
      el.textContent = c > 0 ? `✓ Megnézve (${c}x)` : '✗ Nincs';
      el.style.color = c > 0 ? '#4ade80' : '#f87171';
    });

    // Offline sor ellenőrzése
    try {
      const queueRes = await chrome.runtime.sendMessage({ type: 'GET_QUEUE_STATUS' });
      updateQueueBadge(queueRes ? queueRes.pending : 0);
    } catch(e) {
      updateQueueBadge(0);
    }

    // Élő státusz a content scripttől
    try {
      const res = await chrome.tabs.sendMessage(tab.id, { type: 'GET_STATUS' });
      if (res) {
        document.getElementById('progress').textContent = Math.round(res.progress || 0) + '%';
        const s = document.getElementById('syncStatus');
        s.textContent = res.syncText || '-';
        s.style.color = res.syncColor || '#94a3b8';
      }
    } catch (e) {
      // A content script talán még nem töltött be (pl. friss tab)
      document.getElementById('progress').textContent = '0%';
      document.getElementById('syncStatus').textContent = 'Oldal betöltésére vár...';
      document.getElementById('syncStatus').style.color = '#94a3b8';
    }
  }

  function updateQueueBadge(count) {
    const badge = document.getElementById('queueBadge');
    if (!badge) return;
    if (count > 0) {
      badge.textContent = `⚠ ${count} szinkronizálatlan`;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }

  loadStatus();
  document.getElementById('refresh').onclick = loadStatus;

})();
