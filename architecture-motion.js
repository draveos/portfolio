// Illustrative process, not live telemetry. Each route draws once, reaches its end,
// then stays connected. No cyclic pulses or travelling dots.
export function drawArchitecture(c,w,h,t,alpha){
  const clamp=v=>Math.max(0,Math.min(1,v));
  const ease=v=>{v=clamp(v);return v*v*(3-2*v);};
  const progress=(start,duration)=>ease((t-start)/duration);
  // Fit the actual drawing bounds, including text descent and stroke glow.
  // Centering the origin alone clipped the footer on short/wide viewports.
  const bounds={left:-252,right:252,top:-148,bottom:184},padding=12;
  const scale=Math.max(.01,Math.min((w-padding*2)/(bounds.right-bounds.left),(h-padding*2)/(bounds.bottom-bounds.top)));
  const centerY=(bounds.top+bounds.bottom)/2;
  c.save();c.translate(w/2,h/2-centerY*scale);c.scale(scale,scale);c.globalAlpha=alpha;
  const ink='#5c6d85',blue='#617da6',red='#a45f50',green='#4f8062';
  const approved=progress(14.1,.7);
  const returnColor=`rgb(${Math.round(164+(79-164)*approved)},${Math.round(95+(128-95)*approved)},${Math.round(80+(98-80)*approved)})`;
  function text(s,x,y,size=12,color=ink,a=1){c.save();c.globalAlpha=alpha*a;c.font=`${size}px Menlo, monospace`;c.textAlign='center';c.fillStyle=color;c.fillText(s,x,y);c.restore();}
  function path(points,p=1){
    const lens=points.slice(1).map((q,i)=>Math.hypot(q[0]-points[i][0],q[1]-points[i][1]));
    let remaining=lens.reduce((a,b)=>a+b,0)*clamp(p);
    c.beginPath();c.moveTo(...points[0]);
    for(let i=0;i<lens.length;i++){const a=points[i],b=points[i+1],fraction=Math.min(1,remaining/lens[i]);if(fraction<=0)break;c.lineTo(a[0]+(b[0]-a[0])*fraction,a[1]+(b[1]-a[1])*fraction);remaining-=lens[i];}
  }
  function route(points,start,duration,color=blue){
    const p=progress(start,duration);if(!p)return;
    c.save();path(points,p);c.strokeStyle=color;c.lineWidth=2.5;c.lineCap='round';
    const arriving=Math.sin(p*Math.PI);c.shadowColor=color;c.shadowBlur=arriving*7;c.globalAlpha=alpha*(.6+.4*arriving);c.stroke();c.restore();
  }
  function outline(x,y,width,height,p,stroke,fill,focus=0){
    const perimeter=2*(width+height),baseAlpha=c.globalAlpha;
    c.save();c.beginPath();c.roundRect(x-width/2,y-height/2,width,height,6);
    c.fillStyle=fill;c.globalAlpha=baseAlpha*ease((p-.45)/.55);c.fill();
    c.globalAlpha=baseAlpha;c.strokeStyle=stroke;c.lineWidth=1.1+focus*.55;c.setLineDash([perimeter*p,perimeter]);c.stroke();c.restore();
  }
  function node(x,y,label,index,arrival,leave){
    const sketch=progress(.18+index*.17,.95);
    const focus=progress(arrival,.45)*(1-progress(leave,.55));
    outline(x,y,98,57,sketch,focus>.01?`rgba(92,122,166,${.55+focus*.4})`:'#bdcbdc',`rgba(226,235,248,${.16+focus*.65})`,focus);
    text(label,x,y+7,12,'#4a6080',sketch);text(`0${index+1}`,x,y-13,9,'#91a0b4',sketch);
  }
  text('AGENT WORKFLOW',0,-134,14,'#34475f',progress(0,.6));
  text('PLAN / BUILD / VERIFY / REVISE',0,-114,10,ink,progress(.3,.65));
  const xs=[-195,-65,65,195];
  node(xs[0],0,'REQUEST',0,1.4,2.8);
  node(xs[1],0,'PLAN',1,3,4.5);
  node(xs[2],0,'BUILD',2,5,6.7);
  node(xs[3],0,'VERIFY',3,7.1,9.6);
  // All skeleton wires are drawn before the work begins.
  const wires=[[[ -146,0],[-114,0]],[[ -16,0],[16,0]],[[114,0],[146,0]]];
  wires.forEach((points,i)=>{c.save();path(points,progress(.7+i*.12,.7));c.strokeStyle='#d7e0eb';c.lineWidth=1;c.stroke();c.restore();});
  ['PLANNER','BUILDER','VERIFIER'].forEach((name,i)=>{
    const x=xs[i+1],sketch=progress(.6+i*.18,.85);
    const arrival=[3.25,5.25,7.35][i],focus=progress(arrival,.4)*(1-progress(arrival+1,.5));
    outline(x,-76,94,27,sketch,focus>.01?'#8098b9':'#cbd7e5',`rgba(226,235,248,${.2+focus*.55})`,focus);
    text(name,x,-72,10,'#6a7e98',sketch);
    route([[x,-29],[x,-62]],arrival,.5);
  });
  route(wires[0],2.15,.8);route(wires[1],4.1,.8);route(wires[2],6.25,.8);
  // Output is assembled only after build receives work.
  const output=progress(5.05,.8);
  outline(65,101,118,68,output,'#c4d2e1','#fff');text(t>=12.4?'OUTPUT v2':'OUTPUT v1',65,80,9,ink,output);
  const discovered=progress(8.6,.55),repair=progress(12.4,.65);
  for(let i=0;i<6;i++){
    const x=29+(i%3)*36,y=95+Math.floor(i/3)*21,p=progress(5.3+i*.09,.55);
    const bad=i===4?discovered*(1-repair):0,good=i===4?repair:0;
    outline(x,y,29,13,p,'#bacadd','#e7edf6');
    if(bad>0){c.save();c.globalAlpha=alpha*bad;outline(x,y,29,13,1,red,'#f1d9d3');c.restore();}
    if(good>0){c.save();c.globalAlpha=alpha*good;outline(x,y,29,13,1,green,'#dfede3');c.restore();}
  }
  route([[65,29],[65,67]],5.7,.65);
  // Verdicts are revealed as quick lettering strokes, followed by readable holds.
  function verdict(word,x,y,start,color,fadeAt=99){
    const draw=progress(start,.65),fade=1-progress(fadeAt,.65);if(!draw||!fade)return;
    c.save();c.globalAlpha=alpha*fade;c.font='600 14px Menlo, monospace';c.textAlign='center';const width=c.measureText(word).width;
    c.beginPath();c.rect(x-width/2-2,y-18,width*draw+4,23);c.clip();c.strokeStyle=color;c.lineWidth=.45;c.strokeText(word,x,y);c.fillStyle=color;c.globalAlpha*=progress(start+.2,.45);c.fillText(word,x,y);c.restore();
  }
  verdict('REJECTED',195,59,7.95,red,13.6);
  // First identify the faulty component, then route it back. Labels sit clear of wires.
  const diagnosis=progress(8.45,.7);
  outline(-74,100,106,34,diagnosis,t>=13.6?'#9caf9d':'#c4a49c',t>=13.6?'#f1f6f2':'#fcf5f2');
  text(t>=13.6?'FIXED':'CHECK FAILED',-74,96,9,t>=13.6?green:red,diagnosis);
  text('component 05',-74,110,8,'#987367',diagnosis);
  route([[65,116],[65,147],[-74,147],[-74,117]],9.1,1.15,returnColor);
  route([[-74,147],[-195,147],[-195,43],[-65,43],[-65,29]],10.3,1.45,returnColor);
  text('PATCH',-145,128,10,red,progress(11.1,.5)*(1-progress(13.2,.5)));
  // Second pass is faster, but each edge reaches its actual endpoint.
  route([[-16,0],[16,0]],11.8,.55,blue);
  route([[65,-29],[65,-62]],12.05,.4,blue);
  route([[65,29],[65,67]],12.4,.45,green);
  route([[114,0],[146,0]],13.0,.55,green);
  route([[195,-29],[195,-62]],13.55,.4,green);
  verdict('ACCEPTED',195,59,14.1,green);
  const release=progress(14.85,.8);
  route([[124,101],[151,101]],14.85,.8,green);
  outline(195,101,88,37,release,'#94b39f','#eef5f0');text('ARTIFACT',195,100,10,green,release);text('VERIFIED',195,113,8,'#799685',release);
  text(t<8?'REQUEST → PLAN → BUILD → VERIFY':t<12?'CHECK / DIAGNOSE / PATCH':t<14.1?'REBUILD / RECHECK':'CHECKS PASSED / RELEASE',0,176,10,t>=14.1?green:'#8291a5',progress(.7,.7));
  c.restore();
}
