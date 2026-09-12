import type { GlossaryEntry } from "@/data/codexRegiusGlossary";
import { createGlossaryMatcher } from "@/data/codexRegiusTerms";
import { GlossaryTerm } from "./glossary";

export function createGlossedText(entries: GlossaryEntry[]) {
  const match = createGlossaryMatcher(entries);
  return function GlossedText({ text }: { text: string }) {
    return match(text).map((token, index) => token.id
      ? <GlossaryTerm key={index} id={token.id}>{token.text}</GlossaryTerm>
      : token.text);
  };
}
