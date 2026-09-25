# Nightfall / 狼人杀

Public game: `/werewolf/`. The GitHub Pages UI connects to `https://vxbhzddlhopsgbwmjzdm.supabase.co/functions/v1/werewolf`. Supabase Edge Functions and private Postgres storage own all live gameplay; Azure is no longer used by Werewolf at runtime.

## Playing

1. Create a room, save its private host recovery key, and open **Invite / QR code**. Every player can show the room QR code or copy its invitation link. Scan with a phone camera to open the room with its code prefilled. QR codes are generated locally and contain only the invitation URL, never an identity token or recovery key.
2. Each friend enters their name and immediately takes a lobby seat without host approval. An exact-name match fills an unoccupied reserved seat; occupied seats are never claimed by name. Players may leave the lobby freely, releasing their seats. Games support 6–24 occupied seats.
3. Choose the automatic deck, a preset, or a custom mix from the 32-role library. The library describes the exact **Nightfall house rules**, including intentional differences from published editions. There is no universal complete roster of Werewolf characters. Roles follow the documented house rules (the mandatory runoff disables the traditional Scapegoat sacrifice); this is an extensible catalogue, not an assertion that every variant ever published is included.
4. Deal cards, reveal your own card, and ready up. The host can begin the first night only after every occupied seat is ready. Replacing a player during this stage clears that seat’s readiness. Everyone sees only their own card and authorized information. The participating host has phase and room controls but cannot see other secret identities.
5. Night turns advance automatically after players submit: Brian calls each role, music continues underneath narration at a softer volume, and Brian asks players to close their eyes. Living actions never expire. The host can confirm **Skip current step** at night or during the day without seeing pending players or identities.
6. Brian narration and night music are selected by default; starting the game unlocks sound on the host device. They can be muted independently, and preferences are saved locally. Any seated player can tap **Enable sound on this device** and **Test sound**, including on a non-host phone. After refreshing, switching apps, or a playback interruption, a phone may need another tap. Check media volume and keep the room open. Players choose English or Simplified Chinese independently. For an in-person table, enable one speaker to avoid echoes. Text announcements are always available.

The release includes 130 pre-recorded English/Chinese clips made with Azure `en-US-BrianMultilingualNeural`, including individual first-night role calls, Sheriff election prompts, overnight results, and seat numbers 1–24. `scripts/generate-werewolf-audio.mjs` regenerates them with authenticated Azure CLI or secure speech environment variables; the manifest records exact text, voice, hashes, and durations. `scripts/generate-werewolf-ambience.py` reproduces the original 32-second seamless night loop using only Python's standard library. Persistent HTML media elements play narration and ambience. A direct tap unlocks both elements before loading asynchronous clips, and source reuse helps mobile autoplay compatibility. Five credited Kevin MacLeod tracks loop continuously across lobby, night, and day. A Web Audio gain node ducks music underneath narration; persistent media elements retain mobile gesture authorization. The original generated ambience is retained only as a legacy asset. See `public/assets/werewolf/CREDITS.md`. Test sound plays a public Brian cue without acknowledging a game stage. Phase changes cancel obsolete speech.

For an in-person game, speak around the table. Remote groups can use the built-in phase-restricted public/wolf/dead text channels and their preferred voice-call app. This release does not contain a live microphone/voice-call service or automatic translation of player messages.

## Automatic night flow

Every new night uses three server-owned stages for each scheduled role: opening announcement, action, and closing announcement. Narration completion is acknowledged automatically by the host device after every clip finishes. No normal host “next step” click is needed. When the host mutes speech, automatic acknowledgement leaves enough time for the longest English/Chinese recording so other players can still listen. Bounded server fallback timers prevent unavailable host audio from stalling the room.

During the action stage, eligible living players submit or explicitly skip, including each participating wolf. Non-wolf turns finish after all submissions. Wolves see teammates’ current votes and may revise their own choice. Their turn finishes only after every eligible wolf has submitted and a target has a strict majority of all eligible wolves; a unanimous **Kill nobody / 空刀** decision also closes the action with no wolf attack. Mixed no-kill votes do not form a target majority. Otherwise it waits indefinitely, including when players are offline. Hunter/Wolf King reactions also wait for the player or an explicit host skip. First-night setup choices resolve together before wolves act; hard-skipped choices use the documented defaults.

