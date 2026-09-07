import { collisionPairs, DEFAULT_SIZES, footprint, KIND_NAMES, makeComponent, presetComponents, MAX_COMPONENTS, SIZE_LIMITS, type ComponentKind, type KitchenComponent, type KitchenDesign } from './kitchen.ts';
export interface Cell { row:number; column:number; }
export interface CellTarget extends Cell { x:number; z:number; width:number; depth:number; }
const sum=(values:number[])=>values.reduce((a,b)=>a+b,0);
const flat=(kind:ComponentKind)=>['base','sink','vanity','dishwasher','island','range'].includes(kind);
const upper=(c:KitchenComponent)=>c.kind==='upper';
export function hasCellLayout(d:KitchenDesign):boolean {return !!d.gridColumns&&!!d.gridRows&&d.components.every(c=>!!c.cell);}
export function validCellLayout(d:KitchenDesign):boolean {
  if(!d.gridColumns||!d.gridRows)return false;
  if(![d.gridColumns,d.gridRows].every(a=>Array.isArray(a)&&a.length>=1&&a.length<=20&&a.every(n=>Number.isFinite(n)&&n>=12&&n<=120&&Number.isInteger(n*2))&&sum(a)<=720))return false;
  const occupied=new Set<string>();
  return d.components.every(c=>{const cell=c.cell;if(!cell||!Number.isInteger(cell.row)||!Number.isInteger(cell.column)||cell.row<0||cell.row>=d.gridRows!.length||cell.column<0||cell.column>=d.gridColumns!.length)return false;const key=`${cell.row}:${cell.column}:${upper(c)}`;if(occupied.has(key))return false;occupied.add(key);return true;});
}
/** Legacy layouts fill their cells; independently sized pieces retain their own dimensions. */
export function reflowCells(d:KitchenDesign):KitchenDesign|null {
  if(!validCellLayout(d))return null;
  const columns=[...d.gridColumns!],rows=[...d.gridRows!];
  for(const c of d.independentSizes?[]:d.components){const turned=c.rotation%180!==0;columns[c.cell!.column]=Math.max(columns[c.cell!.column],SIZE_LIMITS[c.kind][turned?'depth':'width'][0]);rows[c.cell!.row]=Math.max(rows[c.cell!.row],SIZE_LIMITS[c.kind][turned?'width':'depth'][0]);}
  if(sum(columns)>720||sum(rows)>720)return null;
  const roomWidth=Math.max(d.roomType==='bathroom'?72:144,sum(columns)),roomDepth=Math.max(d.roomType==='bathroom'?72:144,sum(rows));
  const components=d.components.map(c=>{
    const {row,column}=c.cell!,rotation=((Math.round(c.rotation/90)*90)%360+360)%360,turned=rotation%180!==0;
    return {...c,rotation,x:-roomWidth/2+sum(columns.slice(0,column))+columns[column]/2,z:-roomDepth/2+sum(rows.slice(0,row))+rows[row]/2,width:d.independentSizes?c.width:turned?rows[row]:columns[column],depth:d.independentSizes?c.depth:turned?columns[column]:rows[row],height:flat(c.kind)?36:DEFAULT_SIZES[c.kind][2]};
  });
  const result={...d,gridColumns:columns,gridRows:rows,roomWidth,roomDepth,components};
  if(d.independentSizes&&components.some(c=>!withinCellReach(result,c)))return null;
  if(collisionPairs(components).length)return null;
  return {...d,gridColumns:columns,gridRows:rows,roomWidth,roomDepth,components};
}
/** Adopt legacy square-grid assignments; older free layouts get nearest unoccupied cells. */
export function ensureCells(d:KitchenDesign):KitchenDesign|null {
  if(hasCellLayout(d))return reflowCells(d);
  const count=Math.max(4,Math.min(20,d.gridSize??Math.ceil(Math.max(d.roomWidth,d.roomDepth)/36)));
  const preset=presetComponents(d.layout);
  const isPreset=preset.length===d.components.length&&preset.length>0&&preset.every(p=>d.components.some(c=>c.id===p.id&&c.kind===p.kind&&c.x===p.x&&c.z===p.z&&c.rotation===p.rotation));
  const slots=new Set<string>(),components:KitchenComponent[]=[];
  for(const c of [...d.components].sort((a,b)=>Number(upper(a))-Number(upper(b)))){
    const match=c.id.match(/^grid-(\d+)-(\d+)-(floor|upper)$/);
    const preferred={row:match?Number(match[1]):Math.max(0,Math.min(count-1,Math.floor((c.z+d.roomDepth/2)/36))),column:match?Number(match[2]):Math.max(0,Math.min(count-1,Math.floor((c.x+d.roomWidth/2)/36)))};
    if(isPreset){const index=preset.findIndex(p=>p.id===c.id);
      if(index<6){preferred.row=0;preferred.column=index;}
      else if(index<9){preferred.row=0;preferred.column=[1,3,5][index-6];}
      else if(c.x<=-90){preferred.row=Math.max(1,Math.round((c.z+54)/36)+1);preferred.column=0;}
      else if(c.x>=90){preferred.row=Math.max(1,Math.round((c.z+54)/36)+1);preferred.column=5;}
      else if(c.kind==='island'){preferred.row=d.layout==='peninsula'?4:3;preferred.column=d.layout==='peninsula'?1:2;}
      else {preferred.row=3;preferred.column=Math.round((c.x+54)/36)+1;}
    }
    // Keep wall cupboards over their original supporting module where possible.
    if(upper(c)&&!match&&!isPreset){const support=d.components.filter(p=>!upper(p)&&!['fridge','pantry','range'].includes(p.kind)).sort((a,b)=>(a.x-c.x)**2+(a.z-c.z)**2-((b.x-c.x)**2+(b.z-c.z)**2))[0];const mapped=components.find(p=>p.id===support?.id);if(mapped?.cell){preferred.row=mapped.cell.row;preferred.column=mapped.cell.column;}}
    const candidates=Array.from({length:count*count},(_,i)=>({row:Math.floor(i/count),column:i%count})).sort((a,b)=>(a.row-preferred.row)**2+(a.column-preferred.column)**2-((b.row-preferred.row)**2+(b.column-preferred.column)**2));
    const cell=candidates.find(cell=>!slots.has(`${cell.row}:${cell.column}:${upper(c)}`)&&(!upper(c)||!components.some(p=>p.cell?.row===cell.row&&p.cell.column===cell.column&&['fridge','range','pantry','shower','vanity'].includes(p.kind))));
    if(!cell)return null;slots.add(`${cell.row}:${cell.column}:${upper(c)}`);components.push({...c,cell});
  }
  const columns=Array.from({length:count},(_,column)=>Math.max(12,...components.filter(c=>c.cell!.column===column).map(c=>footprint(c).width))),rows=Array.from({length:count},(_,row)=>Math.max(12,...components.filter(c=>c.cell!.row===row).map(c=>footprint(c).depth)));
  for(let i=0;i<count;i++){if(!components.some(c=>c.cell!.column===i))columns[i]=36;if(!components.some(c=>c.cell!.row===i))rows[i]=36;}
  return reflowCells({...d,gridColumns:columns,gridRows:rows,components});
}
/** A piece may extend into the immediately neighbouring cell, but never past it. */
function withinCellReach(d:KitchenDesign,c:KitchenComponent):boolean {
  if(!c.cell)return false;
  const f=footprint(c),{row,column}=c.cell,columns=d.gridColumns!,rows=d.gridRows!;
  if(!(['width','depth'] as const).every(k=>Number.isFinite(c[k])&&c[k]>=SIZE_LIMITS[c.kind][k][0]&&c[k]<=120&&Number.isInteger(c[k]*2)))return false;
  const left=-d.roomWidth/2+sum(columns.slice(0,Math.max(0,column-1)));
  const right=-d.roomWidth/2+sum(columns.slice(0,column+2));
  const back=-d.roomDepth/2+sum(rows.slice(0,Math.max(0,row-1)));
  const front=-d.roomDepth/2+sum(rows.slice(0,row+2));
  return c.x-f.width/2>=left-1e-6&&c.x+f.width/2<=right+1e-6&&c.z-f.depth/2>=back-1e-6&&c.z+f.depth/2<=front+1e-6;
}
function independent(d:KitchenDesign):KitchenDesign|null {
  const grid=ensureCells(d);return grid?{...grid,independentSizes:true}:null;
}
/** Atomic equal-dimension edits: unselected pieces and grid tracks never move. */
export function resizeCells(d:KitchenDesign,ids:string[],dimension:'width'|'depth',value:number):KitchenDesign|null {
  if(!Number.isFinite(value)||!Number.isInteger(value*2)||!ids.length)return null;
  const grid=independent(d);if(!grid||ids.some(id=>!grid.components.some(c=>c.id===id)))return null;
  const selected=new Set(ids);
  return reflowCells({...grid,components:grid.components.map(c=>selected.has(c.id)?{...c,[dimension]:value}:c)});
}
export function selectionLimits(d:KitchenDesign,ids:string[],dimension:'width'|'depth'):[number,number]|null {
  const grid=independent(d),parts=grid?.components.filter(c=>ids.includes(c.id));if(!grid||!parts?.length)return null;
  const min=Math.max(...parts.map(c=>SIZE_LIMITS[c.kind][dimension][0]));
  if(!resizeCells(grid,ids,dimension,min))return null;
  // Increasing a shared dimension only expands footprints, so feasibility is monotonic.
  let low=min*2,high=240;
  while(low<high){const mid=Math.ceil((low+high)/2);if(resizeCells(grid,ids,dimension,mid/2))low=mid;else high=mid-1;}
  return [min,low/2];
}
export function cellLimits(d:KitchenDesign,id:string,dimension:'width'|'depth'):[number,number] {
  return selectionLimits(d,[id],dimension)??[0,0];
}
export function editCell(d:KitchenDesign,id:string,patch:Partial<KitchenComponent>):KitchenDesign|null {
  const grid=independent(d),c=grid?.components.find(c=>c.id===id);if(!grid||!c)return null;
  return reflowCells({...grid,components:grid.components.map(p=>p.id===id?{...p,...patch,cell:p.cell}:p)});
}
export function replaceCell(d:KitchenDesign,id:string,kind:ComponentKind):KitchenDesign|null {
  if(!Object.hasOwn(KIND_NAMES,kind))return null;
  const grid=independent(d),c=grid?.components.find(c=>c.id===id);if(!grid||!c)return null;
  const components=grid.components.map(p=>{if(p.id!==id)return p;const replacement={...p,kind,name:KIND_NAMES[kind],width:Math.max(p.width,SIZE_LIMITS[kind].width[0]),depth:Math.max(p.depth,SIZE_LIMITS[kind].depth[0])};delete replacement.color;delete replacement.material;return replacement;});
  return reflowCells({...grid,components});
}

