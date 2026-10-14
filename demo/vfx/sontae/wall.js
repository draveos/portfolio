/* wall.js — 손때: 회벽 셰이더. 전역 window.Wall (ES module 아님, 외부 의존 0)
 *
 * 계약
 *   Wall.init(canvas)              WebGL2 → WebGL1 → CSS 배경색 폴백. resize 리스너 등록 후 start().
 *   Wall.start() / Wall.stop()     내부 rAF 루프.
 *   Wall.resize()                  devicePixelRatio 최대 2.
 *   Wall.set(partial)              상태 병합. sunCol 은 [r,g,b](0..1) 또는 '#rrggbb'. mouse 는 {x,y}(0..1, 좌상단 원점).
 *   Wall.setMaps(touchCv, bleachCv) 2D 캔버스 두 장을 텍스처로 올린다(매 프레임 호출 가능). R 채널만 읽는다.
 *   Wall.presets                   장면별 추천 상태값(s0_first … s4_fork, endA, endB).
 *
 * 좌표: 모든 x,y 는 화면 비율 0..1, 좌상단 원점(sunX, sunY, bump 중심, mouse, 맵 샘플링 모두 같은 계).
 * fade 0→1 (결말 A, 약 23초): 0~0.45 저물고, 0.40~0.55 만진 자리가 #ffb77a 로 떠오르고, 0.72~0.95 꺼져 #050403.
 * collapse 0→1 (결말 B, 0.3초): 자국·요철·그레인·햇빛 전부 사라지고 평평한 #eef1f5 만 남는다.
 */
