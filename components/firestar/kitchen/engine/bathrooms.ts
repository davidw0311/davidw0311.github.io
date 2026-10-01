import { defaultDesign, makeComponent, type KitchenDesign, type ComponentKind, type LayoutId } from './kitchen.ts';
import { reflowCells } from './cellLayout.ts';
import {defaultWalls} from './room.ts';
/** Fixtures face a clear central aisle; toilet bays are at least 36 inches wide. */
export function bathroomDesign(layout:LayoutId,settings:KitchenDesign=defaultDesign()):KitchenDesign {
 const large=layout==='bath-ensuite',double=['bath-double','bath-shared','bath-ensuite'].includes(layout);
 const columns=double?[36,36,36,36]:[36,36,36],rows=layout==='bath-powder'?[30,36,30]:large?[36,36,36,36,36]:[36,36,36,36];
 const parts:KitchenDesign['components']=[];
 const add=(kind:ComponentKind,row:number,column:number,width?:number,depth?:number,rotation=0)=>parts.push({...makeComponent(kind,`bath-${kind}-${parts.length}`,0,0,rotation,width),...(depth?{depth}:{}),cell:{row,column},cellAlign:rotation===180?{x:0,z:1}:{x:0,z:-1}});
 add('vanity',0,0,30,24);if(double)add('vanity',0,1,30,24);
 add('toilet',0,double?3:2,24,30);
 if(layout!=='bath-powder'){
  if(['bath-tub','bath-double'].includes(layout))add('tub',3,1,60,30,180);
  else add('shower',rows.length-1,columns.length-1,36,36,180);
 }
 if(large)add('tub',4,1,60,30,180);
 const walls=defaultWalls();
 // Door opens from the clear side of the room; the viewer represents the opening, not a swing leaf.
 const d:KitchenDesign={...settings,layout,roomType:'bathroom',gridSize:undefined,gridCellSize:undefined,gridColumns:columns,gridRows:rows,independentSizes:true,floor:'tile',floorColor:undefined,sinkStyle:'single',sinkFinish:'white',waterfall:false,roomWalls:walls,openings:[{id:'bath-entry',kind:'door',wall:'left',offset:0,bottom:0,width:30,height:80}],components:parts};
 const result=reflowCells(d);if(!result)throw new Error(`Invalid bathroom preset: ${layout}`);return result;
}
