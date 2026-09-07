import { fitOpenings, openingsOverlap } from './room.ts';
import { clampComponent, defaultDesign, footprint, makeComponent, SIZE_LIMITS, type ComponentKind, type KitchenComponent, type KitchenDesign } from './kitchen.ts';

const EPSILON = 1e-6;
export const SNAP_DISTANCE = 3;
export interface PlacementResult {
  component: KitchenComponent;
  accepted: boolean;
  snapped: boolean;
  reason?: 'collision' | 'room' | 'invalid';
}
export interface GridCell {
  row: number;
  column: number;
  kind: ComponentKind;
  rotation?: number;
}

function bounds(c: KitchenComponent) {
  const size = footprint(c);
  return { left: c.x - size.width / 2, right: c.x + size.width / 2, back: c.z - size.depth / 2, front: c.z + size.depth / 2 };
}
function intersects(a0: number, a1: number, b0: number, b1: number, tolerance = -EPSILON) {
  return a0 < b1 + tolerance && b0 < a1 + tolerance;
}
/** The range includes its hood. Uppers can share floor area with low cabinetry. */
export function sharesHeight(a: KitchenComponent, b: KitchenComponent): boolean {
  const bottom = (c: KitchenComponent) => c.kind === 'upper' ? 54 : 0;
  const top = (c: KitchenComponent) => c.kind === 'range' ? c.height + 60 : c.kind === 'sink' ? c.height + 15 : bottom(c) + c.height;
  return intersects(bottom(a), top(a), bottom(b), top(b));
}
export function componentsOverlap(a: KitchenComponent, b: KitchenComponent): boolean {
  if (a.id === b.id || !sharesHeight(a, b)) return false;
  const aa = bounds(a), bb = bounds(b);
  return intersects(aa.left, aa.right, bb.left, bb.right) && intersects(aa.back, aa.front, bb.back, bb.front);
}
export function isPlacementValid(c: KitchenComponent, components: KitchenComponent[], roomWidth: number, roomDepth: number): boolean {
  if (![c.x, c.z, c.width, c.depth, c.height, c.rotation, roomWidth, roomDepth].every(Number.isFinite)) return false;
  const a = bounds(c);
  return c.width > 0 && c.depth > 0 && c.height > 0 &&
    a.left >= -roomWidth / 2 - EPSILON && a.right <= roomWidth / 2 + EPSILON &&
    a.back >= -roomDepth / 2 - EPSILON && a.front <= roomDepth / 2 + EPSILON &&
    !components.some(other => componentsOverlap(c, other));
}

/** Stop a drag at its first obstacle, including when the pointer moves right through it. */
function sweepMove(original: KitchenComponent, proposed: KitchenComponent, components: KitchenComponent[]): KitchenComponent {
  const a = bounds(original), dx = proposed.x - original.x, dz = proposed.z - original.z;
  let time = 1;
  function axisTimes(min: number, max: number, otherMin: number, otherMax: number, delta: number): [number, number] | null {
    if (Math.abs(delta) < EPSILON) return intersects(min, max, otherMin, otherMax) ? [-Infinity, Infinity] : null;
    return delta > 0 ? [(otherMin - max) / delta, (otherMax - min) / delta] : [(otherMax - min) / delta, (otherMin - max) / delta];
  }
  for (const other of components) {
    if (other.id === original.id || !sharesHeight(proposed, other)) continue;
    const b = bounds(other);
    const tx = axisTimes(a.left, a.right, b.left, b.right, dx), tz = axisTimes(a.back, a.front, b.back, b.front, dz);
    if (!tx || !tz) continue;
    const enter = Math.max(tx[0], tz[0]), leave = Math.min(tx[1], tz[1]);
    if (enter >= -EPSILON && enter < leave - EPSILON && leave > EPSILON && enter < time) time = Math.max(0, enter);
  }
  return { ...proposed, x: original.x + dx * time, z: original.z + dz * time };
}

