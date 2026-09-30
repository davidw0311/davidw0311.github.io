# Kitchen Flyover

`/projects/infinite-granite/flyover/` uses the room planner's Three.js geometry, real countertop openings, supplier textures, and PBR materials. It does not composite a photo or call a generative model. The movement is rendered live, so finish and lighting changes remain visible throughout the loop.

The authored single-wall/island kitchen has appliance access and fridge hinge clearance. `model.ts` defines a five-second elliptical camera path with continuous position and velocity at its seam. Portrait views adjust camera distance. The client pauses animation in hidden tabs, releases resources on navigation, and starts paused for reduced-motion preferences. Pause resumes at the same point in the loop. Save downloads the current PNG frame, not a video file.

The countertop catalogue is shared with the planner. Upper, lower and island colours are independent. Floors reuse the existing eight floor finishes with custom colours. Day/night, brightness, and warmth update lights and exposure without rebuilding geometry. Only finishes and lighting are restored from the separate `infinite-granite-flyover-v1` storage entry; the authored geometry remains fixed.

Verification: `npm run typecheck`, scoped ESLint, `npm test` (including camera seam, physical layout, and persisted-setting validation), `npm run build`. Browser checks cover desktop, portrait and landscape, dark supplier stone, cabinet/floor changes, day/night, pause/resume, navigation and reload.
