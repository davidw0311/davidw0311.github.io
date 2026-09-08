export type Tone = 'all' | 'light' | 'warm' | 'dark';
export const tones: { key: Tone; label: string; color: string }[] = [
  { key: 'all', label: 'All quartz', color: 'transparent' },
  { key: 'light', label: 'Light & bright', color: '#e7e5de' },
  { key: 'warm', label: 'Warm neutrals', color: '#b99d7a' },
  { key: 'dark', label: 'Dark & dramatic', color: '#363b37' },
];
export type Look = {
  id: string; code: string; title: string; series: string; tone: Exclude<Tone, 'all'>;
  pattern: string; image: string; roomImage: string | null; imageKind: 'slab' | 'room'; description: string; source: string;
};
// Names and codes verified against Kasa's catalogue. Image provenance is in public/assets/firestar/kasa/sources.json.
export const looks: readonly Look[] = [
  {
    "id": "ksv5101",
    "code": "KSV5101",
    "title": "Lightning Gold",
    "series": "KSV",
    "tone": "warm",
    "pattern": "Gold-accented veins",
    "image": "kasa/ksv5101",
    "roomImage": "kasa/ksv5101-room",
    "imageKind": "slab",
    "description": "Branching grey and golden veins cross a bright white background.",
    "source": "https://en.kasaquartz.cn/product/400.html"
  },
  {
    "id": "ksl6015",
    "code": "KSL6015",
    "title": "Blizzard",
    "series": "KSL",
    "tone": "light",
    "pattern": "Quiet white",
    "image": "kasa/ksl6015",
    "roomImage": "kasa/ksl6015-room",
    "imageKind": "slab",
    "description": "An airy white surface with a delicate, cloud-like pattern.",
    "source": "https://en.kasaquartz.cn/products_detail/135.html"
  },
  {
    "id": "ksl6005",
    "code": "KSL6005",
    "title": "Sahara Dune",
    "series": "KSL",
    "tone": "warm",
    "pattern": "Golden sand tones",
    "image": "kasa/ksl6005",
    "roomImage": "kasa/ksl6005-room",
    "imageKind": "slab",
    "description": "Warm sand and gold tones with long, flowing mineral-like lines.",
    "source": "https://en.kasaquartz.cn/products_detail/82.html"
  },
  {
    "id": "ksv1105",
    "code": "KSV1105",
    "title": "Calacatta Silk",
    "series": "KSV",
    "tone": "light",
    "pattern": "Fine grey veins",
    "image": "kasa/ksv1105",
    "roomImage": "kasa/ksv1105-room",
    "imageKind": "slab",
    "description": "A white background crossed by fine, lightly branching grey veins.",
    "source": "https://en.kasaquartz.cn/products_detail/81.html"
  },
  {
    "id": "ksl6030",
    "code": "KSL6030",
    "title": "Spiez White",
    "series": "KSL",
    "tone": "light",
    "pattern": "Flowing grey layers",
    "image": "kasa/ksl6030",
    "roomImage": "kasa/ksl6030-room",
    "imageKind": "slab",
    "description": "Soft grey and white layers create gentle movement across the slab.",
    "source": "https://en.kasaquartz.cn/products_detail/137.html"
  },
  {
    "id": "ksl6010",
    "code": "KSL6010",
    "title": "Glacier Gold",
    "series": "KSL",
    "tone": "warm",
    "pattern": "Soft golden detail",
    "image": "kasa/ksl6010",
    "roomImage": "kasa/ksl6010-room",
    "imageKind": "slab",
    "description": "A light base with subtle warm detail for a gentle hint of colour.",
    "source": "https://en.kasaquartz.cn/products_detail/78.html"
  },
  {
    "id": "ksv1106",
    "code": "KSV1106",
    "title": "Sunlit Vein",
    "series": "KSV",
    "tone": "warm",
    "pattern": "Fine golden veins",
    "image": "kasa/ksv1106",
    "roomImage": "kasa/ksv1106-room",
    "imageKind": "slab",
    "description": "Fine, sweeping warm veins bring delicate movement to a white base.",
    "source": "https://en.kasaquartz.cn/product/399.html"
  },
  {
    "id": "ksl6016",
    "code": "KSL6016",
    "title": "Volakano White",
    "series": "KSL",
    "tone": "light",
    "pattern": "Delicate mineral texture",
    "image": "kasa/ksl6016",
    "roomImage": "kasa/ksl6016-room",
    "imageKind": "slab",
    "description": "A pale, softly textured surface with subtle grey detail.",
    "source": "https://en.kasaquartz.cn/products_detail/136.html"
  },
  {
    "id": "ksl6011",
    "code": "KSL6011",
    "title": "Alabaster Vein",
    "series": "KSL",
    "tone": "light",
    "pattern": "Fine grey detail",
    "image": "kasa/ksl6011",
    "roomImage": "kasa/ksl6011-room",
    "imageKind": "slab",
    "description": "Fine grey detail gives this light surface a softly textured character.",
    "source": "https://en.kasaquartz.cn/products_detail/79.html"
  },
  {
    "id": "ksl8601",
    "code": "KSL8601",
    "title": "Nero Portoro Grande",
    "series": "KSL",
    "tone": "dark",
    "pattern": "High-contrast veining",
    "image": "kasa/ksl8601",
    "roomImage": null,
    "imageKind": "room",
    "description": "A deep black surface with expressive white veining and dramatic contrast.",
    "source": "https://en.kasaquartz.cn/products_detail/163.html"
  },
  {
    "id": "ksl8602",
    "code": "KSL8602",
    "title": "Silver Mist",
    "series": "KSL",
    "tone": "light",
    "pattern": "Layered silver veining",
    "image": "kasa/ksl8602",
    "roomImage": null,
    "imageKind": "room",
    "description": "Silver-grey movement across a pale surface, shown on a statement island.",
    "source": "https://en.kasaquartz.cn/products_detail/75.html"
  },
  {
    "id": "ksl6032",
    "code": "KSL6032",
    "title": "White Castle",
    "series": "KSL",
    "tone": "light",
    "pattern": "Soft white texture",
    "image": "kasa/ksl6032",
    "roomImage": null,
    "imageKind": "room",
    "description": "A bright white palette with quiet detail for a clean, understated space.",
    "source": "https://en.kasaquartz.cn/products_detail/139.html"
  },
  {
    "id": "ksl6031",
    "code": "KSL6031",
    "title": "Silver Sands",
    "series": "KSL",
    "tone": "light",
    "pattern": "Linear grey movement",
    "image": "kasa/ksl6031",
    "roomImage": null,
    "imageKind": "room",
    "description": "Long, soft grey lines bring a flowing rhythm to a light surface.",
    "source": "https://en.kasaquartz.cn/products_detail/138.html"
  }
];
export function lookEmail(items: readonly Look[]) {
  return 'mailto:sales@infinitegranite.ca?subject=' + encodeURIComponent('Kasa Quartz samples for my project') + '&body=' + encodeURIComponent('Hello Firestar Granite,\n\nI am interested in these Kasa Quartz selections:\n' + items.map(item => '- ' + item.code + ' — ' + item.title).join('\n') + '\n\nPlease let me know about samples, availability and pricing.\n\nPlans & Measurements:\nSite Address:\nType of sink:\nContact Information (phone/email):\n');
}
