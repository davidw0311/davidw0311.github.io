# Chess Practice

Public route: `/projects/chess-practice/`, linked from the homepage Space section.

## Puzzles and rating

The immutable v1 bank contains 11,193 legal puzzles from the Lichess CC0 database, grouped into 100-point bands. The manifest assigns each bucket a stable offset. The app downloads the manifest and only the bands it needs; it has no dependency on a runtime Lichess API or a chess engine. Source: https://database.lichess.org/ . The play board uses classic Cburnett SVG pieces by Colin M. L. Burnett (GPL 2.0 or later). Unmodified SVG sources and the license are distributed at `/assets/chess/pieces/classic/`. Legacy Chessnut assets retain their Apache 2.0 license.

`chess.js` uses BSD-2-Clause; its distribution notice is included at `/assets/chess/CHESS_JS_LICENSE.txt`. It validates moves, promotions, and checkmate. The first dataset move is the opponent's setup move, applied before presenting the position. The solver must complete the entire line. Alternate immediate checkmates are accepted. Illegal moves do not count as failures.

The initial puzzle rating is 800. Elo updates use the puzzle's imported rating with K=64 for the first 10 rated attempts, then K=32. Ratings are bounded to 400–3200. Adaptive selection targets a band roughly 150 points below the player's rating 70% of the time, at the rating 20%, and 150 above it 10%; band rounding is downward. Gentle and stretch settings change the next selection. First mistakes, hints, reveals, and skips record one loss. Reviews are unrated. Skill labels are app-specific milestones, not official chess ratings.

A compact bitmap records every attempted puzzle, so repeats never earn rating points. **Do not reorder or regenerate the released v1 bank or its offsets.** Introduce an explicit data/progress migration for future puzzle bank versions. The importer requires a local Lichess CSV.zst and the `zstd` CLI. It can use a byte-range prefix; only complete records that pass the feedback, sample-size, uncertainty, and legal-move filters are imported.

## Play screen and motion

The play workspace uses the dynamic viewport height and a size container for the board. Feedback and actions occupy a fixed-height panel; introductory content, account banners, detailed statistics, and help are kept in Progress or Practice settings. The solving screen has no page scrolling. Browser QA verified board/result/Next button bounds at 390×844, 375×667, 320×568, phone landscape 844×390, tablet 768×1024, and desktop 1280×800.

`AnimatedBoard` maintains piece identities with `reconcilePieces` so Motion can animate the same DOM piece between squares, including castling, captures, en passant, promotions, board flips, and solution playback. Default movement is 650 ms with a 180 ms pause before the opponent replies. Input is locked through both moves and final results are shown afterward. Incorrect moves animate forward, then return. Pending sequences use AbortController and are cancelled on puzzle/account changes and unmount. Settings also offer standard/instant movement; the device reduced-motion preference overrides the selected speed.

## Exploring and saving puzzles

After solving or revealing a puzzle, Explore unlocks legal moves for both sides in turn. The existing previous/next controls become undo/redo. A new move from an earlier position replaces the redo branch; Solution restores the original replay. Checkmate and stalemate positions prompt the player to rewind. Exploration never records attempts or changes the rating, and keeps the slow animations and fixed phone controls. Solved replays retain the accepted moves, including alternate immediate mates.

Save below the board adds or removes the current puzzle from a personal collection. The Saved tab loads up to 12 positions per page with ratings and themes, provides replay and removal, and downloads only the needed rating buckets. Saves use the immutable puzzle indexes. Guest collections remain on the device; account collections sync using the same retry queue and auth isolation as progress. Guest import explicitly includes currently saved puzzles.

`user_metadata.chess_collection_v1` stores a validated bitmap (under 1.9 KB for the entire current bank), separately from the existing bounded progress schema. Pending save/remove operations are merged onto the latest cloud collection and changes made during a save are replayed afterward. There is no small favorites cap. No schema migration or new database table is required.

## Accounts and persistence

The app reuses the existing Supabase browser singleton from Piano Party, including the same account/session and public project credentials. No service-role key is exposed. Signup, email confirmation, login, password recovery, and logout use Supabase Auth. Password recovery currently returns to the existing Piano Party profile password form.

Private, bounded personal training state is saved in `user_metadata.chess_practice_v1`. The bitmap covers the complete bank, while detailed history is capped at 30 attempts, activity at 30 active UTC dates, review at 30 puzzles, and recent attempts at 12. A full-bank regression test keeps the JSON profile under 5 KB. This state is user-editable, appropriate for personal practice; it must never grant authorization or determine competitive leaderboards. A future leaderboard needs server-validated attempts and a separate protected database model.

Device caches and pending attempts are keyed by user ID, with a separate guest cache. Signing in never silently replaces the account with guest progress; users can explicitly import their guest history. Saves are serialized, re-read the latest remote profile, deduplicate attempts, and rebase moves made during a save. Browser Web Locks coordinate tabs when supported. Offline attempts remain queued for retries on reconnect, page visibility, and a 15-second retry interval. Concurrent updates on different devices are best-effort; avoid simultaneous sessions because Auth metadata has no compare-and-swap operation. Each sequential device session reads the account's latest progress when it opens.

## Verified account configuration (2026-10-28)

- Email/password login and signup enabled; email confirmation remains enabled.
- Custom SMTP **enabled**, using Gmail SMTP on port 465. Supabase warns that personal-email SMTP can affect deliverability. Credentials remain in Supabase; no secrets are copied into source.
- Preserved existing Piano Party Site URL and callbacks.
- Added exact redirect URLs for `https://davidw0311.github.io/projects/chess-practice/`, `http://localhost:3000/projects/chess-practice/`, and `http://127.0.0.1:3159/projects/chess-practice/`.
- Signup returns directly to Chess Practice after email confirmation.
- Actual mailbox delivery and authenticated multi-device persistence require a user-controlled account for final end-to-end verification.

## Verification

`npm test` includes all-bank solution playback, alternate mates, promotions, invalid moves, rating direction, repeat deduplication, review behavior, storage validation, compact profiles, and difficulty selection. Use `npm run typecheck` and targeted ESLint. Run `node node_modules/next/dist/bin/next build` to verify the static export without overwriting unrelated generated branch-hosting files. The existing GitHub Pages workflow publishes `out/` after a push to main.
