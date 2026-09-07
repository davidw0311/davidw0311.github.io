import { clampComponent, footprint, type KitchenDesign, type KitchenComponent } from './kitchen.ts';
import { componentsOverlap, isPlacementValid, resolvePlacement, sharesHeight } from './placement.ts';
import { fitOpenings, openingsOverlap } from './room.ts';
const EPS=1e-6;
/** Resize from the negative world edge, carrying the connected run on its positive side.
 * Translation pushes encountered parts. All changes are validated and committed atomically. */
export function connectedEdit(d:KitchenDesign,id:string,patch:Partial<KitchenComponent>,flow=true):KitchenDesign|null {
  const old=d.components.find(c=>c.id===id);if(!old)return null;
  const proposal={...old,...patch};
  if(!['x','z','width','depth','height','rotation'].some(k=>k in patch))return {...d,components:d.components.map(c=>c.id===id?proposal:c)};
  if(!flow){const r=resolvePlacement(proposal,d.components,d.roomWidth,d.roomDepth);return r.accepted?{...d,components:d.components.map(c=>c.id===id?r.component:c)}:null;}
  if(![proposal.x,proposal.z,proposal.width,proposal.depth,proposal.height,proposal.rotation].every(Number.isFinite))return null;
  // Preserve ordinary edge snapping when movement can complete without pushing.
  const onlyMove=Object.keys(patch).every(k=>k==='x'||k==='z');
  if(onlyMove){const snap=resolvePlacement(proposal,d.components,d.roomWidth,d.roomDepth);if(snap.accepted&&Math.abs(snap.component.x-proposal.x)<=3&&Math.abs(snap.component.z-proposal.z)<=3){
    const travelled=Math.hypot(snap.component.x-old.x,snap.component.z-old.z),requested=Math.hypot(proposal.x-old.x,proposal.z-old.z);
    if(travelled>=requested-1e-6)return {...d,components:d.components.map(c=>c.id===id?snap.component:c)};
  }}
  const next=clampComponent(proposal,2000,2000),before=footprint(old),after=footprint(next);
  // Keep the start of a run fixed as the selected unit grows or shrinks.
  if(!('x' in patch))next.x=old.x+(after.width-before.width)/2;
  if(!('z' in patch))next.z=old.z+(after.depth-before.depth)/2;
  const components=d.components.map(c=>({...c}));components[components.findIndex(c=>c.id===id)]=next;
  for(const axis of ['x','z'] as const){
    const dimension=axis==='x'?'width':'depth',cross=axis==='x'?'z':'x',crossDimension=axis==='x'?'depth':'width';
    const delta=next[axis]-old[axis]+(after[dimension]-before[dimension])/2;
    const movement=axis in patch ? next[axis]-old[axis] : delta;
    if(Math.abs(movement)<EPS)continue;
    const direction=Math.sign(movement);
    const queue=[id],moved=new Set([id]);
    // Carry exactly touching followers even on shrink, to keep seams closed.
    if(!(axis in patch)){
      const followers=[old];
      for(let q=0;q<followers.length;q++){const a=followers[q],af=footprint(a);
        for(const b of d.components){if(moved.has(b.id)||!sharesHeight(a,b))continue;const bf=footprint(b);
          if(Math.abs(a[cross]-b[cross])>=(af[crossDimension]+bf[crossDimension])/2-EPS)continue;
          if(Math.abs(a[axis]+af[dimension]/2-(b[axis]-bf[dimension]/2))<EPS){const target=components.find(c=>c.id===b.id)!;target[axis]+=movement;followers.push(b);moved.add(b.id);queue.push(b.id);}
        }
      }
    }
    // Resolve collisions forward until the entire pushed chain is clear.
    for(let q=0;q<queue.length;q++){if(q>components.length*components.length)return null;const a=components.find(c=>c.id===queue[q])!,af=footprint(a);
      for(const b of components){if(!componentsOverlap(a,b))continue;if(b.id===id)return null;
        const bf=footprint(b);b[axis]=a[axis]+direction*(af[dimension]+bf[dimension])/2;queue.push(b.id);
      }
    }
  }
  let left=-d.roomWidth/2,right=d.roomWidth/2,back=-d.roomDepth/2,front=d.roomDepth/2;
  for(const c of components){const f=footprint(c);left=Math.min(left,c.x-f.width/2);right=Math.max(right,c.x+f.width/2);back=Math.min(back,c.z-f.depth/2);front=Math.max(front,c.z+f.depth/2);}
  const roomWidth=right-left,roomDepth=front-back;if(roomWidth>720||roomDepth>720)return null;
  const shiftX=(left+right)/2,shiftZ=(back+front)/2;
  components.forEach(c=>{c.x-=shiftX;c.z-=shiftZ;});
  if(components.some(c=>!isPlacementValid(c,components,roomWidth,roomDepth)))return null;
  const result={...d,roomWidth,roomDepth,components,openings:fitOpenings(d).map(o=>({...o,offset:o.offset-(o.wall==='back'||o.wall==='front'?shiftX:shiftZ)}))};
  result.openings=fitOpenings(result);return result;
}

/** Move one boundary while keeping the opposite boundary fixed in world space. */
export function moveBoundary(d:KitchenDesign,side:import('./room.ts').WallSide,delta:number):KitchenDesign|null {
  if(!Number.isFinite(delta))return null;
  const horizontal=side==='left'||side==='right',axis=horizontal?'x':'z',dimension=horizontal?'width':'depth',sign=side==='left'||side==='back'?-1:1;
  const length=horizontal?d.roomWidth:d.roomDepth,newLength=length+delta;
  if(newLength<144||newLength>720)return null;
  const roomWidth=horizontal?newLength:d.roomWidth,roomDepth=horizontal?d.roomDepth:newLength;
  const components=d.components.map(c=>{const f=footprint(c),attached=Math.abs(c[axis]+sign*f[dimension]/2-sign*length/2)<3.01;return {...c,[axis]:c[axis]+(attached?sign*delta:0)-sign*delta/2};});
  if(components.some(c=>!isPlacementValid(c,components,roomWidth,roomDepth)))return null;
  const next={...d,roomWidth,roomDepth,components,openings:fitOpenings(d).map(o=>({...o,offset:o.offset-((o.wall==='back'||o.wall==='front')===horizontal?sign*delta/2:0)}))};
  next.openings=fitOpenings(next);if(next.openings.some(a=>next.openings.some(b=>openingsOverlap(a,b))))return null;return next;
}
