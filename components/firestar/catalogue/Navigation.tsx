'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { ArrowUpRight, List, X } from '@phosphor-icons/react';
import { brandName, href, nav, routes, type PageKey } from '@/data/firestar/content';
import s from './catalogue.module.css';
export function CatalogueNavigation({ current }: { current: PageKey }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  return <header className={s.rail}>
    <Link href={href('v2')} className={s.brand} aria-label={`${brandName} home`}>Firestar<span>（infinite） granite</span></Link>
    <button ref={toggle} className={s.menuToggle} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-controls="catalogue-nav" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={24} /> : <List size={24} />}</button>
    <div className={`${s.railBody} ${open ? s.railOpen : ''}`} onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); toggle.current?.focus(); } }}>
      <nav id="catalogue-nav" aria-label="Main navigation">{nav.map((key, i) => <Link href={href('v2', key)} aria-current={key === current ? 'page' : undefined} key={key} onClick={() => setOpen(false)}><span>0{i + 1}</span>{routes[key].title}<ArrowUpRight size={17} /></Link>)}</nav>
      <div className={s.railContact}><span>Made in Nanaimo.<br />For Vancouver Island.</span><a href="tel:+12506199968">250-619-9968</a><Link href={href('v2', 'contact')}>Discuss your project <ArrowUpRight size={16} /></Link></div>
      <Link className={s.back} href="/#projects">Back to projects ↗</Link>
    </div>
  </header>;
}
