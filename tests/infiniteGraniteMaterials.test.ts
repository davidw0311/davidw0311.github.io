import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { MATERIALS, filterMaterials } from '../app/projects/infinite-granite/materials.ts';
import { defaultDesign, parseDesign } from '../app/projects/infinite-granite/kitchen.ts';
const manifest=JSON.parse(readFileSync(new URL('../public/assets/infinite-granite/tce/catalogue.json',import.meta.url),'utf8'));

test('all 97 official TCE codes retain their images, scale, sources and stock labels',()=>{
  const supplier=MATERIALS.filter(m=>m.company==='TCE Stone');
  assert.equal(supplier.length,97);assert.equal(new Set(supplier.map(m=>m.code)).size,97);
  assert.equal(supplier.filter(m=>m.textureKind==='slab').length,77);
  assert.equal(supplier.filter(m=>m.availability).length,21);
  for(const m of supplier){
    const source=manifest.products.find((p:{id:string})=>p.id===m.id);assert.ok(source);
    assert.equal(m.code,source.supplierCode);assert.equal(m.family,'Quartz');
    assert.equal(m.sourceUrl,source.sourceUrl);assert.match(m.sourceUrl!,/^https:\/\/tcestone.com\/products\//);
    assert.equal(m.textureWidth,source.textureWidth);assert.equal(m.textureHeight,source.textureHeight);
    for(const key of ['textureUrl','thumbnailUrl'] as const){const asset=new URL(`../public${m[key]}`,import.meta.url);assert.ok(statSync(asset).size>100);assert.ok(statSync(asset).size<330000);}
    const bytes=readFileSync(new URL(`../public${m.textureUrl}`,import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),source.textureSha256);
    assert.equal(bytes.toString('ascii',8,12),'WEBP');
    const design={...defaultDesign(),countertop:m.id};assert.equal(parseDesign(design)?.countertop,m.id);
  }
});
test('supplier search accepts codes with punctuation and groups results in numeric code order',()=>{
  for(const query of ['TCE 2049','tce2049','2049','TCE-2049']){const matches=filterMaterials(query);assert.equal(matches.length,1);assert.equal(matches[0].id,'tce-2049');}
  assert.ok(filterMaterials('calacatta','TCE Stone').length>0);
  assert.ok(filterMaterials('granite','Studio collection').every(m=>m.family==='Granite'));
  assert.equal(filterMaterials('not-a-real-finish').length,0);
  const codes=filterMaterials('','TCE Stone').map(m=>Number(m.code.replace('TCE ','')));
  assert.deepEqual(codes,[...codes].sort((a,b)=>a-b));
  assert.ok(filterMaterials('','Studio collection').every(m=>m.company==='Studio collection'));
});
