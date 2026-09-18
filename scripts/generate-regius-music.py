"""Original instrumental score for this reader; no samples or third-party music.
Requires Python 3 and numpy. Writes a seamless 64-second, mono PCM loop.
"""
from pathlib import Path
import wave
import numpy as np

RATE, SECONDS = 24000, 64
count = RATE * SECONDS
mix = np.zeros(count, dtype=np.float64)
rng = np.random.default_rng(829)

def frequency(midi):
    return 440 * 2 ** ((midi - 69) / 12)

def add(note, start, duration, amplitude, bowed=False):
    t = np.arange(int(duration * RATE)) / RATE
    f = frequency(note)
    tone = np.zeros_like(t)
    for h in range(1, 13):
        # Soft, slightly inharmonic plucked strings; slow vibrato in the pad.
        phase = 2 * np.pi * f * h * t + (0.035 * h * np.sin(2 * np.pi * 4.1 * t) if bowed else 0)
        if not bowed:
            phase += 2 * np.pi * f * h * (0.000025 * h * h) * t
        decay = np.exp(-t * (0.55 + h * .19)) if not bowed else 1
        tone += np.sin(phase + rng.uniform(-.08,.08)) * decay / h ** (2.0 if bowed else 1.65)
    attack = 1 - np.exp(-t / (1.3 if bowed else .012))
    release = np.minimum(1, (duration - t) / (2.0 if bowed else .7))
    envelope = attack * np.maximum(0,release) ** 2
    if bowed:
        envelope *= .82 + .18 * np.sin(np.pi * t / duration)
    samples = tone * envelope * amplitude
    indices = (int(start * RATE) + np.arange(len(t))) % count
    np.add.at(mix, indices, samples)

# An original slow D-minor modal phrase, with space between each gesture.
melody = [
    [62,69,65], [64,62], [65,69,72], [69,67],
    [60,67,64], [62,60], [58,65,69], [65,62],
    [62,65,69], [72,69], [67,65,64], [62,57],
    [58,62,65], [60,64], [57,64,67], [65,62],
]
roots = [38,38,36,34,38,36,34,33]
for i, root in enumerate(roots):
    add(root, i * 8 - 1.5, 11, .09, True)
    add(root+7, i * 8 - 1.2, 10.5, .043, True)
for bar, notes in enumerate(melody):
    for j, note in enumerate(notes):
        add(note, bar * 4 + [.25,1.8,3.1][j], 4.8, .17 if j == 0 else .11)
    if bar % 2 == 0:
        add(roots[bar//2]+12,bar*4+.04,6,.10)
# Circular reverberation carries each tail across the loop boundary.
dry = mix.copy()
for delay, gain in [(0.19,.12),(.37,.09),(.61,.08),(.97,.055),(1.43,.035)]:
    mix += np.roll(dry, round(delay*RATE)) * gain
mix -= mix.mean()
mix *= .63 / np.max(np.abs(mix))
output = Path('public/audio/codex-regius/music/northern-strings-v1.wav')
output.parent.mkdir(parents=True,exist_ok=True)
with wave.open(str(output),'wb') as audio:
    audio.setnchannels(1); audio.setsampwidth(2); audio.setframerate(RATE)
    audio.writeframes((mix*32767).astype('<i2').tobytes())
print(f'{output}: {SECONDS}s; RMS {np.sqrt(np.mean(mix**2)):.3f}; peak {abs(mix).max():.3f}')
