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
    s += '<g class="fg-w">' + K.head('관측, 지도, 계획, 제어의 폐루프', '관측 결과로 복셀 지도를 갱신하고, 경로를 따라 이동한 뒤 다시 주변을 관측합니다') + loop(14.5, 9);
    s += K.pill(nx + nw + 22, ys[3] + nh + 15, '다시 관측', { size: 11, color: C.muted, w: 500, a: 'end' });
    s += K.legend(40, H - 26, [{ k: 'sq', color: C.soft, label: '점유 복셀' }, { k: 'dash', color: C.accent, label: '계획한 경로' }, { k: 'dot', color: C.accent, label: '관측 지점' }]);
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
    s += '<g class="fg-w">' + K.head('웨이포인트에서 회피 경로까지', '지정한 경유점을 복셀 지도에 표시하고, 장애물이 있는 칸을 피해 경로를 연결합니다') + labels(14, 9);
    s += K.legend(60, H - 24, [{ k: 'dot', color: C.blue, label: '웨이포인트' }, { k: 'sq', color: C.soft, label: '점유 칸' }, { k: 'sq', color: C.tint2, label: '점유 확률이 낮은 칸' }, { k: 'line', color: C.accent, label: '회피 경로' }]);
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
      shows: '주변 관측부터 지도 생성, 경로 계획, 제어까지 연결해 장애물 회피 비행을 구현했습니다.',
      why: '장애물 회피와 학습용 데이터 수집을 수행할 시뮬레이션 환경이 필요했습니다.',
      matters: '시뮬레이션 환경을 구현하고, 운영 절차와 확인한 문제를 문서로 정리해 인계했습니다.'
    },
    summary60: [
      '관측부터 제어까지 비행 과정을 연결하고, <b class="num">5</b>일 온보딩 과정 설계',
      '가이드 <b class="num">7장</b>과 참고 자료 <b class="num">5편</b>으로 운영 매뉴얼 구성',
      '지형 타일, 카메라, 트랙 설정으로 프레임과 좌표를 함께 남기는 수집 파이프라인 운영',
      '지도 포화를 일부 완화하고, 문제 <b class="num">3</b>가지의 원인과 대응 정리',
      '<b class="num">36단계</b> 체크리스트 포함, 외부 의존성 <b class="num">0</b>인 단일 HTML 매뉴얼'
    ],
    sections: [
      { id: 'role', title: '담당 업무와 진행 과정', html: `<p>인턴 기간에 "Isaac Sim을 활용한 드론 자율주행 시뮬레이션 구현 및 학습용 데이터 수집"을 맡았습니다. Isaac Sim, Pegasus Simulator, ROS 2, Cesium 을 활용하여 진행했습니다.</p><p>처음에는 실내에서 장애물을 피하며 비행하는 기본 구조를 구현했습니다. 주변 관측 결과를 복셀 지도에 반영하고, 경로를 계획해 이동한 뒤 다시 관측하도록 연결했습니다. 복셀은 공간을 작은 입방체 단위로 나눈 격자입니다.</p><p>이후 회사의 우선순위에 따라 학습용 데이터 수집 업무를 맡았습니다. 웹 UI에서 수집 작업을 관리하는 파이프라인을 개발하고 운영했으며, 운영 방법을 문서로 정리해 후임에게 인계했습니다.</p>${fig(conceptDrawing(), '그때 생각했던 3D 에서의 회피 구현 과정', 'background:#edf4f0')}` },
      { id: 'collect', title: '학습용 데이터 수집은 어떻게 했나', html: `<p>데이터 수집은 지형을 불러오고, 기체에 카메라를 달고, 정한 경로로 날면서 프레임과 위치 정보를 함께 남기는 세 단계였습니다.</p><h3>지형 불러오기</h3><p>Isaac Sim 에 Cesium for Omniverse 확장을 켜고 Cesium ion 계정을 연결한 뒤, Photorealistic 3D Tiles 를 스테이지에 올렸습니다. 타일은 화면 공간 오차(Maximum Screen Space Error) 같은 로딩 설정으로 화질과 속도를 맞췄습니다. 기체는 Pegasus Simulator 의 쿼드콥터를 지리 좌표 위에 배치했습니다. 고도는 해발고도와 타원체고의 기준이 다르면 수 미터에서 십수 미터가 어긋나기 때문에, 지형 고도 자료(DEM)에 지오이드고를 더해 타일과 같은 기준으로 맞췄습니다.</p><h3>카메라 설정</h3><p>기체에 카메라를 붙여 수직 아래(nadir)를 보거나 짐벌 각도를 준 상태로 촬영했습니다. 해상도와 초점거리, 프레임 속도를 설정값으로 두었습니다. 정지 촬영은 지면 해상도(GSD)를 고정하고 초점거리를 고도에 맞춰 자동 계산하는 방식이고, 비행 촬영은 반대로 초점거리를 고정하고 GSD 가 고도에 따라 변하는 방식입니다. 정지 촬영의 범위는 해상도에 GSD 를 곱해 계산합니다. 예를 들어 0.25 m/px 에 512 px 이면 한 변이 128 m 입니다.</p><h3>비행과 수집</h3><p>웹 UI 의 곡선 에디터에서 웨이포인트를 찍어 트랙을 만들고, 지면 높이와 비행 고도, 속도, 프레임 속도, 시간대와 날씨를 정했습니다. 비행 전에는 실제 비행과 같은 식으로 궤적을 계산해 수평 가속의 p99 와 수직 속도를 기준으로, 곡률을 참고선으로 두고 안전, 주의, 불가를 판정했고 총 거리와 예상 시간, 프레임 수를 미리 보여 줬습니다. 고도 변화를 짧은 구간에 몰면 수직 속도가 넘어가기 때문에 긴 구간에 나눠 배분하도록 안내했습니다. 비행 중에는 프레임마다 카메라 자세를 기록했고, Cesium 타일에는 물리 충돌이 없어 광선 검사로 지면을 찾을 수 없었기 때문에 카메라 자세와 지형 고도 자료로 각 프레임의 지면 좌표를 계산했습니다. 이 계산은 평지를 가정한 것이라 산등성이가 시야를 가리는 경우까지 반영하지는 못했고, 카메라 기울기가 큰 프레임은 상단 일부를 무효로 표시하거나 좌표를 내지 않도록 했습니다.</p><h3>산출물과 검증</h3><p>한 번의 비행에서 프레임 이미지와 톤 보정본, 비행 영상, 프레임별 좌표와 자세, 촬영 범위를 담은 CSV 가 나옵니다. 수직으로 내려다본 프레임은 좌표가 내장된 GeoTIFF 로도 저장했고, 기울어진 촬영은 정사영 전제가 성립하지 않아 GeoTIFF 대신 네 모서리 좌표와 촬영 정보를 CSV 에 기록했습니다. 수집이 끝나면 검은 프레임이 없는지, 기록된 좌표가 의도한 트랙 위에 있는지, 영상이 정상인지 확인하는 검증 비행을 거쳤습니다.</p>` },
      { id: 'problems', title: '실행 중 생긴 문제와 대응', html: `<h3>관측이 누적되면서 지도가 포화된 문제</h3><p>관측이 누적되면서 지도의 대부분이 장애물이 있는 칸으로 표시돼 경로를 찾지 못했습니다. 오래된 관측의 점유 확률을 서서히 낮추는 감쇠를 적용해 문제를 일부 완화했습니다. 다만 안정적으로 동작하는 조건이 제한적이어서, 당시 구현의 한계와 실험 조건을 문서에 남겼습니다.</p><h3>글로만 주고받은 시각 기준</h3><p>시각적인 요소를 글로만 주고받다 보니 기준이 어긋난 적이 있었습니다. 이를 줄이려고 작은 샘플을 먼저 만들어 보여 주고, 결과를 같이 보며 조건을 맞추는 방식으로 바꿨습니다.</p><h3>화면에 보이는 건물과 물리 충돌의 차이</h3><p>Cesium 타일은 Fabric Scene Delegate 로 그려지는데, Isaac Sim 에서는 이 경로와 PhysX 물리를 동시에 켤 수 없어 건물이 보이기만 하고 충돌하지 않았습니다. 재현 영상을 만들고 <a href="https://forums.developer.nvidia.com/t/cesium-and-isaac-sim-4-1-0/305110/4" target="_blank" rel="noreferrer">NVIDIA 포럼의 공식 답변</a>과 같은 한계를 겪은 공개 사례를 찾아 정리한 뒤, 사실적 렌더링과 물리 기반 회피를 별도 파이프라인으로 분리했습니다. 대안으로는 특정 영역의 타일을 정적 메시로 변환해 물리를 입히는 방법을 검토했습니다.</p>` },
      { id: 'handoff', title: '인수인계 과정', html: `<p>후임이 환경 설정부터 운영까지 따라갈 수 있도록 단일 HTML 매뉴얼을 만들었습니다. 외부 의존성 없이 열 수 있으며, 가이드 7장과 참고 자료 5편, 36단계 체크리스트를 포함했습니다. 이 문서를 바탕으로 5일 온보딩 과정을 설계하고 진행했습니다.</p><table><thead><tr><th>일차</th><th>교육 및 실습 내용</th></tr></thead><tbody><tr><td>1일차</td><td>전체 구조와 주요 파일을 소개하고, Isaac Sim과 Script Editor, Cesium, Pegasus의 역할을 설명했습니다. 스트리밍 클라이언트 설치, VS Code 연동, 컨테이너 접속과 포트 포워딩을 진행한 뒤 Isaac Sim과 UI를 실행했습니다.</td></tr><tr><td>2일차</td><td>트랙을 직접 만들며 UI와 Isaac Sim 사용법을 익히도록 했습니다. 이후 실습 과제를 부여하고, 지형 고도와 좌표 기준(DEM, EGM96, WGS84), 짐벌 등 관련 용어를 설명했습니다.</td></tr><tr><td>3~4일차</td><td>개별 과제를 수행했습니다.</td></tr><tr><td>5일차</td><td>과제를 수행하고 검증용 테스트를 진행했습니다.</td></tr></tbody></table><p>교육과 과제 수행을 마친 뒤 인수인계를 마무리했습니다.</p>` },
    ],
    gaps: '감쇠를 적용한 뒤에도 지도 포화 문제는 일부 남았습니다. 조건을 바꿔 가며 경로 성공률을 반복 측정하지 못했기 때문에, 적용 범위와 안정성을 충분히 검증하지는 못했습니다. 추가 실험에서는 조건별 경로 성공률을 반복 측정할 계획입니다.',
    thumb: { src: 'media/drone/cover_voxel.jpg', alt: '드론 자율주행 복셀 장면(생성 이미지)' }
  });
})();
