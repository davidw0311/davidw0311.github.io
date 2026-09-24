"""Generate only the new public announcements; preserve all existing Brian clips.
Run with ~/.local/share/kokoro/.venv/bin/python scripts/generate-werewolf-kokoro.py
Requires Kokoro and SoundFile with MP3 support. No cloud API keys or services are used.
"""
import hashlib
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
os.environ.setdefault('HF_HOME', str(Path.home() / '.local/share/kokoro/models'))
os.environ.setdefault('HF_HUB_DISABLE_TELEMETRY', '1')
os.environ.setdefault('TOKENIZERS_PARALLELISM', 'false')
import numpy as np
import soundfile as sf
import torch
from kokoro import KPipeline

torch.set_num_threads(4)
folder = ROOT / 'public/assets/werewolf/audio'
manifest_path = folder / 'manifest.json'
manifest = json.loads(manifest_path.read_text())
texts = json.loads((folder.parent / 'announcement-text.json').read_text())
settings = {'en': ('hexgrad/Kokoro-82M', 'am_michael', 'a'), 'zh': ('hexgrad/Kokoro-82M-v1.1-zh', 'zm_010', 'z')}
for language, (repo, voice, code) in settings.items():
    pipeline = None
    for cue, translations in texts.items():
        text = translations[0 if language == 'en' else 1]
        key = f'{language}:{cue}'
        fingerprint = hashlib.sha256(json.dumps([repo, voice, 1.0, text], ensure_ascii=False).encode()).hexdigest()
        previous = manifest['clips'].get(key)
        path = folder / language / f'{cue}.mp3'
        if previous and previous.get('provider') != 'Kokoro':
            raise RuntimeError(f'Refusing to replace an existing non-Kokoro recording: {key}')
        if previous and previous.get('textHash') == fingerprint and path.exists():
            continue
        if pipeline is None:
            pipeline = KPipeline(lang_code=code, repo_id=repo, device='cpu')
        chunks = [result.audio.numpy() for result in pipeline(text, voice=voice, speed=1.0) if result.audio is not None]
        audio = np.concatenate(chunks)
        if not np.isfinite(audio).all() or np.max(np.abs(audio)) < .01:
            raise RuntimeError(f'Invalid audio for {key}')
        # Peak-normalize without clipping; MP3 is encoded by libsndfile locally.
        audio *= .85 / np.max(np.abs(audio))
        temporary = path.with_suffix('.partial.mp3')
        sf.write(temporary, audio, 24000, format='MP3', subtype='MPEG_LAYER_III')
        decoded, sample_rate = sf.read(temporary)
        duration = len(decoded) / sample_rate
        if not 0 < duration < 45 or not np.isfinite(decoded).all():
            raise RuntimeError(f'Invalid encoded audio for {key}')
        temporary.replace(path)
        manifest['clips'][key] = {'src': '/assets/werewolf/audio/'+language+'/'+cue+'.mp3', 'text': text, 'duration': duration, 'textHash': fingerprint, 'provider':'Kokoro', 'voice':voice, 'model':repo, 'speed':1.0}
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
        print(f'{key}: {duration:.2f}s ({voice})', flush=True)
# Top-level metadata describes the mixed library; original entries inherit Brian.
manifest['provider'] = 'Microsoft Azure AI Speech + local Kokoro'
manifest['additionalVoices'] = {'en':'am_michael', 'zh':'zm_010'}
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
