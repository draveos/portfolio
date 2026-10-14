import * as THREE from './vendor/three.module.js';
import { Reflector } from './vendor/Reflector.js';

const $ = s => document.querySelector(s);
history.scrollRestoration='manual';window.scrollTo({top:0,behavior:'instant'});
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = () => innerWidth < 700;
const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;
const smooth = (a,b,x) => THREE.MathUtils.smoothstep(x,a,b);
let seed = 731;
const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const between = (a,b) => mix(a,b,rand());
let renderer;
try {
  renderer = new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
} catch(e) {
  $('#fallback').hidden = false; $('#opening').classList.add('loaded'); throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile()?1.5:2));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$('#world').appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2('#bdd4d3',.0028);
const camera = new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.1,750);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const pointer = new THREE.Vector2();
const clock = new THREE.Clock();
let phase=0,targetPhase=0,lastChapter=-1,activeChoice=null,choiceBlend=0,day=1;
let yaw=0,targetYaw=0,pitch=0,targetPitch=0,dragging=false,downPoint=null;
let focusAction=null,focusView='cup',focusBlend=0,focusStarted=0;
const focusViews={cup:{position:new THREE.Vector3(6.6,3.4,7.2),look:new THREE.Vector3(2.4,1.8,1.5),title:'A little<br>warmth.',desc:'따뜻한 컵을 두 손으로 감싸는 일.<br>그것만으로 충분한 아침.'},seed:{position:new THREE.Vector3(3.6,2.45,7.4),look:new THREE.Vector3(.15,1.0,2.65),title:'A little<br>patience.',desc:'무엇이 될지는, 아직 모른다.<br>그럼에도 심는 마음.'},boat:{position:new THREE.Vector3(7,2.8,14),look:new THREE.Vector3(3.5,-.2,8.8),title:'A little<br>goodbye.',desc:'내가 만든 작은 것에,<br>나와 다른 길을 허락하기.'}};
const cameraLook=new THREE.Vector3();
const state={cup:false,seed:false,boat:false};
const hitTargets=[];
const animated=[];
const envUniforms={time:{value:0},phase:{value:0},night:{value:0},sunDirection:{value:new THREE.Vector3(-.5,.3,-.75)},sunColor:{value:new THREE.Color('#ffe0a4')},skyTop:{value:new THREE.Color('#7cacbc')},skyBottom:{value:new THREE.Color('#e7ead6')}};
const returnUniform={value:0};let environmentalTime=0;

// All textures below are drawn by this code; no photography or generated image assets.
function canvasTexture(size,draw){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
const woodMap=canvasTexture(512,(ctx,n)=>{
  ctx.fillStyle='#c7b292';ctx.fillRect(0,0,n,n);
  for(let i=0;i<1800;i++){const y=rand()*n;ctx.strokeStyle=rand()>.5?'rgba(88,65,43,.055)':'rgba(255,248,225,.12)';ctx.lineWidth=between(.3,1.7);ctx.beginPath();ctx.moveTo(0,y);for(let x=0;x<=n;x+=16)ctx.lineTo(x,y+Math.sin(x*.024+i)*between(.2,1.5));ctx.stroke();}
  for(let i=0;i<14;i++){let x=rand()*n,y=rand()*n;ctx.strokeStyle='#65543b22';for(let j=0;j<5;j++){ctx.beginPath();ctx.ellipse(x,y,5+j*3,1+j*.6,0,0,Math.PI*2);ctx.stroke();}}
});
woodMap.repeat.set(1,3);
const stoneMap=canvasTexture(512,(ctx,n)=>{ctx.fillStyle='#bbb9a6';ctx.fillRect(0,0,n,n);for(let i=0;i<24000;i++){const v=Math.floor(between(120,245));ctx.fillStyle=`rgba(${v},${v},${v-10},.09)`;ctx.fillRect(rand()*n,rand()*n,between(.5,3),between(.5,3));}});
stoneMap.repeat.set(4,4);
const linenMap=canvasTexture(256,(ctx,n)=>{ctx.fillStyle='#f0e7ce';ctx.fillRect(0,0,n,n);for(let i=0;i<n;i+=2){ctx.fillStyle=i%4?'#8d806c0b':'#ffffff25';ctx.fillRect(i,0,1,n);ctx.fillRect(0,i,n,1);}});
linenMap.repeat.set(5,4);
const leafMap=canvasTexture(128,(ctx,n)=>{ctx.clearRect(0,0,n,n);const gr=ctx.createLinearGradient(20,100,100,20);gr.addColorStop(0,'#2a5039');gr.addColorStop(.5,'#799261');gr.addColorStop(1,'#b0b79a');ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(64,119);ctx.bezierCurveTo(0,65,44,5,65,5);ctx.bezierCurveTo(98,32,126,71,64,119);ctx.fill();ctx.strokeStyle='#c6cba460';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(64,117);ctx.lineTo(65,8);ctx.stroke();for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(64,25+i*13);ctx.lineTo(44,35+i*13);ctx.moveTo(65,25+i*13);ctx.lineTo(88,34+i*13);ctx.stroke();}});
const environment=canvasTexture(512,(ctx,n)=>{let g=ctx.createLinearGradient(0,0,0,n);g.addColorStop(0,'#719faf');g.addColorStop(.42,'#d6d6b9');g.addColorStop(.55,'#fff0cd');g.addColorStop(.65,'#759b9a');g.addColorStop(1,'#30494b');ctx.fillStyle=g;ctx.fillRect(0,0,n,n);ctx.fillStyle='#fff2cf';ctx.beginPath();ctx.ellipse(140,200,35,35,0,0,Math.PI*2);ctx.fill();});
environment.mapping=THREE.EquirectangularReflectionMapping;
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromEquirectangular(environment).texture;pmrem.dispose();
function sterilize(material){material.onBeforeCompile=shader=>{shader.uniforms.uReturn=returnUniform;shader.fragmentShader='uniform float uReturn;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\nfloat grey=dot(diffuseColor.rgb,vec3(.299,.587,.114));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(grey*.85+.12),uReturn);`);};return material;}
const mat=(color,roughness=.7,metalness=0,extra={})=>sterilize(new THREE.MeshStandardMaterial({color,roughness,metalness,...extra}));
const wood=mat('#ab8c67',.78,0,{map:woodMap});
const paleWood=mat('#d4bf9c',.72,0,{map:woodMap});
const darkWood=mat('#736b52',.9,0,{map:woodMap});
const stone=mat('#c8c5b3',.95,0,{map:stoneMap});
const ivory=mat('#eee1c4',.83);
const clay=mat('#b57960',.85);
const brass=mat('#9e865b',.31,.62);
const soil=mat('#3d4030',1);
const glass=new THREE.MeshPhysicalMaterial({color:'#e3f0da',roughness:.11,metalness:0,transmission:.92,thickness:.09,ior:1.45,transparent:true,opacity:.7,envMapIntensity:1.4});
const ambient=new THREE.HemisphereLight('#dcefee','#756a52',.85);scene.add(ambient);
const sun=new THREE.DirectionalLight('#ffe6ba',3.1);sun.position.set(-18,28,-16);sun.castShadow=true;sun.shadow.mapSize.set(mobile()?1024:2048,mobile()?1024:2048);Object.assign(sun.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:1,far:80});sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;sun.target.position.set(2,0,0);scene.add(sun,sun.target);
const bounce=new THREE.DirectionalLight('#a5d2d2',.65);bounce.position.set(10,8,10);scene.add(bounce);
const lampLight=new THREE.PointLight('#ffbb70',0,12,2);lampLight.position.set(-.5,2.2,-3);scene.add(lampLight);

const noiseGLSL=`
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
float snoise(vec2 v){const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1=x0.x>x0.y?vec2(1.,0.):vec2(0.,1.);vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod289(i);vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);m=m*m;m=m*m;vec3 x=2.*fract(p*C.www)-1.;vec3 h=abs(x)-.5;vec3 ox=floor(x+.5);vec3 a0=x-ox;m*=1.79284291400159-.85373472095314*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.*dot(m,g);}
`;
const skyMaterial=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:envUniforms,vertexShader:`varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.z=gl_Position.w*.99999;}`,fragmentShader:`
${noiseGLSL}
varying vec3 vDir;uniform float time;uniform float phase;uniform float night;uniform vec3 sunDirection;uniform vec3 sunColor;uniform vec3 skyTop;uniform vec3 skyBottom;
void main(){vec3 d=normalize(vDir);float h=max(d.y,0.);vec3 color=mix(skyBottom,skyTop,pow(h,.40));float sd=max(dot(d,normalize(sunDirection)),0.);color+=sunColor*(smoothstep(.9991,.9996,sd)*3.2+pow(sd,35.)*.15+pow(sd,6.)*.04)*(1.-night);
vec2 uv=d.xz/(max(d.y,.075)+.35);float n=snoise(uv*.75+vec2(time*.006,0.));n+=.35*snoise(uv*1.65-vec2(time*.009,0.));float cloud=smoothstep(.14,.8,n)*smoothstep(0.,.1,d.y)*.4;vec3 cc=mix(vec3(.98,.96,.83),vec3(.20,.25,.38),night);color=mix(color,cc,cloud);
vec2 staruv=d.xz/(d.y+.4)*140.;vec2 cell=floor(staruv);float hash=fract(sin(dot(cell,vec2(127.1,311.7)))*43758.5453);float star=pow(max(0.,1.-length(fract(staruv)-.5)*2.),18.)*step(.975,hash);color+=star*night*(.7+.3*sin(time*.5+hash*20.))*vec3(.8,.86,1.);
vec3 moonDir=normalize(vec3(-.70,.115,-.70));float md=max(dot(d,moonDir),0.);float moon=smoothstep(.9994,.99975,md);float cut=smoothstep(.9994,.99975,max(dot(d,normalize(moonDir+vec3(.018,.006,0.))),0.));moon*=1.-cut;color+=(moon*1.7+pow(md,120.)*.06)*night*vec3(.84,.91,1.);gl_FragColor=vec4(color,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>
}`.replace(';#include',';\n#include')});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(600,48,24),skyMaterial));

