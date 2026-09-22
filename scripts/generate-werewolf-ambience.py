"""Original ambient composition for Werewolf. Python standard library only.

A seamless 32-second D-minor drone, with slowly orbiting harmonics and sparse
bell overtones. All frequencies and envelopes repeat at the exact loop boundary.
No samples, external recordings, or copyrighted music are used.
"""
from array import array
from math import sin, cos, pi
from pathlib import Path
import sys
import wave

RATE = 22050
DURATION = 32
TAU = 2 * pi
COUNT = RATE * DURATION
TARGET = Path(__file__).resolve().parents[1] / 'public/assets/werewolf/audio/night-ambience.wav'

def periodic_frequency(hz):
    return round(hz * DURATION) / DURATION

# D2, A2, D3, F3, A3, E4 (a quiet suspended ninth above the minor chord).
partials = [(73.416, .23, 0.0, 1), (110.0, .12, .4, 2), (146.832, .12, 1.3, 3),
            (174.614, .09, 2.1, 2), (220.0, .07, .8, 1), (329.628, .028, 2.7, 4)]
partials = [(periodic_frequency(f), a, phase, motion) for f, a, phase, motion in partials]
frames = array('h')
peak = 0
for i in range(COUNT):
    time = i / RATE
    orbit = TAU * time / DURATION
    sample = 0
    for frequency, amplitude, phase, motion in partials:
        breathing = .72 + .28 * cos(motion * orbit + phase)
        wave_value = sin(TAU * frequency * time + phase + .08 * sin(orbit))
        sample += amplitude * breathing * wave_value
    # Diffuse high overtones swell gently four times per loop without sharp attacks.
    bell = (.5 + .5 * cos(4 * orbit)) ** 8
    sample += .028 * bell * sin(TAU * periodic_frequency(587.33) * time)
    # PCM headroom plus the controller's gain keeps this well behind narration.
    value = int(max(-1, min(1, sample * .5)) * 32767)
    peak = max(peak, abs(value))
    frames.append(value)
if sys.byteorder != 'little':
    frames.byteswap()
TARGET.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(TARGET), 'wb') as recording:
    recording.setnchannels(1)
    recording.setsampwidth(2)
    recording.setframerate(RATE)
    recording.writeframes(frames.tobytes())
with wave.open(str(TARGET), 'rb') as recording:
    assert recording.getnframes() == COUNT
    assert recording.getframerate() == RATE
print(f'{TARGET}: {DURATION}s, {RATE}Hz mono PCM16, peak {peak / 32767:.3f}, {TARGET.stat().st_size:,} bytes')
