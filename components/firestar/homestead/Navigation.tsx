'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { List, X, ArrowUpRight } from '@phosphor-icons/react';
import { brandName, href, nav, routes, type PageKey } from '@/data/firestar/content';
import s from './homestead.module.css';
export function HomesteadNavigation({ current }: { current: PageKey }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  return <><div className={s.contactStrip}><span>Your local stone people. Nanaimo, BC.</span><a href="tel:+12506199968">Let’s talk: 250-619-9968</a></div><header className={s.header}>
    <Link href={href('v3')} className={s.brand} aria-label={`${brandName} home`}>Firestar<span>（infinite） granite</span></Link>
    <button ref={button} className={s.menuToggle} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="homestead-nav" onClick={() => setOpen(!open)}>{open ? <X size={24} /> : <List size={24} />}</button>
    <nav id="homestead-nav" className={open ? s.open : ''} aria-label="Main navigation" onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); button.current?.focus(); } }}>{nav.map(key => <Link key={key} href={href('v3', key)} aria-current={key === current ? 'page' : undefined} onClick={() => setOpen(false)}>{routes[key].title}{key === 'contact' && <ArrowUpRight size={16} />}</Link>)}</nav>
  </header></>;
}
