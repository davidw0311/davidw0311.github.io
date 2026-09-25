# Nightfall / One Night Werewolf

`/nightfall/` is the website's game collection. The existing `/werewolf/` game keeps its own routes, implementation, audio and backend. `/nightfall/one-night/` is a separate bilingual multiplayer game.

## Rules and scope

The catalogue includes the original One Night Ultimate Werewolf, Daybreak, Vampire, Alien, Super Villains / Super Heroes, and the roles from Bonus Packs 1–4. Alternate artwork does not create another role. One Week Ultimate Werewolf and Werewords are separate games.

The factual rules research, source links, copying rules and mixed-expansion edge cases are in [core research](one-night-core-research.md) and [expansion research](one-night-expansions-research.md). The interface contract is in [one-night-contract.md](one-night-contract.md).

Alien's publisher does not document the companion app's entire random-event catalogue. This implementation uses a labeled pool of published-rule variants, not a reproduction of every proprietary random event. It does not implement the app's full-night time loops. Mixed Villain/monster faction conventions and unresolved multi-faction Cursed votes are documented digital rules.

## Architecture and privacy

- Static Next.js client, deployed to GitHub Pages with the existing website.
- Dedicated `one-night` Supabase Edge Function, with independent `one_night_state`, `one_night_read` and `one_night_cas`. No changes to existing game or PianoParty data.
- Cards, votes and player-token hashes stay in the service. The host receives only public state and their own private information.
- Versioned compare-and-swap transactions serialize concurrent moves. Stable request IDs make retries safe after lost responses. Host-approved replacement preserves the seat and revokes the old session.
- Rooms expire after 24 hours without actions. Rematches clear the completed round. Disbanded rooms expire after one minute. SQL cleanup runs even with no browser connected.

## Narration

All One Night spoken prompts are generated locally with Kokoro: English `am_michael` (Kokoro-82M), Mandarin `zm_010` (Kokoro-82M-v1.1-zh), normal speed. No speech subscription is used. Individual files and transcripts are available at `/assets/one-night/audio/`.

```sh
node scripts/build-one-night-audio-text.mjs
~/.local/share/kokoro/.venv/bin/python scripts/generate-one-night-kokoro.py
node scripts/build-one-night-audio-review.mjs
```

Audio uses persistent media elements unlocked by a tap for iPhone Safari. Existing licensed ambience and timer sounds are reused without changing their files. Night actions never time out just because a player goes offline; the host may explicitly skip a stuck action without seeing its actors.

## Verification and deployment

```sh
node scripts/build-one-night-edge.mjs
node --test api/test/one-night*.test.js
node --no-warnings --test tests/*.test.ts
npm run typecheck
```

The generated Edge modules must match the tested sources in `api/src/one-night/`. Apply `supabase/migrations/202609250001_one_night.sql` once, then deploy only the `one-night` function. The browser config contains a public project key, never the service key. Gateway verification stays enabled.

For local multiplayer testing, run `node scripts/one-night-local-server.mjs`, then Next on port 3010 with `NEXT_PUBLIC_ONE_NIGHT_API_URL=http://localhost:4501`. The local adapter uses disposable memory only; production uses the private Supabase table.

`api/test/one-night-large-games.test.js` runs reproducible full games with 12–16 players, varied actions and votes, replacement sessions, and private-information checks. Increase the per-preset sample count with `ONE_NIGHT_SIMULATIONS`. Mixed-expansion games separately exercise copies, shields, and independent teams.

To verify an entire preset through the public HTTP API, run `ONE_NIGHT_PRESET=grand-wolf-table-16 node scripts/one-night-live-smoke.mjs`. Set `ONE_NIGHT_API_URL=http://localhost:4501` for the disposable local server; without it this creates and disbands a test room on the configured production backend.

Game mechanics are implemented with original interface text and recordings. Publisher rulebooks are linked for reference; no card scans or publisher narration recordings are included.

## Shared Nightfall interface

One Night follows classic Werewolf’s seat strip, sticky stage banner, room tools, and clockwise table layout. Tables of up to six players use a circle; seven or more use an oval. On phones, the player’s current action appears before host controls and the table. The One Night center cards, public shields/artifacts, and private clue history remain available.

