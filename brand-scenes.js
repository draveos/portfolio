// Peripheral motion graphics: staged openings and single-pass connections.
// These are illustrative traces, not actual shell sessions or generated documents.
export function drawBrandScene(c,w,h,type,t,alpha){
  const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
  const scale=Math.min(w/600,h/420);c.save();c.translate(w/2,h*.43);c.scale(scale,scale);c.globalAlpha=alpha;
  function text(s,x,y,size=8,color='#738394',align='left'){c.font=`${size}px Menlo,monospace`;c.fillStyle=color;c.textAlign=align;c.fillText(s,x,y);}
  function panel(x,y,width,height,title,p,accent){
    c.save();c.globalAlpha=alpha*p;c.translate(x,y+(1-p)*15);
    c.beginPath();c.roundRect(-width/2,-height/2,width,height,5);c.fillStyle='rgba(255,255,255,.90)';c.fill();c.strokeStyle='#c9d3df';c.lineWidth=.85;c.stroke();
    c.fillStyle=accent;c.fillRect(-width/2+8,-height/2+9,4,4);
    text(title,-width/2+18,-height/2+13,7,'#7c889b');
    c.beginPath();c.moveTo(-width/2,-height/2+21);c.lineTo(width/2,-height/2+21);c.strokeStyle='#e4eaf0';c.stroke();
  }
  function wire(points,p,color){if(p<=0)return;c.save();c.beginPath();c.moveTo(...points[0]);const lengths=points.slice(1).map((q,i)=>Math.hypot(q[0]-points[i][0],q[1]-points[i][1]));let rest=lengths.reduce((a,b)=>a+b,0)*p;
    lengths.forEach((len,i)=>{const a=points[i],b=points[i+1],v=Math.min(1,Math.max(0,rest/len));if(v)c.lineTo(a[0]+(b[0]-a[0])*v,a[1]+(b[1]-a[1])*v);rest-=len;});c.strokeStyle=color;c.lineWidth=1;c.globalAlpha=alpha*.65;c.stroke();c.restore();}
  if(type===2){
    const terminals=[{x:-176,y:-64,title:'claude / implement',start:.6,lines:['$ claude','read src / scene.js','+ renderCanvas()','+ revealPigment()']},{x:161,y:-96,title:'claude / review',start:1.9,lines:['$ inspect --motion','contrast   ✓','timing     ✓','review complete']},{x:172,y:72,title:'claude / verify',start:3.1,lines:['$ run checks','syntax     PASS','viewport   PASS','ready to preview']}];
    terminals.forEach(v=>{const p=ease((t-v.start)/.6);panel(v.x,v.y,143,100,v.title,p,'#bb856a');v.lines.forEach((line,i)=>{const amount=clamp((t-v.start-.65-i*.37)/.5);text(line.slice(0,Math.ceil(line.length*amount)),-62,-13+i*15,8,i===0?'#a2674e':'#697787');});c.restore();});
  }
  if(type===3){
    const tasks=[{x:-173,y:-73,title:'PATCH / scene.js',start:.8,lines:['- static frame','+ motion.update(t)','+ dispose.onExit()']},{x:172,y:-92,title:'CHECK / viewport',start:2.1,lines:['resize  ✓','cleanup ✓','render  ✓']},{x:174,y:76,title:'DIFF / +24 −6',start:3.5,lines:['apply patch','run → inspect','iterate → resolve']}];
    tasks.forEach((v,j)=>{const p=ease((t-v.start)/.65);panel(v.x,v.y,142,87,v.title,p,'#599f8b');v.lines.forEach((line,i)=>{const amount=clamp((t-v.start-.5-i*.35)/.6);text(line.slice(0,Math.ceil(line.length*amount)),-61,-8+i*16,8,line[0]==='-'?'#ac7979':line[0]==='+'?'#4c9277':'#607e78');});c.restore();
      const end=[v.x+(v.x<0?71:-71),v.y];wire([[v.x<0?-85:85,j===2?25:-25],[v.x<0?-110:110,end[1]],end],ease((t-v.start-.4)/1.2),'#6ea694');});
  }
  if(type===4){
    const nodes=[{x:-174,y:-70,label:'IDEA',start:.65},{x:159,y:-95,label:'IMAGE',start:1.1},{x:175,y:74,label:'DOCUMENT',start:1.55},{x:-183,y:87,label:'CONNECT',start:2}];
    nodes.forEach((v,j)=>{const p=ease((t-v.start)/.55);wire([[Math.sign(v.x)*84,Math.sign(v.y)*24],[v.x*.67,v.y], [v.x,v.y]],p,['#95a6d5','#b5a1d2','#b8acd1','#9db9d6'][j]);
      c.save();c.globalAlpha=alpha*p;c.translate(v.x+(1-p)*-Math.sign(v.x)*18,v.y);c.beginPath();c.roundRect(-47,-31,94,62,6);c.fillStyle='rgba(255,255,255,.94)';c.fill();c.strokeStyle='#cbd4e7';c.lineWidth=.9;c.stroke();text(v.label,0,22,8,'#828ba9','center');
      if(j===0){c.beginPath();c.moveTo(0,-22);c.lineTo(9,-10);c.lineTo(0,3);c.lineTo(-9,-10);c.closePath();c.strokeStyle='#9d91c9';c.stroke();}
      else if(j===1){c.strokeStyle='#98add0';c.strokeRect(-15,-22,30,24);c.beginPath();c.moveTo(-13,0);c.lineTo(-3,-12);c.lineTo(5,-5);c.lineTo(12,-15);c.lineTo(14,0);c.stroke();}
      else if(j===2){c.strokeStyle='#b3a0cc';c.strokeRect(-11,-23,22,28);for(let i=0;i<3;i++){c.beginPath();c.moveTo(-6,-16+i*6);c.lineTo(6,-16+i*6);c.stroke();}}
      else{
        const nodes=[[-12,-16],[12,-16],[0,3]];
        c.strokeStyle='#8baaca';c.lineWidth=1.15;
        c.beginPath();c.moveTo(...nodes[0]);c.lineTo(...nodes[1]);c.lineTo(...nodes[2]);c.closePath();c.stroke();
        nodes.forEach(([x,y])=>{c.beginPath();c.arc(x,y,3.2,0,Math.PI*2);c.fillStyle='#fff';c.fill();c.strokeStyle='#7f9fc3';c.stroke();});
      }c.restore();});
  }
  c.restore();
}
