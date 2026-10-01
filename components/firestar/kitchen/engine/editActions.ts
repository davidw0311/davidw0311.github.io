import { editCell, moveCell, replaceCell, resizeCells } from './cellLayout.ts';
import type { ComponentKind, KitchenComponent, KitchenDesign } from './kitchen.ts';
export type PieceAction = {type:'resize';ids:string[];dimension:'width'|'depth';value:number}|{type:'edit';id:string;patch:Partial<KitchenComponent>}|{type:'move';id:string;row:number;column:number}|{type:'replace';id:string;kind:ComponentKind};
/** Resolve queued edits against the latest design, including a numeric field's pending blur. */
export function applyPieceAction(design:KitchenDesign,action:PieceAction,onBlocked?:(message:string)=>void):KitchenDesign|null {
  switch(action.type){
    case 'resize':return resizeCells(design,action.ids,action.dimension,action.value,onBlocked);
    case 'edit':return editCell(design,action.id,action.patch,onBlocked);
    case 'move':return moveCell(design,action.id,action.row,action.column,onBlocked);
    case 'replace':return replaceCell(design,action.id,action.kind,onBlocked);
  }
}
/** Quantize one camera basis, then derive its perpendicular: arrows must never share an axis. */
export function gridDirection(forwardX:number,forwardZ:number,horizontal:number,vertical:number):{x:number;z:number} {
  const forward=Math.abs(forwardX)>Math.abs(forwardZ)?{x:Math.sign(forwardX),z:0}:{x:0,z:Math.sign(forwardZ)||-1};
  return {x:-forward.z*horizontal+forward.x*vertical,z:forward.x*horizontal+forward.z*vertical};
}
