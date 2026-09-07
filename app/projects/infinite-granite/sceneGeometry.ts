import * as THREE from 'three';
import { sinkOpening, type KitchenComponent, type SinkStyle } from './kitchen.ts';

function roundedRect(path: THREE.Shape | THREE.Path, width: number, depth: number, radius: number) {
  const x = -width / 2, z = -depth / 2, r = Math.min(radius, width / 4, depth / 4);
  path.moveTo(x + r, z); path.lineTo(x + width - r, z);
  path.quadraticCurveTo(x + width, z, x + width, z + r); path.lineTo(x + width, z + depth - r);
  path.quadraticCurveTo(x + width, z + depth, x + width - r, z + depth); path.lineTo(x + r, z + depth);
  path.quadraticCurveTo(x, z + depth, x, z + depth - r); path.lineTo(x, z + r);
  path.quadraticCurveTo(x, z, x + r, z); path.closePath();
}

/** A single slab, in component coordinates, whose inset bevel preserves the nominal footprint. */
export function countertopGeometry(component: KitchenComponent, thickness: number, sinkStyle?: SinkStyle): THREE.ExtrudeGeometry {
  const bevel = .06;
  const shape = new THREE.Shape();
  roundedRect(shape, component.width - 2 * bevel, component.depth - 2 * bevel, .12);
  if (sinkStyle) {
    const opening = sinkOpening(component, sinkStyle), cutout = new THREE.Path();
    roundedRect(cutout, opening.width + 2 * bevel, opening.depth + 2 * bevel, .65);
    shape.holes.push(cutout);
  }
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness - 2 * bevel, steps: 1, curveSegments: 3,
    bevelEnabled: true, bevelSegments: 1, bevelSize: bevel, bevelThickness: bevel,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, component.height - thickness + bevel, 0);
  return geometry;
}
