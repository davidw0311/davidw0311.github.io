import { defaultDesign, makeComponent, type KitchenDesign, type ComponentKind, type LayoutId } from './kitchen.ts';
import { reflowCells } from './cellLayout.ts';
/** Bathroom presets use the same cell addresses and independent sizing as kitchens. */
export function bathroomDesign(layout:LayoutId,settings:KitchenDesign=defaultDesign()):KitchenDesign {
  const parts:{kind:ComponentKind;row:number;column:number;width?:number;depth?:number;rotation?:number}[]=layout==='bath-powder'?
    [{kind:'vanity',row:0,column:0},{kind:'toilet',row:0,column:2}]:layout==='bath-full'?
    [{kind:'vanity',row:0,column:0},{kind:'toilet',row:0,column:2},{kind:'shower',row:2,column:2}]:
    [{kind:'vanity',row:0,column:0},{kind:'vanity',row:0,column:1},{kind:'toilet',row:0,column:3},{kind:'tub',row:3,column:2}];
  const columns=layout==='bath-powder'?[30,30,30]:layout==='bath-full'?[30,30,36]:[30,30,36,30];
  const rows=layout==='bath-powder'?[30,30,30]:layout==='bath-full'?[30,30,36,30]:[30,30,30,36,24];
  const d={...settings,layout,roomType:'bathroom' as const,gridSize:undefined,gridCellSize:undefined,gridColumns:columns,gridRows:rows,independentSizes:true,floor:'tile' as const,sinkStyle:'single' as const,sinkFinish:'white' as const,waterfall:false,openings:[],components:parts.map((p,i)=>({...makeComponent(p.kind,`bath-${p.kind}-${i}`,0,0,p.rotation??0,p.width),...(p.depth?{depth:p.depth}:{}),cell:{row:p.row,column:p.column}}))};
  const result=reflowCells(d);if(!result)throw new Error('Invalid bathroom preset');return result;
}
