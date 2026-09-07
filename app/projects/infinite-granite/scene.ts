import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FINISHES, MATERIALS, sinkOpening, type KitchenDesign, type KitchenComponent } from './kitchen';
import { materialTexture } from './textures';
import { defaultWalls, fitOpenings, WALL_SIDES, wallLength, cutOpenings, backsplashRects } from './room';
import { countertopGeometry } from './sceneGeometry';

export type ViewMode = 'perspective' | 'top' | 'front';
export interface SceneOptions { selected: string | null; walls: boolean; dimensions: boolean; hidden?: string[]; hideUppers?: boolean; hideAppliances?: boolean; hideBacksplash?: boolean; hideWindows?: boolean; }
export interface KitchenScene {
  update: (design: KitchenDesign, options: SceneOptions) => void;
  view: (mode: ViewMode) => void;
  zoom: (factor: number) => void;
  orbit: (angle: number) => void;
  shiftVector: (horizontal:number,vertical:number) => {x:number;z:number};
  screenshot: () => string;
  dispose: () => void;
}
/** Supplier images are preview photographs; their source dimensions preserve slab proportions. */
type SceneMaterial = (typeof MATERIALS)[number] & { textureUrl?: string; textureWidth?: number; textureHeight?: number };
type CachedTexture = {
  texture: THREE.Texture;
  entry: SceneMaterial;
  state: 'queued' | 'loading' | 'ready' | 'failed';
  pending?: THREE.Texture;
  touched: number;
};

