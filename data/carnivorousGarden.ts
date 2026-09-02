export type TaxonNamePart = {
  text: string;
  italic?: boolean;
};

export type GardenPhoto = {
  src: string;
  alt: string;
  placeholder?: boolean;
};

export type CareItem = {
  label: string;
  value: string;
};

export type GardenSource = {
  label: string;
  href: string;
};

export type GardenSpecies = {
  id: string;
  slug: string;
  taxon: TaxonNamePart[];
  commonName: string;
  fact: string;
  identificationNote?: string;
  thumbnail: GardenPhoto;
  photos: GardenPhoto[];
  care: CareItem[];
  sources: GardenSource[];
};

export type GardenGenus = {
  id: string;
  slug: string;
  scientificName: string;
  commonName: string;
  description: string;
  thumbnail?: GardenPhoto;
  coverSpeciesId: string;
  species: GardenSpecies[];
};

const placeholderAlt = (genus: string, plant: string) =>
  `Temporary generated ${genus} reference image for ${plant}; a collection photo will replace it.`;

export const gardenGenera: GardenGenus[] = [
  {
    id: "genus-dionaea",
    slug: "dionaea",
    scientificName: "Dionaea",
    commonName: "Venus flytraps",
    description: "Snap traps built for precise, rapid movement.",
    coverSpeciesId: "dionaea-muscipula",
    species: [
      {
        id: "dionaea-muscipula",
        slug: "dionaea-muscipula",
        taxon: [{ text: "Dionaea muscipula", italic: true }],
        commonName: "Venus flytrap",
        fact: "This species is native only to a small area of coastal North and South Carolina. A trap normally closes after its trigger hairs are touched more than once in quick succession.",
        thumbnail: {
          src: "/assets/garden/dionaea/dionaea-muscipula/thumbnail.webp",
          alt: placeholderAlt("Venus flytrap", "Dionaea muscipula"),
          placeholder: true,
        },
        photos: [
          {
            src: "/assets/garden/dionaea/dionaea-muscipula/thumbnail.webp",
            alt: placeholderAlt("Venus flytrap", "Dionaea muscipula"),
            placeholder: true,
          },
        ],
        care: [
          { label: "Light", value: "Full outdoor sun, ideally 6 or more hours, or a genuinely strong grow light for about 14 hours." },
          { label: "Water", value: "Keep moist in a shallow tray of rain, reverse-osmosis, or distilled water. Keep the crown above the water line." },
          { label: "Substrate", value: "Unfertilized sphagnum peat and washed silica sand, roughly 1:1, or pure long-fiber sphagnum." },
          { label: "Temperature", value: "About 20-32°C during active growth." },
          { label: "Season", value: "A cool 3-4 month winter rest around 0-10°C is the safest conventional routine." },
          { label: "Watch", value: "Do not repeatedly trigger empty traps, feed meat, or fertilize the roots." },
        ],
        sources: [
          { label: "Kew: taxonomy and trap biology", href: "https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A275898-2/general-information" },
          { label: "International Carnivorous Plant Society: growing guide", href: "https://www.carnivorousplants.org/grow/guides/Dionaea" },
        ],
      },
    ],
  },
  {
    id: "genus-drosera",
    slug: "drosera",
    scientificName: "Drosera",
    commonName: "Sundews",
    description: "Dew-bright leaves that hold and slowly curl around small prey.",
    coverSpeciesId: "drosera-capensis-giant",
    species: [
      {
        id: "drosera-capensis-giant",
        slug: "drosera-capensis-giant",
        taxon: [
          { text: "Drosera capensis", italic: true },
          { text: " “Giant”" },
        ],
        commonName: "Giant Cape sundew",
        fact: "Cape sundews grow in permanently wet seepage habitats in South Africa, and their sticky leaves slowly fold around captured prey.",
        identificationNote: "“Giant” is used for several large horticultural forms. Keeping the supplier's exact label will make future identification easier.",
        thumbnail: {
          src: "/assets/garden/drosera/drosera-capensis-giant/thumbnail.webp",
          alt: placeholderAlt("sundew", "Drosera capensis “Giant”"),
          placeholder: true,
        },
        photos: [
          {
            src: "/assets/garden/drosera/drosera-capensis-giant/thumbnail.webp",
            alt: placeholderAlt("sundew", "Drosera capensis “Giant”"),
            placeholder: true,
          },
        ],
        care: [
          { label: "Light", value: "Full sun after acclimation or a strong grow light. Strong light produces heavier dew and richer colour." },
          { label: "Water", value: "Stand in a shallow tray of rain, reverse-osmosis, or distilled water. Never let the medium dry." },
          { label: "Substrate", value: "Equal parts unfertilized sphagnum peat and washed silica sand or additive-free perlite." },
          { label: "Temperature", value: "About 15-30°C." },
          { label: "Season", value: "No required dormancy. Protect named forms from freezing." },
          { label: "Watch", value: "It is self-fertile and prolific, so seedlings can spread into nearby pots." },
        ],
        sources: [
          { label: "Kew: taxonomy and common name", href: "https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A321806-1/general-information" },
          { label: "International Carnivorous Plant Society: care sheet", href: "https://www.carnivorousplants.org/sites/default/files/files/TeacherResources/ICPS_IG_Drosera_capensis.pdf" },
        ],
      },
      {
        id: "drosera-tokaiensis",
        slug: "drosera-tokaiensis",
        taxon: [{ text: "Drosera tokaiensis", italic: true }],
        commonName: "Tokai sundew",
        fact: "This accepted Japanese species combines genomes from Drosera rotundifolia and Drosera spatulata through an ancient hybrid origin.",
        identificationNote: "It is often confused with Drosera spatulata. Provenance and flower photographs can help if the identification is revisited.",
        thumbnail: {
          src: "/assets/garden/drosera/drosera-tokaiensis/thumbnail/thumbnail.webp",
          alt: "A Drosera tokaiensis rosette with round, dew-covered leaves growing in a small pot.",
        },
        photos: [
          {
            src: "/assets/garden/drosera/drosera-tokaiensis/gallery/01-rosette.webp",
            alt: "A Drosera tokaiensis rosette surrounded by glistening sundew leaves in the growing collection.",
          },
          {
            src: "/assets/garden/drosera/drosera-tokaiensis/gallery/02-rosette-close-up.webp",
            alt: "Top-down close-up of a green Drosera tokaiensis rosette with red, dew-covered tentacles.",
          },
        ],
        care: [
          { label: "Light", value: "Several hours of direct sun or a strong grow light. Bright light brings out red colour." },
          { label: "Water", value: "Keep wet in a shallow tray of rain, reverse-osmosis, or distilled water." },
          { label: "Substrate", value: "Roughly 1:1 unfertilized sphagnum peat and washed silica sand or additive-free perlite." },
          { label: "Temperature", value: "Common cultivated forms grow well around 18-28°C." },
          { label: "Season", value: "No strict dormancy is usually needed in cultivation. Avoid prolonged freezing." },
          { label: "Watch", value: "Keep its original nursery label because it can resemble related rosette sundews." },
        ],
        sources: [
          { label: "Kew: accepted name and range", href: "https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A963393-1" },
          { label: "Cytologia: hybrid-origin research", href: "https://www.jstage.jst.go.jp/article/cytologia/89/3/89_D-24-00058/_html/-char/en" },
        ],
      },
      {
        id: "drosera-paradoxa",
        slug: "drosera-paradoxa",
        taxon: [{ text: "Drosera paradoxa", italic: true }],
        commonName: "Paradox sundew",
        fact: "This Australian petiolaris-complex sundew can build an erect woody stem up to about 30 cm as older leaves accumulate below the crown.",
        thumbnail: {
          src: "/assets/garden/drosera/drosera-paradoxa/thumbnail/thumbnail.webp",
          alt: "A potted Drosera paradoxa with long narrow leaves radiating from its center and red, dew-covered tips.",
        },
        photos: [
          {
            src: "/assets/garden/drosera/drosera-paradoxa/thumbnail/thumbnail.webp",
            alt: "A potted Drosera paradoxa with long narrow leaves radiating from its center and red, dew-covered tips.",
          },
        ],
        care: [
          { label: "Light", value: "Full sun or very strong grow lighting, with gradual acclimation and steady airflow." },
          { label: "Water", value: "Keep evenly moist in a shallow tray during active growth. If it contracts into a resting rosette, keep only lightly damp." },
          { label: "Substrate", value: "A nutrient-poor, airy 1:1 mix of sphagnum peat and washed silica sand." },
          { label: "Temperature", value: "Heat-loving, ideally about 24-32°C by day and above 18°C at night." },
          { label: "Season", value: "It may take a brief dry-season rest, but it must remain warm." },
          { label: "Watch", value: "Cool, wet conditions can cause decline and rot. Do not give it a temperate winter treatment." },
        ],
        sources: [
          { label: "Kew: range and biome", href: "https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A997608-1" },
          { label: "Singapore NParks: description and cultivation", href: "https://www.nparks.gov.sg/florafaunaweb/flora/7/2/7294" },
        ],
      },
    ],
  },
  {
    id: "genus-sarracenia",
    slug: "sarracenia",
    scientificName: "Sarracenia",
    commonName: "North American pitcher plants",
    description: "Rain-fed tubes with bold veins and seasonal growth.",
    thumbnail: {
      src: "/assets/garden/sarracenia/thumbnail/thumbnail.webp",
      alt: "Several Sarracenia pitcher plants growing together in the carnivorous plant collection.",
    },
    coverSpeciesId: "sarracenia-purpurea-venosa",
    species: [
      {
        id: "sarracenia-purpurea-venosa",
        slug: "sarracenia-purpurea-venosa",
        taxon: [
          { text: "Sarracenia purpurea", italic: true },
          { text: " subsp. " },
          { text: "venosa", italic: true },
        ],
        commonName: "Southern purple pitcher plant",
        fact: "Its squat, open pitchers collect rainwater and can support a miniature aquatic food web, including mosquito and midge larvae in the wild.",
        thumbnail: {
          src: "/assets/garden/sarracenia/sarracenia-purpurea-venosa/thumbnail/thumbnail.webp",
          alt: "Top-down view of a Sarracenia purpurea subsp. venosa rosette with green and burgundy-veined pitchers.",
        },
        photos: [
          {
            src: "/assets/garden/sarracenia/sarracenia-purpurea-venosa/gallery/01-pitcher-group.webp",
            alt: "A group of compact Sarracenia purpurea subsp. venosa pitchers in shades of green and red.",
          },
          {
            src: "/assets/garden/sarracenia/sarracenia-purpurea-venosa/gallery/02-rosette-close-up.webp",
            alt: "Close top-down view into the open pitchers of Sarracenia purpurea subsp. venosa.",
          },
        ],
        care: [
          { label: "Light", value: "Full outdoor sun, or 12-16 hours under a powerful grow light." },
          { label: "Water", value: "During growth, stand in about 2-5 cm of rain, reverse-osmosis, or distilled water. Keep moist but less flooded in winter." },
          { label: "Substrate", value: "Equal parts unfertilized sphagnum peat and washed silica sand. Additive-free perlite can replace the sand." },
          { label: "Temperature", value: "Warm growing season with a cool winter rest around 0-10°C." },
          { label: "Season", value: "A 3-4 month winter dormancy with shorter days is required." },
          { label: "Watch", value: "The southern subspecies is less cold-tolerant than northern Sarracenia purpurea populations." },
        ],
        sources: [
          { label: "Kew: subspecies taxonomy and range", href: "https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A227817-2" },
          { label: "International Carnivorous Plant Society: care sheet", href: "https://carnivorousplants.org/sites/default/files/files/TeacherResources/ICPS_IG_Sarracenia_purpurea.pdf" },
        ],
      },
      {
        id: "sarracenia-catesbaei",
        slug: "sarracenia-catesbaei",
        taxon: [
          { text: "Sarracenia", italic: true },
          { text: " × " },
          { text: "catesbaei", italic: true },
        ],
        commonName: "Catesby's pitcher plant",
        fact: "This naturally occurring hybrid combines the yellow pitcher plant, Sarracenia flava, with the purple pitcher plant, Sarracenia purpurea.",
        identificationNote: "Seed-grown plants from the same parental cross can look different. Clone, parent, and locality records are more reliable than pitcher shape alone.",
        thumbnail: {
          src: "/assets/garden/sarracenia/sarracenia-catesbaei/thumbnail/thumbnail.webp",
          alt: "A potted Sarracenia × catesbaei with upright green and red-veined pitchers.",
        },
        photos: [
          {
            src: "/assets/garden/sarracenia/sarracenia-catesbaei/gallery/01-whole-plant.webp",
            alt: "A young Sarracenia × catesbaei plant with several upright pitchers among neighboring carnivorous plants.",
          },
        ],
        care: [
          { label: "Light", value: "Full outdoor sun. Weak light produces floppy, poorly coloured pitchers." },
          { label: "Water", value: "Stand in 2-5 cm of low-mineral water while actively growing. During dormancy, keep damp but not deeply flooded." },
          { label: "Substrate", value: "Roughly 1:1 unfertilized sphagnum peat and washed silica sand or additive-free perlite." },
          { label: "Temperature", value: "Warm growing season with a cool winter rest around 0-10°C." },
          { label: "Season", value: "A 3-4 month winter dormancy is required." },
          { label: "Watch", value: "Keep parentage or clone information because hybrid appearance can vary widely." },
        ],
        sources: [
          { label: "Kew: accepted hybrid listing", href: "https://powo.science.kew.org/results?q=Sarracenia+%C3%97+catesbaei" },
          { label: "US Forest Service: parentage", href: "https://research.fs.usda.gov/feis/species-reviews/sarpur" },
        ],
      },
    ],
  },
  {
    id: "genus-pinguicula",
    slug: "pinguicula",
    scientificName: "Pinguicula",
    commonName: "Butterworts",
    description: "Soft rosettes with deceptively sticky leaves.",
    thumbnail: {
      src: "/assets/garden/pinguicula/thumbnail/thumbnail.webp",
      alt: "A green Mexican butterwort rosette growing in a terracotta-colored pot.",
    },
    coverSpeciesId: "pinguicula-ehlersiae-moranensis",
    species: [
      {
        id: "pinguicula-ehlersiae-moranensis",
        slug: "pinguicula-ehlersiae-moranensis",
        taxon: [
          { text: "Pinguicula ehlersiae", italic: true },
          { text: " × " },
          { text: "P. moranensis", italic: true },
        ],
        commonName: "Mexican butterwort hybrid",
        fact: "Its leaves act as living flypaper. This hybrid may alternate between broad carnivorous leaves and a smaller succulent dry-season rosette.",
        identificationNote: "This is a parentage formula rather than a registered cultivar name. Different seedlings from the same cross can vary.",
        thumbnail: {
          src: "/assets/garden/pinguicula/pinguicula-ehlersiae-moranensis/thumbnail/thumbnail.webp",
          alt: "A Pinguicula ehlersiae × P. moranensis hybrid forming a broad green rosette in a small pot.",
        },
        photos: [
          {
            src: "/assets/garden/pinguicula/pinguicula-ehlersiae-moranensis/thumbnail/thumbnail.webp",
            alt: "A Pinguicula ehlersiae × P. moranensis hybrid forming a broad green rosette in a small pot.",
          },
        ],
        care: [
          { label: "Light", value: "Bright filtered light, gentle morning sun, or a good grow light." },
          { label: "Water", value: "With carnivorous leaves, keep lightly moist and let the shallow tray empty briefly. With succulent leaves, reduce water sharply." },
          { label: "Substrate", value: "Use an open, mineral-dominant mix of pumice, perlite, and coarse silica sand with a little peat or long-fiber sphagnum." },
          { label: "Temperature", value: "About 18-28°C, with no freezing." },
          { label: "Season", value: "Follow the change in leaf form rather than forcing a cold dormancy." },
          { label: "Watch", value: "During the succulent phase, avoid water sitting in the crown or keeping the mix soggy." },
        ],
        sources: [
          { label: "Kew: Pinguicula ehlersiae", href: "https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A928596-1" },
          { label: "Kew: Pinguicula moranensis", href: "https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A526491-1" },
          { label: "International Carnivorous Plant Society: winter care", href: "https://cpn.carnivorousplants.org/articles/CPNv49n3p132_135.pdf" },
        ],
      },
    ],
  },
  {
    id: "genus-nepenthes",
    slug: "nepenthes",
    scientificName: "Nepenthes",
    commonName: "Tropical pitcher plants",
    description: "Tropical vines carrying pitchers at the ends of tendrils.",
    thumbnail: {
      src: "/assets/garden/nepenthes/thumbnail/thumbnail.webp",
      alt: "Close-up of a mottled Nepenthes pitcher with a deep burgundy rim in the growing collection.",
    },
    coverSpeciesId: "nepenthes-ampullaria",
    species: [
      {
        id: "nepenthes-ampullaria",
        slug: "nepenthes-ampullaria",
        taxon: [{ text: "Nepenthes ampullaria", italic: true }],
        commonName: "Flask-shaped pitcher plant",
        fact: "Unusually for a pitcher plant, it is partly detritivorous. Ground pitchers collect fallen leaves and can obtain nitrogen from the litter.",
        thumbnail: {
          src: "/assets/garden/nepenthes/nepenthes-ampullaria/thumbnail/thumbnail.webp",
          alt: "Close-up of a rounded Nepenthes ampullaria pitcher with mottled sides and a burgundy rim.",
        },
        photos: [
          {
            src: "/assets/garden/nepenthes/nepenthes-ampullaria/gallery/01-pitcher-close-up.webp",
            alt: "A mottled Nepenthes ampullaria pitcher with a deep burgundy rim, viewed close up among other plants.",
          },
          {
            src: "/assets/garden/nepenthes/nepenthes-ampullaria/gallery/02-pitcher-mouth.webp",
            alt: "Close view into the open mouth of a rounded Nepenthes ampullaria pitcher.",
          },
          {
            src: "/assets/garden/nepenthes/nepenthes-ampullaria/gallery/03-hanging-pitcher.webp",
            alt: "A hanging Nepenthes ampullaria pitcher beneath broad green leaves in bright window light.",
          },
        ],
        care: [
          { label: "Light", value: "Bright indirect light. It tolerates more shade than many Nepenthes, but avoid harsh midday sun." },
          { label: "Water", value: "Top-water with low-mineral water and keep evenly moist while allowing free drainage." },
          { label: "Substrate", value: "Open long-fiber sphagnum mixed with perlite and/or fine orchid bark." },
          { label: "Temperature", value: "Lowland conditions around 26-32°C by day and 20-26°C at night." },
          { label: "Season", value: "No dormancy. Keep warmth and humidity stable throughout the year." },
          { label: "Watch", value: "Cold or dry air can stop pitchering before the foliage looks seriously stressed." },
        ],
        sources: [
          { label: "Kew: taxonomy and range", href: "https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A603652-1" },
          { label: "Singapore NParks: names and description", href: "https://www.nparks.gov.sg/florafaunaweb/flora/3/4/3438" },
          { label: "International Carnivorous Plant Society: species account", href: "https://cpn.carnivorousplants.org/articles/CPNv47n2p47_53.pdf" },
        ],
      },
      {
        id: "nepenthes-miranda",
        slug: "nepenthes-miranda",
        taxon: [
          { text: "Nepenthes", italic: true },
          { text: " ‘Miranda’" },
        ],
        commonName: "Tropical pitcher plant ‘Miranda’",
        fact: "This vigorous horticultural cultivar can produce speckled pitchers around 30 cm long, although its exact parentage remains uncertain.",
        identificationNote: "The cultivar is written Nepenthes ‘Miranda’, not Nepenthes miranda. Seedlings would not automatically retain the cultivar name.",
        thumbnail: {
          src: "/assets/garden/nepenthes/nepenthes-miranda/thumbnail/thumbnail.webp",
          alt: "A large hanging Nepenthes ‘Miranda’ pitcher with burgundy mottling and a flared rim.",
        },
        photos: [
          {
            src: "/assets/garden/nepenthes/nepenthes-miranda/gallery/01-hanging-pitcher.webp",
            alt: "A large hanging Nepenthes ‘Miranda’ pitcher with burgundy mottling and a flared rim.",
          },
          {
            src: "/assets/garden/nepenthes/nepenthes-miranda/gallery/02-whole-plant.webp",
            alt: "A Nepenthes ‘Miranda’ rosette and developing pitchers growing among other carnivorous plants.",
          },
        ],
        care: [
          { label: "Light", value: "Bright filtered light or gentle morning sun. Insufficient light commonly stops pitcher production." },
          { label: "Water", value: "Top-water with rain, reverse-osmosis, or distilled water. Keep moist but never leave the pot standing in water." },
          { label: "Substrate", value: "Long-fiber sphagnum with perlite and/or fine orchid bark for moisture plus drainage." },
          { label: "Temperature", value: "Adaptable intermediate conditions around 22-30°C by day and 15-22°C at night." },
          { label: "Season", value: "No dormancy." },
          { label: "Watch", value: "Avoid prolonged cold below about 12°C and stagnant, waterlogged media." },
        ],
        sources: [
          { label: "Royal Horticultural Society: cultivar profile", href: "https://www.rhs.org.uk/plants/172554/nepenthes-miranda/details" },
          { label: "Singapore NParks: profile and parentage note", href: "https://www.nparks.gov.sg/florafaunaweb/flora/7/3/7316" },
        ],
      },
      {
        id: "nepenthes-mirabilis",
        slug: "nepenthes-mirabilis",
        taxon: [{ text: "Nepenthes mirabilis", italic: true }],
        commonName: "Common swamp pitcher plant",
        fact: "It has the broadest natural range of any Nepenthes, from continental Southeast Asia and southern China through Malesia to northern Australia.",
        identificationNote: "This species is very variable across its range. Preserve the original nursery or locality label if the identification is revised later.",
        thumbnail: {
          src: "/assets/garden/nepenthes/nepenthes-mirabilis/thumbnail.webp",
          alt: placeholderAlt("tropical pitcher plant", "Nepenthes mirabilis"),
          placeholder: true,
        },
        photos: [
          {
            src: "/assets/garden/nepenthes/nepenthes-mirabilis/thumbnail.webp",
            alt: placeholderAlt("tropical pitcher plant", "Nepenthes mirabilis"),
            placeholder: true,
          },
        ],
        care: [
          { label: "Light", value: "Bright filtered light. It accepts somewhat more sun than Nepenthes ampullaria after acclimation." },
          { label: "Water", value: "Keep evenly moist with low-mineral water and free drainage." },
          { label: "Substrate", value: "Airy long-fiber sphagnum with perlite and/or fine orchid bark." },
          { label: "Temperature", value: "Lowland conditions around 25-32°C by day and 18-25°C at night." },
          { label: "Season", value: "No dormancy." },
          { label: "Watch", value: "It tolerates wetter roots than many Nepenthes, but stagnant, airless media can still rot." },
        ],
        sources: [
          { label: "Kew: taxonomy and range", href: "https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A603761-1" },
          { label: "Flora of Australia: habitat and common name", href: "https://profiles.ala.org.au/opus/foa/profile/Nepenthes%20mirabilis/publication/6c7c422a-679e-4af7-9f51-30074f399045/file" },
        ],
      },
    ],
  },
];

export function getGenusCover(genus: GardenGenus): GardenPhoto {
  if (genus.thumbnail) return genus.thumbnail;
  const coverSpecies = genus.species.find((species) => species.id === genus.coverSpeciesId);
  if (!coverSpecies) {
    throw new Error(`Missing cover species ${genus.coverSpeciesId} for ${genus.id}`);
  }
  return coverSpecies.thumbnail;
}
