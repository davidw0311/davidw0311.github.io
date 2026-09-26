# Shared Nightfall UI

Werewolf and One Night use the same components and styles in `app/nightfall/ui/`.
Change that layer once to update both games. Do not copy it into a game directory.

- `RoomChrome.tsx`: native dialogs (focus trap, Escape, optional backdrop dismissal), player identity header, sticky stage banner, pending-player disclosure, room toolbar, QR invitations.
- `PlayerTable.tsx`: clockwise circular/large-table layout, player numbers, status styling, host/sheriff/bot badges, public tokens, countdown hourglass. The center is a content slot for the classic table label or One Night center cards.
- `RoleCard.tsx`: common role-card face with an optional reveal/hide toggle; descriptions and game-specific guidance remain in the adapters.
- `ProfilePhoto.tsx`: portraits and the shared upload/icon/initial picker. Its `onSave(photo)` callback is independent of backend command names.
- `BotControls.tsx`: bot setup/actions and test-room notice. Adapters provide seat limits, center-card count, eligibility and command routing.
- `shared.module.css` and `bot-controls.module.css`: common appearance and responsive breakpoints. Game CSS must not restyle these components; use slots for content unique to a game.
- Existing shared `RoleLineup.tsx` and `VictorySummary.tsx` provide roles, night timeline and winners.

`lib/nightfallPresentation.ts` maps each game's public view into table and readiness/voting presentation data. It preserves eligible voter counts, seat numbers and public statuses. It never passes private roles or action history into the shared table. Game rules, secret actions, sheriff elections, narration, deck setup and backend commands remain in each game's adapter.

The small `Modal` wrappers in each app supply game-content styles and the existing dismissal policy only. Game-specific dialog descendants (such as role guidance and sticky readiness actions) remain in their game's stylesheet. Common modal geometry and heading styles belong in `shared.module.css`.

Verify changes with `npm test`, `npx tsc --noEmit`, ESLint on affected files and a production Next build. For table changes, inspect both games at phone width, including a 12+ player table, readiness, profile upload, a private card, the invite dialog and results. Presentation regression coverage is in `tests/nightfallPresentation.test.ts`.
