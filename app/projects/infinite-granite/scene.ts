import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { FINISHES, MATERIALS, sinkOpening, type KitchenDesign, type KitchenComponent } from './kitchen';
import { materialTexture } from './textures';

export type ViewMode = 'perspective' | 'top' | 'front';
export interface SceneOptions { selected: string | null; walls: boolean; dimensions: boolean; }
export interface KitchenScene {
  update: (design: KitchenDesign, options: SceneOptions) => void;
  view: (mode: ViewMode) => void;
  zoom: (factor: number) => void;
  orbit: (angle: number) => void;
  screenshot: () => string;
  dispose: () => void;
}
export function createKitchenScene(host: HTMLElement, onSelect: (id: string | null) => void, onError: (message: string) => void): KitchenScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .88;
  renderer.domElement.setAttribute('aria-label', 'Interactive kitchen. Drag to orbit; pinch or scroll to zoom. Select components by clicking, or use the Components panel.');
  renderer.domElement.tabIndex = 0;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 1, 2400);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false; controls.minDistance = 80; controls.maxDistance = 1100;
  controls.maxPolarAngle = Math.PI / 2 - .035; controls.minPolarAngle = .015;
  controls.screenSpacePanning = true;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = new RoomEnvironment();
  const envMap = pmrem.fromScene(environment, .04);
  scene.environment = envMap.texture; scene.environmentIntensity = .4;
  environment.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#ffffff', '#a2a497', 1.7));
  const sun = new THREE.DirectionalLight('#fff6e9', 2.1); sun.position.set(-120, 300, 150); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -250; sun.shadow.camera.right = 250; sun.shadow.camera.top = 250; sun.shadow.camera.bottom = -250;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 800; sun.shadow.normalBias = .18; sun.shadow.bias = -.0001;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#e5efff', 1.4); fill.position.set(220, 160, -130); scene.add(fill);
  const model = new THREE.Group(); scene.add(model);
  const textures = new Map<string, THREE.CanvasTexture>();
  let current: KitchenDesign; let options: SceneOptions; let viewMode: ViewMode = 'perspective'; let disposed = false;
  let pickables: THREE.Object3D[] = [];
  const render = () => { if (!disposed) renderer.render(scene, camera); };
  controls.addEventListener('change', render);
  const resize = () => {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); render();
  };
  const observer = new ResizeObserver(resize); observer.observe(host);
  function mat(color: string, roughness = .65, metalness = 0) { return new THREE.MeshStandardMaterial({ color, roughness, metalness }); }
  function stone(id: string) {
    if (!textures.has(id)) textures.set(id, materialTexture(id));
    const entry = MATERIALS.find(m => m.id === id) ?? MATERIALS[0];
    const material = new THREE.MeshStandardMaterial({ map: textures.get(id), roughness: entry.roughness, metalness: .02 });
    material.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vStonePosition;\nvarying vec3 vStoneNormal;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvStonePosition = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvStoneNormal = normalize(mat3(modelMatrix) * normal);');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vStonePosition;\nvarying vec3 vStoneNormal;').replace('#include <map_fragment>', '#ifdef USE_MAP\nvec3 weights = pow(abs(normalize(vStoneNormal)), vec3(6.0));\nweights /= (weights.x + weights.y + weights.z);\nvec4 stoneSample = texture2D(map, vStonePosition.yz / 48.0) * weights.x + texture2D(map, vStonePosition.xz / 48.0) * weights.y + texture2D(map, vStonePosition.xy / 48.0) * weights.z;\ndiffuseColor *= stoneSample;\n#endif');
    };
    material.customProgramCacheKey = () => 'infinitegranite-world-stone-v2';
    return material;
  }
  function box(parent: THREE.Object3D, width: number, height: number, depth: number, x: number, y: number, z: number, material: THREE.Material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(Math.max(width, .01), Math.max(height, .01), Math.max(depth, .01)), material);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function cylinder(parent: THREE.Object3D, radius: number, height: number, x: number, y: number, z: number, material: THREE.Material, radiusTop = radius) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radius, height, 20), material);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function tube(parent: THREE.Object3D, points: number[][], radius: number, material: THREE.Material) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p as [number, number, number])));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, radius, 10, false), material); mesh.castShadow = true; parent.add(mesh);
  }
  function disposeModel() {
    const materials = new Set<THREE.Material>();
    model.traverse(o => {
      if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m)); }
      if (o instanceof THREE.Sprite) { o.material.map?.dispose(); materials.add(o.material); }
    });
    materials.forEach(m => m.dispose()); model.clear(); pickables = [];
  }
  function label(text: string, x: number, y: number, z: number) {
    const canvas = document.createElement('canvas'); canvas.width = 384; canvas.height = 80;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#eef1ee'; ctx.fillRect(0, 0, 384, 80);
    ctx.fillStyle = '#253c34'; ctx.font = '500 36px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 192, 42);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false })); sprite.scale.set(47, 10, 1); sprite.position.set(x, y, z); model.add(sprite);
  }
  function cupboard(parent: THREE.Object3D, c: KitchenComponent, color: string, yBase: number, height: number) {
    const { width: w, depth: d } = c;
    const body = color === '#b78d60' ? stone('butcher') : mat(color); const inner = mat(new THREE.Color(color).multiplyScalar(.87).getStyle());
    const metal = mat(FINISHES.find(f => f.id === current.hardware)!.color, .28, current.hardware === 'black' ? .25 : .8);
    const toe = c.kind === 'upper' ? 0 : 4;
    // Hollow carcass leaves the sink bowl visible below its cutout.
    for (const side of [-1, 1]) box(parent, .7, height - toe, d - .3, side * (w / 2 - .45), yBase + toe + (height - toe) / 2, 0, body);
    box(parent, w - .3, height - toe, .65, 0, yBase + toe + (height - toe) / 2, -d / 2 + .4, body);
    box(parent, w - .3, .7, d - .3, 0, yBase + toe + .35, 0, body);
    if (c.kind === 'upper' || c.kind === 'pantry') box(parent, w - .3, .7, d - .3, 0, yBase + height - .35, 0, body);
    if (toe) box(parent, w - 2, 4, d - 3, 0, yBase + 2, -1.5, mat('#3e4440'));
    const doors = Math.max(1, Math.ceil(w / 22)); const doorW = w / doors;
    for (let i = 0; i < doors; i++) {
      const x = -w / 2 + doorW * (i + .5), doorH = height - toe - .5, y = yBase + toe + doorH / 2;
      box(parent, doorW - .28, doorH, .8, x, y, d / 2 + .1, current.doorStyle === 'slab' ? body : inner);
      if (current.doorStyle !== 'slab') {
        const rail = current.doorStyle === 'shaker' ? 2.25 : .85;
        box(parent, doorW - .28, rail, .6, x, y + doorH / 2 - rail / 2, d / 2 + .65, body);
        box(parent, doorW - .28, rail, .6, x, y - doorH / 2 + rail / 2, d / 2 + .65, body);
        box(parent, rail, doorH - rail * 2, .6, x - doorW / 2 + rail / 2 + .14, y, d / 2 + .65, body);
        box(parent, rail, doorH - rail * 2, .6, x + doorW / 2 - rail / 2 - .14, y, d / 2 + .65, body);
      }
      const hy = c.kind === 'upper' ? yBase + 4 : yBase + height - 4;
      box(parent, 5, .45, .5, x, hy, d / 2 + 1.7, metal);
      for (const offset of [-2, 2]) box(parent, .4, .4, 1, x + offset, hy, d / 2 + 1.15, metal);
    }
  }
  function counter(parent: THREE.Object3D, c: KitchenComponent, material: THREE.Material, hole = false) {
    const w = c.width + .35, d = c.depth + 1.25, h = current.counterThickness, top = c.height - h / 2;
    if (!hole) box(parent, w, h, d, 0, top, .5, material);
    else {
      const opening = sinkOpening(c, current.sinkStyle), ow = opening.width, od = opening.depth;
      box(parent, (w - ow) / 2, h, d, -(w + ow) / 4, top, .5, material);
      box(parent, (w - ow) / 2, h, d, (w + ow) / 4, top, .5, material);
      box(parent, ow, h, (d - od) / 2, 0, top, -(d + od) / 4 + .5, material);
      box(parent, ow, h, (d - od) / 2, 0, top, (d + od) / 4 + .5, material);
    }
    if (c.kind === 'island' && current.waterfall) for (const sign of [-1, 1]) box(parent, h, c.height, d, sign * (w - h) / 2, c.height / 2, .5, material);
  }
  function sink(parent: THREE.Object3D, c: KitchenComponent) {
    const opening = sinkOpening(c, current.sinkStyle); const w = opening.width, d = opening.depth, y = c.height;
    const finish = FINISHES.find(f => f.id === current.sinkFinish)!;
    const surface = mat(finish.color, current.sinkFinish === 'white' ? .22 : .3, ['steel','brass'].includes(current.sinkFinish) ? .82 : .1);
    // A hollow basin and an actual opening in the worktop, with no solid slab across it.
    box(parent, w, .6, d, 0, y - 8, .5, surface);
    for (const side of [-1, 1]) box(parent, .65, 8, d, side * (w / 2 - .32), y - 4, .5, surface);
    for (const side of [-1, 1]) box(parent, w, 8, .65, 0, y - 4, .5 + side * (d / 2 - .32), surface);
    for (const side of [-1, 1]) {
      box(parent, w + 1, .45, .75, 0, y + .12, .5 + side * d / 2, surface);
      box(parent, .75, .45, d, side * w / 2, y + .12, .5, surface);
    }
    if (current.sinkStyle === 'double') box(parent, .8, 7, d, 0, y - 4, .5, surface);
    if (current.sinkStyle === 'apron') box(parent, w + 1, 9, 2, 0, y - 4, c.depth / 2 + 1, surface);
    cylinder(parent, 1.1, .12, current.sinkStyle === 'double' ? -w / 4 : 0, y - 7.65, .5, mat('#3e4648', .3, .8));
    if (current.sinkStyle === 'double') cylinder(parent, 1.1, .12, w / 4, y - 7.65, .5, mat('#3e4648', .3, .8));
    const faucet = mat(FINISHES.find(f => f.id === current.hardware)!.color, .2, .85), back = -d / 2 - 1;
    cylinder(parent, 1.1, .5, 0, y + .4, back, faucet);
    if (current.faucet === 'arc') tube(parent, [[0,y,back],[0,y+10,back],[0,y+14,back+4],[0,y+11,back+8]], .58, faucet);
    else { box(parent, 1.1, 13, 1.1, 0, y + 6.5, back, faucet); box(parent, 1.1, 1.1, 8, 0, y + 13, back + 3.5, faucet); box(parent, 1.1, 2, 1.1, 0, y + 12, back + 7, faucet); }
    box(parent, .5, 3.5, .6, 2, y + 2.7, back, faucet);
  }
  function appliance(parent: THREE.Object3D, c: KitchenComponent) {
    const {width:w,depth:d} = c;
    const h = c.kind === 'dishwasher' ? c.height - current.counterThickness : c.height;
    const surface = mat(c.color ?? '#adb5b7', .3, .7), dark = mat('#202a2d', .23, .15), glass = mat('#162127', .12, .35);
    box(parent, w - .2, h, d, 0, h/2, 0, surface);
    if (c.kind === 'fridge') {
      for (const sign of [-1,1]) {
        box(parent, w/2-.3,h*.65,1,sign*w/4,h*.675,d/2+.4,surface);
        box(parent, .65,20,1,sign*2,h*.63,d/2+2, dark);
      }
      box(parent,w-.5,h*.3,1,0,h*.16,d/2+.6,surface); box(parent,w*.55,.7,1,0,h*.29,d/2+2,dark);
    } else if (c.kind === 'range') {
      box(parent,w-.4,.8,d,0,h+.3,0,dark);
      for (const x of [-w*.24,w*.24]) for (const z of [-d*.24,d*.24]) {
        cylinder(parent,4.5,.3,x,h+.8,z,mat('#505b5e', .3,.8)); cylinder(parent,3.6,.35,x,h+1,z,dark);
      }
      box(parent,w-4,h*.52,1,0,h*.4,d/2+.6,glass); box(parent,w-5,.8,1.2,0,h*.73,d/2+1.5,dark);
      for (let i=0;i<4;i++) { const knob=cylinder(parent,.9,.7,-w*.3+i*w*.2,h*.88,d/2+1,surface); knob.rotation.x=Math.PI/2; }
      box(parent,w-.3,4,19,0,68,-2,surface); box(parent,w*.6,7,13,0,73,-5,surface); box(parent,w*.36,20,10,0,86,-7,surface);
    } else {
      box(parent,w-.5,h-5,1,0,(h-5)/2+3,d/2+.4,surface); box(parent,w*.7,.8,1.3,0,h-5,d/2+1.4,dark);
    }
  }
  function room() {
    const w=current.roomWidth,d=current.roomDepth;
    box(model,w+4,4,d+4,0,-2.2,0,mat('#c9cfcb'));
    if (current.floor === 'tile') {
      const material = mat('#ccceca',.85), grout=mat('#aeb3af'); box(model,w,.2,d,0,.01,0,grout);
      for(let x=-w/2;x<w/2;x+=24) for(let z=-d/2;z<d/2;z+=24) { const tw=Math.min(23.75,w/2-x),td=Math.min(23.75,d/2-z); box(model,tw,.22,td,x+tw/2,.2,z+td/2,material); }
    } else {
      const wood=stone('butcher'); wood.color.set(current.floor==='walnut'?'#746158':'#d4c7b0');
      const seam=mat(current.floor==='walnut'?'#675244':'#bdac91'); box(model,w,.3,d,0,.1,0,seam);
      for(let z=-d/2;z<d/2;z+=6) { const depth=Math.min(5.88,d/2-z); box(model,w-.15,.25,depth,0,.4,z+depth/2,wood); }
    }
    if (options.walls) {
      const wall=mat(current.wallColor,.9);
      // Back wall contains a real window opening centered above the sink.
      box(model,w,54,2,0,27,-d/2-1,wall);
      box(model,w,17,2,0,99.5,-d/2-1,wall);
      box(model,(w-34)/2,37,2,-(w+34)/4,72.5,-d/2-1,wall);
      box(model,(w-34)/2,37,2,(w+34)/4,72.5,-d/2-1,wall);
      const windowMat=mat('#d6e8e8',.3); box(model,33,36,.5,0,72.5,-d/2-1.2,windowMat);
      const trim=mat('#f7f8f4');
      for(const x of [-17.5,0,17.5]) box(model,1.3,38,3,x,72.5,-d/2+.2,trim);
      for(const y of [54,72.5,91]) box(model,37,1.3,3,0,y,-d/2+.2,trim);
      box(model,39,1,6,0,53.5,-d/2+1.8,trim);
      box(model,2,108,d,-w/2-1,54,0,wall);
      box(model,1,5,d,-w/2+.2,2.5,0,trim);
      if (current.backsplash !== 'none') {
        const tile=current.backsplash==='slab'?stone(current.countertop):mat('#f0f1ea',.3);
        box(model,w-.5,17,.4,0,44.8,-d/2+.3,tile);
        if(current.backsplash==='subway') {
          const grout=mat('#c3cbc4',.9);
          for(let y=37;y<54;y+=3) {box(model,w,.10,.08,0,y,-d/2+.56,grout); for(let x=-w/2+(y%2)*4;x<w/2;x+=9) box(model,.1,3,.08,x,y+1.5,-d/2+.56,grout);}
        }
      }
    }
    if (options.dimensions) {
      label(`${Math.floor(w/12)}′ ${w%12}″`,0,2,d/2+10);
      label(`${Math.floor(d/12)}′ ${d%12}″`,w/2+17,2,0);
    }
  }
  function update(design: KitchenDesign, nextOptions: SceneOptions) {
    current=design;options=nextOptions;disposeModel();room();
    for(const c of design.components) {
      const group=new THREE.Group();group.position.set(c.x,0,c.z);group.rotation.y=c.rotation*Math.PI/180;group.userData.componentId=c.id;model.add(group);
      const color=c.color ?? (c.kind==='upper'?design.upperColor:c.kind==='island'?design.islandColor:design.cabinetColor);
      if(['fridge','range','dishwasher'].includes(c.kind)) {
        appliance(group,c);if(c.kind==='dishwasher')counter(group,c,stone(c.material??design.countertop));
      } else {
        const y=c.kind==='upper'?54:0;
        cupboard(group,c,color,y,c.kind==='upper'||c.kind==='pantry'?c.height:c.height-design.counterThickness);
        if(!['upper','pantry'].includes(c.kind))counter(group,c,stone(c.material??design.countertop),c.kind==='sink');
        if(c.kind==='sink')sink(group,c);
      }
      group.traverse(o=>{o.userData.componentId=c.id;if(o instanceof THREE.Mesh)pickables.push(o);});
      if(c.id===options.selected){
        const outline=new THREE.Box3Helper(new THREE.Box3().setFromObject(group),new THREE.Color('#218966'));model.add(outline);
      }
    }
    render();
  }
  function view(mode: ViewMode) {
    viewMode=mode;
    const size=Math.max(current?.roomWidth??216,current?.roomDepth??192);
    const narrow=host.clientWidth/host.clientHeight<1;
    controls.target.set(0,mode==='top'?0:26,-6);
    if(mode==='top')camera.position.set(0,size*(narrow?2.15:1.65),0.5);
    else if(mode==='front')camera.position.set(0,65,size*(narrow?2.8:1.95));
    else camera.position.set(size*1.17,size*1.02,size*1.38).multiplyScalar(narrow?1.3:1);
    camera.lookAt(controls.target);controls.update();render();
  }
  const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();let down: {x:number;y:number;id:number}|null=null; const pointers = new Set<number>();
  const pointerDown=(event:PointerEvent)=>{pointers.add(event.pointerId);down=pointers.size===1?{x:event.clientX,y:event.clientY,id:event.pointerId}:null;};
  const pointerCancel=(event:PointerEvent)=>{pointers.delete(event.pointerId);down=null;};
  const pointerUp=(event:PointerEvent)=>{
    pointers.delete(event.pointerId);
    if(!down||down.id!==event.pointerId||pointers.size>0||Math.hypot(event.clientX-down.x,event.clientY-down.y)>5){down=null;return;}down=null;
    const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(pickables,false)[0];onSelect(hit?.object.userData.componentId??null);
  };
  const zoom=(factor:number)=>{const delta=camera.position.clone().sub(controls.target);delta.multiplyScalar(factor).clampLength(controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(delta);controls.update();render();};
  const orbit=(angle:number)=>{const delta=camera.position.clone().sub(controls.target);delta.applyAxisAngle(new THREE.Vector3(0,1,0),angle);camera.position.copy(controls.target).add(delta);controls.update();render();};
  const keyDown=(e:KeyboardEvent)=>{if(['ArrowLeft','ArrowRight','+','=','-','0'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')orbit(-.15);else if(e.key==='ArrowRight')orbit(.15);else if(e.key==='0')view(viewMode);else zoom(e.key==='-'?1.1:.9);}};
  const lost=(e:Event)=>{e.preventDefault();onError('The 3D view was paused by your device. Reload the view to continue with your current design.');};
  renderer.domElement.addEventListener('pointercancel',pointerCancel);renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('keydown',keyDown);renderer.domElement.addEventListener('webglcontextlost',lost);
  resize();view('perspective');
  return {update,view,zoom,orbit,screenshot:()=>{render();return renderer.domElement.toDataURL('image/png');},dispose:()=>{disposed=true;observer.disconnect();controls.dispose();disposeModel();textures.forEach(t=>t.dispose());envMap.dispose();sun.shadow.dispose();renderer.dispose();renderer.domElement.remove();}};
}
