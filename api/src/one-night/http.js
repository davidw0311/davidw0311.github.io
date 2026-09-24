'use strict';
function makeHandler(service, allowedOrigins = ['https://davidw0311.github.io', 'http://localhost:3000']) {
  const origins = new Set(allowedOrigins);
  return async request => {
    const origin = request.headers.get('origin');
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, private',
      'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info',
      Vary: 'Origin', 'X-Content-Type-Options': 'nosniff', ...(origins.has(origin) ? {'Access-Control-Allow-Origin': origin} : {}) };
    const reply = (status, body) => new Response(JSON.stringify(body), {status, headers});
    if (origin && !origins.has(origin)) return reply(403, {error:'origin-not-allowed'});
    if (request.method === 'OPTIONS') return new Response(null, {status:204, headers});
    if (request.method !== 'POST') return reply(405, {error:'method-not-allowed'});
    try {
      if (Number(request.headers.get('content-length')) > 16384) return reply(413, {error:'request-too-large'});
      // Enforce the limit while streaming, before allocating an unbounded body.
      const reader = request.body?.getReader(); let size=0; const chunks=[];
      if (reader) {
        for (;;) { const {done,value}=await reader.read(); if(done) break; size+=value.length;
          if(size>16384) { await reader.cancel(); return reply(413,{error:'request-too-large'}); } chunks.push(value); }
      }
      const bytes=new Uint8Array(size); let offset=0; for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
      let input; try {input=JSON.parse(new TextDecoder().decode(bytes));} catch {return reply(400,{error:'invalid-request'});}
      const address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
      return reply(200,await service.handle(input,address));
    } catch(error) {
      if(error.clientSafe===true && /^[a-z][a-z0-9_-]{1,70}$/i.test(error.code)) return reply(error.status || 400,{error:error.code,message:error.message});
      // Never log request bodies, roles, tokens, recovery keys or SQL payloads.
      console.error('One Night request failed', error.name);
      return reply(503,{error:'temporarily-unavailable',message:'The game service is temporarily unavailable. Please retry.'});
    }
  };
}
module.exports={makeHandler};
