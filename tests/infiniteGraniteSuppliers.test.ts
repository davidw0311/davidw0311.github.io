import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {MATERIALS,MATERIAL_COMPANIES,DEFAULT_MATERIAL,filterMaterials,resolveMaterialId} from '../app/projects/infinite-granite/materials.ts';
import {ROOM_TEXTURES} from '../app/projects/infinite-granite/roomTextures.ts';
import {defaultDesign,parseDesign} from '../app/projects/infinite-granite/kitchen.ts';
import {restoreFlyover} from '../app/projects/infinite-granite/flyover/model.ts';
import {INITIAL,restoreShowcase} from '../app/projects/infinite-granite/showcase/model.ts';
const root=new URL('../public/assets/infinite-granite/suppliers/',import.meta.url);
const audit=JSON.parse(readFileSync(new URL('catalogue.json',root),'utf8'));
const sources=JSON.parse(readFileSync(new URL('sources.json',root),'utf8')).products;
test('each audited supplier design has its own optimized, verified local photograph',()=>{
 assert.equal(new Set(MATERIALS.map(m=>m.id)).size,MATERIALS.length);
 assert.deepEqual(audit.failures,[]);
 assert.equal(audit.products.length,sources.length);
 for(const company of ['Vicostone','HanStone','Fir Stone','KASA Quartz','Omnia Quartz','RH Stones'])assert.ok(MATERIAL_COMPANIES.includes(company));
 for(const source of sources){
  const material=MATERIALS.find(m=>m.id===source.id);assert.ok(material,source.id);
  const p=audit.products.find((p:{id:string})=>p.id===source.id);assert.ok(p);
  assert.equal(material.company,source.company);assert.equal(material.code,source.code);assert.equal(material.name,source.name);
  assert.equal(material.sourceUrl,source.sourceUrl);assert.equal(p.originalImageUrl,source.image);
  assert.ok(material.textureWidth!>0&&material.textureHeight!>0);
  for(const key of ['textureUrl','thumbnailUrl'] as const){
   const assetUrl:URL=new URL(`../public${material[key]}`,import.meta.url);
   const bytes=readFileSync(assetUrl);
   assert.ok(statSync(assetUrl).size<330000);assert.equal(bytes.toString('ascii',8,12),'WEBP');
   if(key==='textureUrl')assert.equal(createHash('sha256').update(bytes).digest('hex'),p.textureSha256);
  }
 }
});
test('supplier names and published codes are searchable without custom studio slabs',()=>{
 assert.ok(filterMaterials('hanstone sable glow').some(m=>m.id==='hanstone-sable-glow'));
 assert.ok(filterMaterials('K 1101','KASA Quartz').some(m=>m.code==='K1101'));
 assert.ok(filterMaterials('OQ-535','Omnia Quartz').some(m=>m.code==='OQ535'));
 assert.ok(filterMaterials('Y9040','Fir Stone').some(m=>m.code==='Y9040'));
 assert.ok(filterMaterials('porcelain','HanStone').length===13);
 assert.equal(filterMaterials('','Studio collection').length,0);
 assert.ok(ROOM_TEXTURES.every(m=>!MATERIALS.some(s=>s.id===m.id)));
 assert.equal(ROOM_TEXTURES.find(m=>m.id==='butcher')?.pattern,'wood');
});
test('retired finishes migrate saved rooms and colours without mutating imported data',()=>{
 const original={...defaultDesign(),countertop:'calacatta',cabinetColor:'#123456'};
 original.components[1]={...original.components[1],material:'butcher'};
 const result=parseDesign(original);assert.ok(result);
 assert.equal(result.countertop,DEFAULT_MATERIAL);assert.equal(result.components[1].material,DEFAULT_MATERIAL);
 assert.equal(result.cabinetColor,'#123456');assert.equal(original.countertop,'calacatta');assert.equal(original.components[1].material,'butcher');
 assert.equal(restoreFlyover({design:{countertop:'soapstone',cabinetColor:'#123456'}}).design.countertop,DEFAULT_MATERIAL);
 assert.equal(restoreShowcase({...INITIAL,material:'absolute',lower:'#123456'})?.lower,'#123456');
 assert.equal(restoreShowcase({...INITIAL,material:'absolute'})?.material,DEFAULT_MATERIAL);
 assert.equal(resolveMaterialId('not-a-material'),null);assert.equal(parseDesign({...original,countertop:'not-a-material'}),null);
});

test('RH Stones includes every published slab code and excludes the ceramic sinks',()=>{
 const expected=[1011,1012,1026,1029,2012,5001,5002,5003,5006,5007,5008,5009,5010,5012,5015,5016,5018,5019,5020,5021,5022,5025,7001,7002,7003,7005,8001,8002,8005,8010,8011,8012,8014,8021,8022,8023,9001,9002,9003,9006,9008,9009].map(n=>`RH${n}`);
 const rh=filterMaterials('','RH Stones');assert.deepEqual(rh.map(m=>m.code),expected);
 for(const query of ['RH7005','rh 7005','RH-7005'])assert.equal(filterMaterials(query,'RH Stones')[0]?.id,'rh-stones-rh7005');
 assert.equal(rh.filter(m=>m.family==='Printed quartz').length,4);
 assert.equal(rh.filter(m=>m.textureKind==='detail').length,6);
 assert.ok(!rh.some(m=>['RH1611','RH1812','RH1813'].includes(m.code)));
 const mapped=audit.products.find((p:{id:string})=>p.id==='rh-stones-rh5025');
 assert.equal(mapped.originalImageUrl,'https://rhstones.com/wp-content/uploads/2025/01/12345.png');
 for(const m of rh){
  const p=audit.products.find((p:{id:string})=>p.id===m.id);
  assert.match(m.sourceUrl!,/^https:\/\/rhstones\.com\/(stones|printed-quartz)\/$/);
  if(m.textureKind==='slab'){
   assert.ok(p.crop.left>0&&p.crop.top>0&&p.crop.width<p.sourceWidth&&p.crop.height<p.sourceHeight);
   assert.ok(p.crop.left+p.crop.width<=p.sourceWidth&&p.crop.top+p.crop.height<=p.sourceHeight);
   assert.match(p.processing,/slab photograph extracted/);
  }
 }
});
