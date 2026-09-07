'use client';
import { useState } from 'react';
import { ArrowRight, Check, Eraser, SquaresFour, X } from '@phosphor-icons/react';
import { KIND_NAMES, inches, type ComponentKind, type KitchenDesign } from './kitchen';
import { createCustomDesign, type GridCell } from './placement';
import styles from './studio.module.css';

const abbreviations: Record<ComponentKind,string> = {base:'CAB',upper:'WALL',island:'ISL',sink:'SINK',range:'RNG',fridge:'FRG',dishwasher:'DW',pantry:'PAN',vanity:'VAN',toilet:'WC',shower:'SHW',tub:'TUB'};
export default function GridBuilder({ design, onBuild, onCancel }: {design:KitchenDesign;onBuild:(design:KitchenDesign)=>void;onCancel:()=>void}) {
  const [size,setSize]=useState(6),[layer,setLayer]=useState<'floor'|'upper'>('floor');
  const [tool,setTool]=useState<ComponentKind|'empty'>('base'),[rotation,setRotation]=useState(0);
  const [cells,setCells]=useState<GridCell[]>([]),[notice,setNotice]=useState('');
  function paint(row:number,column:number) {
    const next=cells.filter(c=>!(c.row===row&&c.column===column&&(c.kind==='upper')===(layer==='upper')));
    if(tool!=='empty') next.push({row,column,kind:layer==='upper'?'upper':tool,rotation});
    const proposed=createCustomDesign(size,next,design);
    if(!proposed) {setNotice('Those floor and wall pieces overlap in height. Choose a different cell or clear the other layer.');return;}
    setCells(next);setNotice(tool==='empty'?`Cleared row ${row+1}, column ${column+1}.`:`Placed ${KIND_NAMES[layer==='upper'?'upper':tool].toLowerCase()} in row ${row+1}, column ${column+1}.`);
  }
  function build() {
    const result=createCustomDesign(size,cells,design);
    if(result)onBuild(result);else setNotice('Some pieces do not fit together. Clear the conflicting cells and try again.');
  }
  return <section className={styles.gridBuilder} aria-label="Custom room grid builder">
    <header><div><span className={styles.eyebrow}>BUILD FROM A BLANK PLAN</span><h3>Your room, square by square.</h3></div><button aria-label="Close grid builder" onClick={onCancel}><X size={19}/></button></header>
    <p>Choose a component, then tap a square to place it. Resize and fine-tune each piece after building.</p>
    <label className={styles.selectLabel}>Grid size<select value={size} onChange={e=>{const n=Number(e.target.value);setSize(n);setCells(items=>items.filter(c=>c.row<n&&c.column<n));setNotice('Grid size updated.');}}>{[4,5,6,7,8,9,10].map(n=><option key={n} value={n}>{n} × {n} · {inches(n*36)} square</option>)}</select></label>
    <div className={styles.gridLayer} role="group" aria-label="Grid layer"><button aria-pressed={layer==='floor'} onClick={()=>{setLayer('floor');setTool('base');}}>Floor components</button><button aria-pressed={layer==='upper'} onClick={()=>{setLayer('upper');setTool('upper');}}>Wall cupboards</button></div>
    <div className={styles.gridPaintControls}><label className={styles.selectLabel}>Place in cell<select value={tool} onChange={e=>setTool(e.target.value as ComponentKind|'empty')}><option value="empty">Erase this layer</option>{(Object.keys(KIND_NAMES) as ComponentKind[]).filter(kind=>layer==='upper'?kind==='upper':kind!=='upper').map(kind=><option value={kind} key={kind}>{KIND_NAMES[kind]}</option>)}</select></label><label className={styles.selectLabel}>Facing<select value={rotation} onChange={e=>setRotation(Number(e.target.value))}><option value={0}>Front ↓</option><option value={90}>Right →</option><option value={180}>Back ↑</option><option value={270}>Left ←</option></select></label></div>
    <div className={styles.gridLegend}><span>BACK WALL ↑</span><span>Each square: 36″ × 36″</span></div>
    <div className={styles.gridScroll}><div className={styles.cellGrid} role="group" aria-label={`${size} by ${size} room grid`} style={{minWidth:size*40,gridTemplateColumns:`repeat(${size}, minmax(0,1fr))`}}>{Array.from({length:size*size},(_,index)=>{
      const row=Math.floor(index/size),column=index%size;
      const cell=cells.find(c=>c.row===row&&c.column===column&&(c.kind==='upper')===(layer==='upper'));
      const other=cells.find(c=>c.row===row&&c.column===column&&(c.kind==='upper')!==(layer==='upper'));
      return <button type="button" key={index} data-filled={!!cell} data-other-layer={!!other} aria-label={`Row ${row+1}, column ${column+1}: ${cell?KIND_NAMES[cell.kind]:'empty'}${other?`; ${KIND_NAMES[other.kind]} on other layer`:''}`} onClick={()=>paint(row,column)} title={cell?KIND_NAMES[cell.kind]:'Empty cell'}>{cell?<><strong>{abbreviations[cell.kind]}</strong><span>{['↓','→','↑','←'][(cell.rotation??0)/90]}</span></>:<span>+</span>}{other&&<i aria-hidden="true"/>}</button>;
    })}</div></div>
    <div className={styles.gridSummary}><span>{cells.length} components placed</span><button disabled={!cells.length} onClick={()=>{setCells([]);setNotice('All grid cells cleared.');}}><Eraser size={15}/>Clear grid</button></div>
    <p className={styles.gridNotice} role="status">{notice||'Empty squares become open floor space. Dots indicate pieces on the other layer.'}</p>
    <button className={styles.buildGridButton} onClick={build}><Check size={17}/>Build this room<ArrowRight size={17}/></button>
    <button className={styles.textButton} onClick={onCancel}><SquaresFour size={14}/> Back to existing room</button>
  </section>;
}
