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
/** A small elliptical camera path: matching position AND velocity at the loop seam. */
export function flyoverPose(seconds: number, aspect: number) {
  const phase = (seconds % LOOP_SECONDS) / LOOP_SECONDS * Math.PI * 2;
  const fit = Math.max(1, 1.35 / Math.max(.25, aspect));
  const angle = .25 + Math.sin(phase) * .085;
  const distance = 215 * fit;
  return { position: [Math.sin(angle) * distance, 117 + (fit - 1) * 55 + Math.cos(phase) * 3, Math.cos(angle) * distance - 28] as [number, number, number], target: [0, 34, -28] as [number, number, number] };
}
export function restoreFlyover(raw: unknown): { design: KitchenDesign; lighting: Lighting } {
  const design = flyoverDesign(), lighting = { ...DEFAULT_LIGHTING };
  if (!raw || typeof raw !== 'object') return { design, lighting };
  const saved = raw as Record<string, unknown>;
  const d = saved.design as Partial<KitchenDesign> | undefined;
  if (d && typeof d === 'object') {
    const material = resolveMaterialId(d.countertop);
    if (material) design.countertop = material;
    if (FLOOR_FINISHES.some(f => f.id === d.floor)) design.floor = d.floor!;
    for (const key of ['cabinetColor', 'upperColor', 'islandColor', 'floorColor'] as const) {
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
