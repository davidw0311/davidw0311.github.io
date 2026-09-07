import assert from 'node:assert/strict';
import test from 'node:test';
import { collisionPairs, defaultDesign, footprint, LAYOUTS, makeComponent, parseDesign } from '../app/projects/infinite-granite/kitchen.ts';
import { componentsOverlap, createCustomDesign, createGridComponent, findPlacement, isPlacementValid, resizeRoom, resolvePlacement } from '../app/projects/infinite-granite/placement.ts';

test('a small gap snaps closed while fronts align at a corner', () => {
  const fixed = makeComponent('base', 'fixed', 0, 0);
  const moved = makeComponent('base', 'moved', 60, 0);
  const result = resolvePlacement({ ...moved, x: 32, z: 2 }, [fixed, moved], 216, 192);
  assert.equal(result.accepted, true);
  assert.equal(result.snapped, true);
  assert.equal(result.component.x, 30);
  assert.equal(result.component.z, 0);
  assert.equal(componentsOverlap(result.component, fixed), false);
});

test('dragging into or across an obstacle stops flush at the first edge', () => {
  const fixed = makeComponent('base', 'fixed', 40);
  const moved = makeComponent('base', 'moved');
  for (const x of [20, 90]) {
    const result = resolvePlacement({ ...moved, x }, [fixed, moved], 216, 192);
    assert.equal(result.accepted, true);
    assert.equal(result.component.x, 10);
    assert.equal(componentsOverlap(result.component, fixed), false);
  }
});

test('a component can move away from or slide alongside a touching neighbor', () => {
  const fixed = makeComponent('base', 'fixed', 30);
  const moved = makeComponent('base', 'moved');
  assert.equal(resolvePlacement({ ...moved, x: -10 }, [fixed, moved], 216, 192).component.x, -10);
  assert.equal(resolvePlacement({ ...moved, z: 30 }, [fixed, moved], 216, 192).component.z, 30);
});

test('one-inch keyboard moves can leave a snapped edge and snap again on approach', () => {
  const fixed = makeComponent('base', 'fixed', 30);
  let moved = makeComponent('base', 'moved');
  for (let step = 1; step <= 6; step++) {
    const result = resolvePlacement({ ...moved, x: moved.x - 1 }, [fixed, moved], 216, 192);
    assert.equal(result.accepted, true);
    assert.equal(result.component.x, -step);
    moved = result.component;
  }
  const approach = resolvePlacement({ ...moved, x: -3 }, [fixed, moved], 216, 192);
  assert.equal(approach.component.x, 0);
  assert.equal(approach.snapped, true);
});

test('diagonal movement stops before penetrating a neighbor corner', () => {
  const fixed = makeComponent('base', 'fixed', 50, 50);
  const moved = makeComponent('base', 'moved');
  const result = resolvePlacement({ ...moved, x: 55, z: 55 }, [fixed, moved], 216, 192);
  assert.equal(result.accepted, true);
  assert.equal(componentsOverlap(result.component, fixed), false);
  assert.ok(result.component.x <= 26 && result.component.z <= 26);
});

test('scaling preserves a touching edge and grows into the available side', () => {
  const fixed = makeComponent('base', 'fixed', 30);
  const moved = makeComponent('base', 'moved');
  const result = resolvePlacement({ ...moved, width: 60 }, [fixed, moved], 216, 192);
  assert.equal(result.accepted, true);
  assert.equal(result.component.width, 60);
  assert.equal(result.component.x, -15);
  assert.equal(result.component.x + result.component.width / 2, fixed.x - fixed.width / 2);
});

test('scaling a trapped component is rejected without shifting neighbors', () => {
  const moved = makeComponent('base', 'moved');
  const parts = [moved, makeComponent('base', 'left', -30), makeComponent('base', 'right', 30)];
  const snapshot = structuredClone(parts);
  const result = resolvePlacement({ ...moved, width: 48 }, parts, 216, 192);
  assert.equal(result.accepted, false);
  assert.equal(result.reason, 'collision');
  assert.deepEqual(result.component, moved);
  assert.deepEqual(parts, snapshot);
});

test('rotation uses the rotated footprint and preserves a previously shared edge', () => {
  const moved = { ...makeComponent('base', 'moved'), width: 12, depth: 36 };
  const fixed = makeComponent('base', 'fixed', 21);
  const result = resolvePlacement({ ...moved, rotation: 90 }, [moved, fixed], 216, 192);
  assert.equal(result.accepted, true);
  assert.deepEqual(footprint(result.component), { width: 36, depth: 12 });
  assert.equal(result.component.x, -12);
  assert.equal(componentsOverlap(result.component, fixed), false);
});

