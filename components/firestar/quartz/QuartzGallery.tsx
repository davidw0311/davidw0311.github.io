'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Heart, X, ArrowsOut } from '@phosphor-icons/react';
import { href } from '@/data/firestar/content';
import { looks, tones, lookEmail, type Tone, type Look } from './looks';
import s from './quartz.module.css';

export function QuartzGallery() {
  const [tone, setTone] = useState<Tone>('all');
  const [saved, setSaved] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [selected, setSelected] = useState<Look>(looks[0]);
  const [viewerLooks, setViewerLooks] = useState<readonly Look[]>(looks);
  const dialog = useRef<HTMLDialogElement>(null);
  const filtered = looks.filter(look => (tone === 'all' || look.tone === tone) && (!savedOnly || saved.includes(look.id)));
  const toggleSave = (id: string) => setSaved(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const openLook = (look: Look) => { setViewerLooks(filtered); setSelected(look); dialog.current?.showModal(); };
  const move = (direction: number) => setSelected(viewerLooks[(viewerLooks.indexOf(selected) + direction + viewerLooks.length) % viewerLooks.length]);
  return <section className={s.gallery} aria-labelledby="quartz-gallery-title">
    <div className={s.intro}>
      <div><p className={s.eyebrow}>The quartz lookbook</p><h1 id="quartz-gallery-title">Find your <em>quartz.</em></h1></div>
      <div className={s.introCopy}><p>Explore colour and pattern ideas from our stone projects. We’ll help you find your quartz match.</p><Link href={href('v1', 'showroom')}>See samples in Nanaimo <ArrowUpRight size={18} /></Link></div>
    </div>
    <div className={s.toolbar}>
      <div className={s.filters} aria-label="Filter by colour">{tones.map(item => <button key={item.key} aria-pressed={tone === item.key} onClick={() => setTone(item.key)}>{item.key !== 'all' && <span className={s.swatch} style={{ background: item.color }} aria-hidden="true" />}{item.label}</button>)}</div>
      <button className={s.savedFilter} aria-pressed={savedOnly} onClick={() => setSavedOnly(!savedOnly)}><Heart size={19} weight={savedOnly ? 'fill' : 'regular'} />Saved ({saved.length})</button>
    </div>
    <div className={s.galleryMeta}><p role="status">{filtered.length} {filtered.length === 1 ? 'look' : 'looks'} to explore{savedOnly ? ' · Your favourites' : ''}</p><span>Select a look to see more</span></div>
    <div className={s.grid}>{filtered.map((look, i) => <article className={s.card} key={look.id}>
      <div className={s.imageWrap}><button className={s.openImage} onClick={() => openLook(look)} aria-label={`Explore ${look.title}`}><Image src={`/assets/firestar/${look.image}.webp`} alt={`${look.title} colour inspiration from an original Firestar stone project`} width={800} height={600} sizes="(max-width: 600px) 92vw, (max-width: 1000px) 45vw, 30vw" loading={i < 3 ? 'eager' : 'lazy'} style={{ objectPosition: look.position }} /><span className={s.zoom}><ArrowsOut size={21} /></span></button><button className={s.save} onClick={() => toggleSave(look.id)} aria-label={`${saved.includes(look.id) ? 'Unsave' : 'Save'} ${look.title}`} aria-pressed={saved.includes(look.id)}><Heart size={22} weight={saved.includes(look.id) ? 'fill' : 'regular'} /></button></div>
      <button className={s.cardTitle} onClick={() => openLook(look)} aria-label={`View details for ${look.title}`}><div><h2>{look.title}</h2><p>{look.pattern}</p></div><ArrowUpRight size={23} /></button>
    </article>)}</div>
    {filtered.length === 0 && <div className={s.empty}><Heart size={32} /><h2>{savedOnly ? 'A little room for inspiration.' : 'Try another colour.'}</h2><p>{savedOnly ? 'Tap the heart on a look you like to build your shortlist.' : 'Choose another colour to keep exploring.'}</p><button onClick={() => { setSavedOnly(false); setTone('all'); }}>Explore all looks <ArrowRight size={18} /></button></div>}
    <div className={s.afterGallery}><p>These project photos are style references. Visit our showroom to choose your quartz colour and pattern from physical samples.</p><Link href={href('v1', 'gallery')}>View the full project gallery <ArrowUpRight size={19} /></Link></div>
    {saved.length > 0 && <aside className={s.shortlist} aria-label="Your shortlist"><div><Heart size={22} weight="fill" /><p><strong>{saved.length} {saved.length === 1 ? 'look' : 'looks'} you love.</strong> Let’s find your quartz match.</p></div><a href={lookEmail(looks.filter(look => saved.includes(look.id)))}>Ask about your favourites <ArrowUpRight size={20} /></a></aside>}
    <dialog ref={dialog} className={s.dialog} aria-label="Quartz style inspiration" onClick={e => { if (e.target === dialog.current) dialog.current.close(); }} onKeyDown={e => { if (e.key === 'ArrowRight') { e.preventDefault(); move(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); } }}>
      <button className={s.close} onClick={() => dialog.current?.close()} aria-label="Close look" autoFocus><X size={25} /></button>
      <div className={s.dialogImage}><Image src={`/assets/firestar/${selected.image}.jpg`} alt={`${selected.title} style reference from a Firestar stone project`} width={1000} height={750} /><div className={s.imageNavigation}><button onClick={() => move(-1)} aria-label="Previous look"><ArrowLeft size={23} /></button><p aria-live="polite">{viewerLooks.indexOf(selected) + 1} / {viewerLooks.length}</p><button onClick={() => move(1)} aria-label="Next look"><ArrowRight size={23} /></button></div></div>
      <div className={s.details}><p className={s.eyebrow}>A look to make your own</p><h2>{selected.title}</h2><p>{selected.description}</p><div className={s.tags}><span>{tones.find(item => item.key === selected.tone)?.label}</span><span>{selected.pattern}</span></div><a className={s.enquire} href={lookEmail([selected])}>Find this look in quartz <ArrowUpRight size={20} /></a><button className={s.saveDetail} onClick={() => toggleSave(selected.id)} aria-pressed={saved.includes(selected.id)}><Heart size={20} weight={saved.includes(selected.id) ? 'fill' : 'regular'} />{saved.includes(selected.id) ? 'Saved to your favourites' : 'Save to your favourites'}</button><p className={s.note}>Original stone-project photography. Ask our team about matching quartz samples and availability.</p></div>
    </dialog>
  </section>;
}
