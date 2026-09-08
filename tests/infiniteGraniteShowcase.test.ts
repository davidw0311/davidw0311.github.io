import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {INITIAL,restoreShowcase,projection,SURFACES,WIDTH,HEIGHT,UPPERS,LOWERS,OCCLUDERS} from '../app/projects/infinite-granite/showcase/model.ts';
import {MATERIALS} from '../app/projects/infinite-granite/materials.ts';
test('showcase perspective maps every slab corner exactly without non-finite coordinates',()=>{
 for(const s of SURFACES){const map=projection(s.quad,s.uv);for(let i=0;i<4;i++){const result=map(...s.quad[i]);for(let k=0;k<2;k++)assert.ok(Math.abs(result[k]-s.uv[i][k])<1e-5);}const x=s.quad.reduce((n,p)=>n+p[0],0)/4,y=s.quad.reduce((n,p)=>n+p[1],0)/4;assert.ok(map(x,y).every(Number.isFinite));}
 assert.throws(()=>projection([[0,0],[0,0],[0,0],[0,0]],SURFACES[0].uv));
});
test('slab top and edge UV coordinates meet at the photographed seam',()=>{
 const top=projection(SURFACES[0].quad,SURFACES[0].uv),edge=projection(SURFACES[1].quad,SURFACES[1].uv);
 for(const p of [SURFACES[0].quad[2],SURFACES[0].quad[3]]){const a=top(...p),b=edge(...p);assert.ok(Math.abs(a[0]-b[0])<1e-5&&Math.abs(a[1]-b[1])<1e-5);}
});
test('showcase selections roundtrip independently for every supplier and reject invalid storage',()=>{
 for(const m of MATERIALS){const d={...INITIAL,material:m.id,upper:'#234567',lower:'#abcdef',scale:1.5,rotation:90 as const};assert.deepEqual(restoreShowcase(JSON.parse(JSON.stringify(d))),d);}
 for(const patch of [{material:'unknown'},{upper:'red'},{lower:null},{scale:0},{scale:NaN},{rotation:45}])assert.equal(restoreShowcase({...INITIAL,...patch}),null);
 assert.equal(restoreShowcase(null),null);
});
test('photographic plate and surface masks use the same pixel coordinate system',()=>{
 const png=readFileSync(new URL('../public/assets/infinite-granite/showcase/kitchen-base.png',import.meta.url));assert.equal(png.readUInt32BE(16),WIDTH);assert.equal(png.readUInt32BE(20),HEIGHT);
 for(const polygon of [...UPPERS,...LOWERS,...OCCLUDERS,...SURFACES.map(s=>s.quad)])for(const [x,y] of polygon)assert.ok(x>=0&&x<=WIDTH&&y>=0&&y<=HEIGHT);
});
