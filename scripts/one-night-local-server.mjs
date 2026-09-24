// Development-only HTTP adapter. Production uses the private Supabase store.
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {OneNightService}=require('../api/src/one-night/service.js');
const {makeHandler}=require('../api/src/one-night/http.js');
class MemoryStore {
  data=new Map(); queues=new Map();
  transact(key,callback) {
    const run=(this.queues.get(key)||Promise.resolve()).then(async()=>{
      const result=await callback(structuredClone(this.data.get(key)??null));
      if(result.changed!==false)this.data.set(key,structuredClone(result.value));
      return result.result;
    });
    this.queues.set(key,run.catch(()=>{}));return run;
  }
}
const port=Number(process.env.ONE_NIGHT_PORT||4501);
const handler=makeHandler(new OneNightService(new MemoryStore()),['http://localhost:3010','http://127.0.0.1:3010','http://localhost:3000']);
createServer(async(req,res)=>{
  try {
    const chunks=[];let size=0;
    for await(const chunk of req){size+=chunk.length;if(size>16384){res.writeHead(413);res.end();return;}chunks.push(chunk);}
    const request=new Request(`http://localhost:${port}${req.url}`,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
    const response=await handler(request);
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  } catch {res.writeHead(500);res.end('Local server error');}
}).listen(port,'127.0.0.1',()=>console.log(`One Night development API: http://localhost:${port}`));
