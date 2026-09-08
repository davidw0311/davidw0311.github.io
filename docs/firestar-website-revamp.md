# Firestar Granite website revamp

Three complete design concepts live at `/projects/firestar/v1/`, `/projects/firestar/v2/`, and `/projects/firestar/v3/`. Their separate links appear under Selected projects on the portfolio homepage.

- V1: an architectural editorial design with warm paper, serif typography, and asymmetric photography.
- V2: a dark material catalogue with a fixed numbered side rail, oversized lime typography, full-frame photography, horizontal material rows, and a single-image exhibition with a thumbnail filmstrip.
- V3: a welcoming neighbourhood studio with forest green and terracotta, rounded cards, centered typography, an interactive room selector, navigation tiles, and a masonry inspiration gallery.

V2 and V3 have independent page renderers, navigation, galleries, and styles, including their product guides, services, showrooms, contact pages, and testimonials. Only source content and content-only helpers are shared. The existing InfiniteGranite room-planning project is independent.

## Source and content

Source: http://infinitegranite.ca/, retrieved September 8, 2026. The existing site identifies the business as Firestar Enterprises Ltd., formerly Infinite Granite Ltd. Its Firestar Granite name, contact details, hours, business history, services, original product guidance, and 2023 copyright notice are retained.

`data/firestar/source.json` contains the original paragraph text from Home, Services, Products, Showroom, Contact, the six product guides, and all nine testimonials. Text whitespace and legacy encoding artifacts were normalized. New short display headings organize the original content. `data/firestar/content.ts` defines the common route map, showroom hours, quote requirements, and gallery inventory. All 16 pages are available in each version, including the Kitchen, Bathroom, and Others galleries. Historical product-care statements are preserved from the source rather than rewritten or independently certified.

There are 96 original images under `public/assets/firestar/`, along with optimized WebP derivatives. The source manifest maps their original URLs to local filenames. The full galleries retain 36 kitchen, 27 bathroom, and 21 other images. The original edge-profile chart remains available on Profiles/Edges. Photographs are original business assets; material selection imagery is illustrative of the source gallery, not a new claim about a particular stone specification.

## Behavior

- The version-switching strip is removed. The portfolio homepage provides three separate previews and links.
- Mobile navigation supports keyboard access and Escape.
- V1 keeps its filtered grid; V2 presents one project with previous/next controls and a complete thumbnail filmstrip; V3 filters a masonry grid and loads more photographs on request. Each gallery uses a native modal with focus management, Escape dismissal, and arrow-key navigation.
- Phone links and map directions use the source business details.
- The quote action opens the visitor's email client with the source's requested information. This static site does not send or store submissions.
- Page metadata and sitemap include all variants. Gallery media is lazy loaded; hero imagery is prioritized. Reduced-motion preferences are respected.

## Delivery

Built on `Firestar-website-revamp` (Git does not allow spaces in branch names). Work was performed in an isolated checkout to preserve unrelated generated output and garden photographs in the main checkout. GitHub Pages publishes the production export through the existing workflow on a push to `main`.

## Quartz emphasis and display name

The public display name is “Firestar（infinite） granite” across the header, footer, browser metadata, and homepage project previews. Original legal names and attributed source text remain intact. Each design highlights quartz in its opening copy and primary action, while retaining the other stone options and product guides.

## Current phone number

All three versions use 250-619-9968 as the sole office/showroom phone number, including tap-to-call links, navigation, contact pages, footers, and the contact text in the source data. This user-requested update supersedes the original source contact numbers.

## Readability and contact cleanup

The retired fax number is removed from all three designs and the contact source text. Quote checklists and email templates request phone/email only. Supporting text now uses a 14px minimum, with navigation and body copy generally 16px. Responsive navigation, wrapping labels, showroom hours, and footers accommodate the larger type.

## V1 gallery landing page

V1 opens into a quartz lookbook with colour filters, nine project references, a favourites shortlist, and an enlarged detail view. Images are identified as style references from original stone projects, with enquiries for matching quartz samples. These are not named supplier products or inventory claims. Existing company content follows the gallery, and all original project galleries remain available. V2 and V3 are unchanged.
