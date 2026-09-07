import { MATERIALS } from './materials.ts';
export { MATERIALS } from './materials.ts';
export const MAX_COMPONENTS = 200;
export type LayoutId = 'custom' | 'island' | 'l-shape' | 'straight' | 'galley' | 'u-shape' | 'peninsula';
export type ComponentKind = 'base' | 'upper' | 'island' | 'sink' | 'range' | 'fridge' | 'dishwasher' | 'pantry';
export type DoorStyle = 'shaker' | 'slab' | 'inset';
export type SinkStyle = 'single' | 'double' | 'apron';
export type Finish = 'steel' | 'black' | 'brass' | 'white';
export interface KitchenComponent {
  id: string; kind: ComponentKind; name: string;
  x: number; z: number; rotation: number; width: number; depth: number; height: number;
  color?: string; material?: string;
}
export interface KitchenDesign {
  version: 1; layout: LayoutId; roomWidth: number; roomDepth: number;
  gridSize?: number; gridCellSize?: number;
  patternContrast?: number;
  countertop: string; cabinetColor: string; upperColor: string; islandColor: string;
  doorStyle: DoorStyle; hardware: Finish; sinkStyle: SinkStyle; sinkFinish: Finish;
  faucet: 'arc' | 'square'; wallColor: string; floor: 'oak' | 'walnut' | 'tile';
  backsplash: 'subway' | 'slab' | 'none'; counterThickness: number; waterfall: boolean;
  components: KitchenComponent[];
}
export const LAYOUTS: { id: LayoutId; name: string; detail: string; footprint: string }[] = [
  { id: 'island', name: 'L + island', detail: 'Open & social', footprint: 'island' },
  { id: 'l-shape', name: 'L-shaped', detail: 'An open corner', footprint: 'l' },
  { id: 'straight', name: 'Single wall', detail: 'Simple & compact', footprint: 'straight' },
  { id: 'galley', name: 'Galley', detail: 'Two parallel runs', footprint: 'galley' },
  { id: 'u-shape', name: 'U-shaped', detail: 'Three working sides', footprint: 'u' },
  { id: 'peninsula', name: 'Peninsula', detail: 'A connected bar', footprint: 'peninsula' },
];
export const COLORS = [
  { name: 'Chalk', value: '#e8e7df' }, { name: 'Linen', value: '#cfc6b7' },
  { name: 'Sage', value: '#8b9a88' }, { name: 'Forest', value: '#314c43' },
  { name: 'Navy', value: '#293f54' }, { name: 'Graphite', value: '#44484a' },
  { name: 'Terracotta', value: '#a76750' }, { name: 'Natural oak', value: '#b78d60' },
];
export const FINISHES: { id: Finish; name: string; color: string }[] = [
  { id: 'steel', name: 'Brushed steel', color: '#a9b2b5' },
  { id: 'black', name: 'Matte black', color: '#292c2d' },
  { id: 'brass', name: 'Brushed brass', color: '#b7a06c' },
  { id: 'white', name: 'White ceramic', color: '#f1f1eb' },
];
export const KIND_NAMES: Record<ComponentKind, string> = {
  base: 'Base cupboard', upper: 'Wall cupboard', island: 'Island', sink: 'Sink cabinet',
  range: 'Range & hood', fridge: 'Refrigerator', dishwasher: 'Dishwasher', pantry: 'Tall pantry',
};
export const DEFAULT_SIZES: Record<ComponentKind, [number, number, number]> = {
  base: [30, 24, 36], upper: [30, 12, 30], island: [66, 36, 36], sink: [36, 24, 36],
  range: [30, 26, 36], fridge: [36, 30, 72], dishwasher: [24, 24, 36], pantry: [24, 24, 84],
};
export const SIZE_LIMITS: Record<ComponentKind, { width: [number, number]; depth: [number, number]; height: [number, number] }> = {
  base: {width:[12,60],depth:[18,36],height:[30,42]}, upper: {width:[12,60],depth:[10,24],height:[18,42]},
  island: {width:[36,120],depth:[24,48],height:[30,42]}, sink: {width:[30,60],depth:[20,36],height:[30,42]},
  range: {width:[24,48],depth:[22,36],height:[30,42]}, fridge: {width:[24,48],depth:[24,36],height:[60,96]},
  dishwasher: {width:[18,30],depth:[20,30],height:[30,40]}, pantry: {width:[12,48],depth:[12,30],height:[60,96]},
};
export function makeComponent(kind: ComponentKind, id: string, x = 0, z = 0, rotation = 0, width?: number): KitchenComponent {
  const [w, depth, height] = DEFAULT_SIZES[kind];
  return { id, kind, name: KIND_NAMES[kind], x, z, rotation, width: width ?? w, depth, height };
}
export function presetComponents(layout: LayoutId): KitchenComponent[] {
  if (layout === 'custom') return [];
  const parts: KitchenComponent[] = [];
  const add = (kind: ComponentKind, x: number, z: number, rotation = 0, width?: number) => {
    const c = makeComponent(kind, `${kind}-${parts.length + 1}`, x, z, rotation, width); parts.push(c); return c;
  };
  let x = -84;
  for (const [kind, width] of [['fridge', 36], ['base', 30], ['sink', 36], ['dishwasher', 24], ['range', 30], ['base', 12]] as [ComponentKind, number][]) {
    add(kind, x + width / 2, kind === 'fridge' ? -81 : kind === 'range' ? -83 : -84, 0, width); x += width;
  }
  add('upper', -33, -90, 0, 30); add('upper', 30, -90, 0, 24); add('upper', 78, -90, 0, 12);
  if (['l-shape', 'island', 'u-shape', 'peninsula'].includes(layout)) {
    for (const z of [-54, -18, 18]) add('base', -96, z, 90, 36);
    add('upper', -102, -48, 90, 48);
  }
  if (layout === 'island') add('island', 5, 27, 0, 66);
  if (layout === 'galley') for (const x of [-54, -18, 18, 54]) add('base', x, 18, 180, 36);
  if (layout === 'u-shape') for (const z of [-54, -18, 18]) add('base', 96, z, 270, 36);
  if (layout === 'peninsula') { add('base', -96, 54, 90, 36); add('island', -42, 54, 180, 84); }
  return parts;
}
export function defaultDesign(layout: LayoutId = 'island'): KitchenDesign {
  return { version: 1, layout, roomWidth: 216, roomDepth: 192, countertop: 'calacatta', patternContrast: 2, cabinetColor: '#8b9a88', upperColor: '#e8e7df', islandColor: '#314c43', doorStyle: 'shaker', hardware: 'brass', sinkStyle: 'single', sinkFinish: 'steel', faucet: 'arc', wallColor: '#e5e7e3', floor: 'oak', backsplash: 'subway', counterThickness: 1.25, waterfall: false, components: presetComponents(layout) };
}
export function footprint(c: KitchenComponent) {
  const rotated = Math.round(c.rotation / 90) % 2 !== 0;
  return { width: rotated ? c.depth : c.width, depth: rotated ? c.width : c.depth };
}
export function clampComponent(c: KitchenComponent, roomWidth: number, roomDepth: number): KitchenComponent {
  const limits = SIZE_LIMITS[c.kind];
  const bound = (key: 'width' | 'depth' | 'height') => Math.round(Math.max(limits[key][0], Math.min(limits[key][1], c[key])) * 2) / 2;
  const next = { ...c, width: bound('width'), depth: bound('depth'), height: bound('height'), rotation: ((Math.round(c.rotation / 90) * 90) % 360 + 360) % 360 };
  const size = footprint(next);
  next.x = Math.round(Math.max((-roomWidth + size.width) / 2, Math.min((roomWidth - size.width) / 2, c.x)) * 4) / 4;
  next.z = Math.round(Math.max((-roomDepth + size.depth) / 2, Math.min((roomDepth - size.depth) / 2, c.z)) * 4) / 4;
  return next;
}
export function collisionPairs(components: KitchenComponent[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < components.length; i++) for (let j = i + 1; j < components.length; j++) {
    const a = components[i], b = components[j];
    const ay = a.kind === 'upper' ? 54 : 0, by = b.kind === 'upper' ? 54 : 0;
    const aHeight = a.kind === 'range' ? a.height + 60 : a.kind === 'sink' ? a.height + 15 : a.height;
    const bHeight = b.kind === 'range' ? b.height + 60 : b.kind === 'sink' ? b.height + 15 : b.height;
    if (ay >= by + bHeight - 1e-6 || by >= ay + aHeight - 1e-6) continue;
    const af = footprint(a), bf = footprint(b);
    if (Math.abs(a.x - b.x) < (af.width + bf.width) / 2 - 1e-6 && Math.abs(a.z - b.z) < (af.depth + bf.depth) / 2 - 1e-6) pairs.push([a.id, b.id]);
  }
  return pairs;
}
export function sinkOpening(c: KitchenComponent, style: SinkStyle) {
  return { width: Math.min(c.width - 6, style === 'double' ? 32 : 28), depth: Math.min(c.depth - 6, 18) };
}
export function colorName(color: string): string { return COLORS.find(c => c.value === color)?.name ?? color.toUpperCase(); }
export function inches(value: number): string { const feet = Math.floor(value / 12); const rest = Math.round((value - feet * 12) * 2) / 2; return `${feet}′ ${rest}″`; }
const hex = /^#[0-9a-fA-F]{6}$/;
const kinds = Object.keys(KIND_NAMES);
// Stored designs are untrusted input, even when they come from this browser.
export function parseDesign(input: unknown): KitchenDesign | null {
  if (!input || typeof input !== 'object') return null;
  const d = input as KitchenDesign;
  if (d.version !== 1 || (d.layout !== 'custom' && !LAYOUTS.some(l => l.id === d.layout)) || !Array.isArray(d.components) || d.components.length > MAX_COMPONENTS) return null;
  if (![d.roomWidth, d.roomDepth].every(v => Number.isFinite(v) && v >= 144 && v <= 360)) return null;
  if (!MATERIALS.some(m => m.id === d.countertop) || !['shaker', 'slab', 'inset'].includes(d.doorStyle) || !['single', 'double', 'apron'].includes(d.sinkStyle)) return null;
  if (![d.hardware, d.sinkFinish].every(v => FINISHES.some(f => f.id === v)) || !['arc', 'square'].includes(d.faucet) || !['oak', 'walnut', 'tile'].includes(d.floor) || !['subway', 'slab', 'none'].includes(d.backsplash)) return null;
  if (![d.cabinetColor, d.upperColor, d.islandColor, d.wallColor].every(v => typeof v === 'string' && hex.test(v))) return null;
  if (!Number.isFinite(d.counterThickness) || d.counterThickness < 0.75 || d.counterThickness > 3 || typeof d.waterfall !== 'boolean') return null;
  if (d.patternContrast !== undefined && (![1,2,3].includes(d.patternContrast))) return null;
  if (d.gridSize !== undefined && (!Number.isInteger(d.gridSize) || d.gridSize < 4 || d.gridSize > 10)) return null;
  if (d.gridCellSize !== undefined && d.gridCellSize !== 36) return null;
  const ids = new Set<string>();
  for (const c of d.components) {
    if (!c || !kinds.includes(c.kind) || typeof c.id !== 'string' || c.id.length > 80 || ids.has(c.id) || typeof c.name !== 'string' || c.name.length > 80) return null;
    ids.add(c.id);
    if (![c.x, c.z, c.rotation, c.width, c.depth, c.height].every(Number.isFinite)) return null;
    if (c.color !== undefined && (typeof c.color !== 'string' || !hex.test(c.color))) return null;
    if (c.material !== undefined && !MATERIALS.some(m => m.id === c.material)) return null;
  }
  return { ...d, components: d.components.map(c => clampComponent(c, d.roomWidth, d.roomDepth)) };
}

export function layoutName(layout: LayoutId): string { return layout === 'custom' ? 'Custom kitchen' : LAYOUTS.find(l => l.id === layout)?.name ?? 'Kitchen'; }