test('base cupboards share space with uppers, but tall units and range hoods cannot', () => {
  const upper = makeComponent('upper', 'upper');
  assert.equal(isPlacementValid(makeComponent('base', 'base'), [upper], 216, 192), true);
  for (const kind of ['fridge', 'pantry', 'range'] as const) {
    assert.equal(isPlacementValid(makeComponent(kind, kind), [upper], 216, 192), false);
  }
});

test('a sub-quarter-inch overlap is rejected instead of being mistaken for a seam', () => {
  const a = makeComponent('base', 'a');
  const b = makeComponent('base', 'b', 29.9);
  assert.equal(componentsOverlap(a, b), true);
  assert.equal(componentsOverlap(a, { ...b, x: 30 }), false);
});

test('snap targets preserve exact quarter-inch seams for fractional component widths', () => {
  const fixed = { ...makeComponent('base', 'fixed'), width: 30.5 };
  const moved = makeComponent('base', 'moved', 60);
  const result = resolvePlacement({ ...moved, x: 31 }, [fixed, moved], 216, 192);
  assert.equal(result.component.x, 30.25);
  assert.equal(componentsOverlap(result.component, fixed), false);
});

test('diagonal movement restores exactly the same geometry after saving', () => {
  const fixed = makeComponent('base', 'fixed', 50, 50);
  const moved = makeComponent('base', 'moved');
  const result = resolvePlacement({ ...moved, x: 55, z: 84 }, [fixed, moved], 216, 192);
  assert.equal(result.accepted, true);
  assert.equal(result.component.x, 20);
  assert.equal(result.component.z, 30.5);
  const design = { ...defaultDesign(), components: [fixed, result.component] };
  assert.deepEqual(parseDesign(JSON.parse(JSON.stringify(design))), design);
});

test('sink resizing cannot raise its faucet into a wall cupboard', () => {
  const sink = makeComponent('sink', 'sink');
  const upper = makeComponent('upper', 'upper');
  assert.equal(isPlacementValid(sink, [upper], 216, 192), true);
  assert.equal(resolvePlacement({ ...sink, height: 39 }, [sink, upper], 216, 192).accepted, true);
  const raised = resolvePlacement({ ...sink, height: 42 }, [sink, upper], 216, 192);
  assert.equal(raised.accepted, false);
  assert.equal(raised.reason, 'collision');
  assert.deepEqual(raised.component, sink);
  assert.deepEqual(collisionPairs([{ ...sink, height: 42 }, upper]), [['sink', 'upper']]);
});

test('every supported range height reserves the complete hood height', () => {
  for (const height of [30, 36, 42]) {
    const range = { ...makeComponent('range', 'range'), height };
    const upper = makeComponent('upper', 'upper');
    assert.equal(isPlacementValid(range, [upper], 216, 192), false);
    assert.deepEqual(collisionPairs([range, upper]), [['range', 'upper']]);
  }
});

test('all actual presets are strictly overlap-free and retain exact saved geometry', () => {
  for (const layout of LAYOUTS) {
    const design = defaultDesign(layout.id);
    assert.ok(design.components.every(c => isPlacementValid(c, design.components, design.roomWidth, design.roomDepth)), layout.name);
    assert.deepEqual(parseDesign(JSON.parse(JSON.stringify(design))), design);
  }
});

test('new components use the nearest free edge and report a completely full room', () => {
  const fixed = makeComponent('base', 'fixed');
  const placed = findPlacement(makeComponent('base', 'new'), [fixed], 216, 192)!;
  assert.ok(placed);
  assert.equal(placed.x ** 2 + placed.z ** 2, 24 ** 2);
  assert.equal(componentsOverlap(placed, fixed), false);
  const full = { ...makeComponent('island', 'full'), width: 36, depth: 36 };
  assert.equal(findPlacement(makeComponent('base', 'new'), [full], 36, 36), null);
});

test('room resize is atomic when clamping two components would make them intersect', () => {
  const design = { ...defaultDesign(), components: [makeComponent('island', 'left', -50, 0, 0, 84), makeComponent('island', 'right', 50, 0, 0, 84)] };
  const before = structuredClone(design);
  assert.equal(resizeRoom(design, 144, 144), null);
  assert.deepEqual(design, before);
  const larger = resizeRoom(design, 240, 240)!;
  assert.equal(larger.roomWidth, 240);
  assert.deepEqual(larger.components, design.components);
});

