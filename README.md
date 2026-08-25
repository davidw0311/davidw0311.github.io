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

## Language Lab audio

The Language Lab keeps its MVP lesson catalog and 782 Azure neural voice clips in the static site. It includes normal and slow sentence readings plus each tappable phrase in English, Mandarin, Cantonese, Japanese, Korean, Malay, French, Spanish, and Tamil. The lesson setup and full interface can also be displayed in any of those nine languages. The clips can be regenerated with the existing Azure Speech resource without exposing its key to the browser:

```bash
AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=southeastasia npm run generate:language-audio -- --force
```

Learner recordings still go through the small Azure Function described in `api/README.md`; generated example audio does not require a function call at playback time.

## Adding a project

Add a typed entry to `data/projects.ts`. The homepage archive and a static `/projects/[slug]/` detail page are generated from the same data, so no route or modal markup needs to be duplicated.

Project media belongs under `public/assets/`. Preserve original documents and photography when adding optimized derivatives.

## Deployment

Pushes to `main` run the GitHub Pages workflow in `.github/workflows/deploy.yml`. The build also synchronizes the static export to the repository root so the site remains deployable when Pages is configured to publish from the `main` branch.
