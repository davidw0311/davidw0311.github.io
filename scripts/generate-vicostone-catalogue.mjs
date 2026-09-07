import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root=new URL('../public/assets/infinite-granite/vicostone/',import.meta.url);
const sources=JSON.parse(await readFile(new URL('sources.json',root),'utf8'));
await mkdir(root,{recursive:true});
const products=[];let index=0;
async function worker(){while(index<sources.length){const p=sources[index++],code=p.code.toLowerCase(),originalImageUrl=new URL(p.image,'https://vicostone.com').href;
 let bytes;
 for(let attempt=0;attempt<3;attempt++){try{const response=await fetch(originalImageUrl,{signal:AbortSignal.timeout(60000)});if(!response.ok)throw Error(`${response.status}`);bytes=Buffer.from(await response.arrayBuffer());await sharp(bytes).metadata();break;}catch(error){if(attempt===2)throw Error(`${p.code}: ${error}`);}}
 const meta=await sharp(bytes).metadata();
 let texture=await sharp(bytes).rotate().resize({width:1536,height:1536,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toBuffer();
 if(texture.length>320000)texture=await sharp(texture).webp({quality:65}).toBuffer();
 for(let width=1280;texture.length>320000;width-=256){if(width<512)throw Error(`${p.code}: texture exceeds budget`);texture=await sharp(bytes).rotate().resize({width,height:width,fit:'inside',withoutEnlargement:true}).webp({quality:80}).toBuffer();}
 const thumb=await sharp(bytes).rotate().resize({width:360,height:180,fit:'cover'}).webp({quality:78}).toBuffer();
 await writeFile(new URL(`${code}.webp`,root),texture);await writeFile(new URL(`${code}-thumb.webp`,root),thumb);
 const stats=await sharp(bytes).resize(1,1).raw().toBuffer();const color='#'+[...stats.slice(0,3)].map(n=>n.toString(16).padStart(2,'0')).join('');
 products.push({id:`vicostone-${code}`,company:'Vicostone',code:p.code,name:p.name,family:'Quartz',color,pattern:'vein',vein:'#999999',note:'Official global collection · slab pattern scale approximate',roughness:.23,textureUrl:`/assets/infinite-granite/vicostone/${code}.webp`,thumbnailUrl:`/assets/infinite-granite/vicostone/${code}-thumb.webp`,textureWidth:126,textureHeight:126*meta.height/meta.width,sourceUrl:new URL(p.url,'https://vicostone.com').href,textureKind:meta.width/meta.height>1.65?'slab':'detail',originalImageUrl,sourceWidth:meta.width,sourceHeight:meta.height,textureSha256:createHash('sha256').update(texture).digest('hex')});
 if(products.length%20===0)console.log(`Imported ${products.length}/${sources.length}`);
}}
await Promise.all(Array.from({length:5},worker));
products.sort((a,b)=>a.code.localeCompare(b.code,'en',{numeric:true}));
await writeFile(new URL('catalogue.json',root),JSON.stringify({source:'https://vicostone.com/en/product',audited:'2026-09-07',scope:'All 214 unique codes listed in the official global catalogue; regional availability varies. Pattern mapping uses an approximate 126-inch width.',products},null,2));
const materials=products.map(product=>{const p={...product};for(const key of ['originalImageUrl','sourceWidth','sourceHeight','textureSha256'])delete p[key];return p;});
await writeFile(new URL('../app/projects/infinite-granite/vicostone.ts',import.meta.url),`// Generated from the audited official global catalogue. See public/assets/infinite-granite/vicostone/catalogue.json.\nimport type { CountertopMaterial } from './materials.ts';\nexport const vicostoneMaterials:CountertopMaterial[] = ${JSON.stringify(materials,null,2)};\n`);
console.log(`Completed ${products.length} Vicostone designs.`);
