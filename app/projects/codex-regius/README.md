# Codex Regius reader

The user supplied this collection through https://chatgpt.com/share/6aa4e0f4-0a50-83ec-95fb-a3ffb640060d.
The PDF linked inside that conversation is preserved at `public/assets/codex-regius/codex-regius-short-stories.pdf`.

`data/codexRegius.ts` retains all 31 entries from pages 3–33 in their original order: 29 poem entries and two prose bridges. The user subsequently requested longer retellings closer to the manuscript. Expanded prose now lives in `data/codex-regius/`, checked against the linked normalized Old Norse editions and Henry Adams Bellows's public-domain 1923 translation. Most full narratives are seven to eight minutes at 170 English words per minute; shorter poems, fragments and prose bridges remain proportionate to their sources. Reading times include the English quotations and exclude editorial notes and the Norse text.

These are modern prose retellings, not literal translations or a diplomatic transcription of the manuscript. Each entry has intermittent Old Norse quotations, new English renderings beneath them, source links, stanza references and an editorial note. Normalized spelling and stanza numbering follow each linked Norse edition. The retellings retain differences between parallel poems and do not fill the Great Lacuna with episodes from later saga witnesses. In particular, Sigrdrífumál stops at the manuscript break; Brot distinguishes the surviving fragment from verses recovered in other witnesses. Some printed editions assemble variant material differently, as explained in the relevant entry notes.

The downloadable PDF remains the original short edition, clearly labeled on the collection page. It is not a PDF of the expanded web edition.

The nine distinct illustrations were extracted from the original PDF and converted to WebP. Helgi's illustration appears on two stories, as in the PDF. The original illustrations are preserved rather than replaced with new artwork. EB Garamond is self-hosted under the included SIL Open Font License.

Each story is a static route. The reader supports day/night themes, three text sizes, full-prose search, category filters, previous/next navigation, and a browser-local last-opened-story link. Story prose is server-rendered; shared reader controls do not import the whole collection into their client bundle. Font size and theme last while the collection layout is mounted. The last story persists in browser storage; reading remains available when storage is blocked. No account or server is required.

Run `node --no-warnings --test tests/codexRegius.test.ts`, scoped ESLint, and `next build --webpack`. Use `next build` directly during local verification to avoid the repository's root-export synchronization script modifying unrelated generated files. GitHub Pages builds and publishes the `out` directory through the existing deployment workflow.
