// Transcribed from the user-supplied PDF, pages 3–33. Preserve source wording.
export type RegiusStory = {
  slug: string; number: number; title: string; subtitle: string; kind: string;
  group: "gods" | "heroes"; paragraphs: string[]; sourcePage: number; minutes: number;
  excerpt?: string; image?: string; imageAlt?: string;
};
export const regiusSource = "https://chatgpt.com/share/6aa4e0f4-0a50-83ec-95fb-a3ffb640060d";
export const regiusStories: RegiusStory[] = [
  {
    "slug": "voluspa",
    "number": 1,
    "title": "Völuspá",
    "subtitle": "The Prophecy of the Seeress",
    "kind": "Mythological poem 1",
    "group": "gods",
    "paragraphs": [
      "An old seeress is summoned to speak before Odin, and from the beginning she tells the whole shape of time. She remembers the emptiness before the world, then the making of earth, sea, sun, and stars. She sees the gods in their first bright age, building halls and playing with golden pieces before corruption enters the world. The first war breaks out with the coming of Gullveig, greed spreads, and the order of the gods begins to fray. The seeress names dwarfs, speaks of Yggdrasil, and hints at fates already woven beyond the sight of most beings.",
      "From there the poem darkens into foreknowledge. Baldr dies. Bound monsters strain against their chains. Wolves chase the sun and moon. At last comes Ragnarök: Heimdall blows the Gjallarhorn, giants and gods march to battle, Odin faces Fenrir, Thor kills the Midgard serpent and dies from its venom, and Surt covers the world in flame. Yet the seeress does not end in ruin alone. She sees a renewed earth rise green from the sea, fields growing unsown, the surviving gods meeting again, and a hall brighter than the sun. Völuspá is not one adventure but the grand frame of the whole Eddic universe: creation, doom, and rebirth spoken in a single terrible breath."
    ],
    "sourcePage": 3,
    "minutes": 2,
    "excerpt": "“Hljóðs bið ek allar / helgar kindir, / meiri ok minni / mögu Heimdallar.”",
    "image": "/assets/codex-regius/voluspa.webp",
    "imageAlt": "A seeress and Odin beneath visions of creation, destruction, and a renewed world"
  },
  {
    "slug": "havamal",
    "number": 2,
    "title": "Hávamál",
    "subtitle": "The Sayings of the High One",
    "kind": "Mythological poem 2",
    "group": "gods",
    "paragraphs": [
      "Hávamál is less a single story than a book of counsel spoken in Odin’s voice. It begins with practical wisdom: how a guest should enter a hall, when a traveler should speak, how much drink is enough, how to test a friend, and why a foolish tongue can destroy its owner. Much of the poem sounds almost ordinary, as if a wandering elder were giving hard-earned advice on hospitality, reputation, caution, love, and survival. But because the speaker is Odin, even the plainest maxims feel sharpened by divine experience.",
      "In its later sections the poem turns openly mythic. Odin tells how he sacrificed himself to himself, hanging for nine nights on the wind-swept tree, wounded by a spear, until he seized the runes from below and gained hidden knowledge. He also recounts the theft of the Mead of Poetry, winning sacred inspiration by cunning, shape-changing, seduction, and escape. So Hávamál stands at two levels at once. It is a handbook for living carefully in a dangerous world, and it is also the confession of a god who gained wisdom only through ordeal, pain, and risk. The result is one of the most intimate texts in the manuscript: Odin not as distant king, but as a speaker teaching by proverb, memory, and scar."
    ],
    "sourcePage": 4,
    "minutes": 2,
    "excerpt": "“Gáttir allar, / áðr gangi fram, / um skoðask skyli...” Also: “Deyr fé, / deyja frændr...”",
    "image": "/assets/codex-regius/havamal.webp",
    "imageAlt": "Odin suspended from the world tree, surrounded by runes"
  },
  {
    "slug": "vafthrudnismal",
    "number": 3,
    "title": "Vafþrúðnismál",
    "subtitle": "Odin’s Wisdom Contest with the Giant",
    "kind": "Mythological poem 3",
    "group": "gods",
    "paragraphs": [
      "Odin decides to visit the giant Vafþrúðnir, whose knowledge is said to be unmatched. Frigg warns him that the journey is dangerous, but Odin goes anyway, entering the giant’s hall in disguise and proposing a contest of questions. The poem unfolds almost entirely as a duel of knowledge. Each asks the other about the origins of the world, the names of horses that carry day and night, the fate of the gods, the worlds of the dead, and the events surrounding Ragnarök. What matters is not physical strength but memory, insight, and the courage to keep answering under pressure.",
      "Vafþrúðnir proves enormously learned, and Odin respects him enough to push the game to its limit. Finally Odin asks a question no other being can truly answer: what did Odin whisper into Baldr’s ear before the funeral pyre was lit? The giant realizes at once that only Odin himself could know the answer, and he understands that his guest has been the god all along. Odin wins not because he knows more facts than everyone else, but because he knows the one thing that is absolutely private. The poem turns cosmic lore into high drama, showing wisdom as both a noble contest and a dangerous weapon."
    ],
    "sourcePage": 5,
    "minutes": 2
  },
  {
    "slug": "grimnismal",
    "number": 4,
    "title": "Grímnismál",
    "subtitle": "Odin Between the Fires",
    "kind": "Mythological poem 4",
    "group": "gods",
    "paragraphs": [
      "Odin and Frigg watch over two human foster-sons, Agnar and Geirröth, and each favors a different one. Through a contest of influence, Odin eventually visits Geirröth disguised as Grímnir. The king, failing to recognize his guest, has him tortured by being placed between two fires for eight nights. Only the young prince Agnar shows kindness by bringing him a drink. At that moment the bound and burning stranger begins to speak, and what follows is one of the richest tours of Norse cosmology in the manuscript.",
      "Grímnir names halls, rivers, gods, creatures, and regions of the world. He describes Valhöll, the deer and goat upon the world tree, the eagle above, the roots below, and the many marvels of the divine realm. At last he reveals himself as Odin. Geirröth, shocked, leaps up in fear and tries to help—but too late. In his panic he stumbles on his own sword and dies, while Agnar receives the blessing of Odin’s favor. Grímnismál therefore combines punishment, revelation, and cosmic catalog. It is the story of a king who failed at hospitality and a prince who succeeded, framed by a god’s overwhelming disclosure of what lies behind the visible world."
    ],
    "sourcePage": 6,
    "minutes": 2
  },
  {
    "slug": "skirnismal",
    "number": 5,
    "title": "Skírnismál",
    "subtitle": "Freyr’s Love and Skírnir’s Ride",
    "kind": "Mythological poem 5",
    "group": "gods",
    "paragraphs": [
      "Freyr climbs into Odin’s high seat and from there sees Gerðr, a giantess of stunning beauty. He falls so deeply in love that he becomes silent and sick with longing. When his father’s household finally learns the cause, Freyr sends his servant Skírnir to win Gerðr for him. Skírnir demands Freyr’s horse and, most fatefully, Freyr’s sword—the very weapon that fights on its own. Armed with gifts and threats, Skírnir rides through a cold and perilous landscape toward the giantess’s home.",
      "When he reaches Gerðr, he first tries generosity, offering treasures and the famous ring Draupnir. She refuses. He then turns to darker means, speaking a curse of loneliness, madness, and desolation if she continues to reject Freyr. Under the pressure of this terrible magic, Gerðr agrees to meet Freyr after nine nights in a sacred grove. The poem is therefore both a love story and an uneasy one. Freyr’s desire is genuine, but the union is achieved through coercion, and the cost is high: he gives away his sword, leaving himself vulnerable in the future. Skírnismál binds romance, menace, and destiny together in a way that feels beautiful and troubling at once."
    ],
    "sourcePage": 7,
    "minutes": 2,
    "image": "/assets/codex-regius/skirnismal.webp",
    "imageAlt": "A rider approaches a giant fortress through a rugged landscape"
  },
  {
    "slug": "harbardsljod",
    "number": 6,
    "title": "Hárbarðsljóð",
    "subtitle": "Thor and the Ferryman of Insults",
    "kind": "Mythological poem 6",
    "group": "gods",
    "paragraphs": [
      "Thor comes to a stretch of water and asks a ferryman named Hárbarðr to take him across. The ferryman refuses, and what follows is one of the sharpest insult contests in Old Norse poetry. Thor boasts of his strength and giant-killing deeds. Hárbarðr answers with taunts, sly boasts of his own erotic and magical exploits, and repeated attempts to make Thor look crude, slow, and outwitted. Readers quickly realize that Hárbarðr is almost certainly Odin in disguise, amusing himself at Thor’s expense.",
      "Unlike many mythic poems, Hárbarðsljóð contains no heroic resolution. Thor never gets the ride. No battle erupts. Instead the poem delights in contrast: Thor is blunt, literal, and forceful; Hárbarðr is slippery, verbal, and impossible to pin down. The god of thunder, who usually solves problems with his hammer, finds himself trapped in a contest where speech matters more than force. By the end Thor storms away by the longer route, still angry and unsatisfied. The poem is comic, but it also reveals something essential about the gods. Power in this world has many forms, and Thor is not master of all of them."
    ],
    "sourcePage": 8,
    "minutes": 1
  },
  {
    "slug": "hymiskvida",
    "number": 7,
    "title": "Hymiskviða",
    "subtitle": "Thor’s Fishing Trip and the Giant Cauldron",
    "kind": "Mythological poem 7",
    "group": "gods",
    "paragraphs": [
      "The gods need a vast cauldron in which to brew ale, and only the giant Hymir possesses one large enough. Thor goes with Týr to fetch it. The visit becomes a sequence of tests. Thor slaughters and eats the giant’s oxen, nearly exhausting the household’s provisions, and then joins Hymir on a fishing trip. Unsatisfied with ordinary bait, Thor tears off the head of a huge ox and uses it to fish in the deep sea. There he hooks the Midgard serpent itself, drawing the world-encircling monster toward the boat.",
      "In one of the great near-meetings of the myths, Thor and the serpent glare at each other face to face. Thor prepares to strike, but Hymir panics and cuts the line, letting the serpent plunge back into the depths. Later, still in the giant’s hall, Thor proves his strength by smashing a cup only when told to throw it against Hymir’s hard skull. He and Týr then seize the great cauldron and carry it home, though not without fighting pursuing giants on the way. Hymiskviða mixes giant-slaying, brute comedy, and one of Thor’s most famous encounters with cosmic danger."
    ],
    "sourcePage": 9,
    "minutes": 1
  },
  {
    "slug": "lokasenna",
    "number": 8,
    "title": "Lokasenna",
    "subtitle": "Loki’s Quarrel at Ægir’s Feast",
    "kind": "Mythological poem 8",
    "group": "gods",
    "paragraphs": [
      "Ægir hosts a feast for the gods, but Loki turns celebration into poison. After killing the servant Fimafeng in a fit of spite, he forces his way back into the hall and demands a place among the drinkers. One by one he insults nearly everyone present. He accuses the goddesses of sexual misconduct, mocks the gods for cowardice, broken promises, and hidden shame, and drags private scandals into public hearing. Because many of his accusations contain at least a sting of truth, the scene is both comic and deeply uncomfortable.",
      "The other gods answer as best they can, but Loki keeps twisting the conversation back to himself. The feast becomes a verbal battlefield in which no one emerges unscathed. At last Thor arrives. Unlike the others, Thor does not spar at length. He simply threatens to crush Loki with Mjölnir, and those threats succeed where argument failed. Loki withdraws, still spitting defiance, and the poem moves toward the punishment described elsewhere in myth, where he is bound until Ragnarök. Lokasenna is the manuscript’s great scene of social breakdown: the moment when wit stops being playful and becomes corrosive truth-telling from the mouth of an enemy within."
    ],
    "sourcePage": 10,
    "minutes": 2,
    "image": "/assets/codex-regius/lokasenna.webp",
    "imageAlt": "Loki confronts the gods in a firelit feast hall"
  },
  {
    "slug": "thrymskvida",
    "number": 9,
    "title": "Þrymskviða",
    "subtitle": "Thor Dresses as a Bride",
    "kind": "Mythological poem 9",
    "group": "gods",
    "paragraphs": [
      "Thor wakes to discover that Mjölnir is gone. The giant Þrymr has stolen it and will only return it if he receives Freyja as his bride. Freyja refuses so violently that the gods must seek another plan. Heimdall proposes the outrageous solution: Thor himself must dress as the bride, veiled and adorned, while Loki accompanies him disguised as a handmaid. Thor hates the idea, but without the hammer the gods are exposed, so he submits to the humiliation.",
      "At the wedding feast the giant guests are astonished by the bride’s appetite, because Thor devours an ox, eight salmon, and several barrels of mead. Loki smoothly explains that “Freyja” has not eaten for days because of excitement. Þrymr then leans in to kiss the bride and recoils at the burning glare in Thor’s eyes; again Loki invents an excuse. Finally the hammer is brought out and laid in the bride’s lap to bless the marriage. That is the moment Thor has been waiting for. He seizes Mjölnir, throws off the disguise, and kills Þrymr and the gathered giants. Þrymskviða is one of the funniest Eddic poems, but its comedy rests on a real theme: even the mightiest god sometimes wins not by force alone, but by enduring ridicule until the right moment arrives."
    ],
    "sourcePage": 11,
    "minutes": 2,
    "image": "/assets/codex-regius/thrymskvida.webp",
    "imageAlt": "Thor disguised as a bride at the giant’s wedding feast"
  },
  {
    "slug": "volundarkvida",
    "number": 10,
    "title": "Völundarkviða",
    "subtitle": "Wayland the Smith",
    "kind": "Mythological poem 10 / heroic threshold",
    "group": "gods",
    "paragraphs": [
      "Völundr, or Wayland, is a master smith who lives with his brothers and with swan-maiden wives. After years together, the women fly away, and Völundr remains behind, forging treasures while mourning his lost bride. His fame reaches King Níðuðr, who captures him, steals his sword and ring, and hamstrings him so that he cannot escape. Imprisoned on an island forge, Völundr is forced to work for the king who ruined him.",
      "What follows is one of the darkest revenge tales in the Codex Regius. Völundr lures the king’s two sons to his forge, kills them, and fashions grisly gifts from their bodies. He seduces or tricks the king’s daughter Böðvildr and leaves her pregnant. Then, having built wings, he rises into the air beyond the king’s reach and reveals everything from above. Níðuðr can do nothing but listen. The poem offers no clean moral comfort. Völundr is victim and avenger at once, transformed by suffering into someone brilliant and monstrous. Völundarkviða stands at the border between myth and heroic legend, and it leaves the reader with the bitter sense that great artistry can survive captivity—but may do so in a form twisted by pain."
    ],
    "sourcePage": 12,
    "minutes": 2,
    "image": "/assets/codex-regius/volundarkvida.webp",
    "imageAlt": "Wayland works at his island forge beneath golden wings"
  },
  {
    "slug": "alvissmal",
    "number": 11,
    "title": "Alvíssmál",
    "subtitle": "How Thor Outsmarted the All-Wise Dwarf",
    "kind": "Mythological poem 11",
    "group": "gods",
    "paragraphs": [
      "The dwarf Alvíss arrives to claim Thor’s daughter as his promised bride. Thor, returning home, is unwilling to hand her over so easily. Instead of simply refusing, he proposes a test of knowledge. Alvíss must name what different beings—gods, elves, dwarfs, giants, and men—call the earth, the sky, the moon, the sun, fire, night, and many other things. Confident in his learning, Alvíss answers every question brilliantly. The poem becomes a dazzling catalog of poetic synonyms and alternate names, demonstrating the layered vocabulary of the mythic world.",
      "Yet Thor’s real goal is not education but delay. Dwarfs cannot survive direct sunlight, and Thor keeps the questioning going until dawn rises. When day finally breaks, Alvíss is turned to stone. Thor wins through patience and cunning rather than with his hammer. Alvíssmál is a light and clever poem, almost playful compared with the tragedies that surround it. Still, it reinforces a recurring Eddic lesson: knowing many names is not the same as understanding the trap one stands in. Alvíss possesses immense knowledge, but Thor controls the conditions of the contest, and that proves decisive."
    ],
    "sourcePage": 13,
    "minutes": 1
  },
  {
    "slug": "helgakvida-hundingsbana-i",
    "number": 12,
    "title": "Helgakviða Hundingsbana I",
    "subtitle": "Helgi Kills Hunding",
    "kind": "Heroic poem 1",
    "group": "heroes",
    "paragraphs": [
      "Helgi is born into a feud-ridden world and quickly becomes a warrior of exceptional promise. His father has been wronged, and Helgi grows up under the pressure of vengeance. He takes ships, gathers companions, and wins the favor of battle powers. In time he confronts King Hunding, the enemy whose line is bound up with Helgi’s family grief, and kills him, earning the title Hundingsbani—slayer of Hunding.",
      "At the same time another story begins to intertwine with the blood feud. Helgi meets the valkyrie Sigrún, and the two fall deeply in love. But Sigrún has been promised to another man, one linked to the hostile clans. Helgi therefore fights not only for vengeance but also for the right to claim the woman who has chosen him. The poem moves swiftly, full of sea-roads, battle speeches, and shining armor, giving Helgi the aura of a hero touched by fate. He is not merely a killer of enemies; he is a chosen warrior whose love and renown rise together. The first Helgi lay establishes the heroic world of the manuscript: fame is inseparable from feud, and love often arrives already entangled in violence."
    ],
    "sourcePage": 14,
    "minutes": 2,
    "image": "/assets/codex-regius/helgi.webp",
    "imageAlt": "A warrior meets a valkyrie on a white horse"
  },
  {
    "slug": "helgakvida-hjorvardssonar",
    "number": 13,
    "title": "Helgakviða Hjörvarðssonar",
    "subtitle": "Helgi Son of Hjörvarðr and the Valkyrie Sváva",
    "kind": "Heroic poem 2",
    "group": "heroes",
    "paragraphs": [
      "This Helgi is a different hero from the slayer of Hunding, though the repeated name gives the tradition an almost reincarnating feel. He is the son of King Hjörvarðr, at first a quiet boy without even a proper name. A valkyrie named Sváva comes to him, grants him that name, and shapes his destiny by recognizing the greatness hidden within him. With her encouragement Helgi begins the heroic life, gaining a famous sword and entering the cycles of oath, challenge, and revenge that define the saga world.",
      "Helgi eventually confronts the enemies who have caused suffering to his house. He performs great deeds, but the poem keeps returning to his bond with Sváva, who is both beloved woman and otherworldly guide. Their love has a solemn restraint, unlike the more immediate drama of Helgi and Sigrún. In the end Helgi is mortally wounded after renewed conflict. Dying, he entrusts Sváva’s future honor to his kin. She answers with steadfast loyalty, declaring that she will love no living king after him. Helgakviða Hjörvarðssonar is therefore a quieter heroic lay, more elegiac than expansive, and it shows how Eddic heroism often depends on women whose recognition gives meaning to men’s fame."
    ],
    "sourcePage": 15,
    "minutes": 2
  },
  {
    "slug": "helgakvida-hundingsbana-ii",
    "number": 14,
    "title": "Helgakviða Hundingsbana II",
    "subtitle": "Helgi and Sigrún Again",
    "kind": "Heroic poem 3",
    "group": "heroes",
    "paragraphs": [
      "The second lay of Helgi Hundingsbani retells and deepens the tale of Helgi and Sigrún. Their love is intense from the start, but it must cross lines of kinship and feud. Sigrún refuses the marriage arranged for her and rides through danger to seek Helgi. Battles follow, and Helgi defeats the rival forces, including men close to Sigrún by blood. Love therefore comes with guilt already attached, a burden neither of them can avoid.",
      "Eventually Helgi is slain, and the poem turns from battle to grief. Sigrún mourns him with such force that the boundary between worlds seems to bend. In one of the most haunting scenes in the manuscript, Helgi returns from Valhöll for a single night and enters the burial mound, where Sigrún joins him. Their reunion is tender and terrible: love survives death, but only as an exception granted for a moment. Afterward Helgi must ride back to the dead, and Sigrún remains behind, unable to recover fully from loss. This poem is one of the clearest examples of heroic tragedy in the Codex Regius. Victory in battle cannot protect what matters most, and even supernatural reunion only sharpens the pain of parting."
    ],
    "sourcePage": 16,
    "minutes": 2,
    "image": "/assets/codex-regius/helgi.webp",
    "imageAlt": "A warrior meets a valkyrie on a white horse"
  },
  {
    "slug": "fra-dauda-sinfjotla",
    "number": 15,
    "title": "Frá dauða Sinfjǫtla",
    "subtitle": "On the Death of Sinfjötli",
    "kind": "Heroic prose link",
    "group": "heroes",
    "paragraphs": [
      "This short prose bridge tells of the death of Sinfjötli, son of Sigmund and a fierce hero in his own right. At a feast, Sigmund’s new wife Borghild offers poisoned drink to Sinfjötli. He resists at first, but at last Sigmund, not recognizing the danger, passes the cup to him, and Sinfjötli drinks and dies. The moment is brief, but its bitterness is intense: a great line is weakened not by open battle, but by treachery within the hall.",
      "Sigmund lifts his dead son and carries him far, coming at last to a narrow water. There a mysterious ferryman offers passage for the body alone and rows away with it. The ferryman is understood to be Odin. In a few sentences, the prose turns family grief into mythic transition. Sinfjötli disappears into the keeping of the god who had long guided his house, and Sigmund is left to continue toward the doom that will soon engulf his line. Though short, the piece is important because it clears the path for Sigurðr, the next great hero of the Volsung cycle."
    ],
    "sourcePage": 17,
    "minutes": 1
  },
  {
    "slug": "gripisspa",
    "number": 16,
    "title": "Grípisspá",
    "subtitle": "The Prophecy Given to Sigurðr",
    "kind": "Heroic poem 4",
    "group": "heroes",
    "paragraphs": [
      "Young Sigurðr visits his wise kinsman Grípir and asks a bold question: what will become of me? Grípir answers with a prophecy of Sigurðr’s whole life. He foretells the forging of the sword, the slaying of the dragon Fáfnir, the winning of treasure, the awakening of the valkyrie Brynhildr, the tangled deceptions that will part them, and the murder that will end Sigurðr’s life. The hero listens to his future in advance, learning both his glory and his doom.",
      "What makes the poem compelling is Sigurðr’s response. He does not reject the prophecy or collapse beneath it. Instead he continues asking, wanting to know even the worst parts clearly. Grípisspá therefore sets the emotional key for the entire Sigurðr cycle. These stories are not driven by ignorance alone. Fate may be known, at least in outline, and yet still be lived through step by step. By the end, Sigurðr leaves with foreknowledge but no real escape. The poem teaches the audience how to read what follows: every triumph will already carry the shadow of betrayal, and every oath will echo against a future that has, in some sense, already been spoken."
    ],
    "sourcePage": 18,
    "minutes": 2
  },
  {
    "slug": "reginsmal",
    "number": 17,
    "title": "Reginsmál",
    "subtitle": "The Cursed Gold and the Forging of Gram",
    "kind": "Heroic poem 5",
    "group": "heroes",
    "paragraphs": [
      "Reginn, a smith and foster-father to Sigurðr, tells the young hero the story behind the dragon and the treasure. Once the gods killed Ótr, Reginn’s brother, and paid weregild with the gold of Andvari, including a ring burdened with a curse. That cursed hoard destroyed Reginn’s family: his brother Fáfnir seized it, became monstrous with greed, and turned into a dragon to guard it. Reginn wants Sigurðr to avenge him by killing Fáfnir, though his own motives are hardly pure.",
      "Before the deed can be done, Sigurðr insists on the proper tools and the proper justice. He compels help in avenging his father as well, and he has the broken sword fragments reforged into Gram, a weapon strong enough to split an anvil. Reginsmál thus prepares the central dragon-slaying while surrounding it with family history, curse, and suspicion. Reginn appears as teacher, craftsman, and manipulator all at once. Sigurðr grows in stature because he is not merely following instructions; he is learning to read the greed and ambition of those around him. The gold promises greatness, but the poem makes clear that anyone who reaches for it steps into a chain of violence already stained by murder."
    ],
    "sourcePage": 19,
    "minutes": 2
  },
  {
    "slug": "fafnismal",
    "number": 18,
    "title": "Fáfnismál",
    "subtitle": "Sigurðr and the Dragon",
    "kind": "Heroic poem 6",
    "group": "heroes",
    "paragraphs": [
      "Sigurðr digs a trench along the dragon’s path and waits beneath it. When Fáfnir crawls overhead, vast and venomous, Sigurðr drives Gram upward into the creature’s heart. The dying dragon speaks, and the scene becomes more than a feat of courage. Fáfnir warns Sigurðr that the gold he has won carries death with it. Sigurðr answers boldly, refusing to let fear prevent action. A hero who will win renown must still act, even in the presence of curses.",
      "Reginn then asks Sigurðr to roast the dragon’s heart for him. As Sigurðr tests the meat with his finger, he burns himself, puts the finger in his mouth, and suddenly understands the speech of birds. The birds warn him that Reginn plans to kill him and take the treasure. Sigurðr acts first, killing Reginn and taking the hoard for himself. Fáfnismál therefore contains two linked awakenings: first the physical victory over the dragon, and then the mental awakening into deeper knowledge. Sigurðr defeats brute greed, but he also learns that betrayal comes wrapped in counsel. From this point onward he possesses treasure, fame, and sharpened awareness—yet those gains only lead him further into the tragic pattern foretold for him."
    ],
    "sourcePage": 20,
    "minutes": 2,
    "image": "/assets/codex-regius/fafnismal.webp",
    "imageAlt": "Sigurðr faces the immense dragon Fáfnir"
  },
  {
    "slug": "sigrdrifumal",
    "number": 19,
    "title": "Sigrdrífumál",
    "subtitle": "The Valkyrie’s Teaching",
    "kind": "Heroic poem 7",
    "group": "heroes",
    "paragraphs": [
      "Riding on after the dragon-slaying, Sigurðr comes to a shield-wall on a mountain and finds a warrior asleep in armor. He cuts away the mail and wakes a valkyrie—called Sigrdrífa, often identified with Brynhildr—who had been laid under sleep by Odin. Her first words bless day, night, and the powers that watch over living beings. Grateful for awakening, she offers Sigurðr not treasure but instruction.",
      "The poem becomes a long teaching on runes, victory-charms, healing-signs, wise conduct, and the moral habits required for a worthy life. Sigrdrífa speaks of memory, restraint, oath-keeping, and practical intelligence. She teaches that power without right understanding becomes dangerous. In narrative terms, the lay pauses the rush of action and gives Sigurðr a moment of almost ideal union between heroic energy and wise guidance. It is easy to feel, while reading it, that this might have been the turning point toward a happier fate. But because the audience already knows the prophecy, the tenderness of the encounter is shadowed. Sigrdrífumál glows with instruction and possibility precisely because it comes before the betrayals that will break this bond apart."
    ],
    "sourcePage": 21,
    "minutes": 1
  },
  {
    "slug": "brot-af-sigurdarkvidu",
    "number": 20,
    "title": "Brot af Sigurðarkviðu",
    "subtitle": "Fragment of a Lay about Sigurðr",
    "kind": "Heroic poem 8 — surviving fragment",
    "group": "heroes",
    "paragraphs": [
      "This poem survives only in part because leaves are missing from the manuscript, creating the famous Great Lacuna. Even so, the surviving fragment preserves the emotional center of the crisis. Brynhildr learns—or fully feels—that she has been deceived in the matter of her marriage, while Sigurðr has become the husband of Guðrún. The atmosphere is one of injury, humiliation, and rising vengeance. The fragment does not give us every step, but it makes the results unmistakable.",
      "Brynhildr’s wounded honor becomes deadly. Gunnar and Hǫgni are drawn into the disaster, and Sigurðr, though the greatest of heroes, cannot fight against the net of oaths, manipulations, and resentments tightening around him. The fragmentary nature of the poem oddly increases its force, because the missing middle feels like part of the wound. We stand amid broken narrative just as the characters stand amid broken trust. Brot af Sigurðarkviðu reminds the reader that the Codex Regius is not only a storehouse of story but also a damaged survivor of time, carrying loss both in its content and in its physical condition."
    ],
    "sourcePage": 22,
    "minutes": 1
  },
  {
    "slug": "gudrunarkvida-i",
    "number": 21,
    "title": "Guðrúnarkviða I",
    "subtitle": "Guðrún’s First Lament",
    "kind": "Heroic poem 9",
    "group": "heroes",
    "paragraphs": [
      "Sigurðr has been murdered, and Guðrún sits numbed by grief, unable even to weep. Women of high rank come to console her, each telling of her own suffering, as if shared sorrow might break the frozen silence. At first nothing works. Guðrún stares at the dead body and remains beyond tears, trapped in the stunned stillness that often comes before mourning truly begins.",
      "At last the truth overwhelms her. She looks upon Sigurðr—his hair, his wounds, the face she loved—and grief breaks open. The tears come violently, and with them one of the purest expressions of lament in the Eddic poems. Guðrúnarkviða I contains almost no outward action, yet it is powerful because it treats grief itself as an event. The poem slows down to honor the inner catastrophe left by heroic death. Sigurðr’s slaying matters not only because a famous warrior is gone, but because his absence tears a living world apart. Guðrún’s voice will return many times in the manuscript, and this first lament establishes her as one of its deepest centers of human feeling."
    ],
    "sourcePage": 23,
    "minutes": 1
  },
  {
    "slug": "sigurdarkvida-hin-skamma",
    "number": 22,
    "title": "Sigurðarkviða hin skamma",
    "subtitle": "The Short Lay of Sigurðr",
    "kind": "Heroic poem 10",
    "group": "heroes",
    "paragraphs": [
      "This shorter lay retells the catastrophe in a compressed and forceful style. Brynhildr’s grief and fury stand near the center. Deceived in marriage and unable to bear the dishonor she feels has been done to her, she incites Gunnar and his brothers against Sigurðr. Oaths, kinship, and desire collide until murder becomes possible even within the protected space of the household.",
      "Sigurðr is killed, and the poem insists on the horror of that act: the noblest hero falls not in fair combat but through treachery shaped by the people closest to him. Yet Brynhildr is not portrayed as simple villain. Once the killing is done, remorse and doom engulf her as well. She sees clearly what has been destroyed and chooses death rather than continued life inside the ruin. Sigurðarkviða hin skamma is valuable because it concentrates the emotional logic of the larger cycle. Honor violated becomes rage, rage becomes murder, and murder leaves no victor—only a wider circle of grief."
    ],
    "sourcePage": 24,
    "minutes": 1
  },
  {
    "slug": "helreid-brynhildar",
    "number": 23,
    "title": "Helreið Brynhildar",
    "subtitle": "Brynhildr’s Ride to Hel",
    "kind": "Heroic poem 11",
    "group": "heroes",
    "paragraphs": [
      "After her death, Brynhildr rides toward Hel in a wagon. On the way she is challenged by a giantess, who accuses her of having caused disaster through pride, desire, and betrayal. Brynhildr answers by recounting her own version of events. She remembers her earlier life as a valkyrie, Odin’s punishment, her bond with Sigurðr, and the deceptions that led to her forced marriage and his death.",
      "What makes the poem striking is its courtroom-like tone. Brynhildr speaks from beyond the grave, defending her name even when nothing can be undone. She presents herself not as innocent, but as someone trapped in a structure of vows, power, and manipulation larger than any single choice. The ride to Hel becomes a final act of self-interpretation. In life she was spoken about by others; in death she speaks for herself. Helreið Brynhildar gives dignity to a tragic woman whose story has often been told through male action, and it ensures that her voice continues after the pyres have burned out."
    ],
    "sourcePage": 25,
    "minutes": 1
  },
  {
    "slug": "drap-niflunga",
    "number": 24,
    "title": "Dráp Niflunga",
    "subtitle": "The Fall of the Niflungs",
    "kind": "Heroic prose link",
    "group": "heroes",
    "paragraphs": [
      "This prose passage links the death of Sigurðr to the next great cycle of revenge. Brynhildr is dead, Guðrún remains in grief, and political arrangements move forward with grim practicality. Guðrún is eventually married to Atli, the powerful king who will later destroy her brothers. The prose underscores how heroic tragedy does not end cleanly. One death becomes the cause of another alliance, and that alliance becomes the seed of another slaughter.",
      "As a bridge text, Dráp Niflunga lacks the poetic intensity of the lays around it, but it performs an essential narrative task. It carries the cursed momentum of the story from the Volsung tragedy into the Atli tragedy. The Niflungs do not simply “move on.” They walk deeper into a world where treasure, grief, marriage, and kingship keep converting one loss into the next. The prose thus reminds us that the heroic poems form a chain: each catastrophe is inherited by the story that follows."
    ],
    "sourcePage": 26,
    "minutes": 1
  },
  {
    "slug": "gudrunarkvida-ii",
    "number": 25,
    "title": "Guðrúnarkviða II",
    "subtitle": "Guðrún Remembers Her Sorrows",
    "kind": "Heroic poem 12",
    "group": "heroes",
    "paragraphs": [
      "In this second lay Guðrún looks back over the wreckage of her life. She speaks of Sigurðr, of Brynhildr, of her brothers, and of the pressure that forced her into marriage with Atli. The poem is less a single event than a remembered landscape of grief. Guðrún becomes both witness and interpreter of the tragedy, trying to hold together a life broken into multiple irreversible turns.",
      "Because the poem is reflective, it gives unusual weight to endurance. Guðrún has not died with her first husband; she has continued, and that continuation is itself painful. She must carry memory into a new household built on political necessity rather than love. The lay reveals a central truth of the Codex Regius: survival can be as tragic as death. A hero’s end may be swift, but the mourner must go on through changing roles, new loyalties, and old wounds. Guðrúnarkviða II therefore deepens Guðrún from grieving widow into one of the manuscript’s greatest bearers of historical memory."
    ],
    "sourcePage": 27,
    "minutes": 1
  },
  {
    "slug": "gudrunarkvida-iii",
    "number": 26,
    "title": "Guðrúnarkviða III",
    "subtitle": "Guðrún Proves Her Innocence",
    "kind": "Heroic poem 13",
    "group": "heroes",
    "paragraphs": [
      "Now living in Atli’s court, Guðrún is accused of infidelity, specifically of improper closeness with Þjóðrekr. In heroic society such an accusation threatens not only personal honor but political stability. To answer it, Guðrún undergoes an ordeal: she reaches into a boiling cauldron to prove the truth. Because she is innocent, the hot water does not harm her. Her accuser, by contrast, fails to sustain the charge.",
      "The lay is brief, but it reveals another side of Guðrún’s strength. Earlier poems emphasized her grief; here we see her integrity under public suspicion. She survives by steadfastness rather than by vengeance or lament. The ordeal also reminds us how precarious a royal woman’s position can be. Even after the great tragedies of Sigurðr and Brynhildr, the daily risks of life in a king’s hall remain severe. Guðrúnarkviða III is smaller in scale than the surrounding epics, yet it keeps building Guðrún’s authority as a woman who endures trial after trial without losing her inner core."
    ],
    "sourcePage": 28,
    "minutes": 1
  },
  {
    "slug": "odrunargratr",
    "number": 27,
    "title": "Oddrúnargrátr",
    "subtitle": "Oddrún’s Lament",
    "kind": "Heroic poem 14",
    "group": "heroes",
    "paragraphs": [
      "Oddrún, sister of Atli, comes to help a woman named Borgný in childbirth. As she aids the labor, her own sorrow opens into speech. She tells of her love for Gunnar, Guðrún’s brother, a love forbidden by Atli. The childbirth frame lets the poem bind life and grief together: while one woman struggles to bring forth children, another remembers the man she could never openly keep.",
      "Oddrún’s voice is more intimate and personal than political. She mourns not a public marriage or dynastic alliance, but a private love blocked by her brother’s power. Through her lament the wider Niflung tragedy appears again from the side, refracted through someone who loved one of its doomed men. The poem expands the emotional world of the manuscript by showing how catastrophe radiates outward into secondary lives. Gunnar’s fate is famous, but Oddrúnargrátr asks what that fate meant to a woman whose devotion remained largely hidden."
    ],
    "sourcePage": 29,
    "minutes": 1
  },
  {
    "slug": "atlakvida",
    "number": 28,
    "title": "Atlakviða",
    "subtitle": "The Lay of Atli",
    "kind": "Heroic poem 15",
    "group": "heroes",
    "paragraphs": [
      "Atli invites Guðrún’s brothers Gunnar and Hǫgni to his hall, pretending friendship while secretly desiring the treasure once connected with Sigurðr and the Volsungs. Guðrún tries to warn her brothers, but fate carries them into the trap. They fight magnificently when treachery is revealed, yet they are overwhelmed and captured. Atli demands the treasure’s location. Hǫgni’s heart is cut out first, and Gunnar, refusing to speak, is thrown into a snake pit where he plays the harp with his feet until the serpents kill him.",
      "Then the poem turns to Guðrún’s revenge. She kills her own sons by Atli, serves their flesh to him at a feast, and later kills Atli himself. The vengeance is almost beyond endurance, but that extremity is the point. In the heroic world, betrayal has shattered every ordinary bond, including those of marriage and motherhood. Atlakviða is short, fierce, and concentrated, one of the oldest-feeling poems in the heroic collection. It gives the Niflung story one of its harshest forms: treasure breeds treachery, treachery breeds slaughter, and the answer to slaughter becomes an even more terrible kind of justice."
    ],
    "sourcePage": 30,
    "minutes": 1,
    "image": "/assets/codex-regius/atlakvida.webp",
    "imageAlt": "Guðrún watches over the dark hall of Atli"
  },
  {
    "slug": "atlamal",
    "number": 29,
    "title": "Atlamál in grœnlenzku",
    "subtitle": "The Greenland Ballad of Atli",
    "kind": "Heroic poem 16",
    "group": "heroes",
    "paragraphs": [
      "Atlamál tells essentially the same broad story as Atlakviða, but at greater length and in a more domestic style. The warning messages, the conversations among the travelers, the wives’ responses, and the details of hall-life all receive more attention. Because of this, the betrayal feels slower and more humanly developed. We watch people discuss whether to go, whether to trust the invitation, and how to interpret the signs before doom finally closes around them.",
      "The killings remain brutal: Hǫgni dies, Gunnar meets the snakes, and Guðrún takes horrific revenge on Atli. Yet the poem’s expanded scale changes the texture of the tragedy. These are not only legendary figures moving through fixed poses; they are a household, a kin-group, and a set of voices trying to make decisions under uncertainty. Atlamál therefore offers a fuller social tragedy than Atlakviða. It asks not just what happened, but how families talk themselves toward disaster, and how revenge grows out of scenes that begin as council, travel, marriage, and feast."
    ],
    "sourcePage": 31,
    "minutes": 1
  },
  {
    "slug": "gudrunarhvot",
    "number": 30,
    "title": "Guðrúnarhvöt",
    "subtitle": "Guðrún Urges Her Sons to Vengeance",
    "kind": "Heroic poem 17",
    "group": "heroes",
    "paragraphs": [
      "After surviving all that came before, Guðrún faces yet another grief. Her daughter Svanhildr has been put to death by King Jǫrmunrekkr. Guðrún now turns to her sons Hamðir and Sǫrli and urges them to avenge their sister. Before she sends them out, she recounts the whole dreadful history that has shaped her life—father, brothers, husbands, sons, and daughter lost to violence. Her speech turns personal sorrow into a command for action.",
      "What is moving here is the mixture of maternal love and heroic inevitability. Guðrún knows vengeance will likely destroy the sons she still has, yet she calls them to it because honor demands an answer. The poem feels like the last great summoning voice of the older generation. Guðrún has become almost larger than life through suffering, and now she passes the tragic burden onward. Guðrúnarhvöt serves as both recap and ignition, gathering the whole cycle into one speech and then launching the final act of the heroic sequence."
    ],
    "sourcePage": 32,
    "minutes": 1
  },
  {
    "slug": "hamdismal",
    "number": 31,
    "title": "Hamðismál",
    "subtitle": "The Last Vengeance",
    "kind": "Heroic poem 18",
    "group": "heroes",
    "paragraphs": [
      "Hamðir and Sǫrli ride out to avenge their sister Svanhildr against King Jǫrmunrekkr. Along the way they quarrel with their half-brother Erpr, fail to understand his cryptic offer of help, and kill him—a fatal mistake. Only afterward do they realize what they have lost. This grim irony prepares the final confrontation, where the brothers reach the king and strike him, maiming him in revenge for Svanhildr’s death.",
      "Yet vengeance remains incomplete. Because Erpr is gone, the brothers cannot finish the deed in the way destiny required. Surrounded by the king’s men, they fight magnificently and are finally stoned to death. Hamðismál ends the heroic section of the Codex Regius with a harsh, stripped grandeur. There is courage, but little consolation. The heroes act, wound the guilty king, and die. No renewed world follows, only the bleak honor of having answered violence with violence as far as they were able. It is a fitting close to the heroic lays: brave, broken, and fully aware that even justified revenge cannot repair the dead."
    ],
    "sourcePage": 33,
    "minutes": 1
  }
];
