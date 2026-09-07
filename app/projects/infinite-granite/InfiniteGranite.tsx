'use client';

import { useCallback, useEffect, useReducer, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowClockwise, ArrowUUpLeft, ArrowUUpRight, ArrowsOut, Camera, Cube, FloppyDisk, Minus, Plus, SquaresFour, Stack, SlidersHorizontal, Trash, X } from '@phosphor-icons/react';
import { FINISHES, KIND_NAMES, MAX_COMPONENTS, layoutName, LAYOUTS, MATERIALS, collisionPairs, colorName, defaultDesign, inches, parseDesign, presetComponents, type ComponentKind, type KitchenComponent, type KitchenDesign, type LayoutId } from './kitchen';
import DirectEditor, { RoomControls } from './DirectEditor';
import { moveBoundary } from './connectedEdit';
import { addCell, availableCells, editCell, ensureCells, moveCell, replaceCell, type Cell } from './cellLayout';
import type { WallSide } from './room';
import GridBuilder from './GridBuilder';
import FinishControls, { Field, Range, Choices, ColorPicker, type FinishTab } from './FinishControls';
import { materialLabel } from './materials';
import { resizeRoom as resizeKitchenRoom } from './placement';
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
  const [state, dispatch] = useReducer(editorHistory, undefined, () => ({design:ensureCells(defaultDesign())??defaultDesign(),past:[],future:[],time:0}));
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
  const [fullscreenTab, setFullscreenTab] = useState<FinishTab|'edit'|'room'|'view'|'layout'>('surfaces');
  const [inspectorMode,setInspectorMode]=useState<'edit'|'view'>('edit');
  const [inspectorOpen,setInspectorOpen]=useState(false);
  const [visibility,setVisibility]=useState({hidden:[] as string[],hideUppers:false,hideAppliances:false,hideBacksplash:false,hideWindows:false});
  const finishToggle = useRef<HTMLButtonElement>(null);
  const [textureStatus, setTextureStatus] = useState<string|null>(null);
  const [placementNotice, setPlacementNotice] = useState('');
  const [addingKind,setAddingKind]=useState<ComponentKind|null>(null);
  const placementCells=useMemo(()=>addingKind?availableCells(design,addingKind):undefined,[design,addingKind]);
  const nativeFullscreen = useRef(false);
  const pendingViewReset = useRef(false);
  const fullscreenTrigger = useRef<HTMLButtonElement>(null);
  const [storageStatus, setStorageStatus] = useState('Saving on this device…');
  const stageRef = useRef<HTMLDivElement>(null), hostRef = useRef<HTMLDivElement>(null), sceneRef = useRef<KitchenScene | null>(null);
  const latest = useRef({ design, selected, walls, dimensions, ...visibility, addingKind, placementCells });
  const selectedComponent = design.components.find(c => c.id === selected);
  const material = MATERIALS.find(m => m.id === design.countertop)!;
  const overlaps = collisionPairs(design.components);
  function revealEditor(){requestAnimationFrame(()=>{if(stageRef.current?.getAttribute('role')!=='dialog'&&window.matchMedia('(max-width:900px)').matches)document.querySelector<HTMLElement>('[aria-label="Kitchen customization"]')?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});});}

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const raw = localStorage.getItem(STORAGE);
        if (raw) {
          const stored = JSON.parse(raw); const recovered = parseDesign(stored.design);
          if (recovered) dispatch({type:'restore',design:ensureCells(recovered)??recovered});
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
  useEffect(() => { latest.current = { design, selected, walls, dimensions, ...visibility, addingKind, placementCells }; sceneRef.current?.update(design, { selected, walls, dimensions, ...visibility, placementCells }); if(pendingViewReset.current){pendingViewReset.current=false;sceneRef.current?.view('perspective');setViewMode('perspective');} }, [design, selected, walls, dimensions, visibility, addingKind, placementCells]);
  useEffect(() => {
    let active = true;
    import('./scene').then(({ createKitchenScene }) => {
      if (!active || !hostRef.current) return;
      try {
        const scene = createKitchenScene(hostRef.current, id => { setSelected(id); if(id){setInspectorMode('edit');setInspectorOpen(true);setFullscreenTab('edit');setFinishesOpen(true);revealEditor();} }, setError, setTextureStatus, cell=>{
          const current=latest.current;if(!current.addingKind)return;
          const id=componentId(current.addingKind),next=addCell(current.design,current.addingKind,id,cell);
          if(!next){setPlacementNotice('This cell is occupied or too small for the room limit.');return;}
          dispatch({type:'change',next,time:Date.now()});setAddingKind(null);setSelected(id);setInspectorMode('edit');setInspectorOpen(true);setFullscreenTab('edit');setFinishesOpen(true);setPlacementNotice('');revealEditor();
        });
        sceneRef.current = scene; const current = latest.current;
        scene.update(current.design, { selected: current.selected, walls: current.walls, dimensions: current.dimensions, hidden:current.hidden,hideUppers:current.hideUppers,hideAppliances:current.hideAppliances,hideBacksplash:current.hideBacksplash,hideWindows:current.hideWindows,placementCells:current.placementCells });
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
  function arrangeSink() { const sink=design.components.find(c=>c.kind==='sink');if(sink){selectElement(sink.id);setTab('components');}else addComponent('sink'); }
  function toggleFinishes() { if(finishesOpen)finishToggle.current?.focus({preventScroll:true});setFinishesOpen(open=>!open); }
  function editComponent(patch: Partial<KitchenComponent>): KitchenComponent | null {
    if (!selectedComponent) return null;
    const next=editCell(design,selectedComponent.id,patch);
    if(!next){setPlacementNotice('This edit is blocked by another piece or the 60 ft room limit. Try a different direction or size.');return selectedComponent;}
    setPlacementNotice('');
    commit(next,`component:${selected}:${Object.keys(patch).join()}`);
    return next.components.find(c=>c.id===selected)??null;
  }
  function selectElement(id:string|null){setAddingKind(null);setSelected(id);setInspectorMode('edit');setInspectorOpen(!!id);setPlacementNotice('');if(id){setFullscreenTab('edit');setFinishesOpen(true);revealEditor();}}
  function shiftElement(x:number,y:number){
    if(!selectedComponent)return;
    const delta=sceneRef.current?.shiftVector(x,y)??{x,z:-y};
    const next=moveCell(design,selectedComponent.id,Math.sign(delta.z),Math.sign(delta.x));
    if(next){commit(next);setPlacementNotice('');}
    else setPlacementNotice('That cell is outside the grid or blocked by a tall piece or wall cupboard.');
  }
  function replaceSelected(kind:ComponentKind){
    if(!selectedComponent)return;
    const next=replaceCell(design,selectedComponent.id,kind);
    if(next){commit(next);setPlacementNotice('');}
    else setPlacementNotice('This replacement needs more space. Move any wall cupboard or appliance occupying its height, then try again.');
  }

  function hideElement(id:string){setVisibility(v=>({...v,hidden:[...new Set([...v.hidden,id])]}));setInspectorOpen(false);setSelected(null);}
  function boundary(side:WallSide,delta:number){const next=moveBoundary(design,side,delta);if(next){commit(next);setPlacementNotice('Boundary moved.');}else setPlacementNotice('That boundary would overlap or exclude a component. Move the piece first.');}
  function loadLayout(layout: LayoutId) {
    if(layout==='custom'){setGridOpen(true);return;}
    pendingViewReset.current=true;
    commit(d=>ensureCells({...d,layout,gridSize:undefined,gridCellSize:undefined,gridColumns:undefined,gridRows:undefined,roomWidth:216,roomDepth:192,components:presetComponents(layout)})??d);setAddingKind(null);
    setGridOpen(false);setSelected(null);setMessage(`${layoutName(layout)} loaded. Your finish selections are retained.`);
  }
  function resizeRoom(key:'roomWidth'|'roomDepth',value:number) {
    const next=resizeKitchenRoom(design,key==='roomWidth'?value:design.roomWidth,key==='roomDepth'?value:design.roomDepth);
    if(next)commit(next,`room:${key}`);else setMessage('That room size would overlap components. Rearrange the pieces before making it smaller.');
  }
  function undo() { setAddingKind(null);dispatch({type:'undo'}); }
  function redo() { setAddingKind(null);dispatch({type:'redo'}); }
  function addComponent(kind:ComponentKind) {
    if(design.components.length>=MAX_COMPONENTS){setMessage(`This kitchen can contain up to ${MAX_COMPONENTS} components.`);return;}
    const grid=ensureCells(design);
    if(!grid){setPlacementNotice('This saved layout cannot fit in a grid. Choose a layout to start again.');return;}
    commit(grid);setSelected(null);setAddingKind(kind);setTab('components');setInspectorOpen(true);setInspectorMode('edit');setFullscreenTab('edit');setFinishesOpen(true);setPlacementNotice('');
    changeView('top');
  }
  function placeInCell(cell:Cell){
    if(!addingKind)return;
    const id=componentId(addingKind),next=addCell(design,addingKind,id,cell);
    if(next){commit(next);selectElement(id);}
    else setPlacementNotice('This cell is no longer available.');
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
    setFullscreenTab(inspectorOpen?(inspectorMode==='view'?'view':'edit'):tab==='components'?'edit':tab);setFinishesOpen(true);
    setViewerExpanded(true);
    // iPhone browsers without the Fullscreen API still get an edge-to-edge viewport viewer.
    if(stageRef.current?.requestFullscreen)try{await stageRef.current.requestFullscreen();}catch{/* Keep the viewport-filling fallback. */}
  }
  const directEditor=addingKind?<div className={styles.directBody}><div className={styles.pieceHeading}><h3>Add a component</h3><p>Click a green cell in the kitchen to place it.</p></div><label className={styles.selectLabel}>Component<select aria-label="Component to add" value={addingKind} onChange={e=>setAddingKind(e.target.value as ComponentKind)}>{Object.entries(KIND_NAMES).map(([kind,name])=><option key={kind} value={kind}>{name}</option>)}</select></label><button onClick={()=>setAddingKind(null)}>Cancel placement</button>{!placementCells?.length&&<p role="status">No available cells. Delete a piece or choose another component.</p>}<details className={styles.simpleDetails}><summary>Choose a cell from a list</summary><div className={styles.cellList}>{placementCells?.map(cell=><button key={`${cell.row}:${cell.column}`} onClick={()=>placeInCell(cell)}>Row {cell.row+1}, column {cell.column+1}</button>)}</div></details>{placementNotice&&<p role="status">{placementNotice}</p>}</div>:<DirectEditor design={design} selected={selected} onSelect={selectElement} onChange={d=>commit(d)} onEdit={editComponent} onReplace={replaceSelected} onShift={shiftElement} onHide={hideElement} onBoundary={boundary} notice={placementNotice}/>;
  const roomEditor=<><RoomControls design={design} onChange={d=>commit(d)} onSelect={selectElement} onBoundary={boundary}/>{placementNotice&&<p className={styles.placementNotice} role="status">{placementNotice}</p>}</>;
  const layoutEditor=(gridOpen?<GridBuilder design={design} onCancel={()=>setGridOpen(false)} onBuild={next=>{pendingViewReset.current=true;setAddingKind(null);commit(next);setGridOpen(false);setSelected(null);navigatePanel('edit');setPlacementNotice('Custom kitchen created. Select any piece to resize or move it.');}}/>:<>
            <div className={styles.panelHeading}><h3>Choose your layout</h3></div><p className={styles.panelDescription}>Pick the closest match to your kitchen. You can adjust every piece later.</p>

            <div className={styles.layoutGrid}>{LAYOUTS.map(l=><button key={l.id} aria-pressed={design.layout===l.id} onClick={()=>loadLayout(l.id)}><LayoutGlyph layout={l.id}/><strong>{l.name}</strong><small>{l.detail}</small></button>)}</div>
            <button className={styles.customLayoutButton} onClick={()=>setGridOpen(true)}><SquaresFour size={24}/><span><strong>Create a custom kitchen</strong><small>Build your own floor plan</small></span><Plus size={18}/></button>
            <details className={styles.simpleDetails}><summary>Room size & floor</summary>{!design.gridColumns&&<Field label="Room dimensions" note="Room resizing is blocked when it would cause overlaps."><Range label="Width" value={design.roomWidth} min={144} max={720} step={6} onChange={v=>resizeRoom('roomWidth',v)}/><Range label="Depth" value={design.roomDepth} min={144} max={720} step={6} onChange={v=>resizeRoom('roomDepth',v)}/></Field>}
            <Field label="Floor"><Choices label="Floor" value={design.floor} items={[{id:'oak',name:'Light oak'},{id:'walnut',name:'Walnut'},{id:'tile',name:'Stone tile'}]} onChange={v=>change('floor',v)}/></Field>
            </details><details className={styles.simpleDetails}><summary>Walls, windows & doors</summary>{roomEditor}<ColorPicker label="Walls" value={design.wallColor} onChange={v=>change('wallColor',v)}/></details>
          </>);
  const visibilityEditor=<div className={styles.directBody}><h3>Show / hide</h3><label className={styles.flowToggle}><input type="checkbox" checked={walls} onChange={e=>setWalls(e.target.checked)}/>Walls</label>{([{key:'hideUppers',name:'Wall cupboards'},{key:'hideAppliances',name:'Appliances'},{key:'hideBacksplash',name:'Backsplash'},{key:'hideWindows',name:'Windows & doors'}] as const).map(({key,name})=><label className={styles.flowToggle} key={key}><input type="checkbox" checked={!visibility[key]} onChange={e=>setVisibility(v=>({...v,[key]:!e.target.checked}))}/>{name}</label>)}<button className={styles.showAll} onClick={()=>{setWalls(true);setVisibility({hidden:[],hideUppers:false,hideAppliances:false,hideBacksplash:false,hideWindows:false});}}>Show all{visibility.hidden.length?` (${visibility.hidden.length} hidden)`:''}</button></div>;
  const activePanel=viewerExpanded?fullscreenTab:inspectorOpen?(inspectorMode==='view'?'view':'edit'):tab==='components'?'edit':tab;
  const finishPanel=activePanel==='surfaces'||activePanel==='cupboards'||activePanel==='sink';
  function navigatePanel(next:typeof fullscreenTab){
    if(next!=='edit')setAddingKind(null);
    setFullscreenTab(next);setFinishesOpen(true);
    if(next==='view'){setInspectorMode('view');setInspectorOpen(true);}
    else if(next==='edit'){setInspectorMode('edit');setInspectorOpen(true);}
    else {setInspectorOpen(false);setTab(next==='room'?'layout':next);}
  }
  const panelNavigation=<div className={styles.simpleNavigation}>
    <nav className={styles.taskTabs} aria-label="Design tasks">{[{id:'surfaces',label:'Finishes'},{id:'layout',label:'Layout'},{id:'edit',label:'Pieces'}].map(item=><button key={item.id} aria-pressed={item.id==='surfaces'?finishPanel:item.id==='layout'?activePanel==='layout'||activePanel==='room':activePanel==='edit'} onClick={()=>navigatePanel(item.id as typeof fullscreenTab)}>{item.label}</button>)}</nav>
    {finishPanel&&<nav className={styles.finishSubtabs} aria-label="Choose a finish">{TABS.filter(t=>t.id==='surfaces'||t.id==='cupboards'||t.id==='sink').map(t=><button key={t.id} aria-pressed={activePanel===t.id} onClick={()=>navigatePanel(t.id as FinishTab)}>{t.id==='surfaces'?'Countertops':t.label}</button>)}</nav>}
  </div>;
  const panelContent=finishPanel?<FinishControls tab={activePanel} design={design} onChange={change} onMatchCupboards={matchCupboards} onArrangeSink={arrangeSink}/>:activePanel==='edit'?directEditor:activePanel==='view'?<><button className={styles.backToFinishes} onClick={()=>navigatePanel('surfaces')}>← Back to finishes</button>{visibilityEditor}<details className={styles.directDetails}><summary>Camera & image</summary><div className={styles.directActions}><button onClick={()=>sceneRef.current?.orbit(-Math.PI/8)}>Rotate view left</button><button onClick={()=>sceneRef.current?.orbit(Math.PI/8)}>Rotate view right</button><button aria-pressed={dimensions} onClick={()=>setDimensions(!dimensions)}>Room dimensions</button><button disabled={!ready||!!error} onClick={snapshot}><Camera size={16}/>Save image</button></div></details></>:activePanel==='room'?roomEditor:layoutEditor;
  return <main className={styles.studio}>
    <header className={styles.header} inert={viewerExpanded}>
      <div className={styles.brand}><Link href="/#space" aria-label="Back to David’s projects" className={styles.back}><ArrowLeft size={19} /></Link><span className={styles.brandMark}><Cube size={28} weight="light" /></span><div><h1>Infinite<span>Granite</span></h1><p>KITCHEN DESIGN STUDIO</p></div></div>
      <div className={styles.headerActions}><span className={styles.localNote}>{storageStatus}</span><button className={styles.saveButton} aria-label="Save option" onClick={saveOption}><FloppyDisk size={17} /><span>Save look</span></button><button className={styles.compareButton} aria-label={`Compare ${saved.length} saved options`} onClick={() => setCompareOpen(!compareOpen)} aria-expanded={compareOpen}><Stack size={18} /><span>Compare</span><small>{saved.length}</small></button></div>
    </header>
    <div className={styles.workspace}>
      <section className={`${styles.stage} ${viewerExpanded?styles.viewerExpanded:''}`} ref={stageRef} data-finishes-open={viewerExpanded&&finishesOpen} data-inspector-open={false} aria-label="Kitchen preview" role={viewerExpanded?'dialog':undefined} aria-modal={viewerExpanded?true:undefined}>
        <div className={styles.stageTop}><div><span className={styles.eyebrow}>YOUR KITCHEN / LIVE PREVIEW</span><h2>{layoutName(design.layout)}<span>{inches(design.roomWidth)} × {inches(design.roomDepth)}</span></h2></div><div className={styles.history}><button className={styles.addCellButton} disabled={!!addingKind||design.components.length>=MAX_COMPONENTS} onClick={()=>addComponent('base')}><Plus size={18}/><span>Add Component</span></button>{viewerExpanded&&<button ref={finishToggle} className={styles.finishToggle} aria-label={finishesOpen?'Hide finish controls':'Show finish controls'} aria-expanded={finishesOpen} aria-controls="fullscreen-finish-controls" title="Kitchen finishes" onClick={toggleFinishes}><SlidersHorizontal size={19}/><span>Controls</span></button>}{viewerExpanded&&<button className={styles.closeFullscreen} data-fullscreen-close aria-label="Exit full screen" onClick={exitFullscreen}><X size={18}/>Exit</button>}<button aria-label="Undo last change" disabled={!undoCount} onClick={undo}><ArrowUUpLeft size={19} /></button><button aria-label="Redo change" disabled={!redoCount} onClick={redo}><ArrowUUpRight size={19} /></button></div></div>
        <div className={styles.canvasHost} ref={hostRef} />
        {!ready && !error && <div className={styles.loading}><Cube size={42} weight="thin" /><strong>Setting up your kitchen</strong><span>Preparing materials and lighting…</span></div>}
        {error && <div className={styles.error}><Cube size={34} /><p>{error}</p><button onClick={() => { setReady(false); setError(''); setReload(v => v + 1); }}>Reload 3D view</button></div>}
        <div className={styles.sceneControls}>
          <div className={styles.viewButtons} role="group" aria-label="Camera view"><button aria-pressed={viewMode === 'perspective'} onClick={() => changeView('perspective')}><Cube size={17} />3D</button><button aria-pressed={viewMode === 'top'} onClick={() => changeView('top')}><SquaresFour size={17} />Top</button><button aria-pressed={viewMode === 'front'} onClick={() => changeView('front')}>Front</button></div>
          <div className={styles.tools}><button aria-label="Zoom out" onClick={() => sceneRef.current?.zoom(1.15)}><Minus size={18}/></button><button aria-label="Zoom in" onClick={() => sceneRef.current?.zoom(.87)}><Plus size={18}/></button><button ref={fullscreenTrigger} aria-label={viewerExpanded?'Return to editor':'Full screen kitchen'} aria-pressed={viewerExpanded} onClick={fullscreen}><ArrowsOut size={19}/></button></div>
        </div>
        {viewerExpanded&&<aside id="fullscreen-finish-controls" className={styles.fullscreenFinishes} aria-label="Full screen finish controls" hidden={!finishesOpen} inert={!finishesOpen}>
          <header className={styles.finishPanelHeading}><h3>Your kitchen</h3><button aria-label="Close finish panel" onClick={toggleFinishes}><X size={18}/></button></header>
          {panelNavigation}
          <div className={styles.finishPanelBody} key={activePanel}>{panelContent}</div>
          <p className={styles.finishPanelStatus}>{storageStatus}</p>
        </aside>}
        {textureStatus&&<div className={styles.textureStatus} role="status">{textureStatus}</div>}
        <div className={styles.stageBottom}><p>Drag to look around · Click a piece to edit</p><button className={styles.viewSettings} onClick={()=>navigatePanel('view')}>View options</button></div>
        {overlaps.length > 0 && <div className={styles.collisionNote} role="status">{overlaps.length} overlapping {overlaps.length === 1 ? 'pair' : 'pairs'} · Adjust placement in Arrange.</div>}
      </section>
      <aside className={styles.editor} inert={viewerExpanded} aria-label="Kitchen customization">{!viewerExpanded&&<>
        {panelNavigation}
        <div className={styles.panel} key={activePanel}>{panelContent}
          <p className={styles.editorFootnote}>An approximate design preview. Confirm dimensions and material samples before renovating.</p>
        </div></>}
      </aside>
    </div>
    <footer className={styles.designStrip} inert={viewerExpanded}><div><span className={styles.miniStone} data-material={material.id} style={{backgroundColor:material.color,backgroundImage:material.thumbnailUrl?`url(${material.thumbnailUrl})`:undefined,backgroundSize:'cover'}}/><span><small>COUNTERTOP</small><strong>{material.company==='Studio collection'?material.name:material.code}</strong></span></div><div><i style={{background:design.cabinetColor}}/><span><small>CUPBOARDS</small><strong>{colorName(design.cabinetColor)}</strong></span></div><div><i style={{background:FINISHES.find(f=>f.id===design.sinkFinish)!.color}}/><span><small>SINK</small><strong>{design.sinkStyle==='apron'?'Apron front':design.sinkStyle==='double'?'Double bowl':'Single bowl'}</strong></span></div><p>Designed by you.<span>{storageStatus}</span></p></footer>
    {compareOpen&&<section id="infinitegranite-comparisons" className={styles.comparePanel} inert={viewerExpanded} aria-label="Saved design comparisons"><header><div><span className={styles.eyebrow}>SAVE. SWITCH. COMPARE.</span><h2>Your shortlist</h2><p>Switch between saved designs. The camera stays in place.</p></div><button aria-label="Close comparisons" onClick={()=>setCompareOpen(false)}><X size={21}/></button></header>{saved.length===0?<div className={styles.compareEmpty}><Stack size={32}/><p>Find a combination you like, then save it as an option.</p><button onClick={saveOption}>Save current design</button></div>:<div className={styles.savedGrid}>{saved.map(option=>{const m=MATERIALS.find(m=>m.id===option.design.countertop)!;return <article key={option.id}><div className={styles.optionPalette}><span style={{backgroundColor:m.color,backgroundImage:m.thumbnailUrl?`url(${m.thumbnailUrl})`:undefined,backgroundSize:'cover'}}/><span style={{background:option.design.cabinetColor}}/><span style={{background:option.design.islandColor}}/></div><div className={styles.optionTitle}><input aria-label={`Rename ${option.name}`} value={option.name} maxLength={40} onChange={e=>setSaved(items=>items.map(o=>o.id===option.id?{...o,name:e.target.value}:o))}/><button aria-label={`Remove ${option.name}`} onClick={()=>setSaved(items=>items.filter(o=>o.id!==option.id))}><Trash size={17}/></button></div><p>{materialLabel(m)} · {colorName(option.design.cabinetColor)}</p><small>{layoutName(option.design.layout)} · {option.design.sinkStyle} sink</small><button className={styles.applyOption} onClick={()=>{commit(structuredClone(option.design));setSelected(null);setMessage(`${option.name} applied.`);stageRef.current?.scrollIntoView({behavior:'instant',block:'start'});}}>View this option <ArrowClockwise size={16}/></button></article>;})}</div>}</section>}
    <div className={styles.toast} role="status" aria-live="polite" data-visible={!!message}>{message}</div>
  </main>;
}
