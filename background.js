// OniAnime Tracker - Background Service Worker
let state = {
  supabase: { url: '', anonKey: '' }
};

async function loadConfig() {
  const result = await chrome.storage.local.get(['supabaseUrl', 'supabaseAnonKey']);
  state.supabase.url = result.supabaseUrl || '';
  state.supabase.anonKey = result.supabaseAnonKey || '';
}

async function sendToSupabase(showId, episode, animeName) {
  if (!state.supabase.url || !state.supabase.anonKey) {
    console.log('[OniAnime] Supabase nincs konfigurálva');
    return { success: false, error: 'Konfig hiányzik' };
  }
  try {
    const response = await fetch(`${state.supabase.url}/rest/v1/rpc/increment_watched_count`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': state.supabase.anonKey,
        'Authorization': `Bearer ${state.supabase.anonKey}`
      },
      body: JSON.stringify({
        p_show_id: parseInt(showId),
        p_episode: parseInt(episode),
        p_anime_title: animeName
      })
    });
    if (response.ok) {
      console.log(`[OniAnime] Szinkronizálva: show ${showId}, ep ${episode}`);
      return { success: true };
    }
    const err = await response.text();
    console.error('[OniAnime] Hiba:', err);
    return { success: false, error: err };
  } catch (e) {
    console.error('[OniAnime] Hálózati hiba:', e);
    return { success: false, error: e.message };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EPISODE_WATCHED') {
    loadConfig().then(() => {
      sendToSupabase(message.showId, message.episode, message.animeName).then(sendResponse);
    });
    return true;
  }
  if (message.type === 'SAVE_CONFIG') {
    chrome.storage.local.set({
      supabaseUrl: message.url,
      supabaseAnonKey: message.anonKey
    }).then(() => {
      state.supabase.url = message.url;
      state.supabase.anonKey = message.anonKey;
      sendResponse({ success: true });
    });
    return true;
  }
  if (message.type === 'GET_CONFIG') {
    loadConfig().then(() => sendResponse(state.supabase));
    return true;
  }
});

loadConfig();
