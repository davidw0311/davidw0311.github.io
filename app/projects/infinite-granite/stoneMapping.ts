import { footprint, type KitchenComponent, type KitchenDesign } from './kitchen.ts';

export type StoneBounds = { min: [number, number, number]; max: [number, number, number] };

/** Joined worktops share one crop, including across cabinet/sink/dishwasher boundaries. */
export function counterRunBounds(design: KitchenDesign, component: KitchenComponent): StoneBounds {
  const candidates = design.components.filter(c => ['base', 'sink', 'dishwasher', 'island', 'vanity'].includes(c.kind)
    && (c.material ?? design.countertop) === (component.material ?? design.countertop)
    && Math.abs(c.height - component.height) < .01);
  const run = [component], visited = new Set([component.id]);
  for (let i = 0; i < run.length; i++) {
    const a = run[i], af = footprint(a);
    for (const b of candidates) {
      if (visited.has(b.id)) continue;
      const bf = footprint(b);
      const gapX = Math.abs(a.x - b.x) - (af.width + bf.width) / 2;
      const gapZ = Math.abs(a.z - b.z) - (af.depth + bf.depth) / 2;
      if (gapX <= .05 && gapZ <= .05 && (gapX < -.05 || gapZ < -.05)) { visited.add(b.id); run.push(b); }
    }
  }
  return {
    min: [Math.min(...run.map(c => c.x - footprint(c).width / 2)), 0, Math.min(...run.map(c => c.z - footprint(c).depth / 2))],
    max: [Math.max(...run.map(c => c.x + footprint(c).width / 2)), Math.max(...run.map(c => c.height)), Math.max(...run.map(c => c.z + footprint(c).depth / 2))],
  };
}

/** Fit a single photograph without repeating, stretching its aspect ratio, or clamping a visible band. */
export function stoneProjection(bounds: StoneBounds, width: number, height: number) {
  const span = bounds.max.map((v, i) => v - bounds.min[i]);
  const scale = Math.max(1, Math.max(span[0], span[2]) * 1.02 / width, Math.max(span[1], span[2]) * 1.02 / height);
  return { center: bounds.min.map((v, i) => (v + bounds.max[i]) / 2) as [number, number, number], size: [width * scale, height * scale] as [number, number] };
}

// Supplier photographs use a bounded crop; only procedural room textures repeat.
export const STONE_UV_GLSL = `
vec2 stoneUV(vec2 point) {
  vec2 uv = stoneSingleSlab ? clamp(vec2(0.5) + point / stonePhysicalSize, vec2(0.0), vec2(1.0)) : fract(point / stonePhysicalSize);
  return uv * (vec2(1.0) - 2.0 * stoneInset) + stoneInset;
}`;
