import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultDesign } from '../app/projects/infinite-granite/kitchen.ts';
import { editorHistory, type EditorHistory } from '../app/projects/infinite-granite/history.ts';
const initial=():EditorHistory=>({design:defaultDesign(),past:[],future:[],time:0});
test('discrete design edits have independent undo and redo even when fast',()=>{
  let s=initial();
  s=editorHistory(s,{type:'change',next:d=>({...d,countertop:'absolute'}),time:1});
  s=editorHistory(s,{type:'change',next:d=>({...d,cabinetColor:'#293f54'}),time:2});
  s=editorHistory(s,{type:'undo'});assert.equal(s.design.countertop,'absolute');assert.equal(s.design.cabinetColor,'#8b9a88');
  s=editorHistory(s,{type:'redo'});assert.equal(s.design.cabinetColor,'#293f54');
});
test('continuous placement edits undo as one gesture and a new edit clears redo',()=>{
  let s=initial();
  for(const x of [10,20,30])s=editorHistory(s,{type:'change',next:d=>({...d,components:d.components.map((c,i)=>i===1?{...c,x}:c)}),time:x,group:'move:1'});
  assert.equal(s.past.length,1);assert.equal(s.design.components[1].x,30);
  s=editorHistory(s,{type:'undo'});assert.equal(s.design.components[1].x,-33);
  s=editorHistory(s,{type:'change',next:d=>({...d,countertop:'carrara'}),time:100});assert.equal(s.future.length,0);
});
test('history reducer is pure under React strict-mode replay',()=>{
  const s=initial();const before=JSON.stringify(s);const action={type:'change' as const,next:{...s.design,countertop:'absolute'},time:1};
  const a=editorHistory(s,action),b=editorHistory(s,action);
  assert.equal(JSON.stringify(s),before);assert.deepEqual(a,b);
});
