-- 1. Régi tábla törlése (hogy az új oszlopok is bekerüljenek)
DROP TABLE IF EXISTS watched_episodes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Tábla létrehozása az epizódoknak
CREATE TABLE watched_episodes (
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

-- 3. Felhasználók tábla (admin felülethez)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- 4. Admin felhasználó beillesztése (a DASHBOARD_USERNAME alapján)
-- FONTOS: Ezt manuálisan futtasd le, vagy ENV-ből töltsd fel:
-- INSERT INTO users (username, display_name, role) VALUES ('admin_felhasznalonev', 'Admin', 'admin');

-- 5. RLS (Row Level Security) - Supabase anon key csak olvashat
ALTER TABLE watched_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Anon kulcs olvashat watched_episodes-t (extension szükségeli)
CREATE POLICY "anon_read_watched" ON watched_episodes
  FOR SELECT TO anon USING (true);

-- Anon kulcs írhat watched_episodes-be (extension RPC-n keresztül)
CREATE POLICY "anon_insert_watched" ON watched_episodes
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_watched" ON watched_episodes
  FOR UPDATE TO anon USING (true);

-- Users tábla: csak service_role férhet hozzá (biztonság)
CREATE POLICY "service_only_users" ON users
  FOR ALL TO service_role USING (true);

-- 6. Függvény (RPC) létrehozása, amit a bővítmény meghív
CREATE OR REPLACE FUNCTION increment_watched_count(
    p_show_id INT,
    p_episode INT,
    p_anime_title TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO watched_episodes (show_id, episode, anime_title, watched_count, first_watched, last_watched)
    VALUES (p_show_id, p_episode, p_anime_title, 1, NOW(), NOW())
    ON CONFLICT (show_id, episode) DO UPDATE
    SET watched_count = watched_episodes.watched_count + 1,
        anime_title = COALESCE(EXCLUDED.anime_title, watched_episodes.anime_title),
        last_watched = NOW();
END;
$$;

-- 7. RPC jogosultság az anon kulcshoz
GRANT EXECUTE ON FUNCTION increment_watched_count TO anon;
