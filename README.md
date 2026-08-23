# David Yuchen Wang Portfolio

A modular Next.js portfolio that moves from a mountain lake into progressively deeper ocean environments, with a space-themed project deck above the landing scene.

## Stack

- Next.js App Router with static export
- React and strict TypeScript
- CSS Modules and global design tokens
- Motion for reduced-motion-aware scroll effects
- Phosphor Icons
- GitHub Pages deployment

## Local development

Use the pinned Node version, install dependencies, and start the development server:

```bash
nvm use
npm install
npm run dev
```

Open `http://localhost:3000`. The page intentionally initializes at the mountain landing. Scroll upward from there to reach the space section.

## Validation

```bash
npm run typecheck
npm run lint
npm run build
```

The production export is written to `out/`.

## Adding a project

Add a typed entry to `data/projects.ts`. The homepage archive and a static `/projects/[slug]/` detail page are generated from the same data, so no route or modal markup needs to be duplicated.

Project media belongs under `public/assets/`. Preserve original documents and photography when adding optimized derivatives.

## Deployment

Pushes to `main` run the GitHub Pages workflow in `.github/workflows/deploy.yml`. In the repository settings, Pages must use **GitHub Actions** as its source.
