# Nightfall / 狼人杀

Public game: `/werewolf/`. The GitHub Pages UI connects to `/api/werewolf` on the existing Azure `speechlab-assessment` Function App. The frontend endpoint can be overridden at build time with `NEXT_PUBLIC_WEREWOLF_API_URL`.

## Playing

1. Create a room, save its private host recovery key, and open **Invite / QR code**. Every player can show the room QR code or copy its invitation link. Scan with a phone camera to open the room with its code prefilled. QR codes are generated locally and contain only the invitation URL, never an identity token or recovery key.
2. Each friend enters their name and immediately takes a lobby seat without host approval. An exact-name match fills an unoccupied reserved seat; occupied seats are never claimed by name. Players may leave the lobby freely, releasing their seats. Games support 6–24 occupied seats.
3. Choose the automatic deck, a preset, or a custom mix from the 31-role library. The library describes the exact **Nightfall house rules**, including intentional differences from published editions. There is no universal complete roster of Werewolf characters. Every role in this release has an implemented ability or victory rule; this is an extensible catalogue, not an assertion that every variant ever published is included.
4. Start the game. Everyone sees only their own card and authorized information. The participating host has phase and room controls but cannot see other secret identities.
5. The host can advance a night step, start a vote or Sheriff election, resolve voting, choose a speaker, start the next night, pause/resume, or enable timed automatic moderation. Manual advancement may skip an unfinished action, so coordinate with players first.
6. Enable Brian narration and night music on the host device. Browser audio requires an explicit tap. Players choose English or Simplified Chinese independently. Only the host device narrates, avoiding multiple speakers in one room. Text announcements are always available.

The release includes 52 pre-recorded English/Chinese clips made with Azure `en-US-BrianMultilingualNeural`, including separate Sheriff and exile voting prompts. `scripts/generate-werewolf-audio.mjs` regenerates them with authenticated Azure CLI or secure speech environment variables; the manifest records exact text, voice, hashes, and durations. `scripts/generate-werewolf-ambience.py` reproduces the original 32-second seamless night loop using only Python's standard library. Music fades and ducks under narration. Phase changes cancel obsolete speech.

For an in-person game, speak around the table. Remote groups can use the built-in phase-restricted public/wolf/dead text channels and their preferred voice-call app. This release does not contain a live microphone/voice-call service or automatic translation of player messages.

## Witch self-save

Before dealing roles, the host chooses **Witch self-save / 女巫自救** in room settings: **Never / 不能自救**, **First night only / 仅首夜可自救**, or **Any night / 任何夜晚均可自救**. First night means night 1 of the game, including when using copied Witch powers. The rule limits self-saving only; an unused antidote can still save another player on a later night. Self-saving consumes the same single antidote. The rule is locked once the game begins and is shown in the room’s rules summary.

Existing rooms keep their saved never/any-night setting. New rooms still default to never.

## Disconnections and recovery

- Once play starts, a seat is a permanent game identity. Its role, life state, ability inventory, ballots, and private history are independent of the browser currently occupying it.
- A saved browser session reconnects automatically, even after refreshing or closing the page. The last confirmed view remains visible during transient network problems; failed actions are reported rather than shown as accepted.
- During a game, on a new device, enter the room code and name. The host maps the pending request to the original seat. A name alone never grants access. Replacement immediately revokes the former occupant token while keeping the seat's game state.
- During play, removing a player disconnects their occupant and reserves their seat; it does not kill the character or secretly change the role balance. New game identities can be added in the lobby. During an active game, new arrivals replace existing seats.
- Every host and player mutation has a request ID; retries cannot apply the same action twice. Phase-dependent actions carry a phase ID and cannot execute against a later phase.
- Automatic moderation pauses when the host, any living seat, or an eliminated player with a pending shot has been absent for 35 seconds. The host explicitly resumes when the table is ready. Manual controls remain available to handle absences.
- A voluntary lobby departure releases the seat; a refresh, closed tab, or network interruption preserves it. If the host leaves the lobby, hosting passes to an occupied player (preferring one who is connected), and the recovery key rotates. If no occupied seats remain, the next lobby arrival becomes host. During play, leaving preserves the game identity and hosting until explicitly transferred.
- The host can transfer hosting to an occupied seat. The new host receives a new recovery key. Recovering on a new device requires that key and revokes the old host browser. Save the key privately; it grants host access and the host's game identity.
- Rooms expire after seven days without activity. Browser storage loss does not erase the server room; use host-approved replacement or host recovery.

## Backend

`api/src/werewolf/engine.js` owns authorization, role assignment, phase order, abilities, voting, victory, and filtered snapshots. `service.js` handles request idempotency, session hashing, recovery, and durable request limits. `storage.js` persists private JSON blobs in the `werewolf-private` container using Azure Blob conditional writes (ETags). Concurrent workers retry against current state rather than overwriting another action. Failed validation rolls back the entire command.

No secret role state or Azure credentials are shipped in the static export. Tokens are random per-device capabilities, sent only in POST bodies over HTTPS, and represented as SHA-256 hashes in game state. Public views omit session hashes, request receipts, and recovery secrets; the current host alone receives its recovery key separately. Lobby admission is immediate and capped at 24 seats. After play begins, new-device join requests are bounded and require host approval to replace an existing seat.

Configuration reuses `AzureWebJobsStorage` in the existing Function App, or accepts `WEREWOLF_STORAGE_CONNECTION_STRING`. This connection must allow private blob container creation/read/write. Existing pronunciation endpoints remain in the same deployment. The production origin must remain in `ALLOWED_ORIGINS`.

Polling is 3 seconds in the foreground and 12 seconds in background tabs, with backoff on failures and immediate synchronization after connectivity/visibility changes. Heartbeats persist at most once per actor per ten seconds. Server time owns phase deadlines. Automatic transitions are evaluated on requests; a suspended room pauses on return rather than simulating missed rounds.

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
