'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { List, X, ArrowUpRight } from '@phosphor-icons/react';
import { brandName, brandWordmark, href, nav, routes, type PageKey, type Version } from '@/data/firestar/content';
import styles from './firestar.module.css';

export function Header({ version, current }: { version: Version; current: PageKey }) {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const showroomHref = `${href(version, 'showroom')}#showroom-info`;
  return <>
    {version === 'v1' && <div className={styles.contactBar} aria-label="Showroom contact details">
      <a className={styles.contactPhone} href="tel:+12506199968">250-619-9968</a>
      <a className={styles.contactAddress} href={showroomHref}>2156 Akenhead Road, <span>Nanaimo</span></a>
      <a className={styles.contactCta} href={showroomHref}>Visit Us <ArrowUpRight size={18} aria-hidden="true" /></a>
    </div>}
    <header className={styles.header}>
      <Link className={styles.wordmark} href={href(version)} aria-label={`${brandName} home`}>{brandWordmark}<span>granite</span></Link>
      <button ref={menuButton} className={styles.menuButton} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="firestar-navigation" onClick={() => setOpen(!open)}>{open ? <X size={25} /> : <List size={25} />}</button>
      <nav id="firestar-navigation" className={`${styles.navigation} ${open ? styles.navigationOpen : ''}`} aria-label="Main navigation" onKeyDown={event => { if (event.key === 'Escape') { setOpen(false); menuButton.current?.focus(); } }}>
        {(version === 'v1' ? ['home', 'viewer', ...nav.filter(key => key !== 'home')] as PageKey[] : nav).map(key => <Link key={key} href={href(version, key)} aria-current={current === key ? 'page' : undefined} onClick={() => setOpen(false)}>{routes[key].title}{key === 'contact' && <ArrowUpRight size={16} />}</Link>)}
      </nav>
    </header>
  </>;
}