Scheduled roles remain in the sequence after death. When nobody is eligible (dead role, suppressed power, or an ability unavailable that night), the server samples and saves one random 7–15 second action pause before the usual closing call. Clients receive no empty-turn flag, eligible-player count, or private deadline. Polling/network latency can add a short delay to transitions.

Only an explicit host pause freezes narration and dead-role pacing. Disconnects do not pause the room. The host can confirm **Skip current step** while paused or running: night opening/action moves to closing narration, closing moves to the next role, discussion moves to voting, voting cannot close until every eligible player explicitly votes or abstains, reactions decline outstanding shots, and after-vote discussion starts the next night. Submitted choices are retained. The generic confirmation and event expose no pending actors, counts, or identities. Confirmation captures the current phase ID so a stale dialog cannot skip a later phase. Replacements can act until the step closes. Existing timed action windows become indefinite on synchronization, including paused ones; legacy daytime automation is disabled. Old disconnect pauses resume, while deliberate pauses remain paused.

## Witch self-save

Before dealing roles, the host chooses **Witch self-save / 女巫自救** in room settings: **Never / 不能自救**, **First night only / 仅首夜可自救**, or **Any night / 任何夜晚均可自救**. First night means night 1 of the game, including when using copied Witch powers. The rule limits self-saving only; an unused antidote can still save another player on a later night. Self-saving consumes the same single antidote. The rule is locked once the game begins and is shown in the room’s rules summary.

Existing rooms keep their saved never/any-night setting. New rooms default to first-night-only self-save.

## Disconnections and recovery

- Once play starts, a seat is a permanent game identity. Its role, life state, ability inventory, ballots, and private history are independent of the browser currently occupying it.
- A saved browser session reconnects automatically, even after refreshing or closing the page. The last confirmed view remains visible during transient network problems; failed actions are reported rather than shown as accepted.
- During a game, on a new device, enter the room code and name. The host maps the pending request to the original seat. A name alone never grants access. Replacement immediately revokes the former occupant token while keeping the seat's game state.
- During play, removing a player disconnects their occupant and reserves their seat; it does not kill the character or secretly change the role balance. New game identities can be added in the lobby. During an active game, new arrivals replace existing seats.
- Every host and player mutation has a request ID; retries cannot apply the same action twice. Phase-dependent actions carry a phase ID and cannot execute against a later phase.
- Offline players retain their seats without pausing the room or causing automatic skips. The host may wait, replace a player, pause, or explicitly skip a non-voting step. Ballots never auto-abstain for absent players.
- A voluntary lobby departure releases the seat; a refresh, closed tab, or network interruption preserves it. If the host leaves the lobby, hosting passes to an occupied player (preferring one who is connected), and the recovery key rotates. If no occupied seats remain, the next lobby arrival becomes host. During play, leaving preserves the game identity and hosting until explicitly transferred.
- The host can transfer hosting to an occupied seat. The new host receives a new recovery key. Recovering on a new device requires that key and revokes the old host browser. Save the key privately; it grants host access and the host's game identity.
- Rooms expire after 24 hours without a player action; automatic polling and narration acknowledgements do not extend this. Finished/disbanded rooms expire after a 60-second result-delivery window, and a SQL cron job physically deletes expired records every minute. Results already received stay in browser memory until navigation; there is no game archive. Browser storage loss does not erase the server room; use host-approved replacement or host recovery.

## Backend

`api/src/werewolf/engine.js` owns authorization, role assignment, phase order, abilities, voting, victory, and filtered snapshots. `service.js` handles request idempotency, session hashing, recovery, and durable request limits. `supabase-storage.js` persists private JSON room state using Postgres compare-and-swap RPCs and unique UUID versions. Concurrent workers retry against current state rather than overwriting another action. Failed validation rolls back the entire command.

No secret role state or Supabase service credentials are shipped in the static export. Tokens are random per-device capabilities, sent only in POST bodies over HTTPS, and represented as SHA-256 hashes in game state. Public views omit session hashes, request receipts, and recovery secrets; the current host alone receives its recovery key separately. Lobby admission is immediate and capped at 24 seats. After play begins, new-device join requests are bounded and require host approval to replace an existing seat.