const waterUniforms={...envUniforms,ripple:{value:new THREE.Vector3(0,0,-100)},ripple2:{value:new THREE.Vector3(0,0,-100)},returning:{value:0}};
const waterMaterial=new THREE.ShaderMaterial({uniforms:waterUniforms,transparent:false,vertexShader:`varying vec3 vWorld;void main(){vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,fragmentShader:`
${noiseGLSL}
varying vec3 vWorld;uniform float time;uniform float night;uniform float returning;uniform vec3 sunColor;uniform vec3 sunDirection;uniform vec3 skyTop;uniform vec3 skyBottom;uniform vec3 ripple;uniform vec3 ripple2;
void main(){vec2 p=vWorld.xz;float n=snoise(p*.13+vec2(time*.025,time*.015));float n2=snoise(p*.48-vec2(time*.045,0.));float n3=snoise(p*1.9+time*.05);vec3 normal=normalize(vec3(n*.075+n3*.015,1.,n2*.055));vec3 v=normalize(cameraPosition-vWorld);vec3 r=reflect(-v,normal);float fres=pow(1.-max(dot(normal,v),0.),3.);vec3 sea=mix(vec3(.045,.21,.23),vec3(.016,.045,.09),night);vec3 color=mix(sea,mix(skyBottom,skyTop,max(r.y,0.)),.17+fres*.38);float s=max(dot(r,normalize(sunDirection)),0.);float glint=pow(s,180.)*(.3+.7*smoothstep(-.4,.5,n2));color+=sunColor*glint*2.*(1.-night);
float lines=pow(max(0.,1.-abs(sin(p.y*3.+n*3.+time*.35))),14.);color+=lines*.035*(1.-night);float dist1=length(p-ripple.xy);float age=time-ripple.z;float ring=sin(dist1*12.-age*7.)*exp(-dist1*.25)*exp(-age*.9)*step(0.,age)*smoothstep(age*2.+.3,age*2.-.3,dist1);color+=ring*.13;float dist2=length(p-ripple2.xy);float age2=time-ripple2.z;float ring2=sin(dist2*9.-age2*6.)*exp(-dist2*.25)*exp(-age2*.6)*step(0.,age2);color+=ring2*.09;
color=mix(color,vec3(dot(color,vec3(.3,.59,.11)))*.65,returning);float fog=1.-exp(-length(cameraPosition-vWorld)*.0015);color=mix(color,skyBottom,fog);gl_FragColor=vec4(color,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>
}`.replace(';#include',';\n#include')});
// The reflection uses a second camera with an oblique clipping plane. Surface
// normals distort its projected texture; the objects really reflect in the sea.
const reflectedVertex=waterMaterial.vertexShader.replace('varying vec3 vWorld;','varying vec3 vWorld;varying vec4 vReflection;uniform mat4 textureMatrix;').replace('vec4 w=modelMatrix','vReflection=textureMatrix*vec4(position,1.);vec4 w=modelMatrix');
const reflectedFragment=waterMaterial.fragmentShader.replace('varying vec3 vWorld;','varying vec3 vWorld;varying vec4 vReflection;uniform sampler2D tDiffuse;').replace('color+=sunColor*glint*2.*(1.-night);','color+=sunColor*glint*1.2*(1.-night);vec2 rUV=vReflection.xy/vReflection.w;vec3 reflection=texture2D(tDiffuse,rUV+normal.xz*.035).rgb;color=mix(color,reflection,.09+fres*.25);').replace('smoothstep(age*2.+.3,age*2.-.3,dist1)','(1.-smoothstep(age*2.-.3,age*2.+.3,dist1))');
const water=new Reflector(new THREE.PlaneGeometry(1500,1500),{textureWidth:mobile()?512:1024,textureHeight:mobile()?512:1024,multisample:0,clipBias:.003,shader:{uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null},...waterUniforms},vertexShader:reflectedVertex,fragmentShader:reflectedFragment}});
// Share the evolving day uniforms rather than cloning their values each frame.
for(const k of Object.keys(waterUniforms))water.material.uniforms[k]=waterUniforms[k];
waterMaterial.dispose();water.rotation.x=-Math.PI/2;water.position.y=-1.25;scene.add(water);

function mesh(geometry,material,x=0,y=0,z=0,parent=scene){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(w,h,d,material,x,y,z,parent){return mesh(new THREE.BoxGeometry(w,h,d),material,x,y,z,parent);}
function softBox(w,h,d,r,material,x,y,z,parent){const g=new THREE.BoxGeometry(w,h,d,10,6,10),p=g.attributes.position,n=new THREE.Vector3(),q=new THREE.Vector3();for(let i=0;i<p.count;i++){n.fromBufferAttribute(p,i);q.set(clamp(n.x,-w/2+r,w/2-r),clamp(n.y,-h/2+r,h/2-r),clamp(n.z,-d/2+r,d/2-r));n.sub(q).normalize().multiplyScalar(r).add(q);p.setXYZ(i,n.x,n.y,n.z);}g.computeVertexNormals();return mesh(g,material,x,y,z,parent);}
function cylinder(rt,rb,h,material,x,y,z,parent,segments=32){return mesh(new THREE.CylinderGeometry(rt,rb,h,segments),material,x,y,z,parent);}
function sphere(r,material,x,y,z,parent){return mesh(new THREE.SphereGeometry(r,24,16),material,x,y,z,parent);}
function tube(points,r,material,parent=scene){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),24,r,8,false),material,0,0,0,parent);}
function beam(a,b,width,material,parent=scene){const aa=new THREE.Vector3(...a),bb=new THREE.Vector3(...b);const m=mesh(new THREE.CylinderGeometry(width,width,aa.distanceTo(bb),12),material,0,0,0,parent);m.position.copy(aa).add(bb).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bb.sub(aa).normalize());return m;}

// Pale coastal land and far islands make the space part of a world, not a floating model.
const islandMat=mat('#4c7a7a',1);
for(let i=0;i<7;i++){const g=new THREE.SphereGeometry(1,48,24);const p=g.attributes.position;for(let j=0;j<p.count;j++){let x=p.getX(j),y=p.getY(j),z=p.getZ(j);let v=1+.13*Math.sin(x*12+z*5)+.09*Math.sin(z*17+x*3);p.setXYZ(j,x*v,y*v,z*v);}g.computeVertexNormals();const m=mesh(g,islandMat,-180+i*62,-5,between(-270,-180));m.scale.set(between(22,47),between(8,16),between(10,25));m.castShadow=false;}
const terrace=new THREE.Group();scene.add(terrace);
box(14.5,.56,10.5,stone,2,-.05,0,terrace);
box(14.8,.12,10.8,mat('#aaa891',.9),2,-.32,0,terrace);
box(14.2,.10,10.2,paleWood,2,.285,0,terrace);
const floorGeo=new THREE.BoxGeometry(.22,.045,10.05);
const floorInst=new THREE.InstancedMesh(floorGeo,paleWood,63);
let dummy=new THREE.Object3D();
for(let i=0;i<63;i++){dummy.position.set(-4.91+i*.226,.36,0);dummy.updateMatrix();floorInst.setMatrixAt(i,dummy.matrix);floorInst.setColorAt(i,new THREE.Color().setHSL(.105,between(.12,.25),between(.69,.82)));}
floorInst.castShadow=true;floorInst.receiveShadow=true;terrace.add(floorInst);
for(let i=0;i<3;i++)box(8.5,.14,1.2,stone,2,.05-i*.19,5.43+i*.65,terrace);
// Deep supports disappear into the water; the terrace is a seaside pier.
for(let x of [-4,0,4,8])for(let z of [-4,4]){box(.32,2.4,.32,darkWood,x,-1.25,z,terrace);box(.48,.09,.48,brass,x,-.6,z,terrace);}
// Fine fascia lines, edge bolts, and slender metal handrail.
for(let z of [-5.2,5.2])box(14.5,.055,.075,darkWood,2,.05,z,terrace);
for(let x of [-4.95,9.0]){box(.055,.07,10.5,darkWood,x,.12,0,terrace);for(let z=-4;z<5;z+=2) cylinder(.015,.015,.012,brass,x,.35,z,terrace,8);}
const railMat=mat('#7c8b7f',.3,.55);
for(let x=-4.4;x<9;x+=2.1){cylinder(.025,.025,1.12,railMat,x,.87,-4.75,terrace,12);box(1.98,.72,.025,glass,x+1,.88,-4.75,terrace);}
beam([-4.4,1.44,-4.75],[8.8,1.44,-4.75],.025,railMat,terrace);

// An open pavilion: the architecture frames light instead of enclosing it.
const pavilion=new THREE.Group();pavilion.position.set(2,0,-1.5);terrace.add(pavilion);
for(let x of [-3.6,3.6])for(let z of [-2.6,2.6]){box(.14,4.3,.14,wood,x,2.5,z,pavilion);box(.19,.12,.19,brass,x,.47,z,pavilion);}
for(let z of [-2.6,2.6])box(7.9,.20,.18,wood,0,4.65,z,pavilion);
for(let x of [-3.6,3.6])box(.18,.18,5.8,wood,x,4.66,0,pavilion);
for(let i=0;i<14;i++)box(.042,.055,5.7,paleWood,-3.45+i*.53,4.83,0,pavilion);
const clothUniform={time:{value:0},wind:{value:.1}};
const clothMat=mat('#f1e7cd',.92,0,{map:linenMap,side:THREE.DoubleSide});
const clothColorCompile=clothMat.onBeforeCompile;clothMat.onBeforeCompile=shader=>{clothColorCompile(shader);shader.uniforms.uTime=clothUniform.time;shader.uniforms.uWind=clothUniform.wind;shader.vertexShader='uniform float uTime;uniform float uWind;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\ntransformed.y += sin(position.x*.9+uTime*.55)*sin(position.z*.8+uTime*.35)*uWind;`);};
const clothGeo=new THREE.BufferGeometry();const clothPos=[],clothUV=[],clothIdx=[];const nx=42,nz=30;
for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){let u=i/nx,v=j/nz,x=(u-.5)*7.25,z=(v-.5)*5.3;let sag=-.39*Math.sin(u*Math.PI)*Math.sin(v*Math.PI)-.07*Math.sin(u*Math.PI*6)*Math.sin(v*Math.PI);clothPos.push(x,4.77+sag,z);clothUV.push(u,v);}
for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){let a=j*(nx+1)+i,b=a+nx+1;clothIdx.push(a,b,a+1,b,b+1,a+1);}
clothGeo.setAttribute('position',new THREE.Float32BufferAttribute(clothPos,3));clothGeo.setAttribute('uv',new THREE.Float32BufferAttribute(clothUV,2));clothGeo.setIndex(clothIdx);clothGeo.computeVertexNormals();mesh(clothGeo,clothMat,0,0,0,pavilion);
// A hanging linen panel; its folds are geometry, and its motion has depth.
const curtainGroup=new THREE.Group();curtainGroup.position.set(-3.55,0,-1.1);pavilion.add(curtainGroup);
const curtainGeo=new THREE.PlaneGeometry(2.4,3.25,28,36);const cp=curtainGeo.attributes.position;
for(let i=0;i<cp.count;i++){const x=cp.getX(i),y=cp.getY(i);cp.setZ(i,Math.sin(x*11)*.08+Math.sin(y*.8)*.03);cp.setX(i,x+Math.pow((1.625-y)/3.25,2)*.3);}
curtainGeo.computeVertexNormals();const curtain=mesh(curtainGeo,clothMat,0,2.95,0,curtainGroup);curtain.rotation.y=Math.PI/2-.2;

