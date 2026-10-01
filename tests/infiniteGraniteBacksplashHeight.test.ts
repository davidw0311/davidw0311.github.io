import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultDesign, makeComponent } from '../app/projects/infinite-granite/kitchen.ts';
import { backsplashRects } from '../app/projects/infinite-granite/room.ts';

test('full, half and quarter backsplash heights rise from the countertop, without changing its width or height', () => {
  const design = defaultDesign('custom');
  design.components = [makeComponent('base', 'counter', 0, -84)];
  design.openings = [];
  for (const ratio of [1, .5, .25] as const) {
    design.backsplashHeightRatio = ratio;
    assert.deepEqual(backsplashRects(design, 'back'), [{ left: -15, right: 15, bottom: 36, top: 36 + 18 * ratio }]);
    assert.equal(design.components[0].height, 36);
  }
  delete design.backsplashHeightRatio;
  assert.equal(backsplashRects(design, 'back')[0].top, 54, 'Old designs retain full-height backsplash');
  design.backsplash = 'none';
  assert.deepEqual(backsplashRects(design, 'back'), []);
});

test('short backsplash sections still respect windows and wall edges', () => {
  const design = defaultDesign('custom');
  design.components = [makeComponent('base', 'counter', 0, -84)];
  design.openings = [{ id: 'window', kind: 'window', wall: 'back', offset: 0, bottom: 38, width: 18, height: 20 }];
  for (const ratio of [1, .5, .25] as const) {
    design.backsplashHeightRatio = ratio;
    const pieces = backsplashRects(design, 'back');
    const area = pieces.reduce((sum, r) => sum + (r.right - r.left) * (r.top - r.bottom), 0);
    assert.equal(area, 30 * 18 * ratio - 18 * (18 * ratio - 2));
    assert.ok(pieces.every(r => r.bottom >= 36 && r.top <= 36 + 18 * ratio));
    assert.ok(pieces.every(r => r.top <= 38 || r.right <= -9 || r.left >= 9));
  }
});
