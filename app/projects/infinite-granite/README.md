# InfiniteGranite

A browser-only kitchen design studio at `/projects/infinite-granite/`, linked from the portfolio's space project deck. No AI calls, uploads, external texture requests, or backend are required.

Six starting layouts preserve finishes when loaded. Counters, cupboard colours, door profiles, hardware, sinks, floors and backsplash are configurable. Each module can be selected from the scene or an accessible dropdown and moved, rotated, resized, duplicated or removed. Individual cupboard/counter finishes can override global choices. Overlaps are flagged; this is a conceptual preview, not a fabrication or building-code tool.

Three.js is loaded only for this route and initialized on the client. The scene renders on change, caps pixel density, cleans up GPU resources, and offers touch orbit/pinch and visible camera controls. Countertop textures are generated locally and sampled in world coordinates to preserve consistent pattern scale. Sink cabinets have hollow carcasses and countertop cutouts.

Current designs and up to four named comparison options persist in localStorage under `infinitegranite.studio.v1` on the current device. Inputs are validated before restoration; storage failure leaves the editor usable for the current session. Download captures the current 3D view as a PNG.

Verification: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`. The InfiniteGranite tests cover every preset's bounds and collisions, rotated placement clamping, sink opening margins, persistence round-trips and malformed saved input. Production is the existing Next.js static export and GitHub Pages workflow.
