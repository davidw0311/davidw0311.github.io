import test from 'node:test';
import assert from 'node:assert/strict';
import {applyPieceAction,gridDirection,type PieceAction} from '../app/projects/infinite-granite/editActions.ts';
import {ensureCells,selectionLimits,moveCell,resizeCells} from '../app/projects/infinite-granite/cellLayout.ts';
import {type KitchenDesign,defaultDesign,LAYOUTS,BATHROOM_LAYOUTS,collisionPairs,parseDesign} from '../app/projects/infinite-granite/kitchen.ts';
import {createCustomDesign} from '../app/projects/infinite-granite/placement.ts';
import {editorHistory,type EditorHistory} from '../app/projects/infinite-granite/history.ts';
test('camera arrows remain four distinct perpendicular directions, including exact diagonals',()=>{
 for(const [x,z] of [[1,1],[-1,1],[1,-1],[-1,-1],[0,0],...[...Array(360)].map((_,i)=>[Math.sin(i*Math.PI/180),Math.cos(i*Math.PI/180)])]){
  const directions=[[1,0],[0,1],[-1,0],[0,-1]].map(([h,v])=>gridDirection(x,z,h,v));
  assert.equal(new Set(directions.map(d=>`${d.x},${d.z}`)).size,4);
  assert.equal(directions[0].x*directions[1].x+directions[0].z*directions[1].z,0);
 }
});
test('queued numeric edit, movement, resize, and undo preserve all preceding edits',()=>{
 const d=createCustomDesign(4,[{row:1,column:1,kind:'base'}])!,id=d.components[0].id;
 let state:EditorHistory={design:d,past:[],future:[],time:0};
 const actions:PieceAction[]=[{type:'resize',ids:[id],dimension:'width',value:24},{type:'move',id,row:1,column:0},{type:'resize',ids:[id],dimension:'depth',value:24}];
 for(const action of actions)state=editorHistory(state,{type:'change',next:current=>applyPieceAction(current,action)??current,time:1});
 assert.equal(state.design.components[0].width,24);assert.equal(state.design.components[0].depth,24);assert.equal(state.design.components[0].cell!.row,2);
 state=editorHistory(state,{type:'undo'});assert.equal(state.design.components[0].width,24);assert.equal(state.design.components[0].cell!.row,2);
});
test('blocked moves identify the boundary or the colliding components',()=>{
 const d=createCustomDesign(4,[{row:0,column:1,kind:'base'},{row:0,column:2,kind:'base'}])!,id=d.components[0].id;
 let reason='';assert.equal(applyPieceAction(d,{type:'move',id,row:-1,column:0},s=>{reason=s;}),null);assert.match(reason,/grid boundary/);
 assert.equal(applyPieceAction(d,{type:'resize',ids:[id],dimension:'width',value:48},s=>{reason=s;}),null);assert.match(reason,/Base cupboard.*overlap/);
});
for(const layout of [...LAYOUTS,...BATHROOM_LAYOUTS])test(`${layout.name}: move then resize remains editable and survives save/reload`,()=>{
 const d=ensureCells(defaultDesign(layout.id))!;assert.ok(d);
 for(const c of d.components)for(const [row,column] of [[0,1],[1,0],[0,-1],[-1,0]]){
  const moved=moveCell(d,c.id,row,column);if(!moved)continue;
  for(const dimension of ['width','depth'] as const){
   const limits=selectionLimits(moved,[c.id],dimension);assert.ok(limits,`${c.id} lost its ${dimension} controls`);
   for(const value of limits){const resized:KitchenDesign=resizeCells(moved,[c.id],dimension,value)!;assert.ok(resized);assert.equal(resized.components.find(p=>p.id===c.id)![dimension],value);assert.deepEqual(collisionPairs(resized.components),[]);assert.deepEqual(parseDesign(JSON.parse(JSON.stringify(resized))),JSON.parse(JSON.stringify(resized)));}
  }
 }
});
