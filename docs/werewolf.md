# Nightfall / 狼人杀

Public game: `/werewolf/`. The GitHub Pages UI connects to `/api/werewolf` on the existing Azure `speechlab-assessment` Function App. The frontend endpoint can be overridden at build time with `NEXT_PUBLIC_WEREWOLF_API_URL`.

## Playing

1. Create a room, save its private host recovery key, and open **Invite / QR code**. Every player can show the room QR code or copy its invitation link. Scan with a phone camera to open the room with its code prefilled. QR codes are generated locally and contain only the invitation URL, never an identity token or recovery key.
2. Each friend enters their name and immediately takes a lobby seat without host approval. An exact-name match fills an unoccupied reserved seat; occupied seats are never claimed by name. Players may leave the lobby freely, releasing their seats. Games support 6–24 occupied seats.
3. Choose the automatic deck, a preset, or a custom mix from the 31-role library. The library describes the exact **Nightfall house rules**, including intentional differences from published editions. There is no universal complete roster of Werewolf characters. Roles follow the documented house rules (the mandatory runoff disables the traditional Scapegoat sacrifice); this is an extensible catalogue, not an assertion that every variant ever published is included.
4. Deal cards, reveal your own card, and ready up. The host can begin the first night only after every occupied seat is ready. Replacing a player during this stage clears that seat’s readiness. Everyone sees only their own card and authorized information. The participating host has phase and room controls but cannot see other secret identities.
5. Night turns advance automatically after players submit: Brian calls each role, music continues underneath narration at a softer volume, and Brian asks players to close their eyes. Living actions never expire. The host can confirm **Skip current step** at night or during the day without seeing pending players or identities.
6. Brian narration and night music are selected by default; starting the game unlocks sound on the host device. They can be muted independently, and preferences are saved locally. Any seated player can tap **Enable sound on this device** and **Test sound**, including on a non-host phone. After refreshing, switching apps, or a playback interruption, a phone may need another tap. Check media volume and keep the room open. Players choose English or Simplified Chinese independently. For an in-person table, enable one speaker to avoid echoes. Text announcements are always available.

The release includes 62 pre-recorded English/Chinese clips made with Azure `en-US-BrianMultilingualNeural`, including individual first-night role calls and separate Sheriff and exile voting prompts. `scripts/generate-werewolf-audio.mjs` regenerates them with authenticated Azure CLI or secure speech environment variables; the manifest records exact text, voice, hashes, and durations. `scripts/generate-werewolf-ambience.py` reproduces the original 32-second seamless night loop using only Python's standard library. Persistent HTML media elements play narration and ambience. A direct tap unlocks both elements before loading asynchronous clips, and source reuse helps mobile autoplay compatibility. Five credited Kevin MacLeod tracks loop continuously across lobby, night, and day. A Web Audio gain node ducks music underneath narration; persistent media elements retain mobile gesture authorization. The original generated ambience is retained only as a legacy asset. See `public/assets/werewolf/CREDITS.md`. Test sound plays a public Brian cue without acknowledging a game stage. Phase changes cancel obsolete speech.

For an in-person game, speak around the table. Remote groups can use the built-in phase-restricted public/wolf/dead text channels and their preferred voice-call app. This release does not contain a live microphone/voice-call service or automatic translation of player messages.

## Automatic night flow

Every new night uses three server-owned stages for each scheduled role: opening announcement, action, and closing announcement. Narration completion is acknowledged automatically by the host device after every clip finishes. No normal host “next step” click is needed. When the host mutes speech, automatic acknowledgement leaves enough time for the longest English/Chinese recording so other players can still listen. Bounded server fallback timers prevent unavailable host audio from stalling the room.

During the action stage, eligible living players submit or explicitly skip, including each participating wolf. Non-wolf turns finish after all submissions. Wolves see teammates’ current votes and may revise their own choice. Their turn finishes only after every eligible wolf has submitted and a target has a strict majority of all eligible wolves; abstentions do not form a target majority. Otherwise it waits indefinitely, including when players are offline. Hunter/Wolf King reactions also wait for the player or an explicit host skip. First-night setup choices resolve together before wolves act; hard-skipped choices use the documented defaults.

Scheduled roles remain in the sequence after death. When nobody is eligible (dead role, suppressed power, or an ability unavailable that night), the server samples and saves one random 7–15 second action pause before the usual closing call. Clients receive no empty-turn flag, eligible-player count, or private deadline. Polling/network latency can add a short delay to transitions.

Only an explicit host pause freezes narration and dead-role pacing. Disconnects do not pause the room. The host can confirm **Skip current step** while paused or running: night opening/action moves to closing narration, closing moves to the next role, discussion moves to voting, voting counts submitted votes, reactions decline outstanding shots, and after-vote discussion starts the next night. Submitted choices are retained. The generic confirmation and event expose no pending actors, counts, or identities. Confirmation captures the current phase ID so a stale dialog cannot skip a later phase. Replacements can act until the step closes. Existing timed action windows become indefinite on synchronization, including paused ones; legacy daytime automation is disabled. Old disconnect pauses resume, while deliberate pauses remain paused.

## Witch self-save

Before dealing roles, the host chooses **Witch self-save / 女巫自救** in room settings: **Never / 不能自救**, **First night only / 仅首夜可自救**, or **Any night / 任何夜晚均可自救**. First night means night 1 of the game, including when using copied Witch powers. The rule limits self-saving only; an unused antidote can still save another player on a later night. Self-saving consumes the same single antidote. The rule is locked once the game begins and is shown in the room’s rules summary.