The Edge Function uses built-in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets. Table access and RPC execution are revoked from public/anon/authenticated roles; only the Edge Function service role can access them. Guest sessions still use the existing high-entropy room tokens, so no PianoParty account is required. No PianoParty/Auth schema or settings are changed.

Polling is normally 3 seconds in the foreground and 12 seconds in background tabs, with backoff on failures and immediate synchronization after connectivity/visibility changes. During an unpaused night the host polls every second; other players poll every 2 seconds in the foreground or 3 seconds in the background. Heartbeats persist at most once per actor per ten seconds. Server time owns narration and dead-role pacing deadlines. Automatic transitions are evaluated on requests. Keep at least one room screen connected for live progression; everyone else may go offline. If every device closes the page, state stays saved and overdue narration/dead-role stages continue on the next connection, one stage per request rather than silently simulating an entire unattended game.

## Rules and tests

Canonical role catalogue: `api/src/werewolf/roles.json`; the public mirror is `public/assets/werewolf/roles.json`. A test verifies exact equality. Fixed configured night calls continue after a role dies, so the moderator does not reveal secret survival by skipping that call. Finished games expose a seat-based action replay.

Run with Node 24:

```sh
npm --prefix api ci
npm --prefix api test
npm run typecheck
npm test
npx eslint app/werewolf lib/werewolfClient.ts lib/werewolfAudio.ts api/src/werewolf api/test/werewolf-*.test.js
npx next build --webpack
```

The Next build exports to `out/`. Do not run the root artifact-sync script as part of source validation in an unrelated dirty checkout. GitHub Actions performs the normal production export and deploys GitHub Pages after `main` is pushed.

Backend deployment uses the existing API publish procedure in `api/README.md`; include the entire API package so the existing pronunciation service stays registered. Install API production dependencies and package `host.json`, `package.json`, `package-lock.json`, `src/`, and `node_modules/`. Never include local settings or keys. Deployment should be followed by live create/join/replace/recover tests and a pronunciation health check.

## Room and player controls

New rooms use four uppercase letters; old eight-character invitation codes remain accepted. Code reservations and creator retries are durable and collision-safe. The host can disband a room, invalidating every occupant, pending join, and recovery session. Clients return to the entry screen on their next response or poll.

Players sit in a circular table. Host seat-number changes swap positions while preserving immutable seat IDs, roles, and history. Custom role counts remain editable in lobby settings. Each player can select an icon or upload a photo, cropped to a small JPEG before transmission. Photos are public within the room. Private action history and results remain attached to the seat through reconnects and approved replacements.

Every day requires an exile ballot before night. A first tie starts a second ballot restricted to the highest tied candidates (all-abstain ballots include all living players); only a second tie kills nobody and immediately starts night. The Scapegoat sacrifice is disabled under these rules. Host hard skips respect this sequence. A witch retaining her antidote can see the wolf victim even when unable to save herself under the selected self-save restriction.

## First-dawn Sheriff election and announcements

With Sheriff enabled, the first night automatically opens nominations before exposing overnight deaths. Every seated player chooses whether to run. Once all declarations are in, the host opens speeches, and later explicitly opens voting. Candidates speak in seat order; finishing all speeches waits for the host. Candidates can withdraw (退水) and rejoin before voting begins. Candidacy is frozen during voting. Everyone who ran remains excluded from voting, even if withdrawn. Only non-candidates with voting rights vote or abstain; all eligible submissions count the Sheriff ballot automatically. No candidates or no eligible voters means no badge. A tied Sheriff ballot triggers one round of PK speeches and a runoff restricted to the tied candidates; a second tie means no badge. Candidacy changes are locked during PK. The host cannot bypass missing declarations or ballots. Replacements retain their seat's decision and voting eligibility.

Brian announces the elected seat, then the overnight deaths by seat number or a peaceful night. These are durable public announcement phases with completion acknowledgements and fallback pacing. Overnight deaths remain hidden through the election; authorized private inspection results are available to their owners for candidate speeches. A badge icon marks the Sheriff. After death, the Sheriff can confirm passing it to a living seat or destroying it. Seat renumbering is temporarily disabled during elections and announcements so spoken numbers remain stable. Existing in-progress legacy Sheriff ballots finish without applying the previous night twice.

New rooms default to Witch self-save on the first night only and death when Guard protection overlaps the Witch’s antidote. Existing rooms retain their chosen settings.

