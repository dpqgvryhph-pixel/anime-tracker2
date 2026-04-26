# Secrets Setup

## Cloudflare Pages → Settings → Environment Variables

Add these variables under Production:

| Variable | Description | Example |
|---|---|---|
| SUPABASE_URL | Supabase projekt URL | https://xxx.supabase.co |
| SUPABASE_ANON_KEY | Supabase anon key | eyJ... |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key | eyJ... |
| EXTENSION_API_TOKEN | Chrome extension auth token | oni_... |
| ADMIN_USERNAME | Dashboard admin belepes | admin |
| ADMIN_PASSWORD | Dashboard admin jelszo | admin |

## Token formatum

Az EXTENSION_API_TOKEN mindig `oni_` prefixszel kezdodjon, majd egy hosszu random ertek kovetkezzen:

```
oni_a8f3k2p9x7m4n6q1w5e0r3t8y2u6i9o4j7l1z5c8v3b0n2m4q6w8e1r7t5y3u9i2o0p4
```

Ezt az erteket a Chrome extension popup-jaban is be kell allitani (oni_api_token neven tarolodik).

## Admin bejelentkezes modositasa

Az `ADMIN_USERNAME` es `ADMIN_PASSWORD` erteket a Cloudflare Pages Settings > Environment Variables helyen lehet modositani.

Jelenleg beallitott ertekek:
- ADMIN_USERNAME=admin
- ADMIN_PASSWORD=admin

> Figyelem: Az admin/admin nagyon gyenge jelszo! Valts erosebb jelszora, ha az oldal publikusan elerhető.

## Fontos

- **Ne commitold a valodi secreteket GitHubra!**
- Csak a `.env.example` sablon fajlt tartsd a repoban
- A valodi ertekeket mindig Cloudflare-ben add meg
- Az extension token es a Cloudflare env token ertekenek egyezni kell
