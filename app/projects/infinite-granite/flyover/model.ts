import { type KitchenDesign } from '../kitchen.ts';
import { kitchenPresetDesign } from '../kitchenPresets.ts';
import { resolveMaterialId } from '../materials.ts';
import { FLOOR_FINISHES } from '../roomFinishes.ts';

export const LOOP_SECONDS = 5;
export type Lighting = { mode: 'day' | 'night'; brightness: number; warmth: number };
export const DEFAULT_LIGHTING: Lighting = { mode: 'day', brightness: 1, warmth: .35 };
export function flyoverDesign(): KitchenDesign {
  const layout = kitchenPresetDesign('single-island');
  // Deeper worktops and a generous island retain a 57-inch working aisle.
  layout.components = layout.components.map(c => c.kind === 'island' ? { ...c, width: 96, depth: 48, x: -2, z: 15 } : ['base', 'sink', 'dishwasher', 'range'].includes(c.kind) ? { ...c, depth: 30, z: -81 } : c);
  layout.roomWalls = { back: { enabled: true, height: 132 }, left: { enabled: true, height: 132 }, right: { enabled: true, height: 132 }, front: { enabled: false, height: 132 } };
  layout.openings = [...layout.openings!, { id: 'flyover-daylight-window', kind: 'window', wall: 'left', offset: 22, bottom: 48, width: 66, height: 58 }];
  return { ...layout, patternContrast: 1.4, waterfall: true, cabinetColor: '#8b9a88', upperColor: '#e8e7df', islandColor: '#314c43', backsplash: 'slab', wallColor: '#e5e1d9', backgroundColor: '#e9e5dc' };
}
/** Eye-level stroll along the open side of the island; position and velocity loop smoothly. */
export function flyoverPose(seconds: number, aspect: number, zoom = 1) {
  const phase = (seconds % LOOP_SECONDS) / LOOP_SECONDS * Math.PI * 2;
  const baseFov = aspect < 1 ? 78 : 58;
  return {
    position: [32 + Math.sin(phase) * 28, 65 + Math.sin(phase * 2) * .2, 112 + Math.cos(phase) * 8] as [number, number, number],
    target: [-8, 40, -40] as [number, number, number],
    fov: 2 * Math.atan(Math.tan(baseFov * Math.PI / 360) / clampZoom(zoom)) * 180 / Math.PI,
  };
}
export function clampZoom(value: number) { return Number.isFinite(value) ? Math.max(.75, Math.min(1.8, value)) : 1; }
export function restoreFlyover(raw: unknown): { design: KitchenDesign; lighting: Lighting } {
  const design = flyoverDesign(), lighting = { ...DEFAULT_LIGHTING };
  if (!raw || typeof raw !== 'object') return { design, lighting };
  const saved = raw as Record<string, unknown>;
  const d = saved.design as Partial<KitchenDesign> | undefined;
  if (d && typeof d === 'object') {
    const material = resolveMaterialId(d.countertop);
    if (material) design.countertop = material;
    if (FLOOR_FINISHES.some(f => f.id === d.floor)) design.floor = d.floor!;
    for (const key of ['cabinetColor', 'upperColor', 'islandColor', 'floorColor', 'wallColor'] as const) {
      if (typeof d[key] === 'string' && /^#[\da-f]{6}$/i.test(d[key]!)) design[key] = d[key]!;
    }
  }
  const l = saved.lighting as Partial<Lighting> | undefined;
  if (l && typeof l === 'object') {
    if (l.mode === 'day' || l.mode === 'night') lighting.mode = l.mode;
    if (typeof l.brightness === 'number' && Number.isFinite(l.brightness)) lighting.brightness = Math.max(.4, Math.min(1.5, l.brightness));
    if (typeof l.warmth === 'number' && Number.isFinite(l.warmth)) lighting.warmth = Math.max(0, Math.min(1, l.warmth));
  }
  return { design, lighting };
}
