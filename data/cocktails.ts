export type Cocktail = {
  id: string; name: string; spirit: string; mood: string; description: string;
  glass: string; method: string; ingredients: [string, string][]; steps: string[]; tip: string;
  source?: { name: string; url: string; adaptation?: boolean };
  image?: string;
  imagePosition?: string;
  illustration?: boolean;
};

export const cocktailSource = "https://www.jiggerandpony.com/bloom-menu";
export function cocktailPhoto(drink: Cocktail) {
  return drink.image ?? `/assets/cocktails/${drink.id}.${drink.source ? "webp" : "jpg"}`;
}
export const mamaDiamSource = "https://www.mamadiamsg.com/s/MMD_Oct2026Menu_Digital.pdf";
const mamaDiam = { name: "Mama Diam", url: mamaDiamSource, adaptation: true };
export const moBarSource = "https://www.mandarinoriental.com/en/singapore/marina-bay/dine/mo-bar";
const moBar = { name: "MO BAR Singapore", url: moBarSource, adaptation: true };
export const catBiteSource = "https://www.opentable.sg/r/cat-bite-club-reservations-singapore";
const catBite = { name: "Cat Bite Club", url: catBiteSource, adaptation: true };
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
  {
    id: "mojito", name: "Mojito", spirit: "Rum", mood: "Minty · Lime · Refreshing",
    source: { name: "IBA", url: "https://iba-world.com/iba-cocktail/mojito/" },
    description: "White rum, fresh mint and lime, lengthened with lively soda.", glass: "Highball", method: "Build", tip: "Press the mint gently to release its aroma. Tearing or grinding the leaves can add bitterness.",
    ingredients: [["45 ml", "White Cuban rum"], ["20 ml", "Fresh lime juice"], ["6 sprigs", "Mint"], ["2 tsp", "White cane sugar"], ["To top", "Soda water"]],
    steps: ["Gently press the mint with sugar and lime juice in a highball glass.", "Add a splash of soda and fill the glass with ice. Pour in the rum.", "Top with soda and stir gently. Finish with a mint sprig and a lime slice."],
  },
  {
    id: "margarita", name: "Margarita", spirit: "Tequila", mood: "Tart · Orange · Crisp",
    source: { name: "IBA", url: "https://iba-world.com/iba-cocktail/margarita/" },
    description: "The classic meeting of agave, orange liqueur and fresh lime.", glass: "Coupe", method: "Shake", tip: "Salt just half the rim if desired, so each sip can be taken with or without salt.",
    ingredients: [["50 ml", "100% agave tequila"], ["20 ml", "Triple sec"], ["15 ml", "Fresh lime juice"], ["Optional", "Salt for half the rim"]],
    steps: ["Chill a coupe and optionally salt half its rim.", "Add tequila, triple sec and lime juice to a shaker with ice. Shake until cold.", "Strain into the chilled glass and serve straight away."],
  },
  {
    id: "daiquiri", name: "Daiquiri", spirit: "Rum", mood: "Clean · Lime · Balanced",
    source: { name: "IBA", url: "https://iba-world.com/iba-cocktail/daiquiri/" },
    description: "A spare, bright rum sour with just lime and a little sugar.", glass: "Coupe", method: "Shake", tip: "Dissolve the sugar before adding ice to avoid a gritty finish. Use freshly squeezed lime.",
    ingredients: [["60 ml", "White Cuban rum"], ["20 ml", "Fresh lime juice"], ["2 bar spoons", "Superfine sugar"]],
    steps: ["Combine rum, lime juice and sugar in a shaker. Stir until the sugar dissolves.", "Fill the shaker with ice and shake until well chilled.", "Strain into a chilled coupe. No garnish is needed."],
  },
  {
    id: "cosmopolitan", name: "Cosmopolitan", spirit: "Vodka", mood: "Cranberry · Citrus · Bright",
    source: { name: "IBA", url: "https://iba-world.com/iba-cocktail/cosmopolitan/" },
    description: "Citrus vodka and cranberry in a sharp, rosy-pink classic.", glass: "Coupe", method: "Shake", tip: "Use citrus-flavoured vodka for the IBA specification and express a lemon twist over the finished drink.",
    ingredients: [["40 ml", "Citron vodka"], ["15 ml", "Cointreau"], ["15 ml", "Fresh lime juice"], ["30 ml", "Cranberry juice"]],
    steps: ["Pour all ingredients into a shaker filled with ice.", "Shake until cold, then strain into a large chilled cocktail glass.", "Express a lemon twist over the surface and use it as a garnish."],
  },
  {
    id: "mai-tai", name: "Mai Tai", spirit: "Rum", mood: "Nutty · Citrus · Rich rum",
    source: { name: "IBA", url: "https://iba-world.com/iba-cocktail/mai-tai/" },
    description: "Two rums, almond orgeat and orange curaçao with a bright lime edge.", glass: "Double rocks", method: "Shake", tip: "Orgeat contains almonds. The IBA calls for a molasses-based Martinique rum rather than an agricole rum.",
    ingredients: [["30 ml", "Amber Jamaican rum"], ["30 ml", "Martinique molasses rum"], ["15 ml", "Orange curaçao"], ["15 ml", "Orgeat syrup"], ["30 ml", "Fresh lime juice"], ["7.5 ml", "Simple syrup"]],
    steps: ["Add both rums, curaçao, orgeat, lime and syrup to a shaker with ice.", "Shake, then pour the drink and ice into a double rocks glass.", "Finish with a pineapple spear, mint and lime peel."],
  },
  {
    id: "paloma", name: "Paloma", spirit: "Tequila", mood: "Grapefruit · Salty · Sparkling",
    source: { name: "IBA", url: "https://iba-world.com/iba-cocktail/paloma/" },
    description: "Tequila and pink grapefruit soda, sharpened with lime and salt.", glass: "Highball", method: "Build", tip: "Chill the grapefruit soda first and stir gently to preserve its bubbles.",
    ingredients: [["50 ml", "100% agave tequila"], ["5 ml", "Fresh lime juice"], ["1 pinch", "Salt"], ["100 ml", "Pink grapefruit soda"]],
    steps: ["Pour tequila and lime juice into a highball glass.", "Add ice and a pinch of salt, then pour in the grapefruit soda.", "Stir gently and garnish with a lime slice."],
  },
  {
    id: "moscow-mule", name: "Moscow Mule", spirit: "Vodka", mood: "Ginger · Lime · Refreshing",
    source: { name: "IBA", url: "https://iba-world.com/iba-cocktail/moscow-mule/" },
    description: "Vodka, punchy ginger beer and lime over plenty of ice.", glass: "Mule mug / rocks", method: "Build", tip: "Ginger beer provides a stronger ginger flavour than ginger ale. A rocks glass works as well as a mule mug.",
    ingredients: [["45 ml", "Vodka"], ["120 ml", "Ginger beer"], ["10 ml", "Fresh lime juice"]],
    steps: ["Fill a mule mug or rocks glass with ice.", "Add vodka and ginger beer, then pour in the lime juice.", "Stir gently to combine and finish with a lime slice."],
  },
  {
    id: "spritz", name: "Aperol Spritz", spirit: "Aperol / Prosecco", mood: "Bittersweet · Orange · Bubbly",
    source: { name: "IBA", url: "https://iba-world.com/iba-cocktail/spritz/" },
    description: "A bright orange aperitivo with Prosecco and a splash of soda.", glass: "Wine glass", method: "Build", tip: "The IBA also notes variations using Campari, Cynar or Select in place of Aperol.",
    ingredients: [["90 ml", "Prosecco"], ["60 ml", "Aperol"], ["1 splash", "Soda water"], ["1 slice", "Orange, to garnish"]],
    steps: ["Fill a large wine glass with ice.", "Pour in Prosecco, Aperol and a splash of soda.", "Give it a gentle stir and add an orange slice."],
  },
  {
    id: "french-75", name: "French 75", spirit: "Gin", mood: "Lemon · Dry · Sparkling",
    source: { name: "IBA", url: "https://iba-world.com/iba-cocktail/french-75/" },
    description: "A brisk gin-and-lemon sour lifted with dry Champagne.", glass: "Flute", method: "Shake & top", tip: "Keep the Champagne chilled and add it only after shaking the other ingredients.",
    ingredients: [["30 ml", "Gin"], ["15 ml", "Fresh lemon juice"], ["15 ml", "Sugar syrup"], ["60 ml", "Champagne"]],
    steps: ["Shake gin, lemon juice and sugar syrup with ice.", "Strain into a chilled Champagne flute.", "Top with Champagne and stir very gently. Never shake the sparkling wine."],
  },
  {
    id: "pina-colada", name: "Piña Colada", spirit: "Rum", mood: "Pineapple · Coconut · Creamy",
    source: { name: "IBA", url: "https://iba-world.com/iba-cocktail/pina-colada/" },
    description: "White rum, pineapple and coconut blended into a tropical classic.", glass: "Hurricane", method: "Blend", tip: "Start with a small scoop of ice and blend in more until smooth and pourable. A few drops of lime can add brightness.",
    ingredients: [["50 ml", "White rum"], ["30 ml", "Coconut cream"], ["50 ml", "Fresh pineapple juice"]],
    steps: ["Pour rum, coconut cream and pineapple juice into a blender with ice.", "Blend until smooth and pour into a large glass.", "Garnish with a pineapple slice and a cocktail cherry. Serve with a straw."],
  },
  {
    id: "whiskey-sour", name: "Whiskey Sour", spirit: "Bourbon", mood: "Lemon · Balanced · Smooth",
    source: { name: "IBA", url: "https://iba-world.com/iba-cocktail/whiskey-sour/" },
    description: "Bourbon and lemon balanced with syrup in a timeless sour.", glass: "Rocks", method: "Shake", tip: "Egg white is optional; use pasteurised egg white if including it. Shake harder to build a light foam.",
    ingredients: [["45 ml", "Bourbon whiskey"], ["25 ml", "Fresh lemon juice"], ["20 ml", "Sugar syrup"], ["A few drops", "Pasteurised egg white, optional"]],
    steps: ["Pour bourbon, lemon, syrup and optional egg white into a shaker with ice.", "Shake well, working a little harder if using egg white.", "Strain over ice in a rocks glass. Garnish with half an orange slice and a cocktail cherry."],
  },
  {
    id: "dry-martini", name: "Dry Martini", spirit: "Gin", mood: "Dry · Botanical · Crisp",
    source: { name: "IBA", url: "https://iba-world.com/iba-cocktail/dry-martini/" },
    description: "Gin and dry vermouth, stirred cold and served with quiet precision.", glass: "Martini", method: "Stir", tip: "Chill the glass first. Choose lemon oils for a citrus finish, or a green olive for a savoury one.",
    ingredients: [["60 ml", "Gin"], ["10 ml", "Dry vermouth"], ["To garnish", "Lemon peel or green olive"]],
    steps: ["Combine gin and dry vermouth in a mixing glass with ice.", "Stir until thoroughly chilled, then strain into a cold martini glass.", "Express lemon peel over the surface, or garnish with a green olive."],
  },
  {
    id: "ten-thirty-am", name: "10:30AM", spirit: "Soju", source: mamaDiam, image: "/assets/cocktails/ten-thirty-am.png",
    mood: "Grape · Tea · Citrus", description: "Grape soju and jasmine tea with a bright yuzu-and-lime lift.", glass: "Rocks", method: "Shake",
    ingredients: [["60 ml", "Chuga grape soju"], ["40 ml", "Jasmine tea, cooled"], ["10 ml", "Fresh lime juice"], ["15 ml", "Yuzu cordial"]],
    steps: ["Brew jasmine tea and let it cool completely.", "Add the tea, grape soju, lime and yuzu cordial to a shaker with ice.", "Shake briefly and strain over fresh ice in a rocks glass."],
    tip: "Yuzu cordial is a home substitute for the menu’s citron yuzu component. Adjust it to the sweetness of your soju.",
  },
  {
    id: "after-school-slushie", name: "After School Slushie", spirit: "Tequila", source: mamaDiam, image: "/assets/cocktails/after-school-slushie.png",
    mood: "Blackcurrant · Peach · Icy", description: "A frozen tequila drink with Ribena, peach and lemon.", glass: "Tall glass", method: "Blend",
    ingredients: [["40 ml", "Blanco tequila"], ["15 ml", "Cointreau"], ["15 ml", "Ribena concentrate"], ["30 ml", "Peach purée"], ["20 ml", "Lemon juice"], ["1 small cup", "Ice"]],
    steps: ["Add all ingredients and the ice to a blender.", "Blend until smooth, adding a little more ice if needed for a slushie texture.", "Pour into a chilled tall glass and serve with a straw."],
    tip: "Use Ribena concentrate rather than ready-to-drink juice; reduce the amount if your peach purée is already sweetened.",
  },
  {
    id: "the-milo-truck", name: "The Milo Truck", spirit: "Rum", source: mamaDiam, image: "/assets/cocktails/the-milo-truck.png",
    mood: "Malt · Chocolate · Rose", description: "Spiced rum, hazelnut and Milo beneath a rose-milk cream cap.", glass: "Rocks", method: "Shake & float",
    ingredients: [["40 ml", "Spiced rum"], ["15 ml", "Frangelico"], ["25 ml", "Milo syrup (see bar note)"], ["5 g", "Dark chocolate, melted and cooled"], ["20 ml", "Cream"], ["5 ml", "Rose syrup"]],
    steps: ["Whisk the cream and rose syrup until thick but pourable; set aside.", "Shake rum, Frangelico, Milo syrup and melted chocolate with ice until well chilled.", "Double strain over fresh ice. Float the rose cream over a spoon."],
    tip: "For Milo syrup, stir 20 g Milo and 10 g sugar into 30 ml hot water; cool. Rose cream replaces the menu’s Bandung foam. Contains hazelnuts and dairy.",
  },
  {
    id: "mum-said-youre-heaty", name: "Mum Said You’re Heaty", spirit: "Gin", source: mamaDiam, image: "/assets/cocktails/mum-said-youre-heaty.png",
    mood: "Herbal · Plum · Bittersweet", description: "Salted plum gin and cooling herbal tea, lifted with tonic.", glass: "Highball", method: "Build",
    ingredients: [["30 ml", "Peddlers Salted Plum gin liqueur"], ["15 ml", "Noilly Prat dry vermouth"], ["10 ml", "Cynar"], ["5 ml", "Luxardo Maraschino"], ["45 ml", "Jia Jia herbal tea, chilled"], ["60 ml", "Tonic water"]],
    steps: ["Fill a highball glass with ice. Add the gin liqueur, vermouth, Cynar and maraschino.", "Pour in the chilled herbal tea and stir gently.", "Top with tonic and give the drink one gentle lift with a spoon."],
    tip: "The salted plum gin is a liqueur, so start without extra sugar. Chill the tea and tonic before building the drink.",
  },
  {
    id: "ah-gongs-kopi", name: "Ah Gong’s Kopi", spirit: "Scotch", source: mamaDiam, image: "/assets/cocktails/ah-gongs-kopi.png",
    mood: "Coffee · Coconut · Rich", description: "Whisky and strong kopi softened with coconut and milk.", glass: "Rocks", method: "Shake",
    ingredients: [["40 ml", "Blended Scotch"], ["25 ml", "Strong kopi, cooled"], ["15 ml", "Demerara syrup (1:1)"], ["20 ml", "Milk"], ["10 ml", "Coconut cream"], ["2 dashes", "Chocolate bitters"]],
    steps: ["Combine the cooled kopi, syrup, milk and coconut cream in a shaker.", "Add whisky, bitters and ice. Shake hard until cold.", "Double strain over a large cube in a rocks glass."],
    tip: "This simple home version uses coffee and coconut cream instead of the menu’s kopi reduction, butter-washed whisky and coconut-washed milk.",
  },
  {
    id: "last-teh-tarik", name: "Last Teh Tarik", spirit: "Japanese whisky", source: mamaDiam, image: "/assets/cocktails/last-teh-tarik.png",
    mood: "Chai · Caramel · Toasted", description: "Whisky-spiked chai milk tea with caramel and a popcorn finish.", glass: "Rocks", method: "Shake",
    ingredients: [["40 ml", "Japanese whisky"], ["60 ml", "Chai milk tea, cooled"], ["10 ml", "Caramel syrup"], ["2 dashes", "Chocolate bitters"], ["A few pieces", "Plain popcorn, to garnish"]],
    steps: ["Brew strong chai, add milk to taste, and cool completely.", "Shake the chai milk tea, whisky, caramel syrup and bitters with ice.", "Strain over fresh ice. Serve with a little popcorn on the side."],
    tip: "Popcorn is a garnish in this home version; the menu doesn’t publish its popcorn preparation. Reduce caramel if using sweetened milk tea.",
  },
  {
    id: "sng-bao", name: "Sng Bao", spirit: "Aperol / Prosecco", source: mamaDiam, image: "/assets/cocktails/sng-bao.png",
    mood: "Watermelon · Guava · Sparkling", description: "A fruity Aperol spritz with watermelon and pink guava.", glass: "Wine glass", method: "Build",
    ingredients: [["30 ml", "Aperol"], ["30 ml", "Watermelon juice"], ["30 ml", "Pink guava juice"], ["10 ml", "Fresh lime juice"], ["60 ml", "Prosecco"], ["30 ml", "Soda water"]],
    steps: ["Fill a wine glass with ice. Add Aperol and the watermelon, guava and lime juices.", "Pour in chilled Prosecco and soda water.", "Stir gently once and garnish with a small watermelon wedge."],
    tip: "Use fresh strained watermelon juice for a lighter texture. Add Prosecco last and never shake it.",
  },
  {
    id: "lepak-lepak", name: "Lepak Lepak", spirit: "Brandy", source: mamaDiam, image: "/assets/cocktails/lepak-lepak.png",
    mood: "Almond · Tea · Mellow", description: "Brandy, wintermelon and almond liqueur in a relaxed tea highball.", glass: "Highball", method: "Build",
    ingredients: [["30 ml", "St-Rémy brandy"], ["10 ml", "Disaronno"], ["15 ml", "Punt e Mes"], ["15 ml", "Wintermelon syrup"], ["45 ml", "Jasmine tea, cooled"], ["2 dashes", "Chocolate bitters"], ["60 ml", "Soda water"]],
    steps: ["Fill a highball glass with ice and add brandy, Disaronno, Punt e Mes and wintermelon syrup.", "Pour in the cooled tea and bitters. Stir briefly.", "Top with chilled soda and lift gently once to combine."],
    tip: "Wintermelon syrup is sold for bubble tea. Start with less if your brand is very concentrated.",
  },
  {
    id: "laksa-ritual", name: "Laksa Ritual", spirit: "Vodka", source: mamaDiam, image: "/assets/cocktails/laksa-ritual.png",
    mood: "Savoury · Coconut · Spiced", description: "Laksa-spiced vodka with tomato and a soft coconut finish.", glass: "Rocks", method: "Shake",
    ingredients: [["40 ml", "Vodka"], ["¼ tsp", "Dry laksa spice mix"], ["50 ml", "Tomato juice"], ["20 ml", "Milk"], ["10 ml", "Coconut cream"], ["2 drops", "Fish sauce"]],
    steps: ["Steep the dry laksa spices in vodka for 15 minutes, then strain through a coffee filter.", "Shake the infused vodka, tomato juice, milk, coconut cream and fish sauce with ice.", "Double strain over fresh ice in a rocks glass."],
    tip: "An unclarified home version, without the bar’s coconut washing. Use dry spices, not oily laksa paste. Contains fish and dairy; spice mixes may contain shellfish.",
  },
  {
    id: "peranakan-negroni", name: "Peranakan Negroni", spirit: "Gin", source: mamaDiam, image: "/assets/cocktails/peranakan-negroni.png",
    mood: "Bitter · Kaya · Creamy", description: "Gin and Campari with a kaya-inspired creamy finish.", glass: "Rocks", method: "Shake",
    ingredients: [["30 ml", "Gin"], ["25 ml", "Campari"], ["20 ml", "Noilly Prat dry vermouth"], ["1 tsp", "Kaya"], ["20 ml", "Milk"]],
    steps: ["Stir the kaya and milk together in a shaker until smooth.", "Add gin, Campari, vermouth and ice. Shake until cold.", "Double strain over a large ice cube in a rocks glass."],
    tip: "This creamy shortcut replaces the menu’s clarified kaya milk punch, so its appearance differs. Kaya commonly contains egg and coconut.",
  },
  {
    id: "green-mango-highball", name: "Green Mango Highball", spirit: "Gin", source: mamaDiam, image: "/assets/cocktails/green-mango-highball.png",
    mood: "Green mango · Dry · Bubbly", description: "A crisp gin highball with tart green mango and soda.", glass: "Highball", method: "Build",
    ingredients: [["45 ml", "Gin"], ["30 ml", "Fresh green mango juice"], ["90 ml", "Soda water"]],
    steps: ["Press grated peeled green mango through a fine sieve to collect the juice.", "Fill a highball glass with ice. Add gin and the strained mango juice.", "Top with chilled soda and stir gently once."],
    tip: "Fresh strained juice replaces the bar’s clarified mango water. It will look cloudier; add a little simple syrup if the fruit is very tart.",
  },
  {
    id: "cheng-tng", name: "Cheng Tng", spirit: "Whisky", source: mamaDiam, image: "/assets/cocktails/cheng-tng.png",
    mood: "Chrysanthemum · Lychee · Light", description: "Floral whisky and lychee in a sparkling dessert-inspired highball.", glass: "Highball", method: "Build",
    ingredients: [["40 ml", "Blended whisky"], ["1 tsp", "Dried chrysanthemum flowers"], ["20 ml", "Lychee syrup from a can"], ["15 ml", "Noilly Prat dry vermouth"], ["90 ml", "Soda water"], ["1", "Lychee, to garnish"]],
    steps: ["Steep food-grade dried chrysanthemum in the whisky for 15 minutes, then fine strain.", "Pour the infused whisky, lychee syrup and vermouth over ice in a highball glass.", "Top with chilled soda, stir gently, and add a lychee."],
    tip: "Taste the chrysanthemum infusion early and strain sooner if it becomes bitter. The lychee syrup provides the sweetness in this home version.",
  },

  {
    id: "sifr-fizz", name: "Sifr Fizz", spirit: "Vodka", source: moBar, image: "/assets/cocktails/sifr-fizz.jpg", imagePosition: "right center",
    mood: "Floral · Saffron · Sparkling", description: "Vodka and elderflower with a fragrant saffron lift.", glass: "Highball", method: "Build",
    ingredients: [["40 ml", "Vodka"], ["15 ml", "St-Germain"], ["15 ml", "Saffron syrup"], ["5 ml", "Food-grade orange blossom water"], ["90 ml", "Soda water"]],
    steps: ["Fill a highball glass with ice and add vodka, St-Germain and saffron syrup.", "Add the orange blossom water and stir briefly.", "Top with chilled soda and lift gently once to combine."],
    tip: "For syrup, steep 2 saffron threads in 30 ml hot water, dissolve 30 g sugar, then cool. Food-grade blossom water substitutes for Sifr’s bespoke hydrosol; no perfume.",
  },
  {
    id: "forest-fire", name: "Forest Fire", spirit: "Scotch", source: moBar, image: "/assets/cocktails/forest-fire.jpg", imagePosition: "right center",
    mood: "Smoky · Spiced · Deep", description: "Blended Scotch and mezcal with smoky tea and warming spice.", glass: "Rocks", method: "Stir",
    ingredients: [["35 ml", "Blended Scotch"], ["10 ml", "Mezcal"], ["15 ml", "Amaro"], ["10 ml", "Strong lapsang souchong, cooled"], ["5 ml", "Clove-nutmeg syrup"]],
    steps: ["Add all ingredients to a mixing glass filled with ice.", "Stir for 20–30 seconds until cold and lightly diluted.", "Strain over a large ice cube in a rocks glass."],
    tip: "Steep 1 clove and a pinch of nutmeg in 30 ml hot water; strain, add 30 g sugar and cool. Amaro plus this syrup replaces the bar’s Pala & Cengkeh Amaro.",
  },
  {
    id: "velour-kiss", name: "Velour Kiss", spirit: "Gin", source: moBar, image: "/assets/cocktails/velour-kiss.jpg", imagePosition: "right center",
    mood: "Chamomile · Citrus · Silky", description: "Gin and chamomile with lemon and a delicate olive-oil texture.", glass: "Highball", method: "Shake",
    ingredients: [["45 ml", "Gin"], ["30 ml", "Chamomile tea, cooled"], ["20 ml", "Lemon juice"], ["15 ml", "Honey syrup (1:1)"], ["3 drops", "Extra-virgin olive oil"], ["Optional", "Food-grade bee pollen"]],
    steps: ["Add gin, cooled chamomile tea, lemon, honey syrup and olive oil to a shaker with ice.", "Shake hard for 15 seconds to disperse the oil.", "Strain over fresh ice in a highball glass. Add a small pinch of bee pollen if desired."],
    tip: "Honey syrup replaces the menu’s bee-pollen preparation. Bee pollen is optional; omit it if sensitive to bee products.",
  },
  {
    id: "the-artis", name: "The Artis", spirit: "Non-alcoholic", source: moBar, image: "/assets/cocktails/the-artis.jpg", imagePosition: "right center",
    mood: "Banana · Pandan · Tangy", description: "Banana and pandan with rice tea, coconut and a little tang.", glass: "Wine glass", method: "Shake & top",
    ingredients: [["25 ml", "Banana purée"], ["15 ml", "Pandan syrup"], ["30 ml", "Roasted rice tea, cooled"], ["10 ml", "Lime juice"], ["60 ml", "Soda water"], ["1 pinch", "Coconut salt"]],
    steps: ["Shake banana purée, pandan syrup, rice tea, lime and coconut salt with ice.", "Double strain over fresh ice in a wine glass.", "Top with soda and stir gently once."],
    tip: "A non-fermented shortcut to the menu’s banana tibicos and umami bitter. The menu also offers a vodka version; optionally add 30 ml vodka at home.",
  },
  {
    id: "bukit-kemas", name: "Bukit Kemas", spirit: "Baijiu", source: moBar, image: "/assets/cocktails/bukit-kemas.jpg", imagePosition: "right center",
    mood: "Corn · Floral · Aromatic", description: "Baijiu and Lillet Blanc with lotus tea and roasted corn.", glass: "Coupe", method: "Stir",
    ingredients: [["30 ml", "Baijiu"], ["25 ml", "Lillet Blanc"], ["15 ml", "Food-grade lotus tea, cooled"], ["10 ml", "Roasted corn syrup"]],
    steps: ["Add baijiu, Lillet Blanc, lotus tea and corn syrup to a mixing glass with ice.", "Stir until well chilled and lightly diluted.", "Strain into a chilled coupe. Garnish with a few roasted corn kernels on a pick."],
    tip: "For corn syrup, steep 20 g roasted corn in 40 ml hot water; strain, dissolve in 40 g sugar and cool. Lotus tea substitutes for the bar’s infused Lillet.",
  },
  {
    id: "kopi-pumptini", name: "Kopi Pumptini", spirit: "Bourbon", source: moBar, image: "/assets/cocktails/kopi-pumptini.jpg", imagePosition: "right center",
    mood: "Coffee · Pumpkin · Toasted", description: "Bourbon, kopi-o and pumpkin with a toasted-barley note.", glass: "Coupe", method: "Shake",
    ingredients: [["40 ml", "Bourbon"], ["30 ml", "Strong kopi-o, cooled"], ["15 ml", "Plain cooked pumpkin purée"], ["15 ml", "Roasted barley syrup"]],
    steps: ["Add bourbon, cooled kopi-o, pumpkin purée and barley syrup to a shaker with ice.", "Shake hard for 20 seconds to combine the pumpkin and coffee.", "Double strain into a chilled coupe."],
    tip: "Make equal-weight sugar syrup using brewed roasted barley tea instead of water. It replaces the bar’s roasted-barley bourbon preparation.",
  },
  {
    id: "bean-to-bar", name: "B.T.B (Bean to Bar)", spirit: "Bourbon", source: moBar, image: "/assets/cocktails/bean-to-bar.jpg", imagePosition: "right center",
    mood: "Cacao · Tangy · Bright", description: "Bourbon and kombucha with wolfberry and a dark-chocolate finish.", glass: "Wine glass", method: "Build",
    ingredients: [["40 ml", "Bourbon"], ["90 ml", "Plain kombucha, chilled"], ["15 ml", "Wolfberry syrup"], ["2 dashes", "Chocolate bitters"], ["1 piece", "Dark chocolate, to garnish"]],
    steps: ["Add bourbon, wolfberry syrup and chocolate bitters to an ice-filled wine glass.", "Top with chilled kombucha and stir gently.", "Serve with a small piece of dark chocolate on the side."],
    tip: "Steep 10 g dried goji berries in 30 ml hot water; strain, dissolve 30 g sugar and cool. Plain kombucha and bitters replace the bar’s cacao-nib kombucha.",
  },
  {
    id: "dopa-dopa", name: "Dopa? Dopa!", spirit: "Cognac", source: moBar, image: "/assets/cocktails/dopa-dopa.jpg", imagePosition: "right center",
    mood: "Pistachio · Tea · Creamy", description: "Cognac and Darjeeling with a rich pistachio-cream finish.", glass: "Coupe", method: "Shake",
    ingredients: [["40 ml", "Cognac VSOP"], ["25 ml", "Darjeeling tea, cooled"], ["20 ml", "Cream"], ["15 ml", "Pistachio syrup"], ["1 pinch", "Salt"]],
    steps: ["Add cognac, cooled tea, cream, pistachio syrup and salt to a shaker with ice.", "Shake hard for 15 seconds until cold and smooth.", "Double strain into a chilled coupe. Serve with a small piece of kunafa if available."],
    tip: "This shortcut omits butter washing and the bar’s cheese tuile. Pistachio syrup stands in for the kunafa preparation. Contains nuts and dairy.",
  },
  {
    id: "reclaimed-sling-3", name: "Reclaimed Sling 3.0", spirit: "Gin", source: moBar, image: "/assets/cocktails/reclaimed-sling-3.jpg", imagePosition: "right center",
    mood: "Pineapple · Cherry · Citrus", description: "A home-style Singapore Sling inspired by MO BAR’s reclaimed version.", glass: "Coupe", method: "Shake",
    ingredients: [["30 ml", "Gin"], ["15 ml", "Cherry liqueur"], ["7.5 ml", "Cointreau"], ["7.5 ml", "Bénédictine"], ["60 ml", "Pineapple juice"], ["15 ml", "Lime juice"], ["5 ml", "Grenadine"], ["1 dash", "Angostura bitters"]],
    steps: ["Add all ingredients to a shaker filled with ice.", "Shake hard for 15 seconds, then double strain into a large chilled coupe.", "Serve with a small fruit lollipop on the side, if desired."],
    tip: "The menu lists gin, Singapore Sling and lollipop. This is a conventional Sling-based home interpretation, without the bar’s reclaimed preparation.",
  },
  {
    id: "jo-hwa", name: "Jo-Hwa (和谐)", spirit: "Gin", source: moBar, image: "/assets/cocktails/jo-hwa.jpg", imagePosition: "right center",
    mood: "Pear · Savoury · Delicate", description: "Gin, fino sherry and pear with a subtle savoury mushroom note.", glass: "Coupe", method: "Stir",
    ingredients: [["35 ml", "Gin"], ["15 ml", "Fino sherry"], ["15 ml", "Verjuice"], ["20 ml", "Pear juice"], ["5 ml", "Cooled mushroom tea"]],
    steps: ["Prepare mushroom tea as described in the bar note and cool it completely.", "Stir gin, sherry, verjuice, pear juice and mushroom tea with ice until cold.", "Strain into a chilled coupe. Garnish with a thin pear slice."],
    tip: "Steep 1 g food-grade dried shiitake in 50 ml boiling water for 10 minutes; strain and cool. This substitutes for the menu’s matsutake preparation.",
  },
  {
    id: "jukuleles", name: "Jukuleles", spirit: "Mezcal", source: moBar, image: "/assets/cocktails/jukuleles.jpg", imagePosition: "right center",
    mood: "Smoky · Yuzu · Herbal", description: "Mezcal and yuzu marmalade with tulsi and aromatic bitters.", glass: "Rocks", method: "Shake",
    ingredients: [["40 ml", "Mezcal"], ["20 g", "Yuzu marmalade"], ["20 ml", "Tulsi tea, cooled"], ["15 ml", "Lime juice"], ["2 dashes", "Angostura bitters"]],
    steps: ["Stir the marmalade and cooled tulsi tea together in a shaker to loosen the preserve.", "Add mezcal, lime, bitters and ice. Shake hard for 15 seconds.", "Double strain over fresh ice in a rocks glass. Garnish with a basil leaf."],
    tip: "Tulsi is holy basil; brewed tulsi tea makes a simple substitute for the bar’s herbal preparation. Lime is added for balance in this home recipe.",
  },
  {
    id: "pine-dustry", name: "Pine-Dustry", spirit: "Tequila", source: moBar, image: "/assets/cocktails/pine-dustry.jpg", imagePosition: "right center",
    mood: "Pineapple · Coconut · Smooth", description: "Silver tequila with pineapple, white wine and coconut.", glass: "Coupe", method: "Shake",
    ingredients: [["40 ml", "Silver tequila"], ["30 ml", "Pineapple juice"], ["15 ml", "Dry white wine"], ["15 ml", "Coconut cream"], ["5 ml", "Simple syrup (1:1)"]],
    steps: ["Add all ingredients to a shaker with plenty of ice.", "Shake hard for 15 seconds until the coconut cream is fully combined.", "Double strain into a chilled coupe."],
    tip: "Fresh juice and wine are accessible substitutes for the bar’s cold-distilled pineapple and white-wine reduction. Adjust syrup to your pineapple’s sweetness.",
  },
  {
    id: "mandarin-martini", name: "Mandarin Martini", spirit: "Gin", source: moBar, image: "/assets/cocktails/mo-bar-house-signatures.jpg", imagePosition: "left center",
    mood: "Mandarin · Dry · Botanical", description: "A citrus-led martini with dry vermouth and a caper berry.", glass: "Martini", method: "Stir",
    ingredients: [["50 ml", "Citrus-forward gin"], ["15 ml", "Noilly Prat dry vermouth"], ["2 dashes", "Mandarin bitters"], ["1", "Caper berry"]],
    steps: ["Add gin, vermouth and mandarin bitters to a mixing glass filled with ice.", "Stir for 20–30 seconds until well chilled.", "Strain into a chilled martini glass and garnish with a caper berry."],
    tip: "MO BAR Edition No.1 Gin is the menu’s base. A citrus-forward gin is the home substitute; orange bitters can stand in for mandarin bitters.",
  },
  {
    id: "mo-whiskey-sour", name: "M.O. Whiskey Sour", spirit: "Bourbon", source: moBar, image: "/assets/cocktails/mo-bar-house-signatures.jpg", imagePosition: "right top",
    mood: "Tea · Lemon · Silky", description: "Bourbon and fragrant tea in a lemon sour with a soft foam.", glass: "Coupe", method: "Shake",
    ingredients: [["45 ml", "Bourbon"], ["20 ml", "Fragrant black tea, cooled"], ["20 ml", "Lemon juice"], ["15 ml", "Simple syrup (1:1)"], ["20 ml", "Pasteurised egg white"]],
    steps: ["Shake all ingredients without ice for 15 seconds to build the foam.", "Add ice and shake hard for another 15 seconds.", "Double strain into a chilled coupe and let the foam settle."],
    tip: "Fragrant tea replaces the hotel’s Exceptionally Singapore blend, and egg-white foam stands in for its meringue. Use aquafaba if preferred.",
  },
  {
    id: "oriental-heritage", name: "Oriental Heritage", spirit: "Scotch / Cognac", source: moBar, image: "/assets/cocktails/mo-bar-house-signatures.jpg", imagePosition: "right bottom",
    mood: "Floral · Spiced · Rich", description: "Single malt and cognac with osmanthus and allspice warmth.", glass: "Rocks", method: "Stir",
    ingredients: [["30 ml", "Single malt Scotch"], ["20 ml", "Cognac"], ["10 ml", "Osmanthus syrup"], ["5 ml", "Pimento dram"]],
    steps: ["Combine all ingredients in a mixing glass filled with ice.", "Stir for 20–30 seconds until cold and lightly diluted.", "Strain over a large ice cube in a rocks glass."],
    tip: "For syrup, steep 1 tsp food-grade osmanthus in 30 ml hot water; strain, add 30 g sugar and cool. This replaces the bar’s osmanthus/devilwood preparation.",
  },
];

