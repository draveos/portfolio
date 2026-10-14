/* 쿼리도 판 UI. 사람은 아래에서 시작합니다. 규칙은 rules.js, 상대는 agent.js(Web Worker, 실패 시 메인 스레드) 입니다.
 * 부모 페이지 계약: postMessage {type:'portfolio:visible', visible:false} 를 받으면 진행 중 탐색은 두되 새 탐색을 시작하지 않습니다. */
(function () {
  'use strict';
  const R = window.QRules;
  const CELL = 40, GAP = 10, PAD = 8, STEP = CELL + GAP;
  const NS = 'http://www.w3.org/2000/svg';
  const $ = s => document.querySelector(s);
  const layers = { cells: $('#layer-cells'), walls: $('#layer-walls'), moves: $('#layer-moves'), pawns: $('#layer-pawns'), ghost: $('#layer-ghost'), fences: $('#layer-fences') };
  const boardEl = $('#board'), statusEl = $('#status'), statsEl = $('#stats'), srEl = $('#sr-state');
  const bannerEl = $('#banner'), bannerText = $('#banner-text'), bannerRestart = $('#banner-restart');
  const fenceBtn = $('#fence-toggle'), orientBtn = $('#orient-toggle'), restartBtn = $('#restart'), firstSel = $('#first');
  const wallsHuman = $('#walls-human'), wallsAgent = $('#walls-agent');
  const whoHuman = $('.who-human'), whoAgent = $('.who-agent');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)').matches;
  const BUDGET = (coarse || (navigator.hardwareConcurrency || 8) <= 4) ? 600 : 400;   // 수당 예산 ms
  const MIN_WAIT = 250;                                                               // 에이전트 응답 최소 표시 시간
  const MAX_TURNS = 300;                                                              // 아레나 서버 규칙: 300수 무승부

  let state, humanSide = 0, agentSide = 1;
  let mode = 'move', orient = 'h', armed = -1;      // armed: 터치 첫 탭으로 미리보기 중인 울타리
  let thinking = false, over = false, visible = true, pendingThink = false;
  let reqId = 0, thinkTimer = null, thinkStart = 0;
  let cachedMoves = null, cachedAvail = null, cachedAdj = null;

  /* ---------- 에이전트 실행 (Worker, 실패 시 메인 스레드) ---------- */
  let worker = null, mainAgent = null, workerBroken = false;
  const waiting = new Map();   // id → resolve
  function makeWorker() {
    if (workerBroken || typeof Worker === 'undefined') return null;
    try {
      const w = new Worker('agent.js');
      w.onmessage = e => {
        const m = e.data || {};
        if (m.type === 'move' && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
        else if (m.type === 'error' && waiting.has(m.id)) { waiting.get(m.id)(null); waiting.delete(m.id); }
      };
      w.onerror = () => { workerBroken = true; try { w.terminate(); } catch (e) { } worker = null; for (const [, res] of waiting) res(null); waiting.clear(); };
      return w;
    } catch (e) { workerBroken = true; return null; }
  }
  function think(s, side, budget) {
    const id = ++reqId;
    if (!worker && !workerBroken) worker = makeWorker();
    if (worker) {
      return new Promise(resolve => {
        waiting.set(id, resolve);
        worker.postMessage({ type: 'think', id, side, state: s, budget });
      }).then(res => res && res.id === id ? res : (workerBroken ? thinkMain(s, side, budget, id) : null));
    }
    return thinkMain(s, side, budget, id);
  }
  function thinkMain(s, side, budget, id) {
    return new Promise(resolve => setTimeout(() => {
      if (!mainAgent || mainAgent.side !== side) mainAgent = new window.QAgent(side);
      try { const r = mainAgent.choose(s, budget); resolve({ id, action: r.action, stats: r.stats }); }
      catch (e) { resolve(null); }
    }, 0));
  }
  function resetAgent() {
    reqId++;                       // 늦게 오는 응답은 버린다
    waiting.clear();
    if (worker) worker.postMessage({ type: 'reset', side: agentSide });
    mainAgent = null;
  }

  /* ---------- 좌표 ---------- */
  const yIdx = r => humanSide === 0 ? 8 - r : r;          // 사람이 항상 아래
  const sx = c => PAD + c * STEP;
  const sy = r => PAD + yIdx(r) * STEP;
  const ix = c => sx(c) + CELL + GAP / 2;                  // 교차점 (r,c) 의 화면 중심
  const iy = r => Math.min(sy(r), sy(r + 1)) + CELL + GAP / 2;
  const el = (tag, attrs, cls) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (cls) n.setAttribute('class', cls); return n; };
  const humanRow = r => (humanSide === 0 ? r + 1 : 9 - r);  // 사람 기준 "아래에서 n번째 줄"

  /* ---------- 그리기 ---------- */
  function drawCells() {
    layers.cells.textContent = '';
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      const goalH = (humanSide === 0 && r === 8) || (humanSide === 1 && r === 0);
      const goalA = (agentSide === 0 && r === 8) || (agentSide === 1 && r === 0);
      layers.cells.appendChild(el('rect', { x: sx(c), y: sy(r), width: CELL, height: CELL, rx: 6 }, 'cell' + (goalH ? ' goal-human' : goalA ? ' goal-agent' : '')));
    }
  }
  function wallRect(f, cls) {
    const { r, c, orient: o } = R.fenceRC(f);
    const t = GAP * 0.64;
    return o === 'h'
      ? el('rect', { x: sx(c), y: iy(r) - t / 2, width: 2 * CELL + GAP, height: t }, cls)
      : el('rect', { x: ix(c) - t / 2, y: Math.min(sy(r), sy(r + 1)), width: t, height: 2 * CELL + GAP }, cls);
  }
  function render() {
    const side = R.sideToMove(state);
    cachedAdj = R.buildAdj(state.walls);
    cachedMoves = R.legalMoves(state, cachedAdj);
    cachedAvail = R.availableWords(state.walls);
    // 벽
    layers.walls.textContent = '';
    state.walls.forEach((f, i) => {
      // 벽 소유자는 기록에서 모른다(규칙상 불필요). 놓인 순서로 복원: 사람 턴에 놓인 것은 사람 벽.
      layers.walls.appendChild(wallRect(f, 'wall ' + (wallOwner[i] === humanSide ? 'human' : 'agent')));
    });
    // 말
    layers.pawns.textContent = '';
    for (let s = 0; s < 2; s++) {
      const p = state.pawns[s], r = (p / 9) | 0, c = p % 9;
      layers.pawns.appendChild(el('circle', { cx: sx(c) + CELL / 2, cy: sy(r) + CELL / 2, r: 14 }, 'pawn ' + (s === humanSide ? 'human' : 'agent')));
    }
    // 이동 후보
    layers.moves.textContent = '';
    const canAct = !over && !thinking && side === humanSide;
    if (canAct && mode === 'move') {
      for (const p of cachedMoves) {
        const r = (p / 9) | 0, c = p % 9;
        const g = el('g', { tabindex: 0, role: 'button', 'aria-label': `아래에서 ${humanRow(r)}번째 줄, 왼쪽에서 ${c + 1}번째 칸으로 이동` }, 'move');
        g.appendChild(el('rect', { x: sx(c), y: sy(r), width: CELL, height: CELL }));
        g.appendChild(el('circle', { cx: sx(c) + CELL / 2, cy: sy(r) + CELL / 2, r: 5 }));
        g.addEventListener('click', () => humanMove(p));
        g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); humanMove(p); } });
        layers.moves.appendChild(g);
      }
    }
    // 울타리 히트 영역
    layers.fences.textContent = '';
    if (canAct && mode === 'fence') {
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        layers.fences.appendChild(el('circle', { cx: ix(c), cy: iy(r), r: 2.2 }, 'mark'));
      }
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        const hit = el('rect', { x: ix(c) - STEP / 2, y: iy(r) - STEP / 2, width: STEP, height: STEP, tabindex: 0, role: 'button', 'aria-label': `${orient === 'h' ? '가로' : '세로'} 벽, 아래에서 ${humanRow(r)}번째 줄과 ${humanRow(r + 1)}번째 줄 사이, 왼쪽에서 ${c + 1}번째 칸 옆` }, 'fence-hit');
        hit.dataset.r = r; hit.dataset.c = c;
        hit.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') preview(r, c); });
        hit.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && armed < 0) clearGhost(); });
        hit.addEventListener('focus', () => preview(r, c));
        hit.addEventListener('blur', () => { if (armed < 0) clearGhost(); });
        hit.addEventListener('click', e => tapFence(r, c, e));
        hit.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); placeFence(R.fenceId(r, c, orient)); } });
        layers.fences.appendChild(hit);
      }
    }
    if (!(canAct && mode === 'fence')) clearGhost();
    // 점수판, 버튼
    wallsHuman.textContent = `벽 ${state.fences[humanSide]}`;
    wallsAgent.textContent = `벽 ${state.fences[agentSide]}`;
    whoHuman.classList.toggle('is-turn', !over && side === humanSide);
    whoAgent.classList.toggle('is-turn', !over && side === agentSide);
    fenceBtn.setAttribute('aria-pressed', String(mode === 'fence'));
    fenceBtn.disabled = over || state.fences[humanSide] === 0;
    orientBtn.disabled = mode !== 'fence';
    orientBtn.setAttribute('aria-pressed', String(orient === 'v'));
    orientBtn.firstChild.textContent = (orient === 'h' ? '가로 ' : '세로 ');
    // 스크린리더용 상태
    const hp = state.pawns[humanSide], ap = state.pawns[agentSide];
    srEl.textContent = `내 말은 아래에서 ${humanRow((hp / 9) | 0)}번째 줄, 왼쪽에서 ${hp % 9 + 1}번째 칸. 에이전트 말은 아래에서 ${humanRow((ap / 9) | 0)}번째 줄, 왼쪽에서 ${ap % 9 + 1}번째 칸. 벽은 ${state.walls.length}개 놓였습니다.`;
  }
  function clearGhost() { layers.ghost.textContent = ''; }
  function preview(r, c) {
    const f = R.fenceId(r, c, orient);
    clearGhost();
    const why = R.fenceCheck(state, f, cachedAvail, cachedAdj);
    layers.ghost.appendChild(wallRect(f, 'ghost ' + (why ? 'bad' : 'ok')));
    if (why) setStatus(reasonText(why)); else if (armed === f) setStatus('같은 자리를 한 번 더 누르면 벽을 놓습니다.'); else setStatus(mode === 'fence' ? fenceHint() : '');
    return why;
  }
  const reasonText = why => why === 'blocks' ? '그 자리는 경로를 완전히 막아서 놓을 수 없습니다.' : why === 'overlap' ? '다른 벽과 겹치는 자리입니다.' : why === 'none-left' ? '남은 벽이 없습니다.' : '놓을 수 없는 자리입니다.';
  const fenceHint = () => `벽을 놓을 자리를 누르세요. 지금은 ${orient === 'h' ? '가로' : '세로'} 벽입니다.${coarse ? ' 첫 번째 누름은 미리보기, 두 번째 누름이 설치입니다.' : ''}`;
  const moveHint = () => '당신 차례입니다. 밝게 표시된 칸을 누르면 이동합니다.';

  function setStatus(text, cls) {
    statusEl.textContent = text;
    statusEl.className = 'status' + (cls ? ' ' + cls : '');
  }

  /* ---------- 사람 입력 ---------- */
  function tapFence(r, c, e) {
    const f = R.fenceId(r, c, orient);
    const touch = e && (e.pointerType === 'touch' || e.pointerType === 'pen');
    if (touch && armed !== f) { armed = f; const why = preview(r, c); if (why) armed = -1; return; }
    placeFence(f);
  }
  function placeFence(f) {
    if (over || thinking || R.sideToMove(state) !== humanSide) return;
    const why = R.fenceCheck(state, f, cachedAvail, cachedAdj);
    if (why) { setStatus(reasonText(why)); armed = -1; return; }
    armed = -1;
    wallOwner.push(humanSide);
    state = R.apply(state, { type: 'fence', f });
    mode = 'move';
    afterHuman();
  }
  function humanMove(p) {
    if (over || thinking || R.sideToMove(state) !== humanSide) return;
    if (!cachedMoves.includes(p)) return;
    state = R.apply(state, { type: 'move', to: p });
    afterHuman();
  }
  function afterHuman() {
    render();
    boardEl.focus({ preventScroll: true });
    if (!checkEnd()) requestAgent();
  }
  function toggleFence() {
    if (over || thinking || state.fences[humanSide] === 0) return;
    mode = mode === 'fence' ? 'move' : 'fence'; armed = -1;
    render();
    setStatus(mode === 'fence' ? fenceHint() : moveHint());
  }
  function toggleOrient() {
    if (mode !== 'fence') return;
    orient = orient === 'h' ? 'v' : 'h'; armed = -1;
    render();
    setStatus(fenceHint());
  }

  /* ---------- 에이전트 차례 ---------- */
  function requestAgent() {
    if (over || R.sideToMove(state) !== agentSide) return;
    if (!visible) { pendingThink = true; setStatus('화면에 보이면 에이전트가 둡니다.'); return; }
    pendingThink = false;
    // 둘 수 있는 수가 없으면 차례를 넘긴다(극히 드문 경우)
    if (R.legalMoves(state).length === 0 && R.legalFences(state).length === 0) { state.turn += 1; render(); setStatus('에이전트가 둘 수 있는 수가 없어 차례를 넘깁니다. ' + moveHint()); return; }
    thinking = true; thinkStart = performance.now();
    render();
    startThinkDisplay();
    const snapshot = R.clone(state), myReq = reqId + 1;
    think(snapshot, agentSide, BUDGET).then(res => {
      if (myReq !== reqId || !thinking) return;      // 다시 시작으로 무효화된 응답
      const elapsed = performance.now() - thinkStart;
      const apply = () => applyAgent(res);
      if (elapsed < MIN_WAIT) setTimeout(apply, MIN_WAIT - elapsed); else apply();
    });
  }
  function applyAgent(res) {
    stopThinkDisplay();
    thinking = false;
    let action = res && res.action;
    if (!action) {                                   // 워커 오류나 수 없음: 첫 합법 이동 또는 차례 넘김
      const moves = R.legalMoves(state);
      action = moves.length ? { type: 'move', to: moves[0] } : null;
    }
    if (action) {
      if (action.type === 'fence') wallOwner.push(agentSide);
      try { state = R.apply(state, action); }
      catch (e) { const moves = R.legalMoves(state); if (moves.length) { if (action.type === 'fence') wallOwner.pop(); state = R.apply(state, { type: 'move', to: moves[0] }); action = { type: 'move' }; } }
    } else state.turn += 1;
    render();
    if (res && res.stats) {
      const st = res.stats;
      statsEl.textContent = typeof st.depth === 'number'
        ? `에이전트: 깊이 ${st.depth}, 노드 ${(st.nodes || 0).toLocaleString('ko-KR')}, ${Math.round(st.ms || 0)}ms`
        : `에이전트: ${st.depth === 'exact race' ? '정확 역행 분석' : '즉시'}, ${Math.round(st.ms || 0)}ms`;
    }
    if (checkEnd()) return;
    setStatus((action && action.type === 'fence' ? '에이전트가 벽을 놓았습니다. ' : '에이전트가 이동했습니다. ') + moveHint());
  }
  function startThinkDisplay() {
    const dots = reduceMotion.matches ? '' : '<span class="dots" aria-hidden="true"><span></span><span></span><span></span></span>';
    const tick = () => {
      const ms = Math.round(performance.now() - thinkStart);
      statusEl.innerHTML = `에이전트가 생각하고 있습니다 ${dots} <span class="elapsed">${ms}ms</span>`;
    };
    statusEl.className = 'status is-thinking';
    tick();
    thinkTimer = setInterval(tick, reduceMotion.matches ? 250 : 80);
  }
  function stopThinkDisplay() { if (thinkTimer) { clearInterval(thinkTimer); thinkTimer = null; } }

  /* ---------- 승패, 시작 ---------- */
  function checkEnd() {
    const w = R.winner(state);
    if (w < 0 && state.turn < MAX_TURNS) return false;
    over = true; mode = 'move'; armed = -1;
    render();
    const text = w < 0 ? `${MAX_TURNS}수가 지나 무승부입니다.` : w === humanSide ? '이겼습니다. 에이전트의 길을 잘 막았습니다.' : '졌습니다. 다시 시작해서 다른 수를 시도해 보세요.';
    setStatus(text);
    bannerText.textContent = w < 0 ? '무승부' : w === humanSide ? '이겼습니다' : '졌습니다';
    bannerEl.hidden = false;
    bannerRestart.focus({ preventScroll: true });
    return true;
  }
  let wallOwner = [];
  function start() {
    stopThinkDisplay();
    humanSide = Number(firstSel.value) === 1 ? 1 : 0;   // 선공은 white(0)
    agentSide = 1 - humanSide;
    state = R.initial(); wallOwner = [];
    mode = 'move'; orient = 'h'; armed = -1; thinking = false; over = false; pendingThink = false;
    bannerEl.hidden = true; statsEl.textContent = '';
    resetAgent();
    drawCells();
    render();
    setStatus(humanSide === 0 ? moveHint() : '에이전트가 먼저 둡니다.');
    requestAgent();
  }

  /* ---------- 이벤트 ---------- */
  fenceBtn.addEventListener('click', toggleFence);
  orientBtn.addEventListener('click', toggleOrient);
  restartBtn.addEventListener('click', start);
  bannerRestart.addEventListener('click', start);
  firstSel.addEventListener('change', () => { if (state.turn === 0 && !thinking) start(); });
  document.addEventListener('keydown', e => {
    if (e.target && (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT')) return;
    if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFence(); }
    else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); toggleOrient(); }
    else if (e.key === 'Escape' && mode === 'fence') { e.preventDefault(); mode = 'move'; armed = -1; render(); setStatus(moveHint()); }
  });
  window.addEventListener('message', e => {
    const m = e.data;
    if (!m || m.type !== 'portfolio:visible') return;
    visible = !!m.visible;
    if (visible && pendingThink) requestAgent();
  });

  start();
})();
