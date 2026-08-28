import assert from "node:assert/strict";
import test from "node:test";
import { requestMicrophoneAccess } from "../lib/browserAudioRecorder.ts";

test("microphone preflight requests audio access and releases the temporary stream", async () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  let receivedConstraints: MediaStreamConstraints | undefined;
  let trackStopped = false;

  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      mediaDevices: {
        getUserMedia: async (constraints: MediaStreamConstraints) => {
          receivedConstraints = constraints;
          return {
            getTracks: () => [{ stop: () => { trackStopped = true; } }],
          };
        },
      },
    },
  });

  try {
    await requestMicrophoneAccess();
  } finally {
    if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator);
    else delete (globalThis as { navigator?: Navigator }).navigator;
  }

  assert.deepEqual(receivedConstraints, {
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });
  assert.equal(trackStopped, true);
});