**Current roles / 本局角色**, above the table in both games, opens the same public starting-deck viewer with quantities and expandable descriptions. It never shows player assignments or changes after swaps, transformations, or deaths. One Night includes three center cards in the configured deck; Alpha Wolf’s extra initial Werewolf center card and Temptress’s initial Henchman #7 reserve are explained separately. **My actions / 我的行动** opens the player’s private clues.

## Test bots

Open **Host controls → Test bots** to add individual bots or fill the table to a chosen size, within the existing 3–16-player limit. The saved deck target excludes its three center cards. Bots are labeled for everyone and can be removed in the lobby.

Automatic mode makes one eligible bot decision per room refresh, at least 1.5 seconds apart, while someone has the room open. Manual mode waits for **Run one bot action**. Bots read their cards, complete legal night actions and response prompts, and vote. They use only their own private player view and are simple test helpers, without reasoning or chat. Your actions and the host controls for starting the night, opening voting and revealing the result stay under your control.

Bots cannot become host. A host-approved human replacement keeps the seat and its private information while disabling that seat's bot. Rematches keep the bot seats and reset their cards, readiness and knowledge. No additional service or AI key is needed.

`node scripts/one-night-bots-smoke.mjs --url=<endpoint>` creates and disbands a disposable 12-player room to verify manual retry safety, automatic actions, human readiness and voting, replacing a bot, the complete round and rematching through the public HTTP API. Use `http://localhost:4501` with the local adapter for an isolated test.

## Center swaps and night order

This implementation uses an explicit center-swap house rule for Robber and Troublemaker. Robber may exchange their own unshielded card with another player or any center card, then see only the card received. Troublemaker may exchange any two different unshielded cards other than their own, including player/center or center/center, without viewing either. Alpha Wolf’s fourth center card is eligible; Temptress’s separate reserve is not. Copied abilities use the same legal targets, and either role can skip. Existing Kokoro role calls direct players to the screen and need no replacement.

The **Night order / 夜间流程** switch in **Current roles / 本局角色** shows the public schedule and descriptions for the selected deck in both games. Classic first-night setup steps are labeled; copied-role calls and expansion steps remain public schedule entries regardless of who can act. No live actors, private decisions, deaths, or center-card identities are used to build this reference.

`node scripts/one-night-center-swaps-smoke.mjs --url=<endpoint>` checks both center swaps, private results, retry safety and final movement history through disposable public-API rooms, then disbands them.

## Table controls and Dream Wolf confirmation

Before dealing, the host can move a seat by dragging its handle (mouse, touch or pen), entering its number, or using the arrows. Other seats shift in order; stable seat IDs stay attached to the same players. Seating stays locked after dealing. **Restart round / 重新开始本局** returns the same room to setup after confirmation, keeping players, profiles, bot settings and the deck while clearing cards, readiness, clues, votes, timers and expansion state. New cards are dealt from setup; the host must again wait for everyone to ready up.

Dream Wolf now has a private **Continue / 继续** action in the shared wolves stage. It does not learn teammates or inspect a center card. This app confirmation is a digital adaptation of its usual sleeping role. Other wolves still recognize Dream Wolf, and their own actions and its confirmation must finish before the closing call. Alpha Wolf and Mystic Wolf then receive their separate ability calls. Fear, copied abilities, absent-role pauses and host hard skips keep their existing rules.

`node scripts/one-night-round-controls-smoke.mjs --url=<endpoint>` verifies seating, shared Dream Wolf confirmation, separate Alpha/Mystic calls, restart retries, cleared secrets and redealing with 12 synthetic players through the public API. It disbands its room afterward.

## End-of-round results

The shared Nightfall result panel appears above the table, identifies winning sides and exact winning seat numbers/names/photos, and states each player's own outcome. Winners also receive a gold table highlight. Classic Werewolf includes eliminated members of the winning faction and uses explicit seat IDs for Lovers/Piper/Angel/Jester victories. One Night uses the resolved final cards, marks, artifacts and per-player win exceptions, so multiple sides may win or nobody may win.

When narration is enabled/unlocked, local Kokoro announces every winning side first, then each winning seat in table order. Draw/no-winner rounds have dedicated announcements. The result panel's Announce winners button enables/replays sound; repeated synchronization does not replay it and restarting cancels it. Shared English (`am_michael`) and Mandarin (`zm_010`) recordings live in `public/assets/nightfall/audio/`; regenerate with `~/.local/share/kokoro/.venv/bin/python scripts/generate-nightfall-victory-kokoro.py`. Existing Brian/One Night recordings remain unchanged.
