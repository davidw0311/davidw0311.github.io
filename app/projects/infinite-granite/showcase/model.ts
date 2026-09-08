import {MATERIALS} from '../materials.ts';
export const BASE_IMAGE='/assets/infinite-granite/showcase/kitchen-base.png';
export const WIDTH=1536,HEIGHT=1024;
export interface ShowcaseDesign {material:string;upper:string;lower:string;scale:number;rotation:0|90;}
export const INITIAL:ShowcaseDesign={material:'vicostone-bq8788',upper:'#d8d3c9',lower:'#a8aaa0',scale:1,rotation:0};
export function restoreShowcase(value:unknown):ShowcaseDesign|null {
 if(!value||typeof value!=='object')return null;const d=value as ShowcaseDesign;
 return MATERIALS.some(m=>m.id===d.material)&&[d.upper,d.lower].every(v=>typeof v==='string'&&/^#[\da-f]{6}$/i.test(v))&&Number.isFinite(d.scale)&&d.scale>=.7&&d.scale<=1.5&&[0,90].includes(d.rotation)?{material:d.material,upper:d.upper,lower:d.lower,scale:d.scale,rotation:d.rotation}:null;
}
export type Point=readonly[number,number];
export type Quad=readonly[Point,Point,Point,Point];
/** Solve a projective mapping: each photographed plane retains its own perspective. */
export function projection(from:Quad,to:Quad):(x:number,y:number)=>Point {
 const rows:number[][]=[];
 for(let i=0;i<4;i++){const [x,y]=from[i],[u,v]=to[i];rows.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);}
 for(let col=0;col<8;col++){let pivot=col;for(let r=col+1;r<8;r++)if(Math.abs(rows[r][col])>Math.abs(rows[pivot][col]))pivot=r;[rows[col],rows[pivot]]=[rows[pivot],rows[col]];const n=rows[col][col];if(Math.abs(n)<1e-10)throw new Error('Degenerate surface');for(let j=col;j<9;j++)rows[col][j]/=n;for(let r=0;r<8;r++)if(r!==col){const f=rows[r][col];for(let j=col;j<9;j++)rows[r][j]-=f*rows[col][j];}}
 const h=rows.map(r=>r[8]);return(x,y)=>{const z=h[6]*x+h[7]*y+1;return[(h[0]*x+h[1]*y+h[2])/z,(h[3]*x+h[4]*y+h[5])/z];};
}
export const SURFACES:{quad:Quad;uv:Quad}[]=[
 {quad:[[434,346],[1506,447],[1321,665],[21,426]],uv:[[0,0],[120,0],[120,42],[0,42]]},
 {quad:[[21,426],[1321,665],[1321,686],[22,438]],uv:[[0,42],[120,42],[120,43.25],[0,43.25]]},
 {quad:[[1506,447],[1507,463],[1321,686],[1321,665]],uv:[[120,0],[121.25,0],[121.25,42],[120,42]]},
 {quad:[[504,271],[1536,315],[1536,350],[410,294]],uv:[[0,0],[156,0],[156,24],[0,24]]},
 {quad:[[410,294],[1536,350],[1536,363],[410,300]],uv:[[0,24],[156,24],[156,25.25],[0,25.25]]},
];
export const UPPERS:Point[][]=[[[442,0],[708,0],[708,152],[441,152]],[[1019,0],[1536,0],[1536,164],[1020,161]]];
export const LOWERS:Point[][]=[[[199,0],[390,0],[390,353],[209,390]],[[420,299],[1536,363],[1536,608],[1495,599],[1496,465],[1507,447],[434,346],[420,349]],[[48,444],[1321,686],[1321,1024],[978,1024],[54,750]],[[1321,686],[1497,477],[1488,810],[1375,1024],[1321,1024]]];
export const OCCLUDERS:Point[][]=[[[665,294],[732,276],[964,278],[989,294],[940,312]],[[1367,336],[1393,320],[1536,329],[1536,351]],[[1469,307],[1490,307],[1490,330],[1469,330]],[[1497,212],[1536,212],[1536,333],[1497,328]],[[633,242],[672,244],[672,285],[636,285]],[[561,256],[609,256],[609,280],[558,279]]];

// Hardware exclusion regions are kept small so warm shadows on painted panels still recolor.
export const HARDWARE:readonly[number,number,number,number][]=[[257,218,289,271],[526,111,573,140],[1145,112,1194,143],[1454,114,1500,146],[178,484,232,529],[515,551,581,596],[962,645,1035,696],[451,312,511,337],[585,321,650,346],[959,350,1031,379],[1157,365,1224,393],[1424,382,1480,429]];

/** Thin edge quads are hand fitted to the photograph. Reuse the top's coordinate
 * along each shared seam, rather than fitting a second, incompatible perspective. */
export function slabProjections(){
 const maps=SURFACES.map(s=>projection(s.quad,s.uv));
 for(const [edge,top,axis,seam] of [[1,0,0,42],[2,0,1,120],[4,3,0,24]]){
  const original=maps[edge],toPhoto=projection(SURFACES[edge].uv,SURFACES[edge].quad),topMap=maps[top];
  maps[edge]=(x,y)=>{
   const uv=original(x,y),onSeam=axis===0?toPhoto(uv[0],seam):toPhoto(seam,uv[1]);
   const along=topMap(...onSeam);
   return axis===0?[along[0],uv[1]]:[uv[0],along[1]];
  };
 }
 return maps;
}
