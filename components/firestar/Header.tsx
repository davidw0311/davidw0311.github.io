'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { List, X, ArrowUpRight } from '@phosphor-icons/react';
import { href, nav, routes, themes, versions, type PageKey, type Version } from '@/data/firestar/content';
import styles from './firestar.module.css';

export function Header({ version, current }: { version: Version; current: PageKey }) {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  return <>
    <div className={styles.previewBar}>
      <Link href="/#projects">David Wang / Projects</Link>
      <nav aria-label="Design versions">{versions.map(v => <Link href={href(v, current)} key={v} aria-current={v === version ? 'page' : undefined}><span>{v.toUpperCase()}</span><span className={styles.versionName}>{themes[v].short}</span></Link>)}</nav>
    </div>
    <header className={styles.header}>
      <Link className={styles.wordmark} href={href(version)} aria-label="Firestar Granite home">Firestar<span>Granite</span></Link>
      <button ref={menuButton} className={styles.menuButton} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="firestar-navigation" onClick={() => setOpen(!open)}>{open ? <X size={25} /> : <List size={25} />}</button>
      <nav id="firestar-navigation" className={`${styles.navigation} ${open ? styles.navigationOpen : ''}`} aria-label="Main navigation" onKeyDown={event => { if (event.key === 'Escape') { setOpen(false); menuButton.current?.focus(); } }}>
        {nav.map(key => <Link key={key} href={href(version, key)} aria-current={current === key ? 'page' : undefined} onClick={() => setOpen(false)}>{routes[key].title}{key === 'contact' && <ArrowUpRight size={16} />}</Link>)}
      </nav>
    </header>
  </>;
}
