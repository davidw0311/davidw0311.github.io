import { vicostoneMaterials } from './vicostone.ts';
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
const studioMaterials: CountertopMaterial[] = [
  { id:'calacatta',company:'Studio collection',code:'Q01',name:'Calacatta',family:'Quartz',color:'#f0eee7',pattern:'vein',vein:'#958a77',note:'Warm white · broad gold-grey veining',roughness:.24 },
  { id:'carrara',company:'Studio collection',code:'M01',name:'Carrara',family:'Marble',color:'#e2e5e4',pattern:'vein',vein:'#8c979b',note:'Cool white · fine grey veining',roughness:.3 },
  { id:'alaska',company:'Studio collection',code:'G01',name:'Alaska white',family:'Granite',color:'#d6d0c5',pattern:'speckle',vein:'#575751',note:'Ivory · varied mineral flecks',roughness:.27 },
  { id:'absolute',company:'Studio collection',code:'G02',name:'Absolute black',family:'Granite',color:'#25282a',pattern:'speckle',vein:'#787d7b',note:'Deep charcoal · subtle crystalline grain',roughness:.2 },
  { id:'soapstone',company:'Studio collection',code:'S01',name:'Charcoal',family:'Soapstone',color:'#454e4d',pattern:'vein',vein:'#99a6a0',note:'Soft charcoal · pale, flowing veins',roughness:.7 },
  { id:'concrete',company:'Studio collection',code:'C01',name:'Cloud grey',family:'Concrete',color:'#a6a6a0',pattern:'cloud',vein:'#787b77',note:'Mid grey · quiet, matte texture',roughness:.9 },
  { id:'butcher',company:'Studio collection',code:'W01',name:'Butcher block',family:'Wood',color:'#b8844c',pattern:'wood',vein:'#6d4529',note:'Honey oak · continuous wood grain',roughness:.6 },
  { id:'terrazzo',company:'Studio collection',code:'T01',name:'Salt & pepper',family:'Terrazzo',color:'#e0ddd6',pattern:'chips',vein:'#52615c',note:'Warm white · contrasting stone chips',roughness:.45 },
];
// Supplier records are kept separate so more catalogues can be added without changing the picker.
export const MATERIALS: CountertopMaterial[] = [...tceStoneMaterials, ...vicostoneMaterials, ...studioMaterials];
export const MATERIAL_COMPANIES = Array.from(new Set(MATERIALS.map(m=>m.company))).sort((a,b)=>a==='Studio collection'?1:b==='Studio collection'?-1:a.localeCompare(b));
export function filterMaterials(query: string, company = ''): CountertopMaterial[] {
  const words=query.trim().toLowerCase().split(/\s+/).map(w=>w.replace(/[^a-z0-9]/g,'')).filter(Boolean);
  return MATERIALS.filter(m=>(!company||m.company===company)&&words.every(word=>`${m.company}${m.code}${m.name}${m.family}`.toLowerCase().replace(/[^a-z0-9]/g,'').includes(word)))
    .sort((a,b)=>MATERIAL_COMPANIES.indexOf(a.company)-MATERIAL_COMPANIES.indexOf(b.company)||a.code.localeCompare(b.code,'en',{numeric:true}));
}
export function materialLabel(m: CountertopMaterial) { return `${m.company} · ${m.code} · ${m.name}`; }
