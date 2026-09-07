'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowCounterClockwise, ArrowClockwise, ArrowUUpLeft, ArrowUUpRight, ArrowsOut, Camera, Check, Copy, Cube, FloppyDisk, Minus, Plus, Ruler, SquaresFour, Stack, SlidersHorizontal, Trash, X } from '@phosphor-icons/react';
import { FINISHES, KIND_NAMES, SIZE_LIMITS, MAX_COMPONENTS, layoutName, LAYOUTS, MATERIALS, collisionPairs, colorName, defaultDesign, footprint, inches, makeComponent, parseDesign, presetComponents, type ComponentKind, type KitchenComponent, type KitchenDesign, type LayoutId } from './kitchen';
import MaterialPicker from './MaterialPicker';
import GridBuilder from './GridBuilder';
import FinishControls, { Field, Range, Choices, ColorPicker, type FinishTab } from './FinishControls';
import { materialLabel } from './materials';
import { resolvePlacement, findPlacement, resizeRoom as resizeKitchenRoom } from './placement';
import { editorHistory } from './history';
import type { KitchenScene, ViewMode } from './scene';
import styles from './studio.module.css';

type Tab = 'surfaces' | 'cupboards' | 'sink' | 'layout' | 'components';
interface SavedOption { id: string; name: string; design: KitchenDesign; }
const STORAGE = 'infinitegranite.studio.v1';
function componentId(kind:ComponentKind) { return `${kind}-${crypto.randomUUID()}`; }
const TABS: { id: Tab; label: string }[] = [{ id: 'surfaces', label: 'Counters' }, { id: 'cupboards', label: 'Cupboards' }, { id: 'sink', label: 'Sink' }, { id: 'layout', label: 'Layout' }, { id: 'components', label: 'Arrange' }];

function LayoutGlyph({ layout }: { layout: LayoutId }) {
  return <span className={styles.layoutGlyph} data-layout={layout} aria-hidden="true"><i /><i /><i /><i /></span>;
}

