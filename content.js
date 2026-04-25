(function() {
  'use strict';

  // === STATE ===
  let currentProgress = 0;
  let currentSyncText = 'Várakozás...';
  let currentSyncColor = '#94a3b8';
  let urlData = null;
  let overlay = null;
  let video = null;
  let triggered = false;
  let watchedCount = 0;
  let videoRetryTimer = null;

  // === URL PARSE ===
  function parseWatchUrl() {
    const match = window.location.pathname.match(/\/watch\/(\d+)\/(\d+)/);
    if (match) return { showId: parseInt(match[1]), episode: parseInt(match[2]) };
    return null;
  }

  // === MESSAGE LISTENER ===
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'GET_STATUS') {
      sendResponse({ progress: currentProgress, syncText: currentSyncText, syncColor: currentSyncColor });
      return true;
    }
  });

  // === OVERLAY ===
  function createOverlay() {
    if (overlay && document.body.contains(overlay)) return;
    overlay = document.createElement('div');
    overlay.id = 'onianime-tracker-overlay';
    overlay.style.cssText = [
      'position:fixed', 'bottom:80px', 'right:20px',
      'background:rgba(0,0,0,0.85)', 'color:#e2e8f0',
      'padding:10px 14px', 'border-radius:8px',
      'font-size:13px', 'font-family:Arial,sans-serif',
      'z-index:2147483647', 'pointer-events:none',
      'border:1px solid rgba(255,107,53,0.4)', 'min-width:160px',
      'line-height:1.5', 'box-shadow:0 4px 12px rgba(0,0,0,0.5)'
    ].join(';');
    document.body.appendChild(overlay);
  }

  // === EXTRACT ANIME INFO ===
  function extractAnimeInfo() {
    let titleText = `Show ID: ${urlData.showId}`;
    const h1 = document.querySelector('h1');
    if (h1 && h1.innerText.trim()) {
      titleText = h1.innerText.trim();
    } else if (document.title) {
      let dTitle = document.title.replace(/\| OniAnime/i, '').trim();
      titleText = dTitle.includes(' - ') ? dTitle.split(' - ')[0].trim() : dTitle;
    }
    return titleText;
  }

  function updateOverlay() {
    if (!overlay || !document.body.contains(overlay)) createOverlay();
    if (!urlData) return;
    const animeName = extractAnimeInfo();
    overlay.innerHTML = [
      '<div style="color:#ff6b35;font-weight:bold;margin-bottom:4px">📺 OniAnime Tracker</div>',
      `<div style="font-weight:bold;margin-bottom:2px;font-size:14px;color:#fff">${animeName}</div>`,
      `<div>Epizód: <b>${urlData.episode}</b></div>`,
      `<div>Haladás: <b>${Math.round(currentProgress)}%</b></div>`,
      `<div style="color:${currentSyncColor};margin-top:4px">${currentSyncText}</div>`
    ].join('');
  }

  // === WATCHED COUNT (lokális visszajelzéshez) ===
  function loadWatchedCount() {
    if (!urlData) return;
    chrome.storage.local.get([`wc_${urlData.showId}_${urlData.episode}`], r => {
      watchedCount = r[`wc_${urlData.showId}_${urlData.episode}`] || 0;
    });
  }

  // === SYNC (webes API-n keresztül) ===
  function syncToWeb() {
    if (!urlData || triggered) return;
    triggered = true;
    currentSyncText = 'Küldés...';
    currentSyncColor = '#facc15';
    updateOverlay();

    // Lokális számláló frissítése (azonnali visszajelzés)
    watchedCount++;
    const key = `wc_${urlData.showId}_${urlData.episode}`;
    chrome.storage.local.set({ [key]: watchedCount });

    chrome.runtime.sendMessage(
      { type: 'EPISODE_WATCHED', showId: urlData.showId, episode: urlData.episode, animeName: extractAnimeInfo() },
      result => {
        if (result && result.success) {
          currentSyncText = '✓ Szinkronizálva';
          currentSyncColor = '#4ade80';
        } else if (result && result.queued) {
          currentSyncText = '⏳ Offline sorba állítva';
          currentSyncColor = '#fbbf24';
        } else if (result && result.error === 'no_token') {
          currentSyncText = '⚠ API token hiányzik! Popup → Beállítás';
          currentSyncColor = '#f87171';
        } else {
          currentSyncText = 'Elmentve lokálisan';
          currentSyncColor = '#fbbf24';
        }
        updateOverlay();
      }
    );
  }

  // === VIDEO TRACKING ===
  function findVideo() {
    const selectors = ['video', '#slider video', '.plyr video', '[data-plyr] video', 'video[src]'];
    for (const sel of selectors) {
      const v = document.querySelector(sel);
      if (v) return v;
    }
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      try {
        const v = iframe.contentDocument && iframe.contentDocument.querySelector('video');
        if (v) return v;
      } catch(e) { /* cross-origin */ }
    }
    return null;
  }

  function setupVideoTracking(v) {
    if (video === v) return;
    video = v;
    video.addEventListener('timeupdate', () => {
      if (!video.duration || video.duration === 0) return;
      currentProgress = (video.currentTime / video.duration) * 100;
      updateOverlay();
      if (currentProgress >= 80 && !triggered) syncToWeb();
    });
    video.addEventListener('ended', () => {
      currentProgress = 100;
      if (!triggered) syncToWeb();
      updateOverlay();
    });
  }

  function startVideoSearch() {
    if (videoRetryTimer) clearInterval(videoRetryTimer);
    let attempts = 0;
    videoRetryTimer = setInterval(() => {
      attempts++;
      const v = findVideo();
      if (v) {
        clearInterval(videoRetryTimer);
        videoRetryTimer = null;
        setupVideoTracking(v);
        currentSyncText = 'Figyelés...';
        updateOverlay();
      } else if (attempts >= 60) {
        clearInterval(videoRetryTimer);
        videoRetryTimer = null;
        currentSyncText = 'Videó nem található';
        currentSyncColor = '#f87171';
        updateOverlay();
      }
    }, 500);
  }

  // === INIT ===
  function init() {
    urlData = parseWatchUrl();
    if (!urlData) return;
    triggered = false;
    currentProgress = 0;
    currentSyncText = 'Inicializálás...';
    currentSyncColor = '#94a3b8';
    video = null;
    loadWatchedCount();
    createOverlay();
    updateOverlay();
    startVideoSearch();
  }

  // === SPA NAVIGÁCIÓ ===
  let lastUrl = window.location.href;
  const urlObserver = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      if (overlay && document.body.contains(overlay)) { overlay.remove(); overlay = null; }
      if (videoRetryTimer) { clearInterval(videoRetryTimer); videoRetryTimer = null; }
      setTimeout(init, 500);
    }
  });
  urlObserver.observe(document.body, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