A sticky bilingual banner always names the stage and scheduled acting role, including its decoy turn after death; it never identifies that role’s players. Phones use larger text and controls, place the current action before the circle, and collapse secondary sound controls. The table’s circular border now shares the avatar positions’ center and radius. Last votes opens a circular diagram with vote arrows, including self-vote loops, totals and abstentions below, and expandable individual choices. The profile picker offers 60 neutral food, sport, vehicle, and hobby avatars, plus photo uploads.

## Joining, private results, and speaking timers

The entry screen defaults to Join. The room-code button copies only the code; the field accepts pasted codes, whitespace, labelled codes, and full invitation URLs. New room allocation prefers a curated pool of memorable four-letter words, checking every reservation atomically. Disbanded and 24-hour-idle rooms can release a word for reuse; old seat tokens and recovery keys cannot access a new room. If every word is occupied, allocation safely falls back to four letters. Legacy eight-character codes remain accepted.

Viewing a card and keeping it visible are separate: Ready stays available after the card is hidden. Game IDs prevent a card viewed in an earlier game from satisfying the next game’s readiness gate.

Seer results appear privately immediately upon submitting, before the closing narration, with only wolf/good classification. Hidden Wolf retains its documented good reading, and other non-wolf alignments are reported as good. Magician swaps apply. Results remain in private history without a duplicate dawn notification.

A persistent player strip shows your photo, name, seat number and alive/eliminated status. The same sticky area displays the last night’s casualties or peaceful-night result through daytime. Eliminated seats carry a large cross and explicit DEAD label.

During village or candidate speeches, the host can start, restart/adjust, or cancel a shared 5–900 second timer. Pausing the room freezes it. Changing speaker or phase clears it. Expiry rings one original synthesized bell per enabled device; it never skips a player or advances a phase. The host’s Start timer tap unlocks audio. Other players can enable the timer sound on their own devices. Recent reconnects can catch the end signal, but an old expired timer does not ring again later.


## Table interaction and mandatory ballots

Every eligible player must submit a target or explicit abstention before the host can count exile votes. This applies again to a runoff, and cannot be bypassed through Next or hard skip. Everyone sees pending seat numbers and names, while targets remain private until the ballot closes. Eliminated players and players without voting rights are excluded. Offline voters keep their pending ballot until they reconnect or the host assigns a replacement.

The shared speaking countdown appears as a draining hourglass at the table center. Music stays on the same media element across phases and repeated unlock gestures. The compact My card dialog is used for both initial readiness and later role checks, always includes the revealed role description, and hides the card when closed. Host seating controls show large numbers and support pointer/touch drag handles as well as keyboard-accessible number selectors.

Daytime shots, duels, explosions, and exile deaths announce all newly eliminated seat numbers with Brian in English or Chinese. Linked casualties are included. Public narration precedes further pending reactions; a winning kill announces the deaths before the game-over cue.


## Readiness and private nominations

Choosing Ready closes the identity dialog only after the server accepts readiness. The table explicitly shows **You are ready** or **Not ready**, including when the player dismisses their card by tapping outside it. Closing the card alone never readies a player.

Sheriff candidate and withdrawal lists stay private until every player has declared. During that interval, each player can see only their own candidacy status; even the host cannot inspect others' choices or infer withdrawals from public events.

The Guard has an explicit **Protect nobody / 空守** button. The previous night's protected target is unavailable and rejected by the server if submitted anyway; a night of no protection breaks the consecutive-night restriction. A Hunter killed overnight receives a shot after the morning result announcement (and first-night Sheriff election, if enabled). Poison blocks the shot, including when a wolf attack targets the same Hunter.


## Rules audit update — 1.1

The preset selector now names Chinese board compositions explicitly: Standard, Wolf King/Guard, Beauty/Knight, Wolf King/Dreamweaver, Gargoyle/Gravekeeper, Pure White/Wolf Witch, and Blood Moon/Demon Hunter. Presets select cards, not a separate engine mode: all use the displayed Nightfall room settings. The 16-player mix is labeled as a house board. The bilingual catalogue is the authoritative in-app rule description.

