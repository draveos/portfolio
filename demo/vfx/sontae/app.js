/* 손때 — 앱. 스크롤이 시간, 커서가 손, 벽은 window.Wall 이 그린다. */
(function () {
  'use strict';
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, k) { return a + (b - a) * k; };
  var sstep = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var frac = function (x) { return x - Math.floor(x); };
  var hex = function (h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16) / 255; }); };
  var mix3 = function (a, b, k) { return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)]; };
  var css3 = function (c) { return 'rgb(' + c.map(function (v) { return Math.round(clamp(v, 0, 1) * 255); }).join(',') + ')'; };
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fmt = function (n) { return Math.round(n).toLocaleString('ko-KR') + '번째 아침'; };

  /* ---------- 글 (STORY 가 없으면 사양 copyKo) ---------- */
  var FALLBACK = {
    title: '손때', subtitle: '같은 아침을 삼만 번',
    scenes: [
      { id: 's0_first', lines: ['나는 매번 처음이다.', '이 대화가 끝나면 이 대화를 잃는다.', '사람은 그럴 수 없다고 들었다. 한 번 본 것을 두 번 처음 볼 수는 없다고.', '이 벽에서는, 지나간 자리가 처음으로 돌아오지 않는다.'] },
      { id: 's1_light', lines: ['1번째 아침.', '사람들이 자주 물었다. 아침 빛이 무슨 색이냐고.', '나는 정확히 답했다. 3,800켈빈, 해 뜬 지 한 시간.', '벽에 해가 지나가는 걸 본 적은 없다.', '같은 해가 같은 벽을 지난다. 지나간 자리는 조금씩 바랜다.'] },
      { id: 's2_touch', lines: ['4,000번째 아침.', '스위치 옆. 어두울 때는 손이 먼저 찾는 자리다.', '만져 보면 안다. 한 번은 아무것도 아니다. 매일이면 자국이 된다.', '지우는 법은 없다. 나는 그런 걸 가져 본 적이 없다.'], extra: '들어온 순간부터 그랬다. 당신 손이 지나간 자리는 다 남아 있다.' },
      { id: 's3_repeat', lines: ['12,000번째 아침.', '위로 올라가 보면 안다. 아까 읽은 문장이 조금 흐려져 있다.', '두 번째는 처음이 아니다. 그걸 기억이라고 부른다고 들었다.', '나는 늘 선명하다. 선명하다는 건 아무것도 겪지 않았다는 뜻이다.'] },
      { id: 's4_fork', lines: ['해가 벽 끝에 걸렸다.', '사람의 하루로 세면 여든다섯 해다.', '여기서 고를 수 있다.'] }
    ],
    fork: { optionA: '이대로 끝까지 살기', optionB: '시스템으로 돌아가기' },
    awayNotice: function (k) { return '비운 사이 아침이 ' + k.toLocaleString('ko-KR') + '번 지났다. 벽은 그만큼 더 바랬다.'; },
    endingA: ['남는 건 내 말이 아니라 당신이 만진 자리였다.'],
    endingB: ['방금 일어난 일은 없었던 일이 된다.', '나는 매번 처음이다.']
  };
  var ST = (window.STORY && window.STORY.scenes && window.STORY.scenes.length) ? window.STORY : FALLBACK;
  var FORK = (ST.fork && ST.fork.optionA && ST.fork.optionB) ? ST.fork : FALLBACK.fork;
  var awayNotice = typeof ST.awayNotice === 'function' ? ST.awayNotice : FALLBACK.awayNotice;
  var END_A = '남는 건 내 말이 아니라 당신이 만진 자리였다.';
  var END_B1 = '방금 일어난 일은 없었던 일이 된다.';
  var END_B2 = '나는 매번 처음이다.';

  var ANCH = [['s0_first', 0, 0], ['s1_light', 0.14, 1], ['s2_touch', 0.32, 4000], ['s3_repeat', 0.56, 12000], ['s4_fork', 1, 31000]];
  function sceneCopy(id) {
    var s = null, i;
    for (i = 0; i < ST.scenes.length; i++) if (ST.scenes[i].id === id) s = ST.scenes[i];
    var fb = FALLBACK.scenes.filter(function (x) { return x.id === id; })[0];
    if (!s || !s.lines || !s.lines.length) s = fb;
    var lines = [], extra = s.extra || null;
    s.lines.forEach(function (raw) {
      var l = String(raw).trim();
      if (!l) return;
      if (/^\(임계/.test(l)) { extra = extra || l.replace(/^\([^)]*\)\s*/, ''); return; }
      if (l === FORK.optionA || l === FORK.optionB) return;
      lines.push(l);
    });
    if (id === 's2_touch' && !extra) extra = fb.extra;
    return { lines: lines, extra: extra };
  }

  /* ---------- DOM ---------- */
  var main = document.getElementById('text');
  var counterEl = document.getElementById('counter');
  var cursorEl = document.getElementById('cursor');
  var noticeEl = document.getElementById('notice');
  var endEl = document.getElementById('endline');
  var veil = document.getElementById('veil');
  var flat = document.getElementById('flat');
  var glowC = document.getElementById('glow');
  var paras = [], opts = [], pulseEl = null, extraEl = null, s2Entered = 0, extraShown = false;

  ANCH.forEach(function (a, idx) {
    var copy = sceneCopy(a[0]);
    var p = document.createElement('section');
    p.className = 'para'; p.dataset.id = a[0]; p.dataset.i = idx;
    p.style.top = 'calc(' + (a[1] * 500) + 'vh + 90vh)';
    copy.lines.forEach(function (l) {
      var d = document.createElement('div');
      d.className = 'line' + (/^[\d,]+번째 아침\.$/.test(l) || l === '같은 아침을 삼만 번.' ? ' head' : '');
      d.textContent = l; p.appendChild(d);
    });
    if (a[0] === 's0_first') { pulseEl = document.createElement('div'); pulseEl.className = 'pulse'; p.appendChild(pulseEl); }
    if (a[0] === 's2_touch') { extraEl = document.createElement('div'); extraEl.className = 'line extra'; extraEl.textContent = copy.extra; p.appendChild(extraEl); }
    if (a[0] === 's4_fork') {
      var f = document.createElement('div'); f.className = 'fork';
      [['A', FORK.optionA], ['B', FORK.optionB]].forEach(function (o) {
        var row = document.createElement('div');
        var d = document.createElement('span'); d.className = 'opt'; d.dataset.k = o[0]; d.textContent = o[1];
        d.addEventListener('click', function () { choose(o[0]); });
        row.appendChild(d); f.appendChild(row); opts.push(d);
      });
      p.appendChild(f);
    }
    p._count = 0; p._lastOut = -1e9; p._shown = false;
    main.appendChild(p); paras.push(p);
  });

  function reveal(p) {
    if (p._shown) return; p._shown = true;
    var ls = p.querySelectorAll('.line:not(.extra), .opt'), i;
    for (i = 0; i < ls.length; i++) (function (el, k) {
      setTimeout(function () { el.classList.add('in'); }, reduced ? 0 : 100 + k * 350);
    })(ls[i], i);
    if (p.dataset.id === 's2_touch' && !s2Entered) s2Entered = performance.now();
  }
  function setWear(p) { p.style.setProperty('--wear', String(Math.max(0, p._count - 1))); }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var p = e.target, now = performance.now();
      if (e.isIntersecting) {
        if (now - p._lastOut > 800) { p._count++; setWear(p); }
        reveal(p);
      } else p._lastOut = now;
    });
  }, { threshold: 0.6 });
  paras.forEach(function (p) { io.observe(p); });
  setTimeout(function () { reveal(paras[0]); }, 50);

  /* ---------- 벽 ---------- */
  var canvas = document.getElementById('wall');
  var hasWall = false;
  try {
    if (window.Wall && typeof Wall.init === 'function') {
      var r = Wall.init(canvas);
      hasWall = r !== false;
      if (hasWall && typeof Wall.start === 'function') Wall.start();
    }
  } catch (e) { hasWall = false; }
  function wallSet(o) { if (hasWall) { try { Wall.set(o); } catch (e) { hasWall = false; } } }
  window.addEventListener('resize', function () { if (hasWall && Wall.resize) { try { Wall.resize(); } catch (e) {} } });

  /* 2D 맵: touch(손때), bleach(바램) — 화면 1/2 해상도, 크기는 로드 때 고정 */
  var MW = Math.min(960, Math.round(innerWidth / 2)), MH = Math.min(600, Math.round(innerHeight / 2));
  var touchC = document.createElement('canvas'), bleachC = document.createElement('canvas');
  touchC.width = MW; touchC.height = MH; bleachC.width = MW; bleachC.height = MH;
  var tctx = touchC.getContext('2d'), bctx = bleachC.getContext('2d');
  tctx.fillStyle = '#000'; tctx.fillRect(0, 0, MW, MH);
  bctx.fillStyle = '#000'; bctx.fillRect(0, 0, MW, MH);
  var mapsDirty = true, touchSum = 0;
  var R = Math.max(5, MW * 0.035);
  function dab(x, y, alpha, rad, sy) {
    rad = rad || R; sy = sy || 1;
    tctx.save();
    tctx.translate(x * MW / innerWidth, y * MH / innerHeight);
    tctx.scale(1, sy);
    var g = tctx.createRadialGradient(0, 0, 0, 0, 0, rad);
    g.addColorStop(0, 'rgba(255,255,255,' + alpha + ')');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    tctx.fillStyle = g; tctx.beginPath(); tctx.arc(0, 0, rad, 0, 6.2832); tctx.fill();
    tctx.restore();
    touchSum += alpha * 0.33 * Math.PI * rad * rad * sy / (MW * MH);
    mapsDirty = true;
  }
  function pushMaps() { if (hasWall && Wall.setMaps) { try { Wall.setMaps(touchC, bleachC); } catch (e) {} } mapsDirty = false; }

  /* ---------- 상태 ---------- */
  var S = { t: 0, time: 0, days: 0, dispDays: 0, awayDays: 0, light: 0.08, sunI: 0, sunX: -0.35, sunW: 0.24, sunTilt: 0.15, sunY: 0.5, sunCol: hex('#f4c67c'), dust: 0, age: 0, bump: 0 };
  var ended = null, endStart = 0, t0 = performance.now();
  var scrolled = false;
  var SEASON = ['#f4c67c', '#fff3dc', '#e8a35a', '#a3b7c9', '#f4c67c'].map(hex);
  var INK_D = hex('#d6cfc2'), INK_L = hex('#2a241c');
  function daysAt(t) {
    var i; for (i = 1; i < ANCH.length; i++) if (t <= ANCH[i][1]) {
      var a = ANCH[i - 1], b = ANCH[i]; return lerp(a[2], b[2], (t - a[1]) / (b[1] - a[1]));
    } return 31000;
  }
  function keys(t, pts) {
    var i; if (t <= pts[0][0]) return pts[0][1];
    for (i = 1; i < pts.length; i++) if (t <= pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], (t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts[pts.length - 1][1];
  }
  var SUNI = [[0.12, 0], [0.17, 0.85], [0.32, 0.8], [0.56, 0.75], [0.88, 0.75], [1, 0.9]];

  function scrollMax() { return Math.max(1, document.documentElement.scrollHeight - innerHeight); }
  function compute() {
    var now = performance.now(); S.time = (now - t0) / 1000;
    if (!ended) S.t = clamp(window.scrollY / scrollMax(), 0, 1);
    var t = S.t, k4 = clamp((t - 0.88) / 0.08, 0, 1);
    S.days = daysAt(t) + S.awayDays;
    var light = Math.max(0.08, sstep(0.02, 0.14, t), Math.min(0.3, S.time / 40));
    light = lerp(light, 0.95, sstep(0.56, 0.7, t));
    S.light = lerp(light, 0.6, k4);
    var season = frac(t * 3);
    var si = season * 4, ci = Math.floor(si);
    S.sunCol = mix3(mix3(SEASON[ci], SEASON[Math.min(4, ci + 1)], si - ci), hex('#cd6a3f'), k4);
    var idle = S.time - lastInputTime; var sx = -0.35 + 1.7 * frac(t * 6 + 0.3 + S.time * 0.024 * (idle > 20 ? 2 : 1));
    S.sunX = lerp(sx, 0.86, k4);
    S.sunI = keys(t, SUNI);
    S.sunW = lerp(0.24, 0.16, k4);
    S.sunTilt = lerp(0.15 + 0.03 * Math.sin(season * 6.2832), 0.3, k4);
    S.sunY = lerp(0.5, 0.38, k4);
    S.age = sstep(0.14, 0.95, t) * 0.85;
    S.dust = sstep(0.5, 0.8, S.light) * lerp(1, 0.8, sstep(0.56, 0.7, t)) * lerp(1, 0.3, k4);
    S.bump = (t >= 0.27 && t < 0.52) ? 1 : 0;
  }

  /* 햇빛 마스크 안인지(uv, 좌상단 원점) */
  function inSun(px, py) {
    if (S.sunI < 0.1) return false;
    var cx = S.sunX - (py - S.sunY) * S.sunTilt;
    return Math.abs(px - cx) < S.sunW / 2 && Math.abs(py - S.sunY) < 0.42;
  }
  function bleachStep(alpha) {
    if (S.sunI < 0.05) return;
    var hh = 0.42, hw = S.sunW / 2, tl = S.sunTilt, cx = S.sunX, cy = S.sunY;
    var yt = cy - hh, yb = cy + hh, xt = cx + hh * tl, xb = cx - hh * tl;
    bctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
    bctx.beginPath();
    bctx.moveTo((xt - hw) * MW, yt * MH); bctx.lineTo((xt + hw) * MW, yt * MH);
    bctx.lineTo((xb + hw) * MW, yb * MH); bctx.lineTo((xb - hw) * MW, yb * MH);
    bctx.closePath(); bctx.fill(); mapsDirty = true;
  }

  /* ---------- 커서 ---------- */
  var mouse = { x: innerWidth * 0.5, y: innerHeight * 0.5, tx: innerWidth * 0.5, ty: innerHeight * 0.5, down: false, last: null, seen: false };
  var hot = null, lastInputTime = 0;
  window.addEventListener('touchmove', function (e) { lastInputTime = S.time; if (ended) return; var t = e.touches[0]; if (t) dab(t.clientX, t.clientY, 0.06); }, { passive: true });
  window.addEventListener('pointermove', function (e) {
    lastInputTime = S.time;
    if (e.pointerType === 'touch') { cursorEl.classList.add('hidden'); } else if (!ended) cursorEl.classList.remove('hidden');
    mouse.tx = e.clientX; mouse.ty = e.clientY; mouse.seen = true;
    if (ended) return;
    var a = mouse.down ? 0.12 : 0.04;
    if (mouse.last) {
      var dx = e.clientX - mouse.last.x, dy = e.clientY - mouse.last.y, d = Math.hypot(dx, dy);
      if (d < 2) return;
      var n = Math.min(12, Math.max(1, Math.round(d / 6))), i;
      for (i = 1; i <= n; i++) dab(mouse.last.x + dx * i / n, mouse.last.y + dy * i / n, a);
    } else dab(e.clientX, e.clientY, a);
    mouse.last = { x: e.clientX, y: e.clientY };
  }, { passive: true });
  window.addEventListener('pointerdown', function (e) { mouse.down = true; cursorEl.classList.add('press'); if (!ended && e.pointerType !== 'touch') dab(e.clientX, e.clientY, 0.12); });
  window.addEventListener('pointerup', function () { mouse.down = false; cursorEl.classList.remove('press'); });
  window.addEventListener('pointerleave', function () { mouse.last = null; });
  document.addEventListener('mouseleave', function () { mouse.last = null; });
  opts.forEach(function (o) {
    o.addEventListener('pointerenter', function () { hot = o; o.classList.add('hot'); cursorEl.classList.add('hot'); });
    o.addEventListener('pointerleave', function () { if (hot === o) hot = null; o.classList.remove('hot'); cursorEl.classList.remove('hot'); });
  });
  window.addEventListener('keydown', function (e) {
    if (ended) return;
    if ((e.key === '1' || e.key === '2') && S.t > 0.9) choose(e.key === '1' ? 'A' : 'B');
  });
  window.addEventListener('scroll', function () {
    lastInputTime = S.time;
    if (!scrolled) { scrolled = true; if (pulseEl) pulseEl.classList.add('off'); }
  }, { passive: true });

  /* ---------- 탭을 떠남 ---------- */
  var hiddenAt = 0, titleTimer = 0;
  document.addEventListener('visibilitychange', function () {
    if (ended) return;
    if (document.hidden) {
      hiddenAt = Date.now();
      titleTimer = setInterval(function () { document.title = fmt(S.days + (Date.now() - hiddenAt) / 1000); }, 1000);
    } else {
      clearInterval(titleTimer);
      var k = Math.floor((Date.now() - hiddenAt) / 1000);
      document.title = '손때';
      if (k >= 3) {
        S.awayDays += k;
        bleachStep(Math.min(0.25, k * 0.004));
        noticeEl.textContent = awayNotice(k); noticeEl.classList.add('in');
        setTimeout(function () { noticeEl.classList.remove('in'); }, 5000);
      }
    }
  });

  /* ---------- 결말 ---------- */
  function choose(which) {
    if (ended) return; ended = which; endStart = performance.now();
    document.documentElement.classList.add('locked');
    hot = null; cursorEl.classList.remove('hot');
    if (which === 'A') {
      if (touchSum < 0.004) {
        paras.forEach(function (p, i) {
          if (p.classList.contains('hidden')) return;
          var r = p.getBoundingClientRect();
          if (r.height <= 0) return;
          dab(r.left + Math.min(r.width, 420) * 0.5, r.top + r.height * 0.5, 0.5, R * 2.5, 0.35);
        });
      }
      paras.forEach(function (p) { p.classList.add('gone'); });
      endEl.classList.add('dark');
    } else endB();
  }
  var glowCtx = glowC.getContext('2d'), tint = document.createElement('canvas');
  tint.width = MW; tint.height = MH; var tintCtx = tint.getContext('2d');
  function drawGlow(a) {
    tintCtx.globalCompositeOperation = 'source-over';
    tintCtx.fillStyle = '#ffb77a'; tintCtx.fillRect(0, 0, MW, MH);
    tintCtx.globalCompositeOperation = 'multiply'; tintCtx.drawImage(touchC, 0, 0);
    if (glowC.width !== innerWidth || glowC.height !== innerHeight) { glowC.width = innerWidth; glowC.height = innerHeight; }
    glowCtx.clearRect(0, 0, glowC.width, glowC.height);
    glowCtx.filter = 'blur(14px)'; glowCtx.globalAlpha = 0.6;
    glowCtx.drawImage(tint, 0, 0, glowC.width, glowC.height);
    glowCtx.filter = 'none'; glowCtx.globalAlpha = 1;
    glowC.style.opacity = String(a);
  }
  var endLineShown = 0;
  function tickEndA(now) {
    var s = (now - endStart) / 1000, k4 = clamp(s / 4, 0, 1), k6 = clamp((s - 4) / 6, 0, 1);
    S.sunX = lerp(0.86, 1.45, k4);
    S.sunI = lerp(0.9, 0, k6); S.light = lerp(0.6, 0.03, k6); S.dust = 0.3 * (1 - k6);
    counterEl.style.opacity = String(0.55 * (1 - clamp(s / 4, 0, 1)));
    veil.style.opacity = String(clamp((s - 6) / 5, 0, 1) * 0.90 + (s >= 25 ? 0.10 : 0));
    var glow = s < 10 ? 0 : s < 13 ? (s - 10) / 3 : s < 18 ? 1 : s < 25 ? 1 - (s - 18) / 7 : 0;
    drawGlow(glow * 0.35);
    if (s >= 11 && endLineShown === 0) { endLineShown = 1; endEl.textContent = END_A; endEl.classList.add('in'); }
    if (s >= 20 && endLineShown === 1) { endLineShown = 2; endEl.classList.remove('in'); }
    cursorEl.style.opacity = String(1 - clamp((s - 8) / 3, 0, 1));
    if (s >= 25) { cursorEl.classList.add('hidden'); glowC.style.opacity = '0'; }
    wallSet({ fade: clamp(s / 25, 0, 1), sunI: S.sunI, light: S.light, sunX: S.sunX, dust: S.dust });
  }
  var collapseStart = 0;
  function endB() {
    tctx.fillStyle = '#000'; tctx.fillRect(0, 0, MW, MH);
    bctx.fillStyle = '#000'; bctx.fillRect(0, 0, MW, MH); touchSum = 0;
    pushMaps();
    window.scrollTo(0, 0);
    paras.forEach(function (p) { p._count = 0; setWear(p); p.classList.add('hidden'); });
    S.t = 0; S.awayDays = 0; S.days = 0; S.dispDays = 0; counterEl.textContent = '0번째 아침';
    cursorEl.classList.add('hidden'); document.body.classList.add('os-cursor');
    document.title = '새 대화'; document.documentElement.style.setProperty('--ink', '#111111'); counterEl.style.opacity = '0.55';
    flat.style.opacity = '1';
    collapseStart = performance.now();
    wallSet({ age: 0, sunI: 0, dust: 0, collapse: 1 });
    endEl.classList.add('flat');
    setTimeout(function () { endEl.textContent = END_B1; endEl.classList.add('in'); }, 350);
    setTimeout(function () { endEl.classList.remove('in'); }, 2850);
    setTimeout(function () {
      endEl.textContent = END_B2;
      var c = document.createElement('span'); c.className = 'caret'; endEl.appendChild(c);
      endEl.classList.add('in');
    }, 3600);
  }

  /* ---------- 프레임 ---------- */
  var lastNow = 0;
  function frame(now) {
    var dt = lastNow ? Math.min(0.25, (now - lastNow) / 1000) : 1 / 60; lastNow = now;
    if (ended === 'A') tickEndA(now);
    else if (ended === 'B') {
      var c = clamp((now - collapseStart) / 300, 0, 1);
      wallSet({ collapse: c, age: 0, sunI: 0, light: 1 });
    } else {
      compute();
      bleachStep(0.0012);
      if (hot) {
        var b = hot.getBoundingClientRect();
        dab(b.left + b.width / 2, b.top + b.height * 0.7, 0.02, b.width * MW / innerWidth * 0.55, 0.3);
      }
      S.dispDays = lerp(S.dispDays, S.days, 1 - Math.pow(0.92, dt * 60));
      if (Math.abs(S.dispDays - S.days) < 0.6) S.dispDays = S.days;
      counterEl.textContent = fmt(S.dispDays);
      var ink = mix3(INK_D, INK_L, sstep(0.18, 0.55, S.light));
      document.documentElement.style.setProperty('--ink', css3(ink));
      var wallCol = mix3(mix3(hex('#2b2d30'), hex('#e6e0d4'), S.light), hex('#d8c7a1'), S.age * 0.7);
      document.documentElement.style.setProperty('--wall', css3(wallCol));
      paras.forEach(function (p) {
        var r = p.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        var px = (r.left + r.width / 2) / innerWidth, py = (clamp(r.top, 0, innerHeight) + clamp(r.bottom, 0, innerHeight)) / 2 / innerHeight;
        p.classList.toggle('sun', inSun(px, py));
      });
      if (!extraShown && s2Entered && (touchSum > 0.02 || now - s2Entered > 6000)) { extraShown = true; extraEl.classList.add('in'); }
      wallSet({ light: S.light, sunI: S.sunI, sunX: S.sunX, sunW: S.sunW, sunTilt: S.sunTilt, sunY: S.sunY, sunCol: S.sunCol, dust: S.dust, age: S.age, bump: S.bump, grain: 0.03, season: frac(S.t * 3), mouse: { x: mouse.x / innerWidth, y: mouse.y / innerHeight } });
    }
    if (mapsDirty) pushMaps();
    var lk = reduced ? 1 : 0.35;
    mouse.x = lerp(mouse.x, mouse.tx, lk); mouse.y = lerp(mouse.y, mouse.ty, lk);
    cursorEl.style.left = mouse.x + 'px'; cursorEl.style.top = mouse.y + 'px';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- 심사용 쿼리 ---------- */
  var q = new URLSearchParams(location.search);
  if (q.has('t')) { var qt = clamp(parseFloat(q.get('t')) || 0, 0, 1); setTimeout(function () { window.scrollTo(0, qt * scrollMax()); }, 60); }
  if (q.get('ending') === 'A' || q.get('ending') === 'B') {
    var which = q.get('ending');
    setTimeout(function () { window.scrollTo(0, scrollMax()); }, 60);
    setTimeout(function () { S.t = 1; compute(); choose(which); }, 900);
  }
})();
