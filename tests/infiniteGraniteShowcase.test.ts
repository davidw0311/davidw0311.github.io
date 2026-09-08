import {surfaceCoverage,SAMPLE_COUNT} from '../app/projects/infinite-granite/showcase/coverage.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {INITIAL,restoreShowcase,projection,slabProjections,SURFACES,WIDTH,HEIGHT,UPPERS,LOWERS,OCCLUDERS} from '../app/projects/infinite-granite/showcase/model.ts';
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
 for(const polygon of [...UPPERS,...LOWERS,...OCCLUDERS,...SURFACES.flatMap(s=>[s.quad,...(s.outline?[s.outline]:[])])])for(const [x,y] of polygon)assert.ok(x>=0&&x<=WIDTH&&y>=0&&y<=HEIGHT);
});

test('every point along a shared slab seam continues the same texture, not just its corners',()=>{
 const maps=slabProjections();
 for(const [top,edge,a,b] of [[0,1,2,3],[0,2,1,2],[3,4,2,3]]){
  const start=SURFACES[top].quad[a],end=SURFACES[top].quad[b];
  for(let t=0;t<=1;t+=.05){
   const x=start[0]+(end[0]-start[0])*t,y=start[1]+(end[1]-start[1])*t;
   const p=maps[top](x,y),q=maps[edge](x,y);
   assert.ok(p.every((v,k)=>Math.abs(v-q[k])<1e-5),`Discontinuous texture at ${top}/${edge}: ${t}`);
  }
 }
});

test('antialiased touching faces retain full stone coverage without phantom cupboard or background pixels',()=>{
 const regions=SURFACES.slice(0,3).map((s,i)=>({polygon:s.outline??s.quad,id:i+3}));
 const coverage=surfaceCoverage(WIDTH,HEIGHT,regions,8);
 let shared=0;
 for(let p=0;p<WIDTH*HEIGHT;p++){
  const weights=coverage.subarray(p*8,p*8+8);
  assert.equal(weights.reduce((a,b)=>a+b,0),SAMPLE_COUNT);
  assert.equal(weights[1]+weights[2]+weights[6]+weights[7],0);
  if(weights[3]&&weights[4]){
   const x=p%WIDTH;if(x<30||x>1310)continue;
   shared++;assert.equal(weights[0],0);
   // A uniform dark, white, or saturated finish stays that color across the seam.
   for(const color of [[8,8,8],[240,240,240],[160,20,35]])for(const c of color)
    assert.equal(weights[0]*255/SAMPLE_COUNT+(weights[3]+weights[4])*c/SAMPLE_COUNT,c);
  }
 }
 assert.ok(shared>500);
});

test('occluder edges blend only the actual object and stone, without interpolating surface IDs',()=>{
 const coverage=surfaceCoverage(12,12,[
  {id:7,polygon:[[0,0],[12,0],[12,12],[0,12]]},
  {id:0,polygon:[[2.4,2.3],[9.7,3.1],[8.2,10.8]]},
 ],8);
 let partial=0;
 for(let p=0;p<144;p++){
  const w=coverage.subarray(p*8,p*8+8);
  assert.equal(w[0]+w[7],SAMPLE_COUNT);
  assert.equal(w.slice(1,7).reduce((a,b)=>a+b,0),0);
  if(w[0]&&w[7])partial++;
 }
 assert.ok(partial>0);
});


test('photographed rear corner and island rim receive stone while adjacent walls stay untouched',()=>{
 const masks=surfaceCoverage(WIDTH,HEIGHT,SURFACES.map((s,i)=>({polygon:s.outline??s.quad,id:i+3})),8);
 // These actual plate pixels were outside the old outlines and remained white on black stone.
 for(const [x,y] of [[412,285],[415,290],[425,286],[440,287],[460,286],
  [30,423],[100,409],[200,390],[300,370],[434,345],[600,360],[800,377],[1000,394],[1200,414],[1400,434]]){
  const w=masks.subarray((y*WIDTH+x)*8,(y*WIDTH+x+1)*8);
  assert.equal(w[0],0,`Uncovered countertop at ${x},${y}`);
  assert.equal(w.slice(3).reduce((a,b)=>a+b,0),SAMPLE_COUNT);
 }
 for(const [x,y] of [[405,285],[420,277],[460,273],[100,405],[200,385],[600,356],[1000,390],[1400,430]])
  assert.equal(masks[(y*WIDTH+x)*8],SAMPLE_COUNT,`Outline spills onto background at ${x},${y}`);
});


test('cupboard colors stay off the hood and floor and include the complete recessed cabinet base',()=>{
 const masks=surfaceCoverage(WIDTH,HEIGHT,[...LOWERS.map(polygon=>({polygon,id:2})),...UPPERS.map(polygon=>({polygon,id:1}))],3);
 const weight=(x:number,y:number,id:number)=>masks[(y*WIDTH+x)*3+id];
 // The old upper rectangle incorrectly tinted this section of the range hood.
 for(const [x,y] of [[670,10],[700,30],[680,50],[720,90],[600,160]])assert.equal(weight(x,y,0),SAMPLE_COUNT);
 // Cabinet face, outer frame, and the visible side below the hood all recolor.
 for(const [x,y] of [[500,70],[440,30],[670,60],[700,140],[665,153]])assert.equal(weight(x,y,1),SAMPLE_COUNT);
 // Previously unpainted toe-kick pixels must match the lower cupboards.
 for(const [x,y] of [[300,804],[400,838],[500,879],[600,915],[700,950],[800,991],[860,1017],[1486,810]])assert.equal(weight(x,y,2),SAMPLE_COUNT);
 // Preserve the wood grain and cast shadow immediately beyond every contact edge.
 for(const [x,y] of [[100,750],[150,761],[300,814],[500,887],[700,962],[800,1001],[1400,1010],[1431,950],[1480,850]])assert.equal(weight(x,y,0),SAMPLE_COUNT);
});
