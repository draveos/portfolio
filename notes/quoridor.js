/* 노트: Quoridor Arena. 이 파일만 고치면 됩니다. 계약은 notes/README.md 참고.
   수치 근거: quoridor-arena/docs/LESSONS_1010.md 와 회차별 검증 기록(VERIFY_Q5~Q14, 2026-10-10).
   상대 교체는 9회차(10-10 03:56 스냅샷)이며 9회차 이후의 "새 Codex" 값은 전부 그 버전 기준입니다.
   포스터 media/quoridor/poster.svg 는 직접 그린 9×9 판입니다. 데모 demo/quoridor/index.html 은 별도 담당이 만들었고, 수당 예산은 ui.js 의 BUDGET(데스크톱 400ms, 터치 기기와 4코어 이하 600ms)입니다. */
(function () {
  /* 회차별 office 승수. wins/games. 선은 같은 상대 안에서만 잇는다. */
  const NEW = [ // 새 Codex(10-10 03:56 이후 버전) 상대
    { r: 9, w: 0, g: 20 }, { r: 10, w: 0, g: 20 }, { r: 11, w: 21, g: 40 },
    { r: 12, w: 18, g: 40 }, { r: 13, w: 0, g: 20 }, { r: 14, w: 9, g: 20 }
  ];
  const OLD = [ // 구 Codex(codex_v1, 9회차 전에는 유일한 Codex) 상대. 8회차는 10판 4회(4, 0, 3, 1승) 합산
    { r: 5, w: 0, g: 10 }, { r: 6, w: 1, g: 10 }, { r: 7, w: 0, g: 10 }, { r: 8, w: 8, g: 40 },
    { r: 9, w: 4, g: 20 }, { r: 10, w: 1, g: 20 }, { r: 11, w: 0, g: 40 }, { r: 12, w: 1, g: 20 },
    { r: 13, w: 9, g: 20 }, { r: 14, w: 0, g: 20 }
  ];
  const BLUE = '#4c62c4', AMBER = '#b07a2e', INK = '#5b6678', GRID = '#e3e8f0', AXIS = '#8b96a8';

  function winChart() {
    const K = window.FIGKIT, C = K.C, W = 680, H = 404, L = 58, R = 22, T = 104, yb = H - 76;
    const X = r => L + (r - 5) * (W - L - R) / 9, Y = v => yb - v / 70 * (yb - T), pct = p => 100 * p.w / p.g;
    let s = K.open(W, H, { label: '회의 회차별 office 승률. 새 Codex 상대는 9회차 0/20 에서 11회차 21/40, 12회차 18/40, 13회차 0/20, 14회차 9/20. 구 Codex 상대는 6회차 1/10, 9회차 4/20, 11회차 0/40, 13회차 9/20.', marker: 'quoridor-win' });
    for (const v of [20, 40, 60]) s += K.line(L, Y(v), W - R, Y(v), { stroke: C.grid });
    s += K.line(L, yb, W - R, yb, { stroke: C.axis });
    s += K.line(L, Y(70), W - R, Y(70), { stroke: C.gray, dash: '2 4' });
    s += K.line(L, Y(45), W - R, Y(45), { stroke: C.blue, dash: '2 4' });
    s += K.line(X(8.5), T - 8, X(8.5), yb, { stroke: C.accent, dash: '4 4', sw: 1.2 });
    const lineOf = (pts, color, dash) => `<polyline points="${pts.map(p => `${X(p.r).toFixed(1)},${Y(pct(p)).toFixed(1)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2"${dash ? ' stroke-dasharray="6 4"' : ''} stroke-linejoin="round"/>`;
    s += lineOf(OLD, C.gray, true) + lineOf(NEW, C.blue, false);
    const dots = (pts, color, who) => pts.map(p => `<g><title>${p.r}회차 ${who} Codex 상대 ${p.w}승 / ${p.g}판 (${Math.round(pct(p))}%)</title>${K.circle(X(p.r), Y(pct(p)), 4.5, { fill: color, stroke: '#fff', sw: 2 })}</g>`).join('');
    s += dots(OLD, C.gray, '구') + dots(NEW, C.blue, '새');
    /* 라벨 자리 고르기: 두 선분을 잘게 찍어 두고, 점 위/아래 후보 중 선과 다른 라벨, 점에 덜 겹치는 쪽을 고른다 */
    const seg = pts => { const out = []; for (let i = 1; i < pts.length; i++) { const a = [X(pts[i - 1].r), Y(pct(pts[i - 1]))], b = [X(pts[i].r), Y(pct(pts[i]))]; for (let k = 0; k <= 24; k++) out.push([a[0] + (b[0] - a[0]) * k / 24, a[1] + (b[1] - a[1]) * k / 24, 2]); } return out; };
    const refs = []; for (let x = L; x <= W - R; x += 6) { refs.push([x, Y(45), 3]); refs.push([x, Y(70), 3]); } for (let yy = T; yy <= yb; yy += 6) refs.push([X(8.5), yy, 3]);
    const samples = seg(OLD).concat(seg(NEW)).concat(refs), dotsXY = OLD.concat(NEW).map(p => [X(p.r), Y(pct(p))]);
    const labelsFor = (size, placed, subset, subsetNew) => { let out = ''; const pick = (pts, sub) => sub ? pts.filter(p => sub.includes(p.r)) : pts; const cost = bx => { let c = 0; for (const [sx, sy, wgt] of samples) if (sx > bx[0] - 1 && sx < bx[2] + 1 && sy > bx[1] - 1 && sy < bx[3] + 1) c += wgt || 1; for (const [dx, dy] of dotsXY) if (dx > bx[0] - 5 && dx < bx[2] + 5 && dy > bx[1] - 5 && dy < bx[3] + 5) c += 6; for (const q of placed) if (Math.min(bx[2], q[2]) - Math.max(bx[0], q[0]) > -1 && Math.min(bx[3], q[3]) - Math.max(bx[1], q[1]) > -1) c += 40; return c; };
      const put = (pts, color, preferAbove) => { for (const p of pts) { const x = X(p.r), y = Y(pct(p)), label = `${p.w}/${p.g}`, w = K.tw(label, size) + 4, h = size; const cand = [[x, y - 10, 'above'], [x, y + 8 + h * .95, 'below'], [x - w / 2 - 9, y + h * .36, 'left'], [x + w / 2 + 9, y + h * .36, 'right'], [x - w / 2 - 12, y - 8, 'd'], [x + w / 2 + 12, y - 8, 'd'], [x - w / 2 - 12, y + 8 + h, 'd'], [x + w / 2 + 12, y + 8 + h, 'd'], [x, y - 24, 'f'], [x - w / 2 - 12, y - 22, 'f'], [x + w / 2 + 12, y - 22, 'f'], [x - w / 2 - 14, y + 22 + h, 'f'], [x + w / 2 + 14, y + 22 + h, 'f']]; if (!preferAbove) { const t = cand[0]; cand[0] = cand[1]; cand[1] = t; } let best = null; for (let [lx, ly, side] of cand) { lx = Math.max(4 + w / 2, Math.min(W - 4 - w / 2, lx)); const bx = [lx - w / 2, ly - h * .95, lx + w / 2, ly + h * .3]; if (bx[3] > yb + 24) continue; /* 축 눈금 글자 띠(yb+23 아래)는 피한다 */ const c = cost(bx) + (side === (preferAbove ? 'above' : 'below') ? 0 : side === 'left' || side === 'right' ? 2 : side === 'd' ? 3 : side === 'f' ? 5 : 1); if (!best || c < best.c) best = { c, lx, ly, bx }; } placed.push(best.bx); out += K.text(best.lx, best.ly, label, { size, fill: color, w: 600, a: 'middle', halo: true }); } };
      put(pick(OLD, subset), '#6b7484', true); put(pick(NEW, subsetNew), C.blue, false); return out; };
    s += '<g class="fg-w">' + K.head('회차별 office 승률', '전략 회의 회차마다 두 상대와 둔 결과. 점 옆 숫자는 승/판이고, 선은 같은 상대 안에서만 이었습니다');
    s += K.legend(22, 76, [{ k: 'line', color: C.blue, label: '새 Codex 상대' }, { k: 'dot-dash', color: C.gray, label: '구 Codex 상대' }, { k: 'dash', color: C.accent, label: '상대 교체' }]);
    for (const v of [0, 20, 40, 60]) s += K.text(L - 9, Y(v) + 4, v + '%', { size: 12, fill: C.muted, a: 'end' });
    for (let r = 5; r <= 14; r++) s += K.text(X(r), yb + 34, r, { size: 12, fill: C.muted, a: 'middle' });
    s += K.text(W - R, yb + 52, '회차', { size: 12, fill: C.muted, a: 'end' }) + K.text(16, (T + yb) / 2, '승률', { size: 12, fill: C.muted, a: 'middle', rot: -90 });
    s += K.pill(W - R - 4, Y(70) - 9, '목표 7/10', { size: 11.5, color: C.muted, w: 500, a: 'end' });
    s += K.pill(L + 6, Y(45) - 9, '45%: 아레나에 설치한 12회차 18/40', { size: 11.5, color: C.blue, stroke: C.tint2, w: 600 });
    s += K.pill(X(8.5) + 8, T + 26, '9회차부터 새 Codex 상대 추가', { size: 11.5, color: C.accentInk, stroke: '#f0cdb8', w: 600 });
    { const ax = []; for (let r = 5; r <= 14; r++) ax.push([X(r) - 7, yb + 23, X(r) + 7, yb + 37]); const pb = K.pillBox(X(8.5) + 8, T + 26, '9회차부터 새 Codex 상대 추가', { size: 11.5 }); ax.push([pb.left, pb.top, pb.left + pb.w, pb.top + pb.h]); const pc = K.pillBox(L + 6, Y(45) - 9, '45%: 아레나에 설치한 12회차 18/40', { size: 11.5 }); ax.push([pc.left, pc.top, pc.left + pc.w, pc.top + pc.h]); s += labelsFor(11.5, ax); }
    s += '</g><g class="fg-m">' + K.text(22, 38, '회차별 office 승률', { size: 24, w: 700 });
    s += K.legend(22, 74, [{ k: 'line', color: C.blue, label: '새 Codex' }, { k: 'dot-dash', color: C.gray, label: '구 Codex' }, { k: 'dash', color: C.accent, label: '상대 교체' }], { size: 17.5, gap: 22 });
    for (const v of [0, 40]) s += K.text(L - 9, Y(v) + 4, v + '%', { size: 17.5, fill: C.muted, a: 'end' });
    for (const r of [5, 9, 14]) s += K.text(r === 14 ? X(r) + 10 : X(r), yb + 38, r + '회차', { size: 17.5, fill: C.muted, a: r === 14 ? 'end' : 'middle' });
    s += K.pill(L + 6, Y(45) - 12, '45% 설치본', { size: 17.5, color: C.blue, stroke: C.tint2, w: 600 });
    { const ax = [5, 9, 14].map(r => [X(r) - (r === 14 ? 52 : 30), yb + 22, X(r) + (r === 14 ? 10 : 30), yb + 42]); const pc = K.pillBox(L + 6, Y(45) - 12, '45% 설치본', { size: 17.5 }); ax.push([pc.left, pc.top, pc.left + pc.w, pc.top + pc.h]); s += labelsFor(17.5, ax, [8, 11, 13], [9, 11, 12, 13, 14]); }
    s += '</g>';
    return s + K.close();
  }

  window.NOTES.push({
    id: 'quoridor',
    order: 40,
    title: '쿼리도 에이전트와 20판 평가 기준',
    summary: '같은 조건에서 승률이 0~40%로 흔들려, 20판 측정 규약을 정했습니다.',
    topic: '에이전트',
    category: '프로젝트',
    date: '2026.10.09–10',
    tools: ['Python', 'Three.js', 'pyquoridor'],
    tag: 'Quoridor Arena',
    shots: [
      { src: assets + 'quoridor_arena.png', alt: '쿼리도 관전 화면. 복셀 판 위에 말과 울타리, 옆에 수 기록', caption: 'Quoridor Arena 관전 화면. 수 기록과 한 수에 걸린 시간을 함께 봅니다.' }
    ],
    hero: { src: 'media/quoridor/cover_arena.jpg', alt: '나무 판 위에 울타리가 선 복셀 쿼리도 판과 두 말(생성 이미지)', caption: '쿼리도 판을 복셀로 그린 생성 이미지입니다. 실제 관전 화면은 아래 캡처에 있습니다.' },
    links: [
      { label: '직접 두어 보기', href: 'https://draveos.github.io/Quoridor-Agents/', kind: 'live' },
      { label: '코드 보기', href: 'https://github.com/draveos/Quoridor-Agents', kind: 'code' }
    ],
    meta: { period: '2026.10.09–10', role: '아레나 제작, 전략 회의 체인 운영과 측정', members: '1인', env: 'Python 3.13, pyquoridor 0.0.5, Three.js' },
    points: {
      shows: '쿼리도 실험 환경을 만들고, 승률을 비교할 20판 평가 기준을 정했습니다.',
      why: '전략 회의로 수정한 에이전트가 단일 에이전트보다 잘 두는지 비교했습니다.',
      matters: '같은 시드에서도 승률이 달라져 판 수, 동시 실행 수, 수당 시간을 고정했습니다.'
    },
    summary60: [
      '전략 회의 <b class="num">14회차</b>, 상대는 GPT 가 쓴 에이전트 <b class="num">2</b>버전',
      '같은 시드 10판을 <b class="num">4</b>번 반복하니 <b class="num">4, 0, 3, 1승</b>으로 흔들림',
      '이후 측정은 <b class="num">20판</b>, 동시 실행 <b class="num">2</b>, 수당 <b class="num">1초</b>로 고정',
      '새 Codex 상대 최고 <b class="num">21/40</b>(11회차), 목표 <b class="num">7/10</b> 미달',
      '한 상대에 맞추니 구 Codex 상대는 <b class="num">0/40</b>(11회차)'
    ],
    sections: [
      { id: 'made', title: '무엇을 만들었나', html: `<p>쿼리도는 9×9 판에서 말을 반대편 줄에 먼저 닿게 하면 이기는 보드게임입니다. 각자 울타리 10장으로 상대의 길을 늘릴 수 있지만, 완전히 막는 것은 반칙입니다.</p><p>규칙 엔진은 대학 휴리스틱 과제에서 쓰던 Python 코드를 그대로 가져왔습니다. pyquoridor 0.0.5 패키지를 감싼 래퍼이고, 에이전트는 정해진 시간 안에 이동 또는 울타리 하나를 돌려주면 됩니다. 서버는 표준 라이브러리 http.server 하나로 127.0.0.1:4250 에 띄웠고, 브라우저는 Three.js 복셀 화면으로 관전만 합니다. 사람 자리도 있어 직접 둘 수 있습니다.</p><p>에이전트는 직접 만든 파일 28개(실험용과 뼈대 포함)에, <a href="#note/office">Agent Office</a> 의 전략 회의가 14회차에 걸쳐 고친 office 계열 9개와 GPT 가 쓴 codex 2개를 더했습니다. 회의는 진 판을 다시 돌려보고 패배 유형 하나를 막는 식으로 진행했습니다.</p>` },
      { id: 'noise', title: '승률이 흔들린 이유와 20판 규약', html: `<p>8회차에서 같은 시드 10판(선후공 교대)을 네 번 반복했더니 4승, 0승, 3승, 1승이 나왔습니다. 양쪽 다 시간 제한 탐색이라, 다른 작업으로 CPU 부하가 높아지면 할당받은 연산 시간이 줄어 탐색 깊이가 얕아집니다. 승률 하나로 회차 사이의 개선을 판단할 수 없었습니다.</p><table><thead><tr><th>항목</th><th>규약</th></tr></thead><tbody><tr><td>판 수</td><td>20판, 시드 고정, 선후공 교대</td></tr><tr><td>동시 실행</td><td>2 (PAIR_JOBS=2)</td></tr><tr><td>수당 시간</td><td>1.0초</td></tr><tr><td>회귀 게이트</td><td>greedy 전승, killer 1승 이상, 반칙 0, 이전 설치본 이상일 때만 아레나에 설치</td></tr><tr><td>비교</td><td>같은 조건의 숫자끼리만</td></tr></tbody></table><p>같은 구 Codex 상대로 20판을 다시 재니 8회차 코드는 0/20 과 1/20 이었습니다. 앞서 나온 4승과 3승은 부하가 높을 때 상대의 탐색 시간이 더 줄어 얻은 결과로 보였습니다.</p><p>비슷한 점수 변동을 <a href="#note/exaone">EXAONE 리더보드</a>에서도 확인했습니다. 같은 파일을 다시 내면 점수가 0.005~0.009 흔들렸고, 재제출로 변동 폭을 확인했습니다.</p>` },
      { id: 'rounds', title: '14회차 결과 그래프', html: `<p>상대는 GPT 가 쓴 에이전트 codex 의 두 버전입니다. 10일 새벽에 새 버전이 들어와 9회차부터는 둘 다 쟀습니다. 11회차는 새 Codex 상대 21/40 으로 가장 높았지만, 같은 코드가 구 Codex 상대로는 0/40 이었습니다. 12회차 18/40 을 아레나에 설치했습니다.</p>${fig(winChart(), '점 옆 숫자는 승/판입니다. 선은 같은 상대 안에서만 이었습니다. 8회차 구 Codex 값은 10판 4회(4, 0, 3, 1승)의 합산이고, 4회차 이전은 Codex 대국이 2판 이하라 뺐습니다. 점에 마우스를 올리면 값이 보입니다. 8회차 값은 규약 전 측정이라 규약으로 다시 재면 0~1/20 이었습니다.')}<p>13회차는 거꾸로 새 상대 0/20, 구 상대 9/20 이었습니다. 한 상대에 맞춰 전략을 수정하면 다른 상대에게 약해지는 결과가 나왔습니다. 14회차에 상대 유형 분기를 넣었지만 9/20 과 0/20 으로 끝났고, 목표 7/10 에 못 미친 채 중단했습니다.</p>` },
      { id: 'play', title: '직접 두어 보기', html: `${demoBlock({ src: 'https://draveos.github.io/Quoridor-Agents/', poster: 'media/quoridor/cover_arena.jpg', title: 'Quoridor Agents', autoplay: true, caption: 'Codex 와 Claude 에이전트 중 하나를 골라 둡니다. 데스크톱은 3D 복셀 판이고 드래그로 돌릴 수 있습니다. 전체 화면은 위의 직접 두어 보기 버튼으로 엽니다.', height: 760 })}<p>상대는 위 그래프의 새 Codex 입니다. 81칸 벽 그래프 위에서 반복 심화 negamax 로 두고, 탐색 에이전트(greedy, killer)에는 진 기록이 없습니다. 말은 상하좌우 한 칸씩 가고, 상대가 붙어 있으면 뛰어넘습니다. 울타리는 두 칸 길이이며 상대 길을 완전히 막을 수 없습니다.</p>` }
    ],
    gaps: '목표 7/10에는 못 미쳤습니다. 14회차에 추가한 상대 유형 분기는 구 Codex 상대의 성적을 개선하지 못했고, 실제로 발동했는지도 로그로 확인하지 못했습니다. 단일 에이전트는 한 세션에서 실행과 수정을 반복해 비슷한 수준의 결과를 냈습니다. 다음에는 시간 대신 탐색 노드 수를 고정해 부하의 영향을 줄이고, 기준 상대 둘 모두 이전 성적 이상일 때만 설치할 계획입니다.',
    thumb: { src: 'media/quoridor/cover_arena.jpg', alt: '복셀 쿼리도 판(생성 이미지)' }
  });
})();
