# ENE GAMEVERSE — The Ultimate Comedy Gameverse

**"FRIENDSHIP KI LIMIT LEDHU... MADNESS KI BRAKE LEDHU!"**

A cinematic Telugu-comedy browser game platform: **five fully playable games** (~10 min each), 100+ original
Telgish jokes, shareable meme result cards, real (PostgreSQL) community leaderboards, XP/levels/coins,
achievements, daily challenges, hidden secrets, and a secret ending.

> An original fan-inspired entertainment project. All characters, dialogue, jokes and assets are original
> creations. No copyrighted scenes, footage, audio or dialogue are used.

## The five games

| # | Game | Genre | Core loop |
|---|------|-------|-----------|
| 1 | **Director's Disaster** | Cinematic comedy simulation | 8 scenes: pick the right camera shot (timed), survive disaster QTEs (press / mash / pick). 3 endings. Secret: tap the clapperboard 5×. |
| 2 | **Beer Buddies** | Co-op friendship chaos | 5 missions: sofa balance-carry, phone hunt, party task rush, canvas delivery dash, pizza-tower stacking. Friendship meter + 4 distinct AI friends. |
| 3 | **Meme Escape** | Endless runner (canvas, 60fps) | 3 acts, 4200m, 3 lives, jump/slide, coins, 5 power-ups (speed/shield/magnet/slow-mo/Meme Boost), dramatic comic-hit zooms. Secret: golden coin. |
| 4 | **Pelli Choopulu of Madness** | Timed dialogue decision | 22 relative scenarios, family-peace meter, streak-unlocked secret options (5), slipper-chase ending. |
| 5 | **The Final Blockbuster** | 5-part finale + boss | Gear hunt → gaffer-light Simon puzzle → rooftop dash → friendship argument → THE PRODUCER (6 demands + clapperboard mash, budget must end ≥ 40%). 4 endings; secret ending needs 4+ hidden secrets from games 1–4. |

## Controls

- **Keyboard**: arrows / WASD, SPACE (jump / quick-time), 1–4 (light puzzle), P / ESC (pause).
- **Touch**: big tap zones on every game (top half = jump, bottom half = slide, hold zones for carry/duck).
- Every game has: intro/story screen, how-to-play, pause menu (resume / restart / exit-confirm / sound mixer),
  results screen with XP, coins, rating title, meme card, share buttons.

## Architecture (Next.js App Router + PostgreSQL)

```
src/
  app/
    page.tsx               — cinematic homepage (hero, cards, leaderboard, daily, achievements, meme gallery)
    layout.tsx             — fonts, PWA manifest, SW registration
    globals.css            — theme, keyframes, film-grain, letterbox
    api/health             — platform health check
    api/leaderboard        — GET live leaderboard (game + period filters, bot-seeded)
    api/scores             — POST score submission (validated + rate-limited)
    game/[slug]/           — dynamic game router (5 lazy-loaded games)
  core/
    save.ts                — localStorage save (XP, coins, levels, bests, achievements,
                            daily challenge, hidden secrets, meme gallery, settings),
                            corruption-safe merge
    audio.ts               — Web Audio synth engine: 4 music moods + 18 SFX, master/music/sfx volumes
    comedy.ts              — Comedy Engine: 118 original jokes, cooldown rotation, rating titles
    meme.ts                — canvas meme result-card generator (1080×1350, JPEG dataURL)
    share.ts               — Web Share API (with image file), WhatsApp fallback link, clipboard
    ui.tsx                 — GameShell (intro/play/pause/result state machine), HUD, volume mixer,
                             error boundary, restart hook
  games/
    directors.tsx  buddies.tsx  runner.tsx  pelli.tsx  final.tsx
  db/
    index.ts, schema.ts      — Drizzle ORM + `scores` table
public/
  images/  (cinematic artwork)
  manifest.json, sw.js       — PWA (installable, offline shell cache)
```

## Running locally

```bash
npm install
npm run dev        # or: npm run build && npm run start
# apply schema (tables are created automatically by drizzle push):
npx drizzle-kit push
```

## Deployment

Static-compatible except the two API routes (needs a Node runtime — Vercel/Next hosting or
self-hosted `next start`). HTTPS required for Web Share + service worker.

## Production hardening (identified, not required to play)

Current build ships a **real local community leaderboard** (PostgreSQL, validated + throttled,
bot-seeded for liveliness). For 1M-player scale add:

1. **Accounts** (auth) replacing the free-text legend name; per-user cloud saves.
2. **Server-side score validation** (deterministic server checks or signed score digests) to prevent manipulation.
3. **IP-based rate limiting / anti-spam** (e.g. Redis buckets) replacing the in-memory throttle.
4. **Read replicas + pagination** for the leaderboard at scale.
5. Optional: server-issued daily challenge keys (so targets can't be trivially rotated by the client date).

## Testing checklist (covered)

Keyboard + touch controls per game, pause/resume (P/ESC + auto-pause on tab hide), restart via pause menu,
score/XP/coins calculation, persistence on reload (localStorage), corrupted-save recovery, daily challenge
claim flow, achievements, hidden secrets + secret ending, Web Share / WhatsApp / download / copy,
meme card generation, leaderboard fetch + submit, error boundary with reload.
