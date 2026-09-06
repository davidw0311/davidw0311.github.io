import type { KitchenDesign } from './kitchen.ts';
export interface EditorHistory { design: KitchenDesign; past: KitchenDesign[]; future: KitchenDesign[]; group?: string; time: number; }
export type EditorAction = { type: 'restore'; design: KitchenDesign } | { type: 'change'; next: KitchenDesign | ((d: KitchenDesign) => KitchenDesign); time: number; group?: string } | { type: 'undo' | 'redo' };
export function editorHistory(state: EditorHistory, action: EditorAction): EditorHistory {
  if(action.type==='restore')return {design:action.design,past:[],future:[],time:0};
  if(action.type==='undo') {const previous=state.past.at(-1);return previous?{design:previous,past:state.past.slice(0,-1),future:[...state.future,state.design],time:0}:state;}
  if(action.type==='redo') {const next=state.future.at(-1);return next?{design:next,past:[...state.past,state.design],future:state.future.slice(0,-1),time:0}:state;}
  if(action.type!=='change')return state;
  const design=typeof action.next==='function'?action.next(state.design):action.next;
  const coalesce=!!action.group&&action.group===state.group&&action.time-state.time<500;
  return {design,past:coalesce?state.past:[...state.past.slice(-39),state.design],future:[],group:action.group,time:action.time};
}
