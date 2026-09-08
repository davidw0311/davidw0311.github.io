import source from './source.json';

export const brandName = 'Firestar（infinite） granite';
export const brandWordmark = 'Firestar（infinite）';

export type Version = 'v1' | 'v2' | 'v3';
export const versions: Version[] = ['v1', 'v2', 'v3'];
export const themes = {
  v1: { name: 'The architectural edition', short: 'Architectural', description: 'Warm paper, expressive serif typography, and an editorial approach to stone.' },
  v2: { name: 'The stone gallery', short: 'Stone gallery', description: 'A cinematic dark palette, expansive photographs, and quiet, precise details.' },
  v3: { name: 'The contemporary studio', short: 'Contemporary', description: 'Cobalt blue, bold typography, and a fresh, graphic approach to custom stone.' },
};
export const routes = {
  home: { slug: '', title: 'Home' }, services: { slug: 'Services.htm', title: 'Services' },
  products: { slug: 'products.htm', title: 'Products' }, showroom: { slug: 'showroom.htm', title: 'Showroom' },
  gallery: { slug: 'gallery.htm', title: 'Gallery' }, contact: { slug: 'contact.htm', title: 'Contact' },
  p1: { slug: 'p1.htm', title: 'Quartz' }, p2: { slug: 'p2.htm', title: 'Granite' },
  p3: { slug: 'p3.htm', title: 'Profiles/Edges' }, p4: { slug: 'p4.htm', title: 'Seams & Joints' },
  p5: { slug: 'p5.htm', title: 'Sealing' }, p6: { slug: 'p6.htm', title: 'Care & Maintenance' },
  testimonials: { slug: 'testimonials.htm', title: 'Testimonials' },
  kitchen: { slug: 'Kitchen.htm', title: 'Kitchen' }, bathroom: { slug: 'Bathroom.htm', title: 'Bathroom' },
  other: { slug: 'Other.htm', title: 'Others' },
} as const;
export type PageKey = keyof typeof routes;
export const nav: PageKey[] = ['home', 'services', 'products', 'showroom', 'gallery', 'contact'];
export function href(version: Version, key: PageKey = 'home') {
  return `/projects/firestar/${version}/${routes[key].slug ? routes[key].slug + '/' : ''}`;
}
export const pages = source.pages;
export const services = pages.services.slice(2, 8);
export const photos = source.assets;
export const gallery = Object.entries(source.galleries).flatMap(([category, images]) => images.map((src, index) => ({
  src, category: category as 'kitchen' | 'bathroom' | 'other',
  alt: `Firestar Granite ${category === 'other' ? 'custom stonework' : category} project ${index + 1}`,
})));
export const guideKeys: PageKey[] = ['p1', 'p2', 'p4', 'p3', 'p6', 'p5'];
export const locations = [
  { name: 'South Nanaimo', type: 'Showroom & Shop', address: '2156 Akenhead Road', city: 'Nanaimo B.C. V9X 1T9', hours: [['Monday - Friday', '9:00am - 5:00pm'], ['Saturday', '10:30am - 4:00pm'], ['Sunday', 'By Appointment']] },
  { name: 'North Nanaimo', type: 'Self-service Showroom', address: '6120 Kirsten Drive', city: 'Nanaimo B.C. V9V 1J7', hours: [['Monday - Sunday', '9:00am - 8:00pm']] },
];
export const quoteItems = ['Plans & Measurements', 'Site Address', 'Type of sink (under mount/top mount/vessel)', 'Contact Information (phone/email/fax)'];
export const quoteEmail = 'mailto:sales@infinitegranite.ca?subject=' + encodeURIComponent('Custom stone project quote') + '&body=' + encodeURIComponent('Hello Firestar Granite,\n\nI would like a quote for my project.\n\nPlans & Measurements:\n[Please attach plans and measurements]\n\nSite Address:\n\nType of sink (under mount/top mount/vessel):\n\nContact Information (phone/email/fax):\n');
export const testimonials: { quote: string; author: string }[] = [];
let pending: string[] = [];
for (const paragraph of pages.testimonials.slice(1)) {
  if (paragraph.startsWith('- ')) {
    testimonials.push({ quote: pending.join(' '), author: paragraph.slice(2) }); pending = [];
  } else if (paragraph.includes('- Janie Lockwood')) {
    testimonials.push({ quote: paragraph.split('- Janie Lockwood')[0].trim(), author: 'Janie Lockwood' });
  } else pending.push(paragraph);
}
