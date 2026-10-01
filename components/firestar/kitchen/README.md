# Firestar V1 kitchen viewer

This is an independently hosted copy of the InfiniteGranite Kitchen Flyover at commit `eb176435`. Runtime components and textures belong to Firestar: no iframe, calls into the original app, or remotely hosted texture assets. Three.js runs in the browser. Supplier source links remain for attribution and product information.

- `KitchenHero.tsx` renders a stationary camera. Six coordinated looks in `looks.ts` rotate every six seconds after textures finish loading. Manual navigation pauses rotation; hover, keyboard focus, hidden tabs and offscreen previews suspend it. Reduced-motion visitors start paused. Zoom never animates the camera path.
- `/projects/firestar/v1/kitchen-viewer/` opens the complete viewer with supplier search, finishes, lighting, backsplash height, fullscreen and image download. The camera starts paused; Play enables the original walking loop. The landing link carries its selected look to the viewer.
- `engine/` owns the rendering engine, kitchen model and supplier catalogue. Its optional saved design uses the separate `firestar-kitchen-viewer-v1` storage key.
- `public/assets/firestar/kitchen/` owns the catalogue images and provenance manifests. Only the selected full-size texture loads into the landing renderer. Thumbnails in the full viewer are lazy loaded.
- The previous V1 slab carousel remains on Products. V2, V3 and the original InfiniteGranite app are unchanged.

## Export to another host

After `npm run build`, run `node scripts/export-firestar-v1.mjs /path/to/new-export-directory`. Upload that complete directory to the root of any static web host. It includes V1 pages, its own images, the generated runtime and fonts. It excludes the original InfiniteGranite pages and assets; no separate deployment or backend is needed for the kitchen. Keep the exported paths intact. A root redirect opens V1.

Before a permanent domain migration, update the root layout's metadata base and analytics settings and V1's portfolio-return link, then rebuild. See `HOSTING.txt` in the export. Deploying under a different subdirectory would also require changing the route and asset prefixes before building.
