# 🎌 OniAnime Tracker — Telepítési Útmutató

## Projekt felépítése

```
onianime-dashboard/   ← Next.js weboldal (Cloudflare Pages-re megy)
onianime-extension/   ← Chrome bővítmény
supabase_setup.sql    ← Supabase adatbázis séma
```

---

## 1. SUPABASE BEÁLLÍTÁS

1. Menj ide: https://supabase.com → Hozz létre egy fiókot + projektet
2. Menj a **SQL Editor**-ba
3. Másold be és futtasd a `supabase_setup.sql` tartalmát
4. Menj a **Project Settings → API** oldalra
5. Mentsd el:
   - **Project URL** (pl. `https://abcdef.supabase.co`)
   - **anon public key** (hosszú JWT token)

---

## 2. WEBOLDAL — GITHUB + CLOUDFLARE PAGES DEPLOY

### 2a. GitHub repo létrehozása

1. Hozz létre egy új (privát!) GitHub repo-t
2. Töltsd fel az `onianime-dashboard/` mappa tartalmát
3. **FONTOS**: A `.env` fájlt ne töltsd fel! (`.gitignore` már tartalmazza)

### 2b. Cloudflare Pages Deploy

1. Menj ide: https://dash.cloudflare.com/ → Pages and Workers → Create an application → Pages → Connect to Git
2. Válaszd ki a GitHub repo-dat
3. Framework preset: Next.js (Edge) vagy használd a `wrangler.toml`-t.
4. **Environment Variables** beállítása (KÖTELEZŐ):

   | Változó neve | Értéke |
   |---|---|
   | `SUPABASE_URL` | `https://xxxxx.supabase.co` |
   | `SUPABASE_ANON_KEY` | `eyJhbGci...` (az anon key) |
   | `DASHBOARD_USERNAME` | `sajat_felhasznalonev` |
   | `DASHBOARD_PASSWORD` | `sajat_jelszo` |

5. Kattints **Save and Deploy**-ra
6. A weboldal elérhető lesz pl. `https://onianime-dashboard.pages.dev`

### 2c. Egyedi domain (opcionális)
- Cloudflare Pages → Custom Domains → Set up a custom domain

---

## 3. CHROME BŐVÍTMÉNY TELEPÍTÉSE

1. Nyisd meg a Chrome-ot
2. Menj ide: `chrome://extensions/`
3. Kapcsold be a **Fejlesztői módot** (jobb felső sarok)
4. Kattints: **"Kicsomagolt bővítmény betöltése"**
5. Válaszd ki az `onianime-extension/` mappát
6. A bővítmény ikonja megjelenik a böngészőben

### Bővítmény konfigurálása:
1. Kattints a bővítmény ikonra
2. **SUPABASE BEÁLLÍTÁS** részbe írd be:
   - Project URL-t
   - Anon Key-t
   - Kattints **💾 Mentés**
3. **DASHBOARD** részbe írd be a Cloudflare Pages URL-t (pl. `https://onianime-tracker.pages.dev`)
4. Kattints **💾 URL Mentése**
5. A **📊 Megnyitás** gombbal nyithatsz be a dashboardra

---

## 4. HASZNÁLAT

1. Menj az onianime.hu-ra, nyiss meg egy animét
2. A bővítmény automatikusan figyeli a lejátszást
3. Ha **80%**-nál jár, szinkronizál Supabase-be
4. A dashboardon **felhasználónév + jelszó** kombinációval lépsz be
5. Láthatod az összes statisztikát: idő, animék, epizódok, grafikonok

---

## 5. BIZTONSÁG

- A **jelszó soha nem kerül a kódba** — csak Cloudflare Pages Environment Variables-ban van
- A Supabase kulcsok is csak szerver oldalon futnak (nem látja a böngésző)
- A `.env` fájl a `.gitignore`-ban van, nem kerül fel GitHub-ra
- A bejelentkezési cookie httpOnly és secure módban van

---

## Hibaelhárítás

**"Supabase nincs konfigurálva"** → Ellenőrizd a Cloudflare Pages ENV változókat

**"Hibás felhasználónév vagy jelszó"** → Ellenőrizd a `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` értékeket Cloudflare-en

**Bővítmény nem szinkronizál** → Ellenőrizd a Supabase URL-t és kulcsot a popup-ban

**Dashboard nem tölt be** → Ellenőrizd hogy a Cloudflare deploy sikeres volt-e
