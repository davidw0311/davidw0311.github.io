import * as THREE from 'three';
import type { RoomOpening } from '../room';
import type { Lighting } from './model';

const SOURCES = {
  day: '/assets/firestar/kitchen/exterior/garden-morning.webp',
  night: '/assets/firestar/kitchen/exterior/garden-night.webp',
};

/** Scene-owned photographs survive finish changes; individual panes belong to the room model. */
export function createWindowViews(render: () => void, anisotropy: number) {
  let disposed = false, mode: Lighting['mode'] = 'day';
  const views: THREE.MeshBasicMaterial[] = [], panes: THREE.MeshPhysicalMaterial[] = [];
  const textures: Partial<Record<Lighting['mode'], THREE.Texture>> = {};
  const pending: THREE.Texture[] = [];
  const apply = () => {
    const night = mode === 'night';
    for (const material of views) {
      const texture = textures[mode] ?? null;
      if (Boolean(material.map) !== Boolean(texture)) material.needsUpdate = true;
      material.map = texture;
      material.color.set(texture ? '#ffffff' : night ? '#131f30' : '#b5c7d0');
    }
    for (const glass of panes) {
      glass.opacity = night ? .14 : .045;
      glass.envMapIntensity = night ? .7 : .3;
    }
  };
  const loader = new THREE.TextureLoader();
  for (const time of ['day', 'night'] as const) {
    const texture = loader.load(SOURCES[time], loaded => {
      if (disposed) { loaded.dispose(); return; }
      textures[time] = loaded; apply(); render();
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = anisotropy;
    pending.push(texture);
  }
  return {
    add(parent: THREE.Group, opening: RoomOpening, inward: number) {
      // Recess the landscape behind the actual opening; the wall and frame mask its edges.
      const width = opening.width + 24, height = opening.height + 24;
      const geometry = new THREE.PlaneGeometry(width, height);
      const uv = geometry.getAttribute('uv');
      const aspect = width / height, imageAspect = 1.5;
      const cropX = Math.min(1, aspect / imageAspect), cropY = Math.min(1, imageAspect / aspect);
      const center = opening.wall === 'left' ? .34 : .64;
      const left = THREE.MathUtils.clamp(center - cropX / 2, 0, 1 - cropX);
      for (let i = 0; i < uv.count; i++) uv.setXY(i, left + uv.getX(i) * cropX, (1 - cropY) / 2 + uv.getY(i) * cropY);
      const view = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
      const backdrop = new THREE.Mesh(geometry, view);
      backdrop.position.set(opening.offset, opening.bottom + opening.height / 2, -inward * 5);
      if (inward < 0) backdrop.rotation.y = Math.PI;
      parent.add(backdrop); views.push(view);

      const glass = new THREE.MeshPhysicalMaterial({ color: '#eef3f4', roughness: .08, metalness: .12, transparent: true, depthWrite: false, side: THREE.DoubleSide });
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(opening.width - 1, opening.height - 1), glass);
      pane.position.set(opening.offset, opening.bottom + opening.height / 2, inward * .1);
      parent.add(pane); panes.push(glass); apply();
    },
    setMode(next: Lighting['mode']) { mode = next; apply(); },
    // disposeModel owns the old meshes/materials. Drop references before rebuilding them.
    clear() { views.length = 0; panes.length = 0; },
    dispose() { disposed = true; pending.forEach(texture => texture.dispose()); views.length = 0; panes.length = 0; },
  };
}
