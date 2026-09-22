const { app } = require('@azure/functions');
const { BlobRoomStore } = require('../werewolf/storage.js');
const { WerewolfService } = require('../werewolf/service.js');

let service;
function origins() {
  return new Set((process.env.ALLOWED_ORIGINS || 'https://davidw0311.github.io,http://localhost:3000').split(',').map(x => x.trim()));
}
function headers(origin) {
  return {
    'Content-Type': 'application/json', 'Cache-Control': 'no-store, private',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin', 'X-Content-Type-Options': 'nosniff',
    ...(origins().has(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
  };
}
async function handler(request, context) {
  const origin = request.headers.get('origin');
  const response = (status, body) => ({ status, headers: headers(origin), jsonBody: body });
  if (origin && !origins().has(origin)) return response(403, { error: 'origin-not-allowed' });
  if (request.method === 'OPTIONS') return { status: 204, headers: headers(origin) };
  try {
    const declaredLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > 16384) return response(413, { error: 'request-too-large' });
    const content = await request.text();
    if (Buffer.byteLength(content) > 16384) return response(413, { error: 'request-too-large' });
    let input;
    try { input = JSON.parse(content); } catch { return response(400, { error: 'invalid-request' }); }
    service ??= new WerewolfService(new BlobRoomStore(process.env.WEREWOLF_STORAGE_CONNECTION_STRING || process.env.AzureWebJobsStorage));
    // Azure supplies the forwarding chain. Rate-limit storage uses only a hash.
    const address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    return response(200, await service.handle(input, address));
  } catch (error) {
    if (error.clientSafe === true && error.code && /^[a-z][a-z0-9_-]{1,70}$/i.test(error.code)) {
      return response(error.status || 400, { error: error.code, message: error.message });
    }
    context.error('Werewolf request failed', error.name, error.statusCode || 'internal');
    return response(503, { error: 'temporarily-unavailable', message: 'The room is saved. Reconnect in a moment.' });
  }
}
app.http('werewolf', { route: 'werewolf', methods: ['POST', 'OPTIONS'], authLevel: 'anonymous', handler });
module.exports = { handler };
