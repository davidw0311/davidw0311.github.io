import * as THREE from 'three';
import { MATERIALS } from './kitchen';

export function materialTexture(id: string, neutral = false): THREE.CanvasTexture {
  const entry = MATERIALS.find(m => m.id === id) ?? MATERIALS[0];
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  let seed = 47;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  ctx.fillStyle = entry.color; ctx.fillRect(0, 0, 512, 512);
  if (entry.pattern === 'wood') {
    for (let y = 0; y < 512; y += 64) {
      ctx.fillStyle = `rgba(70,35,12,${0.025 + random() * 0.12})`; ctx.fillRect(0, y, 512, 64);
      ctx.strokeStyle = 'rgba(68,39,13,.24)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
      for (let j = 0; j < 45; j++) {
        ctx.strokeStyle = `rgba(66,36,16,${0.02 + random() * .15})`; ctx.lineWidth = .4 + random();
        const offset = y + random() * 64;
        ctx.beginPath(); ctx.moveTo(0, offset); ctx.bezierCurveTo(150, offset + random() * 7, 370, offset - random() * 7, 512, offset); ctx.stroke();
      }
    }
  } else if (entry.pattern === 'vein') {
    for (let v = 0; v < 13; v++) {
      const start = random() * 900 - 220;
      for (let layer = 0; layer < 3; layer++) {
        ctx.globalAlpha = layer === 0 ? .06 : layer === 1 ? .13 : .37;
        ctx.strokeStyle = entry.vein; ctx.lineWidth = layer === 0 ? 16 : layer === 1 ? 5 : .7;
        ctx.beginPath();
        for (let x = -20; x <= 532; x += 4) {
          const y = start + x * .48 + Math.sin(x * .024 + v) * 19 + Math.sin(x * .067 + v * 3) * 3;
          if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  } else {
    const count = entry.pattern === 'cloud' ? 5000 : entry.pattern === 'chips' ? 600 : entry.id === 'absolute' ? 9000 : 23000;
    for (let i = 0; i < count; i++) {
      const x = random() * 512, y = random() * 512;
      const size = entry.pattern === 'chips' ? 2 + random() * 7 : entry.pattern === 'cloud' ? random() * 24 : .5 + random() * 2.6;
      ctx.globalAlpha = entry.pattern === 'cloud' ? .015 : random() * (entry.id === 'absolute' ? .2 : .6);
      ctx.fillStyle = random() > .6 ? '#ffffff' : entry.vein;
      ctx.beginPath(); ctx.ellipse(x, y, size, size * .65, random() * Math.PI, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // Fine mineral texture keeps the broad patterns from looking printed flat.
  for (let i = 0; i < 15000; i++) {
    ctx.fillStyle = random() > .5 ? 'rgba(0,0,0,.025)' : 'rgba(255,255,255,.04)';
    ctx.fillRect(random() * 512, random() * 512, 1, 1);
  }
  if(neutral){const pixels=ctx.getImageData(0,0,512,512),base=parseInt(entry.color.slice(1),16),light=((base>>16)*.2126+((base>>8)&255)*.7152+(base&255)*.0722);for(let i=0;i<pixels.data.length;i+=4){const shade=Math.min(255,255*(pixels.data[i]*.2126+pixels.data[i+1]*.7152+pixels.data[i+2]*.0722)/Math.max(1,light));pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=shade;}ctx.putImageData(pixels,0,0);}
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
