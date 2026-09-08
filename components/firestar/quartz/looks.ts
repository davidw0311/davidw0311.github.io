export type Tone = 'all' | 'light' | 'warm' | 'dark';
export const tones: { key: Tone; label: string; color: string }[] = [
  { key: 'all', label: 'All looks', color: 'transparent' },
  { key: 'light', label: 'Light & bright', color: '#e7e5de' },
  { key: 'warm', label: 'Warm neutrals', color: '#b99d7a' },
  { key: 'dark', label: 'Dark & dramatic', color: '#363b37' },
];
// Visual references from the original stone projects, not named quartz SKUs.
export const looks = [
  { id: 'soft-white', title: 'Soft white', tone: 'light', pattern: 'Quiet & clean', image: 'photo-088', position: 'center 68%', description: 'A pale, understated surface paired with crisp white basins. A starting point for a calm, light quartz palette.' },
  { id: 'warm-ivory', title: 'Warm ivory', tone: 'warm', pattern: 'Rich in detail', image: 'photo-005', position: 'center 65%', description: 'Creamy tones and a layered pattern bring warmth to a bright kitchen. Explore a similar colour direction in quartz with our team.' },
  { id: 'deep-charcoal', title: 'Deep charcoal', tone: 'dark', pattern: 'Bold contrast', image: 'photo-000', position: 'center 68%', description: 'A dark island creates a strong focal point beside warm timber. Ask about dark quartz samples to create your own version of this look.' },
  { id: 'silver-grey', title: 'Silver grey', tone: 'light', pattern: 'Subtle texture', image: 'photo-001', position: 'center 75%', description: 'A soft grey palette connects a modern kitchen with its surroundings. See how different grey quartz samples work with your cabinetry.' },
  { id: 'sand-and-linen', title: 'Sand & linen', tone: 'warm', pattern: 'Flowing movement', image: 'photo-052', position: 'center 60%', description: 'Warm sand tones and long, gentle lines make this bathroom feel inviting. Bring this reference when exploring veined quartz options.' },
  { id: 'espresso', title: 'Espresso', tone: 'dark', pattern: 'Warm depth', image: 'photo-090', position: 'center 58%', description: 'A deep brown surface sets off a white vanity. Explore a warm, dark quartz palette and compare samples in person.' },
  { id: 'ivory-and-grey', title: 'Ivory & grey', tone: 'light', pattern: 'Layered contrast', image: 'photo-004', position: 'center 63%', description: 'A light base with contrasting detail balances dark cabinetry. Our team can help you explore quartz options with a similar visual balance.' },
  { id: 'honey-and-cream', title: 'Honey & cream', tone: 'warm', pattern: 'Earthy character', image: 'photo-082', position: 'center 65%', description: 'Honey-coloured timber and a warm stone palette create a welcoming space. Use this reference to start a conversation about your quartz colour.' },
  { id: 'smoky-grey', title: 'Smoky grey', tone: 'dark', pattern: 'Fine-grained depth', image: 'photo-074', position: 'center 62%', description: 'A deep grey surface with fine texture gives this vanity a grounded feel. Compare dark and textured quartz samples at the showroom.' },
] as const;
export type Look = typeof looks[number];
export function lookEmail(items: readonly Look[]) {
  return 'mailto:sales@infinitegranite.ca?subject=' + encodeURIComponent('Quartz options for my project') + '&body=' + encodeURIComponent('Hello Firestar Granite,\n\nI would like to explore quartz options inspired by these looks:\n' + items.map(item => '- ' + item.title).join('\n') + '\n\nPlease help me find suitable quartz samples.\n\nPlans & Measurements:\nSite Address:\nType of sink:\nContact Information (phone/email):\n');
}
