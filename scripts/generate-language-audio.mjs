import { mkdir, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { contentItems, languageIds, languages, speechLanguageId } from "../data/languageLearning.ts";

const voices = {
  en: "en-US-JennyNeural",
  ja: "ja-JP-NanamiNeural",
  zh: "zh-CN-XiaoxiaoNeural",
  yue: "zh-HK-HiuMaanNeural",
  ko: "ko-KR-SunHiNeural",
  ms: "ms-MY-YasminNeural",
  fr: "fr-FR-DeniseNeural",
  es: "es-ES-ElviraNeural",
  ta: "ta-IN-PallaviNeural",
};

const speechKey = process.env.AZURE_SPEECH_KEY?.trim();
const speechRegion = process.env.AZURE_SPEECH_REGION?.trim();
const force = process.argv.includes("--force");
const concurrency = 3;
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(repoRoot, "public");

if (!speechKey || !speechRegion) {
  throw new Error("AZURE_SPEECH_KEY and AZURE_SPEECH_REGION are required.");
}

function sentenceUrl(contentSlug, unitId, languageId, speed) {
  return `/audio/language-lab/v1/${contentSlug}/${unitId}/${languageId}/sentence-${speed}.mp3`;
}

function phraseUrl(contentSlug, unitId, languageId, phraseId) {
  return `/audio/language-lab/v1/${contentSlug}/${unitId}/${languageId}/phrases/${phraseId}.mp3`;
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function ssmlFor(sample) {
  const rate = sample.speed === "slow" ? "-25%" : "0%";
  return [
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${sample.locale}">`,
    `<voice name="${sample.voice}"><prosody rate="${rate}">${escapeXml(sample.text)}</prosody></voice>`,
    "</speak>",
  ].join("");
}

function buildSamples() {
  const samples = [];
  for (const content of contentItems) {
    for (const unit of content.units) {
      for (const languageId of languageIds) {
        if (speechLanguageId(languageId) !== languageId) continue;
        const localization = unit.localizations[languageId];
        for (const speed of ["normal", "slow"]) {
          samples.push({
            url: sentenceUrl(content.slug, unit.id, languageId, speed),
            text: localization.text,
            locale: languages[languageId].locale,
            voice: voices[languageId],
            speed,
          });
        }
        for (const phrase of localization.segments) {
          samples.push({
            url: phraseUrl(content.slug, unit.id, languageId, phrase.id),
            text: phrase.text,
            locale: languages[languageId].locale,
            voice: voices[languageId],
            speed: "normal",
          });
        }
      }
    }
  }
  return samples;
}

async function validateVoices() {
  const response = await fetch(`https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/voices/list`, {
    headers: { "Ocp-Apim-Subscription-Key": speechKey },
  });
  if (!response.ok) throw new Error(`Azure voice list failed with HTTP ${response.status}.`);
  const available = new Set((await response.json()).map((voice) => voice.ShortName));
  const missing = Object.values(voices).filter((voice) => !available.has(voice));
  if (missing.length > 0) throw new Error(`Azure voices unavailable in ${speechRegion}: ${missing.join(", ")}`);
}

async function exists(filePath) {
  try {
    return (await stat(filePath)).size > 500;
  } catch {
    return false;
  }
}

async function synthesize(sample) {
  const filePath = path.join(publicRoot, sample.url.slice(1));
  if (!force && await exists(filePath)) return "skipped";

  let response;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    response = await fetch(`https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST",
      headers: {
        "Content-Type": "application/ssml+xml",
        "Ocp-Apim-Subscription-Key": speechKey,
        "User-Agent": "davidw0311-language-lab-audio-generator",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      },
      body: ssmlFor(sample),
    });
    if (response.ok) break;
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 4) {
      const detail = (await response.text()).slice(0, 300);
      throw new Error(`Azure synthesis failed with HTTP ${response.status}: ${detail}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 750 * (2 ** attempt)));
  }

  const audio = Buffer.from(await response.arrayBuffer());
  if (audio.length <= 500) throw new Error(`Azure returned an unexpectedly small audio file for ${sample.url}.`);
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp`;
  await writeFile(temporaryPath, audio);
  await rename(temporaryPath, filePath);
  return "created";
}

async function main() {
  await validateVoices();
  const samples = buildSamples();
  let nextIndex = 0;
  let created = 0;
  let skipped = 0;

  async function worker() {
    while (nextIndex < samples.length) {
      const index = nextIndex;
      nextIndex += 1;
      const result = await synthesize(samples[index]);
      if (result === "created") created += 1;
      else skipped += 1;
      if ((created + skipped) % 20 === 0 || created + skipped === samples.length) {
        process.stdout.write(`Generated ${created + skipped}/${samples.length} (${created} new, ${skipped} unchanged)\n`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  process.stdout.write(`Azure neural audio is ready: ${created} generated, ${skipped} unchanged.\n`);
}

await main();