interface AxisSnap { value: number; priority: number; }
function uniqueSnaps(snaps: AxisSnap[]): AxisSnap[] {
  const values = new Map<number, AxisSnap>();
  for (const snap of snaps) {
    const key = Math.round(snap.value * 1e6);
    if (!values.has(key) || values.get(key)!.priority < snap.priority) values.set(key, snap);
  }
  return [...values.values()];
}
function snapCandidates(c: KitchenComponent, components: KitchenComponent[], roomWidth: number, roomDepth: number, threshold: number, original?: KitchenComponent, movementOrigin?: KitchenComponent): KitchenComponent[] {
  const a = bounds(c), size = footprint(c), previous = original ? bounds(original) : undefined;
  const xs: AxisSnap[] = [{ value: c.x, priority: 0 }], zs: AxisSnap[] = [{ value: c.z, priority: 0 }];
  const add = (axis: AxisSnap[], current: number, value: number, priority = 1) => {
    const previousPosition = axis === xs ? movementOrigin?.x : movementOrigin?.z;
    const crossMovement = movementOrigin ? axis === xs ? c.z - movementOrigin.z : c.x - movementOrigin.x : 0;
    // A one-inch keyboard step away from a shared edge must be able to leave it.
    // Snap ahead while approaching an edge, without pulling backward against a move.
    if (previousPosition !== undefined && Math.abs(current - previousPosition) >= Math.abs(crossMovement) && (current - previousPosition) * (value - current) < -EPSILON) return;
    if (Math.abs(value - current) <= threshold + EPSILON) axis.push({ value, priority });
  };
  for (const value of [(-roomWidth + size.width) / 2, (roomWidth - size.width) / 2]) add(xs, c.x, value, 2);
  for (const value of [(-roomDepth + size.depth) / 2, (roomDepth - size.depth) / 2]) add(zs, c.z, value, 2);
  // When scaling/rotating, preserve an edge already touching a wall or neighbor.
  if (previous) {
    if (Math.abs(previous.left + roomWidth / 2) < EPSILON) xs.push({ value: (-roomWidth + size.width) / 2, priority: 3 });
    if (Math.abs(previous.right - roomWidth / 2) < EPSILON) xs.push({ value: (roomWidth - size.width) / 2, priority: 3 });
    if (Math.abs(previous.back + roomDepth / 2) < EPSILON) zs.push({ value: (-roomDepth + size.depth) / 2, priority: 3 });
    if (Math.abs(previous.front - roomDepth / 2) < EPSILON) zs.push({ value: (roomDepth - size.depth) / 2, priority: 3 });
  }
  for (const other of components) {
    if (other.id === c.id || !sharesHeight(c, other)) continue;
    const b = bounds(other);
    if (intersects(a.back, a.front, b.back, b.front, threshold)) {
      for (const value of [b.left - size.width / 2, b.right + size.width / 2]) add(xs, c.x, value, 2);
      for (const value of [b.left + size.width / 2, b.right - size.width / 2]) add(xs, c.x, value);
    }
    if (intersects(a.left, a.right, b.left, b.right, threshold)) {
      for (const value of [b.back - size.depth / 2, b.front + size.depth / 2]) add(zs, c.z, value, 2);
      for (const value of [b.back + size.depth / 2, b.front - size.depth / 2]) add(zs, c.z, value);
    }
    if (previous && original && sharesHeight(original, other)) {
      if (intersects(previous.back, previous.front, b.back, b.front)) {
        if (Math.abs(previous.right - b.left) < EPSILON) xs.push({ value: b.left - size.width / 2, priority: 3 });
        if (Math.abs(previous.left - b.right) < EPSILON) xs.push({ value: b.right + size.width / 2, priority: 3 });
      }
      if (intersects(previous.left, previous.right, b.left, b.right)) {
        if (Math.abs(previous.front - b.back) < EPSILON) zs.push({ value: b.back - size.depth / 2, priority: 3 });
        if (Math.abs(previous.back - b.front) < EPSILON) zs.push({ value: b.front + size.depth / 2, priority: 3 });
      }
    }
  }
  const candidates = uniqueSnaps(xs).flatMap(x => uniqueSnaps(zs).map(z => ({ component: { ...c, x: x.value, z: z.value }, priority: x.priority + z.priority, distance: (x.value - c.x) ** 2 + (z.value - c.z) ** 2 })));
  // Prefer a flush edge over a tiny gap, but always test the unsnapped proposal too.
  candidates.sort((a, b) => b.priority - a.priority || a.distance - b.distance);
  return candidates.map(candidate => candidate.component);
}

