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
 for(const company of ['Vicostone','HanStone','Fir Stone','KASA Quartz','Omnia Quartz'])assert.ok(MATERIAL_COMPANIES.includes(company));
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
