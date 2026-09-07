import test from 'node:test';
import assert from 'node:assert/strict';
import { addCell, availableCells, editCell, ensureCells, moveCell, replaceCell } from '../app/projects/infinite-granite/cellLayout.ts';
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
test('width and length resize shared tracks while preserving neighbours and room boundaries',()=>{
  let d=kitchen();const id=d.components[0].id;
  d=editCell(d,id,{width:48})!;
  assert.equal(d.roomWidth,156);
  assert.equal(d.components[0].x+24,d.components[1].x-18);
  d=editCell(d,id,{depth:42})!;
  assert.ok(d.components.every(c=>c.depth===42&&c.height===36));
  assert.equal(d.roomDepth,150);
  assert.deepEqual(parseDesign(JSON.parse(JSON.stringify(d))),d);
});
test('rotation remains in its cell and uses local width/length axes',()=>{
  let d=editCell(kitchen(),'grid-0-0-floor',{width:48})!;
  d=editCell(d,'grid-0-0-floor',{rotation:90})!;
  const c=d.components[0];assert.equal(c.rotation,90);assert.deepEqual(footprint(c),{width:48,depth:36});
  d=editCell(d,c.id,{width:40})!;assert.equal(d.gridRows![0],40);assert.deepEqual(collisionPairs(d.components),[]);
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
test('placing a larger kind grows a small empty track to its safe minimum',()=>{
  const d={...kitchen(),gridColumns:[36,36,36,12]};
  const next=addCell(d,'island','island',{row:2,column:3})!;
  assert.equal(next.gridColumns![3],36);assert.equal(next.components.at(-1)!.width,36);
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
