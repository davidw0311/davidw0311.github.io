"""Mix licensed recordings for Völuspá. See docs/codex-regius-audio.md.

Usage: python3 scripts/mix-voluspa-music.py Mjolnir.mp3 Vopna.mp3
Requires NumPy, SciPy and SoundFile with MP3 support.
"""
import sys
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
from math import gcd

RATE = 24000


def recording(path):
    audio, rate = sf.read(path, dtype="float32", always_2d=True)
    mono = audio.mean(axis=1)
    divisor = gcd(rate, RATE)
    mono = resample_poly(mono, RATE // divisor, rate // divisor)
    # Match the existing accompaniment level; the player's gain remains separate.
    mono *= min(.11 / np.sqrt(np.mean(mono ** 2)), .7 / np.max(np.abs(mono)))
    return mono


first, second = map(recording, sys.argv[1:3])
overlap = 8 * RATE
fade = np.linspace(0, 1, overlap, dtype=np.float32)
transition = first[-overlap:] * np.cos(fade * np.pi / 2) + second[:overlap] * np.sin(fade * np.pi / 2)
mix = np.concatenate([first[:-overlap], transition, second[overlap:]])
edge = RATE
mix[:edge] *= np.linspace(0, 1, edge)
mix[-edge:] *= np.linspace(1, 0, edge)
destination = Path("public/audio/codex-regius/music/voluspa-nordic-v1.mp3")
sf.write(destination, mix, RATE, format="MP3", subtype="MPEG_LAYER_III")
print(f"{destination}: {len(mix) / RATE:.1f}s, peak {np.max(np.abs(mix)):.3f}")