export function createKitchenScene(host: HTMLElement, onSelect: (id: string | null) => void, onError: (message: string) => void, onTextureStatus: (message: string | null) => void = () => {}): KitchenScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
  // Initialization can fail after WebGL allocates its context; return every acquired resource.
  const initializationCleanup: (() => void)[] = [() => renderer.dispose(), () => renderer.domElement.remove()];
  try {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .95;
  // Geometry changes invalidate shadows; orbiting and texture changes do not.
  renderer.shadowMap.autoUpdate = false;
  renderer.domElement.setAttribute('aria-label', 'Interactive kitchen. Drag to orbit; pinch or scroll to zoom. Select components by clicking, or use the Components panel.');
  renderer.domElement.tabIndex = 0;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 1, 2400);
  const controls = new OrbitControls(camera, renderer.domElement);
  initializationCleanup.push(() => controls.dispose());
  controls.enableDamping = false; controls.minDistance = 80; controls.maxDistance = 1100;
  controls.maxPolarAngle = Math.PI / 2 - .035; controls.minPolarAngle = .015;
  controls.screenSpacePanning = true;
  const pmrem = new THREE.PMREMGenerator(renderer);
  initializationCleanup.push(() => pmrem.dispose());
  const environment = new RoomEnvironment();
  initializationCleanup.push(() => environment.dispose());
  const envMap = pmrem.fromScene(environment, .04);
  initializationCleanup.push(() => envMap.dispose());
  scene.environment = envMap.texture; scene.environmentIntensity = .7;
  environment.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#f5f8ff', '#807767', .8));
  const sun = new THREE.DirectionalLight('#fff6e9', 2.8); sun.position.set(-120, 300, 150); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -250; sun.shadow.camera.right = 250; sun.shadow.camera.top = 250; sun.shadow.camera.bottom = -250;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 800; sun.shadow.normalBias = .09; sun.shadow.bias = -.00008; sun.shadow.radius = 3.5;
  scene.add(sun);
  initializationCleanup.push(() => sun.shadow.dispose());
  const fill = new THREE.DirectionalLight('#e5efff', .65); fill.position.set(220, 160, -130); scene.add(fill);
  const model = new THREE.Group(); scene.add(model);
  const textures = new Map<string, CachedTexture>();
  const activeTextureIds = new Set<string>();
  const textureLoader = new THREE.TextureLoader();
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  let textureClock = 0;
  let activeLoads = 0;
  let lastTextureStatus: string | null = null;
  let current: KitchenDesign; let options: SceneOptions; let viewMode: ViewMode = 'perspective'; let disposed = false;
  let pickables: THREE.Object3D[] = [];
  const render = () => { if (!disposed) renderer.render(scene, camera); };
  controls.addEventListener('change', render);
  let previousAspect: number | null = null;
  const resize = () => {
    if (disposed) return;
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    const aspect = width / height;
    if (previousAspect !== null && Math.abs(aspect - previousAspect) > .015) {
      // Preserve the user's direction and target while keeping a comparable room fit after rotation.
      const fit = (value: number) => Math.max(1, 1 / value);
      const delta = camera.position.clone().sub(controls.target).multiplyScalar(fit(aspect) / fit(previousAspect));
      delta.clampLength(controls.minDistance, controls.maxDistance);
      camera.position.copy(controls.target).add(delta);
    }
    previousAspect = aspect;
    renderer.setSize(width, height); camera.aspect = aspect; camera.updateProjectionMatrix(); controls.update(); render();
  };
  const observer = new ResizeObserver(resize);
  initializationCleanup.push(() => observer.disconnect()); observer.observe(host);
  function mat(color: string, roughness = .65, metalness = 0) { return new THREE.MeshStandardMaterial({ color, roughness, metalness }); }
  function textureStatus() {
    if (disposed) return;
    const active = [...activeTextureIds].map(id => textures.get(id)).filter((item): item is CachedTexture => !!item);
    const failed = active.filter(item => item.state === 'failed');
    const loading = active.filter(item => item.state === 'queued' || item.state === 'loading');
    const message = failed.length
      ? `Texture unavailable: ${failed.map(item => item.entry.name).join(', ')}. A flat colour preview is shown; choose another finish or reload to retry.`
      : loading.length ? `Loading ${loading.length === 1 ? loading[0].entry.name : `${loading.length} stone`} texture${loading.length === 1 ? '' : 's'}… A flat colour preview is shown until ready.` : null;
    if (lastTextureStatus !== message) { lastTextureStatus = message; onTextureStatus(message); }
  }
  function trimTextureCache() {
    const limit = Math.max(8, activeTextureIds.size);
    const inactive = [...textures.entries()].filter(([id]) => !activeTextureIds.has(id)).sort((a, b) => a[1].touched - b[1].touched);
    for (const [id, record] of inactive) {
      if (textures.size <= limit) break;
      textures.delete(id); record.texture.dispose(); record.pending?.dispose();
    }
  }
  function startTextureLoads() {
    if (disposed) return;
    for (const [id, record] of textures) {
      if (activeLoads >= 3) break;
      if (record.state !== 'queued' || !activeTextureIds.has(id) || !record.entry.textureUrl) continue;
      record.state = 'loading'; activeLoads++;
      record.pending = textureLoader.load(record.entry.textureUrl, loaded => {
        activeLoads--;
        if (disposed || textures.get(id) !== record) { loaded.dispose(); if (!disposed) startTextureLoads(); return; }
        // WebGL 2 texture storage is immutable: release the 1×1 placeholder allocation
        // before uploading the differently sized image through the same material references.
        record.texture.dispose();
        record.texture.image = loaded.image; record.texture.needsUpdate = true;
        loaded.dispose(); record.pending = undefined; record.state = 'ready';
        trimTextureCache(); textureStatus(); startTextureLoads();
        if (activeTextureIds.has(id)) render();
      }, undefined, () => {
        activeLoads--;
        record.pending?.dispose(); record.pending = undefined;
        if (disposed || textures.get(id) !== record) { if (!disposed) startTextureLoads(); return; }
        record.state = 'failed'; trimTextureCache(); textureStatus(); startTextureLoads();
      });
    }
  }
  function textureFor(entry: SceneMaterial) {
    activeTextureIds.add(entry.id);
    let record = textures.get(entry.id);
    if (!record) {
      let texture: THREE.Texture;
      if (entry.textureUrl) {
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
        const context = canvas.getContext('2d')!;
        context.fillStyle = entry.color; context.fillRect(0, 0, 1, 1);
        texture = new THREE.CanvasTexture(canvas);
      } else texture = materialTexture(entry.id);
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = anisotropy;
      record = { texture, entry, state: entry.textureUrl ? 'queued' : 'ready', touched: ++textureClock };
      textures.set(entry.id, record);
    }
    record.touched = ++textureClock;
    return record.texture;
  }
  function stone(id: string) {
    const entry: SceneMaterial = MATERIALS.find(m => m.id === id) ?? MATERIALS[0];
    const polished = entry.roughness < .45;
    const enhancePattern = entry.family !== 'Wood';
    const material = new THREE.MeshPhysicalMaterial({
      map: textureFor(entry), roughness: enhancePattern ? Math.max(.34, entry.roughness) : entry.roughness, metalness: 0,
      clearcoat: polished ? (enhancePattern ? .06 : .24) : 0, clearcoatRoughness: Math.max(.3, entry.roughness),
      // Softer stone reflections keep the supplier pattern visible under the showroom lights.
      envMapIntensity: enhancePattern ? .38 : 1, specularIntensity: enhancePattern ? .45 : 1,
    });
    material.onBeforeCompile = shader => {
      shader.uniforms.stonePatternContrast = { value: enhancePattern ? current.patternContrast??2 : 1 };
      shader.uniforms.stoneBaseColor = { value: new THREE.Color(entry.color) };
      shader.uniforms.stonePhysicalSize = { value: new THREE.Vector2(entry.textureWidth ?? 48, entry.textureHeight ?? 48) };
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vStonePosition;\nvarying vec3 vStoneNormal;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvStonePosition = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvStoneNormal = normalize(mat3(modelMatrix) * normal);');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec2 stonePhysicalSize;\nuniform float stonePatternContrast;\nuniform vec3 stoneBaseColor;\nvarying vec3 vStonePosition;\nvarying vec3 vStoneNormal;')
        .replace('#include <map_fragment>', '#ifdef USE_MAP\nvec3 weights = pow(abs(normalize(vStoneNormal)), vec3(6.0));\nweights /= (weights.x + weights.y + weights.z);\nvec4 stoneSample = texture2D(map, vStonePosition.zy / stonePhysicalSize) * weights.x + texture2D(map, vStonePosition.xz / stonePhysicalSize) * weights.y + texture2D(map, vStonePosition.xy / stonePhysicalSize) * weights.z;\nfloat stoneLuma = dot(stoneSample.rgb, vec3(0.2126, 0.7152, 0.0722));\nfloat baseLuma = dot(stoneBaseColor, vec3(0.2126, 0.7152, 0.0722));\nfloat visibleLuma = clamp(baseLuma + (stoneLuma - baseLuma) * stonePatternContrast, stoneLuma * 0.4, 1.0);\nstoneSample.rgb = clamp(stoneSample.rgb * (visibleLuma / max(stoneLuma, 0.00001)), 0.0, 1.0);\ndiffuseColor *= stoneSample;\n#endif');
    };
    material.customProgramCacheKey = () => 'infinitegranite-world-stone-v4';
    return material;
  }
  function box(parent: THREE.Object3D, width: number, height: number, depth: number, x: number, y: number, z: number, material: THREE.Material, bevel = 0) {
    const w = Math.max(width, .01), h = Math.max(height, .01), d = Math.max(depth, .01);
    const geometry = bevel > 0 ? new RoundedBoxGeometry(w, h, d, 1, Math.min(bevel, w / 4, h / 4, d / 4)) : new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geometry, material);
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
    const geometries = new Set<THREE.BufferGeometry>();
    model.traverse(o => {
      if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) { geometries.add(o.geometry); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m)); }
      if (o instanceof THREE.Sprite) { o.material.map?.dispose(); materials.add(o.material); }
    });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); model.clear(); pickables = []; activeTextureIds.clear();
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
    const body = color === '#b78d60' ? stone('butcher') : mat(color, .48); const inner = mat(new THREE.Color(color).multiplyScalar(.8).getStyle(), .6);
    const metal = mat(FINISHES.find(f => f.id === current.hardware)!.color, .28, current.hardware === 'black' ? .25 : .8);
    const toe = c.kind === 'upper' ? 0 : 4;
    // Hollow carcass leaves the sink bowl visible below its cutout.
    for (const side of [-1, 1]) box(parent, .7, height - toe, d - 2.8, side * (w / 2 - .45), yBase + toe + (height - toe) / 2, -1.25, body);
    box(parent, w - .3, height - toe, .65, 0, yBase + toe + (height - toe) / 2, -d / 2 + .4, body);
    box(parent, w - .3, .7, d - 2.8, 0, yBase + toe + .35, -1.25, body);
    if (c.kind === 'upper' || c.kind === 'pantry') box(parent, w - .3, .7, d - 2.8, 0, yBase + height - .35, -1.25, body);
    if (toe) box(parent, w - 2, 4, d - 5, 0, yBase + 2, -1.5, mat('#303834', .85));
    const doors = Math.max(1, Math.ceil(w / 22)); const doorW = w / doors;
    for (let i = 0; i < doors; i++) {
      const x = -w / 2 + doorW * (i + .5), doorH = height - toe - .5, y = yBase + toe + doorH / 2;
      box(parent, doorW - .28, doorH, .8, x, y, d / 2 - 2.15, current.doorStyle === 'slab' ? body : inner, .08);
      if (current.doorStyle !== 'slab') {
        const rail = current.doorStyle === 'shaker' ? 2.25 : .85;
        box(parent, doorW - .28, rail, .6, x, y + doorH / 2 - rail / 2, d / 2 - 1.6, body, .055);
        box(parent, doorW - .28, rail, .6, x, y - doorH / 2 + rail / 2, d / 2 - 1.6, body, .055);
        box(parent, rail, doorH - rail * 2, .6, x - doorW / 2 + rail / 2 + .14, y, d / 2 - 1.6, body, .055);
        box(parent, rail, doorH - rail * 2, .6, x + doorW / 2 - rail / 2 - .14, y, d / 2 - 1.6, body, .055);
      }
      const hy = c.kind === 'upper' ? yBase + 4 : yBase + height - 4;
      box(parent, 5, .45, .5, x, hy, d / 2 - .55, metal, .1);
      for (const offset of [-2, 2]) box(parent, .4, .4, 1, x + offset, hy, d / 2 - 1.1, metal, .045);
    }
  }
  function counter(parent: THREE.Object3D, c: KitchenComponent, material: THREE.Material, hole = false) {
    const h = current.counterThickness;
    const geometry = countertopGeometry(c, h, hole ? current.sinkStyle : undefined);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh);
    if (c.kind === 'island' && current.waterfall) for (const sign of [-1, 1]) box(parent, h, c.height - h, c.depth, sign * (c.width - h) / 2, (c.height - h) / 2, 0, material, .1);
  }
  function sink(parent: THREE.Object3D, c: KitchenComponent) {
    const opening = sinkOpening(c, current.sinkStyle); const w = opening.width, d = opening.depth, y = c.height;
    const finish = FINISHES.find(f => f.id === current.sinkFinish)!;
    const surface = mat(finish.color, current.sinkFinish === 'white' ? .22 : .3, ['steel','brass'].includes(current.sinkFinish) ? .82 : .1);
    // A hollow basin and an actual opening in the worktop, with no solid slab across it.
    box(parent, w, .6, d, 0, y - 8, 0, surface, .2);
    for (const side of [-1, 1]) box(parent, .65, 8, d, side * (w / 2 - .32), y - 4, 0, surface, .16);
    for (const side of [-1, 1]) box(parent, w, 8, .65, 0, y - 4, side * (d / 2 - .32), surface, .16);
    for (const side of [-1, 1]) {
      box(parent, w + 1, .45, .75, 0, y + .12, side * d / 2, surface, .12);
      box(parent, .75, .45, d, side * w / 2, y + .12, 0, surface, .12);
    }
    if (current.sinkStyle === 'double') box(parent, .8, 7, d, 0, y - 4, 0, surface, .16);
    if (current.sinkStyle === 'apron') box(parent, w + 1, 9, 2, 0, y - 4, c.depth / 2 - 1, surface, .25);
    cylinder(parent, 1.1, .12, current.sinkStyle === 'double' ? -w / 4 : 0, y - 7.65, 0, mat('#3e4648', .3, .8));
    if (current.sinkStyle === 'double') cylinder(parent, 1.1, .12, w / 4, y - 7.65, 0, mat('#3e4648', .3, .8));
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
    box(parent, w - .2, h, d - 2.6, 0, h/2, -1.2, surface, .2);
    if (c.kind === 'fridge') {
      for (const sign of [-1,1]) {
        box(parent, w/2-.3,h*.65,1,sign*w/4,h*.675,d/2-1.8,surface,.15);
        box(parent, .65,20,1,sign*2,h*.63,d/2-.6, dark,.12);
      }
      box(parent,w-.5,h*.3,1,0,h*.16,d/2-1.6,surface,.15); box(parent,w*.55,.7,1,0,h*.29,d/2-.6,dark,.12);
    } else if (c.kind === 'range') {
      box(parent,w-.4,.8,d-.2,0,h+.3,0,dark,.12);
      for (const x of [-w*.24,w*.24]) for (const z of [-d*.24,d*.24]) {
        cylinder(parent,4.5,.3,x,h+.8,z,mat('#505b5e', .3,.8)); cylinder(parent,3.6,.35,x,h+1,z,dark);
      }
      box(parent,w-4,h*.52,1,0,h*.4,d/2-1.6,glass,.3); box(parent,w-5,.8,1.2,0,h*.73,d/2-.7,dark,.12);
      for (let i=0;i<4;i++) { const knob=cylinder(parent,.9,.7,-w*.3+i*w*.2,h*.88,d/2-.8,surface); knob.rotation.x=Math.PI/2; }
      box(parent,w-.3,4,Math.min(19,d-2),0,h+32,-1,surface,.35); box(parent,w*.6,7,Math.min(13,d-4),0,h+37,-4,surface,.2); box(parent,w*.36,20,Math.min(10,d-6),0,h+50,-5,surface,.15);
    } else {
      box(parent,w-.5,h-5,1,0,(h-5)/2+3,d/2-1.8,surface,.15); box(parent,w*.7,.8,1.3,0,h-5,d/2-.7,dark,.12);
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
    const walls=current.roomWalls??defaultWalls(),openings=fitOpenings(current);
    for(const side of WALL_SIDES){
      if(!walls[side].enabled)continue;
      const group=new THREE.Group();model.add(group);
      if(side==='back'||side==='front')group.position.z=(side==='back'?-1:1)*d/2;
      else {group.position.x=(side==='left'?-1:1)*w/2;group.rotation.y=-Math.PI/2;}
      const inward=side==='back'||side==='right'?1:-1,length=wallLength(current,side),height=walls[side].height;
      const cuts=openings.filter(o=>o.wall===side),wallMat=mat(current.wallColor,.9),trim=mat('#f7f8f4');
      const mark=(object:THREE.Object3D,id:string)=>{object.updateWorldMatrix(true,true);object.traverse(o=>{o.userData.componentId=id;if(o instanceof THREE.Mesh)pickables.push(o);});if(options.selected===id)model.add(new THREE.Box3Helper(new THREE.Box3().setFromObject(object),new THREE.Color('#218966')));};
      if(options.walls&&!options.hidden?.includes(`wall:${side}`)){
        const wallGroup=new THREE.Group();group.add(wallGroup);
        for(const r of cutOpenings({left:-length/2,right:length/2,bottom:0,top:height},cuts))box(wallGroup,r.right-r.left,r.top-r.bottom,2,(r.left+r.right)/2,(r.bottom+r.top)/2,-inward,wallMat);
        mark(wallGroup,`wall:${side}`);
      }
      if(!options.hideWindows)for(const o of cuts){
        if(options.hidden?.includes(o.id))continue;
        const opening=new THREE.Group();group.add(opening);
        const glass=new THREE.MeshStandardMaterial({color:o.kind==='window'?'#d6e8e8':'#c1b4a0',roughness:.35,emissive:'#a2cbd3',emissiveIntensity:o.kind==='window'?.15:0});
        box(opening,o.width-1,o.height-1,.5,o.offset,o.bottom+o.height/2,0,glass);
        for(const x of [o.offset-o.width/2,o.offset+o.width/2])box(opening,1.3,o.height,3,x,o.bottom+o.height/2,inward*.2,trim);
        for(const y of [o.bottom,o.bottom+o.height])box(opening,o.width,1.3,3,o.offset,y,inward*.2,trim);
        if(o.kind==='window')box(opening,1,o.height,1,o.offset,o.bottom+o.height/2,inward*.5,trim);
        mark(opening,o.id);
      }
      if(!options.hideBacksplash){
        const tile=current.backsplash==='slab'?stone(current.countertop):mat('#f0f1ea',.3),grout=mat('#c3cbc4',.9);
        for(const r of backsplashRects(current,side)){
          box(group,r.right-r.left,r.top-r.bottom,.4,(r.left+r.right)/2,(r.top+r.bottom)/2,inward*.3,tile);
          if(current.backsplash==='subway')for(let y=r.bottom;y<r.top;y+=3){
            const top=Math.min(y+3,r.top);box(group,r.right-r.left,.08,.08,(r.left+r.right)/2,Math.min(y+.04,r.top-.04),inward*.56,grout);
            for(let x=r.left+((Math.round((y-r.bottom)/3)%2)*4.5);x<r.right;x+=9){const left=Math.max(r.left,x),right=Math.min(r.right,x+.1);box(group,right-left,top-y,.08,(left+right)/2,(y+top)/2,inward*.56,grout);}
          }
        }
      }
    }
    if (options.dimensions) {
      label(`${Math.floor(w/12)}′ ${w%12}″`,0,2,d/2+10);
      label(`${Math.floor(d/12)}′ ${d%12}″`,w/2+17,2,0);
    }
  }
  function update(design: KitchenDesign, nextOptions: SceneOptions) {
    if (disposed) return;
    current=design;options=nextOptions;disposeModel();
    controls.maxDistance = Math.max(1100, Math.max(design.roomWidth, design.roomDepth) * 5);
    const shadowExtent = Math.max(design.roomWidth, design.roomDepth) * .8 + 60;
    sun.shadow.camera.left = -shadowExtent; sun.shadow.camera.right = shadowExtent;
    sun.shadow.camera.top = shadowExtent; sun.shadow.camera.bottom = -shadowExtent;
    sun.shadow.camera.updateProjectionMatrix();
    room();
    for(const c of design.components) {
      if(options.hidden?.includes(c.id)||(options.hideUppers&&c.kind==='upper')||(options.hideAppliances&&['fridge','range','dishwasher'].includes(c.kind)))continue;
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
    trimTextureCache(); textureStatus(); startTextureLoads();
    renderer.shadowMap.needsUpdate = true; render();
  }
  function view(mode: ViewMode) {
    if (disposed) return;
    viewMode=mode;
    const size=Math.max(current?.roomWidth??216,current?.roomDepth??192);
    const aspectFit=Math.max(1,host.clientHeight/Math.max(1,host.clientWidth));
    controls.target.set(0,mode==='top'?0:26,-6);
    if(mode==='top')camera.position.set(0,size*1.65*aspectFit,0.5);
    else if(mode==='front')camera.position.set(0,65,size*1.95*aspectFit);
    else camera.position.set(size*1.17,size*1.02,size*1.38).multiplyScalar(aspectFit);
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
  const zoom=(factor:number)=>{if(disposed)return;const delta=camera.position.clone().sub(controls.target);delta.multiplyScalar(factor).clampLength(controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(delta);controls.update();render();};
  const orbit=(angle:number)=>{if(disposed)return;const delta=camera.position.clone().sub(controls.target);delta.applyAxisAngle(new THREE.Vector3(0,1,0),angle);camera.position.copy(controls.target).add(delta);controls.update();render();};
  const keyDown=(e:KeyboardEvent)=>{if(['ArrowLeft','ArrowRight','+','=','-','0'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')orbit(-.15);else if(e.key==='ArrowRight')orbit(.15);else if(e.key==='0')view(viewMode);else zoom(e.key==='-'?1.1:.9);}};
  const lost=(e:Event)=>{e.preventDefault();onError('The 3D view was paused by your device. Reload the view to continue with your current design.');};
  renderer.domElement.addEventListener('pointercancel',pointerCancel);renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('keydown',keyDown);renderer.domElement.addEventListener('webglcontextlost',lost);
  initializationCleanup.push(() => { disposed = true; });
  resize();view('perspective');
  return {update,view,zoom,orbit,shiftVector:(horizontal,vertical)=>{const forward=controls.target.clone().sub(camera.position);forward.y=0;if(forward.length()<.01)forward.set(0,0,-1);forward.normalize();const right=new THREE.Vector3(-forward.z,0,forward.x);const delta=right.multiplyScalar(horizontal).add(forward.multiplyScalar(vertical));return Math.abs(delta.x)>=Math.abs(delta.z)?{x:Math.sign(delta.x)*Math.hypot(horizontal,vertical),z:0}:{x:0,z:Math.sign(delta.z)*Math.hypot(horizontal,vertical)};},screenshot:()=>{if(disposed)return '';render();return renderer.domElement.toDataURL('image/png');},dispose:()=>{
    if(disposed)return;
    disposed=true;observer.disconnect();controls.removeEventListener('change',render);controls.dispose();
    renderer.domElement.removeEventListener('pointercancel',pointerCancel);renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('keydown',keyDown);renderer.domElement.removeEventListener('webglcontextlost',lost);
    disposeModel();textures.forEach(record=>{record.texture.dispose();record.pending?.dispose();});textures.clear();
    envMap.dispose();sun.shadow.dispose();renderer.dispose();renderer.domElement.remove();
  }};
  } catch (error) {
    for (const cleanup of initializationCleanup.reverse()) {
      try { cleanup(); } catch { /* Continue releasing resources even after a partial WebGL failure. */ }
    }
    throw error;
  }
}
