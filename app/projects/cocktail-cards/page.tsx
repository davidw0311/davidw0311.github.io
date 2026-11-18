import type { Metadata, Viewport } from "next";
import CocktailCards from "./CocktailCards";

export const metadata: Metadata = {
  title: "After Hours — Cocktail Cards",
  description: "A pocket cocktail book. Swipe through photographs, ingredients and home recipes inspired by Jigger & Pony’s BLOOM menu.",
  alternates: { canonical: "/projects/cocktail-cards/" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#171b17" };

export default function Page() { return <CocktailCards />; }
