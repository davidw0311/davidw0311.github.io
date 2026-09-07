import assert from 'node:assert/strict';
import test from 'node:test';
import { LAYOUTS, MATERIALS, clampComponent, collisionPairs, defaultDesign, footprint, makeComponent, parseDesign, sinkOpening } from '../app/projects/infinite-granite/kitchen.ts';

for (const layout of LAYOUTS) test(`${layout.name} starts with non-overlapping components inside its room`, () => {
  const d = defaultDesign(layout.id);
  assert.deepEqual(collisionPairs(d.components), []);
  assert.equal(new Set(d.components.map(c => c.id)).size, d.components.length);
  for (const c of d.components) {
    const f = footprint(c);
    assert.ok(Math.abs(c.x) + f.width/2 <= d.roomWidth/2, c.id);
    assert.ok(Math.abs(c.z) + f.depth/2 <= d.roomDepth/2, c.id);
  }
  assert.ok(d.components.some(c => c.kind === 'sink'));
  assert.ok(d.components.some(c => c.kind === 'range'));
});
test('rotated components clamp correctly when the room shrinks', () => {
  const c = clampComponent({...makeComponent('island','test'), x:900, z:-900, rotation:90, width:84, depth:36},144,144);
  assert.equal(c.x,54); assert.equal(c.z,-30);
  assert.deepEqual(footprint(c),{width:36,depth:84});
});
test('collision detection allows uppers over bases but catches tall cupboards', () => {
  assert.deepEqual(collisionPairs([makeComponent('base','a'),makeComponent('upper','b')]),[]);
  assert.deepEqual(collisionPairs([makeComponent('pantry','a'),makeComponent('upper','b')]),[['a','b']]);
  assert.deepEqual(collisionPairs([makeComponent('base','a'),makeComponent('base','b',30)]),[]);
  assert.deepEqual(collisionPairs([makeComponent('base','a'),makeComponent('base','b',29)]),[['a','b']]);
});
test('all sink styles leave countertop margins at minimum and maximum sizes', () => {
  for (const width of [30,36,60,120]) for (const depth of [12,24,48]) for (const style of ['single','double','apron'] as const) {
    const c = {...makeComponent('sink','sink'),width,depth}; const cut = sinkOpening(c,style);
    assert.ok(cut.width > 0 && cut.depth > 0); assert.ok(cut.width <= width-6 && cut.depth <= depth-6);
  }
});
test('saved designs round-trip all materials, custom colors and component overrides', () => {
  for(const material of MATERIALS) {
    const d=defaultDesign();d.countertop=material.id;d.cabinetColor='#12abef';d.components[1].material='butcher';d.components[1].color='#ab12ef';
    assert.deepEqual(parseDesign(JSON.parse(JSON.stringify(d))),d);
  }
});
test('invalid saved data cannot produce broken geometry or unsupported textures', () => {
  assert.equal(parseDesign(null),null); assert.equal(parseDesign({version:2}),null);
  const d=defaultDesign();
  assert.equal(parseDesign({...d,roomWidth:NaN}),null);
  assert.equal(parseDesign({...d,components:[{...d.components[0],x:Infinity}]}),null);
  assert.equal(parseDesign({...d,components:[d.components[0],d.components[0]]}),null);
  assert.equal(parseDesign({...d,countertop:'missing'}),null);
  assert.equal(parseDesign({...d,cabinetColor:'url(https://example.com)'}),null);
  assert.equal(parseDesign({...d,components:Array(201).fill(d.components[0])}),null);
  assert.equal(parseDesign({...d,components:[{...d.components[0],material:'missing'}]}),null);
});

test('appliance bounds preserve usable geometry and upper cabinets remain below the ceiling', () => {
  const range=clampComponent({...makeComponent('range','r'),width:1,depth:1},216,192);
  assert.equal(range.width,24);assert.equal(range.depth,22);
  const upper=clampComponent({...makeComponent('upper','u'),height:1000},216,192);
  assert.equal(upper.height,42);
  assert.deepEqual(collisionPairs([makeComponent('range','r'),makeComponent('upper','u')]),[['r','u']]);
});


test('pattern visibility preserves old designs and round-trips supported preview settings', () => {
  const d=defaultDesign();
  assert.equal(d.patternContrast,2);
  for(const patternContrast of [1,2,3])assert.equal(parseDesign({...d,patternContrast})?.patternContrast,patternContrast);
  const legacy={...d};delete legacy.patternContrast;
  assert.ok(parseDesign(legacy));
  for(const patternContrast of [0,4,NaN,Infinity,'2'])assert.equal(parseDesign({...d,patternContrast}),null);
});
