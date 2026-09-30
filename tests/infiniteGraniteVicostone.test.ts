import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {MATERIALS,filterMaterials} from '../app/projects/infinite-granite/materials.ts';
import {defaultDesign,parseDesign} from '../app/projects/infinite-granite/kitchen.ts';
const base=new URL('../public/assets/infinite-granite/suppliers/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('catalogue.json',base),'utf8'));
const sources=JSON.parse(readFileSync(new URL('sources.json',base),'utf8')).products.filter((p:{company:string})=>p.company==='Vicostone');
test('every official Vicostone Canadian code has a sourced, optimized texture and thumbnail',()=>{
 const materials=MATERIALS.filter(m=>m.company==='Vicostone');assert.equal(materials.length,68);assert.equal(new Set(materials.map(m=>m.code)).size,68);
 assert.deepEqual(new Set(materials.map(m=>m.code)),new Set(sources.map((p:{code:string})=>p.code)));
 for(const m of materials){const record=manifest.products.find((p:{id:string})=>p.id===m.id);assert.ok(record);assert.match(m.sourceUrl!,/^https:\/\/vicostone.ca\/en\/product\//);assert.ok(m.textureWidth!>0&&m.textureHeight!>0);
  for(const key of ['textureUrl','thumbnailUrl'] as const){const asset=new URL(`../public${m[key]}`,import.meta.url);assert.ok(statSync(asset).size>100);assert.ok(statSync(asset).size<330000);const b=readFileSync(asset);assert.equal(b.toString('ascii',8,12),'WEBP');if(key==='textureUrl')assert.equal(createHash('sha256').update(b).digest('hex'),record.textureSha256);}
  assert.equal(parseDesign({...defaultDesign(),countertop:m.id})?.countertop,m.id);
 }
});
test('Vicostone code and name searches remain isolated from other suppliers',()=>{
 for(const query of ['BQ8788','bq 8788','BQ-8788'])assert.equal(filterMaterials(query,'Vicostone')[0]?.id,'vicostone-bq8788');
 assert.ok(filterMaterials('Diamante','Vicostone').some(m=>m.id==='vicostone-bq8788'));
 assert.equal(filterMaterials('','Vicostone').length,68);assert.ok(filterMaterials('','Vicostone').every(m=>m.company==='Vicostone'));
 assert.equal(filterMaterials('','TCE Stone').length,97);assert.equal(filterMaterials('','Studio collection').length,0);
});
