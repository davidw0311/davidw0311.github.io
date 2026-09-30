'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Moon, Pause, Play, Sun } from '@phosphor-icons/react';
import type { KitchenScene } from '../scene';
import type { KitchenDesign } from '../kitchen';
import { MATERIALS } from '../materials';
import MaterialPicker from '../MaterialPicker';
import { ColorPicker } from '../FinishControls';
import { FLOOR_FINISHES } from '../roomFinishes';
import { DEFAULT_LIGHTING, flyoverDesign, flyoverPose, restoreFlyover, type Lighting } from './model';
import styles from './flyover.module.css';

const STORAGE_KEY = 'infinite-granite-flyover-v1';
const OPTIONS = { selected: null, walls: true, dimensions: false, showroom: true };
const TABS = ['Countertops', 'Cupboards', 'Floor', 'Lighting'] as const;
export default function Flyover() {
  const host = useRef<HTMLDivElement>(null), scene = useRef<KitchenScene | null>(null);
  const [design, setDesign] = useState(flyoverDesign), [lighting, setLighting] = useState<Lighting>(DEFAULT_LIGHTING);
  const [tab, setTab] = useState<typeof TABS[number]>('Countertops');
  const [playing, setPlaying] = useState(true), [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null), [textureStatus, setTextureStatus] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
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
        const pose = flyoverPose(elapsed.current, host.current.clientWidth / Math.max(1, host.current.clientHeight));
        instance.frame(pose.position, pose.target); setReady(true);
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
      const pose = flyoverPose(elapsed.current, host.current.clientWidth / Math.max(1, host.current.clientHeight));
      scene.current?.frame(pose.position, pose.target);
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
    <div className={styles.intro}><div><p>YOUR MATERIALS, IN MOTION</p><h1>Kitchen Flyover</h1></div><span>A fresh perspective on every finish.</span></div>
    <div className={styles.workspace}>
      <section className={styles.viewer} aria-label="Kitchen preview">
        <div className={styles.stage} ref={host} />
        <div className={styles.viewTop}><span className={styles.badge}>LIVE 3D <i /> 5 SECOND LOOP</span><button className={styles.iconButton} onClick={() => light({ mode: lighting.mode === 'day' ? 'night' : 'day' })} aria-label={lighting.mode === 'day' ? 'Switch to nighttime' : 'Switch to daytime'} title={lighting.mode === 'day' ? 'Switch to nighttime' : 'Switch to daytime'}>{lighting.mode === 'day' ? <Sun size={21} /> : <Moon size={21} />}</button></div>
        {(!ready || error) && <div className={styles.status} role="status">{error || 'Building your kitchen…'}{error && <button onClick={() => { setReady(false); setAttempt(a => a + 1); }}>Reload 3D view</button>}</div>}
        <div className={styles.viewBottom}><div><small>{material.company}{material.code!==material.name&&` / ${material.code}`}</small><strong>{material.name}</strong></div><div className={styles.actions}><button className={styles.iconButton} disabled={!ready || !!error} onClick={() => setPlaying(p => !p)} aria-label={playing ? 'Pause camera' : 'Play camera'} title={playing ? 'Pause camera' : 'Play camera'}>{playing ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}</button><button className={styles.iconButton} onClick={saveFrame} disabled={!ready || !!error || !!textureStatus} aria-label="Save current frame" title="Save current frame"><ArrowDown size={21} /></button></div></div>
      </section>
      <aside className={styles.panel} aria-label="Kitchen finishes">
        <div className={styles.tabs} role="group" aria-label="Finish category">{TABS.map(t => <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>{t}</button>)}</div>
        <div className={styles.panelBody}>
          <h2>{tab}</h2>
          {tab === 'Countertops' && <><p className={styles.hint}>Choose a slab. See its pattern wrap around the real counter edges.</p><MaterialPicker value={design.countertop} onChange={id => change('countertop', id)} /></>}
          {tab === 'Cupboards' && <><p className={styles.hint}>Colour each part of the kitchen, or bring everything together.</p><ColorPicker label="Lower cupboards" value={design.cabinetColor} onChange={v => change('cabinetColor', v)} /><ColorPicker label="Upper cupboards" value={design.upperColor} onChange={v => change('upperColor', v)} /><ColorPicker label="Island cupboards" value={design.islandColor} onChange={v => change('islandColor', v)} /><button className={styles.match} onClick={() => setDesign(d => ({ ...d, upperColor: d.cabinetColor, islandColor: d.cabinetColor }))}>Match all to lower cupboards</button></>}
          {tab === 'Floor' && <><p className={styles.hint}>Set the foundation with wood or tile, then adjust the colour.</p><div className={styles.floorGrid}>{FLOOR_FINISHES.map(f => <button key={f.id} aria-pressed={design.floor === f.id} onClick={() => setDesign(d => ({ ...d, floor: f.id, floorColor: f.color }))}><span style={{ backgroundColor: f.color }} data-format={f.format} />{f.name}</button>)}</div><ColorPicker label="Floor colour" value={design.floorColor ?? FLOOR_FINISHES.find(f => f.id === design.floor)!.color} onChange={v => change('floorColor', v)} /></>}
          {tab === 'Lighting' && <><p className={styles.hint}>Compare finishes in daylight or a warmer evening room.</p><div className={styles.modes}><button aria-pressed={lighting.mode === 'day'} onClick={() => light({ mode: 'day' })}><Sun size={22} />Daylight</button><button aria-pressed={lighting.mode === 'night'} onClick={() => light({ mode: 'night' })}><Moon size={22} />Evening</button></div><label className={styles.slider}>Brightness <output>{Math.round(lighting.brightness * 100)}%</output><input aria-label="Brightness" type="range" min="40" max="150" value={Math.round(lighting.brightness * 100)} onChange={e => light({ brightness: Number(e.target.value) / 100 })} /></label><label className={styles.slider}>Warmth <output>{Math.round(lighting.warmth * 100)}%</output><input aria-label="Warmth" type="range" min="0" max="100" value={Math.round(lighting.warmth * 100)} onChange={e => light({ warmth: Number(e.target.value) / 100 })} /></label></>}
          {textureStatus && <p className={styles.textureStatus} role="status">{textureStatus}</p>}
        </div>
      </aside>
    </div>
    <p className={styles.footnote}>A live architectural preview. Actual slab scale and colours vary with the material and your display.</p>
  </main>;
}
