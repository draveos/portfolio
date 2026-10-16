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

  // The two SVG label layers use their own coordinates. On a narrow container,
  // the outer aspect ratio and mobile transform cancel so text stays undistorted.
  function diagramFrame(id, height, mobileHeight, label, wide, narrow) {
    const width = 960, mw = 520;
    let s = K.open(width, height, { label, marker: id, noCard: true });
    s = s.replace('<svg ', `<svg class="drone-viz ${id}" preserveAspectRatio="none" `);
    s += `<style>
      svg.${id}{aspect-ratio:${width}/${height};height:auto}
      .figure-stage svg.${id}{min-width:0}
      @container (max-width:480px){svg.${id}{aspect-ratio:${mw}/${mobileHeight}}}
    </style>`;
    const card = (w,h) => K.rect(.75,.75,w-1.5,h-1.5,{rx:16,stroke:C.line,sw:1.5});
    s += '<g class="fg-w">'+card(width,height)+wide+'</g>';
    s += `<g class="fg-m" transform="scale(${width/mw} ${height/mobileHeight})">`+card(mw,mobileHeight)+narrow+'</g>';
    return s+K.close();
  }
  function diagramHeading(title, subtitle, mobile) {
    let s=K.text(32,mobile?48:42,title,{size:mobile?27:24,w:700});
    if(subtitle)s+=K.text(32,mobile?82:72,subtitle,{size:mobile?20:17,fill:C.muted});
    return s;
  }
  function stepHeading(x,y,n,title,mobile) {
    return K.circle(x+25,y+28,13,{fill:C.tint})+
      K.text(x+25,y+33,n,{size:14,w:700,a:'middle',fill:C.blue})+
      K.text(x+50,y+35,title,{size:mobile?24:22,w:600});
  }
  function gridArt(kind) {
    const unit=24,size=144, pts=[[18,126],[78,78],[126,18]];
    let s=K.rect(0,0,size,size,{rx:5,fill:C.band,stroke:C.axis});
    for(let i=1;i<6;i++)s+=K.line(i*unit,0,i*unit,size,{stroke:C.axis})+K.line(0,i*unit,size,i*unit,{stroke:C.axis});
    if(kind>0)for(const [x,y,c]of [[48,96,C.soft],[72,96,C.soft],[72,120,C.soft],[96,48,C.soft],[24,48,C.tint2]])s+=K.rect(x+2,y+2,20,20,{rx:2,fill:c});
    if(kind===0)s+=K.path('M18 126L78 78L126 18',{stroke:C.blue,dash:'5 5',sw:2});
    if(kind===2)s+=K.path('M18 126L34 84V60L58 36H108L126 18',{stroke:C.accent,sw:3});
    pts.forEach(([x,y])=>s+=K.circle(x,y,6,{fill:C.blue,stroke:'#fff',sw:2}));
    return s;
  }
  function collectionArt(kind) {
    if(kind===0){
      let s=K.path('M8 104L80 64L152 104L80 144Z',{fill:C.band,stroke:C.axis});
      s+=K.path('M32 91L104 131M56 77L128 117M32 117L104 77M56 131L128 91',{stroke:C.axis});
      s+=K.path('M80 43L49 104M80 43L111 104',{stroke:C.accent,dash:'5 4',sw:2});
      s+=K.path('M49 104L80 87L111 104L80 121Z',{stroke:C.accent,fill:C.accentTint,sw:2});
      s+=K.path('M46 30H114M57 18L103 42M57 42L103 18',{stroke:C.blue,sw:4});
      for(const [x,y]of [[45,20],[115,20],[45,42],[115,42]])s+=`<ellipse cx="${x}" cy="${y}" rx="14" ry="5" fill="#fff" stroke="${C.blue}" stroke-width="2.5"/>`;
      s+=K.rect(68,22,24,18,{rx:5,fill:C.blue})+K.circle(80,46,4,{fill:C.accent});
      return s;
    }
    if(kind===1){
      let s=K.rect(8,4,144,144,{rx:5,fill:C.band,stroke:C.axis});
      for(let i=1;i<6;i++)s+=K.line(8+i*24,4,8+i*24,148,{stroke:C.axis})+K.line(8,4+i*24,152,4+i*24,{stroke:C.axis});
      s+=K.path('M24 132Q42 64 76 88',{stroke:C.blue,sw:3});
      s+=K.path('M76 88Q110 112 120 64',{stroke:C.accent,sw:3});
      s+=K.path('M120 64Q128 30 140 20',{stroke:C.red,sw:3});
      for(const [x,y]of [[24,132],[76,88],[120,64],[140,20]])s+=K.circle(x,y,6,{fill:C.blue,stroke:'#fff',sw:2});
      return s;
    }
    let s='';
    for(const o of [14,7,0])s+=K.rect(10+o,28+o,80,60,{rx:5,fill:o?C.tint2:'#fff',stroke:C.box,sw:1.5});
    s+=K.circle(25,43,4,{fill:C.accent})+K.path('M24 65H71M24 76H57',{stroke:C.tint2,sw:4});
    s+=K.path('M111 18H140L151 29V73H111Z',{fill:'#fff',stroke:C.gray,sw:1.5});
    s+=K.path('M140 18V29H151M118 39H143M118 49H143M118 59H137',{stroke:C.gray,sw:1.5});
    s+=K.rect(111,92,40,40,{rx:3,fill:C.tint,stroke:C.box});
    for(const [x,y]of [[114,95],[144,95],[114,125],[144,125]])s+=K.rect(x,y,4,4,{rx:0,fill:C.accent});
    return s;
  }
  function threeStageFigure(id,title,subtitle,steps,art,legend,mobileTitle=title) {
    let wide=diagramHeading(title,subtitle,false);
    let mobile=diagramHeading(mobileTitle,'위에서 아래로 진행하는 개념도입니다.',true);
    steps.forEach(([name,one,two],i)=>{
      const x=32+i*316,y=106;
      wide+=K.rect(x,y,264,278,{rx:12,fill:'#fff',stroke:C.box,sw:1.3})+stepHeading(x,y,String(i+1),name,false);
      const ax=x+(264-(id==='drone-concept-v2'?144:160))/2;
      wide+=`<g transform="translate(${ax} ${y+61})">${art(i)}</g>`;
      wide+=K.text(x+132,y+236,one,{size:17,fill:C.muted,a:'middle'})+K.text(x+132,y+260,two,{size:17,fill:C.muted,a:'middle'});
      if(i<2)wide+=K.path(`M${x+269} ${y+139}H${x+308}`,{marker:id,sw:1.8});
      const my=112+i*248;
      mobile+=K.rect(32,my,456,214,{rx:12,fill:'#fff',stroke:C.box,sw:1.5})+stepHeading(32,my,String(i+1),name,true);
      mobile+=`<g transform="translate(58 ${my+60}) scale(.9)">${art(i)}</g>`;
      mobile+=K.text(238,my+112,one,{size:21,fill:C.muted})+K.text(238,my+144,two,{size:21,fill:C.muted});
      if(i<2)mobile+=K.path(`M260 ${my+220}V${my+241}`,{marker:id,sw:2});
    });
    wide+=K.legend(36,426,legend,{size:17,gap:28});
    mobile+=K.legend(32,902,legend.filter(l=>l.mobile!==false).map(l=>({...l,label:l.short||l.label})),{size:19,gap:22});
    return diagramFrame(id,454,934,title,wide,mobile);
  }
  /* A top-down schematic represents the planning principle, not a flight log. */
  function conceptDrawing() {
    return threeStageFigure('drone-concept-v2','웨이포인트에서 회피 경로까지',
      '지정한 경유점과 점유 지도를 바탕으로 장애물을 피하는 경로를 계획합니다.',
      [['웨이포인트','지정한 경유점을','차례로 연결'],['복셀 지도','장애물이 있는 칸을','점유 지도로 기록'],['회피 경로','막힌 칸을 피해','이동 경로를 계획']],
      gridArt,[{k:'dot',color:C.blue,label:'웨이포인트'},{k:'sq',color:C.soft,label:'점유 칸'},{k:'line',color:C.accent,label:'회피 경로'}]);
  }
  function collectDrawing() {
    return threeStageFigure('drone-collect-v2','프레임과 좌표를 함께 남기는 수집 과정',
      '지형과 카메라를 설정하고, 비행을 기록해 프레임과 위치 정보를 저장합니다.',
      [['지형과 카메라','지형 타일을 불러와','촬영 범위를 설정'],['트랙과 판정','트랙을 만들고','비행 조건을 판정'],['프레임과 좌표','프레임마다 자세와','지면 좌표를 기록']],
      collectionArt,[{k:'dot',color:C.blue,label:'웨이포인트'},{k:'line',color:C.accent,label:'주의 구간',short:'주의'},{k:'line',color:C.red,label:'불가 구간',short:'불가'}],
      '지형에서 촬영 데이터까지');
  }
  function flightFlow() {
    const id='drone-flight-v2';
    const steps=[
      ['트랙 작성','곡선 에디터에서','웨이포인트를 저장'],
      ['설정과 판정','고도와 속도 설정','p99와 수직 속도 확인'],
      ['비행과 기록','트랙을 따라 비행','프레임마다 자세 기록'],
      ['좌표 계산','자세와 지형 고도로','프레임의 지면 좌표 계산']
    ];
    let wide=diagramHeading('비행 한 번이 데이터가 되기까지','트랙 작성부터 비행 기록, 프레임별 지면 좌표 계산까지 이어집니다.',false);
    let mobile=diagramHeading('비행 한 번의 처리 순서','트랙을 만들고 비행하며 기록합니다.',true);
    steps.forEach(([title,a,b],i)=>{
      const x=32+i*236,y=126;
      wide+=K.node(x,y,188,92,{n:String(i+1),t:title,hl:i===1,size:22,br:11});
      wide+=K.text(x+94,254,a,{size:17,fill:C.muted,a:'middle'})+K.text(x+94,281,b,{size:16.5,fill:C.muted,a:'middle'});
      if(i<3)wide+=K.path(`M${x+192} 172H${x+230}`,{marker:id,sw:1.8});
      const my=112+i*150;
      mobile+=K.rect(32,my,456,120,{rx:12,fill:i===1?C.tint:'#fff',stroke:i===1?C.soft:C.box,sw:1.5});
      mobile+=stepHeading(32,my,String(i+1),title,true);
      mobile+=K.text(82,my+71,a,{size:21,fill:C.muted})+K.text(82,my+100,b,{size:21,fill:C.muted});
      if(i<3)mobile+=K.path(`M260 ${my+124}V${my+144}`,{marker:id,sw:2});
    });
    wide+=K.line(32,322,928,322,{stroke:C.line});
    wide+=K.text(32,362,'좌표의 유효 범위',{size:19,w:600});
    wide+=K.text(254,362,'좌표는 평지 기준의 추정값이라, 산등성이에 가린 곳은 오차가 생깁니다.',{size:17,fill:C.muted});
    wide+=K.text(254,393,'촬영 기울기가 크면 상단 일부 또는 프레임 전체의 좌표가 무효가 됩니다.',{size:17,fill:C.muted});
    mobile+=K.line(32,718,488,718,{stroke:C.line});
    mobile+=K.text(32,756,'좌표의 유효 범위',{size:23,w:600});
    mobile+=K.text(32,793,'평지 기준으로 좌표를 추정했습니다.',{size:21,fill:C.muted});
    mobile+=K.text(32,823,'산등성이에 가린 곳은 오차가 생깁니다.',{size:21,fill:C.muted});
    mobile+=K.text(32,853,'촬영 기울기가 크면 일부 또는 전체가',{size:21,fill:C.muted});
    mobile+=K.text(32,883,'좌표 계산에서 제외됩니다.',{size:21,fill:C.muted});
    return diagramFrame(id,428,922,'비행과 기록 네 단계 및 좌표의 유효 범위',wide,mobile);
  }

  function outputFigure() {
    const id='drone-output-v2';
    let wide=diagramHeading('산출물과 검증','촬영 결과와 위치 정보를 묶어 확인한 뒤 전달했습니다.',false);
    let mobile=diagramHeading('산출물과 검증','촬영 결과와 위치 정보를 정리해 전달했습니다.',true);
    // A single bundle replaces the implementation-level file inventory.
    const bundle=(x,y,scale=1)=>{
      let s=`<g transform="translate(${x} ${y}) scale(${scale})">`;
      s+=K.rect(36,0,132,142,{rx:9,fill:C.tint,stroke:C.soft,sw:1.5});
      s+=K.rect(18,15,132,142,{rx:9,fill:'#fff',stroke:C.soft,sw:1.5});
      s+=K.rect(0,30,132,142,{rx:9,fill:'#fff',stroke:C.blue,sw:1.8});
      s+=K.rect(15,47,102,68,{rx:5,fill:C.tint,stroke:C.line});
      s+=K.circle(92,65,7,{fill:C.soft});
      s+=K.path('M20 108L49 76L69 96L82 83L112 108Z',{fill:C.tint2,stroke:C.soft,sw:1.4});
      s+=K.line(18,133,112,133,{stroke:C.soft,sw:2});
      s+=K.line(18,146,86,146,{stroke:C.box,sw:2});
      return s+'</g>';
    };
    wide+=K.text(240,122,'전달용 데이터',{size:22,w:600,a:'middle'});
    wide+=bundle(156,146);
    wide+=K.text(240,344,'촬영 이미지와 영상, 프레임별 위치 정보',{size:16,fill:C.muted,a:'middle'});
    wide+=K.path('M434 233H526',{marker:id,sw:1.8});
    wide+=K.text(578,122,'검증 비행에서 확인',{size:22,w:600});
    mobile+=K.text(260,136,'전달용 데이터',{size:24,w:600,a:'middle'});
    mobile+=bundle(184,160,.9);
    mobile+=K.text(260,348,'촬영 이미지와 영상, 프레임별 위치 정보',{size:21,fill:C.muted,a:'middle'});
    mobile+=K.path('M260 373V406',{marker:id,sw:2});
    mobile+=K.text(32,450,'검증 비행에서 확인',{size:24,w:600});
    const checks=[['기록한 좌표가','의도한 트랙을 따르는지'],['영상이 끊김 없이','재생되는지'],['검은 프레임이 없는지']];
    const check=(x,y)=>K.circle(x,y,10,{fill:C.tint,stroke:C.blue,sw:1.4})+K.path(`M${x-4} ${y}l3 3 6-7`,{stroke:C.blue,sw:1.8});
    checks.forEach((lines,i)=>{
      const y=177+i*72,my=497+i*76;
      wide+=check(588,y-5);lines.forEach((t,j)=>wide+=K.text(616,y+j*27,t,{size:20,fill:C.ink}));
      mobile+=check(43,my-5);lines.forEach((t,j)=>mobile+=K.text(72,my+j*28,t,{size:23,fill:C.ink}));
    });
    return diagramFrame(id,380,716,'전달용 데이터 묶음과 검증 항목',wide,mobile);
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
      { id: 'role', title: '담당 업무와 진행 과정', html: `<p>인턴 기간에 "Isaac Sim을 활용한 드론 자율주행 시뮬레이션 구현 및 학습용 데이터 수집"을 맡았습니다. Isaac Sim, Pegasus Simulator, ROS 2, Cesium 을 활용하여 진행했습니다.</p><p>처음에는 실내에서 장애물을 피하며 비행하는 기본 구조를 구현했습니다. 주변 관측 결과를 복셀 지도에 반영하고, 경로를 계획해 이동한 뒤 다시 관측하도록 연결했습니다. 복셀은 공간을 작은 입방체 단위로 나눈 격자입니다.</p><p>이후 회사의 우선순위에 따라 학습용 데이터 수집 업무를 맡았습니다. 웹 UI에서 수집 작업을 관리하는 파이프라인을 개발하고 운영했으며, 운영 방법을 문서로 정리해 후임에게 인계했습니다.</p>${fig(conceptDrawing(), '웨이포인트와 점유 지도로 회피 경로를 계획하는 개념도' )}` },
      { id: 'collect', title: '학습용 데이터 수집은 어떻게 했나', html: `<p>데이터 수집은 지형을 불러오고, 기체에 카메라를 달고, 정한 경로로 날면서 프레임과 위치 정보를 함께 남기는 세 단계였습니다.</p>${fig(collectDrawing(), '지형 타일 위에서 카메라 범위를 정하고, 판정을 거친 트랙으로 날며 프레임마다 좌표를 남기는 수집 과정 개념도')}<h3>지형 불러오기</h3><p>Isaac Sim 에 Cesium for Omniverse 확장을 켜고 Cesium ion 계정을 연결한 뒤, Photorealistic 3D Tiles 를 스테이지에 올렸습니다. 타일은 화면 공간 오차(Maximum Screen Space Error) 같은 로딩 설정으로 화질과 속도를 맞췄습니다. 기체는 Pegasus Simulator 의 쿼드콥터를 지리 좌표 위에 배치했습니다. 고도는 해발고도와 타원체고의 기준이 다르면 수 미터에서 십수 미터가 어긋나기 때문에, 지형 고도 자료(DEM)에 지오이드고를 더해 타일과 같은 기준으로 맞췄습니다.</p><h3>카메라 설정</h3><p>기체에 카메라를 붙여 수직 아래(nadir)를 보거나 짐벌 각도를 준 상태로 촬영했습니다. 해상도와 초점거리, 프레임 속도를 설정값으로 두었습니다. 정지 촬영은 지면 해상도(GSD)를 고정하고 초점거리를 고도에 맞춰 자동 계산하는 방식이고, 비행 촬영은 반대로 초점거리를 고정하고 GSD 가 고도에 따라 변하는 방식입니다. 정지 촬영의 범위는 해상도에 GSD 를 곱해 계산합니다. 예를 들어 0.25 m/px 에 512 px 이면 한 변이 128 m 입니다.</p><h3>비행과 수집</h3><p>웹 UI 의 곡선 에디터에서 웨이포인트를 찍어 트랙을 만들고, 지면 높이와 비행 고도, 속도, 프레임 속도, 시간대와 날씨를 정했습니다. 비행 전에는 실제 비행과 같은 식으로 궤적을 계산해 수평 가속의 p99 와 수직 속도를 기준으로, 곡률을 참고선으로 두고 안전, 주의, 불가를 판정했고 총 거리와 예상 시간, 프레임 수를 미리 보여 줬습니다. 고도 변화를 짧은 구간에 몰면 수직 속도가 넘어가기 때문에 긴 구간에 나눠 배분하도록 안내했습니다. 비행 중에는 프레임마다 카메라 자세를 기록했고, Cesium 타일에는 물리 충돌이 없어 광선 검사로 지면을 찾을 수 없었기 때문에 카메라 자세와 지형 고도 자료로 각 프레임의 지면 좌표를 계산했습니다. 이 계산은 평지를 가정한 것이라 산등성이가 시야를 가리는 경우까지 반영하지는 못했고, 카메라 기울기가 큰 프레임은 상단 일부를 무효로 표시하거나 좌표를 내지 않도록 했습니다.</p>${fig(flightFlow(), '트랙 작성부터 지면 좌표 계산까지 비행 한 번의 흐름')}<h3>산출물과 검증</h3><p>촬영 이미지와 보정본, 비행 영상에 프레임별 위치와 자세, 촬영 범위를 함께 정리해 전달했습니다. 검증 비행에서는 검은 프레임, 경로와 좌표의 일치 여부, 영상 재생 상태를 확인했습니다.</p>${fig(outputFigure(), '촬영 결과를 전달용 데이터로 정리하고 검증한 과정')}` },
      { id: 'problems', title: '실행 중 생긴 문제와 대응', html: `<h3>관측이 누적되면서 지도가 포화된 문제</h3><p>관측이 누적되면서 지도의 대부분이 장애물이 있는 칸으로 표시돼 경로를 찾지 못했습니다. 오래된 관측의 점유 확률을 서서히 낮추는 감쇠를 적용해 문제를 일부 완화했습니다. 다만 안정적으로 동작하는 조건이 제한적이어서, 당시 구현의 한계와 실험 조건을 문서에 남겼습니다.</p><h3>글로만 주고받은 시각 기준</h3><p>시각적인 요소를 글로만 주고받다 보니 기준이 어긋난 적이 있었습니다. 이를 줄이려고 작은 샘플을 먼저 만들어 보여 주고, 결과를 같이 보며 조건을 맞추는 방식으로 바꿨습니다.</p><h3>화면에 보이는 건물과 물리 충돌의 차이</h3><p>Cesium 타일은 Fabric Scene Delegate 로 그려지는데, Isaac Sim 에서는 이 경로와 PhysX 물리를 동시에 켤 수 없어 건물이 보이기만 하고 충돌하지 않았습니다. 재현 영상을 만들고 <a href="https://forums.developer.nvidia.com/t/cesium-and-isaac-sim-4-1-0/305110/4" target="_blank" rel="noreferrer">NVIDIA 포럼의 공식 답변</a>과 같은 한계를 겪은 공개 사례를 찾아 정리한 뒤, 사실적 렌더링과 물리 기반 회피를 별도 파이프라인으로 분리했습니다. 대안으로는 특정 영역의 타일을 정적 메시로 변환해 물리를 입히는 방법을 검토했습니다.</p>` },
      { id: 'handoff', title: '인수인계 과정', html: `<p>후임이 환경 설정부터 운영까지 따라갈 수 있도록 단일 HTML 매뉴얼을 만들었습니다. 외부 의존성 없이 열 수 있으며, 가이드 7장과 참고 자료 5편, 36단계 체크리스트를 포함했습니다. 이 문서를 바탕으로 5일 온보딩 과정을 설계하고 진행했습니다.</p><table><thead><tr><th>일차</th><th>교육 및 실습 내용</th></tr></thead><tbody><tr><td>1일차</td><td>전체 구조와 주요 파일을 소개하고, Isaac Sim과 Script Editor, Cesium, Pegasus의 역할을 설명했습니다. 스트리밍 클라이언트 설치, VS Code 연동, 컨테이너 접속과 포트 포워딩을 진행한 뒤 Isaac Sim과 UI를 실행했습니다.</td></tr><tr><td>2일차</td><td>트랙을 직접 만들며 UI와 Isaac Sim 사용법을 익히도록 했습니다. 이후 실습 과제를 부여하고, 지형 고도와 좌표 기준(DEM, EGM96, WGS84), 짐벌 등 관련 용어를 설명했습니다.</td></tr><tr><td>3~4일차</td><td>개별 과제를 수행했습니다.</td></tr><tr><td>5일차</td><td>과제를 수행하고 검증용 테스트를 진행했습니다.</td></tr></tbody></table><p>교육과 과제 수행을 마친 뒤 인수인계를 마무리했습니다.</p>` },
    ],
    gaps: '감쇠를 적용한 뒤에도 지도 포화 문제는 일부 남았습니다. 조건을 바꿔 가며 경로 성공률을 반복 측정하지 못했기 때문에, 적용 범위와 안정성을 충분히 검증하지는 못했습니다. 추가 실험에서는 조건별 경로 성공률을 반복 측정할 계획입니다.',
    thumb: { src: 'media/drone/cover_voxel.jpg', alt: '드론 자율주행 복셀 장면(생성 이미지)' }
  });
})();
