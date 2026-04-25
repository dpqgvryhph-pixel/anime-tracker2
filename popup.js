// OniAnime Tracker - Popup
(async function() {
  // Load config
  chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, (config) => {
    if (config) {
      document.getElementById('url').value = config.url || '';
      document.getElementById('key').value = config.anonKey || '';
    }
  });

  async function loadStatus() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    const match = tab.url && tab.url.match(/onianime\.hu\/watch\/(\d+)\/(\d+)/);
    if (!match) {
      document.getElementById('showId').textContent = 'Nem watch oldal';
      document.getElementById('episode').textContent = '-';
      document.getElementById('progress').textContent = '-';
      document.getElementById('watchStatus').textContent = '-';
      document.getElementById('syncStatus').textContent = '-';
      return;
    }

    const showId = match[1], episode = match[2];
    document.getElementById('showId').textContent = showId;
    document.getElementById('episode').textContent = episode;

    // Extract Anime name from tab title
    let animeNameText = `Show ID: ${showId}`;
    if (tab.title) {
      let dTitle = tab.title.replace(/\| OniAnime/i, '').trim();
      if (dTitle.includes(' - ')) {
        animeNameText = dTitle.split(' - ')[0].trim();
      } else {
        animeNameText = dTitle;
      }
    }
    const nameEl = document.getElementById('animeName');
    if (nameEl) {
      nameEl.textContent = animeNameText;
      nameEl.title = animeNameText;
    }

    // Load local watch count
    const key = `watched_${showId}_${episode}`;
    chrome.storage.local.get([key], (r) => {
      const c = r[key] || 0;
      const el = document.getElementById('watchStatus');
      el.textContent = c > 0 ? `\u2713 Megnézve (${c}x)` : '\u2717 Nincs';
      el.style.color = c > 0 ? '#4ade80' : '#f87171';
    });

    // Get live status from content script
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

  document.getElementById('save').onclick = () => {
    const url = document.getElementById('url').value.trim();
    const anonKey = document.getElementById('key').value.trim();
    chrome.runtime.sendMessage({ type: 'SAVE_CONFIG', url, anonKey }, (r) => {
      const m = document.getElementById('msg');
      m.textContent = r && r.success ? '\u2713 Mentve' : 'Hiba';
      m.style.color = r && r.success ? '#4ade80' : '#f87171';
      setTimeout(() => { m.textContent = ''; }, 2000);
    });
  };

  const dashboardBtn = document.getElementById('open-dashboard');
  if (dashboardBtn) {
    dashboardBtn.onclick = () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/index.html') });
    };
  }
})();
