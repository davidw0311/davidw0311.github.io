'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { href, photos, type PageKey } from '@/data/firestar/content';
import s from './homestead.module.css';
const rooms: { label: string; title: string; src: string; key: PageKey; alt: string }[] = [
  { label: 'The kitchen', title: 'For everything that happens around the kitchen.', src: photos['5.jpg'], key: 'kitchen', alt: 'Sunlit kitchen with custom Firestar Granite countertops' },
  { label: 'The bathroom', title: 'A fresh start, every single morning.', src: photos['images/u.jpg'], key: 'bathroom', alt: 'Vessel sinks and a custom countertop from the original bathroom gallery' },
  { label: 'Something else', title: 'Your ideas don’t have to stop at countertops.', src: photos['images/bbq.jpg'], key: 'other', alt: 'Custom outdoor stone barbecue surround from the original gallery' },
];
export function RoomPicker() {
  const [active, setActive] = useState(0);
  const room = rooms[active];
  return <div className={s.roomPicker}>
    <div className={s.roomTabs} role="group" aria-label="Choose a room">{rooms.map((item, i) => <button key={item.key} aria-pressed={active === i} onClick={() => setActive(i)}>{item.label}</button>)}</div>
    <div className={s.roomPhoto}><Image src={room.src.replace(/\.jpe?g$/i, '.webp')} alt={room.alt} fill sizes="(max-width: 767px) 100vw, 90vw" priority /><div className={s.roomCaption} aria-live="polite"><h2>{room.title}</h2><Link href={href('v3', room.key)}>Take a look <ArrowRight size={20} /></Link></div></div>
  </div>;
}