- Hidden Wolf and Gargoyle inherit pack attacks when no other attacking wolves remain; if both isolated roles remain, they jointly become the pack. Neither gains self-explosion. Their earlier wolf messages remain private according to current pack access.
- Wolf Witch checks only non-wolves and kills Pure White from night two; no new generic poison is allowed. Previously submitted poison in an already-running room can still finish resolving.
- Knight duels and wolf explosions are restricted to discussion before voting. Beauty cannot explode; her charm only triggers on exile or shooting. **The requested mandatory daytime vote still applies after duels and explosions.** Sheriff explosions/badge-swallowing remain outside this house ruleset.
- Blood Moon silences only the next night. As the final wolf it delays an exile until the following dawn. Ordinary night damage resolves first; pending shots take precedence over an early victory. A wolf objective completed before the delayed expiry can win.
- Gargoyle cannot repeat a selected seat; Raven cannot repeat the previous night's seat. Magician acts before the pack; redirection returns information labeled with the selected seat, never the hidden destination. Repeat restrictions are evaluated on selected seat numbers. Each unordered swap pair remains usable once.
- Dream protection covers wolf attacks, poison, hunts and lethal inspections. Consecutive dreaming and linked deaths bypass it. Dreamweaver may still explicitly skip. Hunter shoots only after wolf kill or exile; poison takes precedence over a simultaneous wolf hit. Elder death from exile, poison or shooting disables future village powers.
- Revealed Idiot cannot be exiled again and loses the badge if held. Gravekeeper reports only the preceding day's exile. Angel converts after the first completed exile round, even if nobody dies.
- Both Sheriff and exile ties receive one runoff; the Sheriff runoff includes candidate speeches and locks candidacies. Original candidates, including withdrawals, cannot vote in round one; in the runoff, everyone except the tied candidates may vote. A second Sheriff tie gives no badge.
- A dead Sheriff's badge has a dedicated step before the next day vote/night. Transfer or destruction must finish first; a host emergency skip destroys the badge. It cannot be transferred during a ballot.
- Living cross-faction lovers suspend ordinary faction wins until the pair wins or a lover dies. Faction conversions update the pairing classification. This is an explicit crossover policy, not a claim that all published editions agree.

Mechanical Wolf, fixed-choice Thief, exile-only Angel, end-of-resolution Piper and inactive Scapegoat remain explicit house variants. Piper must survive night deaths and pending shots. Emergency hard skips retain submitted pack choices, so an incomplete vote may still yield an attack; a skip is not a cancellation. No role cards were added merely to claim a complete catalogue.

