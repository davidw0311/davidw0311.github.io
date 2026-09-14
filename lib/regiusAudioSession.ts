// Progressive enhancement for Safari's Audio Session API. The OS still chooses
// the output device; this is a playback-category request, not a Bluetooth selector.
// https://developer.mozilla.org/en-US/docs/Web/API/AudioSession/type
export type AudioSessionLike = { type: string };

export function narrationAudioSession(getSession: () => AudioSessionLike | undefined) {
  let claimed: AudioSessionLike | undefined;
  let previous: string | undefined;
  return {
    acquire() {
      try {
        const session = getSession();
        if (!session) return;
        if (!claimed) { claimed = session; previous = session.type; }
        if (session.type !== "playback") session.type = "playback";
      } catch { /* Optional API support must never prevent speech. */ }
    },
    release() {
      try {
        // Do not overwrite a category subsequently chosen by another feature.
        if (claimed?.type === "playback" && previous !== undefined) claimed.type = previous;
      } catch { /* Some engines expose the API but reject category changes. */ }
      finally { claimed = undefined; previous = undefined; }
    },
  };
}
