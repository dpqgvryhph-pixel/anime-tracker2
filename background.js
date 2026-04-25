// OniAnime Tracker - Background Service Worker
// Supabase config hardcoded - nincs szükség manuális beállításra
const SUPABASE_URL = 'https://uctzsndnlmpsmniufrzg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdHpzbmRubG1wc21uaXVmcnpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTM5MTUsImV4cCI6MjA5MjY4OTkxNX0.anzOAGIclTRNtF8DwA6mqQIt0nSvAbwACGN76-rolHc';

async function sendToSupabase(showId, episode, animeName) {
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
    sendToSupabase(message.showId, message.episode, message.animeName).then(sendResponse);
    return true;
  }
});