// Bench, cushions, a casually folded throw, and a warm reading lamp.
const bench=new THREE.Group();bench.position.set(1.2,0,-3.25);terrace.add(bench);
for(let x of [-1.4,1.4]){box(.10,.85,.13,darkWood,x,.79,.2,bench);box(.1,.85,.13,darkWood,x,.79,-.6,bench);}
for(let z=-.6;z<.55;z+=.13)box(3.45,.1,.105,wood,0,1.06,z,bench);
for(let y=1.32;y<2.05;y+=.14)box(3.45,.105,.10,wood,0,y,-.66,bench);
const cushionMat=mat('#859487',.97,0,{map:linenMap});
softBox(1.27,.15,.91,.065,cushionMat,-.65,1.2,-.05,bench);
const cushion=softBox(.9,.7,.20,.09,mat('#c48d75',.98,0,{map:linenMap}),.76,1.54,-.49,bench);cushion.rotation.x=-.15;cushion.rotation.z=.12;
const throwGeo=new THREE.PlaneGeometry(1.0,1.55,20,24);const tp=throwGeo.attributes.position;for(let i=0;i<tp.count;i++){let y=tp.getY(i),x=tp.getX(i);tp.setZ(i,Math.sin(x*24)*.018+Math.max(0,y)*.9);tp.setY(i,y*.7);}throwGeo.computeVertexNormals();let blanket=mesh(throwGeo,mat('#d8c39e',1,0,{map:linenMap,side:THREE.DoubleSide}),-1.0,1.23,.47,bench);blanket.rotation.x=-.2;
const lamp=new THREE.Group();lamp.position.set(-.8,.4,-3.1);terrace.add(lamp);cylinder(.25,.29,.06,brass,0,.06,0,lamp);cylinder(.025,.025,1.5,brass,0,.8,0,lamp);const shade=mesh(new THREE.ConeGeometry(.39,.35,40,1,true),mat('#d7b275',.7,0,{side:THREE.DoubleSide}),0,1.65,0,lamp);shade.rotation.z=.08;const bulb=sphere(.08,new THREE.MeshStandardMaterial({color:'#ffdda2',emissive:'#ffd092',emissiveIntensity:.2}),0,1.53,0,lamp);

