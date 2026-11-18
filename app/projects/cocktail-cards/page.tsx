import type { Metadata, Viewport } from "next";
import CocktailCards from "./CocktailCards";

export const metadata: Metadata = {
  title: "After Hours — Cocktail Cards",
  description: "A pocket cocktail book with classics and home adaptations from Jigger & Pony, Mama Diam, MO BAR Singapore and Cat Bite Club. Swipe through drinks, ingredients and methods.",
  alternates: { canonical: "/projects/cocktail-cards/" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#171b17" };

export default function Page() { return <CocktailCards />; }
