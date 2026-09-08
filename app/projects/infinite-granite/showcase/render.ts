import {MATERIALS,type CountertopMaterial} from '../materials';
import {materialTexture} from '../textures';
import {BASE_IMAGE,WIDTH,HEIGHT,SURFACES,UPPERS,LOWERS,OCCLUDERS,HARDWARE,slabProjections,type ShowcaseDesign} from './model';
import {surfaceCoverage,SAMPLE_COUNT} from './coverage';
const readImage=(url:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Image unavailable'));image.src=url;});
const canvas=()=>{const c=document.createElement('canvas');c.width=WIDTH;c.height=HEIGHT;return c;};
const rgb=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const mirror=(v:number)=>{const t=((v%2)+2)%2;return t<=1?t:2-t;};
export async function createShowcase(canvasElement:HTMLCanvasElement){
 const base=await readImage(BASE_IMAGE),plate=canvas(),ctx=plate.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(base,0,0,WIDTH,HEIGHT);
 const source=ctx.getImageData(0,0,WIDTH,HEIGHT),layers=SURFACES.length+3;
 const masks=surfaceCoverage(WIDTH,HEIGHT,[
  ...LOWERS.map(polygon=>({polygon,id:2})),...UPPERS.map(polygon=>({polygon,id:1})),
  ...SURFACES.map((s,i)=>({polygon:s.quad,id:i+3})),...OCCLUDERS.map(polygon=>({polygon,id:0})),
 ],layers),maps=slabProjections();
 const uv=new Float32Array(WIDTH*HEIGHT*2),dominant=new Uint8Array(WIDTH*HEIGHT);
 for(let p=0;p<WIDTH*HEIGHT;p++){
  const i=p*4,m=p*layers,x=p%WIDTH,y=Math.floor(p/WIDTH);
  if(source.data[i]>source.data[i+2]*1.35&&source.data[i+1]>source.data[i+2]*1.12&&HARDWARE.some(([l,t,r,b])=>x>=l&&x<=r&&y>=t&&y<=b)){
   masks[m]+=masks[m+1]+masks[m+2];masks[m+1]=masks[m+2]=0;
  }
  let id=0;for(let j=1;j<layers;j++)if(masks[m+j]>masks[m+id])id=j;
  dominant[p]=id;
  if(id>=3){const [u,v]=maps[id-3](x+.5,y+.5);uv[p*2]=u;uv[p*2+1]=v;}
 }
 canvasElement.width=WIDTH;canvasElement.height=HEIGHT;const output=canvasElement.getContext('2d')!;
 const cache=new Map<string,ImageData>();let disposed=false,request=0;
 async function texture(entry:CountertopMaterial){
  const cached=cache.get(entry.id);if(cached)return cached;
  let picture:HTMLImageElement|HTMLCanvasElement;
  if(entry.textureUrl)picture=await readImage(entry.textureUrl);else {const t=materialTexture(entry.id);picture=t.image as HTMLCanvasElement;t.dispose();}
  const c=document.createElement('canvas');c.width=Math.min(picture.width,1024);c.height=Math.max(1,Math.round(c.width*picture.height/picture.width));const context=c.getContext('2d',{willReadFrequently:true})!;
  // Vicostone source photographs include a narrow printed border outside the usable slab.
  const inset=entry.company==='Vicostone'?{x:.025,y:.09}:{x:0,y:0};context.drawImage(picture,picture.width*inset.x,picture.height*inset.y,picture.width*(1-2*inset.x),picture.height*(1-2*inset.y),0,0,c.width,c.height);
  const data=context.getImageData(0,0,c.width,c.height);if(!disposed){cache.set(entry.id,data);while(cache.size>4)cache.delete(cache.keys().next().value!);}return data;
 }
 return {
  async draw(design:ShowcaseDesign){
   const token=++request,entry=MATERIALS.find(m=>m.id===design.material)!;const t=await texture(entry);if(disposed||token!==request)return false;
   const result=new ImageData(new Uint8ClampedArray(source.data),WIDTH,HEIGHT),upper=rgb(design.upper),lower=rgb(design.lower),physicalWidth=entry.textureWidth??60,physicalHeight=entry.textureHeight??40;
   for(let p=0;p<WIDTH*HEIGHT;p++){
    const i=p*4,m=p*layers;if(masks[m]===SAMPLE_COUNT)continue;
    const r=source.data[i],g=source.data[i+1],b=source.data[i+2],light=r*.2126+g*.7152+b*.0722;
    const blended=[r,g,b].map(c=>c*masks[m]/SAMPLE_COUNT);
    for(let id=1;id<layers;id++){
     const a=masks[m+id]/SAMPLE_COUNT;if(!a)continue;
     if(id<=2){
      // Keep brass hardware and the deep joinery shadows from the photographic plate.
      const color=id===1?upper:lower,shade=Math.min(1.35,light/183);
      for(let k=0;k<3;k++)blended[k]+=Math.min(255,color[k]*shade)*a;
     }else{
      let [u,v]=id===dominant[p]?[uv[p*2],uv[p*2+1]]:maps[id-3](p%WIDTH+.5,Math.floor(p/WIDTH)+.5);
      if(design.rotation===90)[u,v]=[v,120-u];
      const x=mirror(u/(physicalWidth*design.scale))*(t.width-1),y=mirror(v/(physicalHeight*design.scale))*(t.height-1),x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0;
      const shade=Math.min(1.12,Math.max(.25,light/226)),reflection=id===3?Math.max(0,light-205)*.15:0;
      for(let k=0;k<3;k++){const at=(xx:number,yy:number)=>t.data[(yy*t.width+xx)*4+k];const color=(at(x0,y0)*(1-fx)+at(Math.min(x0+1,t.width-1),y0)*fx)*(1-fy)+(at(x0,Math.min(y0+1,t.height-1))*(1-fx)+at(Math.min(x0+1,t.width-1),Math.min(y0+1,t.height-1))*fx)*fy;blended[k]+=(color*shade+reflection)*a;}
     }
    }
    for(let k=0;k<3;k++)result.data[i+k]=blended[k];
   }
   output.putImageData(result,0,0);return true;
  },
  dispose(){disposed=true;request++;cache.clear();},
 };
}
