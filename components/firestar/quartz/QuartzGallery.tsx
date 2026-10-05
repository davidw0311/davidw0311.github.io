'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Heart, X } from '@phosphor-icons/react';
import { looks, tones, lookEmail, type Look } from './looks';
import s from './quartz.module.css';
import { QuartzCarousel } from './QuartzCarousel';
import { featuredSlabs } from './featuredSlabs';
import KitchenPreview from '../kitchen/KitchenPreview';

export function QuartzGallery({ kitchenPreview = false }: { kitchenPreview?: boolean }) {
  const collection = kitchenPreview ? featuredSlabs : looks;
  const [activeIndex, setActiveIndex] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const [roomView, setRoomView] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Look>(collection[0]);
  const dialog = useRef<HTMLDialogElement>(null);
  const toggleSave = (id: string) => setSaved(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const openLook = (look: Look) => { setSelected(look); setRoomView(false); setDetailOpen(true); dialog.current?.showModal(); };
  const move = (direction: number) => { setRoomView(false); setSelected(collection[(collection.indexOf(selected) + direction + collection.length) % collection.length]); };
  return <section className={`${s.gallery} ${kitchenPreview ? s.withKitchen : ''}`} aria-labelledby="quartz-gallery-title">
    <div className={s.intro}>
      <div><p className={s.eyebrow}>{kitchenPreview ? 'Nanaimo · Vancouver Island' : 'Quartz collection'}</p>{kitchenPreview ? <h1 id="quartz-gallery-title">Quartz countertops,<br /><em>made for your home.</em></h1> : <h2 id="quartz-gallery-title">Explore quartz colours.</h2>}</div>
      <p className={s.introDescription}>{kitchenPreview ? 'Custom fabrication and installation by our Nanaimo team. Browse colours, preview your kitchen and find your favourite surface.' : 'Select a surface to see its details, save your favourites or enquire about samples and pricing.'}</p>
    </div>
    <QuartzCarousel paused={detailOpen} count={collection.length} onActiveIndexChange={setActiveIndex}>{duplicate => collection.map((look, i) => <article className={s.card} key={look.id} data-carousel-slide data-active={kitchenPreview && i === activeIndex ? true : undefined}>
      <button className={s.surfaceButton} tabIndex={duplicate ? -1 : undefined} onMouseDown={duplicate ? event => event.preventDefault() : undefined} onClick={() => openLook(look)} aria-label={`Explore ${look.title}`}>
        <span className={s.openImage}><Image src={`/assets/firestar/${look.image}${kitchenPreview ? '' : '-thumb'}.webp`} alt={`${look.title} (${look.code}) — ${look.imageKind === 'slab' ? 'slab pattern' : 'room illustration'}`} width={800} height={600} sizes="(max-width: 600px) 92vw, (max-width: 1000px) 45vw, 30vw" loading={!duplicate && i < 3 ? 'eager' : 'lazy'} /></span>
        <span className={s.cardTitle}><span><span className={s.cardName}>{look.title}</span><span className={s.cardSupplier}>{look.supplier}{look.code !== look.title && ` · ${look.code}`}</span></span><ArrowUpRight size={23} aria-hidden="true" /></span>
      </button>
    </article>)}</QuartzCarousel>
    {kitchenPreview && <KitchenPreview materialId={(detailOpen ? selected : collection[activeIndex]).materialId!} />}
    <div className={s.afterGallery}><p>Supplier catalogue imagery. Colours may vary on screen; confirm your choice with a physical sample. Ask our team about availability and pricing.</p></div>
    {saved.length > 0 && <aside className={s.shortlist} aria-label="Your shortlist"><div><Heart size={22} weight="fill" /><p><strong>{saved.length} {saved.length === 1 ? 'selection' : 'selections'} you love.</strong> Ask us about samples and pricing.</p></div><a href={lookEmail(collection.filter(look => saved.includes(look.id)))}>Ask about your favourites <ArrowUpRight size={20} /></a></aside>}
    <dialog ref={dialog} className={s.dialog} aria-label={`${selected.supplier} selection`} onClose={() => setDetailOpen(false)} onClick={e => { if (e.target === dialog.current) dialog.current.close(); }} onKeyDown={e => { if (e.key === 'ArrowRight') { e.preventDefault(); move(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); } }}>
      <button className={s.close} onClick={() => dialog.current?.close()} aria-label="Close selection" autoFocus><X size={25} /></button>
      <div className={s.dialogImage}><Image src={`/assets/firestar/${roomView && selected.roomImage ? selected.roomImage : selected.image}.webp`} alt={`${selected.title} (${selected.code}) — ${roomView || selected.imageKind === 'room' ? 'room illustration' : 'slab pattern'}`} width={1000} height={750} /><div className={s.imageNavigation}><button onClick={() => move(-1)} aria-label="Previous selection"><ArrowLeft size={23} /></button><p aria-live="polite">{collection.indexOf(selected) + 1} / {collection.length}</p><button onClick={() => move(1)} aria-label="Next selection"><ArrowRight size={23} /></button></div></div>
      <div className={s.details}><p className={s.eyebrow}>{selected.supplier} · {selected.code}</p><h2>{selected.title}</h2><p>{selected.description}</p>{selected.roomImage && <div className={s.viewToggle} aria-label="Product image view"><button aria-pressed={!roomView} onClick={() => setRoomView(false)}>Slab pattern</button><button aria-pressed={roomView} onClick={() => setRoomView(true)}>In a room</button></div>}<div className={s.tags}>{selected.tone && <span>{tones.find(item => item.key === selected.tone)?.label}</span>}<span>{selected.pattern}</span></div><a className={s.enquire} href={lookEmail([selected])}>Enquire about this selection <ArrowUpRight size={20} /></a><button className={s.saveDetail} onClick={() => toggleSave(selected.id)} aria-pressed={saved.includes(selected.id)}><Heart size={20} weight={saved.includes(selected.id) ? 'fill' : 'regular'} />{saved.includes(selected.id) ? 'Saved to your favourites' : 'Save to your favourites'}</button><p className={s.note}>{selected.supplier} catalogue {roomView || selected.imageKind === 'room' ? 'room illustration' : 'slab image'}. Confirm colour, availability and pricing with our team.</p><a className={s.source} href={selected.source} target="_blank" rel="noopener noreferrer">View supplier details <ArrowUpRight size={17} /></a></div>
    </dialog>
  </section>;
}