/** Apply an edit without introducing overlaps. A rejected edit returns the original. */
export function resolvePlacement(proposed: KitchenComponent, components: KitchenComponent[], roomWidth: number, roomDepth: number, options: { snapDistance?: number } = {}): PlacementResult {
  const original = components.find(c => c.id === proposed.id);
  const reject = (reason: PlacementResult['reason']): PlacementResult => ({ component: original ?? proposed, accepted: false, snapped: false, reason });
  if (![proposed.x, proposed.z, proposed.width, proposed.depth, proposed.height, proposed.rotation, roomWidth, roomDepth].every(Number.isFinite)) return reject('invalid');
  let next = clampComponent(proposed, roomWidth, roomDepth);
  const size = footprint(next);
  if (size.width > roomWidth + EPSILON || size.depth > roomDepth + EPSILON) return reject('room');
  const geometryChanged = !!original && (original.width !== next.width || original.depth !== next.depth || original.height !== next.height || original.rotation !== next.rotation);
  if (original && !geometryChanged && isPlacementValid(original, components, roomWidth, roomDepth)) next = sweepMove(original, next, components);
  const candidates = snapCandidates(next, components, roomWidth, roomDepth, Math.max(0, options.snapDistance ?? SNAP_DISTANCE), geometryChanged ? original : undefined, geometryChanged ? undefined : original);
  for (const candidate of candidates) {
    // Diagonal sweeps can leave an arbitrary fractional centre on their free axis.
    // Persist exactly the same quarter-inch geometry that parseDesign will restore,
    // and validate again because rounding may close a very small remaining gap.
    const component = clampComponent(candidate, roomWidth, roomDepth);
    if (!isPlacementValid(component, components, roomWidth, roomDepth)) continue;
    return { component, accepted: true, snapped: Math.abs(component.x - proposed.x) > EPSILON || Math.abs(component.z - proposed.z) > EPSILON };
  }
  return reject('collision');
}

/** Find the nearest free position for an added/duplicated component, or report no room. */
export function findPlacement(proposed: KitchenComponent, components: KitchenComponent[], roomWidth: number, roomDepth: number): KitchenComponent | null {
  if (![proposed.x, proposed.z, proposed.width, proposed.depth, proposed.height, proposed.rotation, roomWidth, roomDepth].every(Number.isFinite)) return null;
  const next = clampComponent(proposed, roomWidth, roomDepth), size = footprint(next);
  if (size.width > roomWidth || size.depth > roomDepth) return null;
  const minX = (-roomWidth + size.width) / 2, maxX = (roomWidth - size.width) / 2, minZ = (-roomDepth + size.depth) / 2, maxZ = (roomDepth - size.depth) / 2;
  const xs = new Set([next.x, minX, maxX]), zs = new Set([next.z, minZ, maxZ]);
  for (const other of components) {
    if (other.id === next.id || !sharesHeight(next, other)) continue;
    const b = bounds(other);
    for (const x of [b.left - size.width / 2, b.right + size.width / 2]) if (x >= minX - EPSILON && x <= maxX + EPSILON) xs.add(x);
    for (const z of [b.back - size.depth / 2, b.front + size.depth / 2]) if (z >= minZ - EPSILON && z <= maxZ + EPSILON) zs.add(z);
  }
  // Any nearest point outside axis-aligned obstacles lies on one of these edges.
  let best: KitchenComponent | null = null, bestDistance = Infinity;
  for (const x of xs) for (const z of zs) {
    const distance = (x - proposed.x) ** 2 + (z - proposed.z) ** 2;
    if (distance >= bestDistance) continue;
    const candidate = { ...next, x, z };
    if (isPlacementValid(candidate, components, roomWidth, roomDepth)) { best = candidate; bestDistance = distance; }
  }
  return best;
}