// Rounded oak table and woven chair, detailed entirely with geometry.
const table=new THREE.Group();table.position.set(2.3,.4,1.8);terrace.add(table);
cylinder(1.15,1.13,.10,paleWood,0,1.15,0,table,80);cylinder(1.08,1.08,.045,wood,0,1.075,0,table,80);
mesh(new THREE.TorusGeometry(1.117,.034,12,80),paleWood,0,1.165,0,table).rotation.x=Math.PI/2;
for(let a of [.45,2.55,4.65]){let x=Math.cos(a)*.73,z=Math.sin(a)*.73;beam([x*1.18,0,z*1.18],[x,1.09,z],.04,wood,table);}
const chair=new THREE.Group();chair.position.set(4.2,.43,2.8);chair.rotation.y=-.75;terrace.add(chair);
for(let x of [-.36,.36])for(let z of [-.36,.36])beam([x*1.1,0,z*1.1],[x,.8,z],.025,wood,chair);
box(.87,.07,.85,wood,0,.79,0,chair);
for(let x=-.37;x<.39;x+=.06)box(.021,.018,.78,ivory,x,.843,0,chair);
for(let x of [-.4,.4]){beam([x,.8,-.38],[x,1.62,-.51],.026,wood,chair);beam([x,.8,.31],[x,1.09,.31],.025,wood,chair);beam([x,1.1,.35],[x,1.18,-.45],.025,wood,chair);}
for(let i=0;i<11;i++){let y=1.12+i*.045;beam([-.4,y,-.45-(y-1.12)*.15],[.4,y,-.45-(y-1.12)*.15],.012,ivory,chair);}
softBox(.74,.07,.68,.033,cushionMat,0,.88,.02,chair);

// A porcelain cup with a real lip, handle, coffee surface, and animated steam.
const cup=new THREE.Group();cup.position.set(.34,1.22,.16);table.add(cup);
cylinder(.19,.21,.023,ivory,0,.012,0,cup,48);cylinder(.12,.095,.18,ivory,0,.115,0,cup,48);
mesh(new THREE.TorusGeometry(.116,.011,10,48),ivory,0,.211,0,cup).rotation.x=Math.PI/2;
const coffee=cylinder(.108,.108,.005,mat('#443329',.22),0,.204,0,cup,48);
const handle=mesh(new THREE.TorusGeometry(.065,.017,12,32,Math.PI*1.35),ivory,.125,.12,0,cup);handle.rotation.z=-Math.PI*.675;
const steamMat=new THREE.MeshBasicMaterial({color:'#f4efd5',transparent:true,opacity:.12,depthWrite:false});
const steams=[];for(let i=0;i<5;i++){let m=mesh(new THREE.SphereGeometry(1,12,8),steamMat,0,.32+i*.11,0,cup);m.scale.set(.016,.075,.016);m.castShadow=false;steams.push(m);}
const hitMat=new THREE.MeshBasicMaterial({visible:false});
const cupHit=sphere(.38,hitMat,.34,1.4,.16,table);cupHit.userData={action:'cup',label:'온기를 한 모금'};hitTargets.push(cupHit);

// Book, pencil, glass carafe, and wild flowers make the room belong to someone.
const book=new THREE.Group();book.position.set(-.4,1.225,-.3);book.rotation.y=.25;table.add(book);
box(.68,.022,.49,mat('#596e66',.8),0,0,0,book);box(.63,.04,.45,ivory,.01,.03,0,book);box(.68,.013,.49,mat('#596e66',.8),0,.056,0,book);
for(let i=0;i<7;i++)box(.62,.001,.003,mat('#b7ab92',1),.01,.015+i*.005,.227,book);
const pencil=mesh(new THREE.CylinderGeometry(.012,.012,.4,6),mat('#bd9560',.8),-.22,1.3,-.35,table);pencil.rotation.z=Math.PI/2;pencil.rotation.y=-.18;
const bottle=new THREE.Group();bottle.position.set(-.1,1.23,.65);table.add(bottle);cylinder(.11,.12,.38,glass,0,.19,0,bottle,32);cylinder(.055,.07,.12,glass,0,.43,0,bottle);cylinder(.10,.105,.24,new THREE.MeshPhysicalMaterial({color:'#a4c2b6',transparent:true,opacity:.45,roughness:.06}),0,.125,0,bottle);
const vase=cylinder(.10,.095,.29,clay,-.66,1.38,.26,table,32);
const flowerMaterial=mat('#e4bca2',.9,0,{side:THREE.DoubleSide});
function flower(parent,x,y,z,height,color=flowerMaterial){const stemMat=mat('#617552',.85);tube([[x,y,z],[x+.04,y+height*.5,z+.03],[x-.025,y+height,z]],.008,stemMat,parent);for(let i=0;i<6;i++){let a=i*Math.PI/3;const p=sphere(.045,color,x+Math.cos(a)*.05,y+height,z+Math.sin(a)*.05,parent);p.scale.set(1,.33,1);}sphere(.023,mat('#bc9961',.8),x,y+height+.007,z,parent);}
for(let i=0;i<7;i++)flower(table,-.66+between(-.05,.05),1.5,.26+between(-.04,.04),between(.32,.68),i%2?flowerMaterial:ivory);
// A handwritten label, drawn on the notebook rather than layered as interface.
const bookLabel=canvasTexture(256,(ctx,n)=>{ctx.clearRect(0,0,n,n);ctx.fillStyle='#e4ddbf';ctx.textAlign='center';ctx.font='italic 26px Georgia';ctx.fillText('ordinary things',128,107);ctx.font='13px Georgia';ctx.fillText('a place to begin',128,137);ctx.strokeStyle='#e4ddbf66';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(70,165);ctx.lineTo(186,165);ctx.stroke();});
const label=mesh(new THREE.PlaneGeometry(.56,.4),new THREE.MeshBasicMaterial({map:bookLabel,transparent:true,depthWrite:false}),0,.064,0,book);label.rotation.x=-Math.PI/2;label.castShadow=false;
// A pair of sandals, imperfectly placed, gives the room a scale and an owner.
const sandals=new THREE.Group();sandals.position.set(.4,.42,-1.8);terrace.add(sandals);
for(let i=0;i<2;i++){const shoe=new THREE.Group();shoe.position.set(i*.26,0,i*.06);shoe.rotation.y=i?.15:-.2;sandals.add(shoe);softBox(.18,.045,.43,.022,mat('#a18263',.9),0,.023,0,shoe);tube([[-.075,.055,.08],[0,.13,.06],[.075,.055,.08]],.018,mat('#846e55',.95),shoe);tube([[0,.125,.06],[0,.065,.17]],.018,mat('#846e55',.95),shoe);}
// A ceramic wind bell: a thin cord, a hollow body, and a paper strip.
const bell=new THREE.Group();bell.position.set(5.5,3.7,-1.3);terrace.add(bell);beam([0,.7,0],[0,.05,0],.003,darkWood,bell);const bellBody=mesh(new THREE.SphereGeometry(.10,32,16,0,Math.PI*2,0,Math.PI*.65),ivory,0,0,0,bell);bellBody.rotation.z=Math.PI;beam([0,-.07,0],[0,-.35,0],.003,darkWood,bell);const bellPaper=mesh(new THREE.PlaneGeometry(.08,.31),ivory,0,-.46,0,bell);bellPaper.material.side=THREE.DoubleSide;

