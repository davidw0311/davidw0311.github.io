import story0 from "./codex-regius/voluspa.ts";
import story1 from "./codex-regius/havamal.ts";
import story2 from "./codex-regius/vafthrudnismal.ts";
import story3 from "./codex-regius/grimnismal.ts";
import story4 from "./codex-regius/skirnismal.ts";
import story5 from "./codex-regius/harbardsljod.ts";
import story6 from "./codex-regius/hymiskvida.ts";
import story7 from "./codex-regius/lokasenna.ts";
import story8 from "./codex-regius/thrymskvida.ts";
import story9 from "./codex-regius/volundarkvida.ts";
import story10 from "./codex-regius/alvissmal.ts";
import story11 from "./codex-regius/helgakvida-hundingsbana-i.ts";
import story12 from "./codex-regius/helgakvida-hjorvardssonar.ts";
import story13 from "./codex-regius/helgakvida-hundingsbana-ii.ts";
import story14 from "./codex-regius/fra-dauda-sinfjotla.ts";
import story15 from "./codex-regius/gripisspa.ts";
import story16 from "./codex-regius/reginsmal.ts";
import story17 from "./codex-regius/fafnismal.ts";
import story18 from "./codex-regius/sigrdrifumal.ts";
import story19 from "./codex-regius/brot-af-sigurdarkvidu.ts";
import story20 from "./codex-regius/gudrunarkvida-i.ts";
import story21 from "./codex-regius/sigurdarkvida-hin-skamma.ts";
import story22 from "./codex-regius/helreid-brynhildar.ts";
import story23 from "./codex-regius/drap-niflunga.ts";
import story24 from "./codex-regius/gudrunarkvida-ii.ts";
import story25 from "./codex-regius/gudrunarkvida-iii.ts";
import story26 from "./codex-regius/odrunargratr.ts";
import story27 from "./codex-regius/atlakvida.ts";
import story28 from "./codex-regius/atlamal.ts";
import story29 from "./codex-regius/gudrunarhvot.ts";
import story30 from "./codex-regius/hamdismal.ts";

export type RegiusQuote = { after: number; norse: string; english: string; stanza: string };
export type RegiusStory = {
  slug: string; number: number; title: string; subtitle: string; kind: string;
  group: "gods" | "heroes"; paragraphs: string[]; sourcePage: number; minutes: number;
  image?: string; imageAlt?: string; quotes: RegiusQuote[]; note: string;
  norseSource: string; translationSource: string; wordCount: number;
};
export const regiusSource = "https://chatgpt.com/share/6aa4e0f4-0a50-83ec-95fb-a3ffb640060d";
export const regiusWordsPerMinute = 170;

