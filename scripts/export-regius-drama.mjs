import { regiusStories } from '../data/codexRegius.ts';
import { storyNarration } from '../lib/regiusNarration.ts';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const stories = regiusStories.filter(s => s.drama).map(story => {
 const sections = storyNarration(story);
 const legacy = JSON.parse(readFileSync(`data/codex-regius-audio/${story.slug}.json`, 'utf8'));
 return {slug:story.slug,title:story.subtitle,sections,textHash:createHash('sha256').update(JSON.stringify(sections)).digest('hex'),music:legacy.music,
 norseClips:legacy.clips.filter(c => c.lang === 'non')};
});
console.log(JSON.stringify(stories));
