/* 노트: 드론 자율주행. 이 파일만 고치면 됩니다. 계약은 notes/README.md 참고.
   회사 내부 정보는 쓰지 않습니다(work/dossier_handoff_web.md 의 SAFE 재료, 경력증명서 문구, 2026-10-14 01:00 보강 결정만).
   측정 수치(Hz, GPU), 센서 구성, 계획기 종류, 상태 이름, 운영 UI 구성은 어느 층에도 쓰지 않습니다.
   비행 체험 데모는 글에서 뺐습니다(2026-10-14 사용자 결정). 사본은 blog/demo/drone/ 에만 남아 있고 배포본에는 넣지 않습니다.
   2026-10-14 마무리: 회사 확인 전 초안 메모와 온보딩, 토큰 todo 문장을 뺐습니다. 2층 섹션(구조, 막힌 곳)은 회사 확인 전이라 collapsed 유지. */
(function () {
  const K = window.FIGKIT, C = K.C;

  /* 2층(접힌 섹션)용 그림. 격자 위 드론과 점선 경로, 오른쪽에 관측-지도-계획-제어 고리. */
  function droneDrawing() {
    const W = 640, H = 360;
    let s = K.open(W, H, { label: '지도를 관측하는 드론 구조도. 관측, 복셀 지도, 경로 계획, 제어가 고리로 이어집니다', marker: 'drone-loop' });
    /* 일러스트(원본 250×200 좌표를 1.3배로 옮김) */
    s += '<g transform="translate(36 74) scale(1.3)">';
    s += `<g fill="none" stroke="#dfe3ea" stroke-width="1"><path d="m10 125 115-67 115 67-115 67Z M10 102l115-67 115 67M10 148l115-67 115 67M40 108v34m28-51v34m29-51v34m28-51v34m28 17v34m28-17v34m28-17v34"/></g>`;
    s += `<g fill="${C.soft}"><path d="m58 126 20-12 20 12-20 12Z"/><path d="m149 105 23-13 23 13-23 13Z"/><path d="m104 167 16-9 16 9-16 9Z"/></g>`;
    s += `<path d="m127 123 15-10 13 1 16-12" stroke="${C.accent}" stroke-width="2" fill="none" stroke-dasharray="4 4" stroke-linecap="round"/>`;
    s += `<g stroke="${C.blue}" stroke-width="3" fill="none" stroke-linecap="round"><path d="m79 83 22-17 38 10 25-13M80 63l23 17 39-10 22 14"/><ellipse cx="79" cy="63" rx="21" ry="7"/><ellipse cx="80" cy="83" rx="21" ry="7"/><ellipse cx="164" cy="63" rx="21" ry="7"/><ellipse cx="164" cy="84" rx="21" ry="7"/></g>`;
    s += `<path d="m101 66 23-12 19 13-19 14Z" fill="${C.blue}"/><path d="m101 66v13l23 14V81m19-14v13l-19 13V81" fill="#3a4ea3"/><circle cx="124" cy="99" r="4" fill="${C.accent}"/>`;
    s += '</g>';
    /* 오른쪽 고리 */
    const nx = 430, nw = 164, nh = 42, ys = [96, 160, 224, 288];
    const steps = [['1', '관측'], ['2', '복셀 지도'], ['3', '경로 계획'], ['4', '제어']];
    const loop = (size, br) => { let g = ''; steps.forEach(([n, t], i) => { g += K.node(nx, ys[i], nw, nh, { n, t, hl: i === 1, size, br, rx: 10 }); if (i < 3) g += K.path(`M${nx + nw / 2} ${ys[i] + nh} V${ys[i + 1] - 2}`, { marker: 'drone-loop' }); }); g += K.path(`M${nx + nw} ${ys[3] + nh / 2} H${nx + nw + 22} V${ys[0] + nh / 2} H${nx + nw + 2}`, { marker: 'drone-loop', dash: '4 4' }); return g; };
    s += '<g class="fg-w">' + K.head('관측, 지도, 계획, 제어의 폐루프', '드론이 본 것을 복셀 지도에 쌓고, 지도 위에서 경로를 찾아 움직인 뒤 다시 관측합니다') + loop(14.5, 9);
    s += K.pill(nx + nw + 22, ys[3] + nh + 15, '다시 관측', { size: 11, color: C.muted, w: 500, a: 'end' });
    s += K.legend(40, H - 26, [{ k: 'sq', color: C.soft, label: '점유 복셀' }, { k: 'dash', color: C.accent, label: '계획한 경로' }, { k: 'dot', color: C.accent, label: '센서가 보는 점' }]);
    s += '</g><g class="fg-m">' + K.text(22, 38, '관측, 지도, 계획, 제어의 폐루프', { size: 22, w: 700 }) + loop(19, 11);
    s += K.legend(40, H - 24, [{ k: 'sq', color: C.soft, label: '점유 복셀' }, { k: 'dash', color: C.accent, label: '경로' }], { size: 17, gap: 22 });
    s += '</g>';
    return s + K.close();
  }

  /* 1층용 3칸 개념도: 웨이포인트 → 복셀 지도 → 회피 경로. */
  function conceptDrawing() {
    const W = 640, H = 296, G = 18, N = 6, gw = G * N, py = 80;
    const panels = [[60, '1', '웨이포인트'], [266, '2', '복셀 지도'], [472, '3', '회피 경로']];
    const grid = (x, y) => { let g = K.rect(x, y, gw, gw, { rx: 4, fill: C.band, cls: 'fg-bg' }); for (let i = 0; i <= N; i++) g += K.line(x + i * G, y, x + i * G, y + gw, { stroke: '#dfe3ea' }) + K.line(x, y + i * G, x + gw, y + i * G, { stroke: '#dfe3ea' }); return g; };
    const cell = (x, y, c) => K.rect(x + 1, y + 1, G - 2, G - 2, { rx: 2, fill: c, cls: 'fg-bg' });
    const pts = ox => [[20, 100], [60, 60], [100, 20]].map(([a, b]) => K.circle(ox + a, py + b, 5, { fill: C.blue, stroke: '#fff', sw: 1.5 })).join('');
    const blocks = ox => cell(ox + 36, py + 72, C.soft) + cell(ox + 54, py + 72, C.soft) + cell(ox + 54, py + 90, C.soft) + cell(ox + 72, py + 36, C.soft) + cell(ox + 18, py + 36, C.tint2) + cell(ox + 90, py + 90, C.tint2);
    let s = K.open(W, H, { label: '웨이포인트, 복셀 지도, 회피 경로 세 단계 개념도', marker: 'drone-concept' });
    panels.forEach(([x], i) => { s += grid(x, py); if (i > 0) s += blocks(x); if (i === 0) s += K.path(`M${x + 20} ${py + 100}L${x + 60} ${py + 60}L${x + 100} ${py + 20}`, { stroke: C.blue, dash: '3 4', sw: 1.5 }); if (i === 2) s += K.path(`M${x + 20} ${py + 100}L${x + 30} ${py + 80} ${x + 30} ${py + 54} ${x + 46} ${py + 40} ${x + 80} ${py + 40} ${x + 100} ${py + 20}`, { stroke: C.accent, sw: 2.5 }); s += pts(x); if (i < 2) s += K.path(`M${x + gw + 22} ${py + gw / 2}h${panels[i + 1][0] - x - gw - 46}`, { marker: 'drone-concept', sw: 1.5 }); });
    const labels = (size, br) => panels.map(([x, n, t]) => { const cx = x + gw / 2, y = py + gw + 28, w = K.tw(t, size) + br * 2 + 8, lx = cx - w / 2; return K.circle(lx + br, y - size * .35, br, { fill: C.tint }) + K.text(lx + br, y - size * .35 + br * .38, n, { size: Math.round(br * 1.1), w: 700, fill: C.blue, a: 'middle', cls: 'fg-n' }) + K.text(lx + br * 2 + 8, y, t, { size, w: 700 }); }).join('');
    s += '<g class="fg-w">' + K.head('웨이포인트에서 회피 경로까지', '받은 점을 복셀 격자 위에 놓고, 점유된 칸을 피해 경로를 다시 잇습니다') + labels(14, 9);
    s += K.legend(60, H - 24, [{ k: 'dot', color: C.blue, label: '웨이포인트' }, { k: 'sq', color: C.soft, label: '점유 칸' }, { k: 'sq', color: C.tint2, label: '낮은 점유' }, { k: 'line', color: C.accent, label: '회피 경로' }]);
    s += '</g><g class="fg-m">' + K.text(22, 38, '웨이포인트에서 회피 경로까지', { size: 22, w: 700 }) + labels(18, 11);
    s += K.legend(60, H - 22, [{ k: 'dot', color: C.blue, label: '경유점' }, { k: 'sq', color: C.soft, label: '점유' }, { k: 'line', color: C.accent, label: '회피 경로' }], { size: 17, gap: 22 });
    s += '</g>';
    return s + K.close();
  }

  // 외부 데모 링크 없음(2026-10-14).

  window.NOTES.push({
    id: 'drone',
    order: 20,
    title: '복셀 지도로 장애물을 피하는 드론',
    summary: '시뮬레이터에서 장애물 회피 비행을 구현하고, 데이터 수집용 웹 UI와 운영 매뉴얼을 만들어 인계했습니다.',
    topic: '드론',
    category: '프로젝트',
    date: '2026.05–08',
    tools: ['Isaac Sim', 'ROS 2', 'Pegasus', 'CesiumJS'],
    tag: '드론 자율주행',
    hero: { src: 'media/drone/cover_voxel.jpg', alt: '블록 도시 위를 초록 경로로 장애물을 피해 나는 복셀 드론 장면(생성 이미지)', caption: '웨이포인트를 받아 복셀 지도에서 장애물을 피해 가는 흐름을 그린 생성 이미지입니다.' },
    meta: { period: '2026.03–08 (인턴 기간)', role: '설계, 구현, 운영, 인계', members: '1인', contribution: '100%' },
    points: {
      shows: '관측, 복셀 지도 생성, 경로 계획, 제어를 하나의 비행 파이프라인으로 연결했습니다.',
      why: '장애물 회피와 학습용 데이터 수집을 수행할 시뮬레이션 환경이 필요했습니다.',
      matters: '인턴 기간에 폐루프 미션을 구현했고, 이후 운영 방법과 알려진 문제를 문서로 인계했습니다.'
    },
    summary60: [
      '인턴 기간에 관측에서 제어까지 폐루프 미션 실행, 온보딩 커리큘럼 <b class="num">5</b>일 직접 설계',
      '가이드 <b class="num">7장</b>, 참고 <b class="num">5편</b>으로 운영 문서를 구성',
      '지도 포화는 감쇠로 완화, 문제 <b class="num">3</b>가지를 원인과 함께 문서화',
      '인계 문서 <b class="num">36단계</b> 체크리스트, 외부 의존성 <b class="num">0</b>의 단일 HTML'
    ],
    sections: [
      { id: 'role', title: '맡은 일과 순서', html: `<p>인턴 기간의 담당 업무는 경력증명서 문구 그대로 "Isaac Sim을 활용한 드론 자율주행 시뮬레이션 구현 및 학습용 데이터 수집"이었습니다. 공개 도구인 Isaac Sim, Pegasus, ROS 2, Cesium 위에서 혼자 파이프라인을 만들고 돌렸습니다.</p><p>먼저 실내 자율 회피 과제를 맡아 관측에서 지도, 계획, 제어로 이어지는 폐루프 베이스라인을 구현했습니다. 그 뒤 회사 우선순위에 따라 학습용 데이터 수집 쪽으로 옮겨, 웹 UI에서 데이터 수집 작업을 관리하는 파이프라인을 개발하고 운영한 뒤 후임에게 인계했습니다.</p>${fig(conceptDrawing(), '웨이포인트를 받아 복셀 지도를 만들고, 그 위에서 회피 경로를 찾는 개념도입니다.', 'background:#edf4f0')}` },
      { id: 'problems', title: '실행 중 생긴 문제와 대응', html: `<h3>지도가 지나치게 채워진 문제</h3><p>관측이 쌓이면서 지도의 대부분이 점유로 바뀌어 경로를 찾지 못했습니다. 오래된 관측의 점유 확률을 서서히 낮추는 감쇠를 넣어 일부 완화했습니다. 동작 구간이 좁아 이 구현과 실험 조건에서의 한계로 문서에 남겼습니다.</p><h3>글로만 주고받은 작업 조건</h3><p>요청받은 기준이 실제 결과와 어긋났습니다. 이후에는 작은 샘플을 먼저 만들어 보여 주고, 결과를 함께 보며 조건을 맞췄습니다.</p><h3>시뮬레이터의 건물 충돌</h3><p>Cesium for Omniverse 의 타일은 렌더 전용 경로(FSD)로 그려져 물리 충돌이 적용되지 않습니다. 재현 영상과 자료로 원인을 정리해 공유하고, 렌더링과 물리 충돌 처리를 분리했습니다.</p>` },
      { id: 'handoff', title: '인수인계 진행 상황', html: `<p>후임이 환경 설정과 운영 절차를 따라갈 수 있도록 외부 의존성이 없는 단일 HTML 매뉴얼(가이드 7장, 참고 5편, 36단계 체크리스트)을 만들고, 누구의 도움 없이 5일 온보딩 커리큘럼을 직접 짜서 진행했습니다.</p><table><thead><tr><th>일차</th><th>진행</th></tr></thead><tbody><tr><td>1일차</td><td>전체 구조 훑기. Isaac Sim 과 Script Editor 가 필요한 이유, Cesium, Pegasus 의 역할, 주요 파일 소개. 스트리밍 클라이언트 설치, VS Code 연동과 컨테이너 접속, 포트 포워딩 뒤 Isaac Sim 과 UI 실행까지.</td></tr><tr><td>2일차</td><td>직접 트랙 하나 제작. UI 설명과 Isaac Sim 사용법 체득, 오후에 과제 부여. DEM, EGM96, WGS84, 짐벌 같은 용어 정리.</td></tr><tr><td>3~4일차</td><td>자율 과제 수행과 세미나 준비.</td></tr><tr><td>5일차</td><td>과제 수행과 검증용 테스트.</td></tr></tbody></table><p>마지막 날 후임이 혼자 운영할 수 있는 상태로 인계를 마쳤습니다.</p>` },
    ],
    gaps: '지도 포화는 감쇠로 일부만 완화됐고, 조건을 바꿔 가며 경로 성공률을 측정하는 실험은 하지 못했습니다. 인계 뒤 온보딩이 어떻게 진행됐는지는 확인하지 못했습니다. 다음 실험에서는 조건별 경로 성공률을 반복 측정할 계획입니다.',
    thumb: { src: 'media/drone/cover_voxel.jpg', alt: '드론 자율주행 복셀 장면(생성 이미지)' }
  });
})();
