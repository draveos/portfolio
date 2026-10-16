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
    /* 2026-10-16: PDF 판 배치. 점 옆 라벨 대신 그래프 아래 값 표. 모바일 층은 그래프만. */
    const K = window.FIGKIT, C = K.C, W = 760, H = 494, X = r => 88 + (r - 5) * 68, Y = v => 328 - v / 70 * 218, pct = p => 100 * p.w / p.g;
    let s = K.open(W, H, { label: '회차별 Office 승률과 각 상대의 승수 및 대국 수. 새 Codex 상대는 9회차 0/20 에서 11회차 21/40, 12회차 18/40, 13회차 0/20, 14회차 9/20. 구 Codex 상대는 6회차 1/10, 9회차 4/20, 11회차 0/40, 13회차 9/20.', marker: 'quoridor-win' });
    for (const v of [0, 20, 40, 60]) s += K.line(88, Y(v), 700, Y(v), { stroke: C.grid });
    s += K.line(88, Y(70), 700, Y(70), { dash: '4 5', stroke: C.gray });
    for (const [pts, color, dashed] of [[OLD, C.gray, true], [NEW, C.blue, false]]) {
      s += `<polyline points="${pts.map(p => X(p.r) + ',' + Y(pct(p))).join(' ')}" fill="none" stroke="${color}" stroke-width="2.5" ${dashed ? 'stroke-dasharray="6 5"' : ''} stroke-linejoin="round"/>`;
      pts.forEach(p => { s += `<g><title>${p.r}회차 ${dashed ? '구' : '새'} Codex 상대 ${p.w}승 / ${p.g}판 (${Math.round(pct(p))}%)</title>${K.circle(X(p.r), Y(pct(p)), 4.7, { fill: color, stroke: '#fff', sw: 1.5 })}</g>`; });
    }
    s += '<g class="fg-w">' + K.head('회차별 Office 승률', '같은 상대와 둔 결과만 선으로 연결했습니다.', { x: 24, y: 35, size: 20, subSize: 14, gap: 23 });
    s += K.legend(24, 84, [{ k: 'line', color: C.blue, label: '새 Codex 상대' }, { k: 'dot-dash', color: C.gray, label: '구 Codex 상대' }], { size: 14, gap: 34 });
    for (const v of [0, 20, 40, 60]) s += K.text(74, Y(v) + 5, v + '%', { size: 14, fill: C.muted, a: 'end' });
    s += K.text(700, Y(70) - 10, '목표 7/10', { size: 14, fill: C.muted, a: 'end' });
    s += K.text(24, 373, '회차', { size: 14, fill: C.muted });
    for (let r = 5; r <= 14; r++) s += K.text(X(r), 373, r, { size: 14, fill: C.muted, a: 'middle' });
    s += K.line(24, 386, 727, 386, { stroke: C.axis });
    for (const [pts, y, label, color] of [[NEW, 415, '새 상대', C.blue], [OLD, 450, '구 상대', C.muted]]) { s += K.text(24, y, label, { size: 13, fill: color }); for (let r = 5; r <= 14; r++) { const p = pts.find(q => q.r === r); s += K.text(X(r), y, p ? `${p.w}/${p.g}` : '—', { size: 13.5, fill: color, a: 'middle' }); } }
    s += K.text(727, 479, '표의 값은 승수 / 대국 수', { size: 13, fill: C.muted, a: 'end' });
    s += '</g><g class="fg-m">' + K.text(24, 40, '회차별 Office 승률', { size: 24, w: 700 });
    s += K.legend(24, 78, [{ k: 'line', color: C.blue, label: '새 Codex' }, { k: 'dot-dash', color: C.gray, label: '구 Codex' }], { size: 17.5, gap: 22 });
    for (const v of [0, 40]) s += K.text(74, Y(v) + 6, v + '%', { size: 17.5, fill: C.muted, a: 'end' });
    for (const r of [5, 9, 14]) s += K.text(r === 14 ? X(r) + 10 : X(r), 376, r + '회차', { size: 17.5, fill: C.muted, a: r === 14 ? 'end' : 'middle' });
    s += K.text(700, Y(70) - 12, '목표 7/10', { size: 17, fill: C.muted, a: 'end' });
    s += K.text(24, 440, '11회차 21/40, 12회차 18/40(설치본), 14회차 9/20', { size: 17, fill: C.blue });
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
      { id: 'made', title: '무엇을 만들었나', html: `<p>쿼리도는 9×9 판에서 말을 반대편 줄에 먼저 닿게 하면 이기는 보드게임입니다. 각자 울타리 10장으로 상대의 길을 늘릴 수 있지만, 완전히 막는 것은 반칙입니다.</p><p>규칙 엔진은 대학 휴리스틱 수업에서 하던 프로젝트에서 영감을 받아 만들었습니다. pyquoridor 0.0.5 패키지를 감싼 래퍼이고, 에이전트는 정해진 시간 안에 이동 또는 울타리 하나를 돌려주면 됩니다. 서버는 표준 라이브러리 http.server로 구동합니다. 브라우저에서는 Three.js 복셀 화면으로 대국을 관전하거나 직접 플레이할 수 있습니다.</p><p>에이전트는 직접 만든 파일 28개(실험용과 뼈대 포함)에, <a href="#note/office">Agent Office</a> 의 전략 회의가 14회차에 걸쳐 고친 office 계열 9개와 GPT 가 쓴 codex 2개를 더했습니다. 회의에서는 패배한 대국을 다시 실행하고, 패배 유형 하나씩을 골라 대응 전략을 수정했습니다.</p>` },
      { id: 'noise', title: '승률이 흔들린 이유와 20판 규약', html: `<p>8회차에서 같은 시드 10판(선후공 교대)을 네 번 반복했더니 4승, 0승, 3승, 1승이 나왔습니다. 양쪽 모두 시간 제한 안에서 탐색하므로 CPU 부하에 따라 탐색 깊이가 달라질 수 있습니다. 다만 부하만을 바꿔 원인을 분리한 실험은 하지 않았습니다. 한 번 측정한 승률만으로 회차 사이의 개선을 판단하기는 어려웠습니다.</p><table><thead><tr><th>항목</th><th>규약</th></tr></thead><tbody><tr><td>판 수</td><td>20판, 시드 고정, 선후공 교대</td></tr><tr><td>동시 실행</td><td>2 (PAIR_JOBS=2)</td></tr><tr><td>수당 시간</td><td>1.0초</td></tr><tr><td>기존 성능 유지 조건</td><td>greedy 전승, killer 1승 이상, 반칙 0, 이전 설치본 이상일 때만 아레나에 설치</td></tr><tr><td>비교</td><td>같은 조건의 숫자끼리만</td></tr></tbody></table><p>40판으로 적은 결과는 같은 규약으로 실행한 20판 두 세트를 합산한 것입니다. 13회차와 14회차는 각각 20판 한 세트입니다.</p><p>구 Codex를 상대로 8회차 코드를 20판씩 다시 평가하니 0/20과 1/20이었습니다. 앞서 나온 4승과 3승에도 CPU 부하가 영향을 줬을 가능성을 의심했습니다.</p><p>비슷한 점수 변동을 <a href="#note/exaone">EXAONE 리더보드</a>에서도 확인했습니다. 같은 파일을 반복 제출해 두 파일에서 각각 약 0.005와 0.009의 점수 폭을 관측했습니다.</p>` },
      { id: 'rounds', title: '14회차 결과 그래프', html: `<p>상대는 GPT 가 쓴 에이전트 codex 의 두 버전입니다. 10일 새벽에 새 버전이 들어와 9회차부터 각 버전을 상대로 승률을 측정했습니다. 11회차는 새 Codex 상대 21/40 으로 가장 높았지만, 같은 코드가 구 Codex 상대로는 0/40 이었습니다. 18/40을 기록한 12회차 버전을 아레나에 설치했습니다.</p>${fig(winChart(), 'Codex 두 버전을 상대로 측정한 Office 의 승률입니다. 승수와 대국 수는 그래프 아래 표에 있고, 선은 같은 상대의 측정값끼리만 연결했습니다. 8회차 구 Codex 값은 10판 4회(4, 0, 3, 1승)의 합산이고, 4회차 이전은 Codex 대국이 2판 이하라 뺐습니다. 8회차 값은 규약 전 측정이라 규약으로 다시 재면 0~1/20 이었습니다.')}<p>13회차는 거꾸로 새 상대 0/20, 구 상대 9/20 이었습니다. 한 상대에 맞춰 전략을 수정하면 다른 상대에게 약해지는 결과가 나왔습니다. 14회차에 상대 유형 분기를 넣었지만 9/20 과 0/20 으로 끝났고, 목표 7/10 에 못 미친 채 중단했습니다.</p>` },
      { id: 'play', title: '직접 두어 보기', html: `${demoBlock({ src: 'https://draveos.github.io/Quoridor-Agents/', poster: 'media/quoridor/cover_arena.jpg', title: 'Quoridor Agents', autoplay: true, caption: 'Codex 와 Claude 에이전트 중 하나를 골라 둡니다. 데스크톱은 3D 복셀 판이고 드래그로 돌릴 수 있습니다. 전체 화면은 위의 직접 두어 보기 버튼으로 엽니다.', height: 760 })}<p>상대는 위 그래프의 새 Codex 입니다. 81칸 벽 그래프 위에서 반복 심화 negamax 로 두고, 기록한 대국에서는 탐색 에이전트 greedy와 killer를 상대로 패배하지 않았습니다. 공개 데모는 Python 에이전트를 JavaScript로 옮긴 버전이므로, 위 측정 환경의 성적을 그대로 보장하지는 않습니다. 말은 상하좌우 한 칸씩 가고, 상대가 붙어 있으면 뛰어넘습니다. 울타리는 두 칸 길이이며 상대 길을 완전히 막을 수 없습니다.</p>` }
    ],
    gaps: '목표 7/10에는 못 미쳤습니다. 14회차에 추가한 상대 유형 분기는 구 Codex 상대의 성적을 개선하지 못했고, 실제로 발동했는지도 로그로 확인하지 못했습니다. 단일 에이전트는 한 세션에서 실행과 수정을 반복해 비슷한 수준의 결과를 냈습니다. 다음에는 시간 대신 탐색 노드 수를 고정해 부하의 영향을 줄이고, 기준 상대 둘 모두 이전 성적 이상일 때만 설치할 계획입니다.',
    thumb: { src: 'media/quoridor/cover_arena.jpg', alt: '복셀 쿼리도 판(생성 이미지)' }
  });
})();
