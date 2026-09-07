import test from 'node:test';
import assert from 'node:assert/strict';
import { addCell, availableCells, editCell, ensureCells, moveCell, replaceCell, resizeCells, selectionLimits } from '../app/projects/infinite-granite/cellLayout.ts';
import { createCustomDesign } from '../app/projects/infinite-granite/placement.ts';
import { collisionPairs, defaultDesign, footprint, LAYOUTS, parseDesign } from '../app/projects/infinite-granite/kitchen.ts';
const kitchen=()=>createCustomDesign(4,[{row:0,column:0,kind:'sink'},{row:0,column:1,kind:'dishwasher'},{row:0,column:2,kind:'base'}])!;

test('adjacent sink, dishwasher and cupboard occupy flush cells at the same height',()=>{
  const d=kitchen();
  for(let i=1;i<3;i++){const a=d.components[i-1],b=d.components[i];assert.equal(a.x+a.width/2,b.x-b.width/2);assert.equal(a.depth,b.depth);assert.equal(a.height,b.height);}
  assert.deepEqual(collisionPairs(d.components),[]);
});
test('arrows swap occupied cells and move into empty cells; deletion leaves a gap',()=>{
  const d=kitchen(),sink=d.components[0],dishwasher=d.components[1];
  const swap=moveCell(d,sink.id,0,1)!;
  assert.deepEqual(swap.components.find(c=>c.id===sink.id)!.cell,{row:0,column:1});
  assert.deepEqual(swap.components.find(c=>c.id===dishwasher.id)!.cell,{row:0,column:0});
  const moved=moveCell(swap,sink.id,1,0)!;
  assert.deepEqual(moved.components.find(c=>c.id===sink.id)!.cell,{row:1,column:1});
  assert.ok(availableCells(moved,'base').some(c=>c.row===0&&c.column===1));
  assert.equal(moveCell(d,sink.id,-1,0),null);
  const removed={...d,components:d.components.filter(c=>c.id!==dishwasher.id)};
  assert.equal(removed.components[1].x-removed.components[1].width/2-(sink.x+sink.width/2),36);
});
test('individual sizing leaves neighbouring components, tracks, and room unchanged',()=>{
  const original=kitchen(),id=original.components[0].id;
  let d=editCell(original,id,{width:32})!;
  d=editCell(d,id,{depth:24})!;
  assert.deepEqual(d.components.slice(1),original.components.slice(1));
  assert.deepEqual(d.gridColumns,original.gridColumns);assert.deepEqual(d.gridRows,original.gridRows);
  assert.equal(d.roomWidth,original.roomWidth);assert.equal(d.roomDepth,original.roomDepth);
  assert.equal(d.components[0].x,original.components[0].x);assert.equal(d.components[0].width,32);assert.equal(d.components[0].depth,24);
  assert.deepEqual(parseDesign(JSON.parse(JSON.stringify(d))),d);
  assert.equal(editCell(d,id,{width:37}),null);
});
test('rotation preserves local sizes and rejects rotations through neighbours',()=>{
  const d=editCell(kitchen(),'grid-0-0-floor',{width:32,depth:24})!;
  const turned=editCell(d,'grid-0-0-floor',{rotation:90})!;
  assert.deepEqual(footprint(turned.components[0]),{width:24,depth:32});
  assert.deepEqual(turned.components.slice(1),d.components.slice(1));
});
test('type replacement, available-cell placement, and blocked upper/tall combinations',()=>{
  let d=kitchen();const id=d.components[0].id;
  d=replaceCell(d,id,'fridge')!;assert.equal(d.components[0].kind,'fridge');assert.equal(d.components[0].height,72);
  assert.ok(!availableCells(d,'upper').some(c=>c.row===0&&c.column===0));
  assert.equal(addCell(d,'upper','blocked',{row:0,column:0}),null);
  const target=availableCells(d,'base')[0];d=addCell(d,'base','new',target)!;assert.deepEqual(d.components.at(-1)!.cell,{row:target.row,column:target.column});
  assert.equal(addCell(d,'sink','occupied',target),null);
  d=addCell(d,'upper','upper',{row:0,column:2})!;assert.equal(replaceCell(d,'grid-0-2-floor','fridge'),null);
});
test('adding into a narrow edge cell cannot expand the grid to force a fit',()=>{
  const d={...kitchen(),gridColumns:[36,36,36,12]};
  assert.equal(addCell(d,'island','island',{row:2,column:3}),null);
});
test('legacy presets retain a single connected back run after migration',()=>{
  for(const layout of LAYOUTS){const d=ensureCells(defaultDesign(layout.id))!;assert.ok(d);for(let i=0;i<6;i++)assert.deepEqual(d.components.find(c=>c.id===defaultDesign(layout.id).components[i].id)!.cell,{row:0,column:i});assert.deepEqual(collisionPairs(d.components),[]);assert.deepEqual(parseDesign(JSON.parse(JSON.stringify(d))),d);}
});
test('malformed or duplicate saved cells cannot be restored',()=>{
  const d=kitchen();assert.equal(parseDesign({...d,gridColumns:'oops'}),null);
  assert.equal(parseDesign({...d,gridRows:[Infinity]}),null);
  assert.equal(parseDesign({...d,components:d.components.map(c=>({...c,cell:{row:0,column:0}}))}),null);
  assert.equal(parseDesign({...d,components:[{...d.components[0],cell:{row:-1,column:0}}]}),null);
});
test('repeated cell edits preserve grid occupancy, collision protection, and save roundtrips',()=>{
  let d=kitchen();
  for(let i=0;i<120;i++){
    const c=d.components[i%d.components.length];
    const next=i%3===0?moveCell(d,c.id,i%2?1:0,i%2?0:1):i%3===1?editCell(d,c.id,{width:30+i%40}):replaceCell(d,c.id,i%2?'sink':'base');
    if(next)d=next;
    assert.deepEqual(collisionPairs(d.components),[]);assert.deepEqual(parseDesign(JSON.parse(JSON.stringify(d))),d);
  }
});

