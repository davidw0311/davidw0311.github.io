'use client';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowsOut, X } from '@phosphor-icons/react';
import { gallery } from '@/data/firestar/content';
import s from './catalogue.module.css';
type Category = 'all' | 'kitchen' | 'bathroom' | 'other';
export function Exhibition({ initial = 'all' }: { initial?: Category }) {
  const [category, setCategory] = useState<Category>(initial);
  const [index, setIndex] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const items = gallery.filter(p => category === 'all' || p.category === category);
  const photo = items[index];
  const move = (step: number) => setIndex(i => (i + step + items.length) % items.length);
  return <div className={s.exhibition}>
    <div className={s.exhibitionToolbar}><label>Collection<select value={category} onChange={e => { setCategory(e.target.value as Category); setIndex(0); }}><option value="all">All projects · {gallery.length}</option><option value="kitchen">Kitchen · 36</option><option value="bathroom">Bathroom · 27</option><option value="other">Others · 21</option></select></label><span role="status">{String(index + 1).padStart(2, '0')} / {items.length}</span></div>
    <div className={s.projector} onKeyDown={e => { if (e.key === 'ArrowLeft') move(-1); if (e.key === 'ArrowRight') move(1); }}>
      <Image src={photo.src.replace(/\.jpe?g$/i, '.webp')} alt={photo.alt} width={1000} height={750} priority />
      <button className={s.enlarge} onClick={() => dialog.current?.showModal()} aria-label="Enlarge photograph"><ArrowsOut size={23} /></button>
      <div className={s.projectorControls}><button onClick={() => move(-1)} aria-label="Previous project"><ArrowLeft size={25} /></button><p aria-live="polite">{photo.alt}</p><button onClick={() => move(1)} aria-label="Next project"><ArrowRight size={25} /></button></div>
    </div>
    <div className={s.filmstrip} aria-label="Project thumbnails">{items.map((item, i) => <button key={item.src} onClick={() => setIndex(i)} aria-pressed={i === index} aria-label={`View ${item.alt}`}><Image src={item.src.replace(/\.jpe?g$/i, '.webp')} alt="" width={120} height={90} loading="lazy" /></button>)}</div>
    <dialog ref={dialog} className={s.dialog} aria-label="Enlarged project photograph" onClick={e => { if (e.target === dialog.current) dialog.current.close(); }} onKeyDown={e => { if (e.key === 'ArrowLeft') move(-1); if (e.key === 'ArrowRight') move(1); }}><button autoFocus onClick={() => dialog.current?.close()} aria-label="Close photograph"><X size={28} /></button><Image src={photo.src} alt={photo.alt} width={1200} height={900} /><p>{photo.alt}</p></dialog>
  </div>;
}
