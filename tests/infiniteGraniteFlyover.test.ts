import test from 'node:test';
import assert from 'node:assert/strict';
import { flyoverPose, flyoverDesign, restoreFlyover, LOOP_SECONDS, DEFAULT_LIGHTING } from '../app/projects/infinite-granite/flyover/model.ts';
import { collisionPairs } from '../app/projects/infinite-granite/kitchen.ts';

test('camera loop closes without a position or velocity jump on desktop and portrait', () => {
  for (const aspect of [1.8, 1, .6]) {
    assert.deepEqual(flyoverPose(0, aspect), flyoverPose(LOOP_SECONDS, aspect));
    const before = flyoverPose(LOOP_SECONDS - .0001, aspect).position;
    const after = flyoverPose(.0001, aspect).position;
    const seam = flyoverPose(0, aspect).position;
    for (let axis = 0; axis < 3; axis++) {
      assert.ok(Math.abs((seam[axis] - before[axis]) - (after[axis] - seam[axis])) < .00001);
    }
    for (let t = 0; t < LOOP_SECONDS; t += .1) {
      const { position, target } = flyoverPose(t, aspect);
      assert.ok(position.every(Number.isFinite));
      assert.ok(position[1] > 100 && position[2] > 150, 'Camera clears the island and stays on the open side of the kitchen');
      assert.ok(target[1] > 30 && target[1] < 54, 'Countertops remain the centre of the shot');
    }
  }
});

test('flyover has no collisions, real fixtures and separately coloured cupboards', () => {
  const d = flyoverDesign();
  assert.deepEqual(collisionPairs(d.components), []);
  for (const kind of ['sink', 'range', 'fridge', 'upper', 'island']) assert.ok(d.components.some(c => c.kind === kind));
  assert.notEqual(d.upperColor, d.cabinetColor);
});

test('saved finishes survive reload without accepting altered geometry or invalid settings', () => {
  const d = flyoverDesign();
  const saved = { design: { ...d, floor: 'slate', floorColor: '#123456', cabinetColor: '#abcdef', components: [], countertop: 'soapstone' }, lighting: { mode: 'night', brightness: .8, warmth: .7 } };
  const restored = restoreFlyover(saved);
  assert.equal(restored.design.floor, 'slate');
  assert.equal(restored.design.floorColor, '#123456');
  assert.equal(restored.design.countertop, 'soapstone');
  assert.deepEqual(restored.design.components, d.components);
  assert.deepEqual(restored.lighting, saved.lighting);
  const invalid = restoreFlyover({ design: { floor: 'wrong', cabinetColor: 'red', countertop: 'gone' }, lighting: { mode: 'wrong', brightness: Infinity, warmth: NaN } });
  assert.deepEqual(invalid, { design: d, lighting: DEFAULT_LIGHTING });
  assert.deepEqual(restoreFlyover(null), invalid);
});

test('larger worktops keep a clear aisle and fit within the finished room', () => {
  const d = flyoverDesign(), island = d.components.find(c => c.kind === 'island')!;
  assert.ok(island.width * island.depth >= 2 * 60 * 36, 'Island surface more than doubles');
  for (const c of d.components.filter(c => ['base', 'sink', 'dishwasher'].includes(c.kind))) {
    assert.ok(c.depth >= 30, 'Rear countertop gains working depth');
    assert.ok(island.z - island.depth / 2 - (c.z + c.depth / 2) >= 48, 'Keep at least a four-foot working aisle');
    assert.equal(c.z - c.depth / 2, -d.roomDepth / 2, 'Rear worktop remains flush to its wall');
  }
  for (const c of d.components) {
    assert.ok(Math.abs(c.x) + c.width / 2 <= d.roomWidth / 2);
    assert.ok(Math.abs(c.z) + c.depth / 2 <= d.roomDepth / 2);
  }
  const restored = restoreFlyover({ design: { countertop: 'soapstone', components: [{ kind: 'island', width: 60, depth: 36 }] } });
  assert.equal(restored.design.components.find(c => c.kind === 'island')!.width, 96, 'Existing saved looks receive the enlarged scene');
});
