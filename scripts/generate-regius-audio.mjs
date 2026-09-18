// Node 24 and afinfo (macOS) or ffprobe required. Only the first three stories are authorized.
// Credentials stay in this generation process, never in the website or files.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { writeFile, mkdir, stat, rename } from 'node:fs/promises';
import path from 'node:path';
import { regiusStories } from '../data/codexRegius.ts';
import { storyNarration } from '../lib/regiusNarration.ts';
const voice = 'en-US-AdamMultilingualNeural';
const region = process.env.AZURE_SPEECH_REGION || 'southeastasia';
const target = process.argv.find(arg => arg.startsWith('--story='))?.split('=')[1];
const stories = regiusStories.slice(0, 3).filter(story => !target || story.slug === target);
if (!stories.length) throw new Error('Choose one of the first three stories.');
const key = process.env.AZURE_SPEECH_KEY || JSON.parse(execFileSync('az', ['cognitiveservices','account','keys','list','--name','SpeechLab','--resource-group','SpeechLab','-o','json'], {encoding:'utf8',stdio:['ignore','pipe','pipe']})).key1;
const escape = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
const delay = ms => new Promise(resolve => setTimeout(resolve,ms));
const durationOf = file => process.platform === 'darwin' ? Number(execFileSync('afinfo',[file],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).match(/estimated duration: ([\d.]+)/)?.[1]) : Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',file],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim());
let lastRequest = 0;
await mkdir('data/codex-regius-audio', {recursive:true});
for (const story of stories) {
 const sections = storyNarration(story);
 const hash = createHash('sha256').update(JSON.stringify(sections)).digest('hex');
 const folder = `/audio/codex-regius/v1/${story.slug}/${hash.slice(0,12)}`;
 await mkdir(path.join('public',folder), {recursive:true});
 const clips = [];
 for (const [sectionIndex,section] of sections.entries()) {
  for (const [partIndex,part] of section.parts.entries()) {
   const src = `${folder}/${sectionIndex}-${partIndex}.mp3`;
   const file = path.join('public',src);
   let duration = 0;
   try { if (durationOf(`${file}.partial`) > 0) await rename(`${file}.partial`,file); } catch { /* No recoverable partial clip. */ }
   try { if ((await stat(file)).size > 1000) duration = durationOf(file); } catch { /* Missing clip. */ }
   if (!(duration > 0)) {
    const wait = 3300 - (Date.now() - lastRequest); if (wait > 0) await delay(wait);
    lastRequest = Date.now();
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="${voice}"><lang xml:lang="${part.lang === 'non' ? 'is-IS' : 'en-US'}"><p>${escape(part.text)}</p></lang></voice></speak>`;
    const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {method:'POST',headers:{'Ocp-Apim-Subscription-Key':key,'Content-Type':'application/ssml+xml','X-Microsoft-OutputFormat':'audio-24khz-96kbitrate-mono-mp3'},body:ssml,signal:AbortSignal.timeout(120000)});
    if (!response.ok) throw new Error(`Speech generation failed (HTTP ${response.status}). Completed clips are cached.`);
    const temporary = `${file}.partial`;
    await writeFile(temporary,Buffer.from(await response.arrayBuffer()));
    duration = durationOf(temporary);
    if (!(duration > 0 && duration < 590)) throw new Error('Invalid audio duration.');
    await rename(temporary,file);
   }
   clips.push({section:sectionIndex,part:partIndex,lang:part.lang,src,duration});
  }
  console.log(`${story.slug}: section ${sectionIndex+1}/${sections.length}`);
 }
 await writeFile(`data/codex-regius-audio/${story.slug}.json`,JSON.stringify({voice,label:'Deep storyteller',textHash:hash,clips},null,2)+'\n');
 console.log(`Complete: ${story.slug} · ${clips.length} passages`);
}