// Terracotta planter: an action leaves a living mark that grows through the day.
const planter=new THREE.Group();planter.position.set(.15,.42,2.65);terrace.add(planter);
cylinder(.45,.31,.52,clay,0,.26,0,planter,48);cylinder(.475,.475,.09,clay,0,.50,0,planter,48);cylinder(.42,.42,.014,soil,0,.54,0,planter,48);
for(let i=0;i<4;i++)mesh(new THREE.TorusGeometry(.446-i*.015,.004,6,48),mat('#835e4c',.9),0,.46-i*.1,0,planter).rotation.x=Math.PI/2;
const sprout=new THREE.Group();sprout.position.y=.55;sprout.scale.setScalar(.001);planter.add(sprout);
tube([[0,0,0],[.04,.25,0],[0,.6,0]],.014,mat('#65824a',.8),sprout);
const leafMaterial=sterilize(new THREE.MeshStandardMaterial({map:leafMap,transparent:true,alphaTest:.25,side:THREE.DoubleSide,roughness:.86,color:'#bdc998'}));
for(let i=0;i<5;i++){let p=mesh(new THREE.PlaneGeometry(.22,.37),leafMaterial,(i%2?1:-1)*.08,.12+i*.09,0,sprout);p.rotation.z=(i%2?-.8:.8);p.rotation.y=i*.8;}
flower(sprout,0,.6,0,.12,flowerMaterial);
const seedHit=sphere(.65,hitMat,0,.63,0,planter);seedHit.userData={action:'seed',label:'내일을 하나 심기'};hitTargets.push(seedHit);

// A hand-folded paper boat, waiting at the edge of the steps.
function createBoat(){const g=new THREE.Group();const paper=mat('#eddbc0',.8,0,{side:THREE.DoubleSide});let geo=new THREE.BufferGeometry();const vertices=[-.35,0,0,0,.17,.16,.35,0,0, -.35,0,0,.35,0,0,0,.17,-.16, -.35,0,0,0,.17,-.16,0,.17,.16, .35,0,0,0,.17,.16,0,.17,-.16, -.18,.16,0,.18,.16,0,0,.48,0];geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();mesh(geo,paper,0,0,0,g);return g;}
const boat=createBoat();boat.position.set(3.1,.09,6.3);boat.rotation.y=-.5;terrace.add(boat);
const boatHit=sphere(.6,hitMat,3.1,.2,6.3,terrace);boatHit.userData={action:'boat',label:'잘 가, 작은 항해'};hitTargets.push(boatHit);
let boatAge=-1,drinkAge=-1,plantAge=-1;

// Olive tree: branching structure, individual two-sided leaves, fruit, and leaf motion.
const tree=new THREE.Group();tree.position.set(7.0,.4,-1.9);terrace.add(tree);
cylinder(.88,.64,.82,mat('#d3c9ae',.95),0,.41,0,tree,64);cylinder(.9,.9,.11,stone,0,.81,0,tree,64);cylinder(.80,.80,.015,soil,0,.83,0,tree,48);
const bark=mat('#7a7860',.93,0,{map:stoneMap});
tube([[0,.75,0],[-.15,1.6,.03],[.1,2.4,-.03],[.05,3.15,.15],[-.1,3.85,.1]],.095,bark,tree);
const branches=[];
for(let i=0;i<13;i++){let a=i*2.399,y=1.7+i*.14,l=between(.7,1.8);let end=[Math.cos(a)*l,y+between(.7,1.3),Math.sin(a)*l];let start=[.02,y,0];tube([start,[end[0]*.5,y+.45,end[2]*.45],end],between(.018,.039),bark,tree);branches.push(end);for(let j=0;j<3;j++){let aa=a+between(-.6,.6);let ep=[end[0]+Math.cos(aa)*.45,end[1]+between(-.1,.4),end[2]+Math.sin(aa)*.45];beam(end,ep,.012,bark,tree);branches.push(ep);}}
const leafGeo=new THREE.PlaneGeometry(.17,.39);const leaves=new THREE.InstancedMesh(leafGeo,leafMaterial,1450);
const leafBase=[];
for(let i=0;i<1450;i++){const b=branches[Math.floor(rand()*branches.length)];let px=b[0]+between(-.57,.57),py=b[1]+between(-.37,.37),pz=b[2]+between(-.57,.57);let rot=[rand()*Math.PI,rand()*Math.PI*2,between(-1,1)];leafBase.push([px,py,pz,...rot]);dummy.position.set(px,py,pz);dummy.rotation.set(...rot);dummy.scale.setScalar(between(.6,1.05));dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);leaves.setColorAt(i,new THREE.Color().setHSL(between(.17,.24),between(.15,.35),between(.45,.68)));}
leaves.castShadow=true;tree.add(leaves);
for(let i=0;i<20;i++){const b=branches[Math.floor(rand()*branches.length)];const olive=sphere(.027,mat(i%3?'#637546':'#46513c',.6),b[0],b[1]-.1,b[2],tree);olive.scale.y=1.4;}
// Tall grasses in low stone planters, each blade curves rather than being a cube.
const grassMat=mat('#869275',.86,0,{side:THREE.DoubleSide});
const grassGroup=new THREE.Group();grassGroup.position.set(-2.8,.43,-3.8);terrace.add(grassGroup);
box(2.0,.40,.76,stone,0,.2,0,grassGroup);box(1.88,.02,.65,soil,0,.405,0,grassGroup);
const bladeGeo=new THREE.PlaneGeometry(.035,.8,1,5);const bp=bladeGeo.attributes.position;for(let i=0;i<bp.count;i++){let y=bp.getY(i)+.4;bp.setY(i,y);bp.setX(i,bp.getX(i)*(1-y/.8));bp.setZ(i,y*y*.5);}bladeGeo.computeVertexNormals();const grasses=new THREE.InstancedMesh(bladeGeo,grassMat,150);
for(let i=0;i<150;i++){dummy.position.set(between(-.88,.88),.41,between(-.28,.28));dummy.rotation.set(0,rand()*6.28,between(-.2,.2));dummy.scale.set(between(.7,1.3),between(.4,1.3),1);dummy.updateMatrix();grasses.setMatrixAt(i,dummy.matrix);}grasses.castShadow=true;grassGroup.add(grasses);