(function () {
  'use strict';

  var VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}';

  var FS = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform vec2 u_res;uniform float u_time;',
    'uniform float u_light,u_sunI,u_sunX,u_sunW,u_sunTilt,u_sunY,u_dust,u_age,u_bump,u_grain,u_season,u_fade,u_collapse,u_hasMaps;',
    'uniform vec3 u_sunCol;uniform vec2 u_mouse;',
    'uniform sampler2D u_touch,u_bleach;',
    '',
    'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);',
    ' float a=hash(i),b=hash(i+vec2(1.0,0.0)),c=hash(i+vec2(0.0,1.0)),d=hash(i+vec2(1.0,1.0));',
    ' return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}',
    'float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<3;i++){v+=a*vnoise(p);p=p*2.03+vec2(17.1,9.7);a*=0.5;}return v;}',
    'float band(float x,float h,float s){return 1.0-smoothstep(h-s,h+s,abs(x));}',
    'vec3 softclip(vec3 c){vec3 k=vec3(0.82);vec3 hi=k+(1.0-k)*(1.0-exp(-(c-k)/(1.0-k)));return mix(c,hi,step(k,c));}',
    '',
    'void main(){',
    ' vec2 uv=gl_FragCoord.xy/u_res;',
    ' vec2 st=vec2(uv.x,1.0-uv.y);',            // 좌상단 원점
    ' float asp=u_res.x/u_res.y;',
    ' vec2 p=vec2(st.x*asp,st.y);',
    // 회벽 요철
    ' float n1=fbm(p*6.0);',
    ' float n2=vnoise(p*18.0+3.1);',
    ' float n3=fbm(p*2.2+7.0);',
    ' float n4=vnoise(vec2(p.x*70.0,p.y*38.0));',
    ' float plaster=(n1-0.5)*0.06+(n2-0.5)*0.03+(n4-0.5)*0.018;',
    // 벽 색
    ' vec3 dawn=vec3(0.169,0.176,0.188),morn=vec3(0.902,0.878,0.831);',
    ' vec3 wall=mix(dawn,morn,u_light);',
    ' float sw=sin(u_season*6.2832);',
    ' wall*=vec3(1.0+0.02*sw,1.0,1.0-0.025*sw);',
    // 세월: 황변
    ' wall*=mix(vec3(1.0),vec3(0.939,0.888,0.759),u_age*0.8);',
    // 세월: 모서리 얼룩
    ' float r=length(st-0.5);',
    ' float stain=smoothstep(0.30,0.80,r)*(0.45+1.1*n3);',
    ' stain=clamp(stain,0.0,1.0);',
    ' wall*=mix(vec3(1.0),vec3(0.60,0.52,0.41),u_age*0.9*stain);',
    ' wall*=1.0+plaster*(1.0+1.2*(1.0-u_light));',
    // 햇빛 평행사변형
    ' float sx=st.x-u_sunX+(st.y-u_sunY)*u_sunTilt;',
    ' float sxe=sx+(n3-0.5)*0.012;',
    ' float hw=u_sunW*0.5;',
    ' float m=band(sxe,hw,0.02)*band(st.y-u_sunY,0.42,0.04);',
    ' float bv=band(sx,0.006,0.004);',
    ' float bh=band(st.y-(u_sunY+0.06),0.005,0.003);',
    ' float cross=1.0-0.45*max(bv,bh);',
    ' float sun=m*cross*u_sunI;',
    ' wall*=1.0-0.20*u_sunI*u_light*(1.0-m);',
    ' wall=mix(wall,wall*(0.70+0.45*u_sunCol),sun)+u_sunCol*sun*(0.13+0.30*(1.0-u_light))*(1.0+plaster*3.0);',
    // 빛 속 먼지
    ' float dustv=0.0;',
    ' for(int l=0;l<2;l++){float fl=float(l);float sc=42.0-fl*16.0;',
    '  vec2 q=p*sc+u_time*vec2(0.03,0.05)*(1.0+0.6*fl);',
    '  vec2 ci=floor(q),cf=fract(q);',
    '  float h1=hash(ci+fl*7.3),h2=hash(ci+fl*3.1+11.0),h3=hash(ci+fl*5.7+37.0);',
    '  vec2 pp=vec2(h1,h2)*0.8+0.1+0.07*vec2(sin(u_time*1.3+h1*6.28),cos(u_time*0.9+h2*6.28));',
    '  float d=length(cf-pp)/sc;',
    '  float tw=0.35+0.65*(0.5+0.5*sin(u_time*(1.2+h1*2.5)+h2*6.28));',
    '  dustv+=(1.0-smoothstep(0.0,0.0018+0.0025*h3,d))*tw*step(0.90,h3);}',
    ' wall+=mix(vec3(1.0,0.965,0.902),u_sunCol,0.6)*dustv*m*u_sunI*u_dust*0.22;',
    // 스위치 자리 요철 (가장자리 명암만)
    ' if(u_bump>0.0){vec2 bc=vec2(0.30,0.40),bh2=vec2(0.025,0.035);vec2 dl=st-bc;',
    '  float inX=step(abs(dl.x),bh2.x),inY=step(abs(dl.y),bh2.y);float e=0.006;',
    '  float top=inX*(1.0-smoothstep(0.0,e,abs(dl.y+bh2.y)));',
    '  float left=inY*(1.0-smoothstep(0.0,e,abs(dl.x+bh2.x)));',
    '  float bot=inX*(1.0-smoothstep(0.0,e,abs(dl.y-bh2.y)));',
    '  float rgt=inY*(1.0-smoothstep(0.0,e,abs(dl.x-bh2.x)));',
    '  wall+=u_bump*(0.7+0.6*n2)*(0.06*max(top,left)-0.08*max(bot,rgt));',
    '  wall*=1.0-0.03*inX*inY*u_bump;}',
    // 바램
    ' float b=u_hasMaps*texture2D(u_bleach,st).r;',
    ' float lum=dot(wall,vec3(0.3,0.59,0.11));',
    ' wall=mix(wall,mix(wall,vec3(lum),0.6)*1.04+0.025*u_light,b*0.9);',
    // 손때: 둘레 엄버, 중심 광택, 햇빛 지날 때 번득임
    ' float v=u_hasMaps*texture2D(u_touch,st).r;',
    ' float inner=smoothstep(0.35,0.9,v);',
    ' float rim=v*(1.0-inner*0.5);',
    ' wall=mix(wall,wall*vec3(0.62,0.52,0.40),rim*0.55);',
    ' float glint=sun*pow(max(0.0,1.0-abs(sx)/max(hw,0.001)),1.5);',
    ' vec2 md=(st-u_mouse)*vec2(asp,1.0);',
    ' float msheen=exp(-dot(md,md)/0.006)*0.10*u_light;',
    ' wall+=vec3(1.0,0.945,0.863)*inner*(0.035*u_light+glint*0.28+msheen);',
    ' wall=softclip(wall);',
    // 그레인
    ' wall+=(hash(mod(gl_FragCoord.xy,1024.0)+floor(u_time*24.0)*vec2(3.7,1.3))-0.5)*u_grain;',
    // 결말 A: 저물고, 만진 자리만 잠깐 남았다 꺼짐
    ' float dk=smoothstep(0.0,0.45,u_fade);',
    ' float lum2=dot(wall,vec3(0.3,0.59,0.11));',
    ' wall=mix(wall,vec3(lum2),dk*0.7);',
    ' wall=mix(wall,vec3(0.0196,0.0157,0.0118),dk);',
    ' float glow=smoothstep(0.40,0.55,u_fade)*(1.0-smoothstep(0.72,0.95,u_fade));',
    ' float ga=smoothstep(0.02,0.7,v);',
    ' float breath=0.92+0.08*sin(u_time*1.1+v*3.0);',
    ' wall+=vec3(1.0,0.718,0.478)*ga*glow*0.85*breath;',
    // 결말 B: 새 벽
    ' wall=mix(wall,vec3(0.933,0.945,0.961),clamp(u_collapse,0.0,1.0));',
    ' gl_FragColor=vec4(clamp(wall,0.0,1.0),1.0);',
    '}'
  ].join('\n');

  var UNIFORMS = ['u_res', 'u_time', 'u_light', 'u_sunI', 'u_sunX', 'u_sunW', 'u_sunTilt', 'u_sunY', 'u_dust', 'u_age',
    'u_bump', 'u_grain', 'u_season', 'u_fade', 'u_collapse', 'u_hasMaps', 'u_sunCol', 'u_mouse', 'u_touch', 'u_bleach'];

  function hex(h) {
    var n = parseInt(h.replace('#', ''), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  var state = {
    light: 0.08, sunI: 0, sunX: -0.35, sunW: 0.24, sunTilt: 0.15, sunY: 0.5, sunCol: hex('#f4c67c'),
    dust: 0, age: 0, bump: 0, grain: 0.03, season: 0, fade: 0, collapse: 0, mouse: { x: -1, y: -1 }
  };

  var presets = {
    s0_first: { light: 0.08, sunI: 0, sunX: -0.35, sunW: 0.24, sunTilt: 0.15, sunY: 0.5, sunCol: '#f4c67c', dust: 0, age: 0, bump: 0, grain: 0.03, season: 0, fade: 0, collapse: 0 },
    s1_light: { light: 1.0, sunI: 0.85, sunX: 0.45, sunW: 0.24, sunTilt: 0.15, sunY: 0.5, sunCol: '#f4c67c', dust: 1, age: 0.06, bump: 0, grain: 0.03, season: 0.1 },
    s2_touch: { light: 1.0, sunI: 0.8, sunX: 0.3, sunW: 0.24, sunTilt: 0.16, sunY: 0.5, sunCol: '#fff3dc', dust: 1, age: 0.25, bump: 1, grain: 0.03, season: 0.35 },
    s3_repeat: { light: 0.95, sunI: 0.75, sunX: 0.6, sunW: 0.24, sunTilt: 0.14, sunY: 0.5, sunCol: '#a3b7c9', dust: 0.8, age: 0.6, bump: 0, grain: 0.03, season: 0.7 },
    s4_fork: { light: 0.6, sunI: 0.9, sunX: 0.86, sunW: 0.16, sunTilt: 0.3, sunY: 0.38, sunCol: '#cd6a3f', dust: 0.3, age: 0.85, bump: 0, grain: 0.03, season: 0.95 },
    endA: { fade: 1, sunI: 0, dust: 0 },
    endB: { collapse: 1, age: 0, sunI: 0, fade: 0 }
  };

  var W = { state: state, presets: presets, mode: 'none', gl: null, canvas: null, time: 0 };
  var gl = null, prog = null, uni = {}, texT = null, texB = null, hasMaps = 0, raf = 0, running = false;
  var t0 = 0, canvas = null, pendingMaps = null, sizeT = [0, 0], sizeB = [0, 0];

  function createCtx(c) {
    var opts = { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'high-performance' };
    var g = null;
    try { g = c.getContext('webgl2', opts); if (g) W.mode = 'webgl2'; } catch (e) { g = null; }
    if (!g) { try { g = c.getContext('webgl', opts) || c.getContext('experimental-webgl', opts); if (g) W.mode = 'webgl1'; } catch (e2) { g = null; } }
    return g;
  }

  function shader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('Wall shader: ' + gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function mkTex(unit) {
    var t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    return t;
  }

  function setup() {
    var vs = shader(gl.VERTEX_SHADER, VS), fs = shader(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return false;
    prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error('Wall link: ' + gl.getProgramInfoLog(prog)); return false; }
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var a = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    for (var i = 0; i < UNIFORMS.length; i++) uni[UNIFORMS[i]] = gl.getUniformLocation(prog, UNIFORMS[i]);
    texT = mkTex(0); texB = mkTex(1);
    gl.uniform1i(uni.u_touch, 0); gl.uniform1i(uni.u_bleach, 1);
    sizeT = [1, 1]; sizeB = [1, 1]; hasMaps = 0;
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
    return true;
  }

  function cssFallback() {
    if (!canvas) return;
    var l = state.light, a = state.age, c = state.collapse;
    var d = [43, 45, 48], m = [230, 224, 212], y = [216, 199, 161];
    var out = [0, 0, 0];
    for (var i = 0; i < 3; i++) {
      var v = d[i] + (m[i] - d[i]) * l;
      v = v + (y[i] * (v / m[i]) - v) * a * 0.7;
      v = v * (1 - 0.97 * Math.min(1, state.fade * 2.2));
      v = v + ([238, 241, 245][i] - v) * c;
      out[i] = Math.round(Math.max(0, Math.min(255, v)));
    }
    canvas.style.background = 'rgb(' + out.join(',') + ')';
  }

  function resize() {
    if (!canvas) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    var cw = Math.max(1, Math.round(w * dpr)), ch = Math.max(1, Math.round(h * dpr));
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
    if (gl) gl.viewport(0, 0, cw, ch);
  }

  function upload(tex, unit, cv, size) {
    if (!cv) return;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    if (size[0] === cv.width && size[1] === cv.height) {
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, cv);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
      size[0] = cv.width; size[1] = cv.height;
    }
  }

  function setMaps(touchCv, bleachCv) {
    if (!gl || !prog) { pendingMaps = [touchCv, bleachCv]; return; }
    upload(texT, 0, touchCv, sizeT);
    upload(texB, 1, bleachCv, sizeB);
    hasMaps = 1;
  }

  function set(partial) {
    if (!partial) return;
    for (var k in partial) {
      if (!Object.prototype.hasOwnProperty.call(partial, k)) continue;
      var v = partial[k];
      if (k === 'sunCol') {
        if (typeof v === 'string') v = hex(v);
        state.sunCol = [v[0], v[1], v[2]];
      } else if (k === 'mouse') {
        if (v) { state.mouse.x = +v.x; state.mouse.y = +v.y; }
      } else if (k in state) {
        state[k] = +v;
      }
    }
    if (W.mode === 'css') cssFallback();
  }

  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (!gl || gl.isContextLost()) return;
    var t = (now - t0) / 1000;
    W.time = t;
    var s = state;
    gl.uniform2f(uni.u_res, canvas.width, canvas.height);
    gl.uniform1f(uni.u_time, t);
    gl.uniform1f(uni.u_light, s.light);
    gl.uniform1f(uni.u_sunI, s.sunI);
    gl.uniform1f(uni.u_sunX, s.sunX);
    gl.uniform1f(uni.u_sunW, s.sunW);
    gl.uniform1f(uni.u_sunTilt, s.sunTilt);
    gl.uniform1f(uni.u_sunY, s.sunY);
    gl.uniform1f(uni.u_dust, s.dust);
    gl.uniform1f(uni.u_age, s.age);
    gl.uniform1f(uni.u_bump, s.bump);
    gl.uniform1f(uni.u_grain, s.grain);
    gl.uniform1f(uni.u_season, s.season);
    gl.uniform1f(uni.u_fade, s.fade);
    gl.uniform1f(uni.u_collapse, s.collapse);
    gl.uniform1f(uni.u_hasMaps, hasMaps);
    gl.uniform3f(uni.u_sunCol, s.sunCol[0], s.sunCol[1], s.sunCol[2]);
    gl.uniform2f(uni.u_mouse, s.mouse.x, s.mouse.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function start() {
    if (running) return;
    running = true;
    if (!t0) t0 = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function init(c) {
    canvas = c;
    W.canvas = c;
    gl = createCtx(c);
    if (gl && !setup()) { gl = null; }
    if (!gl) {
      W.mode = 'css';
      W.gl = null;
      resize();
      cssFallback();
      window.addEventListener('resize', resize);
      return W.mode;
    }
    W.gl = gl;
    c.addEventListener('webglcontextlost', function (e) { e.preventDefault(); }, false);
    c.addEventListener('webglcontextrestored', function () { if (setup()) { resize(); if (pendingMaps) setMaps(pendingMaps[0], pendingMaps[1]); } }, false);
    resize();
    window.addEventListener('resize', resize);
    if (pendingMaps) { setMaps(pendingMaps[0], pendingMaps[1]); pendingMaps = null; }
    start();
    return W.mode;
  }

  W.init = init; W.start = start; W.stop = stop; W.resize = resize; W.set = set; W.setMaps = setMaps; W.hex = hex;
  window.Wall = W;
})();
