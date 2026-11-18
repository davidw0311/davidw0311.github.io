export type Cocktail = {
  id: string; name: string; spirit: string; mood: string; description: string;
  glass: string; method: string; ingredients: [string, string][]; steps: string[]; tip: string;
  source?: { name: string; url: string; adaptation?: boolean };
  image?: string;
};

export const cocktailSource = "https://www.jiggerandpony.com/bloom-menu";
export function cocktailPhoto(drink: Cocktail) {
  return drink.image ?? `/assets/cocktails/${drink.id}.${drink.source ? "webp" : "jpg"}`;
}
export const mamaDiamSource = "https://www.mamadiamsg.com/s/MMD_Oct2026Menu_Digital.pdf";
const mamaDiam = { name: "Mama Diam", url: mamaDiamSource, adaptation: true };
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
];

export type CocktailSort = "name" | "spirit" | "menu";

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
