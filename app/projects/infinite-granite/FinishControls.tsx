'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Check, Plus } from '@phosphor-icons/react';
import { COLORS, FINISHES, MATERIALS, colorName, type DoorStyle, type Finish, type KitchenDesign, type SinkStyle } from './kitchen';
import MaterialPicker from './MaterialPicker';
import styles from './studio.module.css';

export type FinishTab = 'surfaces' | 'cupboards' | 'sink';

interface FinishControlsProps {
  tab: FinishTab;
  design: KitchenDesign;
  onChange: <K extends keyof KitchenDesign>(key: K, value: KitchenDesign[K]) => void;
  onMatchCupboards: () => void;
  onArrangeSink?: () => void;
}

export function Field({ label, children, note }: { label: string; children: ReactNode; note?: string }) {
  return <div className={styles.field}><div className={styles.fieldHeading}>{label}</div>{children}{note && <p className={styles.note}>{note}</p>}</div>;
}

export function Range({ label, value, min, max, step = 1, onChange, unit = '″' }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit?: string }) {
  return <label className={styles.range}><span>{label}<strong>{value}{unit}</strong></span><input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} /></label>;
}

export function Choices<T extends string>({ label, value, items, onChange }: { label: string; value: T; items: { id: T; name: string }[]; onChange: (value: T) => void }) {
  return <div className={styles.choices} role="group" aria-label={label}>{items.map(item => <button key={item.id} type="button" aria-pressed={value === item.id} onClick={() => onChange(item.id)}>{item.name}</button>)}</div>;
}

export function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <Field label={label}><div className={styles.colorRow} role="group" aria-label={label}>{COLORS.map(color => <button key={color.value} type="button" className={styles.colorSwatch} style={{ '--swatch': color.value } as CSSProperties} title={color.name} aria-label={`${label}: ${color.name}`} aria-pressed={color.value === value} onClick={() => onChange(color.value)}>{color.value === value && <Check size={17} weight="bold" />}</button>)}<label className={styles.customColor} title={`Custom ${label.toLowerCase()}`}><Plus size={16} /><input type="color" value={value} aria-label={`Custom ${label.toLowerCase()}`} onChange={e => onChange(e.target.value)} /></label></div><p className={styles.selectionName}>{colorName(value)}</p></Field>;
}

export function FinishPicker({ label, value, onChange, ceramic = false }: { label: string; value: Finish; onChange: (value: Finish) => void; ceramic?: boolean }) {
  return <Field label={label}><div className={styles.finishGrid}>{FINISHES.filter(f => ceramic || f.id !== 'white').map(f => <button key={f.id} aria-pressed={value === f.id} onClick={() => onChange(f.id)}><span style={{ background: f.color }} />{f.name}{value === f.id && <Check size={14} />}</button>)}</div></Field>;
}

export default function FinishControls({ tab, design, onChange, onMatchCupboards, onArrangeSink }: FinishControlsProps) {
  return <>
    {tab === 'surfaces' && <>
      <div className={styles.panelHeading}><h3>Countertops</h3><span>{MATERIALS.length} finishes</span></div>
      <p className={styles.panelDescription}>Choose a surface to see it in your kitchen.</p>
      <details className={styles.simpleDetails}><summary>Edges, backsplash & pattern</summary>      <div className={styles.contrastControl}><Field label="Pattern visibility" note="Enhance veins and grain in the 3D preview."><Choices label="Pattern visibility" value={String(design.patternContrast??2)} items={[{id:'1',name:'Natural'},{id:'2',name:'Enhanced'},{id:'3',name:'Bold'}]} onChange={value=>onChange('patternContrast',Number(value))}/></Field></div>
      <Field label="Countertop thickness"><Choices label="Countertop thickness" value={String(design.counterThickness)} items={[{ id: '0.75', name: '¾ inch' }, { id: '1.25', name: '1¼ inch' }, { id: '2', name: '2 inch' }]} onChange={v => onChange('counterThickness', Number(v))} /></Field>
      <label className={styles.toggle}><span><strong>Waterfall island</strong><small>Carry the stone down the sides</small></span><input type="checkbox" checked={design.waterfall} onChange={e => onChange('waterfall', e.target.checked)} /></label>
      <Field label="Backsplash"><Choices label="Backsplash" value={design.backsplash} items={[{ id: 'subway', name: 'Subway tile' }, { id: 'slab', name: 'Match counter' }, { id: 'none', name: 'None' }]} onChange={v => onChange('backsplash', v)} /></Field>
</details>
      <MaterialPicker value={design.countertop} onChange={id => onChange('countertop', id)} />
    </>}
    {tab === 'cupboards' && <>
      <div className={styles.panelHeading}><h3>Cupboard colours</h3></div><p className={styles.panelDescription}>Start with a colour for your lower cupboards.</p>
      <ColorPicker label="Base cupboards" value={design.cabinetColor} onChange={v => onChange('cabinetColor', v)} />
      <button className={styles.textButton} onClick={onMatchCupboards}>Use this colour for all cupboards</button>
      <details className={styles.simpleDetails}><summary>Separate wall & island colours</summary><ColorPicker label="Wall cupboards" value={design.upperColor} onChange={v=>onChange('upperColor',v)}/><ColorPicker label="Island" value={design.islandColor} onChange={v=>onChange('islandColor',v)}/></details>
      <details className={styles.simpleDetails}><summary>Door style & handles</summary>
      <Field label="Door profile"><div className={styles.doorChoices}>{(['shaker', 'slab', 'inset'] as DoorStyle[]).map(style => <button key={style} aria-pressed={design.doorStyle === style} onClick={() => onChange('doorStyle', style)}><span className={styles.doorPreview} data-profile={style} />{style[0].toUpperCase() + style.slice(1)}</button>)}</div></Field>
      <FinishPicker label="Handles & faucet" value={design.hardware} onChange={v => onChange('hardware', v)} /></details>
    </>}
    {tab === 'sink' && <>
      <div className={styles.panelHeading}><h3>Sink</h3></div><p className={styles.panelDescription}>Choose a bowl shape and finish.</p>
      <Field label="Sink style"><div className={styles.sinkChoices}>{([{ id: 'single', name: 'Single bowl', detail: 'One generous basin' }, { id: 'double', name: 'Double bowl', detail: 'Separate wash & rinse' }, { id: 'apron', name: 'Apron front', detail: 'A farmhouse statement' }] as { id: SinkStyle; name: string; detail: string }[]).map(s => <button key={s.id} aria-pressed={design.sinkStyle === s.id} onClick={() => onChange('sinkStyle', s.id)}><span className={styles.sinkPreview} data-sink={s.id} /><span><strong>{s.name}</strong><small>{s.detail}</small></span>{design.sinkStyle === s.id && <Check size={17} />}</button>)}</div></Field>
      <FinishPicker label="Sink finish" value={design.sinkFinish} onChange={v => onChange('sinkFinish', v)} ceramic />
      <details className={styles.simpleDetails}><summary>Faucet options</summary><Field label="Faucet shape"><Choices label="Faucet shape" value={design.faucet} items={[{ id: 'arc', name: 'High arc' }, { id: 'square', name: 'Square neck' }]} onChange={v => onChange('faucet', v)} /></Field>
      <FinishPicker label="Faucet & handles" value={design.hardware} onChange={v => onChange('hardware', v)} /></details>
      {onArrangeSink && <button className={styles.textButton} onClick={onArrangeSink}>Adjust sink placement & cabinet size →</button>}
    </>}
  </>;
}