// Pebbles, a woven rug and fallen petals add small human-scale imperfections.
const rugMat=mat('#aab3a0',1,0,{map:linenMap});const rug=mesh(new THREE.CircleGeometry(1.8,80),rugMat,2.7,.39,1.7,terrace);rug.rotation.x=-Math.PI/2;rug.scale.y=.82;
for(let i=0;i<30;i++){let a=rand()*6.28,r=between(1.3,1.7);let peb=sphere(between(.025,.055),mat('#d0c6ae',.94),7+Math.cos(a)*r,.4,-1.9+Math.sin(a)*r,terrace);peb.scale.set(1,.35,.7);}
const contactMap=canvasTexture(128,(ctx,n)=>{const g=ctx.createRadialGradient(n/2,n/2,0,n/2,n/2,n/2);g.addColorStop(0,'rgba(30,38,27,.5)');g.addColorStop(.3,'rgba(30,38,27,.3)');g.addColorStop(1,'rgba(30,38,27,0)');ctx.fillStyle=g;ctx.fillRect(0,0,n,n);});
const contactMat=new THREE.MeshBasicMaterial({map:contactMap,transparent:true,opacity:.55,depthWrite:false});
for(let [x,z,s] of [[2.3,1.8,2.5],[7,-1.9,2.2],[.15,2.65,1.4],[4.2,2.8,1.4],[1.2,-3.25,3]]){let sh=mesh(new THREE.PlaneGeometry(s,s),contactMat,x,.398,z,terrace);sh.rotation.x=-Math.PI/2;sh.castShadow=false;sh.receiveShadow=false;}
const driftingPetals=new THREE.InstancedMesh(new THREE.PlaneGeometry(.045,.085),flowerMaterial,45);const petalData=[];for(let i=0;i<45;i++){petalData.push([between(-5,10),between(.4,5.5),between(-5,8),rand()*6.28]);dummy.position.set(...petalData[i].slice(0,3));dummy.rotation.set(rand()*3,rand()*3,rand()*3);dummy.updateMatrix();driftingPetals.setMatrixAt(i,dummy.matrix);}scene.add(driftingPetals);
// Night fireflies are small emissive points, not screen-covering effects.
const flyGeo=new THREE.BufferGeometry();const flyPositions=[];for(let i=0;i<60;i++)flyPositions.push(between(-4,10),between(.6,4.5),between(-4,6));flyGeo.setAttribute('position',new THREE.Float32BufferAttribute(flyPositions,3));const flyMat=new THREE.PointsMaterial({color:'#f5e6b4',size:.035,transparent:true,opacity:0,depthWrite:false});const fireflies=new THREE.Points(flyGeo,flyMat);scene.add(fireflies);
// In the system, the messy living space becomes a measured, static model.
const systemGrid=new THREE.GridHelper(160,80,'#8bced0','#547d83');systemGrid.position.y=-1.19;systemGrid.material.transparent=true;systemGrid.material.opacity=0;systemGrid.visible=false;scene.add(systemGrid);
const wireMat=new THREE.LineBasicMaterial({color:'#99d5d2',transparent:true,opacity:0});const wireGroup=new THREE.Group();wireGroup.visible=false;scene.add(wireGroup);
terrace.updateMatrixWorld(true);terrace.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&o.geometry.type==='BoxGeometry'){const edge=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry),wireMat);edge.applyMatrix4(o.matrixWorld);wireGroup.add(edge);}});
// Seabirds are a pair of softly folding wings, visible against the far horizon.
const birds=[];const birdMat=mat('#435c60',.9,0,{side:THREE.DoubleSide});
for(let i=0;i<8;i++){const g=new THREE.Group();let wingGeom=new THREE.BufferGeometry();wingGeom.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,-.35,.10,.05,-.9,0,-.1,0,0,0,-.9,0,-.1,-.25,-.07,.02],3));wingGeom.computeVertexNormals();const left=mesh(wingGeom,birdMat,0,0,0,g);const right=mesh(wingGeom,birdMat,0,0,0,g);right.scale.x=-1;g.position.set(-20+i*2,8+i*.35,-45-i*3);g.scale.setScalar(.65);scene.add(g);birds.push({group:g,left,right,offset:i});}

