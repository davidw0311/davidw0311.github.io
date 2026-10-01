import { cp, mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Run after a production build. Refuse to overwrite any existing destination.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'out');
const destination = process.argv[2] && resolve(process.argv[2]);
if (!destination) throw new Error('Usage: node scripts/export-firestar-v1.mjs /path/to/new-export-directory');
await stat(resolve(out, 'projects/firestar/v1/kitchen-viewer/index.html'));
await mkdir(destination, { recursive: false });
for (const path of ['projects/firestar/v1', 'assets/firestar', '_next/static', 'assets/favicon.ico']) {
  await cp(resolve(out, path), resolve(destination, path), { recursive: true });
}
await writeFile(resolve(destination, 'index.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Firestar (infinite) granite</title><meta http-equiv="refresh" content="0;url=/projects/firestar/v1/"><a href="/projects/firestar/v1/">Open Firestar</a></html>\n');
await writeFile(resolve(destination, '.nojekyll'), '');
await writeFile(resolve(destination, 'HOSTING.txt'), `Serve this entire directory as the root of a static website. No Node server or InfiniteGranite project is required at runtime.
Keep the projects/firestar/v1, assets, and _next directories in place. The root redirects to V1; the kitchen viewer is at /projects/firestar/v1/kitchen-viewer/.
Use a web server (HTTP/HTTPS), not file://. For a local check: python3 -m http.server 8080 --directory ${destination}
Before a permanent domain migration, update the source app/layout.tsx metadataBase, analytics settings and the portfolio-return link in components/firestar/Site.tsx, rebuild and export again. Supplier, Google review, telephone and email links intentionally remain external.
`);
console.log(`Standalone Firestar V1 exported to ${destination}`);