test('empty space permits only one extra cell on each side, including unequal tracks',()=>{
  const d=createCustomDesign(6,[{row:2,column:2,kind:'base'}])!,id=d.components[0].id;
  assert.deepEqual(selectionLimits(d,[id],'width'),[12,108]);
  assert.ok(resizeCells(d,[id],'width',108));assert.equal(resizeCells(d,[id],'width',108.5),null);
  const uneven={...d,gridColumns:[36,24,36,48,36,36]};
  assert.deepEqual(selectionLimits(uneven,[id],'width'),[12,84]);
  assert.equal(resizeCells(uneven,[id],'width',84.5),null);
  assert.equal(resizeCells(d,[id],'depth',108.5),null);
});
test('multiple selection resizes atomically and includes collisions between selected pieces',()=>{
  const original=kitchen(),ids=original.components.slice(1).map(c=>c.id);
  const next=resizeCells(original,ids,'width',24)!;
  assert.deepEqual(next.components[0],original.components[0]);assert.ok(next.components.slice(1).every(c=>c.width===24));
  assert.deepEqual(selectionLimits(next,ids,'width'),[18,36]);
  assert.equal(resizeCells(next,ids,'width',36.5),null);
  assert.ok(resizeCells(next,ids,'width',36));
  assert.deepEqual(parseDesign(JSON.parse(JSON.stringify(next))),next);
});
test('actual overhanging footprints block add, replacement, and moves',()=>{
  let d=createCustomDesign(6,[{row:2,column:2,kind:'base'},{row:4,column:3,kind:'base'}])!;
  d=resizeCells(d,[d.components[0].id],'width',108)!;
  assert.ok(!availableCells(d,'base').some(c=>c.row===2&&c.column===3));
  assert.equal(addCell(d,'base','blocked',{row:2,column:3}),null);
  d=moveCell(d,d.components[1].id,-1,0)!;
  assert.equal(moveCell(d,d.components[1].id,-1,0),null);
});
test('wall cupboards use vertical clearance while range hoods block resize',()=>{
  const d=createCustomDesign(6,[{row:2,column:2,kind:'upper'},{row:2,column:3,kind:'range'}])!;
  assert.equal(resizeCells(d,[d.components[0].id],'width',37),null);
  const floor=createCustomDesign(6,[{row:2,column:2,kind:'upper'},{row:2,column:3,kind:'base'}])!;
  assert.ok(resizeCells(floor,[floor.components[0].id],'width',72));
});
test('invalid dimensions and oversized persisted footprints are rejected',()=>{
  const d=kitchen(),id=d.components[0].id;
  for(const value of [NaN,Infinity,-1,0,36.25,121])assert.equal(resizeCells(d,[id],'width',value),null);
  assert.equal(resizeCells(d,[],'width',30),null);assert.equal(resizeCells(d,['missing'],'width',30),null);
  assert.equal(parseDesign({...d,independentSizes:'yes'}),null);
  assert.equal(parseDesign({...d,independentSizes:true,components:d.components.map(c=>({...c,width:108}))}),null);
});
