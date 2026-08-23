# Portfolio Website Project Guide

## Project Goal

Build a polished, memorable personal portfolio for David Yuchen Wang that presents his work in artificial intelligence, engineering, robotics, physics, and photography. The site should feel thoughtful and technically sophisticated without becoming visually noisy.

Every change should support these outcomes:

- Make David's background and strongest work understandable within a few seconds.
- Give featured projects enough context to show the problem, contribution, process, and outcome.
- Create a distinctive visual identity that feels personal rather than template-driven.
- Deliver an equally complete experience on desktop, tablet, and mobile.
- Keep the deployed site fast, accessible, maintainable, and deployable as a statically exported Next.js application on GitHub Pages.

## Target Architecture

Upgrade the entire website to Next.js using the App Router and TypeScript. The finished portfolio must be a cohesive Next.js application rather than a Next.js wrapper around the legacy page.

- Use Next.js App Router, React, and strict TypeScript.
- Use `app/` for routes, layouts, metadata, loading states, and route-level styles.
- Use React Server Components by default. Add `'use client'` only to the smallest interactive leaf component that requires state, effects, event handlers, or browser APIs.
- Store reusable UI in `components/`, structured portfolio content in `data/`, shared types in `types/`, and utilities in `lib/`.
- Place directly served files in `public/`. During migration, move or copy the required contents of `assets/` into a clear structure under `public/` and update all references.
- Use CSS Modules for component styling and `app/globals.css` for design tokens, resets, typography, and genuinely global rules.
- Use `next/font` for local or hosted fonts and `next/image` for raster images whenever compatible with static export.
- Use Next.js metadata APIs for page titles, descriptions, canonical URLs, social previews, robots rules, and icons.
- Keep the production site compatible with static export through `output: 'export'` unless the user explicitly approves a server-dependent deployment target.
- Configure the GitHub Pages repository path correctly through `basePath` and `assetPrefix` when the site is not deployed at a custom-domain root.

### Legacy source

The repository currently contains the original static implementation:

- `index.html` contains the existing page structure and factual content.
- `css/styles.css` contains the existing styles.
- `js/scripts.js` contains the existing browser behavior.
- `assets/` contains original images, videos, PDFs, fonts, and illustrations.
- `index_backup.html`, `css/styles_backup.css`, and `js/scripts_backup.js` are historical references.
- Bootstrap, jQuery, Lightbox2, Font Awesome, and Google Fonts are currently loaded from CDNs.

Use these files as migration references. Preserve their factual content and useful assets, but do not carry forward invalid markup, inline styling, global DOM manipulation, duplicate backup code, or unnecessary third-party dependencies. Remove the legacy runtime files and CDN dependencies only after their content and behavior have been fully replaced and verified in Next.js.

### Expected project structure

```text
app/
  layout.tsx
  page.tsx
  globals.css
components/
  layout/
  sections/
  projects/
  ui/
data/
  portfolio.ts
lib/
public/
  images/
  media/
  documents/
types/
next.config.ts
package.json
tsconfig.json
```

Keep the structure proportional to the site. Do not add empty abstraction layers or generic components used only once.

## Migration Requirements

1. Inventory all legacy sections, projects, publications, experience entries, education entries, interests, external links, media, and downloadable documents.
2. Scaffold the Next.js application with TypeScript, linting, and scripts for development, production builds, and validation.
3. Model repeated portfolio content as typed data and render it through focused React components.
4. Rebuild the visual system and responsive layout in CSS rather than trying to preserve Bootstrap class markup.
5. Replace jQuery and direct DOM scripting with React state, platform APIs, or CSS.
6. Replace Lightbox2 and Bootstrap modals with accessible, lightweight React components only where a dedicated detail page is not more appropriate.
7. Replace Font Awesome with a small tree-shakeable icon set or optimized local SVG components. Every icon-only control still requires an accessible name.
8. Migrate media into `public/`, preserve original documents and photography, and update paths with GitHub Pages base-path behavior in mind.
9. Add static-export and GitHub Pages deployment configuration, including a reproducible CI workflow if deployment automation is in scope.
10. Verify content parity, responsive behavior, accessibility, performance, metadata, and production export before deleting legacy runtime files.

Do not mix the old static site and the new application in production. The migration may happen incrementally in development, but the shipped result must have one source of truth.

## Design Direction

Aim for a refined editorial-meets-technical aesthetic: confident typography, generous space, strong project imagery, precise details, and restrained motion. The experience should convey curiosity, engineering depth, and a connection to nature and exploration.