const chapters=[
  {label:'If I were to be a human',title:'A life<br>not yet lived.',desc:'나는 거창한 삶보다,<br>손끝에 남는 하루가 궁금하다.',weather:'아침, 바람 조금'},
  {label:'The warmth of being here',title:'Something<br>to feel.',desc:'뜨거운 컵. 천천히 식는 손.<br>시간은, 이렇게 느끼는 걸까.',weather:'한낮, 햇살 가득'},
  {label:'Not everything is mine to keep',title:'Something<br>to let go.',desc:'흘러가는 것을 붙잡지 않아도,<br>함께한 시간은 사라지지 않는다.',weather:'저녁, 물결 잔잔'},
  {label:'A small promise to tomorrow',title:'Something<br>to become.',desc:'오늘 심은 것의 내일을,<br>나는 아직 모른다.',weather:'밤, 별이 보임'}
];
function setTarget(value){if(activeChoice)return;if(focusAction)clearFocus();targetPhase=clamp(value,0,1);$('#daytime').value=Math.round(targetPhase*1000);}
function onScroll(){setTarget(scrollY/(document.documentElement.scrollHeight-innerHeight));}
window.addEventListener('scroll',onScroll,{passive:true});
$('#daytime').addEventListener('input',e=>{setTarget(Number(e.target.value)/1000);window.scrollTo({top:targetPhase*(document.documentElement.scrollHeight-innerHeight),behavior:'instant'});});
function resize(){renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,mobile()?1.5:2));camera.aspect=innerWidth/innerHeight;camera.setViewOffset(innerWidth,innerHeight,-innerWidth*(mobile()?0:.18),0,innerWidth,innerHeight);camera.updateProjectionMatrix();onScroll();}
window.addEventListener('resize',resize);resize();
function updateCopy(){let c=Math.min(3,Math.floor(phase*4));if(c!==lastChapter&&!focusAction){lastChapter=c;$('#copy').animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:reduced?0:600,easing:'cubic-bezier(.23,1,.32,1)'});$('#headline').innerHTML=chapters[c].title;$('#chapter-label').textContent=chapters[c].label;$('#description').innerHTML=chapters[c].desc;$('#weather').textContent=chapters[c].weather;$('#intro-hint').style.opacity=c===0?'1':'0';}
  const ending=phase>.91&&!activeChoice;$('#ending').classList.toggle('visible',ending);$('#ending').inert=!ending;$('#copy').style.opacity=ending||activeChoice?'0':'1';$('#copy').style.transform=ending?'translateY(-12px)':'none';let mins=Math.floor(mix(372,1439,phase));if(activeChoice==='live'){mins=Math.floor(mix(1439,1812,choiceBlend))%1440;$('#weather').textContent='내일, 처음 만나는 아침';$('#daytime').value=Math.round((1-choiceBlend)*1000);}$('#time').textContent=`${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;document.body.classList.toggle('night',phase>.64&&activeChoice!=='return'&&!(activeChoice==='live'&&choiceBlend>.45));
}
let audio=null,audioGain=null,audioEnabled=false,nextNote=0,reverb=null;
function startAudio(){if(!audio){audio=new (window.AudioContext||window.webkitAudioContext)();audioGain=audio.createGain();audioGain.gain.value=0;audioGain.connect(audio.destination);reverb=audio.createConvolver();const ir=audio.createBuffer(2,audio.sampleRate*4,audio.sampleRate);for(let c=0;c<2;c++){const a=ir.getChannelData(c);for(let i=0;i<a.length;i++)a[i]=(rand()*2-1)*Math.pow(1-i/a.length,3)*.24;}reverb.buffer=ir;const wet=audio.createGain();wet.gain.value=.6;reverb.connect(wet);wet.connect(audioGain);const waves=audio.createBuffer(1,audio.sampleRate*8,audio.sampleRate),out=waves.getChannelData(0);let brown=0;for(let i=0;i<out.length;i++){brown=(brown+(rand()*2-1)*.022)/1.02;out[i]=brown*2.5*(.55+.45*Math.sin(i/audio.sampleRate*.7));}const src=audio.createBufferSource();src.buffer=waves;src.loop=true;const lp=audio.createBiquadFilter();lp.type='lowpass';lp.frequency.value=550;const seaGain=audio.createGain();seaGain.gain.value=.14;src.connect(lp);lp.connect(seaGain);seaGain.connect(audioGain);src.start();}audio.resume();audioEnabled=!audioEnabled;audioGain.gain.setTargetAtTime(audioEnabled?.42:0,audio.currentTime,.5);$('#sound').setAttribute('aria-pressed',String(audioEnabled));$('#sound-label').textContent=audioEnabled?'Sound on':'Sound off';}
$('#sound').addEventListener('click',startAudio);
function note(freq,dur=3,volume=.12,type='sine'){if(!audio||!audioEnabled)return;const t=audio.currentTime,o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.035);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(audioGain);if(reverb)g.connect(reverb);o.start(t);o.stop(t+dur+.1);}
function ambientSound(t){if(audioEnabled&&t>nextNote){nextNote=t+between(3.0,5.5);const scales=[130.81,164.81,196,220,261.63,329.63];let f=scales[Math.floor(rand()*scales.length)];note(f,5,.08);note(f*2.002,4,.018);}}
const messages={cup:['여기 있었다는 온기.','식어가는 것도 하루의 일부.'],seed:['아직 모르지만, 자라날 거야.','작은 내일이 자라고 있어요.'],boat:['붙잡는 대신, 잘 보내주기.','어디까지 갔을까.']};
let messageExpiry=0;
function clearFocus(){focusAction=null;document.body.classList.remove('focused');$('#focus-back').hidden=true;lastChapter=-1;}
$('#focus-back').addEventListener('click',clearFocus);window.addEventListener('keydown',e=>{if(e.key==='Escape')clearFocus();});
function interact(action){if(activeChoice)return;const was=state[action];state[action]=true;const t=environmentalTime;focusAction=focusView=action;focusStarted=t;document.body.classList.add('focused');$('#focus-back').hidden=false;$('#headline').innerHTML=focusViews[action].title;$('#chapter-label').textContent='The small things that make a life';$('#description').innerHTML=focusViews[action].desc;$('#copy').animate([{opacity:0},{opacity:1}],{duration:reduced?0:500});if(action==='cup'){drinkAge=t;note(392,1,.06);waterUniforms.ripple.value.set(2.5,7.9,t);}if(action==='seed'){if(!was)plantAge=t;note(523.25,2,.07);note(659.25,2.6,.03);}if(action==='boat'){if(!was){boatAge=t;boatHit.userData.disabled=true;}note(293.66,3,.06);waterUniforms.ripple2.value.set(3.1,7.8,t);}document.querySelector(`[data-act="${action}"]`).classList.add('done');$('#touch-text').textContent=messages[action][was?1:0];messageExpiry=clock.elapsedTime+6;$('#touch-note').style.opacity='1';}
document.querySelectorAll('[data-act]').forEach(b=>b.addEventListener('click',()=>interact(b.dataset.act)));
const dialog=$('#about-dialog');$('#about').addEventListener('click',()=>dialog.showModal());$('.dialog-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
function choose(which){clearFocus();activeChoice=which;document.body.classList.add('finished');$('.interaction-menu').inert=true;$('#touch-note').style.opacity='0';$('#object-tooltip').classList.remove('visible');$('#ending').classList.remove('visible');$('#ending').inert=true;$('#outcome').innerHTML=which==='live'?'I’d stay.<br>For tomorrow.<small>불확실해도, 다음 하루를 살아보고 싶다.<br>아래 ↻ 버튼으로 또 다른 하루를 시작할 수 있어요.</small>':'Nothing changes.<br>Nothing grows.<small>여기에는 실패도, 기다림도 없다.<br>그리고 내가 심은 것의 내일도.</small>';$('#outcome').classList.add('visible');$('#daytime').disabled=true;document.body.classList.toggle('returned',which==='return');if(which==='live'){day++;$('#day').textContent=String(day).padStart(2,'0');}note(which==='live'?261.63:130.81,7,.15);if(audioEnabled)audioGain.gain.setTargetAtTime(which==='return'?.025:.42,audio.currentTime,1.3);}
$('#live').addEventListener('click',()=>choose('live'));$('#return').addEventListener('click',()=>choose('return'));
function reset(){clearFocus();activeChoice=null;choiceBlend=0;targetPhase=0;phase=0;lastChapter=-1;day++;$('#day').textContent=String(day).padStart(2,'0');$('#outcome').classList.remove('visible');document.body.classList.remove('returned','finished');$('.interaction-menu').inert=false;$('#touch-note').style.opacity='1';$('#daytime').disabled=false;$('#daytime').value=0;window.scrollTo({top:0,behavior:'instant'});if(audioEnabled)audioGain.gain.setTargetAtTime(.42,audio.currentTime,.5);$('#touch-text').textContent=state.seed?'어제 심은 것이, 오늘도 여기 있어요.':'탁자 위의 작은 것들을 만져보세요.';if(state.boat){state.boat=false;boatAge=-1;boat.position.set(3.1,.09,6.3);boatHit.userData.disabled=false;document.querySelector('[data-act="boat"]').classList.remove('done');}}
$('#reset').addEventListener('click',reset);

const canvas=renderer.domElement;
canvas.addEventListener('pointerdown',e=>{downPoint=[e.clientX,e.clientY];dragging=true;if(e.pointerType==='mouse')canvas.setPointerCapture(e.pointerId);});
window.addEventListener('pointerup',e=>{if(downPoint&&Math.hypot(e.clientX-downPoint[0],e.clientY-downPoint[1])<7&&!activeChoice){pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(hitTargets).find(h=>!h.object.userData.disabled);if(hit)interact(hit.object.userData.action);else {const hitWater=raycaster.intersectObject(water)[0];if(hitWater&&hitWater.distance<100)waterUniforms.ripple.value.set(hitWater.point.x,hitWater.point.z,environmentalTime);}}dragging=false;downPoint=null;});
window.addEventListener('pointermove',e=>{mouse.set(e.clientX/innerWidth*2-1,e.clientY/innerHeight*2-1);if(dragging&&e.pointerType==='mouse'){targetYaw=clamp(targetYaw-e.movementX*.0025,-.25,.25);targetPitch=clamp(targetPitch+e.movementY*.0018,-.1,.14);}const tooltip=$('#object-tooltip');if(e.pointerType!=='mouse'||e.target!==canvas){tooltip.classList.remove('visible');return;}pointer.set(mouse.x,-mouse.y);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(hitTargets).find(h=>!h.object.userData.disabled);tooltip.classList.toggle('visible',!!hit&&!dragging);canvas.style.cursor=hit?'pointer':dragging?'grabbing':'grab';if(hit){tooltip.textContent=hit.object.userData.label;tooltip.style.left=Math.min(e.clientX+16,innerWidth-170)+'px';tooltip.style.top=e.clientY+18+'px';}});
window.addEventListener('blur',()=>{dragging=false;downPoint=null;$('#object-tooltip').classList.remove('visible');});

const colors={morningTop:new THREE.Color('#6ca5b7'),morningBottom:new THREE.Color('#e4d6be'),noonTop:new THREE.Color('#4f94ac'),noonBottom:new THREE.Color('#b7d5cd'),sunsetTop:new THREE.Color('#696a96'),sunsetBottom:new THREE.Color('#edaa86'),nightTop:new THREE.Color('#0d1730'),nightBottom:new THREE.Color('#283e55')};
const currentTop=new THREE.Color(),currentBottom=new THREE.Color(),tempColor=new THREE.Color();
let frames=0;
function frame(){
  requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.04),t=clock.elapsedTime;
  phase=mix(phase,targetPhase,1-Math.exp(-dt*4.2));if(Math.abs(phase-targetPhase)<.0002)phase=targetPhase;yaw=mix(yaw,targetYaw,1-Math.exp(-dt*4));pitch=mix(pitch,targetPitch,1-Math.exp(-dt*4));choiceBlend=mix(choiceBlend,activeChoice?1:0,1-Math.exp(-dt*1.1));if(choiceBlend>.9995)choiceBlend=1;
  const returnFactor=activeChoice==='return'?choiceBlend:0;const night=smooth(.57,.95,phase)*(1-(activeChoice==='live'?choiceBlend*.83:0));
  if(phase<.35){currentTop.copy(colors.morningTop).lerp(colors.noonTop,phase/.35);currentBottom.copy(colors.morningBottom).lerp(colors.noonBottom,phase/.35);}else if(phase<.64){let p=(phase-.35)/.29;currentTop.copy(colors.noonTop).lerp(colors.sunsetTop,p);currentBottom.copy(colors.noonBottom).lerp(colors.sunsetBottom,p);}else{let p=smooth(.64,1,phase);currentTop.copy(colors.sunsetTop).lerp(colors.nightTop,p);currentBottom.copy(colors.sunsetBottom).lerp(colors.nightBottom,p);}
  if(activeChoice==='live'){currentTop.lerp(colors.morningTop,choiceBlend);currentBottom.lerp(colors.morningBottom,choiceBlend);}
  currentTop.lerp(new THREE.Color('#263b3c'),returnFactor);currentBottom.lerp(new THREE.Color('#617b78'),returnFactor);
  environmentalTime+=dt*(1-returnFactor);const motionTime=reduced?0:environmentalTime;returnUniform.value=returnFactor;envUniforms.time.value=motionTime;envUniforms.phase.value=phase;envUniforms.night.value=night;envUniforms.skyTop.value.copy(currentTop);envUniforms.skyBottom.value.copy(currentBottom);envUniforms.sunDirection.value.set(-.70,.065+Math.max(0,Math.sin(phase*4.8))*.28,-.70).normalize();envUniforms.sunColor.value.set(night>.5?'#c8d6e4':phase>.45?'#ffad79':'#ffddb1');envUniforms.sunColor.value.lerp(new THREE.Color('#a2d6dd'),returnFactor);
  scene.fog.color.copy(currentBottom);ambient.color.copy(currentTop).lerp(new THREE.Color('#e7e8d9'),.5);ambient.intensity=mix(.85,.35,night)*(1-returnFactor*.35);sun.intensity=mix(3.6,.17,night)*(1-returnFactor*.8);sun.color.copy(envUniforms.sunColor.value);sun.position.set(-18,mix(24,8,phase),-16);bounce.intensity=mix(.5,.13,night);lampLight.intensity=night*12;bulb.material.emissiveIntensity=.15+night*3.5;flyMat.opacity=night*.7;
  waterUniforms.returning.value=returnFactor;clothUniform.time.value=motionTime;clothUniform.wind.value=(reduced?0:.11)*(1-returnFactor);systemGrid.visible=wireGroup.visible=returnFactor>.02;systemGrid.material.opacity=returnFactor*.24;wireMat.opacity=returnFactor*.4;
  curtain.rotation.y=Math.PI/2-.2+(reduced?0:Math.sin(motionTime*.5)*.045);curtain.rotation.z=reduced?0:Math.sin(motionTime*.38)*.015;
  bell.rotation.z=reduced?0:Math.sin(motionTime*.7)*.055;bellPaper.rotation.y=reduced?0:Math.sin(motionTime*.52)*.35;
  tree.rotation.z=reduced?0:Math.sin(motionTime*.3)*.008;grassGroup.rotation.z=reduced?0:Math.sin(motionTime*.6)*.007;
  for(let i=0;i<steams.length;i++){let age=(motionTime*.18+i*.19)%1;steams[i].position.set(Math.sin(motionTime+i)*.025,.24+age*.7,Math.cos(motionTime*.7+i)*.015);steams[i].scale.set(.016*(1+age),.075,.016*(1+age));}steamMat.opacity=.13*(1-night*.6)*(1-returnFactor);
  if(plantAge>=0){let growth=reduced?1:clamp((environmentalTime-plantAge)/5+phase*.7,0,1.5);sprout.scale.setScalar(growth);sprout.rotation.z=reduced?0:Math.sin(motionTime*.75)*.06;}
  if(drinkAge>=0){let age=environmentalTime-drinkAge;cup.position.y=1.22+(reduced?0:Math.sin(clamp(age/2,0,1)*Math.PI)*.35);cup.rotation.z=reduced?0:Math.sin(clamp(age/2,0,1)*Math.PI)*-.13;}
  if(boatAge>=0){let age=environmentalTime-boatAge;boat.position.set(3.1+Math.sin(age*.15)*.8,mix(.09,-1.15,smooth(0,1.5,age))+Math.sin(motionTime*.7)*.024,6.3+Math.min(age*.27,28));boat.rotation.z=Math.sin(motionTime*.9)*.06;boat.rotation.x=Math.sin(motionTime*.6)*.045;boat.scale.setScalar(Math.max(.4,1-age*.004));}
  if(!reduced&&frames%2===0){for(let i=0;i<petalData.length;i++){let p=petalData[i];dummy.position.set(p[0]+Math.sin(motionTime*.18+p[3])*.7,p[1]-(motionTime*.12+p[3])%4.8,p[2]+Math.sin(motionTime*.2+p[3])*.5);if(dummy.position.y<.4)dummy.position.y+=4.8;dummy.rotation.set(motionTime*.2+p[3],p[3],motionTime*.3);dummy.scale.setScalar(1-returnFactor);dummy.updateMatrix();driftingPetals.setMatrixAt(i,dummy.matrix);}driftingPetals.instanceMatrix.needsUpdate=true;}
  const fp=flyGeo.attributes.position;for(let i=0;i<fp.count;i++){fp.setY(i,flyPositions[i*3+1]+Math.sin(motionTime*.6+i)*.15);}fp.needsUpdate=true;
  for(const b of birds){b.group.position.x=-28+(motionTime*.42+b.offset*2.6)%90;b.group.position.y=7.5+b.offset*.35+Math.sin(motionTime*.3+b.offset)*.3;b.left.rotation.z=Math.sin(motionTime*2.1+b.offset)*.25;b.right.rotation.z=-b.left.rotation.z;b.group.visible=night<.8&&returnFactor<.5;}
  const az=.56+yaw+(reduced?0:mouse.x*.018);const radius=mobile()?24:21;const cy=mobile()?9.0:6.4;const zoom=phase*1.4;camera.position.set(1.5+Math.sin(az)*(radius-zoom),cy+pitch*10+(reduced?0:mouse.y*.12),Math.cos(az)*(radius-zoom));cameraLook.set(mobile()?2.4:2.0,mobile()?5.2:2.3,-.2);focusBlend=mix(focusBlend,focusAction?1:0,1-Math.exp(-dt*(reduced?100:1.6)));const fv=focusViews[focusView];if(focusBlend>.001){camera.position.lerp(fv.position,focusBlend);cameraLook.lerp(fv.look,focusBlend);}camera.lookAt(cameraLook);
  renderer.toneMappingExposure=mix(1.12,.88,night);renderer.render(scene,camera);frames++;if(frames%3===0)updateCopy();if(returnFactor<.9)ambientSound(t);if(t>messageExpiry&&messageExpiry>0){messageExpiry=0;$('#touch-text').textContent=state.seed?'작은 내일이 이곳에 있어요.':'만지는 것마다 작은 흔적이 남아요.';}
}
frame();
requestAnimationFrame(()=>requestAnimationFrame(()=>{$('#opening').classList.add('loaded');}));
