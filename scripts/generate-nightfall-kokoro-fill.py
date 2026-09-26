"""Fill the classic Chinese cues that previously existed only in Brian's voice.
Run in the existing Kokoro venv after the Qwen batch to keep memory use bounded.
"""
import hashlib
import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
os.environ.setdefault('HF_HOME',str(Path.home()/'.local/share/kokoro/models'))
os.environ.setdefault('HF_HUB_DISABLE_TELEMETRY','1')
import numpy as np
import soundfile as sf
import torch
from kokoro import KPipeline

torch.set_num_threads(4)
folder=ROOT/'public/assets/nightfall/narrators'
catalogue=json.loads((folder/'catalogue.json').read_text())
output=folder/'kokoro'; output.mkdir(exist_ok=True)
path=folder/'kokoro-manifest.json'
manifest=json.loads(path.read_text()) if path.exists() else {'model':'hexgrad/Kokoro-82M-v1.1-zh','voice':'zm_010','clips':{}}
pipeline=None
def spoken_number(match):
    n=int(match.group());digits='零一二三四五六七八九'
    if n<10:return digits[n]
    if n<100:return (digits[n//10] if n>=20 else '')+'十'+(digits[n%10] if n%10 else '')
    return match.group()

for line_id,text in catalogue['lines'].items():
    if line_id in catalogue['kokoro']: continue
    target=output/f'{line_id}.mp3'
    # Spell Chinese seat numbers out for G2P; short Arabic-number calls can
    # otherwise acquire English-like phonemes in the Mandarin model.
    spoken_text=re.sub(r'\d+',spoken_number,text)
    if re.fullmatch(r'\d+号。',text): spoken_text=spoken_text.replace('号。','号玩家。')
    if line_id in manifest['clips'] and manifest['clips'][line_id].get('generationText',text)==spoken_text and target.exists(): continue
    if pipeline is None: pipeline=KPipeline(lang_code='z',repo_id=manifest['model'],device='cpu')
    audio=np.concatenate([result.audio.numpy() for result in pipeline(spoken_text,voice='zm_010',speed=1.0) if result.audio is not None])
    if not np.isfinite(audio).all() or np.max(np.abs(audio))<.01: raise RuntimeError(text)
    audio*=min(.085/max(float(np.sqrt(np.mean(audio*audio))),1e-8),.92/float(np.max(np.abs(audio))),4)
    temp=target.with_suffix('.partial.mp3'); sf.write(temp,audio,24000,format='MP3',subtype='MPEG_LAYER_III')
    decoded,sr=sf.read(temp)
    if not np.isfinite(decoded).all() or len(decoded)<sr/4: raise RuntimeError('Invalid MP3')
    temp.replace(target)
    manifest['clips'][line_id]={'text':text,'generationText':spoken_text,'duration':round(len(decoded)/sr,3),'src':f'/assets/nightfall/narrators/kokoro/{line_id}.mp3','textHash':hashlib.sha256(text.encode()).hexdigest(),'fingerprint':hashlib.sha256(json.dumps([manifest['model'],'zm_010',text,spoken_text],ensure_ascii=False).encode()).hexdigest()}
    partial=path.with_suffix('.partial.json');partial.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');partial.replace(path)
    print(f'{len(manifest["clips"])}: {text}',flush=True)
