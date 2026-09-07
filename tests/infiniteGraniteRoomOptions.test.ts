import test from 'node:test';
import assert from 'node:assert/strict';
import {LAYOUTS,BATHROOM_LAYOUTS,footprint,collisionPairs,parseDesign,type KitchenComponent} from '../app/projects/infinite-granite/kitchen.ts';
import {kitchenPresetDesign} from '../app/projects/infinite-granite/kitchenPresets.ts';
import {bathroomDesign} from '../app/projects/infinite-granite/bathrooms.ts';
import {replaceCell} from '../app/projects/infinite-granite/cellLayout.ts';
import {FLOOR_FINISHES,WALL_FINISHES} from '../app/projects/infinite-granite/roomFinishes.ts';
function frontZone(c:KitchenComponent,distance:number){const f=footprint(c);const r=c.rotation;return {x:c.x+(r===90?1:r===270?-1:0)*(f.width+distance)/2,z:c.z+(r===0?1:r===180?-1:0)*(f.depth+distance)/2,width:r%180?distance:f.width,depth:r%180?f.depth:distance};}
for(const l of [...LAYOUTS,...BATHROOM_LAYOUTS])test(`${l.name} has fixture access, no overlaps and valid saved geometry`,()=>{
 const bath=l.id.startsWith('bath-'),d=bath?bathroomDesign(l.id):kitchenPresetDesign(l.id);
 assert.deepEqual(collisionPairs(d.components),[]);assert.deepEqual(parseDesign(JSON.parse(JSON.stringify(d))),JSON.parse(JSON.stringify(d)));
 for(const c of d.components.filter(c=>bath?['vanity','toilet','shower','tub'].includes(c.kind):['fridge','sink','range','dishwasher'].includes(c.kind))){
  const zone=frontZone(c,bath?30:42);
  assert.ok(zone.x-zone.width/2>=-d.roomWidth/2&&zone.x+zone.width/2<=d.roomWidth/2,`${c.kind} access crosses a side boundary`);
  assert.ok(zone.z-zone.depth/2>=-d.roomDepth/2&&zone.z+zone.depth/2<=d.roomDepth/2,`${c.kind} access crosses a front/back boundary`);
  for(const other of d.components.filter(o=>o.id!==c.id&&o.kind!=='upper')){const f=footprint(other);assert.ok(Math.abs(zone.x-other.x)>=(zone.width+f.width)/2-1e-6||Math.abs(zone.z-other.z)>=(zone.depth+f.depth)/2-1e-6,`${c.kind} front access blocked by ${other.kind}`);}
  if(c.kind==='toilet'){assert.ok(d.roomWidth/2-Math.abs(c.x)>=18);}
  if(c.kind==='fridge'){const f=footprint(c);const sideMargin=c.rotation%180?d.roomDepth/2-Math.abs(c.z)-f.depth/2:d.roomWidth/2-Math.abs(c.x)-f.width/2;assert.ok(sideMargin>=12,'Fridge needs side-wall door clearance');}
 }
});
test('floor, wall and background options persist, and invalid finish data is rejected',()=>{
 const d=kitchenPresetDesign('island');
 for(const floor of FLOOR_FINISHES)for(const wall of WALL_FINISHES){const next={...d,floor:floor.id,wallMaterial:wall.id,floorColor:'#abc123',wallColor:'#aabbcc',backgroundColor:'#123456'};assert.deepEqual(parseDesign(JSON.parse(JSON.stringify(next))),JSON.parse(JSON.stringify(next)));}
 for(const bad of [{floor:'bad'},{wallMaterial:'bad'},{floorColor:'red'},{backgroundColor:null}])assert.equal(parseDesign({...d,...bad}),null);
});

test('dead corners are closed counters without inaccessible cabinet doors; replacement restores regular cabinetry',()=>{
 const d=kitchenPresetDesign('island'),corner=d.components.find(c=>c.closedCorner)!;assert.ok(corner);assert.equal(corner.kind,'base');const replaced=replaceCell(d,corner.id,'base')!;assert.equal(replaced.components.find(c=>c.id===corner.id)!.closedCorner,undefined);
});
