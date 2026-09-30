# InfiniteGranite supplier catalogue

Audit date: 30 September 2026. These are published designs, not an inventory feed.

| Supplier | Designs | Public catalogue |
| --- | ---: | --- |
| Vicostone Canada | 68 | https://vicostone.ca/en/product?detectedGeoLocation=CA |
| HanStone | 54 (41 quartz, 13 porcelain) | https://www.hanstone.ca/en/quartz/colours-hanstone and /en/porcelain/colours-hanstone |
| Fir Stone | 392 | https://www.fir-stone.com/ — quartz, granite, marble, quartzite, porcelain collection pages |
| KASA Quartz | 145 | https://www.kasaquartzvan.ca/catalogue |
| Omnia Quartz | 74 product pages | http://www.omniaquartz.com/ — all six collections |
| TCE Stone | 97 retained | Existing audited TCE collection |

RH Stones is **not imported yet**: its live catalogue requires a human verification check. Its publicly indexed stone/printed-quartz/ceramic listings were inspected, but without verifiable image access they are not presented as usable texture selections. Finish this import after the user completes the check or supplies the official catalogue assets. Do not substitute generated textures.

The 68 Canadian Vicostone records replace the older 214-product global list. Some Canadian names differ for the same code. Retired global IDs and the eight removed Studio presets migrate to Vicostone BQ8788 while preserving room geometry and other finishes. Internal procedural wood, plaster, marble and slate **room** textures remain separate from the selectable slab catalogue.

## Provenance and updating

`public/assets/infinite-granite/suppliers/sources.json` records every product page, published name/code, family and original image URL. HanStone's public collection UI reads its published Storyblok product records; the source audit includes all 54 records, including the porcelain range. No API token is stored in this repository. Fir's five collection listings expose all 392 product cards without pagination. KASA lists all 145 cards. Omnia's six collections link 74 product pages; some pages publish multiple codes for the same design/finish variants, retained verbatim and searchable.

Run `node scripts/generate-supplier-catalogues.mjs` after updating the source audit. This generates optimized WebP textures and thumbnails, a provenance/hash manifest and `supplierMaterials.ts`. Downloads are cached outside the repo by source URL hash. Failed downloads are reported and cause a nonzero exit; they must not be silently replaced with invented patterns.

Supplier photos can include presentation margins, printed labels or warehouse backgrounds. Fir images are trimmed and sampled from the stone field; explicit crop overrides handle near-white presentation boards. Omnia OQ277/OQ288/OQ381 use the clean slab photos from their product galleries. Pattern scale is approximate; detail images are labeled. The manifest records processing, source dimensions and final texture hashes. Product-source links and photographer attribution remain in the picker.

The shared picker supports company filtering and punctuation-insensitive code/name/family searches in Room Planner, Slab Studio and Kitchen Flyover. Only visible swatches load initially; full-resolution textures load when selected. New assets total approximately 66 MB on disk, not per page load.
