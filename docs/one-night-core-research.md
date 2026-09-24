# One Night rules research and implementation decisions

Research date: 25 September 2026. Primary publisher sources:
- [Base rulebook](https://cdn.shopify.com/s/files/1/0740/4855/files/ONUW_rules-updated_for_BGG.pdf?337=)
- [Base getting started guide](https://cdn.shopify.com/s/files/1/0740/4855/files/ONUW_Getting_Started_for_BGG.pdf?v=1687188092)
- [Daybreak rulebook](https://cdn.shopify.com/s/files/1/0740/4855/files/Daybreak_rules_for_BGG.pdf?338=)
- [Vampire rulebook](https://cdn.shopify.com/s/files/1/0740/4855/files/VAMP_rules.pdf?351=)
- [Publisher complete current wake order](https://cdn.shopify.com/s/files/1/0740/4855/files/Wake_Order_5.0.pdf?38=)

Implementation specification below describes factual mechanics in original wording, not copied narration or artwork. Publisher PDFs are image-only, read by OCR. The combined current wake order takes precedence over older standalone order (notably Doppelganger before Sentinel).

## State and sequence

Deal N+3 cards; Alpha adds a fourth center slot containing a separate wolf card. One night, one discussion, one simultaneous ballot; there is no night kill or elimination before the ballot. Original role controls night actions, physical card controls final role. Copy metadata travels with the physical copy card. Marks belong to players and move independently of cards. Artifacts override role/team after the night. Inspection results are immutable snapshots. No player may inspect the current card after night except an explicit ability.

Ballot targets another player, with no abstention. All tied highest targets die if highest >=2; if every target has <=1, nobody dies. Protection removes a target from death consideration, then next eligible vote level >=2 applies. Hunter's death also kills its ballot target. Bodyguard protects its ballot target instead of casting a vote. Tanner wins on death and suppresses wolf victory; village can co-win by killing a wolf. With no wolves, village requires no deaths; Minion with no wolves instead wins when some other player dies. Winning roles use final card/mark/artifact, not original.

## Base and Daybreak

Werewolves recognize original pack; Dream Wolf only signals identity and gets no information. Lone awake wolf may inspect one center card (option). Minion privately sees original wolves. Both Masons must be included; they identify one another. Seer chooses another player's card OR two different center cards. Robber optionally exchanges self/other then sees new card; it does not activate the stolen role. Troublemaker optionally exchanges two OTHER cards without looking. Drunk must exchange self/center unseen, unless shielded. Insomniac sees own current card. Villager/Tanner/Hunter have no night action.

Sentinel optionally shields another player's card, preventing all later viewing/movement/artifact placement but not marks. Alpha must exchange extra center wolf with another player not in original pack. Mystic may inspect another card after wolf recognition. Apprentice Seer may inspect one center. P.I. may inspect up to two other cards sequentially, stopping immediately on an actual wolf/Tanner card and acquiring that identity. Looking at a copying card does not reveal or acquire its hidden copied identity. Witch optionally inspects center, then MUST give that same card to any unshielded player (self allowed). Village Idiot optionally rotates all movable OTHER player cards clockwise or anticlockwise, skipping self/shielded seats. Revealer may reveal another card; actual wolf/Tanner cards return facedown, copying cards remain faceup. Curator optionally gives one random eligible artifact to any unshielded player, without learning it. Owner privately sees artifact at dawn. Claw/Brand/Cudgel replace role with wolf/villager/Tanner and remove prior endgame powers; Void does nothing, Mask forbids speech, Shroud requires looking away.

## Vampire

Dusk runs before ordinary night. Everyone initially has Clarity. Vampires collectively replace one non-vampire's mark with Vampire. Master is protected from vote death when another final vampire votes for it. Count gives Fear to non-vampire other than infected player. Renfield learns original vampires and infected target and gives self Bat; it is vampire ally, but village if no final vampire remains. Diseased gives Disease to adjacent seat. Both Diseased final role and Disease mark cause voters targeting them to lose regardless of normal victory. Cupid gives zero to two Love marks; all final Love holders share death, overriding protection, but retain teams. Instigator gives Traitor: holder wins only when another teammate dies (ineffective when alone on team). Priest resets own mark and optionally one other's to Clarity. Assassin marks one target; wins if any final Assassin mark holder dies, can co-win independently. Apprentice Assassin learns Assassin and wants any final Assassin dead; if no original Assassin, it places the mark itself and wants its final holder dead. If no Assassin mark exists, Assassin becomes village for victory.

All players inspect marks after dusk, then Lovers identify one another. Fear suppresses night abilities but not dusk or endgame abilities. Dream Wolf with Fear does not signal to wolves, but still signals to Minion/Squire. Original Werewolf converted by Vampire mark still performs original wolf action. Marksman optionally inspects another card and a DIFFERENT player's mark. Pickpocket optionally exchanges own mark with another and sees new mark. Gremlin optionally exchanges two player cards OR two marks (self allowed), never both. Role-changing artifacts override Vampire mark; other marks still apply. Sentinel shields card only.

## Copy roles

Copycat must view one center card and becomes that role, acting at its normal time. A Copycat that started in center stays village/no ability when moved to a player. Doppelganger looks at another player; its copied identity travels with the card. Most base/Daybreak powers occur immediately; copied wolf/Mason join normal recognition; copied Insomniac/Revealer/Curator act immediately after original. Vampire copies: wolf-like Vampire/Master join vampire recognition; Count/Renfield/Priest/Assassin/Apprentice/Marksman/Pickpocket/Gremlin act after the corresponding original. Diseased/Cupid/Instigator act immediately. Doppelganger seeing Copycat inherits its chosen role but does not perform the Copycat's scheduled power. Duplicate Love marks all belong to one linked group, not separate pairs.

## Combined victory

When village, wolf and vampire factions all have final players, remove top two vote ranks (second can be one vote); if first rank ties, only first-rank tied players die. Village requires at least one dead wolf AND vampire. Wolf requires dead vampire and zero dead wolves; vampire symmetric. If a faction is absent among players, ordinary single-rank resolution applies. The Alien expansion generalizes multi-faction play; see separate expansion research. Setup and UI must distinguish canonical mechanics from app-specific adaptations for undocumented randomized variants.

## Required interaction tests

Card swap preserves original ability; inspection snapshot does not update; self/center/card count validation; Alpha fourth center usable by all center powers; Witch cannot abort after inspection; P.I. cannot inspect second card after wolf/Tanner; shield prevents own Drunk/Robber/Insomniac but not mark movement; bodyguard vote excluded and next-rank election; Hunter chain and Love deaths; copy card moved retains identity; Dreamwolf recognition secrecy; Fear blocks power but not dusk; antidote-like mechanics from ordinary Werewolf must never appear here; marking the original wolf vampire changes final faction but not night action; final role-changing artifact removes Hunter/Bodyguard; no early reveal to host; disconnection never autoselects action, explicit host skip remains available.
