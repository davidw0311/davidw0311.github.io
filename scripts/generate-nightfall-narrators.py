"""Generate all six user-selected synthetic voices from their saved references.

Use the local Qwen3-TTS venv; --model must be a Base model (not VoiceDesign).
Small batches reuse one reference; atomic manifests make interrupted runs resumable.
No reference or text is sent to a cloud speech service.
"""
import argparse
import hashlib
import json
import time
from pathlib import Path

import mlx.core as mx
import numpy as np
import soundfile as sf
from mlx_audio.tts.utils import load_model

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'public/assets/nightfall/narrators'
MODEL = 'mlx-community/Qwen3-TTS-12Hz-1.7B-Base-4bit'

def atomic_json(path, value):
    temp = path.with_suffix('.partial.json')
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')
    temp.replace(path)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', default=str(Path.home()/'.local/share/qwen3-tts/base-model'))
    parser.add_argument('--references', default=str(Path.home()/'Downloads/werewolf-tts-samples/chinese-20-voices'))
    parser.add_argument('--voices', default='m10,m07,m04,f13,f12,f18')
    parser.add_argument('--batch-size', type=int, default=4)
    parser.add_argument('--limit', type=int, default=0)
    parser.add_argument('--retry-keys', default='', help='Comma-separated voice:line IDs to regenerate with a fresh seed; run only after the main generator exits.')
    args = parser.parse_args()
    catalogue = json.loads((FOLDER/'catalogue.json').read_text())
    references = Path(args.references)
    samples = {row['id']: row for row in json.loads((references/'voices.json').read_text())}
    path = FOLDER/'manifest.json'
    manifest = json.loads(path.read_text()) if path.exists() else {'model':MODEL,'provider':'Qwen3-TTS reference voices','clips':{}}
    overrides_path = ROOT/'scripts/nightfall-narrator-overrides.json'
    overrides = json.loads(overrides_path.read_text()) if overrides_path.exists() else {}
    retry_keys = set(filter(None,args.retry_keys.split(',')))
    for key in retry_keys:
        voice_id, line_id = key.split(':')
        assert voice_id in [v['id'] for v in catalogue['narrators']] and line_id in catalogue['lines'],key
        overrides[key] = {'temperature':0.55,'seed':overrides.get(key,{}).get('seed',1700)+1}
    if retry_keys: atomic_json(overrides_path,overrides)
    print('Loading local Base model', flush=True)
    model = load_model(args.model)
    for voice in catalogue['narrators']:
        if voice['id'] not in args.voices.split(','): continue
        sample = samples[voice['sample']]
        reference = references/sample['file']
        source_hash = hashlib.sha256(reference.read_bytes()).hexdigest()
        # Use the first complete sentence, ending in its measured silent gap.
        # Full audition clips contain ~20s; decoding that entire prefix for every
        # short command wastes work without improving this reference voice.
        reference_audio, reference_sr = sf.read(reference,dtype='float32')
        assert reference_sr == model.sample_rate
        reference_audio = reference_audio[:round(voice['referenceSeconds']*reference_sr)]
        reference_hash = hashlib.sha256(reference_audio.tobytes()).hexdigest()
        reference_text = '夜幕降临，所有人请闭上眼睛。'
        reference_audio = mx.array(reference_audio)
        folder = FOLDER/voice['id']; folder.mkdir(exist_ok=True)
        # Similar lengths reduce padding work; stable ordering makes resumptions deterministic.
        pending = []
        for line_id, text in sorted(catalogue['lines'].items(), key=lambda item:(len(item[1]),item[0])):
            key = f"{voice['id']}:{line_id}"
            if retry_keys and key not in retry_keys: continue
            override = overrides.get(key)
            settings = [MODEL,reference_hash,reference_text,text,0.65]
            if override: settings.append(override)
            fingerprint = hashlib.sha256(json.dumps(settings,ensure_ascii=False).encode()).hexdigest()
            old = manifest['clips'].get(key)
            if old and old['fingerprint'] == fingerprint and (folder/f'{line_id}.mp3').exists(): continue
            pending.append((line_id,text,fingerprint,override))
        if args.limit: pending = pending[:args.limit]
        print(f"{voice['id']}: {len(pending)} recordings pending",flush=True)
        batch_size = 1 if any(item[3] for item in pending) else args.batch_size
        for offset in range(0,len(pending),batch_size):
            batch = pending[offset:offset+batch_size]
            override = batch[0][3]
            temperature = override['temperature'] if override else 0.65
            mx.random.seed(override['seed'] if override else sample['seed'] + offset)
            start = time.monotonic(); completed = set()
            for result in model.batch_generate(texts=[item[1] for item in batch],ref_audio=reference_audio,ref_text=reference_text,lang_code='Chinese',temperature=temperature,max_tokens=650,verbose=False):
                line_id,text,fingerprint,override = batch[result.sequence_idx]
                audio = np.asarray(result.audio,dtype=np.float32).copy()
                if not np.isfinite(audio).all() or np.max(np.abs(audio))<0.005: raise RuntimeError(f'Invalid audio: {voice["id"]}:{line_id}')
                duration = len(audio)/result.sample_rate
                if not 0.25 < duration < 42: raise RuntimeError(f'Unexpected duration {duration}: {text}')
                rms = float(np.sqrt(np.mean(audio*audio)))
                audio *= min(0.085/max(rms,1e-8),0.92/float(np.max(np.abs(audio))),4.0)
                target = folder/f'{line_id}.mp3'; temporary = folder/f'{line_id}.partial.mp3'
                sf.write(temporary,audio,result.sample_rate,format='MP3',subtype='MPEG_LAYER_III')
                decoded,sr=sf.read(temporary)
                if not np.isfinite(decoded).all() or len(decoded)<sr/4: raise RuntimeError('Invalid MP3')
                temporary.replace(target)
                manifest['clips'][f"{voice['id']}:{line_id}"] = {'text':text,'duration':round(len(decoded)/sr,3),'src':f'/assets/nightfall/narrators/{voice["id"]}/{line_id}.mp3','fingerprint':fingerprint,'referenceHash':reference_hash,'sourceReferenceHash':source_hash,'sample':voice['sample']}
                completed.add(result.sequence_idx)
                atomic_json(path,manifest)
            if len(completed)!=len(batch): raise RuntimeError('A batch omitted audio')
            print(f"{voice['id']} {offset+len(batch)}/{len(pending)} | {time.monotonic()-start:.1f}s | peak {mx.get_peak_memory()/1e9:.2f}GB",flush=True)
            mx.clear_cache()
    print(f"Complete: {len(manifest['clips'])} clips",flush=True)

if __name__=='__main__': main()
