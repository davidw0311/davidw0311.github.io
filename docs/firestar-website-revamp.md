# Firestar Granite website revamp

Three complete design concepts live at `/projects/firestar/v1/`, `/projects/firestar/v2/`, and `/projects/firestar/v3/`. Their separate links appear under Selected projects on the portfolio homepage.

- V1: an architectural editorial design with warm paper, serif typography, and asymmetric photography.
- V2: a dark gallery design with a photographic hero, mineral colors, and restrained sans-serif typography.
- V3: a contemporary studio design with cobalt, bold typography, and graphic image compositions.

The concepts use different home compositions and shared source content. The existing InfiniteGranite room-planning project is independent.

## Source and content

Source: http://infinitegranite.ca/, retrieved September 8, 2026. The existing site identifies the business as Firestar Enterprises Ltd., formerly Infinite Granite Ltd. Its Firestar Granite name, contact details, hours, business history, services, original product guidance, and 2023 copyright notice are retained.

`data/firestar/source.json` contains the original paragraph text from Home, Services, Products, Showroom, Contact, the six product guides, and all nine testimonials. Text whitespace and legacy encoding artifacts were normalized. New short display headings organize the original content. `data/firestar/content.ts` defines the common route map, showroom hours, quote requirements, and gallery inventory. All 16 pages are available in each version, including the Kitchen, Bathroom, and Others galleries. Historical product-care statements are preserved from the source rather than rewritten or independently certified.

There are 96 original images under `public/assets/firestar/`, along with optimized WebP derivatives. The source manifest maps their original URLs to local filenames. The full galleries retain 36 kitchen, 27 bathroom, and 21 other images. The original edge-profile chart remains available on Profiles/Edges. Photographs are original business assets; material selection imagery is illustrative of the source gallery, not a new claim about a particular stone specification.

## Behavior

- Version navigation preserves the current page when switching designs.
- Mobile navigation supports keyboard access and Escape.
- The gallery filters by category, loads additional images, and uses a native modal with focus management, Escape dismissal, and arrow-key navigation.
- Phone links and map directions use the source business details.
- The quote action opens the visitor's email client with the source's requested information. This static site does not send or store submissions.
- Page metadata and sitemap include all variants. Gallery media is lazy loaded; hero imagery is prioritized. Reduced-motion preferences are respected.

## Delivery

Built on `Firestar-website-revamp` (Git does not allow spaces in branch names). Work was performed in an isolated checkout to preserve unrelated generated output and garden photographs in the main checkout. GitHub Pages publishes the production export through the existing workflow on a push to `main`.

## Quartz emphasis and display name

The public display name is “Firestar（infinite） granite” across the header, footer, browser metadata, and homepage project previews. Original legal names and attributed source text remain intact. Each design leads with quartz in its hero headline, description, and primary action. The material section now follows the hero, highlights quartz, and retains the other stone options and product guides.
