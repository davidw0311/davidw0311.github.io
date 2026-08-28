const targetSampleRate = 16_000;
const microphoneAudioConstraints: MediaTrackConstraints = {
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

export type AudioRecording = {
  stop: () => Promise<Blob>;
  cancel: () => Promise<void>;
};

export async function requestMicrophoneAccess(): Promise<void> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: microphoneAudioConstraints,
  });
  stream.getTracks().forEach((track) => track.stop());
}

function mergeChunks(chunks: Float32Array[]) {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const merged = new Float32Array(length);
  let offset = 0;

  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return merged;
}

function resample(input: Float32Array, sourceSampleRate: number) {
  if (input.length === 0) return input;
  if (sourceSampleRate === targetSampleRate) return input;

  const outputLength = Math.max(1, Math.round(input.length * targetSampleRate / sourceSampleRate));
  const output = new Float32Array(outputLength);
  const ratio = sourceSampleRate / targetSampleRate;

  for (let index = 0; index < outputLength; index += 1) {
    const position = index * ratio;
    const left = Math.floor(position);
    const right = Math.min(left + 1, input.length - 1);
    const mix = position - left;
    output[index] = input[left] * (1 - mix) + input[right] * mix;
  }

  return output;
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function encodePcmWav(samples: Float32Array) {
  const bytesPerSample = 2;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, targetSampleRate, true);
  view.setUint32(28, targetSampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, samples.length * bytesPerSample, true);

  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(44 + index * bytesPerSample, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export async function startAudioRecording(): Promise<AudioRecording> {
  if (!navigator.mediaDevices?.getUserMedia || !window.AudioWorkletNode) {
    throw new Error("unsupported");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: microphoneAudioConstraints,
  });

  const audioContext = new AudioContext();
  const chunks: Float32Array[] = [];
  let closed = false;

  try {
    await audioContext.audioWorklet.addModule("/audio-recorder-worklet.js");
    const source = audioContext.createMediaStreamSource(stream);
    const recorder = new AudioWorkletNode(audioContext, "pcm-recorder-processor");
    const silentOutput = audioContext.createGain();
    silentOutput.gain.value = 0;

    recorder.port.onmessage = (event: MessageEvent<Float32Array>) => chunks.push(event.data);
    source.connect(recorder);
    recorder.connect(silentOutput);
    silentOutput.connect(audioContext.destination);
    await audioContext.resume();

    const close = async () => {
      if (closed) return;
      closed = true;
      recorder.port.onmessage = null;
      source.disconnect();
      recorder.disconnect();
      silentOutput.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      await audioContext.close();
    };

    return {
      stop: async () => {
        const sourceSampleRate = audioContext.sampleRate;
        await close();
        const samples = resample(mergeChunks(chunks), sourceSampleRate);
        return encodePcmWav(samples);
      },
      cancel: close,
    };
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop());
    await audioContext.close();
    throw error;
  }
}

export async function blobToBase64(blob: Blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const chunkSize = 0x8000;
  let binary = "";

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return window.btoa(binary);
}
