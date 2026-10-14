import * as THREE from './vendor/three.module.js';
import { createBrandMotion } from './brand-motion.js?v=20261014-motion16';

// Three original exploded assemblies. All parts, stars and rays are geometry.
// The attraction is a timed, damped motion study, not a rigid-body simulation.
let disposeCurrent = () => {};
function mount() {
  disposeCurrent();
  const host = document.querySelector('#hero-scene');
  if (!host) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); }
  catch { document.querySelector('#assembly-state').textContent = '3D 미리보기 사용 불가'; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.setClearColor(0xffffff, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  host.appendChild(renderer.domElement);
  host.dataset.ready = 'true';
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
  camera.position.set(0, .35, 12.5);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8b9eb7, 1.9));
  const key = new THREE.DirectionalLight(0xffffff, 3.3); key.position.set(-3, 6, 7); scene.add(key);
  const blue = new THREE.DirectionalLight(0xabbfff, 2.5); blue.position.set(4, 0, -3); scene.add(blue);
  const violet = new THREE.PointLight(0xc8bcff, 24, 25); violet.position.set(-3, -2, 3); scene.add(violet);
  const rig = new THREE.Group(); scene.add(rig);
  const palette = [0xa7b8d9, 0x7794c5, 0xc7d6ed, 0x344f89, 0x8980bf, 0xdce3ef];
  const objects = [], parts = [];
  const box = (x,y,z) => new THREE.BoxGeometry(x,y,z);
  const vec = (x,y,z) => new THREE.Vector3(x,y,z);
  function piece(group, geometry, pos, color = 0, rotation = [0,0,0], glow = false) {
    const material = new THREE.MeshStandardMaterial({color:palette[color], metalness:.58, roughness:.28, transparent:true, opacity:1, emissive:glow?palette[color]:0, emissiveIntensity:glow?.15:0});
    const mesh = new THREE.Mesh(geometry, material);
    const target = vec(...pos), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation));
    const i = parts.length, a = i * 2.399963;
    const start = vec(Math.cos(a)*(3.2+(i%4)*.40),Math.sin(a)*(2.1+(i%3)*.35),(Math.sin(i*7.4))*1.4);
    const startQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(i*.47,i*.32,i*.61));
    group.add(mesh); parts.push({mesh,target,q,start,startQ,index:i,group}); return mesh;
  }
  function linePiece(g,a,b,r,color=1) {
    const va=vec(...a), vb=vec(...b), mid=va.clone().add(vb).multiplyScalar(.5);
    const geometry=new THREE.CylinderGeometry(r,r,va.distanceTo(vb),8);
    const q=new THREE.Quaternion().setFromUnitVectors(vec(0,1,0),vb.sub(va).normalize());
    const rot=new THREE.Euler().setFromQuaternion(q);
    return piece(g,geometry,mid.toArray(),color,[rot.x,rot.y,rot.z]);
  }
  // 02. Drone with X arms, separate motors, rotor guards, blades and camera.
  const drone = new THREE.Group(); objects.push(drone);rig.add(drone);
  piece(drone,box(.83,.35,1.3),[0,0,0],5);
  piece(drone,box(.69,.12,.92),[0,.25,0],1);
  piece(drone,box(.48,.20,.58),[0,-.31,.5],3);
  piece(drone,new THREE.CylinderGeometry(.15,.15,.22,20),[0,-.32,.89],4,[Math.PI/2,0,0]);
  piece(drone,new THREE.CylinderGeometry(.10,.10,.04,20),[0,-.32,1.02],3,[Math.PI/2,0,0],true);
  for(const x of [-1.35,1.35])for(const z of [-1.13,1.13]){
    linePiece(drone,[x*.18,0,z*.18],[x,0,z],.07,1);
    piece(drone,new THREE.CylinderGeometry(.18,.14,.30,16),[x,.12,z],3);
    piece(drone,new THREE.TorusGeometry(.57,.025,6,48),[x,.28,z],0,[Math.PI/2,0,0]);
    piece(drone,box(.94,.045,.13),[x,.34,z],5,[0,x*z,0]);
    piece(drone,new THREE.SphereGeometry(.085,12,8),[x,.4,z],4);
  }
  for(const x of [-.45,.45]){
    linePiece(drone,[x,-.1,-.3],[x,-.65,-.45],.035,0);
    linePiece(drone,[x,-.1,.45],[x,-.65,.55],.035,0);
    piece(drone,box(.055,.06,1.32),[x,-.65,.05],3);
  }
  // Navigation is a visual explanation: waypoints, an obstacle, then a traced detour.
  const navigation=new THREE.Group();navigation.position.y=-1.85;rig.add(navigation);
  const routePoints=[[-2.7,-1.05,1.65],[-1.5,-1.05,1.3],[-1.15,-1.05,-.35],[.9,-1.05,-.35],[1.4,-1.05,-1.6],[2.6,-1.05,-1.35]].map(p=>vec(...p));
  const routeSamples=[];
  for(let i=0;i<routePoints.length-1;i++)for(let j=0;j<24;j++)routeSamples.push(routePoints[i].clone().lerp(routePoints[i+1],j/24));
  routeSamples.push(routePoints.at(-1).clone());
  const navRoute=new THREE.Line(new THREE.BufferGeometry().setFromPoints(routeSamples),new THREE.LineBasicMaterial({color:0x408c7a,transparent:true,opacity:0}));navigation.add(navRoute);
  const navMarkers=routePoints.map((point,i)=>{
    const marker=new THREE.Group();marker.position.copy(point);
    const tint=i===routePoints.length-1?0x4869ad:0x408c7a;
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.20,.025,6,32),new THREE.MeshBasicMaterial({color:tint,transparent:true,opacity:0}));ring.rotation.x=Math.PI/2;marker.add(ring);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.68,6),new THREE.MeshBasicMaterial({color:0x8497b5,transparent:true,opacity:0}));pole.position.y=.34;marker.add(pole);
    const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(.32,-.035);shape.lineTo(.26,-.13);shape.lineTo(.32,-.24);shape.lineTo(0,-.21);shape.closePath();
    const flag=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color:tint,transparent:true,opacity:0,side:THREE.DoubleSide}));flag.position.set(.02,.65,0);marker.add(flag);
    navigation.add(marker);return marker;
  });
  // Field stars use tiny crosses and points, so they remain visible on white.
  const starPositions=[], crossPositions=[];
  for(let i=0;i<70;i++){
    const a=i*2.39996,r=2.7+(i%11)*.21,x=Math.cos(a)*r,y=Math.sin(a)*r*.72,z=-1.5-Math.sin(i)*.8;
    starPositions.push(x,y,z);
    if(i%6===0){const size=.035+(i%3)*.02;crossPositions.push(x-size,y,z,x+size,y,z,x,y-size,z,x,y+size,z);}
  }
  const stars=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3)),new THREE.PointsMaterial({color:0x91a2c4,size:.04,transparent:true,opacity:.72,depthWrite:false}));scene.add(stars);
  const starCross=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(crossPositions,3)),new THREE.LineBasicMaterial({color:0x8096bc,transparent:true,opacity:.65}));scene.add(starCross);
  // Fine radial completion rays. Their movement is separate from the object.
  const rayPositions=[];
  for(let i=0;i<68;i++){const a=i/68*Math.PI*2,inner=1.75+(i%4)*.08,outer=inner+.28+(i%5)*.12;rayPositions.push(Math.cos(a)*inner,Math.sin(a)*inner,0,Math.cos(a)*outer,Math.sin(a)*outer,0);}
  const rays=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(rayPositions,3)),new THREE.LineBasicMaterial({color:0x435580,transparent:true,opacity:0,depthTest:false,depthWrite:false}));rays.position.z=2;scene.add(rays);
  const brands=createBrandMotion(host);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let paused=document.documentElement.classList.contains('motion-paused'),visible=true,raf=0,previous=0,elapsed=0,selected=0,phase=-1,pointerX=0,pointerY=0;
  const labels=['AGENT ARCHITECTURE','AUTONOMOUS DRONE','CLAUDE / CANVAS','CODEX / FLOW','GEMINI / SPARKLE'];
  const buttons=[...document.querySelectorAll('[data-assembly]')];
  function select(index){selected=index;elapsed=0;phase=-1;update(0);render();}
  const listeners=buttons.map((b,i)=>{const fn=()=>select(i);b.addEventListener('click',fn);return fn;});
  const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  function update(dt){
    if(!paused&&!reduced.matches)elapsed+=dt;
    const duration=selected===0?20:13.6;
    if(elapsed>=duration){elapsed%=duration;selected=selected===4?0:selected+1;phase=-1;}
    const t=(paused||reduced.matches)&&elapsed===0?8.0:elapsed;
    // Drift 0–2.2s, progressively assemble 2.2–7.6s, hold, burst, dissolve.
    let step=t<2.2?0:t<7.7?1:t<11.6?2:3;
    if(step!==phase){phase=step;document.querySelector('#assembly-label').textContent=`${labels[selected]}`;document.querySelector('#assembly-state').textContent=(selected<2?['흩어진 부품','조립 중','구조 완성','다음 구조로']:selected===2?['선화','채색 중','캔버스 완성','다음 장면으로']:selected===3?['투명한 색','흐름이 드러나는 중','심벌 완성','다음 장면으로']:['흩어진 빛','심벌이 모이는 중','심벌 완성','다음 장면으로'])[step];buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===selected)));}
    objects.forEach((o,i)=>{o.visible=selected===1 && i===0;});
    brands.update(selected,t,paused||reduced.matches);
    const opacity=Math.min(1,t/.8)*Math.min(1,Math.max(0,(13.6-t)/1.1));
    rig.rotation.x=.43+Math.sin(t*.28)*.07+pointerY*.10;
    rig.rotation.y=-.40+Math.sin(t*.2)*.12+pointerX*.18;
    rig.rotation.z=-.06;
    for(const p of parts){if(selected!==1 || p.group!==objects[0])continue;
      const delay=(p.index%9)*.075;
      const raw=THREE.MathUtils.clamp((t-2.2-delay)/4.8,0,1),a=ease(raw);
      const drift=1-a;
      // Screen-space scatter fills the rectangle, instead of an empty orbital ring.
      // Undo the assembly rig rotation so its tilt never pushes starting pieces offscreen.
      const start=p.start.clone().applyQuaternion(rig.quaternion.clone().invert());
      p.mesh.position.copy(start).lerp(p.target,a);
      p.mesh.position.x+=Math.sin(t*.52+p.index)*.20*drift;
      p.mesh.position.y+=Math.cos(t*.42+p.index*.8)*.23*drift;
      p.mesh.position.z+=Math.sin(t*.3+p.index*.5)*.14*drift;
      p.mesh.quaternion.copy(p.startQ).slerp(p.q,a);
      p.mesh.material.opacity=opacity;
      p.mesh.material.depthWrite=opacity>.95;
    }
    navigation.visible=selected===1;
    const navTime=(paused||reduced.matches)&&elapsed===0?10.4:t;
    const navProgress=THREE.MathUtils.clamp((navTime-9.05)/.85,0,1);
    navRoute.geometry.setDrawRange(0,Math.max(0,Math.floor(navProgress*(routeSamples.length-1))+1));
    navRoute.material.opacity=navProgress>0?opacity:0;
    navMarkers.forEach((marker,i)=>{
      const reveal=THREE.MathUtils.clamp((navTime-7.8-i*.18)/.30,0,1);
      const settled=ease(reveal);
      marker.visible=reveal>0;
      marker.position.copy(routePoints[i]);marker.position.y+=(1-settled)*.25;
      marker.children.forEach(o=>o.material.opacity=opacity*settled);
    });
    const burst=THREE.MathUtils.clamp((t-10.05)/2.2,0,1);
    rays.material.opacity=selected===1&&!paused&&!reduced.matches&&burst>0&&burst<1?Math.sin(burst*Math.PI)*.84:0;
    rays.scale.setScalar(.78+burst*1.0);
    stars.rotation.z=t*.006;starCross.rotation.z=t*.006;
    stars.material.opacity=.6+Math.sin(t*.7)*.15;
  }
  function render(){renderer.render(scene,camera);}
  function frame(now){raf=0;const dt=previous?Math.min((now-previous)/1000,.05):0;previous=now;update(dt);render();if(!paused&&!reduced.matches&&visible&&!document.hidden)raf=requestAnimationFrame(frame);}
  function sync(){cancelAnimationFrame(raf);raf=0;previous=0;if(visible&&!document.hidden){update(0);render();if(!paused&&!reduced.matches)raf=requestAnimationFrame(frame);}}
  function motion(e){if(e.detail)paused=e.detail.paused;sync();}
  function move(e){const r=host.getBoundingClientRect();pointerX=THREE.MathUtils.clamp((e.clientX-r.left)/r.width-.5,-.5,.5);pointerY=THREE.MathUtils.clamp((e.clientY-r.top)/r.height-.5,-.5,.5);}
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);brands.resize(w,h);camera.aspect=w/h;camera.position.z=camera.aspect<1.1?15.0:12.4;camera.updateProjectionMatrix();
    const halfH=camera.position.z*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),halfW=halfH*camera.aspect;
    objects.forEach(group=>{const items=parts.filter(p=>p.group===group);items.forEach((p,i)=>{
      const nx=((i*.61803398875+.11)%1)*2-1,ny=((i*.41421356237+.29)%1)*2-1;
      const radius=p.mesh.geometry.boundingSphere?.radius??(p.mesh.geometry.computeBoundingSphere(),p.mesh.geometry.boundingSphere.radius);
      // Allow substantial XY coverage while keeping the largest plates within view.
      p.start.set(nx*Math.max(.5,halfW-radius-.32),ny*Math.max(.5,halfH-radius-.32),Math.sin(i*2.7)*.25);
    });});
    update(0);render();}
  const ro=new ResizeObserver(resize);ro.observe(host);
  const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();});io.observe(host);
  document.addEventListener('pointermove',move,{passive:true});document.addEventListener('visibilitychange',sync);document.addEventListener('portfolio:motion',motion);reduced.addEventListener('change',sync);
  resize();update(0);render();sync();
  disposeCurrent=()=>{
    cancelAnimationFrame(raf);brands.dispose();ro.disconnect();io.disconnect();
    document.removeEventListener('pointermove',move);document.removeEventListener('visibilitychange',sync);document.removeEventListener('portfolio:motion',motion);reduced.removeEventListener('change',sync);
    buttons.forEach((b,i)=>b.removeEventListener('click',listeners[i]));
    const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();
  };
}
document.addEventListener('portfolio:route',mount);mount();
