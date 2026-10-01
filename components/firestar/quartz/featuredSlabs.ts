import { MATERIALS } from '../kitchen/engine/materials.ts';
import { looks, type Look } from './looks.ts';

// A balanced selection from every locally hosted supplier. Interleave companies
// so visitors encounter all seven without scrolling through one entire catalogue.
const groups = [
  ['ksv5101', 'ksl6015', 'ksv1106', 'ksl6011', 'ksl8602', 'ky004', 'ky007', 'ky052', 'ky070', 'ky077'].map(id => `kasa-quartz-${id}`),
  ['2049', '2050', '4048', '1220', '4060', '4062', '2038', '2042', '4031', '4052'].map(id => `tce-${id}`),
  ['bq6716', 'bq6984', 'bq8815', 'bq8820', 'bq6803', 'bq2616', 'bq8788', 'bq8740', 'bq6882', 'bq8912'].map(id => `vicostone-${id}`),
  ['antello', 'aurelia', 'calacatta-extra', 'calacatta-gravo', 'calacatta-mont', 'calacatta-venato', 'chantilly', 'coast', 'cremosa', 'aura'].map(id => `hanstone-${id}`),
  ['q6101', 'q6110', 'q6120', 'q6125', 'q6151', 'q6155', 'q6160', 'q6170', 'y9015', 'y9035'].map(id => `fir-stone-${id}`),
  ['oq381', 'oq382', 'oq385', 'oq387', 'oq388', 'oq390', 'oq399', 'oq392', 'oq393', 'oq122'].map(id => `omnia-quartz-${id}`),
  ['rh7001', 'rh7002', 'rh7003', 'rh7005'].map(id => `rh-stones-${id}`),
];
const ids = Array.from({ length: Math.max(...groups.map(g => g.length)) }, (_, index) => groups.flatMap(g => g[index] ? [g[index]] : [])).flat();

export const featuredSlabs: readonly Look[] = ids.map(id => {
  const material = MATERIALS.find(m => m.id === id);
  if (!material?.textureUrl || !material.sourceUrl) throw new Error(`Missing featured surface: ${id}`);
  const existing = looks.find(look => (look.supplier === 'Kasa' ? `kasa-quartz-${look.id}` : look.id) === id);
  return {
    id, materialId: id, code: material.code, title: material.name, supplier: material.company,
    series: material.family, tone: existing?.tone, pattern: existing?.pattern ?? material.family,
    // The card, detail view and kitchen use the same locally hosted slab photograph.
    image: material.textureUrl.replace('/assets/firestar/', '').replace(/\.webp$/, ''),
    roomImage: existing?.roomImage ?? null, imageKind: 'slab',
    description: existing?.description ?? `Explore ${material.name} from ${material.company} and see it on the kitchen worktops below. Ask our team about physical samples and availability.`,
    source: material.sourceUrl,
  };
});
