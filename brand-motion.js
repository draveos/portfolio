import { drawBrandScene } from './brand-scenes.js?v=20261014-motion16';
import { drawArchitecture } from './architecture-motion.js?v=20261014-motion12';
// Original canvas motion studies. No videos, raster assets or remote dependencies.
export function createBrandMotion(host){
  const canvas=document.createElement('canvas');canvas.className='brand-motion';canvas.setAttribute('aria-hidden','true');host.append(canvas);
  const c=canvas.getContext('2d');let w=1,h=1;
  const clamp=v=>Math.max(0,Math.min(1,v));
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  function sparkle(ctx,r){ctx.beginPath();ctx.moveTo(0,-r);ctx.bezierCurveTo(r*.12,-r*.18,r*.18,-r*.12,r,0);ctx.bezierCurveTo(r*.18,r*.12,r*.12,r*.18,0,r);ctx.bezierCurveTo(-r*.12,r*.18,-r*.18,r*.12,-r,0);ctx.bezierCurveTo(-r*.18,-r*.12,-r*.12,-r*.18,0,-r);ctx.closePath();}
  // LobeHub vector paths, embedded locally; their trademark shapes remain unchanged.
  const claudePath=new Path2D('M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z');
  const openaiPath=new Path2D('M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z');
  function claude(ctx,r){ctx.save();ctx.scale(r/12,r/12);ctx.translate(-12,-12);ctx.fillStyle=ctx.strokeStyle;ctx.fill(claudePath);ctx.restore();}
  function knot(ctx,r){ctx.save();ctx.scale(r/12,r/12);ctx.translate(-12,-12);ctx.fillStyle=ctx.strokeStyle;ctx.fill(openaiPath,'evenodd');ctx.restore();}
  function icon(ctx,type,r){if(type===2){claude(ctx,r);}else if(type===3)knot(ctx,r);else{sparkle(ctx,r);ctx.fill();}}
  function typography(type,t,alpha){
    const p=smooth((t-5.8)/1.7), names=['','','Claude','Codex','Gemini'];
    c.save();c.globalAlpha=alpha*p;c.translate(w/2,h*.73+(1-p)*12);
    c.fillStyle=['','','#312823','#153b3b','#35416d'][type];
    c.font=`${type===2?'500':'600'} ${Math.min(w*.08,42)}px ${type===2?'Georgia, serif':'"Segoe UI", sans-serif'}`;c.textAlign='center';c.fillText(names[type],0,0);
    c.font=`${Math.min(w*.019,10)}px monospace`;c.fillStyle='#84909c';c.fillText(`Working with ${names[type].toLowerCase()}`,0,26);c.restore();
  }
  function sketch(t,alpha){
    const r=Math.min(w*.19,h*.23),p=smooth((t-.5)/3),color=smooth((t-3.1)/3.6);
    c.save();c.translate(w/2,h*.43);c.globalAlpha=alpha;
    // Pencil construction lines, then a warm pigment wash across the drawing.
    c.strokeStyle='#b9b4ae';c.lineWidth=.65;c.setLineDash([3,6]);c.strokeRect(-r*1.43,-r*1.35,r*2.86,r*2.7);c.setLineDash([]);
    c.beginPath();c.arc(0,0,r*1.12,0,Math.PI*2*p);c.stroke();
    c.strokeStyle='#3f3c38';c.save();c.beginPath();c.rect(-r*1.2,-r*1.2,r*2.4,r*2.4*p);c.clip();claude(c,r);c.restore();
    c.save();c.beginPath();c.moveTo(-r*1.2,-r*1.2);c.lineTo(-r*1.2+r*2.4*color,-r*1.2);c.lineTo(-r*1.2+r*2.4*color+r*.3,r*1.2);c.lineTo(-r*1.2,r*1.2);c.closePath();c.clip();
    c.strokeStyle='#c97655';claude(c,r);c.restore();
    // A travelling pencil point makes the reveal legible as drawing.
    if(t<3.8){c.globalAlpha=alpha;c.fillStyle='#60554b';c.beginPath();c.arc(r*Math.cos(p*6.28),r*Math.sin(p*6.28),2,0,6.28);c.fill();}c.restore();
  }
  function fluid(t,alpha){
    const r=Math.min(w*.2,h*.24),reveal=smooth((t-1)/5.2);
    c.save();c.translate(w/2,h*.43);c.globalAlpha=alpha*reveal;
    // Layered closed ribbons with advected control points, not a fluid simulation.
    // The broad transparent field emerges first, the vector mark settles last.
    for(let j=0;j<13;j++){
      const phase=t*.29+j*.27,rad=r*(1.30-j*.032),squash=.62+j*.018;
      c.save();c.rotate(Math.sin(phase*.42)*.48+j*.095);
      const gradient=c.createLinearGradient(-rad,-rad,rad,rad);gradient.addColorStop(0,'rgba(27,184,159,.02)');gradient.addColorStop(.34,'rgba(67,209,182,.32)');gradient.addColorStop(.63,'rgba(30,110,117,.38)');gradient.addColorStop(1,'rgba(165,235,218,.05)');
      c.strokeStyle=gradient;c.lineWidth=r*.19;c.beginPath();
      for(let i=0;i<=80;i++){const a=i/80*Math.PI*2,rr=rad*(1+.18*Math.sin(a*3+phase)+.08*Math.cos(a*2-phase));const x=Math.cos(a)*rr,y=Math.sin(a)*rr*squash; i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.stroke();c.restore();
    }
    const resolve=smooth((t-4)/3.6);c.globalAlpha=alpha*resolve;c.strokeStyle='#174a46';c.shadowColor='#71d9bf';c.shadowBlur=14*resolve;knot(c,r*.65);c.restore();
  }
  function gemini(t,alpha){
    const settle=smooth((t-.6)/5),r=Math.min(w*.18,h*.23);
    c.save();c.translate(w/2,h*.43);c.globalAlpha=alpha;
    const g=c.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'#6a9cf5');g.addColorStop(.45,'#8075de');g.addColorStop(.78,'#af81cb');g.addColorStop(1,'#d7b8dd');
    // Entirely 2D: orbiting sparkles resolve into the stationary gradient symbol.
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4+t*.34,spread=(1-settle)*Math.min(w,h)*.39;
      c.save();c.translate(Math.cos(a)*spread,Math.sin(a)*spread*.8);c.rotate((1-settle)*(a+.4));c.globalAlpha=alpha*(1-settle)*.65;c.fillStyle=g;sparkle(c,r*(.16+i%3*.04));c.fill();c.restore();
    }
    c.globalAlpha=alpha*smooth((t-1)/3);c.rotate((1-settle)*.7);c.fillStyle=g;sparkle(c,r*(.85+.15*settle));c.fill();c.restore();
  }
  function glow(type,t,alpha){
    const b=clamp((t-8.1)/2.2);if(b<=0||b>=1)return;
    c.save();c.translate(w/2,h*.43);c.globalAlpha=alpha*Math.sin(b*Math.PI)*.9;c.strokeStyle=['','','#805342','#266d62','#62569c'][type];c.lineWidth=.9;
    for(let i=0;i<68;i++){const a=i/68*Math.PI*2,r=Math.min(w,h)*(.24+b*.17),len=8+i%5*5;c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(a)*(r+len),Math.sin(a)*(r+len));c.stroke();}c.restore();
  }
  function update(type,t,staticMode){
    c.clearRect(0,0,w,h);canvas.style.opacity=type!==1?'1':'0';if(type===0){drawArchitecture(c,w,h,staticMode?17:t,Math.min(1,t/.5)*clamp((20-t)/1.1));return;}if(type<2)return;
    const alpha=Math.min(1,t/.7)*clamp((13.6-t)/1.1);
    drawBrandScene(c,w,h,type,t,alpha);
    if(type===2)sketch(t,alpha);if(type===3)fluid(t,alpha);if(type===4)gemini(t,alpha);
    typography(type,t,alpha);if(!staticMode)glow(type,t,alpha);
    c.globalAlpha=1;
  }
  return {update,resize(width,height){w=width;h=height;const d=Math.min(devicePixelRatio,1.6);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);c.setTransform(d,0,0,d,0,0);},dispose(){canvas.remove();}};
}
