import {projection,LOWERS,type Point,type Quad} from './model.ts';

export const FLOOR_FINISHES=[
 {id:'wood',name:'Wood planks',detail:'Natural grain',color:'#b99b77'},
 {id:'porcelain',name:'Porcelain',detail:'24-inch square tiles',color:'#c9c6bf'},
 {id:'limestone',name:'Limestone',detail:'Honed stone tiles',color:'#c2b49c'},
 {id:'terrazzo',name:'Terrazzo',detail:'Fine stone chips',color:'#d0cbc0'},
] as const;
export type FloorFinish=typeof FLOOR_FINISHES[number]['id'];
export const FLOOR_COLORS=[
 {name:'Natural oak',color:'#b99b77'},{name:'Walnut',color:'#70503a'},
 {name:'Pale oak',color:'#d8c5a6'},{name:'Ivory',color:'#e4dfd3'},
 {name:'Sand',color:'#c2b49c'},{name:'Warm grey',color:'#aaa69e'},
 {name:'Slate',color:'#686d70'},{name:'Charcoal',color:'#414548'},
] as const;
// Paint the floor first, then the cabinet silhouettes. Their shared edges retain
// complementary subpixel coverage, including the recess underneath the island.
export const FLOOR:readonly Point[]=[[0,524],[48,512],[1493,634],[1536,648],[1536,1024],[0,1024]];
const FLOOR_PLANE:Quad=[[150,650],[1350,790],[1400,1024],[0,900]];
export const floorProjection=()=>projection(FLOOR_PLANE,[[0,0],[144,0],[144,72],[0,72]]);
const fract=(n:number)=>n-Math.floor(n);
const hash=(x:number,y:number)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453);
const smooth=(n:number)=>n*n*(3-2*n);
function noise(x:number,y:number){const ix=Math.floor(x),iy=Math.floor(y),fx=smooth(fract(x)),fy=smooth(fract(y));return (hash(ix,iy)*(1-fx)+hash(ix+1,iy)*fx)*(1-fy)+(hash(ix,iy+1)*(1-fx)+hash(ix+1,iy+1)*fx)*fy;}

/** Neutral finish variation in physical inches, shared by both visible floor areas. */
export function floorVariation(finish:FloorFinish,u:number,v:number){
 const size=finish==='limestone'?{x:24,y:16}:{x:24,y:24};
 const tx=u/size.x,ty=v/size.y,edge=Math.min(fract(tx),1-fract(tx),fract(ty),1-fract(ty));
 const grout=edge<.004? .75:edge<.01?.88:1;
 const tile=.98+hash(Math.floor(tx),Math.floor(ty))*.04;
 if(finish==='porcelain')return grout*tile*(.98+noise(u*.3,v*.3)*.04);
 if(finish==='limestone')return grout*tile*(.9+noise(u*.12,v*.12)*.12+noise(u*2,v*2)*.035);
 if(finish==='terrazzo'){
  const x=u*1.5,y=v*1.5,ix=Math.floor(x),iy=Math.floor(y);
  const cx=.2+hash(ix,iy)*.6,cy=.2+hash(ix+17,iy+9)*.6;
  const d=Math.hypot((fract(x)-cx)*1.1,fract(y)-cy),chip=d<.11+hash(ix+4,iy)*.14;
  return grout*(chip?.53+hash(ix+8,iy+2)*.7:.98+noise(u*3,v*3)*.025);
 }
 return 1;
}

/** Spatial relighting: cool dim window, warm under-cabinet pools, softer room light.
 * These gains modify the rendered finishes too, so exports match the selected view. */
export function nightLight(x:number,y:number):readonly[number,number,number]{
 const pool=(cx:number,cy:number,rx:number,ry:number)=>Math.exp(-(((x-cx)/rx)**2+((y-cy)/ry)**2));
 const warm=.40*pool(560,204,200,105)+.46*pool(1260,222,360,115)+.20*pool(880,490,630,290);
 const ambient=.29+.07*Math.min(1,x/800);
 const glass=x<49+y*.019&&y<377-x*.21;
 if(glass)return [.065,.085,.12];
 const windowFade=1-.40*pool(0,590,180,470);
 return [(ambient*.93+warm*1.14)*windowFade,(ambient*.97+warm*.96)*windowFade,(ambient*1.10+warm*.70)*windowFade];
}


/** Smooth floor illumination without baking the original wood grain into tile.
 * Cabinet contact shadows follow the same traced base used by the finish masks. */
export function floorLight(x:number,y:number){
 let distance=Infinity;
 for(const edge of [LOWERS[2].slice(3),LOWERS[3].slice(2,-1)])for(let j=0;j<edge.length-1;j++){
  const a=edge[j],b=edge[j+1],dx=b[0]-a[0],dy=b[1]-a[1];
  const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
  distance=Math.min(distance,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy));
 }
 return (.97-.2*x/1536+.40*Math.exp(-x/130))*(.65+.35*(1-Math.exp(-distance/16)));
}
