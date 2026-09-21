// Generate only the opening paragraph, with ten genuinely different voices.
import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile,stat,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {regiusStories} from '../data/codexRegius.ts';
const paragraph=regiusStories[0].paragraphs[0];
const textHash=createHash('sha256').update(paragraph).digest('hex');
const choices=[
 ['brian','Brian','en-US-BrianMultilingualNeural','American · male · kept from your shortlist'],
 ['sonia','Sonia','en-GB-SoniaNeural','British · female · kept from your shortlist'],
 ['steffan','Steffan','en-US-SteffanNeural','American · male · mature, warm'],
 ['monica','Monica','en-US-MonicaNeural','American · female · mature, warm'],
 ['serena','Serena','en-US-SerenaMultilingualNeural','American · female · mature, composed'],
 ['christopher','Christopher','en-US-ChristopherNeural','American · male · deep, warm'],
 ['roger','Roger','en-US-RogerNeural','American · male · serious, measured'],
 ['elizabeth','Elizabeth','en-US-ElizabethNeural','American · female · authoritative, serious'],
 ['samuel','Samuel','en-US-SamuelMultilingualNeural','American · male · warm, expressive'],
 ['cora','Cora','en-US-CoraNeural','American · female · sincere, formal'],
];
const key=JSON.parse(execFileSync('az',['cognitiveservices','account','keys','list','--name','SpeechLab','--resource-group','SpeechLab','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']})).key1;
const folder=`/audio/codex-regius/auditions/v1/${textHash.slice(0,12)}`;
await mkdir(`public${folder}`,{recursive:true});
const durationOf=p=>Number(execFileSync('afinfo',[p],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).match(/estimated duration: ([\d.]+)/)?.[1]);
const escaped=paragraph.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const voices=[];
for(const [id,name,voice,description] of choices){
 const src=`${folder}/${id}.mp3`,file=`public${src}`;
 let duration=0;
 try{if((await stat(file)).size>1000)duration=durationOf(file);}catch{}
 if(!duration){
  if(id==='adam'){
   const original=JSON.parse(await readFile('data/codex-regius-audio/voluspa.json','utf8'));
   await writeFile(file,await readFile(`public${original.clips[0].src}`));
  }else{
   const lang=voice.slice(0,5);
   const body=`<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}"><voice name="${voice}"><p>${escaped}</p></voice></speak>`;
   const response=await fetch('https://southeastasia.tts.speech.microsoft.com/cognitiveservices/v1',{method:'POST',headers:{'Ocp-Apim-Subscription-Key':key,'Content-Type':'application/ssml+xml','X-Microsoft-OutputFormat':'audio-24khz-96kbitrate-mono-mp3'},body,signal:AbortSignal.timeout(120000)});
   if(!response.ok)throw Error(`Speech request failed: ${response.status}`);
   await writeFile(`${file}.partial`,Buffer.from(await response.arrayBuffer()));
   if(!durationOf(`${file}.partial`))throw Error('Invalid recording');
   await rename(`${file}.partial`,file);
   await new Promise(resolve=>setTimeout(resolve,3300));
  }
  duration=durationOf(file);
 }
 voices.push({id,name,voice,description,src,duration});console.log(`${name}: ${duration.toFixed(1)}s`);
}
await writeFile('data/regiusAuditionVoices.json',JSON.stringify({textHash,paragraph,voices},null,2)+'\n');
