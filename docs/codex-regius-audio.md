# Codex Regius narration

The first three retellings (Völuspá, Hávamál and Vafþrúðnismál / Odin’s Wisdom Contest) use prerecorded Azure `en-US-AdamMultilingualNeural` narration at natural pitch. All other stories retain device speech. The reader labels recordings as AI narration and offers device voices as a fallback.

Each displayed paragraph is synthesized intact. Quotations have separate Old Norse and English clips, so readers can omit Norse without losing the translation. Norse uses the voice’s modern Icelandic locale as an approximation, not a claim of reconstructed historical pronunciation. One HTML audio element plays the clips in page order, supports jumps to any section, and retains the exact position during pause. Speed preserves pitch. Audio uses ordinary media routing; the phone chooses its Bluetooth output.

## Regeneration

Run `node --no-warnings scripts/generate-regius-audio.mjs` with Node 24, Azure CLI access to the existing SpeechLab resource, and `afinfo` on macOS or `ffprobe` elsewhere. Alternatively supply `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` securely in the environment. Never place credentials in client code. The script is deliberately limited to the first three stories; `--story=voluspa` can narrow it further.

The resource is currently F0. No paid tier changes are performed. Requests are throttled, and completed clips are cached so interrupted runs can resume. Output is 24 kHz mono MP3 at 96 kbps. Manifests enumerate all section/quotation parts and hash the exact displayed text. A changed story automatically falls back to device speech until its recordings are regenerated. If changing the voice or synthesis settings, increment the asset version directory before regenerating.

Verify with `node --no-warnings --test tests/regiusRecordedNarration.test.ts tests/regiusNarration.test.ts tests/regiusAudioSession.test.ts`, lint the changed files, and run the production build. Mobile-browser playback and physical Bluetooth routing should also be checked on the target phone.

## Instrumental background

Only the first three recorded stories include `northern-strings-v2.mp3`, an original 80-second D-phrygian composition with low, damped plucked strings and distant frame-drum tones. The string timbre uses a noise-excited delay line rather than the first version’s shimmering harmonic pads. It contains no licensed samples or third-party recordings. Regenerate with `python3 scripts/generate-regius-music.py` (NumPy and SoundFile with MP3 support required). Short circular room reflections preserve the loop boundary. The previous asset stays available for cached clients.

Music is fetched only after a playback gesture and uses a separate Web Audio gain, defaulting to 12% and capped at 30%. This avoids relying on programmatic HTML media volume on phones. Voice speed does not change music speed. Music follows narration pause/resume/stop, releases its audio context on navigation, and never prevents speech if loading fails. The checkbox and volume slider persist independently of voice preferences. Lifecycle tests live in `tests/regiusBackgroundMusic.test.ts`.

## Reading pace

With music enabled, **Read story** adds a five-second music-only opening, with a **Skip opening** button. **Read from here** starts the chosen passage immediately, including the first passage. The recorded readings have a two-second breathing space after each third paragraph; if that paragraph has a quotation, the pause follows its English translation. No text is removed or re-recorded.

The opening and rests use small silent PCM clips in the same media queue. This retains phone playback permission and gives pause/resume, jumps, and stop the same exact behavior as spoken passages, with no delayed timer able to restart a stopped story. Rests stay at their intended duration when speech speed changes. Device-voice fallback retains its existing cadence. Queue and interruption tests live in `tests/regiusRecordedNarration.test.ts`.
