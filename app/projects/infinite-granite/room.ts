import { footprint, type KitchenDesign } from './kitchen.ts';
export const WALL_SIDES = ['back','right','front','left'] as const;
export type WallSide = typeof WALL_SIDES[number];
export interface RoomWall { enabled: boolean; height: number; }
export interface RoomOpening { id: string; wall: WallSide; kind: 'window'|'door'; offset: number; bottom: number; width: number; height: number; }
export type RoomWalls = Record<WallSide, RoomWall>;
export const defaultWalls = ():RoomWalls => ({back:{enabled:true,height:108},left:{enabled:true,height:108},right:{enabled:false,height:108},front:{enabled:false,height:108}});
export const defaultOpenings = ():RoomOpening[] => [{id:'window-default',wall:'back',kind:'window',offset:0,bottom:54,width:34,height:37}];
export const wallLength = (d:KitchenDesign,side:WallSide) => side==='back'||side==='front'?d.roomWidth:d.roomDepth;
export function fitOpenings(d:KitchenDesign):RoomOpening[] {
  const walls=d.roomWalls??defaultWalls();
  return (d.openings??defaultOpenings()).map(o=>{const length=wallLength(d,o.wall),height=walls[o.wall].height; const w=Math.min(o.width,length-8),h=Math.min(o.height,height-4);return {...o,width:w,height:h,offset:Math.max(-length/2+w/2+4,Math.min(length/2-w/2-4,o.offset)),bottom:o.kind==='door'?0:Math.max(0,Math.min(height-h-2,o.bottom))};});
}
export interface WallRect { left:number; right:number; bottom:number; top:number; }
/** Subtract openings from wall or backsplash rectangles, clipping every output to its source. */
export function cutOpenings(rect:WallRect,openings:RoomOpening[]):WallRect[] {
  let pieces=[rect];
  for(const o of openings){const l=o.offset-o.width/2,r=o.offset+o.width/2,b=o.bottom,t=b+o.height;
    pieces=pieces.flatMap(p=>{const x0=Math.max(p.left,l),x1=Math.min(p.right,r),y0=Math.max(p.bottom,b),y1=Math.min(p.top,t);if(x1<=x0||y1<=y0)return [p];return [{...p,right:x0},{...p,left:x1},{left:x0,right:x1,bottom:p.bottom,top:y0},{left:x0,right:x1,bottom:y1,top:p.top}].filter(q=>q.right-q.left>1e-6&&q.top-q.bottom>1e-6);});
  }return pieces;
}
export function backsplashRects(d:KitchenDesign,side:WallSide):WallRect[] {
  const length=wallLength(d,side),wall=(d.roomWalls??defaultWalls())[side];if(!wall.enabled||d.backsplash==='none')return [];
  const openings=fitOpenings(d).filter(o=>o.wall===side);
  return d.components.filter(c=>['base','sink','dishwasher'].includes(c.kind)).flatMap(c=>{
    const f=footprint(c),along=side==='back'||side==='front'?c.x:c.z,span=side==='back'||side==='front'?f.width:f.depth;
    const gap=side==='back'?c.z-f.depth/2+d.roomDepth/2:side==='front'?d.roomDepth/2-c.z-f.depth/2:side==='left'?c.x-f.width/2+d.roomWidth/2:d.roomWidth/2-c.x-f.width/2;
    if(Math.abs(gap)>3)return [];
    const rect={left:Math.max(-length/2,along-span/2),right:Math.min(length/2,along+span/2),bottom:c.height,top:Math.min(wall.height,c.height+18)};
    return rect.top>rect.bottom?cutOpenings(rect,openings):[];
  });
}

export function openingsOverlap(a:RoomOpening,b:RoomOpening):boolean {
  return a.id!==b.id&&a.wall===b.wall&&Math.abs(a.offset-b.offset)<(a.width+b.width)/2+2&&a.bottom<b.bottom+b.height+2&&b.bottom<a.bottom+a.height+2;
}
export function editOpening(d:KitchenDesign,opening:RoomOpening):KitchenDesign|null {
  const walls=d.roomWalls??defaultWalls();
  const next={...d,roomWalls:{...walls,[opening.wall]:{...walls[opening.wall],enabled:true}},openings:fitOpenings(d).map(o=>o.id===opening.id?opening:o)};
  next.openings=fitOpenings(next);const fitted=next.openings.find(o=>o.id===opening.id)!;
  if(next.openings.some(o=>openingsOverlap(o,fitted)))return null;
  return next;
}
export function addOpening(d:KitchenDesign,kind:RoomOpening['kind'],id:string):KitchenDesign|null {
  const walls=d.roomWalls??defaultWalls(),existing=fitOpenings(d);if(existing.length>=24)return null;
  for(const wall of WALL_SIDES.filter(s=>walls[s].enabled)){
    const length=wallLength(d,wall),width=36;
    const candidates=[0,...existing.filter(o=>o.wall===wall).flatMap(o=>[o.offset+(o.width+width)/2+4,o.offset-(o.width+width)/2-4]),-length/2+width/2+4,length/2-width/2-4];
    for(const offset of candidates){const o:RoomOpening={id,wall,kind,offset,width,height:kind==='door'?80:36,bottom:kind==='door'?0:54};if(Math.abs(offset)+width/2>length/2-4||existing.some(b=>openingsOverlap(o,b)))continue;return {...d,openings:[...existing,o]};}
  }return null;
}
