import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { KITCHEN_LOOKS, kitchenLook, stationaryPose } from '../components/firestar/kitchen/looks.ts';
import { MATERIALS } from '../components/firestar/kitchen/engine/materials.ts';
import { collisionPairs } from '../components/firestar/kitchen/engine/kitchen.ts';

test('landing finishes keep the same collision-free kitchen and valid supplier materials', () => {
  const initial = kitchenLook(0);
  for (let i = 0; i < KITCHEN_LOOKS.length; i++) {
    const design = kitchenLook(i);
    assert.deepEqual(design.components, initial.components);
    assert.deepEqual(collisionPairs(design.components), []);
    assert.ok(MATERIALS.some(m => m.id === design.countertop && m.textureUrl));
  }
  assert.deepEqual(kitchenLook(KITCHEN_LOOKS.length), initial);
  assert.deepEqual(kitchenLook(-1), kitchenLook(KITCHEN_LOOKS.length - 1));
  const wide = stationaryPose(1.8), portrait = stationaryPose(.6);
  assert.deepEqual(wide.position, portrait.position);
  assert.deepEqual(wide.target, portrait.target);
  assert.ok(portrait.fov > wide.fov, 'Portrait preview widens its field of view');
  assert.deepEqual(stationaryPose(1.8, 1.3).position, wide.position);
  assert.ok(stationaryPose(1.8, 1.3).fov < wide.fov);
});

test('every kitchen texture ships under Firestar, with no dependency on the original app', () => {
  for (const material of MATERIALS) {
    for (const url of [material.textureUrl, material.thumbnailUrl].filter(Boolean) as string[]) {
      assert.ok(url.startsWith('/assets/firestar/kitchen/'), `${material.id}: ${url}`);
      assert.ok(existsSync(resolve('public', url.slice(1))), `Missing ${url}`);
    }
  }
  const root = 'components/firestar/kitchen';
  for (const file of readdirSync(root, { recursive: true }) as string[]) {
    if (!/\.(tsx?|css)$/.test(file)) continue;
    const source = readFileSync(resolve(root, file), 'utf8');
    assert.doesNotMatch(source, /(?:\/assets|\/projects)\/infinite-granite\//, file);
  }
});