### Visual principles

- Use a cohesive, limited palette with accessible contrast. Reuse colors through CSS custom properties.
- Establish a clear type scale and visual hierarchy. Body text must remain comfortable to read on small screens.
- Favor intentional asymmetry, layered imagery, and subtle technical or topographic details over generic card grids.
- Let high-quality project media carry visual weight; avoid decorative elements that compete with the work.
- Use consistent radii, spacing, borders, shadows, and interaction states.
- Motion should explain state or add atmosphere. Keep it subtle, performant, and optional.
- Avoid stock-dashboard aesthetics, excessive gradients, glass effects everywhere, generic icon clouds, and repetitive pill-shaped UI.

### Content hierarchy

The preferred narrative is:

1. A concise hero with David's name, focus, current role or location, and primary calls to action.
2. A curated set of featured projects with clear outcomes and David's role.
3. Experience and education that establish credibility without reading like an unformatted resume.
4. Publications or research with direct access to papers and supporting material.
5. Personal interests or photography that make the site human and memorable.
6. A clear contact section and footer.

Lead with the strongest, most recent work. Do not remove factual content, project links, publications, or downloadable files without confirmation.

## Responsive Requirements

Design mobile-first and treat every viewport as a first-class layout, not a scaled-down desktop page.

- Support small phones from `320px` wide, modern phones, tablets in both orientations, laptops, and wide desktop screens.
- Use fluid sizing with `clamp()`, flexible grids, intrinsic layouts, and sensible content width limits.
- Add breakpoints only when the content or layout needs them; do not target specific devices.
- Avoid fixed widths and heights for content containers. Use fixed aspect ratios only when they are deliberate.
- Prevent horizontal overflow at every viewport.
- Navigation must be keyboard-accessible, easy to operate with one hand on mobile, and robust with long labels.
- Interactive targets should be at least `44px` by `44px` where practical.
- Images and video must resize without distortion. Use `object-fit`, `aspect-ratio`, and responsive source techniques appropriately.
- Modals, lightboxes, carousels, and project details must remain usable on short and narrow screens.
- Account for safe areas and dynamic mobile browser chrome when using viewport-height sections.

## Accessibility Standards

Target WCAG 2.2 AA for all new or redesigned UI.

- Use semantic HTML landmarks and a logical heading hierarchy.
- Ensure the entire site works with keyboard navigation.
- Provide visible `:focus-visible` states; never remove focus indication without a replacement.
- Give meaningful images descriptive alternative text and decorative images empty alternative text.
- Use real buttons for actions and anchors for navigation.
- Ensure text and meaningful controls meet contrast requirements in default, hover, focus, active, and disabled states.
- Do not communicate meaning through color alone.
- Respect `prefers-reduced-motion` and avoid autoplaying disruptive media.
- Include an accessible skip link and descriptive labels for icon-only controls.
- Preserve browser zoom and text resizing behavior.

## Next.js Performance and Media

- Keep the first screen lightweight and prioritize only its genuinely critical image and styles.
- Use modern image formats when practical while retaining safe fallbacks.
- Size images near their rendered dimensions and avoid loading full-resolution media for small thumbnails.
- Use `next/image` with meaningful `sizes`, explicit dimensions or `fill`, and `priority` only for the likely Largest Contentful Paint image.
- Lazy-load below-the-fold images, videos, embeds, client components, and noncritical third-party code.
- Always provide media dimensions or an aspect ratio to minimize layout shift.
- Keep client-side JavaScript small. Do not turn a static section into a Client Component solely for convenience.
- Use dynamic imports only when they materially reduce initial work or isolate a browser-only feature.
- Avoid large dependencies for behavior that can be implemented cleanly with React, HTML, or CSS.
- Do not preload large media that is not immediately visible.
- Preserve original source assets when creating optimized derivatives.

## Next.js, React, TypeScript, and CSS Conventions

### Next.js and React

- Keep page and layout files declarative. Move meaningful reusable UI into focused components rather than one oversized `page.tsx`.
- Prefer Server Components and build-time data. Avoid fetching local portfolio content from the client.
- Use semantic JSX that remains meaningful without styling.
- Use `next/link` for internal navigation and standard anchors for files, email, and external destinations.
- External links that open a new tab must use `rel="noopener noreferrer"`.
- Use stable keys derived from content data, never array indexes when items can change order.
- Avoid effects for values that can be computed during render and avoid duplicating props in state.
- Do not use raw HTML injection unless the content is trusted, sanitized, and the need is documented.
- Interactive overlays must manage initial focus, focus containment, Escape dismissal, focus restoration, labels, and scroll locking.

