import { regiusGlossary, type GlossaryEntry } from "./codexRegiusGlossary.ts";

export type GlossaryToken = { text: string; id?: string };
const escapePattern = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function glossaryForStory(slug: string): GlossaryEntry[] {
  return regiusGlossary.map(entry => {
    let definition = entry.definition;
    if (entry.name === "Helgi") definition = slug === "helgakvida-hjorvardssonar"
      ? "Helgi Hjörvarðsson, the son of Hjörvarðr and Sigrlinn. The valkyrie Sváfa gives him his name and protects him. He is a different hero from Helgi Hundingsbani."
      : "Helgi Hundingsbani, the son of Sigmundr and beloved of the valkyrie Sigrún. His epithet means Hundingr’s slayer. He is distinct from Helgi Hjörvarðsson.";
    if (entry.name === "Atli" && slug === "helgakvida-hjorvardssonar") definition = "King Hjörvarðr’s faithful follower, who helps him find Sigrlinn and later speaks with Hrímgerðr. This Atli is not the king of the Huns in Guðrún’s story.";
    if (entry.name === "Högni" && slug.startsWith("helgakvida-hundingsbana")) definition = "Sigrún’s father, killed in the conflict with Helgi. He is not the Högni who is Guðrún’s brother in the Sigurðr cycle.";
    if (entry.name === "Erpr") definition = ["hamdismal", "gudrunarhvot"].includes(slug)
      ? "The brother killed by Hamðir and Sörli on their way to avenge Svanhildr. Hamðismál calls him their half-brother; the surrounding prose traditions differ about his parentage."
      : "One of Atli and Guðrún’s two young sons. Guðrún kills him and his brother Eitill in her revenge against their father.";
    if (entry.name === "Hati" && slug === "helgakvida-hjorvardssonar") definition = "The giant killed by Helgi, and father of the giant-woman Hrímgerðr. He is distinct from the wolf of the same name in the cosmological poems.";
    return definition === entry.definition ? entry : { ...entry, definition };
  });
}

export function createGlossaryMatcher(entries: GlossaryEntry[]) {
  const aliases = new Map<string, string>();
  for (const entry of entries) for (const alias of entry.aliases) aliases.set(alias, entry.id);
  const pattern = new RegExp(`(?<![\\p{L}\\p{M}])(${[...aliases.keys()].sort((a, b) => b.length - a.length).map(escapePattern).join("|")})(?![\\p{L}\\p{M}])`, "gu");
  return (text: string): GlossaryToken[] => {
    const tokens: GlossaryToken[] = [];
    let end = 0;
    for (const match of text.matchAll(pattern)) {
      if (match.index > end) tokens.push({ text: text.slice(end, match.index) });
      tokens.push({ text: match[0], id: aliases.get(match[0]) });
      end = match.index + match[0].length;
    }
    if (end < text.length) tokens.push({ text: text.slice(end) });
    return tokens;
  };
}

export function usedGlossary(entries: GlossaryEntry[], texts: string[]) {
  const match = createGlossaryMatcher(entries);
  const ids = new Set(texts.flatMap(text => match(text).map(token => token.id)));
  return entries.filter(entry => ids.has(entry.id));
}
