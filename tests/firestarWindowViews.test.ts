import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import * as THREE from 'three';
import { createWindowViews } from '../components/firestar/kitchen/engine/flyover/windowViews.ts';

test('window photographs follow the active lighting through late loads, room rebuilds and disposal', t => {
  const loads: { url: string; texture: THREE.Texture; done: (texture: THREE.Texture) => void }[] = [];
  t.mock.method(THREE.TextureLoader.prototype, 'load', (url: string, done: (texture: THREE.Texture) => void) => {
    const texture = new THREE.Texture(); loads.push({ url, texture, done }); return texture;
  });
  let renders = 0;
  const windows = createWindowViews(() => renders++, 4);
  const opening = { id: 'window', kind: 'window' as const, wall: 'back' as const, width: 32, height: 36, offset: 24, bottom: 54 };
  const parent = new THREE.Group(); windows.add(parent, opening, 1);
  const view = (parent.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
  for (const load of loads) assert.ok(existsSync(`public${load.url}`), `Missing portable asset ${load.url}`);

  windows.setMode('night');
  loads[0].done(loads[0].texture); // Day finishes loading after the user already chose Night.
  assert.equal(view.map, null);
  loads[1].done(loads[1].texture);
  assert.equal(view.map, loads[1].texture);
  windows.setMode('day'); assert.equal(view.map, loads[0].texture);
  windows.setMode('night'); windows.clear();
  const rebuilt = new THREE.Group(); windows.add(rebuilt, opening, 1);
  assert.equal(((rebuilt.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial).map, loads[1].texture);
  assert.equal(loads.length, 2, 'Changing stone finishes must not reload exterior assets');

  windows.dispose();
  const before = renders; loads[0].done(loads[0].texture);
  assert.equal(renders, before, 'Late image loads must not render a disposed scene');
});
