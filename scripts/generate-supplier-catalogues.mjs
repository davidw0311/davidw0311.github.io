/** Import audited, public supplier photos. No AI-generated or substituted slab patterns.
 * Edit public/assets/infinite-granite/suppliers/sources.json to refresh the source audit,
 * then run this script. Each record retains the product and original photograph URLs.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root=new URL('../public/assets/infinite-granite/suppliers/',import.meta.url);
const source=JSON.parse(await readFile(new URL('sources.json',root),'utf8'));
const cache=new URL('file:///tmp/infinite-granite-supplier-images/');
await mkdir(cache,{recursive:true});
let index=0;const products=[],failures=[];
async function download(p){
 const key=createHash('sha256').update(p.image).digest('hex');
 try{return await readFile(new URL(key,cache));}catch{}
 const response=await fetch(p.image,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(60000)});
 if(!response.ok)throw Error(`HTTP ${response.status}`);
 const bytes=Buffer.from(await response.arrayBuffer());await sharp(bytes).metadata();await writeFile(new URL(key,cache),bytes);return bytes;
}
async function worker(){while(index<source.products.length){const p=source.products[index++];
 try{
 let bytes;for(let attempt=0;attempt<3;attempt++){try{bytes=await download(p);break;}catch(error){if(attempt===2)throw error;}}
 const original=await sharp(bytes).metadata();let picture=sharp(bytes).rotate().flatten({background:'#ffffff'}),crop;
 if(p.crop){
  crop=Object.fromEntries(Object.entries(p.crop).map(([key,value])=>[key,Math.floor(value*(['left','width'].includes(key)?original.width:original.height))]));
  picture=picture.extract(crop);
 }else if(p.company==='Fir Stone'){
  // Fir's square presentation boards put the slab between broad white margins.
  const trimmed=await picture.trim({background:'#ffffff',threshold:10}).toBuffer({resolveWithObject:true});
  const w=trimmed.info.width,h=trimmed.info.height;
  // Use the central stone field, keeping the printed label off the mapped worktop.
  crop={left:Math.round(w*.12),top:Math.round(h*.025),width:Math.floor(w*.76),height:Math.floor(h*.76)};
  picture=sharp(trimmed.data).extract(crop);
 }
 const clean=await picture.toBuffer(),meta=await sharp(clean).metadata();
 let texture=await sharp(clean).resize({width:1536,height:1536,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toBuffer();
 for(let width=1280;texture.length>320000;width-=256){if(width<512)throw Error('Texture exceeds budget');texture=await sharp(clean).resize({width,height:width,fit:'inside',withoutEnlargement:true}).webp({quality:76}).toBuffer();}
 const thumb=await sharp(clean).resize({width:360,height:180,fit:'cover'}).webp({quality:78}).toBuffer();
 await writeFile(new URL(`${p.id}.webp`,root),texture);await writeFile(new URL(`${p.id}-thumb.webp`,root),thumb);
 const rgb=await sharp(clean).resize(1,1).removeAlpha().raw().toBuffer();
 const color='#'+[...rgb.slice(0,3)].map(n=>n.toString(16).padStart(2,'0')).join('');
 const textureKind=p.textureKind??(/detail|medium|close/i.test(p.image)?'detail':'slab');
 const width=textureKind==='detail'?48:p.company==='HanStone'?130:126;
 products.push({id:p.id,company:p.company,code:p.code,name:p.name,family:p.family,color,pattern:'vein',vein:'#999999',note:p.note??'Official supplier photograph · pattern scale approximate',roughness:/leathered|riverwashed|hammered/i.test(p.note??'')?.45:.25,textureUrl:`/assets/infinite-granite/suppliers/${p.id}.webp`,thumbnailUrl:`/assets/infinite-granite/suppliers/${p.id}-thumb.webp`,textureWidth:width,textureHeight:width*meta.height/meta.width,sourceUrl:p.sourceUrl,textureKind,...(p.availability?{availability:p.availability}:{}),originalImageUrl:p.image,sourceWidth:original.width,sourceHeight:original.height,...(crop?{crop,processing:'White board margins trimmed; central stone field sampled to exclude the printed label.'}:{}),textureSha256:createHash('sha256').update(texture).digest('hex')});
 }catch(error){failures.push({id:p.id,error:String(error)});console.error(p.id,String(error));}
 if((products.length+failures.length)%50===0)console.log(`Processed ${products.length+failures.length}/${source.products.length}`);
}}
await Promise.all(Array.from({length:6},worker));
products.sort((a,b)=>a.company.localeCompare(b.company)||a.code.localeCompare(b.code,'en',{numeric:true}));
await writeFile(new URL('catalogue.json',root),JSON.stringify({audited:source.audited,scope:'Published product designs from the named suppliers. Catalogue listing does not guarantee local stock. All pattern scales are approximate.',products,failures},null,2)+'\n');
const materials=products.map(product=>{
 const material={...product};
 for(const key of ['originalImageUrl','sourceWidth','sourceHeight','textureSha256','crop','processing'])delete material[key];
 return material;
});
await writeFile(new URL('../app/projects/infinite-granite/supplierMaterials.ts',import.meta.url),`// Generated by scripts/generate-supplier-catalogues.mjs. See the audited supplier manifest.\nimport type {CountertopMaterial} from './materials.ts';\nexport const supplierMaterials:CountertopMaterial[]=${JSON.stringify(materials,null,2)};\n`);
console.log(`Imported ${products.length}; failed ${failures.length}`);
if(failures.length)process.exitCode=1;
