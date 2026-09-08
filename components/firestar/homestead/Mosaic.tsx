'use client';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, X, Plus } from '@phosphor-icons/react';
import { gallery } from '@/data/firestar/content';
import s from './homestead.module.css';
type Category = 'all' | 'kitchen' | 'bathroom' | 'other';
const options: { key: Category; label: string }[] = [{ key: 'all', label: 'Everything' }, { key: 'kitchen', label: 'Kitchen' }, { key: 'bathroom', label: 'Bathroom' }, { key: 'other', label: 'Others' }];
export function Mosaic({ initial = 'all' }: { initial?: Category }) {
  const [category, setCategory] = useState<Category>(initial);
  const [limit, setLimit] = useState(15);
  const [selected, setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const items = gallery.filter(p => category === 'all' || p.category === category);
  const move = (step: number) => setSelected(i => (i + step + items.length) % items.length);
  return <><div className={s.galleryFilters} aria-label="Filter projects">{options.map(item => <button key={item.key} aria-pressed={category === item.key} onClick={() => { setCategory(item.key); setLimit(15); setSelected(0); }}>{item.label}</button>)}</div><p className={s.galleryStatus} role="status">{Math.min(limit, items.length)} of {items.length} ideas to explore</p><div className={s.mosaic}>{items.slice(0, limit).map((item, i) => <button key={item.src} onClick={() => { setSelected(i); dialog.current?.showModal(); }} aria-label={`Enlarge ${item.alt}`}><Image src={item.src.replace(/\.jpe?g$/i, '.webp')} alt={item.alt} width={720} height={540} loading="lazy" /><span>Take a closer look <Plus size={18} /></span></button>)}</div>{limit < items.length && <button className={s.loadMore} onClick={() => setLimit(n => n + 15)}>More inspiration <Plus size={20} /></button>}
    <dialog ref={dialog} className={s.dialog} aria-label="Project photograph" onClick={e => { if (e.target === dialog.current) dialog.current.close(); }} onKeyDown={e => { if (e.key === 'ArrowRight') move(1); if (e.key === 'ArrowLeft') move(-1); }}><button className={s.dialogClose} autoFocus onClick={() => dialog.current?.close()} aria-label="Close photograph"><X size={25} /></button><Image src={items[selected].src} alt={items[selected].alt} width={1200} height={900} /><div className={s.dialogControls}><button onClick={() => move(-1)} aria-label="Previous photograph"><ArrowLeft size={24} /></button><p aria-live="polite">{items[selected].alt}<br />{selected + 1} / {items.length}</p><button onClick={() => move(1)} aria-label="Next photograph"><ArrowRight size={24} /></button></div></dialog>
  </>;
}
