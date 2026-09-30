import test from 'node:test';
import assert from 'node:assert/strict';
import { counterRunBounds, stoneProjection } from '../app/projects/infinite-granite/stoneMapping.ts';
import { flyoverDesign } from '../app/projects/infinite-granite/flyover/model.ts';
import { defaultDesign, makeComponent } from '../app/projects/infinite-granite/kitchen.ts';

test('one slab crop covers the whole island and waterfall, including both sides of the old world-origin seam', () => {
  const design = flyoverDesign(), island = design.components.find(c => c.kind === 'island')!;
  const bounds = counterRunBounds(design, island);
  const { center, size } = stoneProjection(bounds, 130, 65); // HanStone Avora
  assert.deepEqual(size, [130, 65], 'A full-size photograph retains its physical scale on the island');
  for (const x of [bounds.min[0], -.001, 0, .001, bounds.max[0]]) {
    for (const y of [bounds.min[1], bounds.max[1]]) {
      for (const z of [bounds.min[2], bounds.max[2]]) {
        const local = [x, y, z].map((v, i) => v - center[i]);
        for (const axes of [[0, 2], [2, 1], [0, 1]]) {
          axes.forEach((axis, i) => assert.ok(.5 + local[axis] / size[i] > 0 && .5 + local[axis] / size[i] < 1, 'Every projection lies inside the photo, without wrapping or an edge-clamped band'));
        }
      }
    }
  }
});

test('joined countertops share a crop, while empty space or another slab separates runs', () => {
  const design = defaultDesign('custom');
  const a = makeComponent('base', 'a', -30, 0);
  const b = makeComponent('sink', 'b', 0, 0, 0, 30);
  const c = makeComponent('dishwasher', 'c', 27, 0);
  const island = makeComponent('island', 'island', 0, 90);
  design.components = [a, b, c, island];
  const bounds = counterRunBounds(design, a);
  assert.deepEqual(counterRunBounds(design, b), bounds);
  assert.deepEqual(counterRunBounds(design, c), bounds);
  assert.notDeepEqual(counterRunBounds(design, island), bounds);
  c.material = 'different-slab';
  assert.notDeepEqual(counterRunBounds(design, c), counterRunBounds(design, b));
  b.x += 1;
  assert.notDeepEqual(counterRunBounds(design, a), counterRunBounds(design, b));
});

test('oversized and rotated counters fit a single image without changing its aspect ratio', () => {
  const design = defaultDesign('custom');
  const counter = makeComponent('island', 'long', -60, 20, 90, 240);
  design.components = [counter];
  const bounds = counterRunBounds(design, counter), { size } = stoneProjection(bounds, 130, 65);
  assert.equal(size[0] / size[1], 2);
  assert.ok(size[1] > 240);
  assert.deepEqual(bounds.min, [-78, 0, -100]);
  assert.deepEqual(bounds.max, [-42, 36, 140]);
});