// Fixed selections from Cat Bite Club's published 2026 menu. Measurements and
// methods below are home adaptations; the rotating Milk Punch has no fixed spec.
const catBiteCocktails: Cocktail[] = [
  {
    id: "puss-in-boot", name: "Puss in Boot", spirit: "Tequila", mood: "Guava · Maple · Soft", description: "Guava and cinnamon soften a blend of blanco and añejo tequila.", glass: "Rocks", method: "Shake",
    ingredients: [["25 ml", "Blanco tequila"], ["20 ml", "Añejo tequila"], ["40 ml", "Guava nectar"], ["10 ml", "Maple syrup"], ["1 pinch", "Ground cinnamon"], ["15 ml", "Whole milk"]],
    steps: ["Shake both tequilas, guava, maple and cinnamon with ice.", "Strain over fresh ice in a rocks glass.", "Gently pour in the milk and stir once. Garnish with a cinnamon stick."],
    tip: "This creamy shortcut replaces the bar’s milk-washed clarification. Use sweetened guava nectar and adjust maple to taste.",
  },
  {
    id: "cat-bite-margarita", name: "Cat Bite Margarita", spirit: "Tequila", mood: "Citrus · Agave · Smoky", description: "A tequila-and-mezcal margarita rounded with a small splash of sherry.", glass: "Rocks", method: "Shake",
    ingredients: [["30 ml", "Blanco tequila"], ["15 ml", "Espadín mezcal"], ["15 ml", "Cointreau"], ["20 ml", "Lime juice"], ["10 ml", "Lemon juice"], ["7.5 ml", "Agave nectar"], ["10 ml", "Dry sherry"]],
    steps: ["Add all ingredients to a shaker with ice.", "Shake hard for 15 seconds until cold.", "Strain over fresh ice into a rocks glass with an optional half-salt rim."],
    tip: "Lime and lemon stand in for the bar’s citrus blend. Start with less agave if you prefer a sharper margarita.",
  },
  {
    id: "thug-passion", name: "Thug Passion", spirit: "Tequila", mood: "Passionfruit · Plum · Tangy", description: "Passionfruit and salted plum meet tequila, gin and bitter herbs.", glass: "Coupe", method: "Shake",
    ingredients: [["30 ml", "Blanco tequila"], ["15 ml", "Gin"], ["10 ml", "Amaro"], ["25 ml", "Passionfruit purée"], ["20 ml", "Lime-lemon juice (equal parts)"], ["10 ml", "Simple syrup (1:1)"], ["½", "Salted dried plum, pitted"], ["3", "Pink peppercorns"]],
    steps: ["Gently muddle the salted plum and peppercorns with the syrup in a shaker.", "Add the remaining ingredients and ice. Shake hard for 15 seconds.", "Double strain into a chilled coupe."],
    tip: "Use a small piece of hua mei; its salt and sweetness vary. The simple syrup is a home adjustment for tart passionfruit.",
  },
  {
    id: "get-the-msg", name: "Get the MSG?", spirit: "Mezcal", mood: "Tomato · Chilli · Savoury", description: "Smoky mezcal, tomato and peach with peppery heat and a beer cap.", glass: "Highball", method: "Shake / top",
    ingredients: [["40 ml", "Cupreata mezcal"], ["30 ml", "Tomato juice"], ["15 ml", "Peach nectar"], ["15 ml", "Lime-lemon juice (equal parts)"], ["10 ml", "Amaro"], ["2 drops", "Peanut chilli oil"], ["1 small pinch each", "Crushed Sichuan pepper & MSG"], ["30 ml", "Lager"]],
    steps: ["Shake everything except the lager with ice for 15 seconds.", "Double strain into an ice-filled highball glass.", "Slowly top with lager and garnish with a cherry tomato."],
    tip: "A trace of chilli oil and tomato juice replace the bar’s oil wash and cordial. Contains peanut; use peanut-free chilli oil if needed.",
  },
  {
    id: "dill-wit-it", name: "Dill Wit It", spirit: "Tequila", mood: "Dill · Pear · Botanical", description: "Reposado tequila and sotol with fresh garden herbs and pear.", glass: "Coupe", method: "Stir",
    ingredients: [["30 ml", "Reposado tequila"], ["15 ml", "Sotol"], ["15 ml", "Dry vermouth"], ["10 ml", "Pear juice"], ["1 small sprig", "Dill"], ["1 thin slice", "Celery"], ["1 strip", "Bergamot or lemon peel"]],
    steps: ["Gently press the dill, celery and peel in a mixing glass.", "Add the liquids and ice. Stir for 20 seconds.", "Fine strain into a chilled coupe and garnish with dill."],
    tip: "Fresh herbs and juice replace the bar’s botanical preparations. Lemon peel is an accessible substitute for bergamot.",
  },
  {
    id: "smoking-apple", name: "Smoking Apple", spirit: "Mezcal", mood: "Apple · Smoke · Rich", description: "Two mezcals and apple brandy in a rich, spiced stirred drink.", glass: "Rocks", method: "Stir",
    ingredients: [["20 ml", "Tobalá mezcal"], ["20 ml", "Espadín mezcal"], ["15 ml", "Calvados"], ["15 ml", "Sweet vermouth"], ["1 tsp", "Apple butter"], ["2 dashes", "Peychaud’s bitters"]],
    steps: ["Stir the apple butter with the spirits until loosened.", "Add vermouth, bitters and ice. Stir until cold.", "Fine strain over a large ice cube in a rocks glass."],
    tip: "This home version is unclarified. Smooth apple purée with a pinch of cinnamon can replace apple butter.",
  },
  {
    id: "gourdy-fizz", name: "Gourdy Fizz", spirit: "Sake", mood: "Papaya · Orange · Fizzy", description: "A light sake fizz with papaya, bitter herbs and salted orange.", glass: "Highball", method: "Build",
    ingredients: [["60 ml", "Ginjo sake"], ["20 ml", "Papaya shrub"], ["10 ml", "Amaro"], ["15 ml", "Lime-lemon juice (equal parts)"], ["10 ml", "Orange juice"], ["1 small pinch", "Salt"], ["60 ml", "Soda water"]],
    steps: ["Stir everything except soda in a highball glass.", "Fill with ice and slowly add the soda.", "Lift gently with a bar spoon and garnish with orange peel."],
    tip: "For a quick shrub, blend 20 g papaya with 10 g sugar and 10 ml apple cider vinegar; strain. Soda replaces forced carbonation.",
  },
  {
    id: "soju-sprint", name: "Soju Sprint", spirit: "Soju", mood: "Peach · Honey · Crisp", description: "A peach-and-honey soju highball with sherry and a hint of anise.", glass: "Highball", method: "Build",
    ingredients: [["45 ml", "Distilled soju, about 40% ABV"], ["15 ml", "Amontillado sherry"], ["20 ml", "Peach nectar"], ["10 ml", "Honey syrup (1:1)"], ["20 ml", "Lime-lemon juice (equal parts)"], ["2 drops", "Absinthe"], ["60 ml", "Soda water"]],
    steps: ["Stir all ingredients except soda in a chilled highball glass.", "Add ice and top with soda.", "Stir gently once and garnish with a peach slice."],
    tip: "The menu uses Tokki Black, a distilled soju. Lower-strength flavoured soju produces a much lighter drink.",
  },
  {
    id: "velvet-bloom", name: "Velvet Bloom", spirit: "Shochu", mood: "Goji · Chestnut · Floral", description: "Barley shochu and sherry with dried fruit, chestnut and osmanthus.", glass: "Coupe", method: "Stir",
    ingredients: [["40 ml", "Barley shochu"], ["15 ml", "Palo Cortado sherry"], ["10 ml", "Sweet vermouth"], ["7.5 ml", "Osmanthus syrup"], ["½ tsp", "Sweet chestnut purée"], ["3", "Goji berries"], ["2 dashes", "Plum bitters"]],
    steps: ["Soak the goji berries in the shochu for 10 minutes, then strain.", "Stir the infused shochu with chestnut purée, remaining ingredients and ice.", "Fine strain into a chilled coupe."],
    tip: "For syrup, steep food-grade osmanthus in hot water, strain and dissolve an equal weight of sugar. This home version is unclarified.",
  },
  {
    id: "ube-noir", name: "Ube Noir", spirit: "Baijiu", mood: "Ube · Sesame · Floral", description: "Baijiu and aged rum beneath a creamy purple layer of ube and coconut.", glass: "Rocks", method: "Shake",
    ingredients: [["20 ml", "Luzhou Laojiao baijiu"], ["25 ml", "Aged rum"], ["25 ml", "Coconut cream"], ["15 g", "Ube jam"], ["½ tsp", "Black sesame paste"], ["10 ml", "Amontillado sherry"], ["10 ml", "Aperol"], ["1 drop", "Rose water"]],
    steps: ["Whisk ube jam, sesame paste and coconut cream together in a shaker.", "Add the remaining ingredients and ice. Shake hard for 15 seconds.", "Strain over fresh ice in a rocks glass."],
    tip: "Ube jam and coconut cream are home substitutes for the bar’s cream. Contains sesame; add rose water sparingly.",
  },
  {
    id: "snow-bunny", name: "Snow Bunny", spirit: "Shochu", mood: "Snow pea · Nutty · Crisp", description: "Shochu and Scotch with sweet sherry, sunflower and a tonic finish.", glass: "Highball", method: "Shake / top",
    ingredients: [["35 ml", "Cask-aged shochu"], ["15 ml", "Blended Scotch"], ["10 ml", "PX sherry"], ["15 ml", "Sunflower seed syrup"], ["20 ml", "Lime-lemon juice (equal parts)"], ["2", "Snow peas, chopped"], ["2 dashes", "Chocolate bitters"], ["45 ml", "Tonic water"]],
    steps: ["Gently muddle the snow peas in a shaker. Add everything except tonic.", "Shake with ice for 15 seconds and double strain into an ice-filled highball.", "Top with tonic and stir gently."],
    tip: "Blend 10 g toasted sunflower seeds with 20 ml simple syrup and strain for a quick nut syrup. Use barley or sweet-potato shochu.",
  },
  {
    id: "straight-outta-scallion", name: "Straight Outta Scallion", spirit: "Koji spirit", mood: "Garlic · Scallion · Umami", description: "Koji spirit in a savoury stirred cocktail with walnut and herbal liqueur.", glass: "Rocks", method: "Stir",
    ingredients: [["45 ml", "Tumugi koji spirit"], ["10 ml", "Green walnut liqueur (nocino)"], ["7.5 ml", "Drambuie"], ["¼ clove", "Black garlic"], ["2 drops", "Scallion oil"], ["2 dashes", "Lime bitters"]],
    steps: ["Mash the black garlic with the liqueurs in a mixing glass.", "Add koji spirit, scallion oil, bitters and ice. Stir for 20 seconds.", "Fine strain over a large ice cube in a rocks glass."],
    tip: "Small amounts of garlic and oil give a home shortcut to the bar’s savoury preparations. Nocino contains walnut.",
  },
  {
    id: "cat-bite-new-york-sour", name: "New York Sour", spirit: "Bourbon", mood: "Cherry · Lemon · Silky", description: "A bourbon sour with a floating layer of cherry wine.", glass: "Rocks", method: "Shake / float",
    ingredients: [["45 ml", "Bourbon"], ["25 ml", "Lemon juice"], ["15 ml", "Simple syrup (1:1)"], ["15 ml", "Aquafaba"], ["15 ml", "Ratafia Rossi cherry wine"]],
    steps: ["Shake bourbon, lemon, syrup and aquafaba without ice for 15 seconds.", "Add ice, shake again and strain over fresh ice in a rocks glass.", "Slowly pour the cherry wine over the back of a spoon to float it."],
    tip: "Lemon and syrup replace lemon cordial and citrus blend; aquafaba replaces Wonderfoam. Red wine can replace cherry wine.",
  },
  {
    id: "cat-bite-zombie", name: "Zombie", spirit: "Rum", mood: "Tropical · Herbal · Spiced", description: "Three rums, plum wine and citrus in a tropical long drink.", glass: "Highball", method: "Shake",
    ingredients: [["20 ml each", "Aged rum, overproof Jamaican rum & white rum"], ["15 ml", "Umeshu"], ["10 ml", "Falernum"], ["5 ml", "Grenadine"], ["20 ml", "Lime-lemon juice (equal parts)"], ["20 ml", "Grapefruit juice"], ["2 drops", "Absinthe"]],
    steps: ["Add all ingredients to a shaker with crushed ice.", "Shake briefly for 5 seconds and pour into a tall glass.", "Top up with crushed ice and garnish with mint."],
    tip: "This is Cat Bite Club’s plum-wine variation, adapted for home. Measure the overproof rum carefully; no flame garnish is needed.",
  },
  {
    id: "cat-bite-gin-gin-mule", name: "Gin Gin Mule", spirit: "Gin", mood: "Ginger · Mint · Citrus", description: "Gin and fresh mint with bright citrus and a ginger fizz.", glass: "Highball", method: "Shake / top",
    ingredients: [["45 ml", "Gin"], ["20 ml", "Lime-lemon juice (equal parts)"], ["10 ml", "Simple syrup (1:1)"], ["8 leaves", "Mint"], ["2 dashes", "Aromatic bitters"], ["75 ml", "Ginger beer"]],
    steps: ["Gently press mint with citrus and syrup in a shaker.", "Add gin, bitters and ice. Shake briefly and fine strain into an ice-filled highball.", "Top with ginger beer and garnish with mint."],
    tip: "Ginger beer is the home shortcut for the menu’s ginger preparation. Reduce syrup if your ginger beer is sweet.",
  },
  {
    id: "cat-bite-alaska", name: "Alaska", spirit: "Gin", mood: "Melon · Herbs · Dry", description: "Melon-infused gin and Italian herbs with two vermouths and fino sherry.", glass: "Coupe", method: "Stir",
    ingredients: [["40 ml", "Gin"], ["20 g", "Ripe melon, diced"], ["10 ml", "Bianco vermouth"], ["10 ml", "Strega"], ["10 ml", "Fino sherry"], ["5 ml", "Dry vermouth"], ["2 dashes", "Orange bitters"]],
    steps: ["Infuse the melon in gin for 30 minutes in the fridge, then fine strain.", "Stir the infused gin and remaining ingredients with ice for 20 seconds.", "Strain into a chilled coupe and garnish with lemon peel."],
    tip: "This is the bar’s melon-and-sherry variation rather than the classic Alaska formula. Use ripe melon for a short home infusion.",
  },
  {
    id: "cat-bite-espresso-martini", name: "Espresso Martini", spirit: "Vodka", mood: "Coffee · Bitter · Smooth", description: "A dry coffee martini sharpened with aromatic bitters and salt.", glass: "Coupe", method: "Shake",
    ingredients: [["40 ml", "Vodka"], ["25 ml", "Mr Black coffee liqueur"], ["25 ml", "Espresso, cooled"], ["2 dashes", "Aromatic bitters"], ["1 tiny pinch", "Salt"], ["5 ml", "Simple syrup, optional"]],
    steps: ["Add all ingredients to a shaker with plenty of ice.", "Shake hard for 15 seconds to build a coffee foam.", "Double strain into a chilled coupe and garnish with coffee beans."],
    tip: "Fresh espresso is a home addition for foam; the menu lists coffee liqueur. Add syrup only if needed for balance.",
  },
  {
    id: "ghosteen", name: "Ghosteen", spirit: "Mezcal", mood: "Mangosteen · Smoke · Heat", description: "A smoky mangosteen sour with a small flash of chilli.", glass: "Rocks", method: "Shake",
    ingredients: [["30 ml", "Espadín mezcal"], ["15 ml", "Salmiana mezcal"], ["30 g", "Mangosteen flesh, seeds removed"], ["10 ml", "Amaro"], ["20 ml", "Lime-lemon juice (equal parts)"], ["10 ml", "Simple syrup (1:1)"], ["1 thin slice", "Fresh chilli"]],
    steps: ["Muddle the mangosteen and chilli with syrup in a shaker.", "Add the remaining ingredients and ice. Shake hard for 15 seconds.", "Double strain over fresh ice into a rocks glass."],
    tip: "Fresh chilli replaces the bar’s tincture. Start with a tiny slice and adjust; canned mangosteen should be drained first.",
  },
  {
    id: "grape-escape", name: "Grape Escape", spirit: "Soju", mood: "Grape · Floral · Sparkling", description: "Soju, gin and grape shrub with elderflower and sparkling sake.", glass: "Highball", method: "Build",
    ingredients: [["30 ml", "Distilled soju"], ["15 ml", "Gin"], ["20 ml", "Grape shrub"], ["10 ml", "Elderflower liqueur"], ["5 ml", "Gentian liqueur"], ["5 ml", "Amaro"], ["15 ml", "Lime-lemon juice (equal parts)"], ["60 ml", "Sparkling sake"]],
    steps: ["Stir everything except sparkling sake in a highball glass.", "Add ice and slowly top with the sake.", "Stir gently once and garnish with grapes."],
    tip: "For a quick shrub, mix 15 ml grape juice, 5 ml apple cider vinegar and 5 g sugar. Chill the sparkling sake before pouring.",
  },
  {
    id: "meow-now-brown-cow", name: "Meow Now Brown Cow", spirit: "Tequila", mood: "Coffee · Banana · Cream", description: "Añejo tequila and coffee with banana, sherry and vanilla cream.", glass: "Rocks", method: "Shake",
    ingredients: [["35 ml", "Añejo tequila"], ["20 ml", "Mr Black coffee liqueur"], ["15 ml", "Banana syrup"], ["10 ml", "Dry sherry"], ["25 ml", "Single cream"], ["2 drops", "Vanilla extract"], ["2 dashes", "Aromatic bitters"], ["1 tiny pinch", "Salt"]],
    steps: ["Add all ingredients to a shaker with ice.", "Shake hard for 15 seconds to combine the cream.", "Strain over a large ice cube into a rocks glass."],
    tip: "Banana syrup replaces the bar’s cordial; vanilla extract flavours the cream. For a quick syrup, mash banana into simple syrup and strain.",
  },
  {
    id: "24karrot", name: "24Karrot", spirit: "Soju", mood: "Carrot · Pecan · Bright", description: "Golden soju and baijiu with carrot, nuts and bitter orange.", glass: "Coupe", method: "Shake",
    ingredients: [["30 ml", "Tokki Gold soju"], ["10 ml", "Moutai Yingbin baijiu"], ["5 ml", "Kirsch"], ["15 ml", "Pecan syrup"], ["30 ml", "Carrot juice"], ["10 ml", "Bitter orange liqueur"], ["20 ml", "Lime-lemon juice (equal parts)"], ["5 ml", "Apple cider vinegar"]],
    steps: ["Add all ingredients to a shaker with plenty of ice.", "Shake hard for 15 seconds until cold.", "Double strain into a chilled coupe and garnish with a carrot ribbon."],
    tip: "For pecan syrup, blend 10 g toasted pecans with 20 ml simple syrup and strain. Bitter orange liqueur is a home substitute for the bar’s preparation.",
  },
];

