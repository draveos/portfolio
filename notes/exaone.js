/* 노트: EXAONE 경량화. 이 파일만 고치면 됩니다. 계약은 notes/README.md 참고.
   헬퍼(fig, esc, todo, demoBlock, comparison, assets)는 app.js 가 먼저 정의합니다.
   사실 출처: ~/IdeaProjects/EXAONE(README, src/sensitivity_analyzer.py, src/api_collector.py, n_src/evaluator_lgproxy.py,
   models/<변형>/config.json 의 quantization_config 와 recipe.yaml, data/gold_dataset.jsonl 98행, layer_sensitivity.csv),
   ~/Downloads/6_4_1차_curbest_0_624.py(양자화 셀 228–247행), EXAONE_ADD.md, ANSWERS.md. 로컬 기록에 없는 값(중간 리더보드 점수, 팀원 역할, 증빙 캡처)은 2026-10-14 마무리에서 문장째 뺐습니다.
   공개 레포(draveos/LGAimers-EXAONE-Experiment)에는 src/ 5개 파일과 README 만 있고 n_src, data, models 는 로컬에만 있습니다(2026-10-14 확인). */
(function () {
  const REPO = 'https://github.com/draveos/LGAimers-EXAONE-Experiment';

  /* layer_sensitivity.csv 를 레이어 번호순으로 정렬한 값(원본 CSV 는 점수 오름차순) */
  const sensitivity = [{"layer": 0, "score": 0.28618662655353544}, {"layer": 1, "score": 0.7477518826723099}, {"layer": 2, "score": 0.8421260118484497}, {"layer": 3, "score": 0.8601556658744812}, {"layer": 4, "score": 0.8623774766921997}, {"layer": 5, "score": 0.8601854681968689}, {"layer": 6, "score": 0.8525140047073364}, {"layer": 7, "score": 0.8704206824302674}, {"layer": 8, "score": 0.8343899786472321}, {"layer": 9, "score": 0.858257257938385}, {"layer": 10, "score": 0.8774169445037842}, {"layer": 11, "score": 0.8768952071666718}, {"layer": 12, "score": 0.8568712472915649}, {"layer": 13, "score": 0.8483477056026458}, {"layer": 14, "score": 0.8652986943721771}, {"layer": 15, "score": 0.8616881370544434}, {"layer": 16, "score": 0.8658038973808289}, {"layer": 17, "score": 0.8643659234046936}, {"layer": 18, "score": 0.8513646125793457}, {"layer": 19, "score": 0.869866693019867}, {"layer": 20, "score": 0.8502615988254547}, {"layer": 21, "score": 0.8431007027626037}, {"layer": 22, "score": 0.8672479331493378}, {"layer": 23, "score": 0.866863238811493}, {"layer": 24, "score": 0.8265694558620453}, {"layer": 25, "score": 0.8678663730621338}, {"layer": 26, "score": 0.8527340233325958}, {"layer": 27, "score": 0.8480353891849518}, {"layer": 28, "score": 0.855422955751419}, {"layer": 29, "score": 0.8571839451789856}];

  const K = window.FIGKIT, C = K.C;

  /* 히어로. compact 는 작은 자리(제목, 범례 생략). .fg-w / .fg-m 은 컨테이너 폭에 따라 바뀌는 라벨 층. */
  function sensitivityChart(compact = false) {
    const W = 640, H = compact ? 230 : 360, L = 58, R = 22, T = compact ? 26 : 96, B = compact ? 46 : 60, yb = H - B;
    const y = v => yb - (v - .2) / .7 * (yb - T), step = (W - L - R) / 30, bx = i => L + i * step;
    const rest = sensitivity.filter(p => p.layer >= 2), mean = rest.reduce((a, p) => a + p.score, 0) / rest.length;
    const lo = Math.min(...rest.map(p => p.score)), hi = Math.max(...rest.map(p => p.score));
    let s = K.open(W, H, { label: '30개 레이어의 모사 양자화 응답 유사도. 0번 0.29, 1번 0.75, 나머지 약 0.83에서 0.88', marker: 'exaone-sens' });
    /* 2–29번 범위 띠와 격자 */
    s += K.rect(L, y(hi), W - L - R, y(lo) - y(hi), { rx: 0, fill: C.tint2, op: .6, cls: 'fg-bg' });
    for (const v of [.4, .6, .8]) s += K.line(L, y(v), W - R, y(v), { stroke: C.grid });
    s += K.line(L, yb, W - R, yb, { stroke: C.axis });
    /* y축과 절단 표시(0.2 부터 그림) */
    s += K.line(L, T - 6, L, yb - 16, { stroke: C.axis }) + K.line(L, yb - 6, L, yb, { stroke: C.axis }) + K.path(`M${L - 4} ${yb - 8}l8 -4M${L - 4} ${yb - 14}l8 -4`, { stroke: C.muted, sw: 1.2 });
    /* 막대: 0, 1번은 강조색 */
    for (const p of sensitivity) { const x = bx(p.layer); s += `<rect x="${(x + 3.5).toFixed(1)}" y="${y(p.score).toFixed(1)}" width="${(step - 7).toFixed(1)}" height="${(yb - y(p.score)).toFixed(1)}" rx="2.5" fill="${p.layer < 2 ? C.accent : C.soft}"><title>레이어 ${p.layer}: ${p.score.toFixed(3)}</title></rect>`; }
    /* 2–29번 평균 점선 */
    s += K.line(bx(2) + 2, y(mean), W - R, y(mean), { stroke: C.blue, sw: 1.5, dash: '4 3' });
    const x01 = [bx(0) + step / 2, bx(1) + step / 2], s0 = sensitivity[0].score, s1 = sensitivity[1].score, ms = mean.toFixed(2);
    /* 데스크톱 라벨 층 */
    s += '<g class="fg-w">';
    if (!compact) {
      s += K.head('레이어별 모사 양자화 응답 유사도', '레이어마다 4비트 모사 양자화를 적용해 기준 답과 비교했습니다 (레이어당 10샘플)');
      s += K.legend(22, 74, [{ k: 'sq', color: C.accent, label: '0, 1번 레이어' }, { k: 'sq', color: C.soft, label: '2–29번' }, { k: 'dash', color: C.blue, label: `2–29번 평균 ${ms}` }, { k: 'band', color: C.tint, label: `범위 ${lo.toFixed(2)}–${hi.toFixed(2)}` }]);
    }
    for (const v of [.2, .4, .6, .8]) s += K.text(L - 9, y(v) + 4, v.toFixed(1), { size: 12, fill: C.muted, a: 'end' });
    for (const i of [0, 1, 5, 10, 15, 20, 25, 29]) s += K.text(bx(i) + step / 2, yb + 18, i, { size: 12, fill: C.muted, a: 'middle' });
    s += K.text((L + W - R) / 2, yb + 36, '레이어 번호', { size: 12, fill: C.muted, a: 'middle' });
    s += K.text(16, (T + yb) / 2, '응답 유사도', { size: 12, fill: C.muted, a: 'middle', rot: -90 });
    s += K.text(x01[0], y(s0) - 7, s0.toFixed(2), { size: 12.5, w: 700, fill: C.accentInk, a: 'middle' }) + K.text(x01[1], y(s1) - 7, s1.toFixed(2), { size: 12.5, w: 700, fill: C.accentInk, a: 'middle' });
    s += K.callout(x01[1] + step / 2 - 2, y(s1) + 18, bx(3) + 6, y(.56), '앞단 두 레이어의 유사도가 낮음', { size: 12, lead: C.accentInk, dot: false, color: C.accentInk, stroke: '#f0cdb8' });
    s += '</g><g class="fg-m">';
    if (!compact) { s += K.text(22, 38, '레이어별 응답 유사도', { size: 24, w: 700 }); s += K.legend(22, 70, [{ k: 'sq', color: C.accent, label: '0, 1번' }, { k: 'sq', color: C.soft, label: '2–29번' }, { k: 'dash', color: C.blue, label: `평균 ${ms}` }], { size: 19, gap: 22 }); }
    for (const v of [.2, .5, .8]) s += K.text(L - 9, y(v) + 6, v.toFixed(1), { size: 19, fill: C.muted, a: 'end' });
    for (const i of [0, 1, 10, 20, 29]) s += K.text(bx(i) + step / 2, yb + 26, i, { size: 19, fill: C.muted, a: 'middle' });
    s += K.text(x01[0], y(s0) - 8, s0.toFixed(2), { size: 19, w: 700, fill: C.accentInk, a: 'middle' }) + K.text(x01[1], y(s1) - 8, s1.toFixed(2), { size: 19, w: 700, fill: C.accentInk, a: 'middle' });
    s += K.callout(x01[1] + step / 2 - 2, y(s1) + 18, bx(3) + 6, y(.52), '앞단 두 레이어의 유사도가 낮음', { size: 19, lead: C.accentInk, dot: false, color: C.accentInk, stroke: '#f0cdb8', padX: 10 });
    s += '</g>';
    return s + K.close();
  }

  /* 0.624 제출 스크립트의 양자화 셀(228–247행) 기준: o_proj, down_proj 전 레이어 W8, 나머지 Linear W4. oneshot 호출은 하나뿐이고
     로컬 models/ 최종 변형의 recipe.yaml 도 같은 regex 두 개입니다. q_proj 와 up_proj 0–11 은 변수(W8_TARGETS)에만 있고 셀에 쓰이지 않았습니다(2026-10-14 확인). */
  function recipeChart() {
    const modules = ['q_proj', 'k_proj', 'v_proj', 'o_proj', 'up_proj', 'gate_proj', 'down_proj'], W8 = ['o_proj', 'down_proj'];
    const W = 760, H = 318, x0 = 126, y0 = 74, rowH = 23, cell = 15, stepX = 15, gx1 = x0 + 29 * stepX + cell, sepY = y0 + 4 * rowH - 4;
    let s = K.open(W, H, { label: 'o_proj 와 down_proj 전 레이어 W8, 나머지 W4', marker: 'exaone-recipe' });
    modules.forEach((m, j) => { const w8 = W8.includes(m), y = y0 + j * rowH; for (let i = 0; i < 30; i++) s += `<rect x="${(x0 + i * stepX).toFixed(1)}" y="${y}" width="${cell - 2.5}" height="${rowH - 4}" rx="3" fill="${w8 ? C.blue : C.tint2}"><title>${m} / 레이어 ${i}: ${w8 ? 'W8' : 'W4'}</title></rect>`; });
    s += K.line(28, sepY, gx1, sepY, { stroke: C.axis, dash: '3 3' });
    const ly = j => y0 + j * rowH + rowH / 2 + 4.5;
    /* 요약 콜아웃(격자 오른쪽) */
    const cx = gx1 + 26, cy = y0 + 3 * rowH - 4;
    s += K.rect(cx, cy, W - 20 - cx, 68, { rx: 10, fill: C.tint, cls: 'fg-bg' }) + K.line(gx1 - 2, ly(3) - 4.5, cx, cy + 33, { stroke: C.blue, sw: 1 }) + K.circle(gx1 - 2, ly(3) - 4.5, 2.2, { fill: C.blue });
    s += '<g class="fg-w">';
    s += K.head('모듈별 양자화 설정', '모듈 7종 × 레이어 30개 격자. 진한 칸은 8비트로 보호한 모듈입니다');
    modules.forEach((m, j) => s += K.text(x0 - 12, ly(j), m, { size: 12.5, fill: W8.includes(m) ? C.ink : C.muted, w: W8.includes(m) ? 600 : 400, a: 'end', mono: true }));
    s += K.text(20, ly(1) + 12, 'attention', { size: 10.5, fill: C.muted, a: 'middle', rot: -90, ls: .5 }) + K.text(20, ly(5), 'mlp', { size: 10.5, fill: C.muted, a: 'middle', rot: -90, ls: .5 });
    for (const i of [0, 5, 10, 15, 20, 25, 29]) s += K.text(x0 + i * stepX + (cell - 2.5) / 2, y0 + 7 * rowH + 12, i, { size: 12, fill: C.muted, a: 'middle' });
    s += K.text(gx1, y0 + 7 * rowH + 30, '레이어 번호', { size: 12, fill: C.muted, a: 'end' });
    s += K.text(cx + 14, cy + 26, 'W8 2개 모듈 × 30층', { size: 13, w: 700, fill: C.blue }) + K.text(cx + 14, cy + 48, '= 60 자리', { size: 12.5, fill: C.muted });
    s += K.legend(x0, H - 24, [{ k: 'sq', color: C.blue, label: 'W8 (8비트로 보호)' }, { k: 'sq', color: C.tint2, label: 'W4 (4비트)' }]);
    s += '</g><g class="fg-m">';
    s += K.text(22, 38, '모듈별 양자화 설정', { size: 24, w: 700 });
    modules.forEach((m, j) => s += K.text(x0 - 10, ly(j) + 2, m, { size: 19.5, fill: W8.includes(m) ? C.ink : C.muted, w: W8.includes(m) ? 600 : 400, a: 'end', mono: true }));
    for (const i of [0, 15, 29]) s += K.text(x0 + i * stepX + (cell - 2.5) / 2, y0 + 7 * rowH + 18, i, { size: 20, fill: C.muted, a: 'middle' });
    s += K.text(cx + 12, cy + 26, 'W8 2개 모듈', { size: 20, w: 700, fill: C.blue }) + K.text(cx + 12, cy + 52, '× 30층 = 60', { size: 20, w: 700, fill: C.blue });
    s += K.legend(x0, H - 22, [{ k: 'sq', color: C.blue, label: 'W8' }, { k: 'sq', color: C.tint2, label: 'W4' }], { size: 20, gap: 24 });
    s += '</g>';
    return s + K.close();
  }

  /* 코덱스 납품 그림이 로드돼 있으면 쓰고, 없으면 글이 깨지지 않게 빈 문자열 */

  /* 데이콘 제출 57건(2026-02-02~02-25). [일수, 점수|null(오류), 같은파일표시] — assets/data/exaone_submissions.csv */
  const submissions = [[0.577,0.4681],[0.615,0.4708],[0.738,null],[0.744,0.3890],[1.635,0.4747],[1.65,0.4837],[1.724,0.4868],[2.01,0.5644],[2.032,0.5613],[2.084,0.5706],[2.827,0.5707],[2.902,null],[2.909,null],[3.02,null],[3.091,0.4683],[5.943,0.4616],[5.979,0.4609],[5.999,0.5669],[6.016,0.4437],[6.048,0.4866],[6.453,0.4774],[7.462,0.4905],[7.528,0.5662],[7.603,0.5713],[8.002,0.4964],[8.061,0.5963],[8.104,0.5866],[9.732,null],[11.007,0.0000],[11.826,0.4810],[11.945,0.5075],[12.496,0.5005],[12.537,null],[12.568,null],[13.001,null],[13.488,null],[13.541,0.5902],[14.024,0.6242,1],[14.98,0.6198,1],[17.998,null],[18.414,null],[18.538,null],[19.66,null],[19.718,null],[19.747,0.4904],[20.007,null],[20.369,null],[20.492,0.5031],[21.323,0.4965],[21.379,0.5843],[21.424,0.5986],[22.121,null],[22.159,0.5995],[22.831,0.5847],[23.0,0.6194,1],[23.384,0.6213,1],[23.41,0.6190]];
  function submissionsChart() {
    const W = 680, H = 432, L = 60, R = 22, T = 102, B = 96, x0 = L, x1 = W - R, yb = H - B;
    const x = d => x0 + d / 24 * (x1 - x0), y = s => yb - (s - .36) / (.66 - .36) * (yb - T);
    const errors = submissions.filter(p => p[1] === null), scored = submissions.filter(p => p[1] !== null), same = submissions.filter(p => p[2]);
    let s = K.open(W, H, { label: '데이콘 제출 57건의 날짜별 점수. 오류 17건은 아래 빨간 눈금', marker: 'exaone-subm' });
    /* 구간 띠 4개 */
    const phases = [[0, 7, '베이스라인 탐색 2/2–2/8', '탐색', C.band], [7, 14, '하이브리드 2/9–2/15', '하이브리드', '#ffffff'], [14, 15, '최고점 2/16', '최고', C.accentTint], [15, 24, '재현 시도 2/17–2/25', '재현', C.band]];
    for (const [a, b, , , f] of phases) s += K.rect(x(a), T, x(b) - x(a), yb - T, { rx: 0, fill: f, cls: 'fg-bg' });
    for (const v of [.4, .5, .6]) s += K.line(x0, y(v), x1, y(v), { stroke: C.grid });
    s += K.line(x0, yb, x1, yb, { stroke: C.axis });
    /* 오류 눈금 줄 */
    const ey = yb + 20;
    s += K.line(x0, ey, x1, ey, { stroke: C.grid });
    for (const [d] of errors) s += `<line x1="${x(d).toFixed(1)}" y1="${ey - 7}" x2="${x(d).toFixed(1)}" y2="${ey + 7}" stroke="${C.red}" stroke-width="2" stroke-linecap="round"><title>${d.toFixed(1)}일째: 제출 오류</title></line>`;
    /* 같은 파일 점선, 점, 최고점 별 */
    s += `<polyline points="${same.map(p => `${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(' ')}" fill="none" stroke="${C.blue}" stroke-dasharray="4 3" stroke-width="1.2"/>`;
    for (const [d, v, sf] of scored) {
      const best = v >= .624, off = v < .36;
      if (best) s += `<g><title>${d.toFixed(1)}일째: ${v.toFixed(4)} (최고)</title>${K.star(x(d), y(v), 9)}</g>`;
      else s += `<circle cx="${x(d).toFixed(1)}" cy="${(off ? yb : y(v)).toFixed(1)}" r="${sf ? 4.5 : 4}" fill="${sf ? '#fff' : off ? C.red : C.soft}" stroke="${sf ? C.blue : 'none'}" stroke-width="1.6"><title>${d.toFixed(1)}일째: ${v.toFixed(4)}</title></circle>`;
    }
    const pt = (dd) => submissions.find(p => Math.abs(p[0] - dd) < .01);
    const P = { base: pt(0.577), hyb: pt(2.01), damp: pt(8.061), blk: pt(13.541), best: pt(14.024), zero: pt(11.007) };
    const co = (p, tx, ty, label, o = {}) => K.callout(x(p[0]), y(p[1]), tx, ty, label, Object.assign({ size: 11.5, color: C.blue, stroke: C.tint2, lead: C.blue }, o));
    s += '<g class="fg-w">';
    s += K.head('데이콘 제출 57건의 점수 흐름', '2/2–2/25, 24일 동안 낸 57건의 리더보드 점수. 평가 오류 17건은 축 아래 빨간 눈금');
    s += K.legend(22, 76, [{ k: 'dot', color: C.soft, label: '채점 40건' }, { k: 'tick', color: C.red, label: '제출 오류 17건' }, { k: 'ring', color: C.blue, label: '같은 파일 재제출 4회' }, { k: 'star', color: C.accent, label: '최고점' }]);
    for (const [a, b, lab] of phases) s += K.text((x(a) + x(b)) / 2, T - 7, lab, { size: 10.5, fill: C.muted, a: 'middle' });
    for (const v of [.4, .5, .6]) s += K.text(x0 - 9, y(v) + 4, v.toFixed(1), { size: 12, fill: C.muted, a: 'end' });
    s += K.text(x0 - 9, ey + 4, '제출 오류', { size: 11, fill: C.red, w: 600, a: 'end' });
    for (const [d, lab] of [[0, '2/2'], [7, '2/9'], [14, '2/16'], [21, '2/23']]) s += K.text(x(d), ey + 30, lab, { size: 12, fill: C.muted, a: 'middle' });
    s += K.text(x1, ey + 30, '제출일', { size: 12, fill: C.muted, a: 'end' }) + K.text(16, (T + yb) / 2, '리더보드 점수', { size: 12, fill: C.muted, a: 'middle', rot: -90 });
    s += co(P.base, x(P.base[0]) + 12, y(.433), '베이스라인 0.47');
    s += co(P.hyb, x0 + 6, y(.59), '민감도 하이브리드 0.56');
    s += co(P.damp, x(P.damp[0]) - 12, y(.625), 'damp 0.01 → 0.596', { a: 'end' });
    s += co(P.blk, x(P.blk[0]), y(P.blk[1]) + 23, '블록 32', { a: 'middle' });
    s += co(P.best, x(P.best[0]) - 16, y(P.best[1]) - 14, '최고 0.624', { a: 'end', color: C.accentInk, stroke: '#f0cdb8', lead: C.accentInk, w: 700 });
    s += K.callout(x(21), y(.6242), x1, y(.6242) - 21, '같은 파일 4회: 0.619~0.624', { size: 11.5, color: C.blue, stroke: C.tint2, lead: C.blue, a: 'end', dot: false });
    s += K.callout(x(P.zero[0]), yb, x(P.zero[0]) + 10, yb - 30, '평가 실패(0)', { size: 11, color: C.red, stroke: '#f3c9c3', lead: C.red, dot: false });
    s += '</g><g class="fg-m">';
    s += K.text(22, 38, '제출 57건의 점수 흐름', { size: 24, w: 700 });
    s += K.legend(22, 66, [{ k: 'dot', color: C.soft, label: '채점' }, { k: 'tick', color: C.red, label: '오류' }, { k: 'ring', color: C.blue, label: '같은 파일' }, { k: 'star', color: C.accent, label: '최고' }], { size: 18, gap: 20 });
    for (const [a, b, , lab] of phases) s += K.text((x(a) + x(b)) / 2, T - 6, lab, { size: 17.5, fill: C.muted, a: 'middle' });
    for (const v of [.4, .5, .6]) s += K.text(x0 - 9, y(v) + 6, v.toFixed(1), { size: 18, fill: C.muted, a: 'end' });
    s += K.text(x0 - 9, ey + 6, '오류', { size: 18, fill: C.red, w: 600, a: 'end' });
    for (const [d, lab] of [[0, '2/2'], [7, '2/9'], [14, '2/16'], [21, '2/23']]) s += K.text(x(d), ey + 32, lab, { size: 18, fill: C.muted, a: 'middle' });
    s += co(P.best, x(P.best[0]) + 16, y(P.best[1]) + 26, '최고 0.624', { size: 18, color: C.accentInk, stroke: '#f0cdb8', lead: C.accentInk, w: 700, padX: 10 });
    s += co(P.base, x(P.base[0]) + 12, y(.42), '베이스라인 0.47', { size: 18, padX: 10 });
    s += '</g>';
    return s + K.close();
  }

  const proxyFigure = () => (window.FIGURES && typeof window.FIGURES.exaoneProxy === 'function')
    ? fig(window.FIGURES.exaoneProxy(), '원본과 양자화 모델에 같은 문항을 주고 지표를 비교합니다. LG_proxy 는 공식 지표를 추정하려고 만든 자체 근사식입니다.')
    : '';

  window.NOTES.push({
    id: 'exaone',
    order: 10,
    title: '1.49GB를 1.37GB로 줄이기',
    summary: '레이어 30개의 민감도를 측정하고, 일부 모듈을 8비트로 남기는 GPTQ 혼합 정밀도를 적용했습니다.',
    topic: '모델',
    category: '프로젝트',
    date: '2026.01–02',
    tools: ['PyTorch', 'GPTQ (llmcompressor)', 'Transformers', 'vLLM'],
    tag: 'EXAONE 경량화',
    badge: 'LG Aimers 8기 팀 리더보드 72위',
    hero: { src: 'media/exaone/cover_voxel.jpg', alt: '1.49GB 모델이 양자화 라인을 지나 1.37GB 로 제출되는 복셀 공장 장면(생성 이미지)', caption: '모델 경량화 과정을 그린 생성 이미지입니다. 측정 그래프는 본문에 있습니다.' },
    meta: { period: '2026.01–02', role: '양자화 전략 설계, 민감도 측정, 프록시 평가기, 제출', members: '2인 (팀원은 아이디어와 문서 작성, 본인은 코딩과 검증)', env: 'L4 22GB 평가 환경' },
    points: {
      shows: '레이어 30개의 민감도를 측정하고 8비트 보호 범위를 정했습니다.',
      why: '모델 크기를 줄이면서 응답 품질을 유지할 설정을 찾고자 했습니다.',
      matters: '크기는 줄이고(1.49→1.37GB) 점수는 올렸습니다(0.596→0.624).'
    },
    summary60: [
      '점수 <b class="num">0.596 → 0.624</b>, 팀 리더보드 <b class="num">72위</b>(참가자 약 1,500명)',
      '크기 <b class="num">1.49 → 1.37GB</b>, 베이스라인 <b class="num">0.50</b>, 1위 <b class="num">0.647</b>',
      '레이어 <b class="num">30</b>개에 하나씩 4비트 모사 양자화, 평가 문항 <b class="num">98</b>개 작성',
      '제출 전 자체 평가기로 비교, NLL 증가 <b class="num">+0.15</b> 이하를 양호로',
      '제출 <b class="num">57</b>번, 평가 오류 <b class="num">17</b>번, 같은 파일 재제출 편차 <b class="num">0.005~0.009</b>'
    ],
    sections: [
      {
        id: 'compare', title: '먼저 비교한 것',
        html: '<p>LG Aimers 8기 해커톤에서 2인 팀으로 EXAONE-4.0-1.2B 를 양자화했습니다.</p>'
          + '<p>모든 Linear 모듈을 4비트로 바꾸면 점수가 떨어졌습니다. 8비트로 보호하는 모듈을 늘리면 크기가 커졌습니다. 보호할 모듈을 정하기 전에, 레이어별 양자화가 응답에 미치는 영향을 측정했습니다.</p>'
          + '<p>0번 레이어의 유사도는 0.29, 1번은 0.75였습니다. 나머지는 0.83에서 0.88 사이로 앞단보다 차이가 작았습니다.</p>'
          + '<details class="memo"><summary>측정 방법</summary>'
          + '<p>질문 98개를 직접 만들었습니다. 가전 기술 실무, LLM 경량화와 서빙, 복합 추론과 수학, 한국어 실무와 코드 최적화의 네 분야입니다. 기준 답은 K-EXAONE-236B API 로 생성한 reasoning 포함 응답입니다.</p>'
          + '<p>레이어 30개에 하나씩 4비트 min-max 모사 양자화를 적용했습니다. 가중치를 양자화했다가 복원해 반올림 오차만 남기는 방식입니다. 그 상태로 응답을 만들고, 기준 답과 ko-sroberta 임베딩의 코사인 유사도를 측정했습니다.</p>'
          + '<p>코드는 공개 레포의 src/sensitivity_analyzer.py(102줄)와 src/api_collector.py 입니다.</p>'
          + '</details>'
      },
      {
        id: 'proxy', title: '제출 전 성능을 비교하는 평가기',
        html: () => '<p>리더보드는 하루 제출 횟수가 정해져 있어 레시피를 바꿀 때마다 제출할 수 없었습니다. 그래서 같은 98문항으로 원본과 양자화 모델의 성능을 비교하는 평가기(471줄)를 만들었습니다. 평가기와 문항은 공개 레포에 넣지 않았습니다.</p>'
          + proxyFigure()
          + '<p>평가 항목은 기준 답의 NLL 증가분(delta_nll, +0.15 이하 양호, +0.30 이상 경고)과 perf_ratio, speed_gain, 수학 문항의 exact-match, ROUGE-L 다섯 가지이고, 종합값은 LG_proxy = perf_ratio × (1 + speed_gain) 입니다.</p>'
          + '<p>원본 쪽 NLL 은 캐시에 저장해 레시피를 바꿀 때 다시 계산하지 않았습니다. 기본값은 분야별 대표 문항 5개를 뽑아 돌리는 작은 집합입니다.</p>'
      },
      {
        id: 'w8', title: '어디에 8비트를 남겼나',
        html: '<p><code>down_proj</code> 와 <code>o_proj</code> 는 블록의 출력을 residual 에 더하는 자리입니다. 여기서 생긴 오차는 다음 레이어로 그대로 누적되므로 전 레이어에서 8비트로 두었습니다. <code>k_proj</code> 와 <code>v_proj</code>, <code>gate_proj</code> 는 자체 평가기로 재 봤을 때 4비트에서도 응답 품질과 속도 저하가 작아 보호에서 뺐습니다. <code>gate_proj</code> 까지 8비트로 보호한 제출은 평가 서버의 vLLM 초기화에서 오류가 나 리더보드로는 확인하지 못했습니다. <code>q_proj</code> 전 레이어와 <code>up_proj</code> 0–11번을 더 보호하는 설정은 스크립트에 변수로만 남아 있고 최고점 제출본의 양자화 셀에는 들어가지 않아 두 모듈은 4비트입니다. 이 사실은 제출 뒤 2월 21일에 파악했습니다.</p>'
          + fig(recipeChart(), '진한 색은 W8, 연한 색은 W4 입니다. embed 와 lm_head 는 격자에서 제외했습니다.')
          + '<p>GPTQ 블록 크기는 W8 128, W4 32 이고 dampening 은 0.01 입니다(0.05는 안정화 효과가 과하다고 판단해 제외했습니다). 캘리브레이션은 MANTA-1M 샘플 512개입니다(최고점 노트북 기준. 다른 시도에서는 256과 312도 썼습니다). 512개 혼합 캘리브레이션은 2월 20일 제출본에 쓰였고 평가 오류가 났습니다.</p>'
      },
      {
        id: 'submissions', title: '제출 57번의 기록',
        html: '<p>24일 동안 57번 제출했고 17번은 평가 오류로 점수를 받지 못했습니다. 보호 모듈을 늘리는 방향(gate_proj, up_proj 추가)은 번번이 이 오류에 걸렸고, dampening을 0.01로 되돌리고 W4 블록을 32로 줄이는 설정을 시험하면서 점수가 올랐습니다.</p>'
          + fig(submissionsChart(), '데이콘 제출 이력 57건을 날짜순으로 찍은 점 그래프입니다. 테두리 있는 점 네 개는 같은 파일을 다시 낸 것입니다.')
          + '<p>평가 점수의 변동 폭을 확인하려고 같은 파일을 다시 제출했습니다. 2월 3일 0.4747 은 0.4837 로, 2월 16일 최고점 0.6242 는 0.6198, 0.6194, 0.6213 으로 나왔습니다. 주최 측도 LLM 의 비결정적 실행과 평가 서버 부하에 따라 동일 제출물의 점수가 달라질 수 있다고 안내했고, 실제로 같은 파일에서 0.005~0.009의 차이가 났습니다. 0.624 와 마지막 0.619 의 차이도 그 폭 안입니다.</p>'
          + '<p>최고점의 레시피에는 up_proj 보호가 빠져 있었다는 것을 제출 뒤인 2월 21일에 알았고, 런타임이 바뀐 뒤에는 같은 코드가 0.596 모델을 만들어 최고점을 재현하지 못했습니다.</p>'
          + '<p>이후 실험에서 보완할 점을 정리했습니다. 같은 파일을 재제출해 점수 변동 폭을 확인하고, 좋은 결과가 나오면 레시피와 실행 환경을 함께 보존해야 합니다. 보호 범위를 넓히기 전에는 모델 크기와 메모리 상한을 확인해야 합니다. 로컬 프록시(perf_ratio 0.9977)와 리더보드(0.596)의 차이는 자체 평가 지표가 실제 평가를 얼마나 반영하는지 다시 검토할 근거로 남겼습니다. 반복 측정의 필요성은 <a href="#note/quoridor">쿼리도 승률</a>에서도 확인했습니다.</p>'
      },
      {
        id: 'result', title: '최고점 제출 결과',
        html: '<table><thead><tr><th>지표</th><th>베이스라인</th><th>이전 전략</th><th>최고점 제출</th></tr></thead><tbody>'
          + '<tr><td>평가 점수</td><td>0.50</td><td>0.596</td><td>0.62422</td></tr>'
          + '<tr><td>모델 크기</td><td>—</td><td>1.49GB</td><td>1.37GB</td></tr>'
          + '<tr><td>팀 리더보드</td><td>—</td><td>—</td><td>72위</td></tr>'
          + '</tbody></table>'
          + '<p>베이스라인은 대회가 제공한 Linear 전체 W4A16 GPTQ 이고, 1위 점수는 0.647 이었습니다. 참가자는 약 1,500명입니다. 평가 환경은 L4 22GB 이며, 제출 파일은 10GB 이하, 추론 시간은 20분 이내여야 했습니다.</p>'
          + '<p>같은 시기 임베디드 AI 수업의 Jetson Nano 팀 프로젝트(이미지 분류 모델)에서는 FP16 변환으로 파일이 44.6MB 에서 22.3MB 로 절반이 됐지만 FPS 는 12.84 에서 9~10 으로 떨어졌고, 비구조적 프루닝은 FLOPs 3.65G 를 줄이지 못했습니다. 파일 크기가 줄어도 해당 기기에서 추론이 빨라지지는 않았습니다.</p>'
          + '<p>비교하지 않은 것은 AWQ 와 SmoothQuant 이고, 민감도는 레이어당 10샘플로 측정한 경향값입니다. 다음 실험에서는 레이어별 비트 할당을 자동으로 탐색할 계획입니다.</p>'
      }
    ],
    gaps: 'AWQ 와 SmoothQuant 는 비교하지 않았습니다. 민감도는 레이어당 10샘플로 측정한 경향값이고, 유사도가 0.29 로 가장 낮았던 0번 레이어를 따로 더 보호하지는 못했습니다. 최고점 0.624 의 레시피는 런타임이 바뀐 뒤 재현하지 못했습니다. 다음 실험에서는 레이어별 비트 할당을 자동으로 탐색할 계획입니다.',
    evidence: [{ label: '대회 전 사전 실험 레포(GitHub)', href: REPO }, { label: '팀 리더보드 72위 캡처', href: 'media/evidence/aimers_leaderboard.jpg' }, { label: '수료증', href: 'media/evidence/aimers_certificate.png' }],
    thumb: { src: 'media/exaone/cover_voxel.jpg', alt: '모델 경량화 복셀 장면(생성 이미지)' }
  });
})();
