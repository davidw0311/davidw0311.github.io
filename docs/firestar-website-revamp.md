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

V1 opens into a Kasa Quartz gallery with thirteen named selections, colour filters, search by name/code, a favourites shortlist, and an enlarged detail view. Nine selections include both slab patterns and room illustrations. Enquiry emails include exact Kasa product names and codes. Every detail view links to the official supplier page. Existing company content follows the gallery, and all original project galleries remain available. V2 and V3 are unchanged.

Product names/codes were verified against https://en.kasaquartz.cn/product/33/ on 2026-09-08. The supplier image CDN returned errors, so matching catalogue images were obtained from Eternal Interiors’ public Kasa collection. Source URLs and image provenance are recorded in `public/assets/firestar/kasa/sources.json`. Images are optimized and served locally, with no dependency on third-party image hosts. Catalogue illustrations are identified as such; they are not presented as Firestar installations or confirmed inventory. Physical samples, availability, and pricing are confirmed through Firestar.

## V1 rotating quartz carousel

The opening Kasa gallery is a horizontal scroll-snap carousel: three cards on desktop, two on tablets, and one with a preview of the next card on phones. It advances every 4.5 seconds and wraps to the start. Arrow buttons, touch/trackpad scrolling, and keyboard arrows provide manual browsing. Manual interaction stops rotation; Play restarts it. Hover, focus, an open product detail, a hidden browser tab, or an offscreen carousel suspend advancement. Reduced-motion preferences disable automatic rotation and smooth scrolling. Filtering/searching resets the carousel to the matching selections. The existing product details, favourites, and enquiry links are preserved.

## V1 simplified landing screen

The landing screen now places the quartz carousel directly beneath a compact, centered heading. Colour filters, search, the saved-count toolbar, selection count, introductory paragraph, and showroom CTA were removed from above the images. Card overlays were removed; visitors can still save selections from the product detail view. Product cards show only the name and code, with larger imagery scaled to the viewport. Rotation and navigation controls sit centered below the gallery. The portfolio preview reflects this simpler layout. This supersedes the earlier filter/search description; all thirteen selections, automatic rotation, detailed views, and enquiries remain available.

## V1 copy refinement

Reduced repeated material names in the V1 gallery, product actions, and materials section. The landing headline is now “Find your surface.”, followed by “Our materials” / “Choose your material.” further down the page. Product actions use selection-specific language, and carousel labels use “surface”. The Kasa Quartz brand, the main collection description, material category names, technical guides, and source company content retain their accurate terminology. The homepage V1 preview uses the updated headline.

## Seamless carousel swiping

V1 renders a complete buffer copy on either side of the main collection so the last and first products sit next to each other during native horizontal swipes. After scrolling settles, the track recenters to an identical position in the middle copy without reversing or visibly jumping. Touch/pointer gestures and swipe momentum finish before recentering, with scrollend and a debounced fallback. Resize measurement preserves the current product position. Arrow navigation and autoplay use the same continuous track. Duplicate copies are hidden from screen readers and excluded from keyboard tab order, while their product buttons still open the correct details.

## TCE Stone and Vicostone selections

V1 now includes 25 selections: the existing 13 Kasa patterns, six TCE Stone patterns (Calacatta Dorato, Nero Dorato, Bianco Blu, Carrara Velo, Botticino Crema, Dolce Crema), and six Vicostone patterns (Vitoria Regia, Beryl, Misterio, Misterio Gold, Lacus, Golden Polaris). The suppliers are interleaved so each appears at the start of the continuous carousel. The homepage preview reflects those opening selections.

Names, codes, slab images and Vicostone room images were verified against the official Canadian catalogues on 2026-09-08: https://tcestone.com/products/ and https://vicostone.ca/product?detectedGeoLocation=CA. Optimized images are served locally; each supplier folder contains a `sources.json` with exact product and image URLs. Cards, detail views, and single or mixed-brand enquiry emails identify the correct supplier. The gallery heading is “Quartz collection”; no extra filter controls were added. Catalogue imagery remains distinct from Firestar's project photographs, and samples, availability, and pricing are confirmed through Firestar.

## Google review excerpts for V1

Replaced V1's legacy homepage quote and testimonials page with short excerpts from the three newest public text reviews shown by Google Maps under “Newest”: Chris Seifried, Brook Reimer, and Artem Danchenko. The listing was matched to Infinite(FireStar) Granite Ltd, 2156 Akenhead Road, Nanaimo, and 250-619-9968. On 2026-09-09 it displayed 4.9/5 from 31 reviews. Each excerpt credits its author and links to their Google reviews profile; the rating and “Read all reviews on Google” link open the business's Reviews tab. Individual review share links were not exposed by the browser clipboard, so author review profiles are labelled explicitly rather than presented as individual-review permalinks.

This is a manually checked snapshot, with a visible checked date and a notice that the text is excerpted and ordered newest first. It does not auto-refresh, and no Google credentials or third-party widgets are embedded. A live feed would require a separately configured Google API or review integration. V2 and V3 retain their original testimonial content.

## Five selected Google reviews and a customer photo

V1 now displays five selected five-star reviews: jim ning, Brook Reimer, Ever Green, Michelle Wong, and D M. Each is presented as a clearly labelled summary with an author link to Google. The selection replaces the previous three newest excerpts; the overall 4.9/5 rating still covers all 31 reviews in the 2026-09-09 snapshot.

Jim’s review includes the one verified attached customer project photo found across the Akenhead Road and Kirsten Drive listings. The image shows his bathroom countertop, is credited to him, and is dated June 2022 by Google. Its original URL and attribution are recorded in `public/assets/firestar/reviews/sources.json`. The other four reviews remain text-only because no project-photo attachments could be verified. Reviewer portraits and unrelated installation photos are not substituted. The responsive layout features the photo alongside Jim’s summary on desktop and above it on mobile, followed by the other four reviews. V2 and V3 are unchanged.

## Text-only review selection

Removed Jim Ning’s review, photo, caption, and unused photo assets at the user’s request. V1 now features Brook Reimer, Ever Green, Michelle Wong, D M, and Chris Seifried, each with five stars and a Google author-review link. Chris’s original review and rating were verified again on 2026-09-12. Review copy remains explicitly labelled as summaries; long Google review text has not been republished verbatim. User-provided review text can replace those summaries in a follow-up.
