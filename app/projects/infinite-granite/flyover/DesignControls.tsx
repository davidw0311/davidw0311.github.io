'use client';

import { useRef } from 'react';
import { CaretDown, Check, Moon, Sun, X } from '@phosphor-icons/react';
import { COLORS, type AppliancePart, type KitchenDesign } from '../kitchen';
import { FLOOR_FINISHES } from '../roomFinishes';
import type { Lighting } from './model';
import styles from './flyover.module.css';

const APPLIANCE_COLORS = [{name:'Steel',value:'#adb5b7'},{name:'White',value:'#f1f1eb'},{name:'Black',value:'#202a2d'},{name:'Graphite',value:'#44484a'},{name:'Brass',value:'#b7a06c'}];

function Colors({ label, value, onChange, appliance = false }: { label: string; value: string; onChange: (value: string) => void; appliance?: boolean }) {
  return <div className={`${styles.colorRow} ${appliance ? styles.applianceRow : ''}`}><span>{label}</span><div role="group" aria-label={`${label} colours`}>{(appliance ? APPLIANCE_COLORS : COLORS).map(c => <button key={c.value} style={{ background: c.value }} aria-label={`${label}: ${c.name}`} title={c.name} aria-pressed={value === c.value} onClick={() => onChange(c.value)}>{value === c.value && <Check size={13} />}</button>)}<input type="color" value={value} aria-label={`Custom ${label.toLowerCase()} colour`} onChange={e => onChange(e.target.value)} title="Custom colour" /></div></div>;
}
export default function DesignControls({ design, lighting, change, light }: { design: KitchenDesign; lighting: Lighting; change: (patch: Partial<KitchenDesign>) => void; light: (patch: Partial<Lighting>) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const floor = FLOOR_FINISHES.find(f => f.id === design.floor)!;
  return <div className={styles.designControls}>
    <section><h2>Cupboards</h2><Colors label="Upper" value={design.upperColor} onChange={upperColor => change({ upperColor })} /><Colors label="Lower" value={design.cabinetColor} onChange={cabinetColor => change({ cabinetColor })} /><Colors label="Island" value={design.islandColor} onChange={islandColor => change({ islandColor })} /></section>
    <section><h2>Appliances</h2>{([['range','Stove'],['hood','Hood'],['dishwasher','Dishwasher'],['fridge','Fridge']] as [AppliancePart,string][]).map(([part,label]) => <Colors key={part} appliance label={label} value={design.applianceColors?.[part] ?? '#adb5b7'} onChange={color => change({ applianceColors: { ...design.applianceColors, [part]: color } })} />)}</section>
    <section><label className={styles.backsplashToggle}><span>Backsplash</span><input type="checkbox" checked={design.backsplash !== 'none'} onChange={e => change({ backsplash: e.target.checked ? 'slab' : 'none' })} /></label></section>
    <section className={styles.floorRow}><h2>Floor</h2><button className={styles.floorSelect} aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}><span style={{ background: design.floorColor ?? floor.color }} />{floor.name}<CaretDown size={15} /></button></section>
    <section><Colors label="Wall" value={design.wallColor} onChange={wallColor => change({ wallColor })} /></section>
    <section><h2>Lighting</h2><div className={styles.modes}><button aria-pressed={lighting.mode === 'day'} onClick={() => light({ mode: 'day' })}><Sun size={17} />Day</button><button aria-pressed={lighting.mode === 'night'} onClick={() => light({ mode: 'night' })}><Moon size={17} />Night</button></div><label className={styles.slider}>Brightness<output>{Math.round(lighting.brightness * 100)}%</output><input aria-label="Brightness" type="range" min="40" max="150" value={Math.round(lighting.brightness * 100)} onChange={e => light({ brightness: Number(e.target.value) / 100 })} /></label><label className={styles.slider}>Warmth<output>{Math.round(lighting.warmth * 100)}%</output><input aria-label="Warmth" type="range" min="0" max="100" value={Math.round(lighting.warmth * 100)} onChange={e => light({ warmth: Number(e.target.value) / 100 })} /></label></section>
    <dialog ref={dialog} className={styles.floorDialog} aria-labelledby="floor-title" onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }}><div className={styles.dialogHeader}><h2 id="floor-title">Floor</h2><button autoFocus aria-label="Close floor selection" onClick={() => dialog.current?.close()}><X size={20} /></button></div><div className={styles.floorOptions}><div className={styles.floorGrid}>{FLOOR_FINISHES.map(f => <button key={f.id} aria-pressed={design.floor === f.id} onClick={() => change({ floor: f.id, floorColor: f.color })}><span style={{ backgroundColor: f.color }} data-format={f.format} />{f.name}{design.floor === f.id && <Check size={15} />}</button>)}</div><Colors label="Tint" value={design.floorColor ?? floor.color} onChange={floorColor => change({ floorColor })} /></div></dialog>
  </div>;
}