/** Room edits are atomic: either all clamped pieces fit, or the room stays unchanged. */
export function resizeRoom(design: KitchenDesign, roomWidth: number, roomDepth: number): KitchenDesign | null {
  if (![roomWidth, roomDepth].every(n => Number.isFinite(n) && n >= 144 && n <= 720)) return null;
  const components = design.components.map(c => clampComponent(c, roomWidth, roomDepth));
  if (components.some(c => !isPlacementValid(c, components, roomWidth, roomDepth))) return null;
  const next = { ...design, roomWidth, roomDepth, components };
  const openings=fitOpenings(next);
  if(openings.some(a=>openings.some(b=>openingsOverlap(a,b))))return null;
  return { ...next, openings };
}

/** Place a part inside a grid cell, with its back aligned to that cell's chosen edge. */
export function createGridComponent(kind: ComponentKind, id: string, row: number, column: number, gridSize: number, rotation = 0, cellSize = 36): KitchenComponent | null {
  if (!Number.isInteger(gridSize) || gridSize < 4 || gridSize > 10 || cellSize !== 36 || !Number.isInteger(row) || !Number.isInteger(column) || row < 0 || column < 0 || row >= gridSize || column >= gridSize || !Number.isFinite(rotation) || !Object.hasOwn(SIZE_LIMITS, kind)) return null;
  const limits = SIZE_LIMITS[kind];
  const width = Math.min(cellSize, limits.width[1]);
  const c = makeComponent(kind, id, 0, 0, rotation, width);
  if (kind === 'base' || kind === 'sink' || kind === 'island') c.depth = Math.min(cellSize, limits.depth[1]);
  c.rotation = ((Math.round(rotation / 90) * 90) % 360 + 360) % 360;
  c.x = (column + .5 - gridSize / 2) * cellSize;
  c.z = (row + .5 - gridSize / 2) * cellSize;
  const inset = (cellSize - c.depth) / 2;
  if (c.rotation === 0) c.z -= inset;
  if (c.rotation === 90) c.x -= inset;
  if (c.rotation === 180) c.z += inset;
  if (c.rotation === 270) c.x += inset;
  return c;
}

/** Cells may include one floor part plus an upper, when their occupied heights allow it. */
export function createCustomDesign(gridSize: number, cells: GridCell[], settings: KitchenDesign = defaultDesign(), cellSize = 36): KitchenDesign | null {
  if (!Number.isInteger(gridSize) || gridSize < 4 || gridSize > 10 || cellSize !== 36 || cells.length > gridSize * gridSize * 2) return null;
  const components: KitchenComponent[] = [];
  const occupied = new Set<string>();
  for (const cell of cells) {
    const key = `${cell.row}-${cell.column}-${cell.kind === 'upper' ? 'upper' : 'floor'}`;
    if (occupied.has(key)) return null;
    occupied.add(key);
    const c = createGridComponent(cell.kind, `grid-${key}`, cell.row, cell.column, gridSize, cell.rotation, cellSize);
    if (!c || !isPlacementValid(c, components, gridSize * cellSize, gridSize * cellSize)) return null;
    components.push(c);
  }
  return { ...settings, layout: 'custom', gridSize, gridCellSize: cellSize, roomWidth: gridSize * cellSize, roomDepth: gridSize * cellSize, components };
}