References: [NetEase character reference](https://langrensha.res.netease.com/pc/gw/20190509150909/js/kapaiData_02806e2.js), [official board compositions](https://langrensha.com/20240319/31014_1144073.html), [Wolf Witch / Pure White](https://www.taptap.cn/moment/121323755451452640), [Chinese PK guidance](https://www.langrensha.net/strategy/2021072102.html), [New Moon](https://cdn.1j1ju.com/medias/35/c6/96-the-werewolves-of-millers-hollow-new-moon-rulebook.pdf). The implementation audit and its regression scenarios distinguish edition differences from app defects.

## 14-player Wolf King / Silencing Elder / Wild Child

Preset `14`: 3 Werewolves, Wolf King, Seer, Witch, Hunter, Guard, Silencing Elder, 4 Villagers, Wild Child. The Wild Child uses the existing house rule: starts village, counts on the special-role edge while good, and joins the wolf pack when their idol dies. This is a custom board, not a universally standardized balance claim.

Silencing Elder follows the [2017 Werewolves league rules](https://www.sohu.com/a/138501023_729113): may silence self or skip, cannot target the same seat on consecutive nights, sheriff speeches are exempt, and the effect survives the elder dying that night. Silence applies to daytime discussion and final words, while voting and abilities remain available. In-person speech relies on players following the visible mute indicator; public text chat and host speaker selection enforce it. Private eliminated-player chat is unaffected. Dawn announces silenced seat numbers, or explicitly announces nobody is silenced, using Brian in both languages whenever the Silencing Elder is in the deck (including after death).

## Supabase deployment and retention

The automated large-game suite (`node --test api/test/werewolf-large-games.test.js`) completes games across all 12+ player catalogue boards and custom 18/20/24-player boards. It checks readiness, private role data, night actions, sheriff and exile runoffs, disconnect/replacement, pending reactions, badge transfer, and final results with reproducible seeds. Elder suppression also cancels a village Hunter's pending shot, while wolf-faction copied powers remain available.

1. Apply `supabase/migrations/202609240001_werewolf.sql` in the project SQL editor or via `supabase db push`. It creates only Werewolf state, restricted RPCs, and the `werewolf-expired-rooms` cron job.
2. Run `node scripts/build-werewolf-edge.mjs`. This converts the exact tested engine/service modules to deployable ESM. CI checks generated files stay in sync.
3. Deploy `supabase functions deploy werewolf --project-ref vxbhzddlhopsgbwmjzdm`. `supabase/config.toml` keeps gateway verification enabled; clients send the project publishable key. The handler separately enforces player session capabilities and host authorization. Never disable RLS or put the service key in the frontend.
4. Without CLI credentials, the dashboard editor can deploy a single import of the generated `index.js` from a pinned Git commit URL. Supabase bundles these dependencies at deploy time; there is no runtime GitHub source fetch.
5. Run `node scripts/werewolf-live-smoke.mjs --url=https://vxbhzddlhopsgbwmjzdm.supabase.co/functions/v1/werewolf` before publishing the frontend.

The free Supabase project may pause for inactivity and requires dashboard resume. Old Azure rooms are not migrated: they belonged to the previous unavailable backend. Local session storage has a new version so old Azure seats cannot be confused with fresh Supabase rooms. The existing Brian MP3s and music remain static GitHub Pages assets. The optional audio-generation script uses Azure only when deliberately authoring new recordings, not for running the app. Other website apps' Azure dependencies are outside this migration.


## Beginner guidance and phone layout

Classic Werewolf has bilingual private guidance for all 32 roles. `lib/werewolfGuidance.ts` derives card rules from room settings and turn hints from the player's authorized action and remaining abilities. Witch self-save alternatives, one potion per night, spent potions, Guard repeat targets, copied Mechanical abilities, and death reactions follow the existing engine rules. Optional strategy tips appear inside the revealed role card; hiding the card hides its guide. No game rules or backend behavior change.

On phones, the player’s seat/card and sticky stage come first, followed by their available action. Seven or more players use a clockwise oval that fits the viewport; six retain the circle. Pending readiness/votes show seat numbers with expandable names. Audio, history and advanced host settings use disclosures, and the card’s Ready control stays visible while reading.

**Current roles / 本局角色** above the table opens the shared Nightfall role viewer: public starting quantities and expandable descriptions, with no player assignments. The list stays unchanged after deaths or transformations. An unconfigured lobby explains that a balanced deck will be chosen when cards are dealt. One Night uses the same viewer and table hierarchy, with its center cards and expansion rules retained.

Run `node --no-warnings --test tests/werewolfGuidance.test.ts` for settings/state/privacy regressions and engine-backed unavailable-action checks.


## Test bots

The host can open **Host controls → Test bots** in a classic Werewolf lobby to add one bot or fill the table to the saved deck size (12 by default), up to 24 total seats. Bots are marked publicly and can be removed before cards are dealt. Choose a matching role deck in room settings when changing the table size.

Automatic mode makes one eligible bot decision per room refresh, with at least 1.5 seconds between decisions, while a player has the room open. Manual mode waits for **Run one bot action**. Bots ready up, choose legal night actions, participate in sheriff elections and votes, and resolve their available death/badge abilities. They are deterministic testing helpers, not reasoning or chat AI, and do not initiate optional Knight duels or wolf self-destructs. They use their own private view rather than hidden information from other seats. Human decisions, narration, host phase controls and the normal empty-role night delays remain in force; pausing the table also pauses bots.

Bot seats cannot become host. A host-approved human replacement inherits the seat’s role and history and immediately stops that seat’s automation. Bot state is stored with the existing room; no extra service or AI API is used.

For an isolated local game, run `node scripts/werewolf-local-server.mjs`, then `NEXT_PUBLIC_WEREWOLF_API_URL=http://localhost:4502 npm run dev -- -p 3010`. Create a room at `http://localhost:3010/werewolf/` and add bots through the host controls. The local adapter uses disposable memory; production remains on Supabase.

`node scripts/werewolf-bots-smoke.mjs --url=<endpoint>` verifies a disposable 12-player room through readiness and the first night, including manual retry safety, pause behavior, host authorization, human readiness and replacing a bot. It disbands its test room afterward.
