"""One English Qwen3-TTS VoiceDesign scene, using the existing offline Werewolf runtime.
Run with ~/.local/share/qwen3-tts/venv/bin/python. Only this sample is generated.
"""
import json
from pathlib import Path
import hashlib
import time
import mlx.core as mx
import numpy as np
import soundfile as sf
from mlx_audio.tts.utils import load_model

ROOT=Path(__file__).resolve().parents[1]
manifest_path=ROOT/'data/regiusDramaSample.json'
manifest=json.loads(manifest_path.read_text())
folder=ROOT/'public/audio/codex-regius/drama-v1'
folder.mkdir(parents=True,exist_ok=True)
model_path=Path.home()/'.local/share/qwen3-tts/voice-design-model'
model=None
parts=[]
for line in manifest['lines']:
    fingerprint=hashlib.sha256(json.dumps([manifest['model'],line['text'],line['instruction'],line['seed'],.7],ensure_ascii=False).encode()).hexdigest()
    target=folder/f"{line['id']}.wav"
    if not target.exists() or line.get('fingerprint')!=fingerprint:
        if model is None:
            print('Loading the existing local Qwen3-TTS VoiceDesign model',flush=True)
            model=load_model(str(model_path))
        mx.random.seed(line['seed'])
        started=time.monotonic()
        chunks=[]
        for result in model.generate_voice_design(text=line['text'],instruct=line['instruction'],language='English',temperature=.7,max_tokens=900,verbose=False):
            chunks.append(np.asarray(result.audio,dtype=np.float32).copy())
            rate=result.sample_rate
        audio=np.concatenate(chunks)
        assert np.isfinite(audio).all() and np.max(np.abs(audio))>.005
        assert 2<len(audio)/rate<65
        audio*=min(.085/max(float(np.sqrt(np.mean(audio*audio))),1e-8),.92/float(np.max(np.abs(audio))),3)
        temporary=target.with_suffix('.partial.wav');sf.write(temporary,audio,rate,subtype='PCM_16');temporary.replace(target)
        line['generationSeconds']=round(time.monotonic()-started,2)
        print(line['speaker'],round(len(audio)/rate,2),'seconds of speech;',line['generationSeconds'],'seconds to generate',flush=True)
        mx.clear_cache()
    audio,rate=sf.read(target,dtype='float32')
    assert rate==24000
    line.update(src=f'/audio/codex-regius/drama-v1/{target.name}',duration=round(len(audio)/rate,3),fingerprint=fingerprint)
    line['start']=round(sum(len(p) for p in parts)/rate,3)
    parts.extend([audio,np.zeros(round(.7*rate),dtype=np.float32)])
    manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
combined=np.concatenate(parts[:-1])
output=folder/'voluspa-opening.mp3'
sf.write(output,combined,rate,format='MP3',subtype='MPEG_LAYER_III')
manifest.update(src='/audio/codex-regius/drama-v1/voluspa-opening.mp3',duration=round(len(combined)/rate,3))
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Sample ready:',manifest['duration'],'seconds',flush=True)
