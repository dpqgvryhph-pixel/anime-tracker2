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
  let initialized = false;

  // === URL PARSE ===
  function parseWatchUrl() {
    const match = window.location.pathname.match(/\/watch\/(\d+)\/(\d+)/);
    if (match) return { showId: parseInt(match[1]), episode: parseInt(match[2]) };
    return null;
  }

  // === MESSAGE LISTENER ===
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'GET_STATUS') {
      sendResponse({
        progress: currentProgress,
        syncText: currentSyncText,
        syncColor: currentSyncColor
      });
      return true;
    }
  });

  // === OVERLAY ===
  function createOverlay() {
    if (overlay && document.body.contains(overlay)) return;
    overlay = document.createElement('div');
    overlay.id = 'onianime-tracker-overlay';
    overlay.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'right:20px',
      'background:rgba(0,0,0,0.85)',
      'color:#e2e8f0',
      'padding:10px 14px',
      'border-radius:8px',
      'font-size:13px',
      'font-family:Arial,sans-serif',
      'z-index:2147483647',
      'pointer-events:none',
      'border:1px solid rgba(255,107,53,0.4)',
      'min-width:160px',
      'line-height:1.5',
      'box-shadow:0 4px 12px rgba(0,0,0,0.5)'
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
      if (dTitle.includes(' - ')) {
        titleText = dTitle.split(' - ')[0].trim();
      } else {
        titleText = dTitle;
      }
    }
    
    return titleText;
  }

  function updateOverlay() {
    if (!overlay || !document.body.contains(overlay)) createOverlay();
    if (!urlData) return;
    
    let animeName = extractAnimeInfo();
    
    overlay.innerHTML = [
      '<div style="color:#ff6b35;font-weight:bold;margin-bottom:4px">📺 OniAnime Tracker</div>',
      `<div style="font-weight:bold; margin-bottom:2px; font-size:14px; color:#fff">${animeName}</div>`,
      `<div>Epizód: <b>${urlData.episode}</b></div>`,
      `<div>Haladás: <b>${Math.round(currentProgress)}%</b></div>`,
      `<div style="color:${currentSyncColor}; margin-top:4px">${currentSyncText}</div>`
    ].join('');
  }

  // === WATCHED COUNT ===
  function loadWatchedCount() {
    if (!urlData) return;
    const key = `watched_${urlData.showId}_${urlData.episode}`;
    chrome.storage.local.get([key], (r) => {
      watchedCount = r[key] || 0;
    });
  }

  // === SUPABASE SYNC ===
  function syncToSupabase() {
    if (!urlData || triggered) return;
    triggered = true;
    currentSyncText = 'Küldés...';
    currentSyncColor = '#facc15';
    updateOverlay();

    // Mentjük lokálisan mindenképp
    watchedCount++;
    const key = `watched_${urlData.showId}_${urlData.episode}`;
    chrome.storage.local.set({ [key]: watchedCount });

    chrome.runtime.sendMessage(
      { type: 'EPISODE_WATCHED', showId: urlData.showId, episode: urlData.episode, animeName: extractAnimeInfo() },
      (result) => {
        if (result && result.success) {
          currentSyncText = '✓ Szinkronizálva';
          currentSyncColor = '#4ade80';
        } else {
          // Csak figyelmeztetés, de lokálisan már elmentettük
          currentSyncText = 'Mentve lokálisan (Supa: ' + (result && result.error ? result.error.substring(0, 15) : 'nincs') + ')';
          currentSyncColor = '#fbbf24';
        }
        updateOverlay();
      }
    );
  }

  // === VIDEO TRACKING ===
  function findVideo() {
    // Try multiple selectors for OniAnime's player
    const selectors = [
      'video',
      '#slider video',
      '.plyr video',
      '[data-plyr] video',
      'video[src]',
      'video.html5-main-video'
    ];
    for (const sel of selectors) {
      const v = document.querySelector(sel);
      if (v) return v;
    }
    // Try all iframes
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
    if (video === v) return; // already tracking this video
    video = v;
    console.log('[OniAnime] Video element found:', v);

    video.addEventListener('timeupdate', () => {
      if (!video.duration || video.duration === 0) return;
      currentProgress = (video.currentTime / video.duration) * 100;
      updateOverlay();

      if (currentProgress >= 80 && !triggered) {
        syncToSupabase();
      }
    });

    video.addEventListener('ended', () => {
      currentProgress = 100;
      if (!triggered) syncToSupabase();
      updateOverlay();
    });
  }

  function startVideoSearch() {
    if (videoRetryTimer) clearInterval(videoRetryTimer);
    let attempts = 0;
    const maxAttempts = 60; // 30 seconds

    videoRetryTimer = setInterval(() => {
      attempts++;
      const v = findVideo();
      if (v) {
        clearInterval(videoRetryTimer);
        videoRetryTimer = null;
        setupVideoTracking(v);
        currentSyncText = 'Figyelendő...';
        updateOverlay();
      } else if (attempts >= maxAttempts) {
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
    if (!urlData) return; // not a watch page

    // Reset state
    triggered = false;
    currentProgress = 0;
    currentSyncText = 'Inicializálás...';
    currentSyncColor = '#94a3b8';
    video = null;

    loadWatchedCount();
    createOverlay();
    updateOverlay();
    startVideoSearch();

    console.log('[OniAnime] Initialized for show', urlData.showId, 'ep', urlData.episode);
  }

  // === SPA NAVIGATION (Next.js) ===
  let lastUrl = window.location.href;
  const urlObserver = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      // Clean up old overlay
      if (overlay && document.body.contains(overlay)) {
        overlay.remove();
        overlay = null;
      }
      if (videoRetryTimer) {
        clearInterval(videoRetryTimer);
        videoRetryTimer = null;
      }
      // Re-init after short delay for page to load
      setTimeout(init, 500);
    }
  });

  urlObserver.observe(document.body, { childList: true, subtree: true });

  // Initial run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
