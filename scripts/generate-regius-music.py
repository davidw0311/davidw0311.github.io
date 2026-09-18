"""Original dark acoustic-inspired score; no samples or third-party music.
Requires Python 3, numpy and soundfile (with MP3 encoding support).
"""
from pathlib import Path
import wave
import numpy as np
import soundfile as sf

RATE, SECONDS = 24000, 80
count = RATE * SECONDS
mix = np.zeros(count, dtype=np.float64)
rng = np.random.default_rng(8292)

def place(samples, start, amplitude):
    indices = (int(start * RATE) + np.arange(len(samples))) % count
    np.add.at(mix, indices, samples * amplitude)

def pluck(note, start, amplitude, duration=9):
    # A damped delay-line string excited by a short, filtered noise burst.
    # No sweeping oscillators, pads, chimes, arpeggiators, or electronic beats.
    frequency = 440 * 2 ** ((note - 69) / 12)
    period = round(RATE / frequency - .5)
    tone = np.zeros(int(RATE * duration))
    excitation = rng.normal(0, 1, period)
    for _ in range(5):
        excitation = (excitation + np.roll(excitation, 1)) / 2
    excitation -= excitation.mean()
    tone[:period] = excitation
    for i in range(period + 1, len(tone)):
        tone[i] = .996 * .5 * (tone[i-period] + tone[i-period-1])
    t = np.arange(len(tone)) / RATE
    tone *= (1 - np.exp(-t/.006)) * np.minimum(1, (duration-t)/1.5)**2
    tone /= max(abs(tone).max(), .001)
    place(tone, start, amplitude)

def drum(start, amplitude):
    # Low skin modes and a muted contact sound, with a short natural decay.
    t = np.arange(RATE * 3) / RATE
    sound = np.zeros_like(t)
    for ratio, strength, decay in [(1,.8,2.4),(1.59,.25,4.3),(2.14,.12,6.2),(2.65,.055,8)]:
        phase = 2*np.pi*55*ratio*(t + .003*(1-np.exp(-t/.05)))
        sound += strength*np.sin(phase)*np.exp(-decay*t)
    noise = rng.normal(0, 1, len(t))
    noise = np.convolve(noise, np.ones(18)/18, mode='same')
    sound += noise * .15 * np.exp(-t*36)
    sound *= 1-np.exp(-t/.004)
    place(sound, start, amplitude)

# Sparse D-phrygian gestures: low open strings, minor seconds, unresolved endings.
phrases = [
 [(0,38,.48),(1.4,50,.23),(5.2,51,.17),(8,45,.20)],
 [(0,38,.36),(3.1,53,.20),(6.7,50,.18)],
 [(0,36,.40),(2.4,48,.23),(7,45,.18)],
 [(0,38,.46),(4,51,.18),(8.4,50,.17)],
 [(0,34,.38),(2,46,.23),(6.3,45,.17)],
 [(0,36,.40),(3.8,48,.21),(7.4,51,.15)],
 [(0,33,.36),(2.8,45,.23),(6.8,46,.16)],
 [(0,38,.44),(3.6,50,.18),(7.6,45,.18)],
]
for bar, notes in enumerate(phrases):
    for beat, note, amp in notes:
        pluck(note, bar*10+beat, amp)
for start, amp in [(0,.18),(9.6,.11),(19.9,.15),(28,.10),(39.8,.17),(50,.12),(59.7,.16),(69.8,.10)]:
    drum(start,amp)
# Short room reflections, without the long shimmering tail of the first version.
dry = mix.copy()
for delay,gain in [(.073,.09),(.131,.065),(.227,.04),(.383,.022)]:
    mix += np.roll(dry,round(delay*RATE))*gain
mix -= mix.mean()
mix *= .11/max(np.sqrt(np.mean(mix**2)),.001)
# Gentle peak control keeps quiet string tails audible beneath spoken words.
mix = .72 * np.tanh(mix/.72)
folder = Path('public/audio/codex-regius/music')
folder.mkdir(parents=True,exist_ok=True)
output = folder/'northern-strings-v2.mp3'
sf.write(output,mix,RATE,format='MP3')
# Real silent media preserves mobile playback permission and exact pause/resume.
for name,seconds in [('opening-5s',5),('breath-2s',2)]:
    with wave.open(str(folder/f'{name}.wav'),'wb') as audio:
        audio.setnchannels(1);audio.setsampwidth(2);audio.setframerate(8000)
        audio.writeframes(bytes(seconds*8000*2))
print(f'{output}: {SECONDS}s; RMS {np.sqrt(np.mean(mix**2)):.3f}; peak {abs(mix).max():.3f}')
