"""Generate reference-locked English drama recordings; resumable and safe to recast.

Run with the local Qwen venv and Node 24 on PATH. --character regenerates every
use of that character across the three scripts; valid cached clips are reused.
Reference bytes are verified against the immutable voice registry before use.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import time

import mlx.core as mx
import numpy as np
import soundfile as sf
from mlx_audio.tts.utils import load_model

ROOT = Path(__file__).resolve().parents[1]
MODEL = 'mlx-community/Qwen3-TTS-12Hz-1.7B-Base-4bit'
FOLDER = ROOT/'public/audio/codex-regius/cast-v1'
CACHE = ROOT/'data/regiusDramaGeneration.json'

def digest(value):
    return hashlib.sha256(json.dumps(value,ensure_ascii=False,sort_keys=True).encode()).hexdigest()

def atomic_json(path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    temp=path.with_suffix('.partial.json')
    temp.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n');temp.replace(path)

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--character',help='Stable character ID; updates this role in every story')
    parser.add_argument('--batch-size',type=int,default=3)
    parser.add_argument('--retry',default='',help='Comma-separated slug:section:part keys; reroll only these clips')
    args=parser.parse_args()
    registry=json.loads((ROOT/'data/regiusVoiceRegistry.json').read_text())
    assert registry['model']==MODEL
    if args.character and args.character not in registry['characters']: raise ValueError('Unknown character')
    stories=json.loads(subprocess.check_output(['node','--no-warnings','scripts/export-regius-drama.mjs'],cwd=ROOT))
    FOLDER.mkdir(parents=True,exist_ok=True)
    cache=json.loads(CACHE.read_text()) if CACHE.exists() else {'model':MODEL,'clips':{},'retries':{}}
    retry=set(filter(None,args.retry.split(',')))
    jobs=[]
    for story in stories:
        for i,section in enumerate(story['sections']):
            for j,part in enumerate(section['parts']):
                if part['lang']!='en': continue
                char=part['character'];voice_id=registry['characters'][char]['voiceId'];voice=registry['voices'][voice_id]
                key=f"{story['slug']}:{i}:{j}"
                if key in retry: cache['retries'][key]=cache['retries'].get(key,0)+1
                attempt=cache['retries'].get(key,0)
                settings={'model':MODEL,'referenceHash':voice['sha256'],'referenceText':voice['referenceText'],'text':part['text'],'voiceId':voice_id,'temperature':.6,'retry':attempt,'normalization':'rms-0.085-peak-0.92','tailSilence':.35}
                fingerprint=digest(settings)
                jobs.append(dict(key=key,slug=story['slug'],section=i,part=j,text=part['text'],character=char,voiceId=voice_id,referenceHash=voice['sha256'],fingerprint=fingerprint,src=f'/audio/codex-regius/cast-v1/{fingerprint[:24]}.mp3'))
    unknown=retry-{j['key'] for j in jobs}
    if unknown: raise ValueError(f'Unknown retry keys {unknown}')
    atomic_json(CACHE,cache)
    model=None
    for char,character in registry['characters'].items():
        if args.character and args.character!=char: continue
        voice=registry['voices'][character['voiceId']]
        ref_path=ROOT/'public'/voice['reference'].lstrip('/')
        if hashlib.sha256(ref_path.read_bytes()).hexdigest()!=voice['sha256']: raise RuntimeError(f'Reference changed for {char}; create a new voice ID instead')
        pending=[j for j in jobs if j['character']==char and (not retry or j['key'] in retry) and (cache['clips'].get(j['key'],{}).get('fingerprint')!=j['fingerprint'] or not (ROOT/'public'/j['src'].lstrip('/')).exists())]
        pending.sort(key=lambda j:(len(j['text']),j['key']))
        print(char,len(pending),'clips pending',flush=True)
        if not pending: continue
        if model is None: model=load_model(str(Path.home()/'.local/share/qwen3-tts/base-model'))
        reference,sr=sf.read(ref_path,dtype='float32');assert sr==model.sample_rate
        for offset in range(0,len(pending),args.batch_size):
            batch=pending[offset:offset+args.batch_size]
            mx.random.seed(int(batch[0]['fingerprint'][:8],16))
            started=time.monotonic(); completed=set()
            for result in model.batch_generate(texts=[j['text'] for j in batch],ref_audio=mx.array(reference),ref_text=voice['referenceText'],lang_code='English',temperature=.6,max_tokens=1400,verbose=False):
                job=batch[result.sequence_idx];a=np.asarray(result.audio,dtype=np.float32).copy();rate=result.sample_rate
                if not np.isfinite(a).all() or abs(a).max()<.005 or not .5<len(a)/rate<105: raise RuntimeError(f'Invalid audio {job["key"]}')
                a*=min(.085/max(float(np.sqrt(np.mean(a*a))),1e-8),.92/float(abs(a).max()),4)
                a=np.concatenate([a,np.zeros(round(.35*rate),dtype=np.float32)])
                target=ROOT/'public'/job['src'].lstrip('/');tmp=target.with_suffix('.partial.mp3')
                sf.write(tmp,a,rate,format='MP3',subtype='MPEG_LAYER_III')
                decoded,sr=sf.read(tmp)
                assert np.isfinite(decoded).all() and abs(decoded).max()<1
                tmp.replace(target)
                cache['clips'][job['key']]={**job,'duration':round(len(decoded)/sr,3),'audioHash':hashlib.sha256(target.read_bytes()).hexdigest()}
                atomic_json(CACHE,cache);completed.add(result.sequence_idx)
            if len(completed)!=len(batch): raise RuntimeError('Missing generation')
            print(char,offset+len(batch),'/',len(pending),round(time.monotonic()-started,1),'sec',flush=True);mx.clear_cache()
    # Do not publish a manifest unless every clip matches the current script and cast.
    for story in stories:
        english=[]
        for job in [j for j in jobs if j['slug']==story['slug']]:
            clip=cache['clips'].get(job['key'])
            if not clip or clip['fingerprint']!=job['fingerprint']:
                raise RuntimeError(f'Incomplete cast. Run again without --character to generate {job["key"]}')
            english.append({**clip,'lang':'en','voice':clip['voiceId'],'speaker':registry['characters'][clip['character']]['name']})
        norse=story['norseClips']
        assert len(norse)==sum(p['lang']=='non' for s in story['sections'] for p in s['parts'])
        cast={c:dict(name=registry['characters'][c]['name'],voiceId=registry['characters'][c]['voiceId'],referenceHash=registry['voices'][registry['characters'][c]['voiceId']]['sha256']) for c in sorted({j['character'] for j in english})}
        result={'format':'drama','voice':MODEL,'label':'Qwen3-TTS · character voices','textHash':story['textHash'],'cast':cast,'clips':sorted(english+norse,key=lambda c:(c['section'],c['part']))}
        if story.get('music'): result['music']=story['music']
        atomic_json(ROOT/f"data/codex-regius-drama-audio/{story['slug']}.json",result)
        print(story['slug'],'ready:',round(sum(c['duration'] for c in english)/60,1),'English minutes',flush=True)

if __name__=='__main__': main()