test('a 4 by 4 custom layout uses 36-inch squares with separate wall and floor layers', () => {
  const d = createCustomDesign(4, [
    { row: 0, column: 0, kind: 'base' },
    { row: 0, column: 0, kind: 'upper' },
    { row: 0, column: 1, kind: 'sink' },
    { row: 2, column: 2, kind: 'island', rotation: 90 },
  ])!;
  assert.equal(d.layout, 'custom');
  assert.equal(d.roomWidth, 144);
  assert.equal(d.roomDepth, 144);
  assert.equal(d.gridSize, 4);
  assert.equal(d.gridCellSize, 36);
  assert.equal(d.components.length, 4);
  assert.deepEqual(parseDesign(JSON.parse(JSON.stringify(d))), d);
  assert.deepEqual(footprint(d.components[0]), { width: 36, depth: 36 });
  assert.deepEqual(footprint(d.components[3]), { width: 36, depth: 36 });
  assert.ok(d.components.every(c => isPlacementValid(c, d.components, 144, 144)));
});

test('custom cells reject duplicate layers, tall/upper conflicts and invalid coordinates', () => {
  assert.equal(createCustomDesign(4, [{ row: 0, column: 0, kind: 'base' }, { row: 0, column: 0, kind: 'sink' }]), null);
  for (const kind of ['fridge', 'pantry', 'range'] as const) assert.equal(createCustomDesign(4, [{ row: 0, column: 0, kind }, { row: 0, column: 0, kind: 'upper' }]), null);
  for (const n of [3, 11, 4.5, NaN]) assert.equal(createCustomDesign(n, []), null);
  assert.equal(createGridComponent('base', 'a', -1, 0, 4), null);
  assert.equal(createGridComponent('base', 'a', 0, 4, 4), null);
  assert.equal(createGridComponent('base', 'a', 0, 0, 4, 0, 48), null);
  assert.equal(createCustomDesign(4, [], defaultDesign(), 48), null);
});

test('all grid orientations keep appliances inside their selected square', () => {
  for (const kind of ['base', 'upper', 'island', 'sink', 'range', 'fridge', 'dishwasher', 'pantry'] as const) for (const rotation of [0, 90, 180, 270]) {
    const c = createGridComponent(kind, kind, 0, 0, 4, rotation)!;
    const f = footprint(c);
    assert.ok(c.x - f.width / 2 >= -72 && c.x + f.width / 2 <= -36, `${kind} ${rotation} x`);
    assert.ok(c.z - f.depth / 2 >= -72 && c.z + f.depth / 2 <= -36, `${kind} ${rotation} z`);
  }
});

test('the largest grid accepts 100 base cupboards plus 100 wall cupboards', () => {
  const cells = Array.from({ length: 100 }, (_, index) => ({ row: Math.floor(index / 10), column: index % 10 }));
  const design = createCustomDesign(10, cells.flatMap(cell => [{ ...cell, kind: 'base' as const }, { ...cell, kind: 'upper' as const }]))!;
  assert.equal(design.components.length, 200);
  assert.ok(design.components.every(c => isPlacementValid(c, design.components, 360, 360)));
  assert.deepEqual(parseDesign(JSON.parse(JSON.stringify(design))), design);
});

test('many move, rotation and size edits never introduce collisions or leave the room', () => {
  let design = createCustomDesign(5, [
    { row: 0, column: 0, kind: 'base' }, { row: 0, column: 1, kind: 'sink' },
    { row: 0, column: 2, kind: 'fridge' }, { row: 2, column: 2, kind: 'island' },
    { row: 0, column: 0, kind: 'upper' },
  ])!;
  // Exercise the legacy free-placement engine without the new cell constraints.
  design = {...design,gridColumns:undefined,gridRows:undefined,components:design.components.map(c=>{const legacy={...c,depth:c.kind==='upper'?12:c.depth};delete legacy.cell;return legacy;})};
  delete design.gridColumns;delete design.gridRows;
  let seed = 41;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 300; i++) {
    const index = Math.floor(random() * design.components.length), original = design.components[index];
    const proposed = i % 3 === 0 ? { ...original, x: random() * 250 - 125, z: random() * 250 - 125 } : i % 3 === 1 ? { ...original, width: 12 + random() * 100, depth: 12 + random() * 48 } : { ...original, rotation: original.rotation + 90 };
    const result = resolvePlacement(proposed, design.components, design.roomWidth, design.roomDepth);
    if (result.accepted) design = { ...design, components: design.components.map(c => c.id === original.id ? result.component : c) };
    assert.ok(design.components.every(c => isPlacementValid(c, design.components, design.roomWidth, design.roomDepth)), `Edit ${i} caused an overlap`);
    assert.deepEqual(parseDesign(JSON.parse(JSON.stringify(design))), design, `Edit ${i} changed after saving`);
  }
});
