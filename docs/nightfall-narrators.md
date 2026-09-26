# Chinese narrators

Both games share `NarratorSelect`, its device preference, and the recording resolver. A change takes effect at the next recording boundary, including within a multi-clip announcement. It does not restart music, replay the current phrase, finish an action, or acknowledge a phase. Replay and Test sound use the newly selected voice. English narration is unchanged.

| Audition | Chinese display name | English display name |
| --- | --- | --- |
| M10 | 暗夜绅士 | Night Gentleman |
| M07 | 儒雅电台 | Midnight Radio |
| M04 | 冷静侦探 | Cool Detective |
| F13 | 温厚长者 | Wise Storyteller |
| F12 | 烟嗓侦探 | Smoky Detective |
| F18 | 新闻主播 | News Anchor |

Kokoro · 沉稳男声 is available in both games, including a complete Chinese classic library. Brian · 经典旁白 retains Werewolf's existing mixed Brian/Kokoro recording library byte-for-byte. One Night retains its original Kokoro option; it did not previously have Brian recordings. No Azure voice generation, credentials, or runtime cloud TTS are needed.

## Assets and reproduction

`scripts/build-nightfall-narrators.mjs` gathers Chinese scripts from both existing game manifests and the shared victory manifest. A content-addressed pool contains 249 distinct phrases; all six Qwen voices cover the complete pool, including dead roles, copied abilities, announcements, seat numbers, last words, winning teams and individual winners. This avoids duplicating shared recordings between games. A separate Kokoro fill adds 65 originally Brian-only phrases and reuses existing Kokoro recordings elsewhere.

The source auditions are the user's locally generated synthetic Qwen3-TTS VoiceDesign samples in `~/Downloads/werewolf-tts-samples/chinese-20-voices`. These are reference voices, not recordings of real people. The first complete sentence of each audition is used as a 3.2–5.1-second reference, cut inside the following silent pause. Measured cut points are stored in `catalogue.json`. This keeps the original voice while avoiding repeatedly decoding the complete audition before every short command.

Use the existing Qwen environment and `mlx-community/Qwen3-TTS-12Hz-1.7B-Base-4bit` model with `scripts/generate-nightfall-narrators.py --batch-size=8`. The reference transcript is `夜幕降临，所有人请闭上眼睛。`. Source/reference hashes and text fingerprints are recorded in the generated manifest. Generation is resumable and writes each MP3 and manifest atomically; incomplete batches are not published. Validate content and duration as well as asset presence before delivery.

`scripts/check-nightfall-narrator-speech.py --watch --report=/tmp/nightfall-speech-review.json` transcribes generated clips locally with MLX Whisper. It checks transcript similarity, wake/sleep wording and exact seat numbers. After the watcher finishes, `--review-flagged --model=<larger-local-Whisper-model>` reviews ambiguous results. Recognition flags are review candidates, not proof of incorrect speech. To regenerate selected clips, run the generator with `--retry-keys=voice:lineHash,...` after the main generator exits. Retry settings are saved in `scripts/nightfall-narrator-overrides.json` so future runs preserve the repaired recordings. Never run two generators or report writers against the same files concurrently.

`scripts/verify-nightfall-narrator-assets.py` decodes all new MP3 files and checks coverage, signal levels, durations and the existing night narration time budgets. No game timer or server behavior changes are required.

Run `scripts/generate-nightfall-kokoro-fill.py` with the Kokoro environment, then `scripts/build-nightfall-narrator-review.mjs` to build the listening page at `/assets/nightfall/narrators/`. Models use Apache 2.0 licenses. Reference-conditioned speech uses the [Qwen3-TTS Base workflow](https://github.com/QwenLM/Qwen3-TTS) through [MLX-Audio](https://github.com/Blaizzy/mlx-audio).

Kokoro's new standalone seat calls spell out the Chinese number and say “五号玩家” rather than the very short “5号”, for clearer pronunciation. The manifest retains the original cue text and separately records its spoken `generationText`. Use the speech checker with `--kokoro` and a separate report path to review these additional recordings.

All playback remains through the existing persistent Safari-compatible audio elements. A missing or failed recording produces an audio error and never acknowledges a narration phase. Shared tests cover switching mid-phrase, continuous music, duplicate acknowledgement protection, playback failure/retry, default and invalid preferences, English preservation, and complete cue coverage.
