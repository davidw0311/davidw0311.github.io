import test from 'node:test';
import assert from 'node:assert/strict';
import { bathroomDesign } from '../app/projects/infinite-granite/bathrooms.ts';
import { BATHROOM_LAYOUTS,collisionPairs,parseDesign,defaultDesign,makeComponent } from '../app/projects/infinite-granite/kitchen.ts';
import { resizeCells,addCell,availableCells,replaceCell } from '../app/projects/infinite-granite/cellLayout.ts';
import {createCustomDesign,sharesHeight} from '../app/projects/infinite-granite/placement.ts';
test('all bathroom presets are collision free and persist with compact room dimensions',()=>{
 for(const l of BATHROOM_LAYOUTS){const d=bathroomDesign(l.id);assert.equal(d.roomType,'bathroom');assert.ok(d.components.some(c=>c.kind==='vanity'));assert.ok(d.components.some(c=>c.kind==='toilet'));assert.deepEqual(collisionPairs(d.components),[]);assert.deepEqual(parseDesign(JSON.parse(JSON.stringify(d))),JSON.parse(JSON.stringify(d)));assert.deepEqual(defaultDesign(l.id),d);}
 assert.equal(bathroomDesign('bath-powder').roomWidth,108);
 assert.ok(bathroomDesign('bath-full').components.some(c=>c.kind==='shower'));
 assert.equal(bathroomDesign('bath-double').components.filter(c=>c.kind==='vanity').length,2);
 assert.ok(bathroomDesign('bath-double').components.some(c=>c.kind==='tub'));
});
test('bathroom dimensions, multi-select, and material choices reuse the editor',()=>{
 const d=bathroomDesign('bath-double',{...defaultDesign(),countertop:'vicostone-bq6728',cabinetColor:'#293f54'});
 const ids=d.components.filter(c=>c.kind==='vanity').map(c=>c.id),next=resizeCells(d,ids,'width',24)!;
 assert.ok(next.components.filter(c=>c.kind==='vanity').every(c=>c.width===24));assert.equal(next.countertop,d.countertop);assert.equal(next.cabinetColor,d.cabinetColor);
 assert.deepEqual(next.components.filter(c=>c.kind!=='vanity'),d.components.filter(c=>c.kind!=='vanity'));
 assert.equal(resizeCells(d,ids,'width',40),null);
 assert.ok(parseDesign(next));
});
test('bathroom fixtures participate in replacement, placement and vertical collision protection',()=>{
 const d=bathroomDesign('bath-full'),vanity=d.components.find(c=>c.kind==='vanity')!;
 assert.equal(addCell(d,'upper','blocked',vanity.cell!),null);
 assert.ok(sharesHeight(vanity,makeComponent('upper','upper')));
 assert.ok(!availableCells(d,'upper').some(c=>c.row===vanity.cell!.row&&c.column===vanity.cell!.column));
 const next=replaceCell(d,vanity.id,'toilet')!;assert.equal(next.components.find(c=>c.id===vanity.id)!.kind,'toilet');
 const cell=availableCells(d,'toilet')[0];assert.ok(cell);assert.ok(addCell(d,'toilet','new-toilet',cell));
});
test('custom bathroom grids and kitchen legacy saves remain valid',()=>{
 const custom=createCustomDesign(4,[{row:0,column:0,kind:'vanity'},{row:0,column:2,kind:'toilet'},{row:2,column:2,kind:'shower'}],bathroomDesign('bath-full'))!;
 assert.equal(custom.roomType,'bathroom');assert.ok(parseDesign(custom));assert.ok(parseDesign(defaultDesign()));
 assert.equal(parseDesign({...defaultDesign(),roomType:'invalid'}),null);
 assert.equal(parseDesign({...defaultDesign(),roomWidth:90}),null);
});
