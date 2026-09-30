'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Minus, Moon, Pause, Play, Plus, Sun } from '@phosphor-icons/react';
import type { KitchenScene } from '../scene';
import type { KitchenDesign } from '../kitchen';
import { MATERIALS } from '../materials';
import SlabCatalogue from './SlabCatalogue';
import DesignControls from './DesignControls';
import { clampZoom, DEFAULT_LIGHTING, flyoverDesign, flyoverPose, restoreFlyover, type Lighting } from './model';
import styles from './flyover.module.css';

const STORAGE_KEY = 'infinite-granite-flyover-v1';
const OPTIONS = { selected: null, walls: true, dimensions: false, showroom: true };
const TABS = ['Countertops', 'Design'] as const;
export default function Flyover() {
  const host = useRef<HTMLDivElement>(null), scene = useRef<KitchenScene | null>(null);
  const [design, setDesign] = useState(flyoverDesign), [lighting, setLighting] = useState<Lighting>(DEFAULT_LIGHTING);
  const [tab, setTab] = useState<typeof TABS[number]>('Countertops');
  const [playing, setPlaying] = useState(true), [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null), [textureStatus, setTextureStatus] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  const elapsed = useRef(0), designRef = useRef(design), lightRef = useRef(lighting);

  useEffect(() => {
    let cancelled = false;
    let instance: KitchenScene | null = null;
    async function initialize() {
      try {
        const { createKitchenScene } = await import('../scene');
        if (cancelled || !host.current) return;
        let restored = { design: designRef.current, lighting: lightRef.current };
        try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) restored = restoreFlyover(JSON.parse(saved)); } catch { /* Storage is optional. */ }
        designRef.current = restored.design; lightRef.current = restored.lighting;
        setDesign(restored.design); setLighting(restored.lighting);
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPlaying(false);
        setError(null);
        instance = createKitchenScene(host.current, () => {}, message => { if (!cancelled) setError(message); }, message => { if (!cancelled) setTextureStatus(message); });
        scene.current = instance;
        instance.update(restored.design, OPTIONS); instance.lighting(restored.lighting);
        const pose = flyoverPose(elapsed.current, host.current.clientWidth / Math.max(1, host.current.clientHeight), zoomRef.current);
        instance.frame(pose.position, pose.target, pose.fov); setReady(true);
      } catch { if (!cancelled) setError('The 3D view could not start. Try reloading the view or enabling hardware acceleration in your browser.'); }
    }
    void initialize();
    return () => { cancelled = true; instance?.dispose(); scene.current = null; };
  }, [attempt]);

  useEffect(() => {
    designRef.current = design;
    scene.current?.update(design, OPTIONS);
    scene.current?.lighting(lightRef.current);
  }, [design]);
  useEffect(() => { lightRef.current = lighting; scene.current?.lighting(lighting); }, [lighting]);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ design, lighting })); } catch { /* Private browsing may disable persistence. */ }
  }, [design, lighting, ready]);

  useEffect(() => {
    if (!ready || error || !host.current) return;
    let raf = 0, last: number | null = null;
    const frame = () => {
      if (!host.current) return;
      const pose = flyoverPose(elapsed.current, host.current.clientWidth / Math.max(1, host.current.clientHeight), zoomRef.current);
      scene.current?.frame(pose.position, pose.target, pose.fov);
    };
    const tick = (time: number) => {
      if (last !== null) elapsed.current += Math.min((time - last) / 1000, .1);
      last = time; frame(); raf = requestAnimationFrame(tick);
    };
    const visibility = () => {
      cancelAnimationFrame(raf); last = null;
      if (playing && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const observer = new ResizeObserver(frame); observer.observe(host.current);
    document.addEventListener('visibilitychange', visibility); visibility(); frame();
    return () => { cancelAnimationFrame(raf); observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, [ready, playing, error, attempt]);

  useEffect(() => {
    zoomRef.current = zoom;
    if (!host.current) return;
    const pose = flyoverPose(elapsed.current, host.current.clientWidth / Math.max(1, host.current.clientHeight), zoom);
    scene.current?.frame(pose.position, pose.target, pose.fov);
  }, [zoom]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => { event.preventDefault(); setZoom(z => clampZoom(z * Math.exp(-event.deltaY * .001))); };
    let distance = 0;
    const pinch = (event: TouchEvent) => {
      if (event.touches.length !== 2) { distance = 0; return; }
      event.preventDefault();
      const next = Math.hypot(event.touches[0].clientX - event.touches[1].clientX, event.touches[0].clientY - event.touches[1].clientY);
      if (distance > 0) setZoom(z => clampZoom(z * next / distance));
      distance = next;
    };
    element.addEventListener('wheel', wheel, { passive: false });
    element.addEventListener('touchstart', pinch, { passive: false }); element.addEventListener('touchmove', pinch, { passive: false });
    element.addEventListener('touchend', pinch); element.addEventListener('touchcancel', pinch);
    return () => { element.removeEventListener('wheel', wheel); element.removeEventListener('touchstart', pinch); element.removeEventListener('touchmove', pinch); element.removeEventListener('touchend', pinch); element.removeEventListener('touchcancel', pinch); };
  }, []);

  function change<K extends keyof KitchenDesign>(key: K, value: KitchenDesign[K]) { setDesign(d => ({ ...d, [key]: value })); }
  function light(patch: Partial<Lighting>) { setLighting(l => ({ ...l, ...patch })); }
  function saveFrame() {
    const url = scene.current?.screenshot(); if (!url) return;
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `InfiniteGranite-flyover-${lighting.mode}.png`; anchor.click();
  }
  const material = MATERIALS.find(m => m.id === design.countertop)!;
  return <main className={styles.page}>
    <header className={styles.header}>
      <Link className={styles.brand} href="/projects/infinite-granite/">Infinite<span>Granite</span></Link>
      <nav aria-label="InfiniteGranite views" className={styles.nav}><Link href="/projects/infinite-granite/">Room Planner</Link><Link href="/projects/infinite-granite/showcase/">Slab Studio</Link><Link href="/projects/infinite-granite/flyover/" aria-current="page">Kitchen Flyover</Link></nav>
    </header>
    <div className={styles.workspace}>
      <section className={styles.viewer} aria-label="Kitchen preview">
        <div className={styles.stage} ref={host} />
        <div className={styles.viewTop}><h1>Kitchen Flyover</h1><button className={styles.iconButton} onClick={() => light({ mode: lighting.mode === 'day' ? 'night' : 'day' })} aria-label={lighting.mode === 'day' ? 'Switch to nighttime' : 'Switch to daytime'} title={lighting.mode === 'day' ? 'Switch to nighttime' : 'Switch to daytime'}>{lighting.mode === 'day' ? <Sun size={21} /> : <Moon size={21} />}</button></div>
        {(!ready || error) && <div className={styles.status} role="status">{error || 'Building your kitchen…'}{error && <button onClick={() => { setReady(false); setAttempt(a => a + 1); }}>Reload 3D view</button>}</div>}
        <div className={styles.viewBottom}><div className={styles.selectedSlab}><small>{material.company}</small><strong>{material.code}{material.name !== material.code && ` · ${material.name}`}</strong></div><div className={styles.actions}>
          <div className={styles.zoomControls}><button disabled={!ready || !!error || zoom <= .75} onClick={() => setZoom(z => clampZoom(z - .15))} aria-label="Zoom out" title="Zoom out"><Minus size={18} /></button><button className={styles.zoomValue} onClick={() => setZoom(1)} aria-label="Reset zoom" title="Reset zoom">{Math.round(zoom * 100)}%</button><button disabled={!ready || !!error || zoom >= 1.8} onClick={() => setZoom(z => clampZoom(z + .15))} aria-label="Zoom in" title="Zoom in"><Plus size={18} /></button></div>
          <button className={styles.iconButton} disabled={!ready || !!error} onClick={() => setPlaying(p => !p)} aria-label={playing ? 'Pause camera' : 'Play camera'} title={playing ? 'Pause camera' : 'Play camera'}>{playing ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}</button><button className={styles.iconButton} onClick={saveFrame} disabled={!ready || !!error || !!textureStatus} aria-label="Save current frame" title="Save current frame"><ArrowDown size={18} /></button></div></div>
        {textureStatus && <p className={styles.textureStatus} role="status">{textureStatus}</p>}
      </section>
      <aside className={styles.panel} aria-label="Kitchen finishes">
        <div className={styles.tabs} role="group" aria-label="Finish category">{TABS.map(t => <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>{t}</button>)}</div>
        <div className={styles.panelBody}>
          <div className={styles.tabContent} hidden={tab !== 'Countertops'}><SlabCatalogue value={design.countertop} onChange={id => change('countertop', id)} /></div>
          {tab === 'Design' && <DesignControls design={design} lighting={lighting} change={patch => setDesign(d => ({ ...d, ...patch }))} light={light} />}
        </div>
      </aside>
    </div>
    <p className={styles.footnote}>Supplier photographs. Slab scale and colours are approximate.</p>
  </main>;
}
