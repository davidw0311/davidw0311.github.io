/** Import a rating-stratified CC0 Lichess bank from a local CSV.zst (a prefix is sufficient).
 * Usage: node scripts/import-chess-puzzles.mjs /tmp/lichess_db_puzzle.csv.zst
 */
import { spawn } from 'node:child_process';
import { access, mkdir, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { Chess } from 'chess.js';
const path = process.argv[2];
if (!path) throw new Error('Pass a downloaded Lichess CSV.zst file. Source: https://database.lichess.org/');
if (!process.argv.includes('--replace')) {
  let exists = false;
  try { await access('public/assets/chess/puzzles/manifest.json'); exists = true; } catch {}
  if (exists) throw new Error('The released bank uses stable progress indexes. Preserve v1 and migrate progress before replacing it. Pass --replace only for a planned migration.');
}
const buckets = Array.from({ length: 28 }, () => []);
const limit = 500;
// zstd supports concatenated pzstd frames and accepts a truncated byte-range download.
const decoder = spawn('zstd', ['-dc', path], { stdio: ['ignore', 'pipe', 'ignore'] });
decoder.on('error', error => { console.error('Could not start zstd:', error.message); process.exitCode = 1; });
const lines = createInterface({ input: decoder.stdout, crlfDelay: Infinity });
for await (const lineText of lines) {
      const row = lineText.trim().split(',');
      const [id, fen, moves, rating, deviation, popularity, plays, themes, gameUrl] = row;
      const r = Number(rating), bucket = Math.floor((r - 400) / 100);
      if (!id || !Number.isFinite(r) || bucket < 0 || bucket >= buckets.length || buckets[bucket].length >= limit || Number(popularity) < 85 || Number(plays) < 100 || Number(deviation) > 85) continue;
      const line = moves.split(' ');
      try { const game = new Chess(fen); for (const move of line) game.move(move); } catch { continue; }
      buckets[bucket].push({ id, fen, moves: line, rating: r, themes: themes.split(' '), gameUrl });
  if (buckets.every(bucket => bucket.length >= limit)) { lines.close(); decoder.kill(); break; }
}
if (buckets.reduce((n, b) => n + b.length, 0) < 1000) throw new Error('Too few valid puzzles. Check the archive and zstd installation.');
await mkdir('public/assets/chess/puzzles', { recursive: true });
const all = [];
for (let i = 0; i < buckets.length; i++) {
  const puzzles = buckets[i]; all.push(...puzzles);
  if (puzzles.length) await writeFile(`public/assets/chess/puzzles/${400 + i * 100}.json`, JSON.stringify(puzzles));
}
let offset = 0;
const manifest = { source: 'https://database.lichess.org/', license: 'CC0-1.0', count: all.length, buckets: buckets.map((b, i) => { const row = { rating: 400 + i * 100, count: b.length, offset }; offset += b.length; return row; }).filter(b => b.count) };
await writeFile('public/assets/chess/puzzles/manifest.json', JSON.stringify(manifest));
console.log(JSON.stringify(manifest, null, 2));
