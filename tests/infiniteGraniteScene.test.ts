import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { countertopGeometry } from '../app/projects/infinite-granite/sceneGeometry.ts';
import { makeComponent, sinkOpening, SIZE_LIMITS } from '../app/projects/infinite-granite/kitchen.ts';

const tolerance = 1e-4;
const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} should equal ${expected}`);

test('rescaled countertops preserve exact snap footprints and finished heights, including quarter turns', () => {
  for (const kind of ['base', 'island', 'sink', 'dishwasher'] as const) {
    const limits = SIZE_LIMITS[kind];
    for (const width of limits.width) for (const depth of limits.depth) for (const height of limits.height) {
      for (const thickness of [.75, 3]) for (const rotation of [0, 90, 180, 270]) {
        const component = { ...makeComponent(kind, 'slab'), width, depth, height, rotation };
        const geometry = countertopGeometry(component, thickness, kind === 'sink' ? 'single' : undefined);
        const material = new THREE.MeshBasicMaterial();
        const mesh = new THREE.Mesh(geometry, material); mesh.rotation.y = rotation * Math.PI / 180;
        const bounds = new THREE.Box3().setFromObject(mesh);
        const rotated = rotation % 180 !== 0;
        near(bounds.min.x, -(rotated ? depth : width) / 2); near(bounds.max.x, (rotated ? depth : width) / 2);
        near(bounds.min.z, -(rotated ? width : depth) / 2); near(bounds.max.z, (rotated ? width : depth) / 2);
        near(bounds.min.y, height - thickness); near(bounds.max.y, height);
        geometry.dispose(); material.dispose();
      }
    }
  }
});

test('every sink style retains an open bowl and solid worktop at all allowed size extremes', () => {
  for (const style of ['single', 'double', 'apron'] as const) {
    for (const width of SIZE_LIMITS.sink.width) for (const depth of SIZE_LIMITS.sink.depth) for (const thickness of [.75, 3]) {
      const component = { ...makeComponent('sink', 'sink'), width, depth };
      const geometry = countertopGeometry(component, thickness, style);
      const material = new THREE.MeshBasicMaterial(); const mesh = new THREE.Mesh(geometry, material);
      const opening = sinkOpening(component, style);
      const ray = new THREE.Raycaster(new THREE.Vector3(0, 60, 0), new THREE.Vector3(0, -1, 0));
      for (const [x, z] of [[0, 0], [opening.width / 2 - 1, 0], [0, opening.depth / 2 - 1]]) {
        ray.ray.origin.set(x, 60, z);
        assert.equal(ray.intersectObject(mesh).length, 0, `The ${style} bowl must remain open`);
      }
      for (const [x, z] of [[width / 2 - 1, 0], [0, depth / 2 - 1]]) {
        ray.ray.origin.set(x, 60, z);
        assert.ok(ray.intersectObject(mesh).length > 0, 'A solid stone margin must surround the bowl');
      }
      geometry.dispose(); material.dispose();
    }
  }
});

test('adjacent rescaled slabs meet without overhang or intersecting geometry', () => {
  for (const rotation of [0, 90]) {
    const first = { ...makeComponent('base', 'first'), width: 12, depth: 18 };
    const second = { ...makeComponent('base', 'second'), width: 60, depth: 36 };
    const material = new THREE.MeshBasicMaterial();
    const a = new THREE.Mesh(countertopGeometry(first, 3), material);
    const b = new THREE.Mesh(countertopGeometry(second, 3), material);
    a.rotation.y = b.rotation.y = rotation * Math.PI / 180;
    b.position.x = rotation === 0 ? (first.width + second.width) / 2 : (first.depth + second.depth) / 2;
    const aBounds = new THREE.Box3().setFromObject(a), bBounds = new THREE.Box3().setFromObject(b);
    near(aBounds.max.x, bBounds.min.x);
    assert.ok(aBounds.max.x <= bBounds.min.x + tolerance);
    a.geometry.dispose(); b.geometry.dispose(); material.dispose();
  }
});
