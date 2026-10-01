import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { KITCHEN_LOOKS, kitchenLook, stationaryPose, surfaceDesign } from '../components/firestar/kitchen/looks.ts';
import { MATERIALS } from '../components/firestar/kitchen/engine/materials.ts';
import { collisionPairs } from '../components/firestar/kitchen/engine/kitchen.ts';
import { featuredSlabs } from '../components/firestar/quartz/featuredSlabs.ts';
import { activeSlideIndex } from '../components/firestar/quartz/carouselPosition.ts';

test('featured slabs cover every supplier and match the kitchen texture exactly', () => {
  assert.equal(featuredSlabs.length, 64);
  assert.equal(new Set(featuredSlabs.map(l => l.id)).size, featuredSlabs.length);
  assert.deepEqual([...new Set(featuredSlabs.map(l => l.supplier))].sort(), [...new Set(MATERIALS.map(m => m.company))].sort());
  assert.equal(new Set(featuredSlabs.slice(0, 7).map(l => l.supplier)).size, 7);
  for (const look of featuredSlabs) {
    const design = surfaceDesign(look.materialId!);
    const material = MATERIALS.find(m => m.id === design.countertop)!;
    assert.equal(material.id, look.materialId);
    assert.match(material.family, /quartz/i);
    assert.equal(material.textureKind, 'slab');
    assert.equal(material.textureUrl, `/assets/firestar/${look.image}.webp`);
    for (const suffix of ['.webp', '-thumb.webp']) assert.ok(existsSync(resolve('public/assets/firestar', look.image + suffix)));
    assert.deepEqual(design.components, surfaceDesign(featuredSlabs[0].materialId!).components);
  }
});

test('the kitchen selection follows fractional slides and both seamless wrap boundaries', () => {
  const count = featuredSlabs.length, step = 321.375, cycle = count * step;
  for (const index of [-1, 0, 1, count - 1, count, count + 1]) {
    const expected = ((index % count) + count) % count;
    for (const rounding of [-.4, 0, .4]) assert.equal(activeSlideIndex(cycle + index * step + rounding, cycle, step, count), expected);
  }
  assert.equal(activeSlideIndex(0, 0, 0, count), 0);
});

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
