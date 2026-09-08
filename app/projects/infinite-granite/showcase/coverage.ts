import type {Point} from './model.ts';

export const SAMPLES=4;
export const SAMPLE_COUNT=SAMPLES*SAMPLES;
export interface Region {polygon:readonly Point[];id:number}

/** Rasterize categorical surfaces before filtering. Each subpixel belongs to exactly
 * one region, including background, so touching faces never expose the white plate. */
export function surfaceCoverage(width:number,height:number,regions:readonly Region[],layers:number){
 const sw=width*SAMPLES,sh=height*SAMPLES,labels=new Uint8Array(sw*sh);
 for(const {polygon,id} of regions){
  const first=Math.max(0,Math.ceil(Math.min(...polygon.map(p=>p[1]))*SAMPLES-.5));
  const end=Math.min(sh,Math.ceil(Math.max(...polygon.map(p=>p[1]))*SAMPLES-.5));
  for(let y=first;y<end;y++){
   const py=(y+.5)/SAMPLES,crossings:number[]=[];
   for(let j=0;j<polygon.length;j++){
    const a=polygon[j],b=polygon[(j+1)%polygon.length];
    if((a[1]>py)!==(b[1]>py))crossings.push(a[0]+(py-a[1])*(b[0]-a[0])/(b[1]-a[1]));
   }
   crossings.sort((a,b)=>a-b);
   for(let j=0;j+1<crossings.length;j+=2){
    const left=Math.max(0,Math.ceil(crossings[j]*SAMPLES-.5)),right=Math.min(sw,Math.ceil(crossings[j+1]*SAMPLES-.5));
    if(right>left)labels.fill(id,y*sw+left,y*sw+right);
   }
  }
 }
 const coverage=new Uint8Array(width*height*layers);
 for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)coverage[(Math.floor(y/SAMPLES)*width+Math.floor(x/SAMPLES))*layers+labels[y*sw+x]]++;
 return coverage;
}
