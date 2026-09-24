# One Night expansion research and implementation contract

Research date: 25 September 2026. Rules below are factual implementation notes, written in our own words. Original narration, illustrations and card scans are not copied into this project.

## Primary sources inspected

- [Alien product / official rulebook and FAQ links](https://beziergames.com/products/one-night-ultimate-alien)
- [Alien rules, eight pages](https://cdn.shopify.com/s/files/1/0740/4855/files/ONUA_online_Rules.pdf)
- [Alien FAQ: overrides printed rules where they disagree](https://cdn.shopify.com/s/files/1/0740/4855/files/Alien_App_FAQ_8f4f1971-e98f-4171-bce9-824eefd5f802.pdf)
- [Super Villains product](https://beziergames.com/products/one-night-ultimate)
- [Super Villains rules, four pages](https://cdn.shopify.com/s/files/1/0740/4855/files/ONSV_online_Rules.pdf)
- [Publisher's human-narrator Super Villains script](https://cdn.shopify.com/s/files/1/0740/4855/files/Narration_for_One_Night_Ultimate_Super_Villains.pdf)
- [Bonus Roles product, including complete contents of Bonus Packs 1–4](https://beziergames.com/products/one-night-ultimate-bonus-roles)
- [Bonus Roles rules, four pages](https://cdn.shopify.com/s/files/1/0740/4855/files/ONBR_online_rules.pdf)
- [Publisher's full night order, version 5](https://cdn.shopify.com/s/files/1/0740/4855/files/Wake_Order_5.0.pdf)
- [Super Heroes publisher-authored rules, library-hosted scan](https://www.buffalolib.org/sites/default/files/gaming-unplugged/inst/One%20Night%20Ultimate%20Superheroes%20Instructions.pdf)
- [Publisher's current app listing](https://apps.apple.com/us/app/one-night/id728175611)

## Scope and honest limits

The combinable One Night Ultimate line consists of original Werewolf, Daybreak, Vampire, Alien, Super Villains / Super Heroes, and Bonus Packs 1–4 (collected as Bonus Roles). Alternate-art promos do not add mechanics. One Week Ultimate Werewolf, Werewords and Ultimate Werewolf are separate games, not role expansions for this mode.

The Alien rulebook deliberately does **not** publish the complete random-event or ripple catalogue. It delegates variable actions to the companion app. Public publisher pages and PDFs provide broad action families, examples and corrective edge cases; these do not establish every proprietary app question, weighting or interaction. Our app must therefore explicitly label its Alien variable-rule pool as a documented digital adaptation, and must never claim the entire official app's random catalogue has been reproduced. Every listed role nevertheless needs a real functioning action/win condition. Full-night time-loop and arbitrary repeat-role ripples are excluded rather than faked. All source-confirmed deterministic roles retain their official mechanics.

## Role mechanics: engine facts

### Alien (13 cards, 12 distinct roles)

| Role | Action / victory requirement |
|---|---|
| Oracle | Acts before Copycat; an app question can alter team or victory. A changed team does not change the role itself. A center-card Oracle still needs a hidden default choice. |
| Alien ×2 | Recognize all original Aliens, Synthetic, Groob, Zerb and Body Snatcher. The app chooses extra night instructions; some variants change a **player** permanently into an Alien regardless of later card swaps. |
| Synthetic Alien | Recognized as an Alien but has an independent desire to die. Its death defeats the village and alien teams. |
| Cow | Learns whether at least one physical neighbor was among the awake Aliens; receives a boolean, not names. |
| Groob / Zerb | Recognize each other in addition to Alien meeting. If both are held by players, each wants the opposite role dead and their own role alive; otherwise ordinary Alien victory. |
| Leader | Learns initial Alien identities and whether Groob/Zerb are paired. Normally village; with the pair present instead needs both to survive. If every Alien votes for Leader, Alien victory overrides village, even if an Alien dies. |
| Psychic | Variable private card inspection; allowed target set/count are supplied by app. |
| Rascal | Variable card movement, optional or mandatory; target restrictions can make the action impossible. No substitute targets when impossible. |
| Exposer | Publicly turn over exactly the instructed number (1–3) of centers, or none. Never reveal just one when instructed two. |
| Blob | Its required neighbors are relative to the **final Blob card holder**. Needs itself and designated neighbors alive; can co-win with another team. |
| Mortician | App may permit viewing neither, one or both neighbors. Wins if a final physical neighbor dies, alongside other winners. |

No mid-night card swap changes which player performs the originally dealt action. Later copy transformations are the specific exceptions described by those roles. Groob/Zerb/Leader endgame checks need physical final cards plus copied equivalents, not just original seat assignments.

### Super Villains / Super Heroes

- Mirror Man copies a center role, retains the physical Mirror Man card, and later acts when that copied role is called. The copied identity travels with its physical card.
- Temptress supplies one extra Villain reserve card outside the ordinary three centers. She exchanges it with a non-Villain player's card. Dr. Peeker privately sees another player's card. Rapscallion sees a center. Henchman #7 only recognizes other Villains. All four identify fellow original Villains together.
- Evilometer learns whether a physical neighbor is a Villain. It does not receive the neighbor's identity.
- Mad Scientist wins by being caught; unlike a simple Tanner interpretation, this suppresses both ordinary hero and villain victory even when a villain is caught too. Intern wins with a caught Mad Scientist, or needs their own death if no final Mad Scientist exists.
- Annoying Lad must privately notify one physical neighbor. Detector has Seer mechanics. Role Retriever has Robber mechanics. Voodoo Lou has Witch mechanics. Switcheroo has Troublemaker mechanics. Self-Awareness Girl has Insomniac mechanics.
- Flipper can expose another player's card only if the card is a hero; other cards are inspected privately but stay hidden. Innocent Bystander is specifically not a hero for this check, even though winning with heroes.
- Innocent Bystander has no action. Super Heroes is the same family of mechanics with a different retail role mix; the extra Ricochet Rhino is included through Bonus Roles as well.

### Bonus Roles 1–4 (16 unique labels)

- Aura Seer: learns which players actually viewed or moved a card **before this step**. Initial dealt-card viewing does not count. Merely waking/declining does not count.
- Cursed: no action; a Werewolf or Vampire vote transforms this final card into the corresponding creature before death/winner resolution. Simultaneous conflicting Wolf + Vampire votes are not disambiguated by this PDF; the digital rule must state a deterministic tie policy.
- Prince: votes against it are excluded. If another player has at least two counted votes, the highest such count can die instead.
- Apprentice Tanner: knows original Tanner; wins when final Tanner dies, or by dying if no final Tanner remains.
- Beholder: sees who originally acted as Seer / Apprentice Seer and may inspect their current cards.
- Thing: may privately notify one adjacent player. No target identity should be revealed by the notification.
- Squire: identifies original Werewolves and may inspect their current cards. Wins with Werewolves; if none remain, wins when another player dies.
- Body Snatcher: initially participates in Aliens, then must exchange with a non-Alien player and see the stolen card. Both its own card and the specific stolen physical card become Alien cards. This is **card-bound**, unlike the player-bound conversion in some Alien variants. Marks override this identity; artifacts override both.
- Empath: app determines a question, which other players answer secretly for the Empath. Nightfall uses explicitly displayed yes/no questions concerning private night knowledge.
- Nostradamus: may inspect up to three cards one at a time; the last card determines its team. Wins only if alive **and** that team wins. Team membership does not make it an actual Wolf/Vampire/Alien. A default must be determined even if its card is in the center. Its team is public; the cards viewed stay private.
- Family Man: analogous to Blob. The publisher's narrator script defines symmetric family size as one neighbor each side at 4–6 players, two at 7–9, three at 10+.
- Windy Wendy: final Villain voter turns this final role into a Villain before counting caught Villains.
- Defender-er: the player it votes for cannot be caught; remove the protected candidate before taking the highest count (threshold at least two).
- The Sponge: Prince-like ignored votes.
- Ricochet Rhino: when selected by the top vote count, redirects its own capture to its voted target. This replaces, not adds to, Rhino's capture; do it before chained Hunter/Lover deaths.
- Innocent Bystander: duplicates the Super Villains card.

Bonus artifacts: Bow of the Hunter replaces role with Hunter; Cloak of the Prince replaces with Prince; Sword of the Bodyguard replaces with Bodyguard; Mist of the Vampire replaces with Vampire; Alien Artifact replaces with Alien; Dagger of the Traitor changes victory to requiring **someone else** on your team to die. Mist removes a Prince's old protection. These are Curator artifacts, not extra player cards.

## Cross-expansion resolution and pitfalls

Major factions for the published Alien epic-battle table are village, wolves, vampires and aliens. Count factions actually held by players after transformations, not just included in the deck. At least three active factions means deaths from the two highest vote totals: when first place ties, only that tied first-place group; otherwise include every second-place tie. A single second-place vote is eligible in this mode. With only two active factions retain the ordinary at-least-two threshold.

For epic victory, each monster faction needs its own creatures to survive and at least one opposing monster faction casualty; village needs casualties from two different hostile factions. Other independent roles keep their own objectives. The published Alien chart predates Super Villains; applying the same rule to Villains is a disclosed digital mixed-faction convention.

Official errata: Doppelgänger-Oracle does not act again. It inherits Oracle's changed team/objective; Copycat-Oracle is plain village because Oracle already acted. Doppelgänger-Blob gets a separate neighborhood. During a time-loop, original players repeat original actions, and Body Snatcher may create a second converted physical card. Repeat Beholder/Squire only inspect cards, without repeated identification. A repeated Curator cannot put a second artifact on a card. These latter repeat rules are retained as research, not an assertion that time-loop mode is implemented.

Fear blocks night actions but not identity/thumb signals for Tanner, Seer, Apprentice Seer or Wolves. Artifact > mark > card-bound Body Snatcher conversion. Beholder/Aura/Squire results must snapshot information at their own phase and never silently update as later cards move.

## Required adversarial tests

1. Swapped role still acts from its original seat; copied identity follows physical card.
2. Aura excludes declined action and future view; captures actual earlier swaps.
3. Body Snatcher moving a converted Villager only transforms that unique instance, not every Villager.
4. Cow/Evilometer never expose actual adjacent identities.
5. Nostradamus's death never counts as monster casualty merely because it follows a monster team.
6. Blob / Family Man / Mortician recalculate neighborhood from final holder.
7. Groob/Zerb split objectives; only one present uses ordinary Alien team.
8. Cursed/Wendy transition happens before winner calculation.
9. Prince / Sponge / Defender skip protected highest votes and consider the next eligible count.
10. Rhino redirect followed by Hunter/Lovers chains is finite and idempotent.
11. Mad Scientist's death overrides hero/villain ordinary winners.
12. Exposer exactly-N or skip; Rascal insufficient legal targets is a clean no-op.
13. Center Oracle/Nostradamus defaults do not reveal that the role was undealt.
14. Mixed-major-faction count switches between top-one and top-two vote rules based on final hands.

## Implemented digital variant pool (explicit adaptation)

Nightfall chooses and publishes the following rules at deal time. These are deliberately a finite, inspectable variant pool, **not a claim to reproduce the proprietary app's complete event catalogue**:

- Oracle asks which currently available major faction it should join. A hidden default is chosen if the card is in the center; only the active Oracle can change it.
- Alien meeting adds either no extra action, one optional center inspection for each Alien, or one optional permanent player conversion by the first original Alien clockwise. The first actor is chosen from stable seat order, not network arrival order.
- Psychic optionally inspects one other player's card, two other players' cards, or two centers.
- Rascal optionally swaps two other cards, swaps itself with another player, rotates other movable cards left/right, or swaps two higher-numbered players. Insufficient legal targets makes this action a no-op.
- Exposer reveals exactly one, two or three selected centers, or none.
- Mortician can inspect up to zero, one or two neighbors.
- Blob protects itself and its left neighbor, right neighbor, or both. Family Man uses the publisher's size-based symmetric neighborhood.
- Empath asks a truthfully answered yes/no question: whether each player viewed a card, moved a card, or began as a hostile creature. Replies are private to the Empath.

Roles retain their real mechanics even when their proprietary app randomness is outside this pool. All other listed roles have direct deterministic actions/win conditions. Human touch notifications are translated into anonymous private messages. This digital interface replaces physical reaching/tapping while preserving which player learns the information.

All role types (80 distinct names across the line) are available. A role's deck copy count follows the provided card pool; copying abilities can create additional effective instances during play. Alternate-art cards are not separate mechanical roles. Super Villains and Super Heroes share the named-role catalogue; the retail boxes' different mixes do not introduce a separate rules system.

The extra Alpha Wolf center is eligible for the same center-inspection/exchange abilities as the ordinary centers, including expansion abilities. Temptress's extra Villain reserve is separately tracked. Vampire marks change winning allegiance while retaining the card's night and vote abilities; therefore a Vampire-marked Prince still ignores votes, but a Vampire-marked Blob no longer uses Blob's personal victory. A role-changing artifact replaces both role and allegiance. Empty optional actions retain explicit skip controls; mandatory actions with no legal target get an explicit no-op confirmation.
