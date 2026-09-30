import * as THREE from 'three';
import type { KitchenDesign } from '../kitchen';

/** Small, deterministic surface maps; shared across the scene and released on disposal. */
export function showroomTextures() {
  const make = (kind: 'wood' | 'plaster' | 'steel') => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d')!, pixels = ctx.createImageData(512, 128);
    let seed = 942;
    const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let y = 0; y < 128; y++) {
      const line = random();
      for (let x = 0; x < 512; x++) {
        const knot = Math.exp(-((x - 165) ** 2 / 1800 + (y - 75) ** 2 / 120));
        const grain = Math.sin(y * .32 + Math.sin(x * .018) * 1.2 + knot * 9);
        const value = kind === 'wood' ? 218 + grain * 4 + Math.sin(y * .23 + x * .006) * 9 - knot * 30 + random() * 4 : kind === 'steel' ? 190 + line * 30 + random() * 8 : 220 + random() * 25;
        const i = (y * 512 + x) * 4;
        pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value; pixels.data[i + 3] = 255;
      }
    }
    ctx.putImageData(pixels, 0, 0);
    const texture = new THREE.CanvasTexture(canvas); texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.anisotropy = 8;
    return texture;
  };
  const wood = make('wood'), plaster = make('plaster'), steel = make('steel');
  wood.colorSpace = THREE.SRGBColorSpace;
  return { wood, plaster, steel, dispose: () => { wood.dispose(); plaster.dispose(); steel.dispose(); } };
}

/** Architectural trim and a few objects add scale without obscuring the worktops. */
export function addShowroomDetails(parent: THREE.Group, design: KitchenDesign) {
  const material = (color: string, roughness = .6, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const mesh = (geometry: THREE.BufferGeometry, surface: THREE.Material, x: number, y: number, z: number) => {
    const object = new THREE.Mesh(geometry, surface); object.position.set(x, y, z); object.castShadow = object.receiveShadow = true; parent.add(object); return object;
  };
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, surface: THREE.Material) => mesh(new THREE.BoxGeometry(w, h, d), surface, x, y, z);
  const brass = material('#b29965', .26, .85), ceramic = material('#ded5c5', .4), trim = material('#e8e5db', .55), black = material('#242728', .48);
  // Baseboards and high picture-rail moulding make the room feel continuous.
  for (const side of [-1, 1]) {
    box(.8, 5, design.roomDepth, side * (design.roomWidth / 2 - .4), 2.8, 0, trim);
    box(1.5, 4, design.roomDepth, side * (design.roomWidth / 2 - .75), 120, 0, trim);
  }
  box(design.roomWidth, 4, 1.5, 0, 120, -design.roomDepth / 2 + .75, trim);
  for (const c of design.components.filter(c => c.kind === 'upper')) {
    box(c.width, 1.5, c.depth + .8, c.x, 54 + c.height + .4, c.z + .4, material(design.upperColor, .4));
    const strip = new THREE.MeshStandardMaterial({ color: '#ffe5bc', emissive: '#ffcf89', emissiveIntensity: .5 });
    box(c.width - 3, .18, .45, c.x, 53.8, c.z + c.depth / 2 - .5, strip);
  }
  const island = design.components.find(c => c.kind === 'island')!;
  // Two shallow brass pendants, hung well above the unobstructed island.
  for (const x of [-25, 25]) {
    mesh(new THREE.CylinderGeometry(.13, .13, 43, 8), black, island.x + x, 109.5, island.z);
    mesh(new THREE.CylinderGeometry(1.4, 7, 5.5, 40, 1, true), brass, island.x + x, 85.25, island.z);
    const diffuser = new THREE.MeshStandardMaterial({ color: '#fff4df', emissive: '#ffdc9f', emissiveIntensity: .5, side: THREE.DoubleSide });
    mesh(new THREE.CylinderGeometry(6.6, 6.6, .18, 40), diffuser, island.x + x, 82.5, island.z);
  }
  // Low ceramic bowl stays on the far corner, leaving the central slab visible.
  const points = [new THREE.Vector2(0, 0), new THREE.Vector2(2, .15), new THREE.Vector2(4, 1.3), new THREE.Vector2(5, 2.6), new THREE.Vector2(4.65, 2.7), new THREE.Vector2(3.6, 1.4), new THREE.Vector2(0, .4)];
  const bx = island.x - island.width * .33, bz = island.z - island.depth * .22;
  mesh(new THREE.LatheGeometry(points, 40), ceramic, bx, island.height + .05, bz);
  for (const [x, z, size] of [[-1.9, 0, 1.45], [1.1, -.6, 1.55], [0, 1.5, 1.3]]) mesh(new THREE.SphereGeometry(size, 20, 12), material('#b19447', .68), bx + x, island.height + 1.8, bz + z);
  // Board and utensil crock on the rear landing counter, away from the sink/range.
  const base = design.components.find(c => c.kind === 'base')!;
  box(10, .6, 15, base.x + 2, base.height + .3, base.z + 1, material('#aa8154', .72));
  mesh(new THREE.CylinderGeometry(2.2, 2.1, 5.5, 28), ceramic, base.x - 4, base.height + 2.75, base.z - 7);
  for (let i = 0; i < 3; i++) {
    const utensil = mesh(new THREE.CylinderGeometry(.2, .2, 8, 8), material('#967047', .7), base.x - 5 + i, base.height + 6, base.z - 7); utensil.rotation.z = (i - 1) * .14;
    mesh(new THREE.SphereGeometry(.7, 12, 8), material('#967047', .7), base.x - 5 + i + (1 - i) * .5, base.height + 10, base.z - 7).scale.set(1, 1.5, .35);
  }
}
