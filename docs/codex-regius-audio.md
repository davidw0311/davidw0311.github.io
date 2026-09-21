# Codex Regius narration

The first three retellings (Völuspá, Hávamál and Vafþrúðnismál / Odin’s Wisdom Contest) use prerecorded Azure `en-US-AdamMultilingualNeural` narration at natural pitch. Völuspá alone adds `en-US-AvaMultilingualNeural` for the seeress’s three quotations in both languages (six clips), at -8% rate and pitch. Its prose retains the original narrator clips. There is no direct dialogue for Odin or the other gods in this retelling, so no dialogue is invented. All other stories retain device speech. The reader labels recordings as AI narration and offers device voices as a fallback.

Each displayed paragraph is synthesized intact. Quotations have separate Old Norse and English clips, so readers can omit Norse without losing the translation. Norse uses the voice’s modern Icelandic locale as an approximation, not a claim of reconstructed historical pronunciation. One HTML audio element plays the clips in page order, supports jumps to any section, and retains the exact position during pause. Speed preserves pitch. Audio uses ordinary media routing; the phone chooses its Bluetooth output.

## Regeneration

Run `node --no-warnings scripts/generate-regius-audio.mjs` with Node 24, Azure CLI access to the existing SpeechLab resource, and `afinfo` on macOS or `ffprobe` elsewhere. Alternatively supply `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` securely in the environment. Never place credentials in client code. The script is deliberately limited to the first three stories; `--story=voluspa` can narrow it further.

The resource is currently F0. No paid tier changes are performed. Requests are throttled, and completed clips are cached so interrupted runs can resume. Output is 24 kHz mono MP3 at 96 kbps. Manifests enumerate all section/quotation parts and hash the exact displayed text. A changed story automatically falls back to device speech until its recordings are regenerated. If changing the voice or synthesis settings, increment the asset version directory before regenerating.

Verify with `node --no-warnings --test tests/regiusRecordedNarration.test.ts tests/regiusNarration.test.ts tests/regiusAudioSession.test.ts`, lint the changed files, and run the production build. Mobile-browser playback and physical Bluetooth routing should also be checked on the target phone.

## Instrumental background

Hávamál and Vafþrúðnismál retain `northern-strings-v2.mp3`, an original 80-second D-phrygian composition with low, damped plucked strings and distant frame-drum tones. Regenerate with `python3 scripts/generate-regius-music.py` (NumPy and SoundFile with MP3 support required). Earlier assets remain available for cached clients.

Völuspá alone uses six selectable full-length recordings by Alexander Nakarada: Vopna (its default), Blood Eagle, Gjallar, Hymn to the Gods, The Northern Path and Vetur Frosti. Each is mono 24 kHz, normalized and gently faded at the edges. Regenerate with `python3 scripts/prepare-regius-story-music.py` (NumPy, SciPy and SoundFile required); `data/regiusStoryMusic.json` describes the complete tracks, while the audition manifest retains the source URLs and SHA-256 checksums. Earlier soundtracks remain available to cached clients.

The visible selector preserves narration position. The soundtrack continues across paragraphs, quotations, breathing spaces and jumps, and loops after its full recording ends. Only an explicit track change starts a new soundtrack. Selection is stored under `regius-story-music:voluspa`; story metadata provides its own default and storage key, allowing different defaults for future stories without changing them now. Only Völuspá opts out of the native pause callback during narration source changes. Other stories retain their previous music and behavior.

### Music attribution and license

Music: **Vopna**, **Blood Eagle**, **Gjallar**, **Hymn to the Gods**, **The Northern Path**, and **Vetur Frosti** by **Alexander Nakarada**, https://creatorchords.com. Licensed under **Creative Commons Attribution 4.0 International (CC BY 4.0)**, https://creativecommons.org/licenses/by/4.0/. Adaptations: mono downsampling, volume normalization, edge fades and looping for background playback. No endorsement is implied. The selected track's artist, source and license remain visible in the audio panel. Source URLs and hashes are retained in `data/regiusAuditionMusic.json`; the creator's terms are at https://creatorchords.com/licensing-info/.

Music is fetched only after a playback gesture and uses a separate Web Audio gain, defaulting to 12% and capped at 30%. This avoids relying on programmatic HTML media volume on phones. Voice speed does not change music speed. Music follows narration pause/resume/stop, releases its audio context on navigation, and never prevents speech if loading fails. The checkbox and volume slider persist independently of voice preferences. Lifecycle tests live in `tests/regiusBackgroundMusic.test.ts`.

## Reading pace

With music enabled, **Read story** adds a five-second music-only opening, with a **Skip opening** button. **Read from here** starts the chosen passage immediately, including the first passage. The recorded readings have a two-second breathing space after each third paragraph; if that paragraph has a quotation, the pause follows its English translation. No text is removed or re-recorded.

The opening and rests use small silent PCM clips in the same media queue. This retains phone playback permission and gives pause/resume, jumps, and stop the same exact behavior as spoken passages, with no delayed timer able to restart a stopped story. Rests stay at their intended duration when speech speed changes. Device-voice fallback retains its existing cadence. Queue and interruption tests live in `tests/regiusRecordedNarration.test.ts`.

## Draft listening room

`/projects/codex-regius/audio-lab/` is an unlisted, noindex audition page. It does not modify the published story or its preferences. Ten distinct Azure voices read the exact first paragraph at natural pitch and speed. The revised shortlist preserves Brian and Sonia byte-for-byte, adding Steffan, Monica, Serena, Christopher, Roger, Elizabeth, Samuel and Cora. Provider metadata describes Steffan, Monica and Serena as mature; this is a tonal description, not a verified performer age. Regenerate with `node --no-warnings scripts/generate-regius-auditions.mjs`. The manifest includes a paragraph hash and all voice IDs. The original nine samples and subsequent eight additions were generated using the existing SpeechLab F0 resource, with no tier change.

Six retained music excerpts are listed in `data/regiusAuditionMusic.json`, with creator-page links, original download URLs, and SHA-256 source hashes. All are Alexander Nakarada recordings licensed CC BY 4.0, verified on their creator pages on 2026-09-21. Titles and attribution links are shown on the draft. Excerpts run from 0:10 to 1:10, with mono conversion, level matching and edge fades. Rebuild with `python3 scripts/prepare-regius-audition-music.py`. The draft continues to use 60-second excerpts; the story selector uses separately prepared full-length versions.

Two reusable HTML media elements permit solo voice, solo music and combined listening. Music uses a separate Web Audio gain for phone volume support. A generation token and play-attempt counter invalidate stale promises and callbacks during rapid switching, pause/resume and navigation. Finishing the voice ends the combined preview. Nothing autoplays; no audio is preloaded. Choices and notes are stored only in `regius-audition-choices-v1` on the current device, with a copyable summary for sharing a decision. No selection is automatically applied to the story.
