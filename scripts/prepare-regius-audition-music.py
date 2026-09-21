"""Rebuild the ten licensed excerpts described in data/regiusAuditionMusic.json.
Requires NumPy, SciPy and SoundFile. Caches original downloads in /tmp.
"""
from pathlib import Path
from urllib.request import urlopen
from hashlib import sha256
from math import gcd
import json
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

for track in json.loads(Path('data/regiusAuditionMusic.json').read_text()):
    original = Path('/tmp') / f"regius-{track['id']}-source.mp3"
    if not original.exists():
        with urlopen(track['source'], timeout=90) as response:
            original.write_bytes(response.read())
    if sha256(original.read_bytes()).hexdigest() != track['sourceSha256']:
        raise ValueError(f"Source changed: {track['name']}; review before regenerating")
    audio, rate = sf.read(original, dtype='float32', always_2d=True)
    start = track['excerptStart'] * rate
    audio = audio[start:start + 60 * rate].mean(axis=1)
    divisor = gcd(rate, 24000)
    audio = resample_poly(audio, 24000 // divisor, rate // divisor)
    audio *= min(.11 / np.sqrt(np.mean(audio * audio)), .7 / np.max(np.abs(audio)))
    audio[:24000] *= np.linspace(0, 1, 24000)
    audio[-48000:] *= np.linspace(1, 0, 48000)
    destination = Path('public' + track['src'])
    destination.parent.mkdir(parents=True, exist_ok=True)
    sf.write(destination, audio, 24000, format='MP3', subtype='MPEG_LAYER_III')
    print(track['name'])