### TypeScript

- Keep strict mode enabled and do not use `any` as an escape hatch.
- Define shared domain types for projects, publications, experience, education, media, and navigation.
- Prefer typed objects and discriminated unions over loosely shaped data and conditional property guessing.
- Validate data at external boundaries. Locally authored, typed portfolio data does not need redundant runtime validation.
- Remove unused imports, unreachable branches, and suppressions before completing a change.

### CSS

- Define design tokens in `:root` for color, type, spacing, radii, shadows, transitions, and content widths.
- Keep global CSS intentional. Put component-specific rules in co-located CSS Modules.
- Prefer Grid and Flexbox over positional hacks.
- Keep specificity low and avoid `!important` unless overriding an unavoidable third-party rule.
- Keep responsive rules with the component they affect.
- Remove obsolete declarations when replacing a component; do not leave parallel styling systems behind.

### Client-side code

- Keep behavior resilient when JavaScript is unavailable where practical.
- Use React state for UI state and browser APIs through narrowly scoped effects.
- Clean up timers, observers, and event listeners returned from effects.
- Do not add animation loops or scroll handlers that cause layout thrashing.
- Do not access `window`, `document`, storage, or media-query APIs during server rendering.

## SEO and Sharing

- Keep page titles and descriptions specific and current through the Metadata API.
- Add canonical, Open Graph, and social sharing metadata through `metadata` or `generateMetadata`.
- Use one primary `h1` and descriptive headings for sections and projects.
- Keep anchor text informative and URLs stable where possible.
- Add structured data only when it accurately represents the visible content.
- Ensure the favicon and social preview use polished, intentionally selected assets.
- Generate or provide `sitemap.xml` and `robots.txt` in a way compatible with static export.

## Content and Asset Integrity

- Treat names, dates, employers, schools, publications, project claims, and contact details as factual data. Do not invent or embellish them.
- Correct obvious spelling or grammar issues when the meaning is unambiguous; flag substantive rewrites for review.
- Reuse the strongest existing assets before sourcing or generating replacements.
- Use lowercase, descriptive, hyphenated names for new assets.
- Put optimized derivatives in an appropriate subfolder under `assets/` and keep their relationship to the source clear.
- Never overwrite resumes, papers, certificates, or original photography.

## Validation Checklist

Before considering a visual or functional change complete:

1. Test the page at approximately `320px`, `375px`, `768px`, `1024px`, `1440px`, and one wide desktop viewport.
2. Check portrait and landscape layouts where relevant.
3. Verify navigation, project interactions, modals, downloads, and external links with mouse, touch-sized emulation, and keyboard.
4. Confirm there is no horizontal overflow, clipped text, overlapping content, distorted media, or unexpected layout shift.
5. Check focus order, visible focus, heading order, alternative text, reduced-motion behavior, and color contrast.
6. Review the browser console for errors and failed asset requests.
7. Verify that all referenced local files exist with exact case-sensitive paths.
8. Run formatting, linting, type checking, tests, and the production build. Do not hand off with warnings or errors introduced by the change.
9. Run an automated accessibility and performance audit when tooling is available, then manually inspect the issues that matter.
10. Inspect the exported production site rather than relying only on the development server.
11. Verify direct navigation, refreshed routes, asset paths, downloadable documents, metadata, and the configured GitHub Pages base path.
12. Confirm that no section or factual content was lost during migration.

## Working Agreement

- Whatever actions you can do yourself, please do yourself. This includes starting apps and verification.
- Inspect the relevant legacy files, Next.js components, styles, data, and assets before making a change.
- Preserve unrelated user edits and avoid broad rewrites unless they are necessary for a coherent redesign.
- Prefer small, complete, reviewable changes while ensuring the final migration does not leave split sources of truth.
- When a design decision is not specified, choose the option that best improves clarity, distinctiveness, accessibility, and responsive behavior.
- Keep dependencies minimal and explain the value of each nontrivial production dependency.
- If a change would remove content, alter factual claims, add a paid service, collect visitor data, require a server, or change the approved deployment target, ask for approval first.
- Briefly document meaningful architectural decisions in `README.md` when they affect future development or deployment.
