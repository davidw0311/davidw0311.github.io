import { collisionPairs, DEFAULT_SIZES, footprint, KIND_NAMES, makeComponent, presetComponents, MAX_COMPONENTS, SIZE_LIMITS, type ComponentKind, type KitchenComponent, type KitchenDesign } from './kitchen.ts';
export interface Cell { row:number; column:number; }
export interface CellTarget extends Cell { x:number; z:number; width:number; depth:number; }
const sum=(values:number[])=>values.reduce((a,b)=>a+b,0);
const flat=(kind:ComponentKind)=>['base','sink','dishwasher','island','range'].includes(kind);
const upper=(c:KitchenComponent)=>c.kind==='upper';
export function hasCellLayout(d:KitchenDesign):boolean {return !!d.gridColumns&&!!d.gridRows&&d.components.every(c=>!!c.cell);}
export function validCellLayout(d:KitchenDesign):boolean {
  if(!d.gridColumns||!d.gridRows)return false;
  if(![d.gridColumns,d.gridRows].every(a=>Array.isArray(a)&&a.length>=1&&a.length<=20&&a.every(n=>Number.isFinite(n)&&n>=12&&n<=120&&Number.isInteger(n*2))&&sum(a)<=720))return false;
  const occupied=new Set<string>();
  return d.components.every(c=>{const cell=c.cell;if(!cell||!Number.isInteger(cell.row)||!Number.isInteger(cell.column)||cell.row<0||cell.row>=d.gridRows!.length||cell.column<0||cell.column>=d.gridColumns!.length)return false;const key=`${cell.row}:${cell.column}:${upper(c)}`;if(occupied.has(key))return false;occupied.add(key);return true;});
}
/** Cell sizes own the occupied footprint. Adjacent occupied cells therefore share an edge. */
export function reflowCells(d:KitchenDesign):KitchenDesign|null {
  if(!validCellLayout(d))return null;
  const columns=[...d.gridColumns!],rows=[...d.gridRows!];
  for(const c of d.components){const turned=c.rotation%180!==0;columns[c.cell!.column]=Math.max(columns[c.cell!.column],SIZE_LIMITS[c.kind][turned?'depth':'width'][0]);rows[c.cell!.row]=Math.max(rows[c.cell!.row],SIZE_LIMITS[c.kind][turned?'width':'depth'][0]);}
  if(sum(columns)>720||sum(rows)>720)return null;
  const roomWidth=Math.max(144,sum(columns)),roomDepth=Math.max(144,sum(rows));
  const components=d.components.map(c=>{
    const {row,column}=c.cell!,rotation=((Math.round(c.rotation/90)*90)%360+360)%360,turned=rotation%180!==0;
    return {...c,rotation,x:-roomWidth/2+sum(columns.slice(0,column))+columns[column]/2,z:-roomDepth/2+sum(rows.slice(0,row))+rows[row]/2,width:turned?rows[row]:columns[column],depth:turned?columns[column]:rows[row],height:flat(c.kind)?36:DEFAULT_SIZES[c.kind][2]};
  });
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
    const cell=candidates.find(cell=>!slots.has(`${cell.row}:${cell.column}:${upper(c)}`)&&(!upper(c)||!components.some(p=>p.cell?.row===cell.row&&p.cell.column===cell.column&&['fridge','range','pantry'].includes(p.kind))));
    if(!cell)return null;slots.add(`${cell.row}:${cell.column}:${upper(c)}`);components.push({...c,cell});
  }
  const columns=Array.from({length:count},(_,column)=>Math.max(12,...components.filter(c=>c.cell!.column===column).map(c=>footprint(c).width))),rows=Array.from({length:count},(_,row)=>Math.max(12,...components.filter(c=>c.cell!.row===row).map(c=>footprint(c).depth)));
  for(let i=0;i<count;i++){if(!components.some(c=>c.cell!.column===i))columns[i]=36;if(!components.some(c=>c.cell!.row===i))rows[i]=36;}
  return reflowCells({...d,gridColumns:columns,gridRows:rows,components});
}
export function cellLimits(d:KitchenDesign,id:string,dimension:'width'|'depth'):[number,number] {
  const c=d.components.find(c=>c.id===id);if(!c?.cell)return [12,120];
  const column=(dimension==='width')===(c.rotation%180===0),index=column?c.cell.column:c.cell.row;
  let min=12;
  for(const item of d.components){if(!item.cell||(column?item.cell.column:item.cell.row)!==index)continue;const localDimension=column?(item.rotation%180===0?'width':'depth'):(item.rotation%180===0?'depth':'width');min=Math.max(min,SIZE_LIMITS[item.kind][localDimension][0]);}
  const tracks=column?d.gridColumns!:d.gridRows!;
  return [min,Math.min(120,720-sum(tracks)+tracks[index])];
}
export function editCell(d:KitchenDesign,id:string,patch:Partial<KitchenComponent>):KitchenDesign|null {
  const grid=ensureCells(d),c=grid?.components.find(c=>c.id===id);if(!grid||!c)return null;
  const next={...grid,gridColumns:[...grid.gridColumns!],gridRows:[...grid.gridRows!],components:grid.components.map(p=>p.id===id?{...p,...patch,cell:p.cell}:p)};
  for(const dimension of ['width','depth'] as const){if(patch[dimension]===undefined)continue;const [min,max]=cellLimits(next,id,dimension),value=patch[dimension]!;if(!Number.isFinite(value)||value<min||value>max)return null;const column=(dimension==='width')===((patch.rotation??c.rotation)%180===0);(column?next.gridColumns:next.gridRows)[column?c.cell!.column:c.cell!.row]=Math.round(value*2)/2;}
  return reflowCells(next);
}
export function replaceCell(d:KitchenDesign,id:string,kind:ComponentKind):KitchenDesign|null {
  if(!Object.hasOwn(KIND_NAMES,kind))return null;
  const grid=ensureCells(d),c=grid?.components.find(c=>c.id===id);if(!grid||!c)return null;
  const changed={...grid,components:grid.components.map(p=>{if(p.id!==id)return p;const replacement={...p,kind,name:KIND_NAMES[kind]};delete replacement.color;delete replacement.material;return replacement;})};
  const next={...changed,gridColumns:[...changed.gridColumns!],gridRows:[...changed.gridRows!]};
  for(const dimension of ['width','depth'] as const){const column=(dimension==='width')===(c.rotation%180===0),tracks=column?next.gridColumns:next.gridRows,index=column?c.cell!.column:c.cell!.row;tracks[index]=Math.max(tracks[index],cellLimits(changed,id,dimension)[0]);}
  return reflowCells(next);
}
export function moveCell(d:KitchenDesign,id:string,rowDelta:number,columnDelta:number):KitchenDesign|null {
  if(![rowDelta,columnDelta].every(Number.isInteger)||Math.abs(rowDelta)+Math.abs(columnDelta)!==1)return null;
  const grid=ensureCells(d),c=grid?.components.find(c=>c.id===id);if(!grid||!c)return null;
  const target={row:c.cell!.row+rowDelta,column:c.cell!.column+columnDelta};
  if(target.row<0||target.column<0||target.row>=grid.gridRows!.length||target.column>=grid.gridColumns!.length)return null;
  const neighbor=grid.components.find(p=>upper(p)===upper(c)&&p.cell!.row===target.row&&p.cell!.column===target.column);
  return reflowCells({...grid,components:grid.components.map(p=>p.id===id?{...p,cell:target}:p.id===neighbor?.id?{...p,cell:{...c.cell!}}:p)});
}
export function addCell(d:KitchenDesign,kind:ComponentKind,id:string,cell:Cell):KitchenDesign|null {
  const grid=ensureCells(d);if(!grid||grid.components.length>=MAX_COMPONENTS||!Object.hasOwn(KIND_NAMES,kind))return null;
  const c={...makeComponent(kind,id),cell:{row:cell.row,column:cell.column}};
  return reflowCells({...grid,components:[...grid.components,c]});
}
export function availableCells(d:KitchenDesign,kind:ComponentKind):CellTarget[] {
  const grid=ensureCells(d);if(!grid||grid.components.length>=MAX_COMPONENTS)return [];
  const targets:CellTarget[]=[];
  for(let row=0;row<grid.gridRows!.length;row++)for(let column=0;column<grid.gridColumns!.length;column++){
    if(grid.components.some(c=>c.cell!.row===row&&c.cell!.column===column&&(upper(c)===(kind==='upper')||['fridge','range','pantry'].includes(kind)||['fridge','range','pantry'].includes(c.kind))))continue;
    const requiredWidth=Math.max(grid.gridColumns![column],SIZE_LIMITS[kind].width[0]),requiredDepth=Math.max(grid.gridRows![row],SIZE_LIMITS[kind].depth[0]);
    if(sum(grid.gridColumns!)-grid.gridColumns![column]+requiredWidth>720||sum(grid.gridRows!)-grid.gridRows![row]+requiredDepth>720)continue;
    targets.push({row,column,x:-grid.roomWidth/2+sum(grid.gridColumns!.slice(0,column))+grid.gridColumns![column]/2,z:-grid.roomDepth/2+sum(grid.gridRows!.slice(0,row))+grid.gridRows![row]/2,width:grid.gridColumns![column],depth:grid.gridRows![row]});
  }return targets;
}
