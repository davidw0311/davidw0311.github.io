# Face-to-face night audit — 27 September 2026

The night contract is: the narrator names the permitted wake group, finishes that announcement, and only then opens its private controls. The game waits for actual decisions and for inspection results to be read, announces that group must close its eyes, and only then calls the next group. Offline action/result readers do not time out. The host retains an explicit hard skip that reveals no actor identities.

## Conflicts found and corrected

| Area | Conflict | Correction |
| --- | --- | --- |
| One Night Dream Wolf | A sleeping role had a mandatory Continue action alongside awake wolves. Opening its eyes would reveal teammates. | No phone action or acknowledgment. Wolves still receive its identity privately. A Dream-Wolf-only pack call uses the ordinary random absent-actor pause. Copied Dream Wolf follows the same rule. |
| One Night Empath | Only Empath was called awake, but everyone had to answer a phone prompt. | The server derives truthful answers from starting roles and recorded inspections/movements. Only Empath wakes and reads them. This preserves the app’s disclosed question variants. |
| One Night copied late abilities | A Doppelgänger follow-up reused the original role’s audio, inviting the original player to wake again. | Dedicated bilingual copied-role calls explicitly keep the original role asleep. The copier receives private guidance about waiting for that separate call. |
| Classic Mechanical Wolf | A copied power acted during the original role’s turn, allowing both players to identify each other by looking around. | Separate, publicly reserved Mechanical Wolf calls for each supported night power. All six calls remain regardless of the actual copied ability, including after death. |
| Both games: inspection results | The last action immediately started the close-eyes cue before its new result could be read. | A private “I’ve read the result” action holds the same wake window open. Stale submissions cannot repeat swaps or inspections. Bots acknowledge through the same public action contract. |
| Classic exact-role checks / Gravekeeper | Results were published at dawn rather than during the role’s open-eyes window. | Results arrive immediately and are read before closing. Lethal checks, deaths and other end-of-night effects still resolve at dawn; results are not duplicated. |
| One Night group calls | Singular role calls did not clearly include Alpha/Mystic Wolves, Master/Count, or the Alien subtypes that also had to act. | The group recordings now explicitly name these participants and tell Dream Wolf to stay asleep. |
| One Night mark review | The cue told people to close their eyes before the screen confirmation opened. | Explicit open-eyes review, read and confirm, then a separate closing cue. Fear holders are told to sleep through the remaining night. |
| Private screens | Clue histories and previously opened role/result panels could stay visible during another role’s turn. | These private panels are hidden outside the player’s permitted wake window. Relevant recent clues appear with their current action. |

## Verification

Dedicated wake-window tests cover Dream Wolf, copied Dream Wolf, solo absent-role timing, Empath, Fear, copied late-role audio, Seer, exact-role checks, Gravekeeper, Mechanical Wolf, read acknowledgments, duplicate commands and disconnections. Large-game simulations assert that on-screen actions belong to a physically permitted wake group, in addition to their existing card, voting, privacy and reconnection checks.

Verification passed: 466 backend tests and 352 frontend/helper tests, including 600 One Night simulations with 12–16 players and 288 classic simulations with 12–24 players. Phone-width browser checks exercised real private-result screens and confirmations in both games. Type checking, targeted lint and the production build passed. This is browser testing, not a physical iPhone audio test.

The public API smoke checks use disposable rooms and delete them afterward. The One Night round-controls check now verifies that Dream Wolf does **not** receive a phone action. Existing role-resolution tests explicitly acknowledge newly introduced private-result screens.

New reserved calls are derived from the starting deck, never from secret assignments. Existing classic rooms already inside an older scheduled night retain that schedule until their next night; restarting a round adopts the complete updated schedule immediately. Already-open older Dream Wolf/Empath turns remove sleeping respondents on synchronization.

## Practical limits

This remains a phone-mediated game: players must follow the narrator and must not inspect other players’ screens. Passive notifications such as anonymous taps, changing teammates and transferred marks do not require the sleeping recipient to wake; they can be read in a subsequent permitted wake window or during the day. The implementation does not reproduce every physical gesture or unpublished official app variant. In particular Empath’s recorded-answer adaptation avoids requiring blind phone input.

Dream Wolf’s sleeping behavior and separate Doppelgänger late turns agree with the publisher’s [Daybreak rules and resources](https://beziergames.com/products/daybreak). The fixes preserve Nightfall’s existing disclosed center-swap and expansion adaptations.