// Modern prose retellings checked against the linked Old Norse editions and Bellows (1923).
// The original booklet supplies sequence, titles and artwork, rather than the expanded prose.
const edition: (Omit<RegiusStory, "paragraphs" | "minutes" | "wordCount"> & { prose: string })[] = [
  { ...{"slug": "voluspa", "number": 1, "title": "Völuspá", "subtitle": "The Prophecy of the Seeress", "kind": "Mythological poem 1", "group": "gods", "sourcePage": 3, "image": "/assets/codex-regius/voluspa.webp", "imageAlt": "A seeress and Odin beneath visions of creation, destruction, and a renewed world", "norseSource": "https://www.heimskringla.no/wiki/Völuspá", "translationSource": "https://sacred-texts.com/neu/poe/poe03.htm"}, ...story0 },
  { ...{"slug": "havamal", "number": 2, "title": "Hávamál", "subtitle": "The Sayings of the High One", "kind": "Mythological poem 2", "group": "gods", "sourcePage": 4, "image": "/assets/codex-regius/havamal.webp", "imageAlt": "Odin suspended from the world tree, surrounded by runes", "norseSource": "https://www.heimskringla.no/wiki/Hávamál", "translationSource": "https://sacred-texts.com/neu/poe/poe04.htm"}, ...story1 },
  { ...{"slug": "vafthrudnismal", "number": 3, "title": "Vafþrúðnismál", "subtitle": "Odin’s Wisdom Contest with the Giant", "kind": "Mythological poem 3", "group": "gods", "sourcePage": 5, "norseSource": "https://www.heimskringla.no/wiki/Vafþrúðnismál", "translationSource": "https://sacred-texts.com/neu/poe/poe05.htm"}, ...story2 },
  { ...{"slug": "grimnismal", "number": 4, "title": "Grímnismál", "subtitle": "Odin Between the Fires", "kind": "Mythological poem 4", "group": "gods", "sourcePage": 6, "norseSource": "https://www.heimskringla.no/wiki/Grímnismál", "translationSource": "https://sacred-texts.com/neu/poe/poe06.htm"}, ...story3 },
  { ...{"slug": "skirnismal", "number": 5, "title": "Skírnismál", "subtitle": "Freyr’s Love and Skírnir’s Ride", "kind": "Mythological poem 5", "group": "gods", "sourcePage": 7, "image": "/assets/codex-regius/skirnismal.webp", "imageAlt": "A rider approaches a giant fortress through a rugged landscape", "norseSource": "https://www.heimskringla.no/wiki/Skírnismál", "translationSource": "https://sacred-texts.com/neu/poe/poe07.htm"}, ...story4 },
  { ...{"slug": "harbardsljod", "number": 6, "title": "Hárbarðsljóð", "subtitle": "Thor and the Ferryman of Insults", "kind": "Mythological poem 6", "group": "gods", "sourcePage": 8, "norseSource": "https://www.heimskringla.no/wiki/Hárbarðsljóð", "translationSource": "https://sacred-texts.com/neu/poe/poe08.htm"}, ...story5 },
  { ...{"slug": "hymiskvida", "number": 7, "title": "Hymiskviða", "subtitle": "Thor’s Fishing Trip and the Giant Cauldron", "kind": "Mythological poem 7", "group": "gods", "sourcePage": 9, "norseSource": "https://www.heimskringla.no/wiki/Hymiskviða", "translationSource": "https://sacred-texts.com/neu/poe/poe09.htm"}, ...story6 },
  { ...{"slug": "lokasenna", "number": 8, "title": "Lokasenna", "subtitle": "Loki’s Quarrel at Ægir’s Feast", "kind": "Mythological poem 8", "group": "gods", "sourcePage": 10, "image": "/assets/codex-regius/lokasenna.webp", "imageAlt": "Loki confronts the gods in a firelit feast hall", "norseSource": "https://www.heimskringla.no/wiki/Lokasenna", "translationSource": "https://sacred-texts.com/neu/poe/poe10.htm"}, ...story7 },
  { ...{"slug": "thrymskvida", "number": 9, "title": "Þrymskviða", "subtitle": "Thor Dresses as a Bride", "kind": "Mythological poem 9", "group": "gods", "sourcePage": 11, "image": "/assets/codex-regius/thrymskvida.webp", "imageAlt": "Thor disguised as a bride at the giant’s wedding feast", "norseSource": "https://www.heimskringla.no/wiki/Þrymskviða", "translationSource": "https://sacred-texts.com/neu/poe/poe11.htm"}, ...story8 },
  { ...{"slug": "volundarkvida", "number": 10, "title": "Völundarkviða", "subtitle": "Wayland the Smith", "kind": "Mythological poem 10 / heroic threshold", "group": "gods", "sourcePage": 12, "image": "/assets/codex-regius/volundarkvida.webp", "imageAlt": "Wayland works at his island forge beneath golden wings", "norseSource": "https://www.heimskringla.no/wiki/Völundarkviða", "translationSource": "https://sacred-texts.com/neu/poe/poe17.htm"}, ...story9 },
  { ...{"slug": "alvissmal", "number": 11, "title": "Alvíssmál", "subtitle": "How Thor Outsmarted the All-Wise Dwarf", "kind": "Mythological poem 11", "group": "gods", "sourcePage": 13, "norseSource": "https://www.heimskringla.no/wiki/Alvíssmál", "translationSource": "https://sacred-texts.com/neu/poe/poe12.htm"}, ...story10 },
  { ...{"slug": "helgakvida-hundingsbana-i", "number": 12, "title": "Helgakviða Hundingsbana I", "subtitle": "Helgi Kills Hunding", "kind": "Heroic poem 1", "group": "heroes", "sourcePage": 14, "image": "/assets/codex-regius/helgi.webp", "imageAlt": "A warrior meets a valkyrie on a white horse", "norseSource": "https://www.heimskringla.no/wiki/Helgakviða_Hundingsbana_I", "translationSource": "https://sacred-texts.com/neu/poe/poe19.htm"}, ...story11 },
  { ...{"slug": "helgakvida-hjorvardssonar", "number": 13, "title": "Helgakviða Hjörvarðssonar", "subtitle": "Helgi Son of Hjörvarðr and the Valkyrie Sváva", "kind": "Heroic poem 2", "group": "heroes", "sourcePage": 15, "norseSource": "https://www.voluspa.org/literal/helgakvida.htm", "translationSource": "https://sacred-texts.com/neu/poe/poe18.htm"}, ...story12 },
  { ...{"slug": "helgakvida-hundingsbana-ii", "number": 14, "title": "Helgakviða Hundingsbana II", "subtitle": "Helgi and Sigrún Again", "kind": "Heroic poem 3", "group": "heroes", "sourcePage": 16, "image": "/assets/codex-regius/helgi.webp", "imageAlt": "A warrior meets a valkyrie on a white horse", "norseSource": "https://www.heimskringla.no/wiki/Völsungakviða_in_forna", "translationSource": "https://sacred-texts.com/neu/poe/poe20.htm"}, ...story13 },
  { ...{"slug": "fra-dauda-sinfjotla", "number": 15, "title": "Frá dauða Sinfjǫtla", "subtitle": "On the Death of Sinfjötli", "kind": "Heroic prose link", "group": "heroes", "sourcePage": 17, "norseSource": "https://www.heimskringla.no/wiki/Grípisspá", "translationSource": "https://sacred-texts.com/neu/poe/poe21.htm"}, ...story14 },
  { ...{"slug": "gripisspa", "number": 16, "title": "Grípisspá", "subtitle": "The Prophecy Given to Sigurðr", "kind": "Heroic poem 4", "group": "heroes", "sourcePage": 18, "norseSource": "https://www.heimskringla.no/wiki/Grípisspá", "translationSource": "https://sacred-texts.com/neu/poe/poe22.htm"}, ...story15 },
  { ...{"slug": "reginsmal", "number": 17, "title": "Reginsmál", "subtitle": "The Cursed Gold and the Forging of Gram", "kind": "Heroic poem 5", "group": "heroes", "sourcePage": 19, "norseSource": "https://www.heimskringla.no/wiki/Reginsmál", "translationSource": "https://sacred-texts.com/neu/poe/poe23.htm"}, ...story16 },
  { ...{"slug": "fafnismal", "number": 18, "title": "Fáfnismál", "subtitle": "Sigurðr and the Dragon", "kind": "Heroic poem 6", "group": "heroes", "sourcePage": 20, "image": "/assets/codex-regius/fafnismal.webp", "imageAlt": "Sigurðr faces the immense dragon Fáfnir", "norseSource": "https://www.heimskringla.no/wiki/Fáfnismál", "translationSource": "https://sacred-texts.com/neu/poe/poe24.htm"}, ...story17 },
  { ...{"slug": "sigrdrifumal", "number": 19, "title": "Sigrdrífumál", "subtitle": "The Valkyrie’s Teaching", "kind": "Heroic poem 7", "group": "heroes", "sourcePage": 21, "norseSource": "https://www.heimskringla.no/wiki/Sigrdrífumál", "translationSource": "https://sacred-texts.com/neu/poe/poe25.htm"}, ...story18 },
  { ...{"slug": "brot-af-sigurdarkvidu", "number": 20, "title": "Brot af Sigurðarkviðu", "subtitle": "Fragment of a Lay about Sigurðr", "kind": "Heroic poem 8 — surviving fragment", "group": "heroes", "sourcePage": 22, "norseSource": "https://www.heimskringla.no/wiki/Sigurðarkviða_in_meiri", "translationSource": "https://sacred-texts.com/neu/poe/poe26.htm"}, ...story19 },
  { ...{"slug": "gudrunarkvida-i", "number": 21, "title": "Guðrúnarkviða I", "subtitle": "Guðrún’s First Lament", "kind": "Heroic poem 9", "group": "heroes", "sourcePage": 23, "norseSource": "https://www.heimskringla.no/wiki/Guðrúnarkviða_in_fyrsta", "translationSource": "https://sacred-texts.com/neu/poe/poe27.htm"}, ...story20 },
  { ...{"slug": "sigurdarkvida-hin-skamma", "number": 22, "title": "Sigurðarkviða hin skamma", "subtitle": "The Short Lay of Sigurðr", "kind": "Heroic poem 10", "group": "heroes", "sourcePage": 24, "norseSource": "https://norroen.info/src/edda/sigurds/on.html", "translationSource": "https://sacred-texts.com/neu/poe/poe28.htm"}, ...story21 },
  { ...{"slug": "helreid-brynhildar", "number": 23, "title": "Helreið Brynhildar", "subtitle": "Brynhildr’s Ride to Hel", "kind": "Heroic poem 11", "group": "heroes", "sourcePage": 25, "norseSource": "https://www.heimskringla.no/wiki/Helreið_Brynhildar", "translationSource": "https://sacred-texts.com/neu/poe/poe29.htm"}, ...story22 },
  { ...{"slug": "drap-niflunga", "number": 24, "title": "Dráp Niflunga", "subtitle": "The Fall of the Niflungs", "kind": "Heroic prose link", "group": "heroes", "sourcePage": 26, "norseSource": "https://www.heimskringla.no/wiki/Dráp_Niflunga", "translationSource": "https://sacred-texts.com/neu/poe/poe30.htm"}, ...story23 },
  { ...{"slug": "gudrunarkvida-ii", "number": 25, "title": "Guðrúnarkviða II", "subtitle": "Guðrún Remembers Her Sorrows", "kind": "Heroic poem 12", "group": "heroes", "sourcePage": 27, "norseSource": "https://www.heimskringla.no/wiki/Guðrúnarkviða_in_forna", "translationSource": "https://sacred-texts.com/neu/poe/poe31.htm"}, ...story24 },
  { ...{"slug": "gudrunarkvida-iii", "number": 26, "title": "Guðrúnarkviða III", "subtitle": "Guðrún Proves Her Innocence", "kind": "Heroic poem 13", "group": "heroes", "sourcePage": 28, "norseSource": "https://www.heimskringla.no/wiki/Guðrúnarkviða_in_þriðja", "translationSource": "https://sacred-texts.com/neu/poe/poe32.htm"}, ...story25 },
  { ...{"slug": "odrunargratr", "number": 27, "title": "Oddrúnargrátr", "subtitle": "Oddrún’s Lament", "kind": "Heroic poem 14", "group": "heroes", "sourcePage": 29, "norseSource": "https://www.voluspa.org/oddrunargratr6-10.htm", "translationSource": "https://sacred-texts.com/neu/poe/poe33.htm"}, ...story26 },
  { ...{"slug": "atlakvida", "number": 28, "title": "Atlakviða", "subtitle": "The Lay of Atli", "kind": "Heroic poem 15", "group": "heroes", "sourcePage": 30, "image": "/assets/codex-regius/atlakvida.webp", "imageAlt": "Guðrún watches over the dark hall of Atli", "norseSource": "https://www.heimskringla.no/wiki/Atlakviða", "translationSource": "https://sacred-texts.com/neu/poe/poe34.htm"}, ...story27 },
  { ...{"slug": "atlamal", "number": 29, "title": "Atlamál in grœnlenzku", "subtitle": "The Greenland Ballad of Atli", "kind": "Heroic poem 16", "group": "heroes", "sourcePage": 31, "norseSource": "https://www.heimskringla.no/wiki/Atlamál_in_grænlenzku", "translationSource": "https://sacred-texts.com/neu/poe/poe35.htm"}, ...story28 },
  { ...{"slug": "gudrunarhvot", "number": 30, "title": "Guðrúnarhvöt", "subtitle": "Guðrún Urges Her Sons to Vengeance", "kind": "Heroic poem 17", "group": "heroes", "sourcePage": 32, "norseSource": "https://www.heimskringla.no/wiki/Guðrúnarhvöt", "translationSource": "https://sacred-texts.com/neu/poe/poe36.htm"}, ...story29 },
  { ...{"slug": "hamdismal", "number": 31, "title": "Hamðismál", "subtitle": "The Last Vengeance", "kind": "Heroic poem 18", "group": "heroes", "sourcePage": 33, "norseSource": "https://www.heimskringla.no/wiki/Hamðismál", "translationSource": "https://sacred-texts.com/neu/poe/poe37.htm"}, ...story30 }
];
export const regiusStories: RegiusStory[] = edition.map(({ prose, ...story }) => {
  const paragraphs = prose.split("\n\n");
  const wordCount = [prose, ...story.quotes.map(quote => quote.english)].join(" ").trim().split(/\s+/u).length;
  return { ...story, paragraphs, wordCount, minutes: Math.ceil(wordCount / regiusWordsPerMinute) };
});
