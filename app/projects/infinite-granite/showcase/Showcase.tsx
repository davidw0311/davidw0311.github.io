'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,DownloadSimple,ArrowClockwise,Sun,Moon,Check} from '@phosphor-icons/react';
import MaterialPicker from '../MaterialPicker';
import {ColorPicker} from '../FinishControls';
import {MATERIALS} from '../materials';
import {BASE_IMAGE,INITIAL,restoreShowcase,type ShowcaseDesign} from './model';
import {FLOOR_FINISHES,FLOOR_COLORS} from './environment';
import type {createShowcase} from './render';
import shared from '../studio.module.css';
import styles from './showcase.module.css';
const STORAGE='infinitegranite-showcase-v1';
export default function Showcase(){
 const [design,setDesign]=useState(INITIAL),[tab,setTab]=useState<'slabs'|'cupboards'|'floor'>('slabs'),[hydrated,setHydrated]=useState(false),[ready,setReady]=useState(false),[busy,setBusy]=useState(true),[error,setError]=useState(''),[saved,setSaved]=useState(''),[reload,setReload]=useState(0);
 const canvas=useRef<HTMLCanvasElement>(null),renderer=useRef<Awaited<ReturnType<typeof createShowcase>>|null>(null);
 const selected=MATERIALS.find(m=>m.id===design.material)!;
 useEffect(()=>{let active=true;Promise.resolve().then(()=>{if(!active)return;try{const raw=localStorage.getItem(STORAGE);const restored=raw&&restoreShowcase(JSON.parse(raw));if(restored)setDesign(restored);}catch{/* Storage is optional. */}setHydrated(true);});return()=>{active=false;};},[]);
 useEffect(()=>{if(!hydrated)return;let active=true;Promise.resolve().then(()=>{if(!active)return;try{localStorage.setItem(STORAGE,JSON.stringify(design));setSaved('Saved on this device');}catch{setSaved('Changes are available for this session');}});return()=>{active=false;};},[design,hydrated]);
 useEffect(()=>{let active=true;import('./render').then(async({createShowcase})=>{if(!active||!canvas.current)return;const scene=await createShowcase(canvas.current!);if(!active){scene.dispose();return;}renderer.current=scene;setReady(true);}).catch(()=>{if(active){setError('The scene could not load. Retry when your connection is ready.');setBusy(false);}});return()=>{active=false;renderer.current?.dispose();renderer.current=null;};},[reload]);
 useEffect(()=>{if(!ready||!hydrated)return;let active=true;const timer=setTimeout(()=>{renderer.current?.draw(design).then(applied=>{if(active&&applied)setBusy(false);}).catch(()=>{if(active){setError('This slab image could not load. The previous render is shown. Try another slab or retry.');setBusy(false);}});},60);return()=>{active=false;clearTimeout(timer);};},[design,ready,hydrated]);
 const change=(patch:Partial<ShowcaseDesign>)=>{setBusy(true);setError('');setDesign(d=>({...d,...patch}));};
 async function download(){if(!canvas.current||busy||error)return;const blob=await new Promise<Blob|null>(resolve=>canvas.current!.toBlob(resolve,'image/png'));if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`InfiniteGranite-${selected.code.replace(/\s+/g,'-')}-${design.lighting}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 return <main className={`${shared.studio} ${styles.page}`}>
  <header className={styles.header}><Link href="/projects/infinite-granite/" className={styles.back}><ArrowLeft size={18}/>InfiniteGranite</Link><div className={styles.title}><h1>Slab Studio</h1><span>A closer look at your countertop.</span></div><button className={styles.lightToggle} aria-label={design.lighting==='day'?'Switch to nighttime':'Switch to daytime'} aria-pressed={design.lighting==='night'} title={design.lighting==='day'?'Switch to nighttime':'Switch to daytime'} onClick={()=>change({lighting:design.lighting==='day'?'night':'day'})}>{design.lighting==='day'?<Sun size={20}/>:<Moon size={20}/>}<span>{design.lighting==='day'?'Day':'Night'}</span></button><Link className={styles.plannerLink} href="/projects/infinite-granite/">Open room planner ↗</Link></header>
  <div className={styles.workspace}>
   <section className={styles.preview} aria-label="Fixed kitchen preview">
    <div className={styles.picture} aria-busy={busy}>
     {/* The neutral photographic plate also provides a useful pre-hydration fallback. */}
     {/* eslint-disable-next-line @next/next/no-img-element */}
     <img src={BASE_IMAGE} alt="Daylit kitchen with upper and lower cupboards and a broad foreground countertop" width={1536} height={1024}/>
     <canvas ref={canvas} aria-label={`Fixed kitchen render with ${selected.company} ${selected.code} ${selected.name}, ${design.floor} floor, ${design.lighting==='day'?'daytime':'nighttime'}` } role="img"/>
     {busy&&<span className={styles.renderStatus} role="status">Preparing your finish…</span>}
    </div>
    <div className={styles.caption}><div><span className={styles.eyebrow}>{selected.company} / {selected.code}</span><h2>{selected.name}</h2></div><button onClick={download} disabled={busy||!!error||!ready}><DownloadSimple size={18}/><span>Save image</span></button></div>
    <p className={styles.note}>{design.lighting==='day'?'Daylight · a fixed view for comparing finishes.':'Nighttime · warm interior lighting with a dimmed window.'}</p>
    {error&&<p className={styles.error} role="alert">{error} <button onClick={()=>{setReady(false);setBusy(true);setError('');setReload(n=>n+1);}}>Retry</button></p>}
   </section>
   <aside className={styles.inspector} aria-label="Showcase finishes">
    <nav className={styles.tabs} aria-label="Finish controls"><button aria-pressed={tab==='slabs'} onClick={()=>setTab('slabs')}>Countertops</button><button aria-pressed={tab==='cupboards'} onClick={()=>setTab('cupboards')}>Cupboards</button><button aria-pressed={tab==='floor'} onClick={()=>setTab('floor')}>Floor</button></nav>
    <div className={styles.controls}>
     {tab==='slabs'?<><div className={styles.intro}><h2>Find your surface</h2><p>Search the full collection by name or code.</p></div><details className={styles.placement}><summary>Pattern placement</summary><label>Pattern scale <span>{Math.round(design.scale*100)}%</span><input aria-label="Slab pattern scale" type="range" min={.7} max={1.5} step={.05} value={design.scale} onChange={e=>change({scale:Number(e.target.value)})}/></label><button onClick={()=>change({rotation:design.rotation===0?90:0})}><ArrowClockwise size={16}/>Rotate pattern 90°</button></details><MaterialPicker value={design.material} onChange={material=>change({material})}/></>:tab==='cupboards'?<><div className={styles.intro}><h2>Frame the stone</h2><p>Choose separate colors for the upper and lower cupboards.</p></div><ColorPicker label="Upper cupboards" value={design.upper} onChange={upper=>change({upper})}/><ColorPicker label="Lower cupboards" value={design.lower} onChange={lower=>change({lower})}/><button className={styles.match} onClick={()=>change({upper:design.lower})}>Match upper to lower cupboards</button></>:<>
      <div className={styles.intro}><h2>Ground your palette</h2><p>Choose a floor material, then make the color your own.</p></div>
      <div className={styles.floorGrid} role="group" aria-label="Floor material">{FLOOR_FINISHES.map(f=><button key={f.id} aria-pressed={design.floor===f.id} onClick={()=>change({floor:f.id,floorColor:f.color})}><span className={styles.floorSample} data-finish={f.id}/><strong>{f.name}</strong><small>{f.detail}</small>{design.floor===f.id&&<Check className={styles.floorCheck} size={16}/>}</button>)}</div>
      <div className={styles.floorColors} role="group" aria-label="Floor color">{FLOOR_COLORS.map(c=><button key={c.color} aria-label={`Floor color: ${c.name}`} title={c.name} aria-pressed={design.floorColor===c.color} onClick={()=>change({floorColor:c.color})}><span style={{background:c.color}}/>{c.name}</button>)}</div>
      <label className={styles.customFloor}>Custom floor color<input type="color" aria-label="Custom floor color" value={design.floorColor} onChange={e=>change({floorColor:e.target.value})}/></label>
     </>}
    </div>
    <footer className={styles.foot}><span>{saved}</span><p>Photorealistic scene with simulated finishes. Pattern scale and colors are approximate; confirm with a physical sample.</p></footer>
   </aside>
  </div>
 </main>;
}