Existing rooms keep their saved never/any-night setting. New rooms still default to never.

## Disconnections and recovery

- Once play starts, a seat is a permanent game identity. Its role, life state, ability inventory, ballots, and private history are independent of the browser currently occupying it.
- A saved browser session reconnects automatically, even after refreshing or closing the page. The last confirmed view remains visible during transient network problems; failed actions are reported rather than shown as accepted.
- During a game, on a new device, enter the room code and name. The host maps the pending request to the original seat. A name alone never grants access. Replacement immediately revokes the former occupant token while keeping the seat's game state.
- During play, removing a player disconnects their occupant and reserves their seat; it does not kill the character or secretly change the role balance. New game identities can be added in the lobby. During an active game, new arrivals replace existing seats.
- Every host and player mutation has a request ID; retries cannot apply the same action twice. Phase-dependent actions carry a phase ID and cannot execute against a later phase.
- Offline players retain their seats without pausing the room or causing automatic skips. The host may wait, replace a player, pause, or explicitly skip the current step.
- A voluntary lobby departure releases the seat; a refresh, closed tab, or network interruption preserves it. If the host leaves the lobby, hosting passes to an occupied player (preferring one who is connected), and the recovery key rotates. If no occupied seats remain, the next lobby arrival becomes host. During play, leaving preserves the game identity and hosting until explicitly transferred.
- The host can transfer hosting to an occupied seat. The new host receives a new recovery key. Recovering on a new device requires that key and revokes the old host browser. Save the key privately; it grants host access and the host's game identity.
- Rooms expire after seven days without activity. Browser storage loss does not erase the server room; use host-approved replacement or host recovery.

## Backend

`api/src/werewolf/engine.js` owns authorization, role assignment, phase order, abilities, voting, victory, and filtered snapshots. `service.js` handles request idempotency, session hashing, recovery, and durable request limits. `storage.js` persists private JSON blobs in the `werewolf-private` container using Azure Blob conditional writes (ETags). Concurrent workers retry against current state rather than overwriting another action. Failed validation rolls back the entire command.

No secret role state or Azure credentials are shipped in the static export. Tokens are random per-device capabilities, sent only in POST bodies over HTTPS, and represented as SHA-256 hashes in game state. Public views omit session hashes, request receipts, and recovery secrets; the current host alone receives its recovery key separately. Lobby admission is immediate and capped at 24 seats. After play begins, new-device join requests are bounded and require host approval to replace an existing seat.

Configuration reuses `AzureWebJobsStorage` in the existing Function App, or accepts `WEREWOLF_STORAGE_CONNECTION_STRING`. This connection must allow private blob container creation/read/write. Existing pronunciation endpoints remain in the same deployment. The production origin must remain in `ALLOWED_ORIGINS`.

Polling is normally 3 seconds in the foreground and 12 seconds in background tabs, with backoff on failures and immediate synchronization after connectivity/visibility changes. During an unpaused night the host polls every second; other players poll every 2 seconds in the foreground or 3 seconds in the background. Heartbeats persist at most once per actor per ten seconds. Server time owns narration and dead-role pacing deadlines. Automatic transitions are evaluated on requests. Keep at least one room screen connected for live progression; everyone else may go offline. If every device closes the page, state stays saved and overdue narration/dead-role stages continue on the next connection, one stage per request rather than silently simulating an entire unattended game.

## Rules and tests

Canonical role catalogue: `api/src/werewolf/roles.json`; the public mirror is `public/assets/werewolf/roles.json`. A test verifies exact equality. Fixed configured night calls continue after a role dies, so the moderator does not reveal secret survival by skipping that call. Finished games expose a seat-based action replay.

Run with Node 24:

```sh
npm --prefix api ci
npm --prefix api test
npm run typecheck
npm test
npx eslint app/werewolf lib/werewolfClient.ts lib/werewolfAudio.ts api/src/werewolf api/src/functions/werewolf.js api/test/werewolf-*.test.js
npx next build --webpack
```

The Next build exports to `out/`. Do not run the root artifact-sync script as part of source validation in an unrelated dirty checkout. GitHub Actions performs the normal production export and deploys GitHub Pages after `main` is pushed.

Backend deployment uses the existing API publish procedure in `api/README.md`; include the entire API package so the existing pronunciation service stays registered. Install API production dependencies and package `host.json`, `package.json`, `package-lock.json`, `src/`, and `node_modules/`. Never include local settings or keys. Deployment should be followed by live create/join/replace/recover tests and a pronunciation health check.

## Room and player controls

New rooms use four uppercase letters; old eight-character invitation codes remain accepted. Code reservations and creator retries are durable and collision-safe. The host can disband a room, invalidating every occupant, pending join, and recovery session. Clients return to the entry screen on their next response or poll.

Players sit in a circular table. Host seat-number changes swap positions while preserving immutable seat IDs, roles, and history. Custom role counts remain editable in lobby settings. Each player can select an icon or upload a photo, cropped to a small JPEG before transmission. Photos are public within the room. Private action history and results remain attached to the seat through reconnects and approved replacements.

Every day requires an exile ballot before night. A first tie starts a second ballot restricted to the highest tied candidates (all-abstain ballots include all living players); only a second tie kills nobody and immediately starts night. The Scapegoat sacrifice is disabled under these rules. Host hard skips respect this sequence. A witch retaining her antidote can see the wolf victim even when unable to save herself under the selected self-save restriction.
