import { supplierMaterials } from './supplierMaterials.ts';
import { tceStoneMaterials } from './tceStone.ts';

export interface CountertopMaterial {
  id: string;
  company: string;
  code: string;
  name: string;
  family: string;
  color: string;
  pattern: 'vein' | 'speckle' | 'cloud' | 'wood' | 'chips';
  vein: string;
  note: string;
  roughness: number;
  textureUrl?: string;
  thumbnailUrl?: string;
  textureWidth?: number;
  textureHeight?: number;
  sourceUrl?: string;
  availability?: string;
  textureKind?: 'slab' | 'detail';
}
// Supplier records are kept separate so more catalogues can be added without changing the picker.
export const MATERIALS: CountertopMaterial[] = [...tceStoneMaterials, ...supplierMaterials];
export const MATERIAL_COMPANIES = Array.from(new Set(MATERIALS.map(m=>m.company))).sort((a,b)=>a.localeCompare(b));
export function filterMaterials(query: string, company = ''): CountertopMaterial[] {
  const words=query.trim().toLowerCase().split(/\s+/).map(w=>w.replace(/[^a-z0-9]/g,'')).filter(Boolean);
  return MATERIALS.filter(m=>(!company||m.company===company)&&words.every(word=>`${m.company}${m.code}${m.name}${m.family}`.toLowerCase().replace(/[^a-z0-9]/g,'').includes(word)))
    .sort((a,b)=>MATERIAL_COMPANIES.indexOf(a.company)-MATERIAL_COMPANIES.indexOf(b.company)||a.code.localeCompare(b.code,'en',{numeric:true}));
}
export function materialLabel(m: CountertopMaterial) { return m.code === m.name ? `${m.company} · ${m.name}` : `${m.company} · ${m.code} · ${m.name}`; }

export const DEFAULT_MATERIAL = 'vicostone-bq8788';
// Retired presets/global-only Vicostone codes migrate without losing the room layout.
const retiredMaterials = new Set(["calacatta", "carrara", "alaska", "absolute", "soapstone", "concrete", "butcher", "terrazzo", "vicostone-bq6980", "vicostone-bq6982", "vicostone-bq6848", "vicostone-bq9610", "vicostone-bq8925", "vicostone-bq8884", "vicostone-bq8887", "vicostone-bq8920", "vicostone-bq8716", "vicostone-bq8829", "vicostone-bq9602", "vicostone-bq8270", "vicostone-bq8669", "vicostone-bq8670", "vicostone-bq8690", "vicostone-bq8786", "vicostone-bq8811", "vicostone-bq9611", "vicostone-bq6700", "vicostone-bq8819", "vicostone-bq8836", "vicostone-bq8926", "vicostone-bq9700", "vicostone-bq8550", "vicostone-bq8729", "vicostone-bq9660", "vicostone-bq9661", "vicostone-bq9662", "vicostone-bq9663", "vicostone-bq8629", "vicostone-bq6718", "vicostone-bq6901", "vicostone-bq8636", "vicostone-bq6710", "vicostone-bq6712", "vicostone-bq6715", "vicostone-bq8583", "vicostone-bq9441", "vicostone-bq8816", "vicostone-bq9470", "vicostone-bq9427", "vicostone-bq7701", "vicostone-bq7702", "vicostone-bq8860", "vicostone-bq2605", "vicostone-bq8795", "vicostone-bq8794", "vicostone-bq8791", "vicostone-bq8380", "vicostone-bq8390", "vicostone-bq8430", "vicostone-bq8440", "vicostone-bq8530", "vicostone-bq8560", "vicostone-bq8590", "vicostone-bq8710", "vicostone-bq8712", "vicostone-bq8810", "vicostone-bq8818", "vicostone-bq8840", "vicostone-bq9415", "vicostone-bq9419", "vicostone-bq9420", "vicostone-bq9438", "vicostone-bq9453", "vicostone-bq2607", "vicostone-bq8221", "vicostone-bq8222", "vicostone-bq8616", "vicostone-bq2608", "vicostone-bq8400", "vicostone-bq8402", "vicostone-bq8614", "vicostone-bq8627", "vicostone-bq8696", "vicostone-bq8822", "vicostone-bq8831", "vicostone-bq8850", "vicostone-bq8852", "vicostone-bq9800", "vicostone-bq6701", "vicostone-bq6709", "vicostone-bq8625", "vicostone-bq8370", "vicostone-bq3600", "vicostone-bq501", "vicostone-bq3603", "vicostone-bq100", "vicostone-bq900", "vicostone-bq278", "vicostone-bq8437", "vicostone-bq9310", "vicostone-bc186", "vicostone-bc190", "vicostone-bc197", "vicostone-bc217", "vicostone-bq2020", "vicostone-bq2030", "vicostone-bq2101", "vicostone-bq2102", "vicostone-bq240", "vicostone-bq241", "vicostone-bq258", "vicostone-bq300", "vicostone-bq307", "vicostone-bq370", "vicostone-bq700", "vicostone-bq8100", "vicostone-bq8435", "vicostone-bq9120", "vicostone-bq9130", "vicostone-bq9140", "vicostone-bq9160", "vicostone-bq9190", "vicostone-bq9260", "vicostone-bq9290", "vicostone-bq9330", "vicostone-bq9340", "vicostone-bq940", "vicostone-bq980", "vicostone-bs160", "vicostone-bs170", "vicostone-bs182", "vicostone-bs183", "vicostone-bs340", "vicostone-bs390", "vicostone-bs4000", "vicostone-bs4010", "vicostone-bq2202", "vicostone-bs120", "vicostone-bq800", "vicostone-bq8618", "vicostone-bq265", "vicostone-bq315", "vicostone-bq320", "vicostone-bq8436", "vicostone-bq9250", "vicostone-bq9360", "vicostone-bs100", "vicostone-bs181", "vicostone-bs300", "vicostone-bs320", "vicostone-bs380", "vicostone-bc3020", "vicostone-bc900", "vicostone-bq266", "vicostone-bq316", "vicostone-bq317", "vicostone-bs110"]);
export function resolveMaterialId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  if (MATERIALS.some(m => m.id === value)) return value;
  return retiredMaterials.has(value) ? DEFAULT_MATERIAL : null;
}
