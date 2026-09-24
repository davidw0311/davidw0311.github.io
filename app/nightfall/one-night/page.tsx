import type { Metadata } from "next";
import OneNightApp from "./OneNightApp";

export const metadata: Metadata = {
  title: "One Night Werewolf / 一夜狼人杀 · Nightfall",
  description: "A single night of secret identities, switched cards, and one final vote. Play One Night Werewolf with friends, expansions, and Kokoro narration in English and Chinese.",
  alternates: { canonical: "/nightfall/one-night/" },
};

export default function OneNightPage() { return <OneNightApp />; }