export default function InfiniteGranite() {
  const [state, dispatch] = useReducer(editorHistory, undefined, () => ({design:defaultDesign(),past:[],future:[],time:0}));
  const design = state.design, undoCount = state.past.length, redoCount = state.future.length;
  const [tab, setTab] = useState<Tab>('surfaces');
  const [selected, setSelected] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('perspective');
  const [walls, setWalls] = useState(true), [dimensions, setDimensions] = useState(false);
  const [saved, setSaved] = useState<SavedOption[]>([]), [compareOpen, setCompareOpen] = useState(false);
  const [message, setMessage] = useState(''), [error, setError] = useState(''), [ready, setReady] = useState(false), [hydrated, setHydrated] = useState(false);
  const [reload, setReload] = useState(0);
  const [gridOpen, setGridOpen] = useState(false);
  const [viewerExpanded, setViewerExpanded] = useState(false);
  const [finishesOpen, setFinishesOpen] = useState(true);
  const [fullscreenTab, setFullscreenTab] = useState<FinishTab>('surfaces');
  const finishToggle = useRef<HTMLButtonElement>(null);
  const [textureStatus, setTextureStatus] = useState<string|null>(null);
  const [placementNotice, setPlacementNotice] = useState('');
  const nativeFullscreen = useRef(false);
  const pendingViewReset = useRef(false);
  const fullscreenTrigger = useRef<HTMLButtonElement>(null);
  const [storageStatus, setStorageStatus] = useState('Saving on this device…');
  const stageRef = useRef<HTMLDivElement>(null), hostRef = useRef<HTMLDivElement>(null), sceneRef = useRef<KitchenScene | null>(null);
  const latest = useRef({ design, selected, walls, dimensions });
  const selectedComponent = design.components.find(c => c.id === selected);
  const material = MATERIALS.find(m => m.id === design.countertop)!;
  const overlaps = collisionPairs(design.components);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const raw = localStorage.getItem(STORAGE);
        if (raw) {
          const stored = JSON.parse(raw); const recovered = parseDesign(stored.design);
          if (recovered) dispatch({type:'restore',design:recovered});
          if (Array.isArray(stored.saved)) setSaved(stored.saved.slice(0, 4).flatMap((option: SavedOption) => { const d = parseDesign(option.design); return d && typeof option.name === 'string' && typeof option.id === 'string' ? [{ id: option.id.slice(0,80), name: option.name.slice(0,60), design: d }] : []; }));
        }
      } catch { setMessage('Browser storage is unavailable. You can still design in this session.'); }
      setHydrated(true);
    });
    return () => { active = false; };
  }, []);
  const persist = useCallback((current: KitchenDesign, options: SavedOption[]) => {
    try { localStorage.setItem(STORAGE, JSON.stringify({design:current,saved:options})); setStorageStatus('Changes saved on this device.'); }
    catch { setStorageStatus('Not saved · browser storage unavailable.'); }
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    let active = true;
    Promise.resolve().then(() => { if (active) persist(design, saved); });
    const flush = () => { try { localStorage.setItem(STORAGE, JSON.stringify({design,saved})); } catch { /* Persistent status already explains unavailable storage. */ } };
    window.addEventListener('pagehide', flush);
    return () => { active = false; window.removeEventListener('pagehide',flush); };
  }, [design, saved, hydrated, persist]);
  useEffect(() => { latest.current = { design, selected, walls, dimensions }; sceneRef.current?.update(design, { selected, walls, dimensions }); if(pendingViewReset.current){pendingViewReset.current=false;sceneRef.current?.view('perspective');setViewMode('perspective');} }, [design, selected, walls, dimensions]);
  useEffect(() => {
    let active = true;
    import('./scene').then(({ createKitchenScene }) => {
      if (!active || !hostRef.current) return;
      try {
        const scene = createKitchenScene(hostRef.current, id => { setSelected(id); if (id) setTab('components'); }, setError, setTextureStatus);
        sceneRef.current = scene; const current = latest.current;
        scene.update(current.design, { selected: current.selected, walls: current.walls, dimensions: current.dimensions });
        scene.view('perspective'); setViewMode('perspective'); setReady(true); setError('');
      } catch { setError('This browser could not start the 3D view. Enable hardware acceleration or try a browser with WebGL 2 support. Your design controls are still available.'); }
    }).catch(() => { if (active) setError('The 3D viewer could not load. Check your connection and reload the view.'); });
    return () => { active = false; sceneRef.current?.dispose(); sceneRef.current = null; };
  }, [reload]);
  useEffect(() => { if (compareOpen) document.getElementById('infinitegranite-comparisons')?.scrollIntoView({ behavior: 'instant', block: 'start' }); }, [compareOpen, saved.length]);
  useEffect(() => { if (!message) return; const timer = setTimeout(() => setMessage(''), 5500); return () => clearTimeout(timer); }, [message]);
  const commit = useCallback((next: KitchenDesign | ((current: KitchenDesign) => KitchenDesign), group?: string) => {
    dispatch({type:'change', next, group, time:Date.now()});
  }, []);
  function change<K extends keyof KitchenDesign>(key: K, value: KitchenDesign[K]) { commit(d => ({ ...d, [key]: value })); }
  function matchCupboards() { commit(d=>({...d,upperColor:d.cabinetColor,islandColor:d.cabinetColor})); }
  function arrangeSink() { const sink=design.components.find(c=>c.kind==='sink');if(sink){setSelected(sink.id);setTab('components');}else addComponent('sink'); }
  function toggleFinishes() { if(finishesOpen)finishToggle.current?.focus({preventScroll:true});setFinishesOpen(open=>!open); }
  function editComponent(patch: Partial<KitchenComponent>): KitchenComponent | null {
    if (!selectedComponent) return null;
    const geometric=Object.keys(patch).some(key=>['x','z','width','depth','height','rotation'].includes(key));
    const proposed={...selectedComponent,...patch};
    const result=geometric?resolvePlacement(proposed,design.components,design.roomWidth,design.roomDepth):{component:proposed,accepted:true,snapped:false};
    if(!result.accepted) {setPlacementNotice('That change does not fit without overlap. Move a neighbouring piece or choose a smaller size.');return selectedComponent;}
    setPlacementNotice(result.snapped?'Snapped to the nearest clear edge.':'');
    commit(d=>({...d,components:d.components.map(c=>c.id===selected?result.component:c)}),`component:${selected}:${Object.keys(patch).join()}`);
    return result.component;
  }
  function loadLayout(layout: LayoutId) {
    if(layout==='custom'){setGridOpen(true);return;}
    pendingViewReset.current=true;
    commit(d=>({...d,layout,gridSize:undefined,gridCellSize:undefined,roomWidth:216,roomDepth:192,components:presetComponents(layout)}));
    setGridOpen(false);setSelected(null);setMessage(`${layoutName(layout)} loaded. Your finish selections are retained.`);
  }
  function resizeRoom(key:'roomWidth'|'roomDepth',value:number) {
    const next=resizeKitchenRoom(design,key==='roomWidth'?value:design.roomWidth,key==='roomDepth'?value:design.roomDepth);
    if(next)commit(next,`room:${key}`);else setMessage('That room size would overlap components. Rearrange the pieces before making it smaller.');
  }
  function undo() { dispatch({type:'undo'}); }
  function redo() { dispatch({type:'redo'}); }
  function addComponent(kind:ComponentKind) {
    if(design.components.length>=MAX_COMPONENTS){setMessage(`This kitchen can contain up to ${MAX_COMPONENTS} components.`);return;}
    const part=findPlacement(makeComponent(kind,componentId(kind)),design.components,design.roomWidth,design.roomDepth);
    if(!part){setMessage('There is no clear space for that component. Remove a piece or enlarge the room first.');return;}
    commit(d=>({...d,components:[...d.components,part]}));setSelected(part.id);setTab('components');setPlacementNotice('Placed in the nearest available space.');
  }
  function duplicateComponent() {
    if(!selectedComponent||design.components.length>=MAX_COMPONENTS)return;
    const part=findPlacement({...selectedComponent,id:componentId(selectedComponent.kind),x:selectedComponent.x+footprint(selectedComponent).width},design.components,design.roomWidth,design.roomDepth);
    if(!part){setMessage('There is no clear space for a duplicate. Enlarge the room or remove another piece.');return;}
    commit(d=>({...d,components:[...d.components,part]}));setSelected(part.id);setPlacementNotice('Duplicate placed without overlap.');
  }
  function saveOption() {
    if (saved.length >= 4) { setCompareOpen(true); setMessage('Four options are saved. Remove an option to make room for another.'); return; }
    const name = ['Option A','Option B','Option C','Option D'].find(label=>!saved.some(option=>option.name===label)) ?? `Option ${saved.length + 1}`;
    const next = [...saved, { id: `${Date.now()}`, name, design: structuredClone(design) }];
    setSaved(next); persist(design,next);
    setCompareOpen(true); setMessage(`${name} saved for comparison.`);
  }
  function changeView(mode: ViewMode) { setViewMode(mode); sceneRef.current?.view(mode); }
  function snapshot() {
    if (!sceneRef.current || error) return;
    const link = document.createElement('a'); link.href = sceneRef.current.screenshot(); link.download = 'InfiniteGranite-kitchen.png'; link.click(); setMessage('Kitchen image downloaded.');
  }
  const exitFullscreen = useCallback(() => {
    setViewerExpanded(false);
    if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});
  }, []);
  useEffect(()=>{
    const sync=()=>{if(document.fullscreenElement===stageRef.current){nativeFullscreen.current=true;setViewerExpanded(true);}else if(nativeFullscreen.current){nativeFullscreen.current=false;setViewerExpanded(false);}};
    document.addEventListener('fullscreenchange',sync);
    return()=>document.removeEventListener('fullscreenchange',sync);
  },[]);
  useEffect(()=>{
    if(!viewerExpanded)return;
    const trigger=fullscreenTrigger.current;
    const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
    const stage=stageRef.current;stage?.querySelector<HTMLButtonElement>('[data-fullscreen-close]')?.focus({preventScroll:true});
    const viewport=window.visualViewport;
    const fitViewport=()=>{stage?.style.setProperty('--ig-visible-height',`${viewport?.height??window.innerHeight}px`);stage?.style.setProperty('--ig-viewport-top',`${viewport?.offsetTop??0}px`);};
    fitViewport();viewport?.addEventListener('resize',fitViewport);viewport?.addEventListener('scroll',fitViewport);window.addEventListener('resize',fitViewport);
    const keys=(event:KeyboardEvent)=>{
      if(event.defaultPrevented||event.isComposing)return;
      const editing=event.target instanceof Element&&!!event.target.closest('input,select,textarea,[contenteditable="true"]');
      if(event.key==='Escape'&&!editing){event.preventDefault();exitFullscreen();}
      if(event.key==='Tab'&&stage){
        const items=Array.from(stage.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href],summary,[tabindex]')).filter(el=>el.tabIndex>=0&&!el.matches(':disabled')&&!el.closest('[hidden],[inert]')&&el.getClientRects().length>0);
        const first=items[0],last=items.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    document.addEventListener('keydown',keys);
    return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',keys);viewport?.removeEventListener('resize',fitViewport);viewport?.removeEventListener('scroll',fitViewport);window.removeEventListener('resize',fitViewport);stage?.style.removeProperty('--ig-visible-height');stage?.style.removeProperty('--ig-viewport-top');trigger?.focus({preventScroll:true});};
  },[viewerExpanded,exitFullscreen]);
  async function fullscreen() {
    if(viewerExpanded){exitFullscreen();return;}
    setFullscreenTab(tab==='surfaces'||tab==='cupboards'||tab==='sink'?tab:'surfaces');setFinishesOpen(true);
    setViewerExpanded(true);
    // iPhone browsers without the Fullscreen API still get an edge-to-edge viewport viewer.
    if(stageRef.current?.requestFullscreen)try{await stageRef.current.requestFullscreen();}catch{/* Keep the viewport-filling fallback. */}
  }
  return <main className={styles.studio}>
    <header className={styles.header} inert={viewerExpanded}>
      <div className={styles.brand}><Link href="/#space" aria-label="Back to David’s projects" className={styles.back}><ArrowLeft size={19} /></Link><span className={styles.brandMark}><Cube size={28} weight="light" /></span><div><h1>Infinite<span>Granite</span></h1><p>KITCHEN DESIGN STUDIO</p></div></div>
      <div className={styles.headerActions}><span className={styles.localNote}><span />Your own space, reimagined.</span><button className={styles.saveButton} aria-label="Save option" onClick={saveOption}><FloppyDisk size={17} /><span>Save option</span></button><button className={styles.compareButton} aria-label={`Compare ${saved.length} saved options`} onClick={() => setCompareOpen(!compareOpen)} aria-expanded={compareOpen}><Stack size={18} /><span>Compare</span><small>{saved.length}</small></button></div>
    </header>
    <div className={styles.workspace}>
      <section className={`${styles.stage} ${viewerExpanded?styles.viewerExpanded:''}`} ref={stageRef} data-finishes-open={viewerExpanded&&finishesOpen} aria-label="Kitchen preview" role={viewerExpanded?'dialog':undefined} aria-modal={viewerExpanded?true:undefined}>
        <div className={styles.stageTop}><div><span className={styles.eyebrow}>YOUR KITCHEN / LIVE PREVIEW</span><h2>{layoutName(design.layout)}<span>{inches(design.roomWidth)} × {inches(design.roomDepth)}</span></h2></div><div className={styles.history}>{viewerExpanded&&<button ref={finishToggle} className={styles.finishToggle} aria-label={finishesOpen?'Hide finish controls':'Show finish controls'} aria-expanded={finishesOpen} aria-controls="fullscreen-finish-controls" title="Kitchen finishes" onClick={toggleFinishes}><SlidersHorizontal size={19}/><span>Finishes</span></button>}{viewerExpanded&&<button className={styles.closeFullscreen} data-fullscreen-close aria-label="Exit full screen" onClick={exitFullscreen}><X size={18}/>Exit</button>}<button aria-label="Undo last change" disabled={!undoCount} onClick={undo}><ArrowUUpLeft size={19} /></button><button aria-label="Redo change" disabled={!redoCount} onClick={redo}><ArrowUUpRight size={19} /></button></div></div>
        <div className={styles.canvasHost} ref={hostRef} />
        {!ready && !error && <div className={styles.loading}><Cube size={42} weight="thin" /><strong>Setting up your kitchen</strong><span>Preparing materials and lighting…</span></div>}
        {error && <div className={styles.error}><Cube size={34} /><p>{error}</p><button onClick={() => { setReady(false); setError(''); setReload(v => v + 1); }}>Reload 3D view</button></div>}
        <div className={styles.sceneControls}>
          <div className={styles.viewButtons} role="group" aria-label="Camera view"><button aria-pressed={viewMode === 'perspective'} onClick={() => changeView('perspective')}><Cube size={17} />3D</button><button aria-pressed={viewMode === 'top'} onClick={() => changeView('top')}><SquaresFour size={17} />Plan</button><button aria-pressed={viewMode === 'front'} onClick={() => changeView('front')}>Front</button></div>
          <div className={styles.tools}><button aria-label="Rotate view left" onClick={() => sceneRef.current?.orbit(-Math.PI/8)}><ArrowCounterClockwise size={18}/></button><button aria-label="Rotate view right" onClick={() => sceneRef.current?.orbit(Math.PI/8)}><ArrowClockwise size={18}/></button><span/><button aria-label="Zoom out" onClick={() => sceneRef.current?.zoom(1.15)}><Minus size={18}/></button><button aria-label="Zoom in" onClick={() => sceneRef.current?.zoom(.87)}><Plus size={18}/></button><span/><button aria-label="Show room dimensions" aria-pressed={dimensions} onClick={() => setDimensions(!dimensions)}><Ruler size={19}/></button><button aria-label="Download kitchen image" disabled={!ready || !!error} onClick={snapshot}><Camera size={19}/></button><button ref={fullscreenTrigger} aria-label={viewerExpanded?'Return to editor':'Full screen kitchen'} aria-pressed={viewerExpanded} onClick={fullscreen}><ArrowsOut size={19}/></button></div>
        </div>
        {viewerExpanded&&<aside id="fullscreen-finish-controls" className={styles.fullscreenFinishes} aria-label="Full screen finish controls" hidden={!finishesOpen} inert={!finishesOpen}>
          <header className={styles.finishPanelHeading}><h3>Kitchen finishes</h3><button aria-label="Close finish panel" onClick={toggleFinishes}><X size={18}/></button></header>
          <nav className={styles.finishTabs} aria-label="Full screen finish categories">{TABS.filter(t=>t.id==='surfaces'||t.id==='cupboards'||t.id==='sink').map(t=><button key={t.id} aria-pressed={fullscreenTab===t.id} onClick={()=>setFullscreenTab(t.id as FinishTab)}>{t.label}</button>)}</nav>
          <div className={styles.finishPanelBody} key={fullscreenTab}><FinishControls tab={fullscreenTab} design={design} onChange={change} onMatchCupboards={matchCupboards}/></div>
          <p className={styles.finishPanelStatus}>{storageStatus}</p>
        </aside>}
        {textureStatus&&<div className={styles.textureStatus} role="status">{textureStatus}</div>}
        <div className={styles.stageBottom}><p>Drag to orbit <span>·</span> Pinch or scroll to zoom <span>·</span> Tap a component to edit</p><label><input type="checkbox" checked={walls} onChange={e => setWalls(e.target.checked)} />Show room</label></div>
        {overlaps.length > 0 && <div className={styles.collisionNote} role="status">{overlaps.length} overlapping {overlaps.length === 1 ? 'pair' : 'pairs'} · Adjust placement in Arrange.</div>}
      </section>
      <aside className={styles.editor} inert={viewerExpanded} aria-label="Kitchen customization">
        <div className={styles.editorIntro}><span className={styles.eyebrow}>MAKE IT YOURS</span><h2>A change of surface.<br />A whole new feeling.</h2></div>
        <nav className={styles.tabs} aria-label="Customization categories">{TABS.map(t => <button key={t.id} aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>)}</nav>
        <div className={styles.panel}>
          {(tab==='surfaces'||tab==='cupboards'||tab==='sink')&&<FinishControls tab={tab} design={design} onChange={change} onMatchCupboards={matchCupboards} onArrangeSink={arrangeSink}/>}
          {tab === 'layout' && (gridOpen?<GridBuilder design={design} onCancel={()=>setGridOpen(false)} onBuild={next=>{pendingViewReset.current=true;commit(next);setGridOpen(false);setSelected(null);setTab('components');setPlacementNotice('Custom kitchen created. Select any piece to resize or move it.');}}/>:<>
            <div className={styles.panelHeading}><h3>A space that fits</h3></div><p className={styles.panelDescription}>Start with a familiar plan, or create your own square-by-square layout. Finishes stay yours.</p>
            <button className={styles.customLayoutButton} onClick={()=>setGridOpen(true)}><SquaresFour size={24}/><span><strong>Create a custom kitchen</strong><small>Start with a blank n × n grid</small></span><Plus size={18}/></button>
            <div className={styles.layoutGrid}>{LAYOUTS.map(l=><button key={l.id} aria-pressed={design.layout===l.id} onClick={()=>loadLayout(l.id)}><LayoutGlyph layout={l.id}/><strong>{l.name}</strong><small>{l.detail}</small></button>)}</div>
            <Field label="Room dimensions" note="Room resizing is blocked when it would cause overlaps."><Range label="Width" value={design.roomWidth} min={144} max={360} step={6} onChange={v=>resizeRoom('roomWidth',v)}/><Range label="Depth" value={design.roomDepth} min={144} max={360} step={6} onChange={v=>resizeRoom('roomDepth',v)}/></Field>
            <Field label="Floor"><Choices label="Floor" value={design.floor} items={[{id:'oak',name:'Light oak'},{id:'walnut',name:'Walnut'},{id:'tile',name:'Stone tile'}]} onChange={v=>change('floor',v)}/></Field>
            <ColorPicker label="Walls" value={design.wallColor} onChange={v=>change('wallColor',v)}/>
          </>)}
          {tab === 'components' && <>
            <div className={styles.panelHeading}><h3>Make room for your ideas</h3><span>{design.components.length} pieces</span></div><p className={styles.panelDescription}>Select a piece in the scene or below. Position is measured from the centre of the room. Nearby edges snap together; overlaps are prevented.</p>
            <p className={styles.snappingNote}><Check size={14}/>Edge snapping & overlap protection on</p>
            {placementNotice&&<p className={styles.placementNotice} role="status">{placementNotice}</p>}
            <label className={styles.selectLabel}>Selected component<select value={selected??''} onChange={e=>setSelected(e.target.value||null)}><option value="">Choose a component</option>{design.components.map((c,i)=><option key={c.id} value={c.id}>{String(i+1).padStart(2,'0')} · {c.name}</option>)}</select></label>
            {selectedComponent ? <div className={styles.componentEditor}>
              <div className={styles.componentTitle}><strong>{selectedComponent.name}</strong><button aria-label="Deselect component" onClick={()=>setSelected(null)}><X size={17}/></button></div>
              <div className={styles.planMap}>
                <svg viewBox={`0 0 ${design.roomWidth} ${design.roomDepth}`} aria-label="Kitchen floor plan" role="img"><rect width={design.roomWidth} height={design.roomDepth} fill="none" stroke="currentColor" strokeWidth="1"/>{design.components.filter(c=>c.kind!=='upper').map(c=>{const f=footprint(c);return <rect key={c.id} x={c.x+design.roomWidth/2-f.width/2} y={c.z+design.roomDepth/2-f.depth/2} width={f.width} height={f.depth} fill={c.id===selected?'#38876b':'#aebcb4'} stroke="var(--ig-surface)" strokeWidth="2"/>;})}<line x1={design.roomWidth/2} x2={design.roomWidth/2} y1="0" y2={design.roomDepth} stroke="currentColor" opacity=".2" strokeDasharray="3 3"/></svg><small>BACK WALL ↑</small>
              </div>
              <Range label="Left / right" value={selectedComponent.x} min={(-design.roomWidth+footprint(selectedComponent).width)/2} max={(design.roomWidth-footprint(selectedComponent).width)/2} onChange={v=>editComponent({x:v})}/>
              <Range label="Back / front" value={selectedComponent.z} min={(-design.roomDepth+footprint(selectedComponent).depth)/2} max={(design.roomDepth-footprint(selectedComponent).depth)/2} onChange={v=>editComponent({z:v})}/>
              <div className={styles.numberGrid}>{(['width','depth','height'] as const).map(key=><label key={key}>{key[0].toUpperCase()+key.slice(1)}<span><input type="number" aria-label={`Component ${key} in inches`} key={`${selectedComponent.id}-${key}-${selectedComponent[key]}`} min={SIZE_LIMITS[selectedComponent.kind][key][0]} max={SIZE_LIMITS[selectedComponent.kind][key][1]} step="1" defaultValue={selectedComponent[key]} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}} onBlur={e=>{const limits=SIZE_LIMITS[selectedComponent.kind][key];const next=Number.isFinite(e.target.valueAsNumber)?Math.max(limits[0],Math.min(limits[1],e.target.valueAsNumber)):selectedComponent[key];e.target.value=String(next);if(next!==selectedComponent[key]){const placed=editComponent({[key]:next});e.target.value=String(placed?.[key]??selectedComponent[key]);}}}/>″</span></label>)}</div>
              <Field label="Facing"><Choices label="Component rotation" value={String(selectedComponent.rotation)} items={[{id:'0',name:'Front'},{id:'90',name:'Right'},{id:'180',name:'Back'},{id:'270',name:'Left'}]} onChange={v=>editComponent({rotation:Number(v)})}/></Field>
              {!['fridge','range','dishwasher'].includes(selectedComponent.kind)&&<ColorPicker label="This piece only" value={selectedComponent.color??(selectedComponent.kind==='upper'?design.upperColor:selectedComponent.kind==='island'?design.islandColor:design.cabinetColor)} onChange={v=>editComponent({color:v})}/>}
              {!['upper','pantry','fridge','range'].includes(selectedComponent.kind)&&<details className={styles.pieceMaterial}><summary>This countertop: {MATERIALS.find(m=>m.id===(selectedComponent.material??design.countertop))?.code}</summary><button className={styles.textButton} onClick={()=>editComponent({material:undefined})}>Use kitchen-wide finish</button><MaterialPicker value={selectedComponent.material??design.countertop} onChange={id=>editComponent({material:id})} label="This countertop"/></details>}
              {(selectedComponent.color||selectedComponent.material)&&<button className={styles.textButton} onClick={()=>editComponent({color:undefined,material:undefined})}>Reset this piece to kitchen finishes</button>}
              <div className={styles.componentActions}><button onClick={duplicateComponent} disabled={design.components.length>=MAX_COMPONENTS}><Copy size={16}/>Duplicate</button><button onClick={()=>{commit(d=>({...d,components:d.components.filter(c=>c.id!==selected)}));setSelected(null);}}><Trash size={16}/>Remove</button></div>
              {overlaps.some(pair=>pair.includes(selectedComponent.id))&&<p className={styles.inlineWarning}>This piece overlaps another component. Move it using the position controls above.</p>}
            </div> : <div className={styles.emptySelection}><Cube size={32} weight="thin"/><p>Tap a cupboard, counter, or appliance to start arranging.</p></div>}
            <Field label="Add a component"><div className={styles.addGrid}>{(Object.keys(KIND_NAMES) as ComponentKind[]).map(kind=><button key={kind} onClick={()=>addComponent(kind)}><Plus size={14}/>{KIND_NAMES[kind]}</button>)}</div></Field>
          </>}
          <p className={styles.editorFootnote}>An approximate design preview. Confirm dimensions and material samples before renovating.</p>
        </div>
      </aside>
    </div>
    <footer className={styles.designStrip} inert={viewerExpanded}><div><span className={styles.miniStone} data-material={material.id} style={{backgroundColor:material.color,backgroundImage:material.thumbnailUrl?`url(${material.thumbnailUrl})`:undefined,backgroundSize:'cover'}}/><span><small>COUNTERTOP</small><strong>{material.company==='Studio collection'?material.name:material.code}</strong></span></div><div><i style={{background:design.cabinetColor}}/><span><small>CUPBOARDS</small><strong>{colorName(design.cabinetColor)}</strong></span></div><div><i style={{background:FINISHES.find(f=>f.id===design.sinkFinish)!.color}}/><span><small>SINK</small><strong>{design.sinkStyle==='apron'?'Apron front':design.sinkStyle==='double'?'Double bowl':'Single bowl'}</strong></span></div><p>Designed by you.<span>{storageStatus}</span></p></footer>
    {compareOpen&&<section id="infinitegranite-comparisons" className={styles.comparePanel} inert={viewerExpanded} aria-label="Saved design comparisons"><header><div><span className={styles.eyebrow}>SAVE. SWITCH. COMPARE.</span><h2>Your shortlist</h2><p>Switch between saved designs. The camera stays in place.</p></div><button aria-label="Close comparisons" onClick={()=>setCompareOpen(false)}><X size={21}/></button></header>{saved.length===0?<div className={styles.compareEmpty}><Stack size={32}/><p>Find a combination you like, then save it as an option.</p><button onClick={saveOption}>Save current design</button></div>:<div className={styles.savedGrid}>{saved.map(option=>{const m=MATERIALS.find(m=>m.id===option.design.countertop)!;return <article key={option.id}><div className={styles.optionPalette}><span style={{backgroundColor:m.color,backgroundImage:m.thumbnailUrl?`url(${m.thumbnailUrl})`:undefined,backgroundSize:'cover'}}/><span style={{background:option.design.cabinetColor}}/><span style={{background:option.design.islandColor}}/></div><div className={styles.optionTitle}><input aria-label={`Rename ${option.name}`} value={option.name} maxLength={40} onChange={e=>setSaved(items=>items.map(o=>o.id===option.id?{...o,name:e.target.value}:o))}/><button aria-label={`Remove ${option.name}`} onClick={()=>setSaved(items=>items.filter(o=>o.id!==option.id))}><Trash size={17}/></button></div><p>{materialLabel(m)} · {colorName(option.design.cabinetColor)}</p><small>{layoutName(option.design.layout)} · {option.design.sinkStyle} sink</small><button className={styles.applyOption} onClick={()=>{commit(structuredClone(option.design));setSelected(null);setMessage(`${option.name} applied.`);stageRef.current?.scrollIntoView({behavior:'instant',block:'start'});}}>View this option <ArrowClockwise size={16}/></button></article>;})}</div>}</section>}
    <div className={styles.toast} role="status" aria-live="polite" data-visible={!!message}>{message}</div>
  </main>;
}
