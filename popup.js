// OniAnime Tracker - Popup v3.0
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
      el.textContent = c > 0 ? `\u2713 Megn\u00e9zve (${c}x)` : '\u2717 Nincs';
      el.style.color = c > 0 ? '#4ade80' : '#f87171';
    });

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
      document.getElementById('progress').textContent = 'N/A';
      document.getElementById('syncStatus').textContent = 'Content script nem fut';
      document.getElementById('syncStatus').style.color = '#f87171';
    }
  }

  loadStatus();
  document.getElementById('refresh').onclick = loadStatus;

})();
