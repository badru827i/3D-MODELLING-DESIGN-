import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';

type Unit='mm'|'cm'|'m'|'in'; type Shape='box'|'cylinder'|'sphere'|'cone'|'plane';
type ModelObject=THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>&{userData:{label:string;shape:Shape}};
const FACTOR:Record<Unit,number>={mm:1,cm:10,m:1000,in:25.4};
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const viewport=$('viewport'),scene=new THREE.Scene(); scene.background=new THREE.Color('#111c2b'); scene.fog=new THREE.Fog('#111c2b',4500,18000);
const camera=new THREE.PerspectiveCamera(45,1,.1,50000); camera.position.set(900,700,1100);
// GPU compatibility: use the broadly supported WebGL2 path on Adreno, Mali/Immortalis and desktop GPUs.
const probe=document.createElement('canvas');
const gl=probe.getContext('webgl2',{powerPreference:'high-performance',failIfMajorPerformanceCaveat:false}) as WebGL2RenderingContext|null;
if(!gl){
  const state=document.getElementById('gpu-card-state');if(state)state.textContent='Unsupported';
  throw new Error('PRISMA 3D requires WebGL 2. Update your browser and enable hardware acceleration.');
}
const debugInfo=gl.getExtension('WEBGL_debug_renderer_info');
const rawGpu=debugInfo?String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)):String(gl.getParameter(gl.RENDERER));
const gpuName=/adreno/i.test(rawGpu)?'Qualcomm Adreno':/mali|immortalis/i.test(rawGpu)?'MediaTek/Arm Mali or Immortalis':/nvidia|geforce/i.test(rawGpu)?'NVIDIA GPU':/radeon|amd/i.test(rawGpu)?'AMD GPU':/intel/i.test(rawGpu)?'Intel GPU':'WebGL 2 GPU';
const maxTexture=gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
const maxSamples=gl.getParameter(gl.MAX_SAMPLES) as number;
const gpuTier=maxTexture>=8192&&maxSamples>=4?3:maxTexture>=4096?2:1;
const qualityLabel=gpuTier===3?'High':gpuTier===2?'Balanced':'Compatibility';
const renderer=new THREE.WebGLRenderer({canvas:probe,context:gl,antialias:gpuTier>=2,powerPreference:'high-performance',failIfMajorPerformanceCaveat:false});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,gpuTier===3?2:gpuTier===2?1.5:1));
renderer.shadowMap.enabled=gpuTier>=2;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.15;
viewport.prepend(renderer.domElement);
const setText=(id:string,value:string)=>{const el=$(id);if(el)el.textContent=value};
setText('gpu-card-name',gpuName+' · Auto');
setText('gpu-card-state','Ready');
setText('gpu-detail-name',rawGpu);
setText('gpu-quality',qualityLabel);
setText('gpu-texture',String(maxTexture)+' px');
setText('gpu-summary',gpuName+' · WebGL 2 active');
scene.add(new THREE.HemisphereLight(0xc8dcff,0x253247,2.1)); const key=new THREE.DirectionalLight(0xffffff,2.6); key.position.set(900,1500,1000); key.castShadow=true; scene.add(key); const fill=new THREE.DirectionalLight(0x6e9dff,1.1); fill.position.set(-900,400,-700); scene.add(fill);
const grid=new THREE.GridHelper(2000,100,0x45617e,0x293c53); grid.position.y=-.5; scene.add(grid); const axes=new THREE.AxesHelper(260); scene.add(axes);
const orbit=new OrbitControls(camera,renderer.domElement); orbit.enableDamping=true; orbit.dampingFactor=.06; orbit.target.set(0,80,0);
const transform=new TransformControls(camera,renderer.domElement); transform.addEventListener('dragging-changed',(e:any)=>orbit.enabled=!e.value); transform.addEventListener('objectChange',updateMeasurements); scene.add(transform.getHelper());
let unit:Unit='mm',objects:ModelObject[]=[],selected:ModelObject|null=null,counter=1;
function fmt(mm:number){return (mm/FACTOR[unit]).toFixed(3).replace(/\.?0+$/,'')+' '+unit}
function material(){return new THREE.MeshStandardMaterial({color:0x6c91d9,metalness:.34,roughness:.32})}
function bounds(o:ModelObject){o.geometry.computeBoundingBox();const b=o.geometry.boundingBox!.getSize(new THREE.Vector3());return new THREE.Vector3(b.x*Math.abs(o.scale.x),b.y*Math.abs(o.scale.y),b.z*Math.abs(o.scale.z))}
function create(shape:Shape){let g:THREE.BufferGeometry;if(shape==='box')g=new THREE.BoxGeometry(100,100,100);else if(shape==='cylinder')g=new THREE.CylinderGeometry(50,50,100,64);else if(shape==='sphere')g=new THREE.SphereGeometry(50,48,32);else g=new THREE.ConeGeometry(50,100,64);const o=new THREE.Mesh(g,material()) as ModelObject;o.castShadow=true;o.receiveShadow=true;o.position.y=shape==='plane'?0.1:50;o.userData={label:shape[0].toUpperCase()+shape.slice(1)+' '+counter++,shape};scene.add(o);objects.push(o);const empty=$('viewport-empty');if(empty)empty.style.display='none';select(o)}
function renderList(){ $('object-count').textContent=String(objects.length);setText('object-count-footer',objects.length+' object'+(objects.length===1?'':'s'));$('object-list').innerHTML=objects.length?objects.map((o,i)=>'<button class="object-item '+(o===selected?'selected':'')+'" data-index="'+i+'"><span class="object-glyph">◇</span><span>'+o.userData.label+'</span><span class="object-eye">◉</span></button>').join(''):'<div class="empty-list">Your model tree will appear here.</div>';$('object-list').querySelectorAll<HTMLButtonElement>('[data-index]').forEach(b=>b.onclick=()=>select(objects[Number(b.dataset.index)]))}
function select(o:ModelObject|null){selected=o;transform.detach();objects.forEach(x=>x.material.emissive.setHex(x===o?0x142b55:0));const analysis=$('engineering-analysis');if(analysis)analysis.style.display=o?'block':'none';if(o){transform.attach(o);$('selection-status').textContent=o.userData.label;setText('selected-object-name',o.userData.label);setText('selected-object-type',o.userData.shape.toUpperCase()+' · 3D MESH');updateMeasurements()}else{$('selection-status').textContent='No object selected';setText('selected-object-name','No selection');setText('selected-object-type','Select a scene object');$('dimension-editor').innerHTML='<div class="empty-list">Select an object to edit its dimensions.</div>';['measure-x','measure-y','measure-z'].forEach(id=>$(id).textContent='—');const empty=$('viewport-empty');if(empty)empty.style.display='flex'}renderList()}
function updateMeasurements(){if(!selected)return;const s=bounds(selected);$('measure-x').textContent=fmt(s.x);$('measure-y').textContent=fmt(s.y);$('measure-z').textContent=fmt(s.z);const shape=selected.userData.shape;const entries=shape==='sphere'?[['Diameter',s.x]]:shape==='box'?[['Width X',s.x],['Height Y',s.y],['Depth Z',s.z]]:shape==='plane'?[['Width X',s.x],['Depth Z',s.z]]:[['Diameter',s.x],['Height',s.y]];$('dimension-editor').innerHTML=entries.map(([label,v],i)=>'<label class="dimension-field"><span>'+label+'</span><span class="input-wrap"><input type="number" min=".001" step=".1" data-dim="'+i+'" value="'+(Number(v)/FACTOR[unit]).toFixed(3)+'"><small>'+unit+'</small></span></label>').join('');$('dimension-editor').querySelectorAll<HTMLInputElement>('input').forEach(input=>input.onchange=()=>applyDim(Number(input.dataset.dim),Number(input.value)*FACTOR[unit]));updateEngineeringAnalysis()}
type VertexMeasure={key:string;point:THREE.Vector3;neighbors:THREE.Vector3[];angles:number[]};
function fmtPower(mm:number,power:number){const value=mm/Math.pow(FACTOR[unit],power);return value.toFixed(3).replace(/\\.?0+$/,'')+' '+unit+(power===2?'²':'³')}
function analyzeGeometry(o:ModelObject){
  o.updateMatrixWorld(true);
  const pos=o.geometry.getAttribute('position') as THREE.BufferAttribute;
  const vertices=new Map<string,VertexMeasure>();
  const keyOf=(p:THREE.Vector3)=>[p.x,p.y,p.z].map(n=>Math.round(n*1e5)/1e5).join(',');
  for(let i=0;i<pos.count;i++){
    const p=new THREE.Vector3().fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld),key=keyOf(p);
    if(!vertices.has(key))vertices.set(key,{key,point:p,neighbors:[],angles:[]});
  }
  const edges=new THREE.EdgesGeometry(o.geometry,1),ep=edges.getAttribute('position') as THREE.BufferAttribute,edgeSet=new Set<string>();
  let edgeTotal=0,edgeMin=Infinity,edgeMax=0;
  for(let i=0;i+1<ep.count;i+=2){
    const a=new THREE.Vector3().fromBufferAttribute(ep,i).applyMatrix4(o.matrixWorld),b=new THREE.Vector3().fromBufferAttribute(ep,i+1).applyMatrix4(o.matrixWorld),ka=keyOf(a),kb=keyOf(b),ek=ka<kb?ka+'|'+kb:kb+'|'+ka;
    if(edgeSet.has(ek))continue;edgeSet.add(ek);
    const length=a.distanceTo(b);edgeTotal+=length;edgeMin=Math.min(edgeMin,length);edgeMax=Math.max(edgeMax,length);
    const va=vertices.get(ka),vb=vertices.get(kb);if(va&&vb){va.neighbors.push(b);vb.neighbors.push(a)}
  }
  edges.dispose();
  for(const v of vertices.values()){
    const dirs=v.neighbors.map(n=>n.clone().sub(v.point).normalize());
    for(let a=0;a<dirs.length;a++)for(let b=a+1;b<dirs.length;b++)v.angles.push(THREE.MathUtils.radToDeg(dirs[a].angleTo(dirs[b])));
  }
  let area=0,volume=0;
  const index=o.geometry.getIndex(),count=index?index.count:pos.count;
  for(let i=0;i+2<count;i+=3){
    const ia=index?index.getX(i):i,ib=index?index.getX(i+1):i+1,ic=index?index.getX(i+2):i+2;
    const a=new THREE.Vector3().fromBufferAttribute(pos,ia).applyMatrix4(o.matrixWorld),b=new THREE.Vector3().fromBufferAttribute(pos,ib).applyMatrix4(o.matrixWorld),d=new THREE.Vector3().fromBufferAttribute(pos,ic).applyMatrix4(o.matrixWorld);
    area+=b.clone().sub(a).cross(d.clone().sub(a)).length()/2;
    volume+=a.dot(b.clone().cross(d))/6;
  }
  const angles=Array.from(vertices.values()).flatMap(v=>v.angles);
  return {vertices:Array.from(vertices.values()),edgeCount:edgeSet.size,edgeMin:Number.isFinite(edgeMin)?edgeMin:0,edgeMax,edgeAverage:edgeSet.size?edgeTotal/edgeSet.size:0,area,volume:Math.abs(volume)<1e-6?0:Math.abs(volume),angleMin:angles.length?Math.min(...angles):0,angleMax:angles.length?Math.max(...angles):0};
}
function ensureAnalysisPanel(){
  if($('engineering-analysis'))return;
  const host=$('dimension-editor')?.parentElement;if(!host)return;
  const panel=document.createElement('section');panel.id='engineering-analysis';panel.style.cssText='margin-top:16px;padding-top:12px;border-top:1px solid rgba(140,170,220,.18);font-size:12px';
  const heading=document.createElement('div');heading.textContent='ENGINEERING ANALYSIS · LIVE';heading.style.cssText='font-weight:700;letter-spacing:.12em;margin-bottom:10px';panel.append(heading);
  const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px';
  for(const [label,id] of [['VERTICES','analysis-vertices'],['EDGES','analysis-edges']]){
    const cell=document.createElement('div'),small=document.createElement('small'),value=document.createElement('b');small.textContent=label;value.id=id;value.textContent='—';cell.append(small,value);grid.append(cell);
  }
  panel.append(grid);
  for(const [label,id] of [['Edge length range','analysis-edge-range'],['Average edge','analysis-edge-average'],['Connected-edge angles','analysis-angle-range'],['Surface area','analysis-area'],['Enclosed volume','analysis-volume']]){
    const row=document.createElement('div'),name=document.createElement('span'),value=document.createElement('b');row.className='measure-row';name.textContent=label;value.id=id;value.textContent='—';row.append(name,value);panel.append(row);
  }
  const details=document.createElement('details'),summary=document.createElement('summary'),wrap=document.createElement('div'),table=document.createElement('table'),thead=document.createElement('thead'),tr=document.createElement('tr'),tbody=document.createElement('tbody');
  summary.textContent='Vertex coordinates & angles';summary.style.cursor='pointer';wrap.style.cssText='overflow:auto;max-height:220px';table.style.cssText='width:100%;font-size:10px;text-align:left';
  for(const label of ['#','X','Y','Z','Angles']){const th=document.createElement('th');th.textContent=label;tr.append(th)}
  thead.append(tr);tbody.id='vertex-table-body';table.append(thead,tbody);wrap.append(table);details.append(summary,wrap);panel.append(details);host.append(panel);
}
function updateEngineeringAnalysis(){
  ensureAnalysisPanel();
  const panel=$('engineering-analysis');if(!panel||!selected)return;
  const a=analyzeGeometry(selected),angle=(v:number)=>v.toFixed(2)+'°';
  setText('analysis-vertices',String(a.vertices.length));setText('analysis-edges',String(a.edgeCount));
  setText('analysis-edge-range',a.edgeCount?fmt(a.edgeMin)+' – '+fmt(a.edgeMax):'—');
  setText('analysis-edge-average',a.edgeCount?fmt(a.edgeAverage):'—');
  setText('analysis-angle-range',a.angleMin||a.angleMax?angle(a.angleMin)+' – '+angle(a.angleMax):'—');
  setText('analysis-area',fmtPower(a.area,2));setText('analysis-volume',fmtPower(a.volume,3));
  const body=$('vertex-table-body');
  if(body){body.replaceChildren();a.vertices.forEach((v,i)=>{const row=document.createElement('tr');for(const value of [String(i),fmt(v.point.x),fmt(v.point.y),fmt(v.point.z),v.angles.length?v.angles.map(angle).join(', '):'—']){const cell=document.createElement('td');cell.textContent=value;row.append(cell)}body.append(row)})}
}
function applyDim(i:number,mm:number){if(!selected||!Number.isFinite(mm)||mm<=0)return;const o=selected,s=bounds(o),shape=o.userData.shape;if(shape==='box'){const v=[s.x,s.y,s.z];v[i]=mm;o.scale.set(v[0]/100,v[1]/100,v[2]/100)}else if(shape==='sphere')o.scale.setScalar(mm/100);else if(shape==='plane'){if(i===0)o.scale.x=mm/100;else o.scale.z=mm/100}else if(i===0){o.scale.x=mm/100;o.scale.z=mm/100}else o.scale.y=mm/100;updateMeasurements();renderList()}
function download(data:string|ArrayBuffer|ArrayBufferView,name:string,type:string){const u=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();URL.revokeObjectURL(u)}
function exportModel(kind:'stl'|'obj'){if(!objects.length){alert('Create an object before exporting.');return}const group=new THREE.Group();objects.forEach(o=>group.add(o.clone()));group.updateMatrixWorld(true);if(kind==='stl')download(new STLExporter().parse(group,{binary:true}),'prisma-model.stl','application/octet-stream');else download(new OBJExporter().parse(group),'prisma-model.obj','text/plain')}
function view(name:string){const d=camera.position.distanceTo(orbit.target),v:Record<string,THREE.Vector3>={top:new THREE.Vector3(0,1,0),front:new THREE.Vector3(0,0,1),right:new THREE.Vector3(1,0,0),perspective:new THREE.Vector3(.65,.5,.75).normalize()};camera.position.copy(orbit.target).add(v[name].clone().multiplyScalar(d));camera.up.set(0,1,0);if(name==='top')camera.up.set(0,0,-1);camera.lookAt(orbit.target);orbit.update();$('camera-status').textContent=name[0].toUpperCase()+name.slice(1);document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.classList.toggle('selected',b.dataset.view===name))}
function resize(){const w=viewport.clientWidth,h=viewport.clientHeight;camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix();renderer.setSize(w,h)}new ResizeObserver(resize).observe(viewport);resize();
document.querySelectorAll<HTMLButtonElement>('[data-shape]').forEach(b=>b.onclick=()=>create(b.dataset.shape as Shape));
document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b=>b.onclick=()=>{const m=b.dataset.mode as 'translate'|'rotate'|'scale';transform.setMode(m);document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('selected',x===b));$('transform-mode').textContent=m.toUpperCase()});
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view!));
$('unit-select').onchange=e=>{unit=(e.target as HTMLSelectElement).value as Unit;$('unit-readout').textContent=unit;updateMeasurements()};
$('fit-view').onclick=()=>{if(!objects.length){orbit.target.set(0,0,0);camera.position.set(900,700,1100);return}const box=new THREE.Box3();objects.forEach(o=>box.expandByObject(o));const c=box.getCenter(new THREE.Vector3()),s=box.getSize(new THREE.Vector3());orbit.target.copy(c);camera.position.copy(c).add(new THREE.Vector3(1,.8,1).normalize().multiplyScalar(Math.max(s.x,s.y,s.z)*2.6+200));orbit.update()};
$('grid-toggle').onclick=()=>{grid.visible=!grid.visible;$('grid-toggle').classList.toggle('toggled',grid.visible)};$('axes-toggle').onclick=()=>{axes.visible=!axes.visible;$('axes-toggle').classList.toggle('toggled',axes.visible)};
$('export-stl').onclick=()=>exportModel('stl');$('export-obj').onclick=()=>exportModel('obj');
$('new-project').onclick=()=>{if(!confirm('Start a new project? Unsaved changes will be lost.'))return;objects.forEach(o=>scene.remove(o));objects=[];select(null)};
$('save-project').onclick=()=>download(JSON.stringify({app:'PRISMA 3D Engineer',version:1,unit,objects:objects.map(o=>({name:o.userData.label,shape:o.userData.shape,position:o.position.toArray(),rotation:o.rotation.toArray(),scale:o.scale.toArray()}))},null,2),'prisma-project.json','application/json');
$('gpu-card').onclick=()=>{const d=$('graphics-details') as HTMLDetailsElement;d.open=true;d.scrollIntoView({behavior:'smooth',block:'center'})};
renderer.domElement.addEventListener('pointerdown',e=>{if(transform.dragging)return;const r=renderer.domElement.getBoundingClientRect(),p=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(p,camera);const hit=ray.intersectObjects(objects,false)[0];select(hit?hit.object as ModelObject:null)});
function animate(){requestAnimationFrame(animate);orbit.update();renderer.render(scene,camera)}animate();
if('serviceWorker'in navigator&&import.meta.env.PROD)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'));
