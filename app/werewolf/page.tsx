import type { Metadata } from "next";
import WerewolfApp from "./WerewolfApp";

export const metadata: Metadata = {
  title: "Nightfall · Werewolf / 狼人杀",
  description: "A private table for Werewolf. Play in English or Chinese with friends, advanced roles, resilient multiplayer rooms, and an optional voiced moderator.",
  alternates: { canonical: "/werewolf/" },
};

export default function WerewolfPage() {
  return <WerewolfApp />;
}
