# Codex Regius reader

The user supplied this collection through https://chatgpt.com/share/6aa4e0f4-0a50-83ec-95fb-a3ffb640060d.
The PDF linked inside that conversation is preserved at `public/assets/codex-regius/codex-regius-short-stories.pdf`.

`data/codexRegius.ts` contains all 31 entries from pages 3–33, in the original order. The source has 29 poem entries and two prose bridges, totaling 5,711 prose words. Text extraction joins PDF line wraps and retains the source's two paragraphs per entry, spelling, punctuation, and selected Old Norse excerpts. These are AI-generated modern retellings, not scholarly translations; no historical corrections or silent rewrites were applied.

The nine distinct illustrations were extracted from the original PDF and converted to WebP. Helgi's illustration appears on two stories, as in the PDF. The original illustrations are preserved rather than replaced with new artwork. EB Garamond is self-hosted under the included SIL Open Font License.

Each story is a static route. The reader supports day/night themes, three text sizes, a search index, category filters, previous/next navigation, and a browser-local last-opened-story link. Font size and theme last while the collection layout is mounted. The last story persists in browser storage; reading remains available when storage is blocked. No account or server is required.

Run `node --no-warnings --test tests/codexRegius.test.ts`, scoped ESLint, and `next build --webpack`. Use `next build` directly during local verification to avoid the repository's root-export synchronization script modifying unrelated generated files. GitHub Pages builds and publishes the `out` directory through the existing deployment workflow.