cocktails.push(...catBiteCocktails.map(drink => ({ ...drink, source: catBite, image: `/assets/cocktails/${drink.id}.svg`, illustration: true })));

export type CocktailSort = "name" | "spirit" | "bar" | "menu";

export function cocktailBar(drink: Pick<Cocktail, "source">) {
  if (drink.source?.name === "IBA") return "Classics (IBA)";
  return drink.source?.name ?? "Jigger & Pony";
}

const cocktailPages = ["cocktail", "ingredients", "method"];

export function cocktailHash(index: number, panel: number) {
  const drink = cocktails[index] ?? cocktails[0];
  const page = cocktailPages[panel];
  return `#${drink.id}${page && panel > 0 ? `/${page}` : ""}`;
}

export function parseCocktailHash(hash: string) {
  const [id, page] = hash.replace(/^#/, "").split("/");
  const index = cocktails.findIndex(drink => drink.id === id);
  if (index < 0) return { index: 0, panel: 0 };
  return { index, panel: Math.max(0, cocktailPages.indexOf(page)) };
}

export function cocktailAlcoholType(drink: Pick<Cocktail, "spirit">) {
  return /whisk(?:e)?y|bourbon|scotch/i.test(drink.spirit) ? "Whisky" : drink.spirit;
}

export function cocktailCategory(drink: Cocktail, sort: CocktailSort) {
  if (sort === "spirit") return cocktailAlcoholType(drink);
  if (sort === "bar" || sort === "menu") return cocktailBar(drink);
  const initial = drink.name.charAt(0).toLocaleUpperCase();
  return /[0-9]/.test(initial) ? "0–9" : initial;
}

export function cocktailCategories(sort: CocktailSort) {
  return [...new Set(cocktails.map(drink => cocktailCategory(drink, sort)))].sort((a, b) => a.localeCompare(b));
}

export function findCocktails(query: string, sort: CocktailSort = "name", categories: readonly string[] = []) {
  const term = query.trim().toLocaleLowerCase();
  const result = cocktails.filter(d => (!categories.length || categories.includes(cocktailCategory(d, sort))) && `${d.name} ${d.spirit} ${d.mood} ${cocktailBar(d)} ${d.ingredients.map(i => i[1]).join(" ")}`.toLocaleLowerCase().includes(term));
  if (sort === "menu") return result;
  return result.sort((a, b) => (sort === "spirit" ? cocktailAlcoholType(a).localeCompare(cocktailAlcoholType(b)) : sort === "bar" ? cocktailBar(a).localeCompare(cocktailBar(b)) : 0) || a.name.localeCompare(b.name));
}

export function swipeAction(dx: number, dy: number): "next" | "previous" | "forward" | "back" | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 45) return null;
  return Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? "next" : "previous") : (dx < 0 ? "forward" : "back");
}