export function moveCell(d:KitchenDesign,id:string,rowDelta:number,columnDelta:number):KitchenDesign|null {
  if(![rowDelta,columnDelta].every(Number.isInteger)||Math.abs(rowDelta)+Math.abs(columnDelta)!==1)return null;
  const grid=independent(d),c=grid?.components.find(c=>c.id===id);if(!grid||!c)return null;
  const target={row:c.cell!.row+rowDelta,column:c.cell!.column+columnDelta};
  if(target.row<0||target.column<0||target.row>=grid.gridRows!.length||target.column>=grid.gridColumns!.length)return null;
  const neighbor=grid.components.find(p=>upper(p)===upper(c)&&p.cell!.row===target.row&&p.cell!.column===target.column);
  return reflowCells({...grid,components:grid.components.map(p=>p.id===id?{...p,cell:target}:p.id===neighbor?.id?{...p,cell:{...c.cell!}}:p)});
}
export function addCell(d:KitchenDesign,kind:ComponentKind,id:string,cell:Cell):KitchenDesign|null {
  const grid=independent(d);if(!grid||grid.components.length>=MAX_COMPONENTS||!Object.hasOwn(KIND_NAMES,kind))return null;
  if(!Number.isInteger(cell.row)||!Number.isInteger(cell.column)||cell.row<0||cell.column<0||cell.row>=grid.gridRows!.length||cell.column>=grid.gridColumns!.length)return null;
  const c={...makeComponent(kind,id),width:Math.max(grid.gridColumns![cell.column],SIZE_LIMITS[kind].width[0]),depth:Math.max(grid.gridRows![cell.row],SIZE_LIMITS[kind].depth[0]),cell:{row:cell.row,column:cell.column}};
  return reflowCells({...grid,components:[...grid.components,c]});
}
export function availableCells(d:KitchenDesign,kind:ComponentKind):CellTarget[] {
  const grid=ensureCells(d);if(!grid||grid.components.length>=MAX_COMPONENTS)return [];
  const targets:CellTarget[]=[];
  for(let row=0;row<grid.gridRows!.length;row++)for(let column=0;column<grid.gridColumns!.length;column++){
    if(grid.components.some(c=>c.cell!.row===row&&c.cell!.column===column&&(upper(c)===(kind==='upper')||['fridge','range','pantry','shower','vanity'].includes(kind)||['fridge','range','pantry','shower','vanity'].includes(c.kind))))continue;
    if(!addCell(grid,kind,'__placement-preview__',{row,column}))continue;
    targets.push({row,column,x:-grid.roomWidth/2+sum(grid.gridColumns!.slice(0,column))+grid.gridColumns![column]/2,z:-grid.roomDepth/2+sum(grid.gridRows!.slice(0,row))+grid.gridRows![row]/2,width:grid.gridColumns![column],depth:grid.gridRows![row]});
  }return targets;
}
