import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultDesign, makeComponent, parseDesign, sinkOpening, footprint } from '../app/projects/infinite-granite/kitchen.ts';
import { connectedEdit, moveBoundary } from '../app/projects/infinite-granite/connectedEdit.ts';
import { isPlacementValid } from '../app/projects/infinite-granite/placement.ts';
import { backsplashRects, defaultWalls, cutOpenings, fitOpenings, WALL_SIDES, wallLength, addOpening, editOpening, openingsOverlap } from '../app/projects/infinite-granite/room.ts';
const valid=(d:ReturnType<typeof defaultDesign>)=>assert.ok(d.components.every(c=>isPlacementValid(c,d.components,d.roomWidth,d.roomDepth)));
test('30 ft connected run becomes 31 ft when sink grows by a foot; undo input stays immutable',()=>{
 const d=defaultDesign('custom');d.roomWidth=360;d.components=Array.from({length:10},(_,i)=>makeComponent(i===4?'sink':'base',`c${i}`,-162+i*36,-84,0,36));
 const original=JSON.stringify(d),next=connectedEdit(d,'c4',{width:48})!;assert.ok(next);valid(next);assert.equal(next.roomWidth,372);assert.equal(JSON.stringify(d),original);
 assert.equal(next.components[0].x-next.components[0].width/2,-186);assert.equal(next.components[9].x+18,186);
 assert.ok(sinkOpening(next.components[4],'single').width>sinkOpening(d.components[4],'single').width);
 assert.deepEqual(parseDesign(JSON.parse(JSON.stringify(next))),next);
});
test('connected shrink closes the run seam and rotated sink growth follows depth axis',()=>{
 const d=defaultDesign('custom');d.components=[makeComponent('sink','a',0,0,90,36),makeComponent('base','b',0,36,90,36)];
 const next=connectedEdit(d,'a',{width:48})!;valid(next);assert.equal(next.components[1].z,48);assert.equal(next.components[0].z,6);
 const smaller=connectedEdit(next,'a',{width:36})!;valid(smaller);assert.equal(smaller.components[1].z,36);
});
test('shift pushes a chain without overlap and free move respects quarter-inch persistence',()=>{
 const d=defaultDesign('custom');d.components=[makeComponent('base','a',0,0),makeComponent('base','b',30,0),makeComponent('base','c',60,0)];
 const next=connectedEdit(d,'a',{x:12})!;valid(next);assert.deepEqual(next.components.map(c=>c.x),[12,42,72]);
 assert.equal(connectedEdit(d,'a',{x:NaN}),null);
});
test('room limit rejects atomic expansion; constrained mode stops at neighbouring piece',()=>{
 const d=defaultDesign('custom');d.roomWidth=720;d.components=[makeComponent('sink','a',342,0,0,36)];assert.equal(connectedEdit(d,'a',{width:60}),null);
 const c=defaultDesign('custom');c.components=[makeComponent('sink','a',0,0),makeComponent('base','b',33,0)];const n=connectedEdit(c,'a',{width:48},false);if(n)valid(n);
});
test('each independently moved boundary carries flush pieces and preserves other world distances',()=>{
 for(const side of WALL_SIDES){const d=defaultDesign('custom');const c=makeComponent('base','a');const sign=side==='left'||side==='back'?-1:1;const axis=side==='left'||side==='right'?'x':'z';c[axis]=sign*((axis==='x'?d.roomWidth:d.roomDepth)-footprint(c)[axis==='x'?'width':'depth'])/2;d.components=[c];const next=moveBoundary(d,side,12)!;assert.ok(next);valid(next);assert.equal(next.components[0][axis],c[axis]+sign*6);}
});
test('backsplash always stays within boundaries and opening cutouts for every wall',()=>{
 const d=defaultDesign('custom');d.roomWalls=defaultWalls();for(const side of WALL_SIDES)d.roomWalls[side].enabled=true;
 d.components=[makeComponent('base','back',0,-84,0,60),makeComponent('base','front',0,84,0,60),makeComponent('base','left',-96,0,90,60),makeComponent('base','right',96,0,90,60)];
 d.openings=WALL_SIDES.map(wall=>({id:wall,wall,kind:'window',offset:0,bottom:40,width:20,height:40}));
 for(const side of WALL_SIDES){const rects=backsplashRects(d,side);assert.ok(rects.length);for(const r of rects){assert.ok(r.left>=-wallLength(d,side)/2&&r.right<=wallLength(d,side)/2);assert.ok(!(r.left<10&&r.right>-10&&r.top>40));}}
});
test('wall subtraction conserves area and fitted windows stay inside resized wall',()=>{
 const rects=cutOpenings({left:-50,right:50,bottom:0,top:100},[{id:'a',wall:'back',kind:'window',offset:0,bottom:40,width:20,height:20}]);assert.equal(rects.reduce((sum,r)=>sum+(r.right-r.left)*(r.top-r.bottom),0),9600);
 const d=defaultDesign();d.openings=[{id:'a',wall:'left',kind:'window',offset:500,bottom:140,width:144,height:100}];const o=fitOpenings(d)[0];assert.ok(o.offset+o.width/2<=d.roomDepth/2);assert.ok(o.bottom+o.height<=108);
 assert.equal(parseDesign({...d,openings:[{...o,width:NaN}]}),null);assert.equal(parseDesign({...d,roomWalls:{back:{enabled:true,height:108}}}),null);assert.ok(parseDesign(defaultDesign()));
});

test('new openings find clear wall space and edits cannot overlap frames',()=>{
 const d=defaultDesign();const next=addOpening(d,'window','new')!;assert.ok(next);const a=next.openings![1];assert.ok(!openingsOverlap(next.openings![0],a));
 assert.equal(editOpening(next,{...a,offset:0}),null);
 assert.ok(editOpening(next,{...a,wall:'left'}));
});
test('mixed connected transforms stay collision-free and reload identically',()=>{
 let d=defaultDesign();
 for(let i=0;i<100;i++){const c=d.components[i%d.components.length];const patch=i%3===0?{width:c.width+6}:i%3===1?{x:c.x+12}:{rotation:(c.rotation+90)%360};const next=connectedEdit(d,c.id,patch);if(next){valid(next);assert.deepEqual(parseDesign(JSON.parse(JSON.stringify(next))),next);d=next;}}
});
