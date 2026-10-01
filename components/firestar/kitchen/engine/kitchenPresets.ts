import {defaultDesign,makeComponent,type KitchenDesign,type LayoutId,type ComponentKind} from './kitchen.ts';
import {reflowCells} from './cellLayout.ts';
import {defaultWalls} from './room.ts';
/** Authored working aisles, landing counters and fridge hinge clearance; never grid-fit legacy geometry. */
export function kitchenPresetDesign(layout:LayoutId,settings:KitchenDesign=defaultDesign()):KitchenDesign {
 const columns=[24,30,30,30,36,24,30,12],rows=[24,24,30,36,48,30];
 const parts:KitchenDesign['components']=[];
 const add=(kind:ComponentKind,row:number,column:number,width:number,depth=24,rotation=0)=>parts.push({...makeComponent(kind,`preset-${kind}-${parts.length}`,0,0,rotation,width),depth,cell:{row,column},cellAlign:rotation===90?{x:-1,z:0}:rotation===270?{x:1,z:0}:rotation===180?{x:0,z:1}:{x:-1,z:-1}});
 const u=layout==='u-shape';
 add('base',0,0,24);add('base',0,1,30);add('range',0,2,30,26);add('base',0,3,30);add('sink',0,4,36);add('dishwasher',0,5,24);add(u?'base':'fridge',0,6,30,u?24:30);
 for(const column of [0,1,3,5])add('upper',0,column,columns[column],12);
 const left=['island','l-shape','u-shape','peninsula','family-island'].includes(layout);
 if(left)for(const row of [1,2,3])add('base',row,0,rows[row],24,90);
 if(u){add('base',0,7,12,24);for(const row of [1,2])add('base',row,7,rows[row],24,270);add('fridge',3,7,36,30,270);}
 if(['galley','galley-pantry'].includes(layout))for(const col of [1,2,3,4,5])add(col===1&&layout==='galley-pantry'?'pantry':'base',3,col,columns[col],24,180);
 if(['island','single-island','family-island'].includes(layout)){if(layout==='family-island')rows[3]=48;add('island',3,3,60,rows[3]);}
 if(layout==='peninsula')add('island',3,1,60,36);
 for(const c of parts){if(c.kind==='base'&&((left&&c.cell!.row===0&&c.cell!.column===0)||(u&&c.cell!.row===0&&c.cell!.column===7)||(layout==='peninsula'&&c.cell!.row===3&&c.cell!.column===0))){c.closedCorner=true;c.name='Closed corner counter';}}
 const walls=defaultWalls();
 const d:KitchenDesign={...settings,layout,roomType:'kitchen',gridColumns:columns,gridRows:rows,gridSize:undefined,gridCellSize:undefined,independentSizes:true,components:parts,roomWalls:walls,openings:[{id:'preset-sink-window',kind:'window',wall:'back',offset:24,bottom:54,width:32,height:36}]};
 const result=reflowCells(d);if(!result)throw new Error(`Invalid kitchen preset: ${layout}`);return result;
}
