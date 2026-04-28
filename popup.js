// OniAnime Tracker - Popup v4.0
// Új arch: token kezelés + webes dashboard link
(async function() {

  // === BEJELENTKEZÉS KEZELÉS ===
  async function checkAuth() {
    const res = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' });
    return res && res.isLoggedIn;
  }

  async function init() {
    const isLoggedIn = await checkAuth();
    if (!isLoggedIn) {
      document.getElementById('tokenPanel').style.display = 'block';
      document.getElementById('statusPanel').style.display = 'none';
      document.getElementById('loginError').style.display = 'none';
    } else {
      document.getElementById('tokenPanel').style.display = 'none';
      document.getElementById('statusPanel').style.display = 'block';
      await loadStatus();
    }
  }

  document.getElementById('saveToken').addEventListener('click', async () => {
    const username = document.getElementById('usernameInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();
    if (!username || !password) return;
    
    const btn = document.getElementById('saveToken');
    btn.textContent = 'Betöltés...';
    btn.disabled = true;

    const res = await chrome.runtime.sendMessage({ type: 'LOGIN', username, password });
    
    btn.textContent = 'Bejelentkezés';
    btn.disabled = false;

    if (res && res.success) {
      document.getElementById('loginError').style.display = 'none';
      init(); // Újraindul a panel
    } else {
      const errEl = document.getElementById('loginError');
      errEl.textContent = res.error || 'Hibás bejelentkezési adatok!';
      errEl.style.display = 'block';
    }
  });

  const onEnter = e => { if (e.key === 'Enter') document.getElementById('saveToken').click(); };
  document.getElementById('usernameInput').addEventListener('keydown', onEnter);
  document.getElementById('passwordInput').addEventListener('keydown', onEnter);

  document.getElementById('resetToken').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'LOGOUT' });
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
