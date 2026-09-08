'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Heart, X, ArrowsOut } from '@phosphor-icons/react';
import { href } from '@/data/firestar/content';
import { looks, tones, lookEmail, type Tone, type Look } from './looks';
import s from './quartz.module.css';
import { QuartzCarousel } from './QuartzCarousel';

export function QuartzGallery() {
  const [tone, setTone] = useState<Tone>('all');
  const [saved, setSaved] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [roomView, setRoomView] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Look>(looks[0]);
  const [viewerLooks, setViewerLooks] = useState<readonly Look[]>(looks);
  const dialog = useRef<HTMLDialogElement>(null);
  const filtered = looks.filter(look => (tone === 'all' || look.tone === tone) && (!savedOnly || saved.includes(look.id)) && `${look.title} ${look.code}`.toLowerCase().includes(query.trim().toLowerCase()));
  const toggleSave = (id: string) => setSaved(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const openLook = (look: Look) => { setViewerLooks(filtered); setSelected(look); setRoomView(false); setDetailOpen(true); dialog.current?.showModal(); };
  const move = (direction: number) => { setRoomView(false); setSelected(viewerLooks[(viewerLooks.indexOf(selected) + direction + viewerLooks.length) % viewerLooks.length]); };
  return <section className={s.gallery} aria-labelledby="quartz-gallery-title">
    <div className={s.intro}>
      <div><p className={s.eyebrow}>The Kasa Quartz collection</p><h1 id="quartz-gallery-title">Find your <em>quartz.</em></h1></div>
      <div className={s.introCopy}><p>Explore Kasa Quartz colours and patterns. Save your favourites and ask our Nanaimo team about samples and availability.</p><Link href={href('v1', 'showroom')}>Plan a showroom visit <ArrowUpRight size={18} /></Link></div>
    </div>
    <div className={s.toolbar}>
      <div className={s.filters} aria-label="Filter by colour">{tones.map(item => <button key={item.key} aria-pressed={tone === item.key} onClick={() => setTone(item.key)}>{item.key !== 'all' && <span className={s.swatch} style={{ background: item.color }} aria-hidden="true" />}{item.label}</button>)}</div>
      <label className={s.search}><span>Find a selection</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Name or product code" /></label>
      <button className={s.savedFilter} aria-pressed={savedOnly} onClick={() => setSavedOnly(!savedOnly)}><Heart size={19} weight={savedOnly ? 'fill' : 'regular'} />Saved ({saved.length})</button>
    </div>
    <QuartzCarousel key={filtered.map(look => look.id).join(',')} paused={detailOpen} caption={`${filtered.length} ${filtered.length === 1 ? 'selection' : 'selections'} to explore${savedOnly ? ' · Your favourites' : ''}`}>{filtered.map((look, i) => <article className={s.card} key={look.id}>
      <div className={s.imageWrap}><button className={s.openImage} onClick={() => openLook(look)} aria-label={`Explore ${look.title}`}><Image src={`/assets/firestar/${look.image}-thumb.webp`} alt={`Kasa Quartz ${look.code} ${look.title} — ${look.imageKind === 'slab' ? 'slab pattern' : 'room illustration'}`} width={800} height={600} sizes="(max-width: 600px) 92vw, (max-width: 1000px) 45vw, 30vw" loading={i < 3 ? 'eager' : 'lazy'} /><span className={s.zoom}><ArrowsOut size={21} /></span></button><button className={s.save} onClick={() => toggleSave(look.id)} aria-label={`${saved.includes(look.id) ? 'Unsave' : 'Save'} ${look.title}`} aria-pressed={saved.includes(look.id)}><Heart size={22} weight={saved.includes(look.id) ? 'fill' : 'regular'} /></button></div>
      <button className={s.cardTitle} onClick={() => openLook(look)} aria-label={`View details for ${look.title}`}><div><h2>{look.title}</h2><p>{look.code} <span aria-hidden="true">·</span> {look.pattern}</p></div><ArrowUpRight size={23} /></button>
    </article>)}</QuartzCarousel>
    {filtered.length === 0 && <div className={s.empty}><Heart size={32} /><h2>{savedOnly ? 'Your shortlist starts here.' : 'No matching selections.'}</h2><p>{savedOnly ? 'Tap the heart on a selection you like to build your shortlist.' : 'Try a different name, product code or colour.'}</p><button onClick={() => { setSavedOnly(false); setTone('all'); setQuery(''); }}>Explore all quartz <ArrowRight size={18} /></button></div>}
    <div className={s.afterGallery}><p>Kasa Quartz catalogue imagery. Colours may vary on screen; confirm your choice with a physical sample. Ask our team about availability and pricing.</p><Link href={href('v1', 'gallery')}>View the full project gallery <ArrowUpRight size={19} /></Link></div>
    {saved.length > 0 && <aside className={s.shortlist} aria-label="Your shortlist"><div><Heart size={22} weight="fill" /><p><strong>{saved.length} {saved.length === 1 ? 'selection' : 'selections'} you love.</strong> Ask us about samples and pricing.</p></div><a href={lookEmail(looks.filter(look => saved.includes(look.id)))}>Ask about your favourites <ArrowUpRight size={20} /></a></aside>}
    <dialog ref={dialog} className={s.dialog} aria-label="Kasa Quartz selection" onClose={() => setDetailOpen(false)} onClick={e => { if (e.target === dialog.current) dialog.current.close(); }} onKeyDown={e => { if (e.key === 'ArrowRight') { e.preventDefault(); move(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); } }}>
      <button className={s.close} onClick={() => dialog.current?.close()} aria-label="Close selection" autoFocus><X size={25} /></button>
      <div className={s.dialogImage}><Image src={`/assets/firestar/${roomView && selected.roomImage ? selected.roomImage : selected.image}.webp`} alt={`Kasa Quartz ${selected.code} ${selected.title} — ${roomView || selected.imageKind === 'room' ? 'room illustration' : 'slab pattern'}`} width={1000} height={750} /><div className={s.imageNavigation}><button onClick={() => move(-1)} aria-label="Previous selection"><ArrowLeft size={23} /></button><p aria-live="polite">{viewerLooks.indexOf(selected) + 1} / {viewerLooks.length}</p><button onClick={() => move(1)} aria-label="Next selection"><ArrowRight size={23} /></button></div></div>
      <div className={s.details}><p className={s.eyebrow}>Kasa Quartz · {selected.code}</p><h2>{selected.title}</h2><p>{selected.description}</p>{selected.roomImage && <div className={s.viewToggle} aria-label="Product image view"><button aria-pressed={!roomView} onClick={() => setRoomView(false)}>Slab pattern</button><button aria-pressed={roomView} onClick={() => setRoomView(true)}>In a room</button></div>}<div className={s.tags}><span>{tones.find(item => item.key === selected.tone)?.label}</span><span>{selected.pattern}</span></div><a className={s.enquire} href={lookEmail([selected])}>Ask about this quartz <ArrowUpRight size={20} /></a><button className={s.saveDetail} onClick={() => toggleSave(selected.id)} aria-pressed={saved.includes(selected.id)}><Heart size={20} weight={saved.includes(selected.id) ? 'fill' : 'regular'} />{saved.includes(selected.id) ? 'Saved to your favourites' : 'Save to your favourites'}</button><p className={s.note}>Kasa catalogue {roomView || selected.imageKind === 'room' ? 'room illustration' : 'slab image'}. Confirm colour, availability and pricing with our team.</p><a className={s.source} href={selected.source} target="_blank" rel="noopener noreferrer">View on Kasa Quartz <ArrowUpRight size={17} /></a></div>
    </dialog>
  </section>;
}
