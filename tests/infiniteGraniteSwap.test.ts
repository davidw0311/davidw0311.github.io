import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultDesign, makeComponent, parseDesign, footprint } from '../app/projects/infinite-granite/kitchen.ts';
import { swapAdjacent, replaceComponent } from '../app/projects/infinite-granite/connectedEdit.ts';
import { isPlacementValid } from '../app/projects/infinite-granite/placement.ts';
const valid=(d:ReturnType<typeof defaultDesign>)=>assert.ok(d.components.every(c=>isPlacementValid(c,d.components,d.roomWidth,d.roomDepth)));
test('sink becomes fridge with correct height, identity and saved type',()=>{
 const d=defaultDesign();const sink=d.components.find(c=>c.kind==='sink')!;const next=replaceComponent(d,sink.id,'fridge')!;assert.ok(next);valid(next);const fridge=next.components.find(c=>c.id===sink.id)!;
 assert.equal(fridge.kind,'fridge');assert.equal(fridge.name,'Refrigerator');assert.equal(fridge.height,72);assert.equal(fridge.width,sink.width);assert.equal(d.components.find(c=>c.id===sink.id)!.kind,'sink');assert.equal(parseDesign(JSON.parse(JSON.stringify(next)))!.components.find(c=>c.id===sink.id)!.kind,'fridge');
 const restored=replaceComponent(next,sink.id,'sink')!;valid(restored);assert.equal(restored.components.find(c=>c.id===sink.id)!.height,36);
});
test('unequal adjacent modules exchange order without moving outer neighbours or opening gaps',()=>{
 const d=defaultDesign('custom');d.components=[makeComponent('base','left',-60,0,0,30),makeComponent('sink','sink',-27,0,0,36),makeComponent('base','right',6,0,0,30),makeComponent('base','end',36,0,0,30)];
 const next=swapAdjacent(d,'sink','x',1)!;valid(next);assert.deepEqual(next.components.map(c=>c.x),[-60,3,-30,36]);assert.equal(next.roomWidth,d.roomWidth);
 assert.deepEqual(swapAdjacent(next,'sink','x',-1),d);
 const sorted=[...next.components].sort((a,b)=>a.x-b.x);for(let i=1;i<sorted.length;i++)assert.equal(sorted[i-1].x+sorted[i-1].width/2,sorted[i].x-sorted[i].width/2);
});
test('swaps work in both floor axes and preserve back alignment for different depths',()=>{
 for(const rotation of [0,90,180,270]){const d=defaultDesign('custom'),a=makeComponent('sink','a',0,0,rotation,36),b=makeComponent('base','b',0,0,rotation,30);const axis=rotation%180===0?'x':'z';b[axis]=33;d.components=[a,b];const next=swapAdjacent(d,'a',axis,1)!;valid(next);assert.equal(next.components[0][axis],30);assert.equal(next.components[1][axis],-3);assert.deepEqual(swapAdjacent(next,'a',axis,-1),d);}
 const d=defaultDesign('custom');d.components=[makeComponent('sink','s',0,-84),makeComponent('fridge','f',36,-81)];const next=swapAdjacent(d,'s','x',1)!;valid(next);for(const c of next.components)assert.equal(c.z-footprint(c).depth/2,-96);
});
test('end-of-run arrows do not separate the run; swaps cannot hit other components',()=>{
 const d=defaultDesign('custom');d.components=[makeComponent('base','a',0,0),makeComponent('fridge','b',33,0),makeComponent('upper','u',0,0)];assert.equal(swapAdjacent(d,'a','x',-1),null);assert.equal(swapAdjacent(d,'a','x',1),null);assert.equal(swapAdjacent(d,'a','z',1),null);
});
