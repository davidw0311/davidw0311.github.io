import type { CountertopMaterial } from './materials.ts';
// Internal floor, plaster and wood finishes; excluded from the slab catalogue.
export const ROOM_TEXTURES: CountertopMaterial[] = [
  { id:'carrara',company:'Room finish',code:'M01',name:'Carrara',family:'Marble',color:'#e2e5e4',pattern:'vein',vein:'#8c979b',note:'Cool white · fine grey veining',roughness:.3 },
  { id:'soapstone',company:'Room finish',code:'S01',name:'Charcoal',family:'Soapstone',color:'#454e4d',pattern:'vein',vein:'#99a6a0',note:'Soft charcoal · pale, flowing veins',roughness:.7 },
  { id:'concrete',company:'Room finish',code:'C01',name:'Cloud grey',family:'Concrete',color:'#a6a6a0',pattern:'cloud',vein:'#787b77',note:'Mid grey · quiet, matte texture',roughness:.9 },
  { id:'butcher',company:'Room finish',code:'W01',name:'Butcher block',family:'Wood',color:'#b8844c',pattern:'wood',vein:'#6d4529',note:'Honey oak · continuous wood grain',roughness:.6 },
];
