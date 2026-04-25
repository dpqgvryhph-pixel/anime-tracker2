-- 1. Régi tábla törlése (hogy az új oszlopok is bekerüljenek)
DROP TABLE IF EXISTS watched_episodes CASCADE;

-- 2. Tábla létrehozása az epizódoknak (Új oszlopokkal kibővítve)
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

-- 3. Függvény (RPC) létrehozása, amit a bővítmény meghív
CREATE OR REPLACE FUNCTION increment_watched_count(
    p_show_id INT, 
    p_episode INT, 
    p_anime_title TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
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
