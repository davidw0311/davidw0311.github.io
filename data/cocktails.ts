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
  {
    id: "crimson-fizz", name: "Crimson Fizz", spirit: "Vodka", mood: "Cherry · Bright · Bubbly",
    description: "A lively cherry fizz with a crisp, refreshing finish.", glass: "Highball", method: "Build", tip: "Cherry ratafia is a cherry aperitif. Crème de griotte is a sour-cherry liqueur; use a similar cherry liqueur if needed.",
    ingredients: [["35 ml", "Vodka"], ["20 ml", "Cherry ratafia"], ["10 ml", "Crème de griotte"], ["5 ml", "Kirsch"], ["90 ml", "Chilled soda water"], ["1", "Amarena cherry"]],
    steps: ["Add vodka, ratafia, cherry liqueur and kirsch to a chilled highball glass.", "Fill with ice and top with chilled soda water.", "Lift gently once with a spoon. Garnish with an Amarena cherry."],
  },
  {
    id: "ugly-tomatoes", name: "Ugly Tomatoes", spirit: "Gin", mood: "Savoury · Garden-fresh · Floral",
    description: "Ripe heirloom tomato with a floral lift and a hint of caraway.", glass: "Rocks", method: "Shake", tip: "Press ripe tomatoes through a fine sieve for fresh juice. This home version is unclarified, unlike the bar’s polished preparation.",
    ingredients: [["45 ml", "Gin"], ["60 ml", "Heirloom tomato juice"], ["10 ml", "Kümmel liqueur"], ["10 ml", "Elderflower cordial"], ["1 pinch", "Fine salt"]],
    steps: ["Add gin, tomato juice, kümmel, elderflower cordial and salt to a shaker.", "Add ice and shake for 12 seconds to chill and combine.", "Double strain over fresh ice in a rocks glass. Garnish with a small tomato wedge."],
  },
  {
    id: "soursop-colada", name: "Soursop Colada", spirit: "Rum", mood: "Tropical · Tangy · Creamy",
    description: "A silky soursop-and-yoghurt colada with an aromatic touch of baijiu.", glass: "Rocks", method: "Shake", tip: "Use seedless soursop pulp or purée. Coconut chips stand in for the bar’s coconut-and-soursop bonbon garnish.",
    ingredients: [["40 ml", "Aged rum"], ["5 ml", "Baijiu"], ["40 ml", "Seedless soursop purée"], ["20 g", "Plain yoghurt"], ["15 ml", "Lemon juice"], ["15 ml", "Simple syrup (1:1)"], ["15 ml", "Pasteurised egg white"]],
    steps: ["Shake all ingredients without ice for 15 seconds to combine the yoghurt and egg white.", "Add plenty of ice and shake hard for another 15 seconds.", "Double strain over fresh ice in a rocks glass. Add a few coconut chips if you like."],
  },
  {
    id: "pony-star-martini", name: "Pony Star Martini", spirit: "Tequila", mood: "Passion fruit · Fragrant · Sparkling",
    description: "Passion fruit and tequila, lifted with makrut lime and Champagne.", glass: "Coupe", method: "Shake & top", tip: "Use fresh passion fruit pulp in place of the bar’s fruit sphere. Pasteurised egg white can be replaced with aquafaba.",
    ingredients: [["40 ml", "Blanco tequila"], ["25 ml", "Passion fruit purée"], ["15 ml", "Lemon juice"], ["15 ml", "Simple syrup (1:1)"], ["15 ml", "Pasteurised egg white"], ["1", "Makrut lime leaf"], ["30 ml", "Brut Champagne, chilled"]],
    steps: ["Tear the lime leaf into a shaker. Add everything except Champagne and shake without ice for 15 seconds.", "Add ice, shake hard for 15 seconds, then double strain into a large chilled coupe.", "Slowly add Champagne and garnish with a little passion fruit pulp. Never shake the Champagne."],
  },
  {
    id: "banana-boulevard", name: "Banana Boulevard", spirit: "Rye whisky", mood: "Banana · Rich · Smoky",
    description: "Rye spice and sweet banana meet a restrained curl of peat smoke.", glass: "Rocks", method: "Stir", tip: "Banana liqueur replaces the bar’s banana preparations; the banana-leaf element is omitted in this simpler home version.",
    ingredients: [["50 ml", "Rye whisky"], ["15 ml", "Banana liqueur"], ["5 ml", "Peated Scotch"], ["1 slice", "Banana, to garnish"]],
    steps: ["Add rye, banana liqueur and peated Scotch to a mixing glass filled with ice.", "Stir for 20–30 seconds, tasting for your preferred dilution.", "Strain over a large ice cube in a rocks glass. Garnish with a fresh banana slice."],
  },
  {
    id: "singa-sling", name: "Singa Sling", spirit: "Gin", mood: "Cherry · Tropical · Refreshing",
    description: "A streamlined Singapore sling, bright with cherry and pineapple.", glass: "Highball", method: "Shake & top", tip: "Soda supplies the bubbles in this home version. The bar carbonates its finished cocktail for a finer texture.",
    ingredients: [["40 ml", "Gin"], ["15 ml", "Cointreau"], ["15 ml", "Cherry liqueur"], ["60 ml", "Pineapple juice"], ["45 ml", "Chilled soda water"]],
    steps: ["Add gin, Cointreau, cherry liqueur and pineapple juice to a shaker with ice.", "Shake hard for 12 seconds, then strain into a tall glass over fresh ice.", "Top with soda, stir gently once, and garnish with mint or a pineapple wedge."],
  },
  {
    id: "peach-party", name: "Peach Party", spirit: "Gin", mood: "Peach · Floral · Bittersweet",
    description: "Soft peach and rose with a bittersweet blush of Aperol and cassis.", glass: "Rocks", method: "Shake", tip: "Rose water is potent: start with one drop. This version uses a fresh peach garnish instead of the bar’s Aperol-infused slice.",
    ingredients: [["35 ml", "Gin"], ["25 ml", "Peach purée"], ["15 ml", "Aperol"], ["5 ml", "Crème de cassis"], ["20 ml", "Lemon juice"], ["10 ml", "Simple syrup (1:1)"], ["1 drop", "Rose water"]],
    steps: ["Add all ingredients to a shaker with plenty of ice.", "Shake hard for 15 seconds to combine the fruit and citrus.", "Double strain over fresh ice in a rocks glass. Garnish with a thin peach slice."],
  },
  {
    id: "manhattan", name: "Manhattan", spirit: "Japanese whisky", mood: "Dark fruit · Cacao · Warming",
    description: "A rich whisky Manhattan with cherry and a thread of chocolate.", glass: "Coupe", method: "Stir", tip: "A cherry and a dusting of cacao replace the bar’s ganache-filled cherry garnish. Choose a robust blended Japanese whisky.",
    ingredients: [["50 ml", "Japanese whisky"], ["25 ml", "Sweet red vermouth"], ["5 ml", "Cherry ratafia"], ["2 dashes", "Chocolate bitters"], ["1", "Cocktail cherry"], ["1 pinch", "Cacao powder, to garnish"]],
    steps: ["Add whisky, vermouth, cherry ratafia and bitters to a mixing glass with ice.", "Stir for 20–30 seconds, until cold and lightly diluted.", "Strain into a chilled coupe. Garnish with the cherry, lightly dusted with cacao."],
  },
  {
    id: "champagne-ramos-gin-fizz", name: "Champagne Ramos Gin Fizz", spirit: "Gin", mood: "Creamy · Citrus · Sparkling",
    description: "A cloud of citrus cream, sparkling wine, and a ribbon of ruby port.", glass: "Highball", method: "Shake & top", tip: "A simplified Ramos: no sourdough garnish or elaborate layering. Use pasteurised egg white and pour Champagne slowly to control the foam.",
    ingredients: [["35 ml", "Gin"], ["20 ml", "Cream"], ["20 ml", "Lemon juice"], ["15 ml", "Vanilla syrup"], ["20 ml", "Pasteurised egg white"], ["10 ml", "Ruby port"], ["40 ml", "Brut Champagne, chilled"]],
    steps: ["Shake gin, cream, lemon, vanilla syrup and egg white without ice for 20 seconds.", "Add ice and shake hard for 30 seconds. Strain into a chilled tall glass and wait 30 seconds.", "Slowly top with Champagne, then drizzle port over the foam. Never shake sparkling wine."],
  },
  {
    id: "strawberry-matcha-cloud", name: "Strawberry Matcha Cloud", spirit: "Gin", mood: "Berry · Nutty · Soft cream",
    description: "Strawberry and sherry beneath a soft cap of green matcha cream.", glass: "Rocks", method: "Shake & float", tip: "Whisk 30 ml cream with ¼ tsp matcha until thick but pourable. Fresh purée replaces the bar’s clarified milk punch.",
    ingredients: [["30 ml", "Gin"], ["15 ml", "Amontillado sherry"], ["10 ml", "Fino sherry"], ["25 ml", "Strawberry purée"], ["15 ml", "Lemon juice"], ["10 ml", "Simple syrup (1:1)"], ["2 drops", "Absinthe"], ["30 ml", "Matcha cream (see bar note)"]],
    steps: ["Prepare the matcha cream as described in the bar note and set aside.", "Shake all remaining ingredients with ice for 15 seconds. Double strain over a large ice cube.", "Float the matcha cream over the back of a spoon. Serve with the layers intact."],
  },
  {
    id: "bloom-martini", name: "Bloom Martini", spirit: "Gin", mood: "Dry · Citrus · Delicate",
    description: "A crisp, citrus-led martini with a gentle sparkling finish.", glass: "Martini", method: "Stir & top", tip: "A splash of soda approximates the bar’s delicate carbonation. Express citrus oils over the glass rather than adding juice.",
    ingredients: [["50 ml", "Gin"], ["15 ml", "Extra-dry vermouth"], ["10 ml", "Cocchi Americano"], ["10 ml", "Chilled soda water"], ["1 strip", "Lemon peel"], ["1 strip", "Lime peel"]],
    steps: ["Stir gin, vermouth and Cocchi Americano with ice for 20–30 seconds.", "Strain into a well-chilled martini glass. Add the soda gently.", "Express the lemon and lime peels over the drink, then add them as a garnish."],
  },
  {
    id: "peanut-alexander", name: "Peanut Alexander", spirit: "Gin", mood: "Nutty · Chocolate · Velvety",
    description: "Salted peanut, fig, and cacao folded into a creamy gin nightcap.", glass: "Coupe", method: "Shake", tip: "For fig syrup, stir one part smooth fig jam with one part hot water, then strain and cool. Contains peanuts and dairy.",
    ingredients: [["35 ml", "Gin"], ["20 ml", "Cacao liqueur"], ["30 ml", "Cream"], ["10 ml", "Fig syrup (see bar note)"], ["1 tsp", "Smooth salted peanut butter"]],
    steps: ["Stir the peanut butter with gin and fig syrup in a shaker to loosen it.", "Add cacao liqueur, cream and ice. Shake hard for 20 seconds.", "Double strain into a chilled coupe. Finish with a small fig wedge if available."],
  },
  {
    id: "always-autumn", name: "Always Autumn", spirit: "Scotch", mood: "Apple · Spiced · Mellow",
    description: "Malt whisky and apple brandy, warmed by cinnamon and clove.", glass: "Rocks", method: "Shake", tip: "For spice syrup, steep 1 cinnamon stick and 2 cloves in 50 ml hot water for 10 minutes. Strain, dissolve in 50 g sugar, and cool.",
    ingredients: [["35 ml", "Single malt Scotch"], ["15 ml", "Apple brandy"], ["15 ml", "Fino sherry"], ["15 ml", "Lemon juice"], ["15 ml", "Cinnamon-clove syrup"], ["1 slice", "Apple, to garnish"]],
    steps: ["Add whisky, apple brandy, sherry, lemon and spice syrup to a shaker with ice.", "Shake for 12 seconds until well chilled.", "Strain over a large ice cube in a rocks glass. Garnish with a thin apple slice."],
  },
];

export type CocktailSort = "name" | "spirit" | "menu";

export function cocktailAlcoholType(drink: Pick<Cocktail, "spirit">) {
  return /whisky|bourbon|scotch/i.test(drink.spirit) ? "Whisky" : drink.spirit;
}

export function findCocktails(query: string, sort: CocktailSort = "name") {
  const term = query.trim().toLocaleLowerCase();
  const result = cocktails.filter(d => `${d.name} ${d.spirit} ${d.mood} ${d.ingredients.map(i => i[1]).join(" ")}`.toLocaleLowerCase().includes(term));
  if (sort === "menu") return result;
  return result.sort((a, b) => (sort === "spirit" ? cocktailAlcoholType(a).localeCompare(cocktailAlcoholType(b)) : 0) || a.name.localeCompare(b.name));
}

export function swipeAction(dx: number, dy: number): "next" | "previous" | "forward" | "back" | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 45) return null;
  return Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? "next" : "previous") : (dx < 0 ? "forward" : "back");
}
