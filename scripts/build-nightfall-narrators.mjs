// Shared, content-addressed Chinese scripts. Existing recordings remain untouched.
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root = new URL('../public/assets/', import.meta.url);
const read = async game => JSON.parse(await readFile(new URL(`${game}/audio/manifest.json`, root), 'utf8'));
const libraries = Object.fromEntries(await Promise.all(['werewolf','one-night','nightfall'].map(async game => [game, await read(game)])));
const lines = {}, games = {}, kokoro = {};
for (const game of ['werewolf','one-night']) {
  games[game] = {};
  for (const [key, clip] of Object.entries({...libraries[game].clips, ...libraries.nightfall.clips})) {
    if (!key.startsWith('zh:')) continue;
    const id = createHash('sha256').update(clip.text).digest('hex').slice(0,16);
    if (lines[id] && lines[id] !== clip.text) throw new Error('Text hash collision');
    lines[id] = clip.text;
    games[game][key.slice(3)] = id;
    if (clip.provider === 'Kokoro' || game === 'one-night' || key in libraries.nightfall.clips) kokoro[id] = clip.src;
  }
}
const narrators = [
  {id:'m10', sample:'M10', referenceSeconds:4.6, name:{zh:'暗夜绅士',en:'Night Gentleman'}, gender:'male'},
  {id:'m07', sample:'M07', referenceSeconds:4.0, name:{zh:'儒雅电台',en:'Midnight Radio'}, gender:'male'},
  {id:'m04', sample:'M04', referenceSeconds:3.2, name:{zh:'冷静侦探',en:'Cool Detective'}, gender:'male'},
  {id:'f13', sample:'F13', referenceSeconds:3.6, name:{zh:'温厚长者',en:'Wise Storyteller'}, gender:'female'},
  {id:'f12', sample:'F12', referenceSeconds:5.1, name:{zh:'烟嗓侦探',en:'Smoky Detective'}, gender:'female'},
  {id:'f18', sample:'F18', referenceSeconds:3.3, name:{zh:'新闻主播',en:'News Anchor'}, gender:'female'},
];
const folder = new URL('nightfall/narrators/', root);
await mkdir(folder, {recursive:true});
await writeFile(new URL('catalogue.json',folder), JSON.stringify({narrators,games,lines,kokoro},null,2)+'\n');
console.log(`${Object.keys(lines).length} unique Chinese scripts × ${narrators.length} reference voices; ${Object.keys(lines).filter(id=>!kokoro[id]).length} additional Kokoro clips.`);
