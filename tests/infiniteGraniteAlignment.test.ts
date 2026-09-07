import test from 'node:test';
import assert from 'node:assert/strict';
import {createCustomDesign} from '../app/projects/infinite-granite/placement.ts';
import {editCell,moveCell,resizeCells,selectionLimits} from '../app/projects/infinite-granite/cellLayout.ts';
import {parseDesign,footprint,collisionPairs} from '../app/projects/infinite-granite/kitchen.ts';
const original=()=>createCustomDesign(4,[{row:1,column:1,kind:'base'},{row:1,column:2,kind:'base'}])!;
const small=()=>editCell(original(),'grid-1-1-floor',{width:24,depth:24})!;
test('undersized pieces default to their back edge, with rotation-aware alignment',()=>{
 for(const rotation of [0,90,180,270]){const d=editCell(small(),'grid-1-1-floor',{rotation})!,c=d.components[0],f=footprint(c);
 if(rotation===0)assert.equal(c.z-f.depth/2,-36);
 if(rotation===90)assert.equal(c.x-f.width/2,-36);
 if(rotation===180)assert.equal(c.z+f.depth/2,0);
 if(rotation===270)assert.equal(c.x+f.width/2,0);
 assert.deepEqual(parseDesign(JSON.parse(JSON.stringify(d))),d);
 }
});
test('first right press aligns within the cell; second swaps with its neighbour',()=>{
 const d=small(),a=moveCell(d,d.components[0].id,0,1)!;
 assert.deepEqual(a.components[0].cell,d.components[0].cell);assert.equal(a.components[0].x+12,0);assert.deepEqual(a.components[1],d.components[1]);
 const b=moveCell(a,a.components[0].id,0,1)!;
 assert.deepEqual(b.components[0].cell,{row:1,column:2});assert.deepEqual(b.components[1].cell,{row:1,column:1});assert.equal(b.components[0].x+12,36);
 assert.deepEqual(collisionPairs(b.components),[]);
});
test('left and front edges align first, then move into empty cells',()=>{
 for(const [row,column] of [[0,-1],[1,0]]){const d=small(),id=d.components[0].id,a=moveCell(d,id,row,column)!;
 assert.deepEqual(a.components[0].cell,{row:1,column:1});const b=moveCell(a,id,row,column)!;assert.deepEqual(b.components[0].cell,{row:1+row,column:1+column});}
 // The default back is already flush, so moving back crosses immediately.
 assert.deepEqual(moveCell(small(),'grid-1-1-floor',-1,0)!.components[0].cell,{row:0,column:1});
});
test('full-size pieces still move or swap in one press',()=>{
 const d=original(),a=moveCell(d,d.components[0].id,0,1)!;assert.deepEqual(a.components[0].cell,{row:1,column:2});
});
test('resizing keeps chosen edge anchors without changing neighbours',()=>{
 let d=moveCell(small(),'grid-1-1-floor',0,-1)!;const neighbour=d.components[1];
 d=resizeCells(d,['grid-1-1-floor'],'width',30)!;d=resizeCells(d,['grid-1-1-floor'],'depth',30)!;
 assert.equal(d.components[0].x-15,-36);assert.equal(d.components[0].z-15,-36);assert.deepEqual(d.components[1],neighbour);
});
test('alignment at the room edge is allowed before an out-of-grid move is rejected',()=>{
 let d=createCustomDesign(4,[{row:1,column:0,kind:'base'}])!;d=editCell(d,d.components[0].id,{width:24,depth:24})!;
 const a=moveCell(d,d.components[0].id,0,-1)!;assert.equal(a.components[0].x-12,-72);assert.equal(moveCell(a,a.components[0].id,0,-1),null);
});
test('overhanging neighbours block within-cell alignment rather than causing a jump',()=>{
 let d=editCell(original(),'grid-1-1-floor',{width:18,depth:24})!;d=resizeCells(d,['grid-1-2-floor'],'width',54)!;
 assert.equal(moveCell(d,'grid-1-1-floor',0,1),null);assert.deepEqual(d.components[0].cell,{row:1,column:1});
});
test('anchored expansion respects the one-neighbour-cell limit',()=>{
 const d=createCustomDesign(6,[{row:2,column:2,kind:'base'}])!,id=d.components[0].id;
 assert.deepEqual(selectionLimits(d,[id],'depth'),[18,72]);assert.ok(resizeCells(d,[id],'depth',72));assert.equal(resizeCells(d,[id],'depth',72.5),null);
});
test('alignment persists, invalid alignment is rejected, and oversized legacy saves survive',()=>{
 const aligned=moveCell(small(),'grid-1-1-floor',0,-1)!;assert.deepEqual(parseDesign(JSON.parse(JSON.stringify(aligned))),aligned);
 for(const cellAlign of [null,{x:2,z:0},{x:0},{x:'0',z:0}])assert.equal(parseDesign({...aligned,components:aligned.components.map(c=>({...c,cellAlign}))}),null);
 const d=createCustomDesign(6,[{row:2,column:2,kind:'base'}])!;
 const legacy={...d,independentSizes:true,components:d.components.map(c=>{const p={...c,depth:108};delete p.cellAlign;return p;})};
 const recovered=parseDesign(legacy)!;assert.ok(recovered);assert.equal(recovered.components[0].depth,108);assert.deepEqual(recovered.components[0].cellAlign,{x:0,z:0});
});
