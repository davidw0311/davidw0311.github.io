'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, X, ArrowsOut } from '@phosphor-icons/react';
import { gallery } from '@/data/firestar/content';
import type { ProjectPhoto } from '@/data/firestar/projectPhotos';
import styles from './firestar.module.css';

type Category = 'all' | 'kitchen' | 'bathroom' | 'other';
const categories: { key: Category; name: string }[] = [{ key: 'all', name: 'All projects' }, { key: 'kitchen', name: 'Kitchen' }, { key: 'bathroom', name: 'Bathroom' }, { key: 'other', name: 'Others' }];
export function Gallery({ initial = 'all', items = gallery, scrolling = false }: { initial?: Category; items?: ProjectPhoto[]; scrolling?: boolean }) {
  const [category, setCategory] = useState<Category>(initial);
  const [limit, setLimit] = useState(12);
  const [selected, setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const filtered = items.filter(photo => category === 'all' || photo.category === category);
  const photo = filtered[selected];
  const move = (amount: number) => setSelected(index => (index + amount + filtered.length) % filtered.length);
  const scrollPhotos = (direction: number) => {
    const element = rail.current;
    if (!element) return;
    element.scrollBy({
      left: direction * element.clientWidth * .85,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  };
  return <>
    {!scrolling && <div className={styles.filters} aria-label="Filter gallery">
      {categories.map(item => <button key={item.key} aria-pressed={item.key === category} onClick={() => { setCategory(item.key); setLimit(12); setSelected(0); }}>{item.name}<span>{item.key === 'all' ? items.length : items.filter(p => p.category === item.key).length}</span></button>)}
    </div>}
    {scrolling && <div className={styles.projectRailControls}>
      <p>{filtered.length} photos · Scroll to explore</p>
      <div>
        <button aria-label="Scroll photos left" onClick={() => scrollPhotos(-1)}><ArrowLeft size={22} /></button>
        <button aria-label="Scroll photos right" onClick={() => scrollPhotos(1)}><ArrowRight size={22} /></button>
      </div>
    </div>}
    {!scrolling && <p className={styles.resultCount} role="status">Showing {Math.min(limit, filtered.length)} of {filtered.length} photographs</p>}
    <div ref={rail} className={scrolling ? styles.projectRail : styles.galleryGrid} role={scrolling ? 'region' : undefined} aria-label={scrolling ? 'Quartz project photographs' : undefined} tabIndex={scrolling ? 0 : undefined}>
      {filtered.slice(0, scrolling ? filtered.length : limit).map((item, index) => <button className={styles.galleryPhoto} key={item.src} onClick={() => { setSelected(index); dialog.current?.showModal(); }} aria-label={`Enlarge ${item.alt}`}>
        <Image src={item.thumbnailSrc ?? item.src.replace(/\.(jpe?g)$/i, '.webp')} alt={item.alt} width={item.width ?? 720} height={item.height ?? 540} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
        <span>{item.category === 'other' ? 'Custom stonework' : item.category}<ArrowsOut size={20} /></span>
      </button>)}
    </div>
    {!scrolling && limit < filtered.length && <button className={styles.button} onClick={() => setLimit(value => value + 12)}>Load more projects <ArrowRight size={18} /></button>}
    <dialog ref={dialog} className={styles.lightbox} aria-label="Project photograph" onClick={event => { if (event.target === dialog.current) dialog.current.close(); }} onKeyDown={event => { if (event.key === 'ArrowRight') move(1); if (event.key === 'ArrowLeft') move(-1); }}>
      <div className={styles.lightboxInner}>
        <button className={styles.close} onClick={() => dialog.current?.close()} aria-label="Close photograph" autoFocus><X size={26} /></button>
        {photo && <Image src={photo.src} alt={photo.alt} width={photo.width ?? 1000} height={photo.height ?? 750} />}
        <div className={styles.lightboxControls}>
          <button onClick={() => move(-1)} aria-label="Previous photograph"><ArrowLeft size={24} /></button>
          <p aria-live="polite">{photo?.alt}<br /><span>{selected + 1} / {filtered.length}</span></p>
          <button onClick={() => move(1)} aria-label="Next photograph"><ArrowRight size={24} /></button>
        </div>
      </div>
    </dialog>
  </>;
}
