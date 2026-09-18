# Codex Regius narration

The first three retellings (Völuspá, Hávamál and Vafþrúðnismál / Odin’s Wisdom Contest) use prerecorded Azure `en-US-AdamMultilingualNeural` narration at natural pitch. Völuspá alone adds `en-US-AvaMultilingualNeural` for the seeress’s three quotations in both languages (six clips), at -8% rate and pitch. Its prose retains the original narrator clips. There is no direct dialogue for Odin or the other gods in this retelling, so no dialogue is invented. All other stories retain device speech. The reader labels recordings as AI narration and offers device voices as a fallback.

Each displayed paragraph is synthesized intact. Quotations have separate Old Norse and English clips, so readers can omit Norse without losing the translation. Norse uses the voice’s modern Icelandic locale as an approximation, not a claim of reconstructed historical pronunciation. One HTML audio element plays the clips in page order, supports jumps to any section, and retains the exact position during pause. Speed preserves pitch. Audio uses ordinary media routing; the phone chooses its Bluetooth output.

## Regeneration

Run `node --no-warnings scripts/generate-regius-audio.mjs` with Node 24, Azure CLI access to the existing SpeechLab resource, and `afinfo` on macOS or `ffprobe` elsewhere. Alternatively supply `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` securely in the environment. Never place credentials in client code. The script is deliberately limited to the first three stories; `--story=voluspa` can narrow it further.

The resource is currently F0. No paid tier changes are performed. Requests are throttled, and completed clips are cached so interrupted runs can resume. Output is 24 kHz mono MP3 at 96 kbps. Manifests enumerate all section/quotation parts and hash the exact displayed text. A changed story automatically falls back to device speech until its recordings are regenerated. If changing the voice or synthesis settings, increment the asset version directory before regenerating.

Verify with `node --no-warnings --test tests/regiusRecordedNarration.test.ts tests/regiusNarration.test.ts tests/regiusAudioSession.test.ts`, lint the changed files, and run the production build. Mobile-browser playback and physical Bluetooth routing should also be checked on the target phone.

## Instrumental background

Hávamál and Vafþrúðnismál retain `northern-strings-v2.mp3`, an original 80-second D-phrygian composition with low, damped plucked strings and distant frame-drum tones. Regenerate with `python3 scripts/generate-regius-music.py` (NumPy and SoundFile with MP3 support required). Earlier assets remain available for cached clients.

Völuspá alone uses `voluspa-nordic-v1.mp3`: actual downloaded recordings, Mjolnir followed by Vopna, by Alexander Nakarada. The mix is mono 24 kHz, level-matched with an eight-second crossfade and gentle edge fades. It runs about 10 minutes 19 seconds before looping. Regenerate with `python3 scripts/mix-voluspa-music.py Mjolnir.mp3 Vopna.mp3` after downloading the sources below. NumPy, SciPy and SoundFile are required. The score keeps its position across narration clip changes, quotation translations, breathing spaces and section jumps. Explicit Pause/Stop and page navigation still control it. Only this recording opts out of the native media pause callback emitted during source changes; it follows the reader’s explicit state instead.

### Music attribution and license

Music: **Mjolnir** and **Vopna** by **Alexander Nakarada**, https://creatorchords.com. Licensed under **Creative Commons Attribution 4.0 International (CC BY 4.0)**, https://creativecommons.org/licenses/by/4.0/. Adaptations: mono downsampling, volume normalization, crossfade, edge fades and looping for background playback. No endorsement is implied. Attribution and license links remain visible in the Völuspá audio panel throughout playback.

- Mjolnir creator page: https://creatorchords.com/music/mjolnir/
- Mjolnir source: https://d19p7hqu4j8vx0.cloudfront.net/media/media/data/mp3s/Mjolnir.mp3
- Vopna creator page: https://creatorchords.com/music/vopna/
- Vopna source: https://d19p7hqu4j8vx0.cloudfront.net/media/media/data/mp3s/Vopna.mp3
- Creator’s licensing terms: https://creatorchords.com/licensing-info/
- Downloaded 2026-09-19. No external music service or credentials are required during playback.

Music is fetched only after a playback gesture and uses a separate Web Audio gain, defaulting to 12% and capped at 30%. This avoids relying on programmatic HTML media volume on phones. Voice speed does not change music speed. Music follows narration pause/resume/stop, releases its audio context on navigation, and never prevents speech if loading fails. The checkbox and volume slider persist independently of voice preferences. Lifecycle tests live in `tests/regiusBackgroundMusic.test.ts`.

## Reading pace

With music enabled, **Read story** adds a five-second music-only opening, with a **Skip opening** button. **Read from here** starts the chosen passage immediately, including the first passage. The recorded readings have a two-second breathing space after each third paragraph; if that paragraph has a quotation, the pause follows its English translation. No text is removed or re-recorded.

The opening and rests use small silent PCM clips in the same media queue. This retains phone playback permission and gives pause/resume, jumps, and stop the same exact behavior as spoken passages, with no delayed timer able to restart a stopped story. Rests stay at their intended duration when speech speed changes. Device-voice fallback retains its existing cadence. Queue and interruption tests live in `tests/regiusRecordedNarration.test.ts`.
