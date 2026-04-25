// OniAnime Tracker - Popup v2.3
(async function() {
  // Load Supabase config
  chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, (config) => {
    if (chrome.runtime.lastError) return;
    if (config) {
      document.getElementById('url').value = config.url || '';
      document.getElementById('key').value = config.anonKey || '';
    }
  });

  // Load Dashboard URL
  chrome.storage.local.get(['dashboardUrl'], (r) => {
    const urlInput = document.getElementById('dashboard-url');
    if (urlInput) urlInput.value = r.dashboardUrl || '';
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
      el.textContent = c > 0 ? `✓ Megnézve (${c}x)` : '✗ Nincs';
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

  // Refresh
  document.getElementById('refresh').onclick = loadStatus;

  // Save Supabase config
  document.getElementById('save').onclick = () => {
    const url = document.getElementById('url').value.trim();
    const anonKey = document.getElementById('key').value.trim();
    chrome.runtime.sendMessage({ type: 'SAVE_CONFIG', url, anonKey }, (r) => {
      showMsg(r && r.success ? '✓ Mentve' : 'Hiba', r && r.success);
    });
  };

  // Save Dashboard URL
  const saveDashBtn = document.getElementById('save-dashboard-url');
  if (saveDashBtn) {
    saveDashBtn.onclick = () => {
      const dashUrl = document.getElementById('dashboard-url').value.trim();
      chrome.storage.local.set({ dashboardUrl: dashUrl }, () => {
        showMsg('✓ Dashboard URL mentve', true);
      });
    };
  }

  // Open Dashboard
  const dashboardBtn = document.getElementById('open-dashboard');
  if (dashboardBtn) {
    dashboardBtn.onclick = () => {
      chrome.storage.local.get(['dashboardUrl'], (r) => {
        const dashUrl = r.dashboardUrl;
        if (!dashUrl) {
          showMsg('Előbb mentsd el a Dashboard URL-t!', false);
          return;
        }
        const url = dashUrl.startsWith('http') ? dashUrl : `https://${dashUrl}`;
        chrome.tabs.create({ url });
      });
    };
  }

  function showMsg(text, success) {
    const m = document.getElementById('msg');
    m.textContent = text;
    m.style.color = success ? '#4ade80' : '#f87171';
    setTimeout(() => { m.textContent = ''; }, 2500);
  }
})();
