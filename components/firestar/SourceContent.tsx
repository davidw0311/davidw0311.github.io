import Image from 'next/image';
import { pages, photos, locations, type PageKey } from '@/data/firestar/content';

/** Shared source content only; each design owns its surrounding page structure. */
export function ProductText({ current }: { current: PageKey }) {
  if (current === 'p3') return <Image src={photos['all_profiles_granite_background_colour.jpg']} alt="Original Firestar Granite edge-profile selection chart" width={650} height={1100} style={{ width: '100%', maxWidth: 650, height: 'auto' }} />;
  const paragraphs = pages[current as keyof typeof pages];
  if (current === 'p1' || current === 'p2') {
    const start = paragraphs.findIndex(p => p.startsWith('Below are'));
    const questions: { title: string; paragraphs: string[] }[] = [];
    const ending: string[] = [];
    for (const p of paragraphs.slice(start + 1)) {
      if (p.endsWith('?')) questions.push({ title: p, paragraphs: [] });
      else if (p.startsWith('Check out') || p.startsWith('Granite Myths')) ending.push(p);
      else questions.at(-1)?.paragraphs.push(p);
    }
    return <>{paragraphs.slice(1, start).map(p => <p key={p}>{p}</p>)}{questions.map(q => <details key={q.title}><summary>{q.title}</summary>{q.paragraphs.map(p => <p key={p}>{p}</p>)}</details>)}{ending.map(p => <p key={p}>{p}</p>)}</>;
  }
  return <>{paragraphs.slice(current === 'p6' ? 0 : 1).map(p => <p key={p}>{p.startsWith('250-734') ? <a href="tel:+12507342681">{p}</a> : p.startsWith('www.sealtech') ? <a href="http://www.sealtechspecialties.com" target="_blank" rel="noopener noreferrer">{p}</a> : p}</p>)}</>;
}
export function LocationDetails({ index }: { index: number }) {
  const place = locations[index];
  return <><p>{place.type}</p><address>{place.address}<br />{place.city}</address><dl>{place.hours.map(([day, time]) => <div key={day}><dt>{day}</dt><dd>{time}</dd></div>)}</dl><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address + ', ' + place.city)}`} target="_blank" rel="noopener noreferrer">Get directions ↗</a></>;
}
