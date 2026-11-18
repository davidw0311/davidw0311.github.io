export type Cocktail = {
  id: string; name: string; spirit: string; mood: string; description: string;
  glass: string; method: string; ingredients: [string, string][]; steps: string[]; tip: string;
};

export const cocktailSource = "https://www.jiggerandpony.com/bloom-menu";
export const cocktails: Cocktail[] = [
  {
    id: "yuzu-whisky-sour", name: "Yuzu Whisky Sour", spirit: "Bourbon", mood: "Citrusy · Floral · Silky",
    description: "Golden citrus, a little elderflower, and a soft cloud of foam.", glass: "Coupe", method: "Shake", tip: "Use pasteurised egg white, or replace it with 20 ml aquafaba.",
    ingredients: [["45 ml", "Bourbon"], ["15 ml", "St-Germain"], ["15 ml", "Yuzu juice"], ["15 ml", "Lemon juice"], ["15 ml", "Simple syrup (1:1)"], ["20 ml", "Pasteurised egg white"]],
    steps: ["Add everything to a shaker. Shake without ice for 15 seconds to build the foam.", "Add ice and shake hard for another 15 seconds.", "Double strain into a chilled coupe. Let the foam settle before serving."],
  },
  {
    id: "basil-smash", name: "Basil Smash", spirit: "Gin", mood: "Green · Fresh · Fragrant",
    description: "Garden-fresh basil with bright lemon and a delicate tea finish.", glass: "Rocks", method: "Shake", tip: "For tea syrup, dissolve equal weights sugar and freshly brewed orchid white tea. Cool before using.",
    ingredients: [["40 ml", "Gin"], ["10 ml", "Pisco"], ["25 ml", "Lemon juice"], ["20 ml", "Orchid white tea syrup (1:1)"], ["8 leaves", "Fresh basil"]],
    steps: ["Gently press the basil with lemon juice in a shaker.", "Add gin, pisco, tea syrup and plenty of ice. Shake hard for 15 seconds.", "Double strain over fresh ice in a rocks glass. Finish with a basil leaf."],
  },
  {
    id: "mango-margarita", name: "Mango Margarita", spirit: "Tequila", mood: "Tropical · Tart · Smoky",
    description: "Two shades of mango, a flicker of smoke, and peppery warmth.", glass: "Rocks", method: "Shake", tip: "Green mango adds tartness. Adjust the syrup to suit the ripeness of your fruit.",
    ingredients: [["40 ml", "Blanco tequila"], ["10 ml", "Mezcal"], ["15 ml", "Cointreau"], ["20 ml", "Lime juice"], ["25 ml", "Ripe mango purée"], ["10 g", "Finely grated green mango"], ["5 ml", "Agave syrup"], ["1 pinch", "Crushed Sichuan pepper"]],
    steps: ["Add all ingredients to a shaker with ice.", "Shake hard for 15 seconds to combine the mango and citrus.", "Double strain over fresh ice in a rocks glass. Garnish with a thin mango slice."],
  },
  {
    id: "penicillin", name: "Penicillin", spirit: "Scotch", mood: "Zesty · Warming · Floral",
    description: "Ginger warmth meets lemon and fragrant jasmine tea.", glass: "Rocks", method: "Shake", tip: "Make ginger syrup with equal weights fresh ginger juice and sugar. Use a small pinch of turmeric.",
    ingredients: [["45 ml", "Blended Scotch"], ["15 ml", "Limoncello"], ["20 ml", "Lemon juice"], ["15 ml", "Ginger syrup (1:1)"], ["15 ml", "Strong jasmine tea, cooled"], ["1 pinch", "Ground turmeric"]],
    steps: ["Add all ingredients to a shaker filled with ice.", "Shake for 15 seconds, until the shaker feels frosty.", "Strain over a large ice cube. Finish with a slice of candied ginger."],
  },
  {
    id: "wasabi-highball", name: "Wasabi Highball", spirit: "Japanese whisky", mood: "Crisp · Fruity · Subtle heat",
    description: "An apricot highball with just a whisper of wasabi.", glass: "Highball", method: "Build", tip: "For a simple apricot soda, combine 20 ml apricot nectar with 100 ml chilled sparkling water.",
    ingredients: [["45 ml", "Japanese whisky"], ["⅛ tsp", "Wasabi paste, or less to taste"], ["120 ml", "Apricot soda, chilled"]],
    steps: ["Stir the wasabi into the whisky until thoroughly dispersed.", "Fill a chilled highball glass with ice and pour in the whisky.", "Top with apricot soda. Lift gently once with a spoon to mix without losing the bubbles."],
  },
  {
    id: "espresso-martini", name: "Espresso Martini", spirit: "Vodka", mood: "Roasted · Rich · Velvety",
    description: "Fresh coffee and honey, shaken into a deep, velvety nightcap.", glass: "Coupe", method: "Shake", tip: "Honey syrup is equal weights honey and warm water. This simplified version omits the bar’s cacao tuile.",
    ingredients: [["45 ml", "Vodka"], ["35 ml", "Fresh espresso, cooled"], ["15 ml", "Honey syrup (1:1)"]],
    steps: ["Chill a coupe. Brew the espresso and allow it to cool briefly.", "Add vodka, espresso and honey syrup to a shaker with plenty of ice. Shake hard for 20 seconds.", "Double strain into the coupe. Garnish with three coffee beans, or a little grated dark chocolate."],
  },
  {
    id: "negroni", name: "Negroni", spirit: "Gin", mood: "Bitter · Bold · Bittersweet",
    description: "Ruby-red, precisely balanced, and beautifully unhurried.", glass: "Rocks", method: "Stir", tip: "Mancino Chinato is the menu’s choice; a sweet red vermouth makes an accessible substitute.",
    ingredients: [["30 ml", "London dry gin"], ["30 ml", "Campari"], ["30 ml", "Mancino Chinato / sweet vermouth"], ["1 dash", "Orange bitters"], ["1 strip", "Orange peel"]],
    steps: ["Pour gin, Campari, vermouth and bitters into a mixing glass with ice.", "Stir for 20–30 seconds until cold and lightly diluted.", "Strain over a large ice cube. Express the orange peel over the glass and add it as a garnish."],
  },
  {
    id: "old-fashioned", name: "Old Fashioned", spirit: "Bourbon", mood: "Spirit-forward · Warm · Spiced",
    description: "Bourbon, bitters, and the slow pleasure of a perfect stir.", glass: "Rocks", method: "Stir", tip: "Rich demerara syrup is two parts demerara sugar to one part hot water, by weight. Cool first.",
    ingredients: [["60 ml", "Bourbon"], ["7.5 ml", "Rich demerara syrup (2:1)"], ["2 dashes", "Angostura bitters"], ["1 strip", "Orange peel"]],
    steps: ["Add bourbon, syrup and bitters to a mixing glass filled with ice.", "Stir for 20–30 seconds. Taste and stir a little longer if you prefer more dilution.", "Strain over a large cube in a rocks glass. Express the orange peel over the drink and garnish."],
  },
];

export function findCocktails(query: string, alphabetical: boolean) {
  const term = query.trim().toLocaleLowerCase();
  const result = cocktails.filter(d => `${d.name} ${d.spirit} ${d.mood} ${d.ingredients.map(i => i[1]).join(" ")}`.toLocaleLowerCase().includes(term));
  return alphabetical ? result.sort((a, b) => a.name.localeCompare(b.name)) : result;
}

export function swipeAction(dx: number, dy: number): "next" | "previous" | "forward" | "back" | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 45) return null;
  return Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? "next" : "previous") : (dx < 0 ? "forward" : "back");
}
