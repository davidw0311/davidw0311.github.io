import { flyoverDesign, flyoverPose } from './engine/flyover/model.ts';
import type { KitchenDesign } from './engine/kitchen.ts';
import { resolveMaterialId } from './engine/materials.ts';

export const DESIGN_INTERVAL = 6000;
export const KITCHEN_LOOKS = [
  { name: 'Soft sage', material: 'vicostone-bq8788', lower: '#8b9a88', upper: '#e8e7df', island: '#314c43', floor: 'oak', floorColor: '#d4c7b0' },
  { name: 'Warm ivory', material: 'tce-2049', lower: '#d8cbb5', upper: '#eee9df', island: '#88715a', floor: 'maple', floorColor: '#e3cba4' },
  { name: 'Quiet contrast', material: 'kasa-quartz-ksv5101', lower: '#444c49', upper: '#e8e7df', island: '#343b37', floor: 'oak', floorColor: '#d4c7b0' },
  { name: 'Forest green', material: 'vicostone-bq6716', lower: '#e2dfd5', upper: '#ece9e2', island: '#314c43', floor: 'walnut', floorColor: '#746158' },
  { name: 'Natural warmth', material: 'tce-2038', lower: '#b6a48c', upper: '#e8e7df', island: '#8c755b', floor: 'oak', floorColor: '#d4c7b0' },
  { name: 'Evening charcoal', material: 'vicostone-bq8815', lower: '#b6b3a8', upper: '#e8e7df', island: '#303839', floor: 'tile', floorColor: '#ccceca' },
] as const;

export function kitchenLook(index: number): KitchenDesign {
  const look = KITCHEN_LOOKS[((index % KITCHEN_LOOKS.length) + KITCHEN_LOOKS.length) % KITCHEN_LOOKS.length];
  return { ...flyoverDesign(), countertop: look.material, floor: look.floor, floorColor: look.floorColor };
}

// The opening composition stays fixed while finishes change, including after a resize.
export function stationaryPose(aspect: number, zoom = 1) { return flyoverPose(0, aspect, zoom); }

/** Consistent cabinetry keeps attention on the selected surface. */
export function surfaceDesign(materialId: string): KitchenDesign {
  return { ...flyoverDesign(), countertop: resolveMaterialId(materialId) ?? flyoverDesign().countertop };
}
