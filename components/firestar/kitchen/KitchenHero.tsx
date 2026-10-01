'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Minus, Pause, Play, Plus } from '@phosphor-icons/react';
import { href } from '@/data/firestar/content';
import { MATERIALS, materialLabel } from './engine/materials';
import { DEFAULT_LIGHTING, clampZoom } from './engine/flyover/model';
import type { KitchenScene } from './engine/scene';
import { DESIGN_INTERVAL, KITCHEN_LOOKS, kitchenLook, stationaryPose } from './looks';
import s from './kitchenHero.module.css';

const OPTIONS = { selected: null, walls: true, dimensions: false, showroom: true };

export default function KitchenHero() {
  const host = useRef<HTMLDivElement>(null), section = useRef<HTMLElement>(null), scene = useRef<KitchenScene | null>(null);
  const [index, setIndex] = useState(0), [playing, setPlaying] = useState(true), [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false), [hovered, setHovered] = useState(false), [focused, setFocused] = useState(false), [pageVisible, setPageVisible] = useState(true);
  const [error, setError] = useState(''), [textureStatus, setTextureStatus] = useState<string | null>(null), [attempt, setAttempt] = useState(0);
  const [zoom, setZoom] = useState(1);
  const current = useRef({ index, zoom });
  const look = KITCHEN_LOOKS[index], material = MATERIALS.find(m => m.id === look.material)!;

  useEffect(() => {
    const element = section.current;
    if (!element) return;
    const observer = new IntersectionObserver(entries => setVisible(entries[0].isIntersecting), { threshold: .15 });
    observer.observe(element);
    const visibility = () => setPageVisible(!document.hidden);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const preference = () => { if (motion.matches) setPlaying(false); };
    preference(); visibility();
    motion.addEventListener('change', preference); document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); motion.removeEventListener('change', preference); document.removeEventListener('visibilitychange', visibility); };
  }, []);

  useEffect(() => {
    current.current = { index, zoom };
    const instance = scene.current;
    if (!instance || !host.current) return;
    instance.update(kitchenLook(index), OPTIONS); instance.lighting(DEFAULT_LIGHTING);
    const pose = stationaryPose(host.current.clientWidth / Math.max(1, host.current.clientHeight), zoom);
    instance.frame(pose.position, pose.target, pose.fov);
  }, [index, zoom]);

  useEffect(() => {
    let cancelled = false, instance: KitchenScene | null = null, observer: ResizeObserver | null = null;
    void import('./engine/scene').then(({ createKitchenScene }) => {
      if (cancelled || !host.current) return;
      try {
        instance = createKitchenScene(host.current, () => {}, message => { if (!cancelled) setError(message); }, message => { if (!cancelled) setTextureStatus(message); });
        scene.current = instance; instance.update(kitchenLook(current.current.index), OPTIONS); instance.lighting(DEFAULT_LIGHTING);
        const frame = () => {
          if (!host.current || !instance) return;
          const pose = stationaryPose(host.current.clientWidth / Math.max(1, host.current.clientHeight), current.current.zoom);
          instance.frame(pose.position, pose.target, pose.fov);
        };
        frame(); observer = new ResizeObserver(frame); observer.observe(host.current);
        const canvas = host.current.querySelector('canvas');
        if (canvas) { canvas.tabIndex = -1; canvas.setAttribute('aria-label', 'Live kitchen preview with a stationary camera. Use the design and zoom buttons to explore.'); }
        setReady(true); setError('');
      } catch { setError('The 3D preview could not start on this device. You can still browse our surface collection.'); }
    }).catch(() => { if (!cancelled) setError('The kitchen preview could not load. Please try again.'); });
    return () => { cancelled = true; observer?.disconnect(); instance?.dispose(); scene.current = null; };
  }, [attempt]);

  useEffect(() => {
    if (!ready || error || textureStatus || !playing || !visible || !pageVisible || hovered || focused) return;
    const timer = window.setTimeout(() => setIndex(i => (i + 1) % KITCHEN_LOOKS.length), DESIGN_INTERVAL);
    return () => window.clearTimeout(timer);
  }, [index, ready, error, textureStatus, playing, visible, pageVisible, hovered, focused]);

  function select(offset: number) { setPlaying(false); setIndex(i => (i + offset + KITCHEN_LOOKS.length) % KITCHEN_LOOKS.length); }
  return <section ref={section} className={s.hero} aria-label="Explore kitchen designs" onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <h1 className={s.srOnly}>Find your surface. See it in your kitchen.</h1>
    <div className={s.viewer} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div ref={host} className={s.stage} />
      <div className={s.top}><span>See it in your kitchen.</span><Link href={`${href('v1', 'viewer')}?look=${index}`} prefetch={false}>Explore this kitchen <ArrowUpRight size={20} /></Link></div>
      {(!ready || error) && <div className={s.status} role="status"><p>{error || 'Preparing your kitchen…'}</p>{error && <><button onClick={() => { setReady(false); setError(''); setAttempt(a => a + 1); }}>Try again</button><Link href={href('v1', 'products')}>Browse surfaces <ArrowUpRight size={18} /></Link></>}</div>}
      <div className={s.zoom}><button aria-label="Zoom out of kitchen" disabled={!ready || !!error || zoom <= .75} onClick={() => setZoom(z => clampZoom(z - .15))}><Minus size={18} /></button><button aria-label="Reset kitchen zoom" onClick={() => setZoom(1)}>Reset view</button><button aria-label="Zoom into kitchen" disabled={!ready || !!error || zoom >= 1.8} onClick={() => setZoom(z => clampZoom(z + .15))}><Plus size={18} /></button></div>
      {textureStatus && <span className={s.textureStatus} role="status">{textureStatus}</span>}
    </div>
    <div className={s.toolbar}>
      <div className={s.caption} aria-live={playing ? 'off' : 'polite'}><strong>{look.name}</strong><span>{materialLabel(material)}</span></div>
      <div className={s.controls}><span>{String(index + 1).padStart(2, '0')} / {String(KITCHEN_LOOKS.length).padStart(2, '0')}</span><button aria-label="Previous kitchen design" onClick={() => select(-1)}><ArrowLeft size={20} /></button><button aria-label={playing ? 'Pause design rotation' : 'Play design rotation'} aria-pressed={playing} onClick={() => setPlaying(p => !p)}>{playing ? <Pause size={18} /> : <Play size={18} />}</button><button aria-label="Next kitchen design" onClick={() => select(1)}><ArrowRight size={20} /></button></div>
    </div>
  </section>;
}
