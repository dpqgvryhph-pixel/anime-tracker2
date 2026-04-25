-- OniAnime Tracker - Supabase Setup v2.1
-- BIZTONSÁGOS: nem törli a meglévő adatokat!
-- Használd ezt Supabase SQL Editor-ban.

-- 1. Táblák létrehozása (ha nem léteznek)
CREATE TABLE IF NOT EXISTS watched_episodes (
  id SERIAL PRIMARY KEY,
  show_id INTEGER NOT NULL,
  episode INTEGER NOT NULL,
  anime_title TEXT,
  watched_count INTEGER DEFAULT 1,
  duration_minutes INTEGER DEFAULT 24,
  first_watched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_watched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(show_id, episode)
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- 2. RLS bekapcsolása
ALTER TABLE watched_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. RLS policy-k (DROP IF EXISTS hogy ne duplikálódjon)
DROP POLICY IF EXISTS "anon_read_watched" ON watched_episodes;
DROP POLICY IF EXISTS "anon_insert_watched" ON watched_episodes;
DROP POLICY IF EXISTS "anon_update_watched" ON watched_episodes;
DROP POLICY IF EXISTS "service_only_users" ON users;

CREATE POLICY "anon_read_watched" ON watched_episodes
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_watched" ON watched_episodes
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_watched" ON watched_episodes
  FOR UPDATE TO anon USING (true);

CREATE POLICY "service_only_users" ON users
  FOR ALL TO service_role USING (true);

-- 4. Meglévő NULL duration_minutes sorok javítása
UPDATE watched_episodes
  SET duration_minutes = 24
  WHERE duration_minutes IS NULL OR duration_minutes = 0;

-- 5. RPC függvény: epizód nézés rögzítése (INSERT/UPDATE)
-- Explicit duration_minutes = 24 az INSERT-ben, hogy soha ne legyen NULL
DROP FUNCTION IF EXISTS increment_watched_count(integer, integer, text);

CREATE OR REPLACE FUNCTION increment_watched_count(
  p_show_id INT,
  p_episode INT,
  p_anime_title TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  INSERT INTO watched_episodes (show_id, episode, anime_title, watched_count, duration_minutes, first_watched, last_watched)
  VALUES (p_show_id, p_episode, p_anime_title, 1, 24, NOW(), NOW())
  ON CONFLICT (show_id, episode) DO UPDATE
    SET watched_count = watched_episodes.watched_count + 1,
        anime_title = COALESCE(EXCLUDED.anime_title, watched_episodes.anime_title),
        duration_minutes = COALESCE(watched_episodes.duration_minutes, 24),
        last_watched = NOW()
  RETURNING row_to_json(watched_episodes.*) INTO result;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_watched_count TO anon;
GRANT EXECUTE ON FUNCTION increment_watched_count TO service_role;

-- 6. Schema reload
NOTIFY pgrst, 'reload schema';

-- ============================================
-- KAPCSOLATI ADATOK (csak információ, nem fut)
-- ============================================
-- SUPABASE_URL: https://uctzsndnlmpsmniufrzg.supabase.co
-- EXTENSION_API_TOKEN: oni_sk_live_uctzsndnl_a7x9k2p4m8n3q6r1t5w0y
-- Dashboard bejelentkezés: admin / OniAdmin2024!
