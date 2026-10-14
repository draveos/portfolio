/* 노트: Flora(디지털 컴패니언). 이 파일만 고치면 됩니다. 계약은 notes/README.md 참고.
   헬퍼(fig, esc, todo, demoBlock, comparison, assets)는 app.js 가 먼저 정의합니다.
   그림은 전부 이 파일 안에서 그린 SVG 와 figures/floraTurn.js 입니다. 화면 목업의 문장은 데모용 예시이며 실제 대화가 아닙니다.
   캡처 2장(media/flora/)은 2026-10-14 에 별도 DB(COMPANION_DB_PATH)와 포트로 띄운 데모 백엔드에서 찍었습니다(개인 대화 없음).
   웹은 Playwright 1440×900 jpg 품질 82, TUI 는 Textual 파일럿 120컬럼 SVG 를 같은 품질의 jpg 로 바꾼 것입니다. 메뉴바 알림 캡처는 아직 없습니다. */
(function () {
  const C = { bg: '#f8f9fc', ink: '#202630', muted: '#77808d', line: '#e9ecf0', soft: '#eef1fb', wire: '#9aa6bb', dark: '#262c3a', darkInk: '#d8deea', darkMuted: '#8a94a8', accent: '#4c62c4', accentSoft: '#eef1fb', num: '#a4b7df' }; /* 2026-10-14: node-style 토큰에 맞춤(보라 강조 → 주색) */
  const FONT = 'font-family="Pretendard, Apple SD Gothic Neo, sans-serif"';
  const txt = (x, y, s, size, fill, o = {}) => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}"${o.w ? ` font-weight="${o.w}"` : ''}${o.a ? ` text-anchor="${o.a}"` : ''}${o.mono ? ' font-family="Menlo, monospace"' : ''}>${s}</text>`;
  const box = (x, y, w, h, fill, stroke, rx = 10) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"${stroke ? ` stroke="${stroke}"` : ''}/>`;
  const gauge = (x, y, w, pct, track, fill) => `<rect x="${x}" y="${y}" width="${w}" height="6" rx="3" fill="${track}"/><rect x="${x}" y="${y}" width="${Math.round(w * pct)}" height="6" rx="3" fill="${fill}"/>`;
  const arrow = (d, id) => `<path d="${d}" stroke="${C.wire}" stroke-width="2" fill="none" marker-end="url(#${id})"/>`;
  const marker = id => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 8 5 L 0 9" fill="none" stroke="#9aacc5" stroke-width="1.5"/></marker></defs>`;

  /* 그림 1. 세 화면 목업과 하나의 백엔드 (16:9, 히어로) */
  function surfacesMock() {
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-label="터미널 TUI, macOS 메뉴바, 웹 세 화면이 FastAPI 백엔드 하나와 SQLite 에 이어진 목업. 웹과 TUI 는 SSE 를 읽고 메뉴바 앱은 웹 UI 를 띄웁니다" ${FONT}><title>세 화면, 하나의 백엔드</title>${marker('flora-mock-arrow')}`;
    s += box(0, 0, 1200, 675, C.bg, null, 20);
    s += txt(28, 40, '세 화면을 같은 백엔드에 연결하기', 24, C.ink, { w: 600 }) + txt(28, 64, '화면 속 문장은 데모용 예시입니다', 14, C.muted);

    /* A. 터미널 TUI */
    const ax = 20, ay = 90, aw = 440, ah = 390; /* TUI 폭 440: 대화 15px 문장이 분할선(ax+282) 안에 들어온다 */
    s += box(ax, ay, aw, ah, C.dark, null, 14);
    s += `<circle cx="${ax + 18}" cy="${ay + 16}" r="5" fill="#5c6478"/><circle cx="${ax + 34}" cy="${ay + 16}" r="5" fill="#5c6478"/><circle cx="${ax + 50}" cy="${ay + 16}" r="5" fill="#5c6478"/>`;
    s += txt(ax + aw / 2, ay + 21, 'flora', 13, C.darkMuted, { a: 'middle', mono: true });
    s += `<line x1="${ax}" y1="${ay + 32}" x2="${ax + aw}" y2="${ay + 32}" stroke="#3a4253"/>`;
    const split = ax + 282;
    s += `<line x1="${split}" y1="${ay + 32}" x2="${split}" y2="${ay + ah}" stroke="#3a4253"/>`;
    const chat = [['you', '오늘은 일찍 끝났어'], ['flora', '그럼 저녁에 산책 어때?'], ['', '지난주에 가고 싶다고 했잖아'], ['you', '어, 그 공원?'], ['flora', '응. 다녀오면 얘기해 줘']];
    chat.forEach((l, i) => { const y = ay + 62 + i * 30; s += txt(ax + 16, y, l[0], 13, l[0] === 'you' ? '#9fb3d8' : '#b7a3cf', { mono: true }) + txt(ax + 66, y, l[1], 15, C.darkInk); });
    s += txt(ax + 16, ay + ah - 18, '› _', 15, C.darkMuted, { mono: true });
    const mx = split + 14;
    s += txt(mx, ay + 56, 'MODEL  main / small', 11, C.darkMuted, { mono: true });
    s += txt(mx, ay + 86, 'EGO', 11, C.darkMuted, { mono: true });
    [['mood', .72], ['energy', .55], ['affinity', .84]].forEach((g, i) => { const y = ay + 98 + i * 22; s += txt(mx, y + 6, g[0], 11, C.darkInk, { mono: true }) + gauge(mx + 58, y, 78, g[1], '#3a4253', '#9fb3d8'); });
    s += txt(mx, ay + 182, 'PIPELINE', 11, C.darkMuted, { mono: true });
    ['회수 ✓', '상태 ✓', '생성 ▸', '검증', '저장'].forEach((p, i) => s += txt(mx, ay + 204 + i * 20, p, 12, i < 3 ? C.darkInk : '#5c6478', { mono: true }));
    s += txt(mx, ay + 320, 'RETRIEVED 3', 11, C.darkMuted, { mono: true });
    ['산책 가고 싶다 (3일 전)', '퇴근 후 루틴', '프로필 2건'].forEach((p, i) => s += txt(mx, ay + 340 + i * 18, p, 11, C.darkInk));
    s += txt(ax + 16, ay + ah + 22, '터미널 TUI (Textual)', 14, C.ink, { w: 600 });

    /* B. macOS 메뉴바 */
    const bx = 480, by = 90, bw = 300, bh = 390;
    s += box(bx, by, bw, bh, '#ffffff', C.line, 14);
    s += box(bx, by, bw, 28, '#eef1f7', null, 14) + box(bx, by + 14, bw, 14, '#eef1f7', null, 0);
    s += txt(bx + 16, by + 19, 'Finder   파일   편집   보기', 11, '#5f6b80');
    s += `<circle cx="${bx + bw - 74}" cy="${by + 14}" r="6" fill="${C.accent}"/>` + txt(bx + bw - 14, by + 18, '21:40', 11, '#5f6b80', { a: 'end', mono: true });
    s += box(bx + bw - 158, by + 34, 144, 92, '#ffffff', C.line, 8);
    s += box(bx + bw - 144, by + 44, 116, 22, C.soft, null, 5) + txt(bx + bw - 136, by + 58, 'Open Flora', 13, C.ink, { w: 600 });
    ['Pause', 'Quit'].forEach((m, i) => s += txt(bx + bw - 144, by + 86 + i * 28, m, 13, '#6b7790'));
    s += box(bx + 16, by + 150, bw - 32, 64, '#ffffff', C.line, 10) + `<rect x="${bx + 16}" y="${by + 150}" width="4" height="64" rx="2" fill="${C.accent}"/>`;
    s += `<circle cx="${bx + 42}" cy="${by + 182}" r="12" fill="${C.accentSoft}" stroke="${C.accent}"/>`;
    s += txt(bx + 64, by + 176, 'Flora', 13, C.ink, { w: 600 }) + txt(bx + 64, by + 198, '먼저 말을 걸었어요', 13, '#6b7790');
    s += txt(bx + bw - 28, by + 176, '지금', 10, C.num, { a: 'end' });
    s += box(bx + 16, by + 240, bw - 32, 118, C.bg, C.line, 10) + txt(bx + bw / 2, by + 290, '클릭하면 웹 UI 창', 13, C.muted, { a: 'middle' }) + txt(bx + bw / 2, by + 312, '알림 본문은 고정 문구', 11, C.num, { a: 'middle' });
    s += txt(bx + 16, by + bh + 22, 'macOS 메뉴바 앱 (SwiftUI)', 14, C.ink, { w: 600 });

    /* C. 웹 */
    const cx = 800, cy = 90, cw = 400, ch = 390;
    s += box(cx, cy, cw, ch, '#ffffff', C.line, 14);
    s += `<line x1="${cx}" y1="${cy + 36}" x2="${cx + cw}" y2="${cy + 36}" stroke="${C.line}"/>`;
    s += txt(cx + 18, cy + 24, 'Flora', 14, C.ink, { w: 600 });
    s += box(cx + cw - 150, cy + 8, 136, 20, C.bg, C.line, 10) + txt(cx + cw - 118, cy + 22, 'companion', 10, C.muted) + txt(cx + cw - 52, cy + 22, 'debug', 10, C.ink, { w: 600 });
    const wsplit = cx + 212; /* 웹 패널 400폭: 오른쪽 패널 요소가 1200 안에 들어오게 */
    s += `<line x1="${wsplit}" y1="${cy + 36}" x2="${wsplit}" y2="${cy + ch}" stroke="${C.line}"/>`;
    const bubbles = [['u', '오늘은 일찍 끝났어'], ['f', '그럼 저녁에 산책 어때?'], ['f', '지난주에 가고 싶다고 했잖아'], ['u', '어, 그 공원?']];
    bubbles.forEach((b, i) => { const y = cy + 54 + i * 44, w = 150 + b[1].length * 2, x = b[0] === 'u' ? wsplit - 16 - w : cx + 16; s += box(x, y, w, 32, b[0] === 'u' ? C.soft : C.bg, b[0] === 'u' ? null : C.line, 10) + txt(x + 12, y + 21, b[1], 13, C.ink); });
    s += box(cx + 16, cy + ch - 46, wsplit - cx - 32, 30, '#ffffff', C.line, 8) + txt(cx + 28, cy + ch - 26, '메시지를 입력하세요', 12, C.num);
    const px = wsplit + 14;
    s += txt(px, cy + 58, 'THINKING PANEL', 10, C.num, { mono: true });
    [['mood', .72], ['energy', .55], ['affinity', .84]].forEach((g, i) => { const y = cy + 72 + i * 22; s += txt(px, y + 6, g[0], 11, C.ink, { mono: true }) + gauge(px + 60, y, 88, g[1], C.soft, C.accent); });
    s += txt(px, cy + 156, 'PIPELINE', 10, C.num, { mono: true });
    ['회수', '상태', '생성', '검증', '저장'].forEach((p, i) => { const x = px + i * 31; s += box(x, cy + 166, 28, 20, i === 2 ? C.accent : (i < 2 ? C.soft : '#ffffff'), i >= 3 ? C.line : null, 5) + txt(x + 14, cy + 180, p, 10, i === 2 ? '#ffffff' : C.ink, { a: 'middle' }); });
    s += txt(px, cy + 214, 'MEMORY 3', 10, C.num, { mono: true });
    ['산책 가고 싶다', '퇴근 후 루틴', '프로필 2건'].forEach((p, i) => s += box(px, cy + 224 + i * 26, 150, 20, C.bg, C.line, 5) + txt(px + 8, cy + 238 + i * 26, p, 11, C.ink));
    s += txt(px, cy + 320, 'METACOG', 10, C.num, { mono: true }) + txt(px + 70, cy + 320, '통과', 11, '#518578', { w: 600 });
    s += txt(px, cy + 344, 'STORED', 10, C.num, { mono: true }) + txt(px + 70, cy + 344, '기억에 남음', 11, C.ink);
    s += txt(cx + 16, cy + ch + 22, '웹 (Next.js)', 14, C.ink, { w: 600 });

    /* 와이어와 백엔드 */
    const wy = 540;
    const wa = ax + aw / 2, wb = bx + bw / 2, wc = cx + cw / 2;
    s += `<line x1="${wa}" y1="${wy}" x2="${wc}" y2="${wy}" stroke="${C.wire}" stroke-width="2"/>`;
    [wa, wb, wc].forEach(x => s += `<line x1="${x}" y1="${ay + ah + 32}" x2="${x}" y2="${wy}" stroke="${C.wire}" stroke-width="2"/><circle cx="${x}" cy="${wy}" r="5" fill="${C.wire}"/>`);
    const wm = (wa + wb) / 2;
    s += txt(wm, wy - 24, 'SSE 이벤트 12종을 그대로 읽습니다.', 13, C.muted, { a: 'middle' }) + txt(wm, wy - 8, '화면은 상태를 계산하지 않습니다', 13, C.muted, { a: 'middle' });
    s += arrow(`M${wb} ${wy}V${wy + 32}`, 'flora-mock-arrow');
    s += box(wb - 150, wy + 34, 300, 60, C.soft, C.line, 12) + txt(wb, wy + 60, 'FastAPI 백엔드', 18, C.ink, { w: 600, a: 'middle' }) + txt(wb, wy + 80, '기억, 상태, 생성, 검증', 11, C.muted, { a: 'middle' });
    s += arrow(`M${wb + 150} ${wy + 64}H${wb + 210}`, 'flora-mock-arrow');
    s += box(wb + 210, wy + 34, 250, 60, '#ffffff', C.line, 12) + txt(wb + 335, wy + 60, 'SQLite 파일 하나', 16, C.ink, { w: 600, a: 'middle' }) + txt(wb + 335, wy + 80, '기억 3,697행, 로컬 임베딩', 11, C.muted, { a: 'middle' });
    return s + '</svg>';
  }

  /* 그림 2. 기억 4계층 (FIGKIT 기준 재작성, 2026-10-14) */
  function memoryTiers() {
    const K = window.FIGKIT, P = K.C, MK = 'flora-mem';
    const tiers = [
      ['01', '단기 창', '최근 대화를 전달해 지시어를 해석합니다', '최근 턴'],
      ['02', '에피소드', '대화 원문을 저장합니다. 오래된 기억은 신뢰도를 낮춥니다', '대화 그대로'],
      ['03', '핵심 사실', '반복되는 대화를 한 문장으로 요약해 저장합니다', '반복되면 요약'],
      ['04', '프로필', '이름과 관심사 같은 사실. 감쇠 없이 영구 보존, 항상 프롬프트에 포함', '영구 보존']
    ];
    const notes = [
      ['회수', ['벡터 검색과 키워드 검색의 순위를 합칩니다.', '최근 기억에 가중치를 더합니다.', '같은 본문은 하나로 합칩니다.']],
      ['승격', ['턴 직후 비동기로 요약합니다. 대화를 쉬면', '미처 처리하지 못한 기억을 정리합니다.', '요약에 실패해도 대화는 계속됩니다.']],
      ['저장소', ['SQLite 파일 하나와 벡터 테이블.', '임베딩은 로컬 모델이라', '외부 임베딩 API 가 없습니다.']]
    ];
    let s = K.open(1200, 560, { label: '단기 창, 에피소드, 핵심 사실, 프로필 네 층과 회수, 승격, 감쇠의 관계', title: '기억 4계층', marker: MK, rx: 20 });
    /* 데스크톱 */
    s += '<g class="fg-w">' + K.head('기억 4계층', '레코드 하나는 본문, 시각, 중요도, 태그. 아래 층으로 갈수록 오래 남습니다', { size: 22, subSize: 15, x: 40, y: 48, gap: 26 });
    const tx = 72, tw = 668, th = 76;
    tiers.forEach(([n, t, d], i) => { const y = 106 + i * 92, hl = i === 3; s += K.rect(tx, y, tw, th, { rx: 12, fill: hl ? P.blue : i === 2 ? P.tint : '#fff', stroke: hl ? P.blue : P.box, sw: 1.5 }); s += K.circle(tx + 22, y + 22, 13, { fill: hl ? '#fff' : P.tint }) + K.text(tx + 22, y + 27, n, { size: 14, w: 700, fill: P.blue, a: 'middle', cls: 'fg-n' }); s += K.text(tx + 48, y + 33, t, { size: 20, w: 700, fill: hl ? '#fff' : P.ink }) + K.text(tx + 48, y + 59, d, { size: 15, fill: hl ? '#e3e9f8' : P.muted }); });
    s += K.path('M48 140V452', { marker: MK, sw: 1.5 }) + K.text(48, 480, '오래 남음', { size: 14.5, fill: P.muted, a: 'middle' });
    /* 에피소드 상자의 감쇠, 승격 배지와 승격 화살표 */
    s += K.pill(tx + tw - 18, 198 + 22, '감쇠', { size: 14.5, fill: P.accent, stroke: P.accent, color: '#fff', a: 'end', padX: 12 });
    s += K.pill(tx + tw - 18, 198 + 54, '승격', { size: 14.5, fill: P.blue, stroke: P.blue, color: '#fff', a: 'end', padX: 12 });
    s += K.path(`M${tx + tw} 252H${tx + tw + 24}V310H${tx + tw + 2}`, { marker: MK, sw: 1.5 });
    notes.forEach(([t, lines], i) => { const x = 790, y = 106 + i * 124, w = 370, h = 108; s += K.rect(x, y, w, h, { rx: 12, fill: '#fff', stroke: P.box, sw: 1.5 }); s += K.text(x + 20, y + 29, t, { size: 16, w: 700 }); lines.forEach((l, k) => s += K.text(x + 20, y + 53 + k * 20, l, { size: 14.5, fill: P.muted })); });
    s += '</g>';
    /* 모바일: 네 층을 넓게, 짧은 꼬리표만 */
    s += '<g class="fg-m">' + K.text(40, 54, '기억 4계층', { size: 32, w: 700 }) + K.text(40, 92, '아래로 갈수록 오래 남음', { size: 31, fill: P.muted });
    tiers.forEach(([n, t, , tag], i) => { const y = 120 + i * 108, hl = i === 3; s += K.node(40, y, 1120, 88, { n: n, t: '', hl, size: 31, br: 22, rx: 16, fill: i === 2 ? P.tint : undefined }); s += K.text(100, y + 55, t, { size: 31, w: 700, fill: hl ? '#fff' : P.ink }) + K.text(1130, y + 55, tag, { size: 31, fill: hl ? '#e3e9f8' : P.muted, a: 'end' }); });
    s += '</g>';
    return s + K.close();
  }

  /* 목록 카드용 작은 그림 */
  function floraThumb() {
    return `<svg viewBox="0 0 160 100" aria-hidden="true"><rect x="10" y="14" width="40" height="30" rx="4" fill="#3b4255"/><rect x="60" y="14" width="40" height="30" rx="4" fill="#fff" stroke="#c9b9d6"/><rect x="110" y="14" width="40" height="30" rx="4" fill="#fff" stroke="#c9b9d6"/><g stroke="#a28ab6" fill="none"><path d="M30 44v18M80 44v18M130 44v18M30 62h100"/><path d="M80 62v10"/></g><rect x="50" y="72" width="60" height="18" rx="4" fill="#e7dfef" stroke="#a28ab6"/><g fill="#d8deea"><rect x="15" y="21" width="22" height="3" rx="1"/><rect x="15" y="28" width="16" height="3" rx="1"/><rect x="15" y="35" width="26" height="3" rx="1"/></g><g fill="#e7dfef"><rect x="66" y="21" width="28" height="3" rx="1"/><rect x="66" y="28" width="20" height="3" rx="1"/><rect x="116" y="21" width="28" height="3" rx="1"/><rect x="116" y="28" width="20" height="3" rx="1"/><rect x="116" y="35" width="26" height="3" rx="1"/></g></svg>`;
  }

  window.NOTES.push({
    id: 'flora',
    order: 35,
    title: '기억하고 먼저 말을 거는 컴패니언 Flora',
    summary: '터미널, 메뉴바, 웹이 같은 기억과 상태를 읽는 개인 컴패니언을 혼자 만들었습니다.',
    topic: '에이전트',
    category: '프로젝트',
    date: '2026.04–08',
    tools: ['FastAPI', 'Next.js', 'SwiftUI', 'Textual', 'SQLite'],
    tag: 'Flora',
    badge: '개인 프로젝트, 1인 개발',
    hero: { src: 'media/flora/cover_voxel.jpg', alt: '대화 말풍선과 기억 그래프를 함께 그린 Flora 이미지(생성 이미지)', caption: 'Flora 의 기억 구조를 그린 생성 이미지입니다. 실제 화면은 아래 캡처에 있습니다.' },
    shots: [
      { src: 'media/flora/chat_reaction.jpg', alt: 'Flora 웹 채팅 화면. 사용자 말풍선에 반응 이모지와 답장', caption: 'Flora 웹 채팅. 사용자 메시지에 반응 이모지가 먼저 붙고, 답장이 이어집니다.' },
      { src: 'media/flora/web_thinking.jpg', alt: '웹 화면. 왼쪽에 대화 두 턴, 오른쪽 Thinking Panel 에 상태 3축 게이지, 파이프라인 단계, 기억 그래프, 회수 기억 5건, 메타인지 검증 PASS', caption: '웹 화면(1440×900). 오른쪽 Thinking Panel 이 상태 3축, 파이프라인 단계, 기억 그래프, 회수 기억 5건, 메타인지 검증 결과를 보여줍니다. 별도 데모 DB 로 나눈 대화입니다.' },
      { src: 'media/flora/tui_two_pane.jpg', alt: '터미널 TUI 2단 화면. 왼쪽 대화, 오른쪽 메타 패널에 모델 이름, 상태 게이지, 파이프라인, 회수 기억 5건, 메타인지 PASS', caption: '터미널 TUI(120컬럼). 같은 SSE 이벤트를 읽어 오른쪽 메타 패널에 모델, 상태 게이지, 회수 기억, 검증 결과를 그립니다. 웹에서 나눈 대화가 다시 불러와집니다.' }
    ],
    meta: { period: '2026.04–08', role: '백엔드, 웹, CLI, macOS 앱 설계와 구현', members: '1인', contribution: '100%', env: '로컬 macOS, SQLite 파일 하나' },
    points: {
      shows: '대화 기억과 감정 상태를 관리하는 백엔드에 웹, 터미널, 메뉴바 앱을 연결했습니다.',
      why: '화면이나 모델을 바꿔도 같은 기억과 상태를 유지하도록 설계했습니다.',
      matters: '4개월 동안 실제 대화에서 발견한 오류를 수정하고, 회귀 테스트로 같은 문제가 반복되는지 확인했습니다.'
    },
    summary60: [
      '2026.04–08, <b class="num">295</b>개의 커밋을 남겼습니다',
      '화면 <b class="num">3</b>개가 같은 백엔드의 SSE 이벤트를 사용합니다',
      '백엔드 테스트 <b class="num">914</b>개, pytest 수집 기준',
      '기억 <b class="num">4</b>계층, 운영 DB <b class="num">3,697</b>행',
      '실제 대화에서 발견한 오류 <b class="num">4</b>건의 원인을 찾아 수정했습니다'
    ],
    sections: [
      { id: 'surfaces', title: '세 화면을 같은 백엔드에 연결하기', html: `<p>Flora는 한 사람을 위한 디지털 컴패니언입니다. 백엔드는 FastAPI로 만들었고, 대화 한 턴의 내부 단계를 SSE 이벤트 12종으로 전달합니다. 웹(Next.js)과 터미널 TUI(Textual)는 이 이벤트를 받아 화면을 갱신하고, macOS 메뉴바 앱(SwiftUI)은 웹 UI를 창으로 띄웁니다. 어느 화면도 상태를 따로 계산하지 않습니다.</p><p>그래서 웹의 Thinking Panel과 터미널의 메타 패널이 같은 단계, 같은 회수 기억, 같은 검증 결과를 보여줍니다. 메뉴바 앱은 선톡 엔드포인트를 주기적으로 확인해 Flora가 먼저 말을 걸면 macOS 알림을 띄웁니다. 알림 본문은 고정 문구라 발화 내용이 밖으로 새지 않습니다.</p><p>개발은 디렉터리별 에이전트에 나눠 맡기고, 계약 문서와 공유 타입 정의를 공통 기준으로 삼았습니다. 결정 사항은 기존 내용을 덮어쓰지 않는 기록 파일에 추가했습니다.</p>` },
      { id: 'memory', title: '기억을 어떻게 저장하나', html: `<p>대화 원문, 반복해서 확인된 사실, 사용자 프로필을 구분해 저장했습니다. 오래된 대화는 삭제하는 대신 신뢰도를 낮춥니다. 레코드 하나는 본문, 시각, 중요도, 태그로 이루어지고 네 층으로 나뉩니다.</p>${fig(memoryTiers(), '네 층과 회수, 승격, 감쇠의 관계. 수치와 조건은 생략했습니다.')}<p>프로필은 이름과 관심사처럼 영구 보존하는 사실입니다. 핵심 사실은 비슷한 발화가 반복될 때 소형 LLM이 한 문장으로 요약해 승격한 것입니다. 에피소드는 대화 그대로이며 시간이 지나면 신뢰도가 낮아져 프롬프트에서도 확신이 낮은 기억으로 표시합니다. 원문은 삭제하지 않습니다. 단기 창은 최근 턴을 그대로 넘겨 지시어를 해석합니다.</p><p>기억을 찾을 때는 벡터 유사도와 키워드 검색 결과를 각각 순위로 매겨 합치고, 최근 기억에 가중치를 더합니다. 프로필은 검색 결과와 상관없이 항상 들어갑니다. 핵심 사실로 요약하는 작업은 턴 직후 비동기로 실행합니다. 대화를 오래 쉬면 미처 처리하지 못한 기억을 백그라운드에서 정리합니다. 이 작업이 실패해도 대화는 계속할 수 있습니다.</p>` },
      { id: 'turn', title: '한 턴의 워크플로', html: `<p>한 턴은 다섯 단계로 처리하며, 각 단계의 진행 상황을 이벤트로 전달합니다.</p>${fig(window.FIGURES.floraTurn(), '회수, 상태, 생성, 검증, 저장. 선톡 게이트와 승격은 별도로 실행됩니다.')}<p>먼저 기억을 회수하고 프로필은 검색 결과와 무관하게 포함합니다. 다음으로 메시지의 감성 점수를 받아 mood, energy, affinity 세 축을 갱신합니다. LLM에는 상태 수치 대신 현재 상황, 감정의 강도, 허용할 표현을 설명하는 문장을 전달합니다. 상태 수치나 내부 라벨이 프롬프트에 포함되면 테스트가 실패하도록 했습니다.</p><p>생성 뒤에는 소형 LLM이 초안을 자체 원칙으로 검증하고, 검증을 통과하지 못하면 한 번 다시 생성합니다. 과거 발언과 모순되는지도 별도로 검사합니다. 마지막으로 사용자 발화와 최종 답을 에피소드로 저장하고, 요약 대상은 비동기로 처리합니다.</p><p>이 밖에 침묵 시간, 일일 상한, 활동 시간대로 먼저 말을 걸지 정하는 선톡 게이트가 있습니다. 보낸 선톡은 유형과 요지로 분류해 다음 선톡에서 참고하게 합니다.</p>` },
      { id: 'fixes', title: '문제와 해결 네 가지', collapsed: true, html: `<p>네 건 모두 실제 대화에서 발견했습니다. 원인과 수정 내용은 개발 기록에 남겼습니다.</p><table><thead><tr><th>증상</th><th>원인과 수정</th></tr></thead><tbody><tr><td>긍정 대화 몇 턴이면 mood가 상한에 붙어 내려오지 않았습니다.</td><td>mood에 중립으로 돌아오는 항이 없었고, 같은 턴에서도 네 경로가 서로 다른 값을 사용했습니다. 중립 복귀 항을 추가하고, 게이트와 프롬프트가 같은 값을 참조하도록 수정했습니다.</td></tr><tr><td>선톡이 매일 상한을 채우듯 나가고 같은 인사와 회상을 반복했습니다.</td><td>Flora가 직전 선톡을 볼 수 없던 것이 원인이라, 보낸 선톡을 유형과 요지로 분류해 다음 프롬프트에 넣고 직전 기억은 회수에서 뺐습니다.</td></tr><tr><td>턴마다 energy가 줄어 대화가 길수록 피곤해졌습니다.</td><td>energy의 갱신 기준을 정리했습니다. 긍정 대화에서는 올리고 부정 대화에서는 내리며, 대화가 없을 때는 회복하는 balanced 기준을 적용했습니다.</td></tr><tr><td>9분 안에 12턴을 주고받자 5턴 전 이야기를 나눈 적 없다고 답했습니다.</td><td>최근 대화 창이 짧고 회수 기억 머리말이 기억을 외부 사실처럼 읽게 한 것이 원인이라, 창을 늘리고 머리말을 같이 이어온 대화로 바꿨습니다.</td></tr></tbody></table>` }
    ],
    gaps: '레포가 비공개라 코드와 배포 링크가 없습니다. 화면 캡처 두 장은 별도 데모 DB 로 나눈 대화라 개인 대화가 없고, 메뉴바 알림 캡처는 아직 없습니다. 다음에는 먼저 말을 거는 기능과 기억 요약이 대화 만족도에 도움이 되는지 사용자 평가로 확인할 계획입니다.',
    thumb: { src: 'media/flora/cover_voxel.jpg', alt: 'Flora 기억 그래프 이미지(생성 이미지)' }
  });
})();
