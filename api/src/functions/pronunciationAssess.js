const { app } = require("@azure/functions");
const { normalizeAzureResult, parseAssessmentRequest, pronunciationHeader } = require("../pronunciation.js");

const attemptsByAddress = new Map();
const rateLimitWindowMs = 60_000;
const rateLimitMaximum = 12;

function allowedOrigins() {
  return new Set((process.env.ALLOWED_ORIGINS ?? "http://localhost:3000,https://davidw0311.github.io")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean));
}

function corsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
    "Vary": "Origin",
  };
  if (origin && allowedOrigins().has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function json(status, body, origin) {
  return { status, headers: corsHeaders(origin), jsonBody: body };
}

function isRateLimited(request) {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  if (attemptsByAddress.size > 1_000) {
    for (const [key, value] of attemptsByAddress) {
      if (now - value.startedAt >= rateLimitWindowMs) attemptsByAddress.delete(key);
    }
  }
  const current = attemptsByAddress.get(address);
  if (!current || now - current.startedAt >= rateLimitWindowMs) {
    attemptsByAddress.set(address, { startedAt: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > rateLimitMaximum;
}

async function pronunciationAssess(request, context) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  if (request.method === "OPTIONS") return { status: 204, headers };
  if (origin && !allowedOrigins().has(origin)) return json(403, { error: "origin-not-allowed" }, origin);
  if (isRateLimited(request)) return json(429, { error: "too-many-attempts" }, origin);

  const speechKey = process.env.AZURE_SPEECH_KEY;
  const speechRegion = process.env.AZURE_SPEECH_REGION;
  if (!speechKey || !speechRegion || !/^[a-z0-9-]+$/.test(speechRegion)) {
    context.error("Azure Speech settings are missing or invalid.");
    return json(503, { error: "assessment-not-configured" }, origin);
  }

  let input;
  try {
    input = parseAssessmentRequest(await request.json());
  } catch (error) {
    const code = error instanceof Error ? error.message : "invalid-request";
    return json(400, { error: code }, origin);
  }

  const endpoint = new URL(`https://${speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`);
  endpoint.searchParams.set("language", input.locale);
  endpoint.searchParams.set("format", "detailed");

  try {
    const speechResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
        "Ocp-Apim-Subscription-Key": speechKey,
        "Pronunciation-Assessment": pronunciationHeader(input.referenceText),
      },
      body: input.audio,
      signal: AbortSignal.timeout(20_000),
    });

    if (!speechResponse.ok) {
      context.error(`Azure Speech returned status ${speechResponse.status}.`);
      return json(502, { error: "speech-provider-error" }, origin);
    }

    const result = normalizeAzureResult(await speechResponse.json(), input.strictness);
    return json(200, result, origin);
  } catch (error) {
    context.error("Pronunciation assessment failed.", error);
    return json(502, { error: "assessment-failed" }, origin);
  }
}

app.http("pronunciationAssess", {
  route: "pronunciation/assess",
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: pronunciationAssess,
});

app.http("speechHealth", {
  route: "health",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async () => ({
    status: 200,
    headers: { "Cache-Control": "no-store", "Content-Type": "application/json" },
    jsonBody: { ok: true, speechConfigured: Boolean(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION) },
  }),
});
