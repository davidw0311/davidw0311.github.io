'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Heart, X } from '@phosphor-icons/react';
import { href } from '@/data/firestar/content';
import { looks, tones, lookEmail, type Look } from './looks';
import s from './quartz.module.css';
import { QuartzCarousel } from './QuartzCarousel';

export function QuartzGallery() {
  const [saved, setSaved] = useState<string[]>([]);
  const [roomView, setRoomView] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Look>(looks[0]);
  const dialog = useRef<HTMLDialogElement>(null);
  const toggleSave = (id: string) => setSaved(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const openLook = (look: Look) => { setSelected(look); setRoomView(false); setDetailOpen(true); dialog.current?.showModal(); };
  const move = (direction: number) => { setRoomView(false); setSelected(looks[(looks.indexOf(selected) + direction + looks.length) % looks.length]); };
  return <section className={s.gallery} aria-labelledby="quartz-gallery-title">
    <div className={s.intro}><p className={s.eyebrow}>Kasa Quartz collection</p><h1 id="quartz-gallery-title">Find your <em>surface.</em></h1></div>
    <QuartzCarousel paused={detailOpen}>{looks.map((look, i) => <article className={s.card} key={look.id}>
      <div className={s.imageWrap}><button className={s.openImage} onClick={() => openLook(look)} aria-label={`Explore ${look.title}`}><Image src={`/assets/firestar/${look.image}-thumb.webp`} alt={`${look.title} (${look.code}) — ${look.imageKind === 'slab' ? 'slab pattern' : 'room illustration'}`} width={800} height={600} sizes="(max-width: 600px) 92vw, (max-width: 1000px) 45vw, 30vw" loading={i < 3 ? 'eager' : 'lazy'} /></button></div>
      <button className={s.cardTitle} onClick={() => openLook(look)} aria-label={`View details for ${look.title}`}><div><h2>{look.title}</h2><p>{look.code}</p></div><ArrowUpRight size={23} /></button>
    </article>)}</QuartzCarousel>
    <div className={s.afterGallery}><p>Supplier catalogue imagery. Colours may vary on screen; confirm your choice with a physical sample. Ask our team about availability and pricing.</p><Link href={href('v1', 'gallery')}>View the full project gallery <ArrowUpRight size={19} /></Link></div>
    {saved.length > 0 && <aside className={s.shortlist} aria-label="Your shortlist"><div><Heart size={22} weight="fill" /><p><strong>{saved.length} {saved.length === 1 ? 'selection' : 'selections'} you love.</strong> Ask us about samples and pricing.</p></div><a href={lookEmail(looks.filter(look => saved.includes(look.id)))}>Ask about your favourites <ArrowUpRight size={20} /></a></aside>}
    <dialog ref={dialog} className={s.dialog} aria-label="Kasa Quartz selection" onClose={() => setDetailOpen(false)} onClick={e => { if (e.target === dialog.current) dialog.current.close(); }} onKeyDown={e => { if (e.key === 'ArrowRight') { e.preventDefault(); move(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); } }}>
      <button className={s.close} onClick={() => dialog.current?.close()} aria-label="Close selection" autoFocus><X size={25} /></button>
      <div className={s.dialogImage}><Image src={`/assets/firestar/${roomView && selected.roomImage ? selected.roomImage : selected.image}.webp`} alt={`${selected.title} (${selected.code}) — ${roomView || selected.imageKind === 'room' ? 'room illustration' : 'slab pattern'}`} width={1000} height={750} /><div className={s.imageNavigation}><button onClick={() => move(-1)} aria-label="Previous selection"><ArrowLeft size={23} /></button><p aria-live="polite">{looks.indexOf(selected) + 1} / {looks.length}</p><button onClick={() => move(1)} aria-label="Next selection"><ArrowRight size={23} /></button></div></div>
      <div className={s.details}><p className={s.eyebrow}>Kasa Quartz · {selected.code}</p><h2>{selected.title}</h2><p>{selected.description}</p>{selected.roomImage && <div className={s.viewToggle} aria-label="Product image view"><button aria-pressed={!roomView} onClick={() => setRoomView(false)}>Slab pattern</button><button aria-pressed={roomView} onClick={() => setRoomView(true)}>In a room</button></div>}<div className={s.tags}><span>{tones.find(item => item.key === selected.tone)?.label}</span><span>{selected.pattern}</span></div><a className={s.enquire} href={lookEmail([selected])}>Enquire about this selection <ArrowUpRight size={20} /></a><button className={s.saveDetail} onClick={() => toggleSave(selected.id)} aria-pressed={saved.includes(selected.id)}><Heart size={20} weight={saved.includes(selected.id) ? 'fill' : 'regular'} />{saved.includes(selected.id) ? 'Saved to your favourites' : 'Save to your favourites'}</button><p className={s.note}>Kasa catalogue {roomView || selected.imageKind === 'room' ? 'room illustration' : 'slab image'}. Confirm colour, availability and pricing with our team.</p><a className={s.source} href={selected.source} target="_blank" rel="noopener noreferrer">View supplier details <ArrowUpRight size={17} /></a></div>
    </dialog>
  </section>;
}
