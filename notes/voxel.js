/* 노트: 자세한 명세 실험(VoxelBench REPRO-001). 이 파일만 고치면 됩니다. 계약은 notes/README.md 참고.
   근거: work/dossier_experiments.md 1-B 와 2-3 절, assets/data/JUDGING_voxelbench_4a.md,
   vfx_hackathon/voxelbench/ 의 REPRO-001_prompt.txt, claude/NOTES.md, office/report.md, qa/GEMINI_QA_요지.md, ANSWERS.md 1번과 5번.
   Office 소요는 agent_office/data/queue.jsonl 의 createdAt 12:38:38, endedAt 12:56:30 (17분 52초) 실측.
   캡처 4장은 media/shots/voxelbench_*.png (1440×900, 심사 때 Chromium 에서 찍은 자체 캡처). Claude ultra 캡처는 없습니다. */
(function () {
  var shot = assets + 'voxelbench_claude.png';

  window.NOTES.push({
    id: 'voxel',
    order: 50,
    title: '같은 사양으로 만든 탑은 얼마나 같을까?',
    summary: '220줄 사양을 다섯 시스템에 주고, 체크리스트 7항목으로 확인했습니다.',
    topic: '에이전트',
    category: '실험',
    date: '2026.10.13',
    tools: ['Three.js', 'Node.js', '체크리스트 심사'],
    tag: '자세한 명세 실험',
    badge: '개인 비교 실험',
    shots: [
      { src: shot, alt: '복셀 탑 정원의 기본 시점. 5층 탑과 금색 첨탑, 분홍 벚나무', caption: 'Claude 단독 산출물의 기본 시점. 사양이 정한 카메라 위치 그대로입니다.' }
    ],
    hero: { src: 'media/voxel/cover_gen.jpg', alt: '명세서 더미에서 다섯 제작 방식으로 같은 탑이 세워지는 장면(생성 이미지)', caption: '같은 명세를 다섯 시스템에 준 실험을 그린 생성 이미지입니다. 실제 산출물은 아래 캡처에 있습니다.' },
    links: [
      { label: 'Claude 산출물 열어 보기', href: 'demo/voxel/claude/index.html', kind: 'live' }
    ],
    meta: { period: '2026.10.13', role: '실험 진행과 결과 정리', members: '1인', env: 'Chromium 1440×900' },
    points: {
      shows: '다섯 시스템이 만든 복셀 정원을 220줄 사양과 체크리스트 7항목으로 점검했습니다.',
      why: "같은 명세를 줬을 때 단일 에이전트와 협업 시스템의 구현 차이를 확인했습니다.",
      matters: '단일 에이전트 넷은 7/7, Office는 6/7이었습니다. 이후 Office에 자기 점검표를 추가했습니다.'
    },
    summary60: [
      '체크리스트 <b class="num">7</b>항목, 단일 에이전트 넷 <b class="num">7/7</b>, Office <b class="num">6/7</b>',
      'Office 는 꽃잎 색으로 <b class="num">1</b>항목 감점, 두 파일 조건도 어겨 <b class="num">3</b>파일',
      '사양 <b class="num">220</b>줄, 카메라와 조명, 좌표를 숫자로 고정',
      '참가 <b class="num">5</b>팀, 심사자 <b class="num">1</b>인이 Chromium 에서 <b class="num">1</b>회 확인',
      'Claude <b class="num">3분</b>, ultra <b class="num">35분</b>, Office <b class="num">18분</b>(회의 포함)'
    ],
    sections: [
      { id: 'setup', title: '실험 조건', html: `<table><thead><tr><th>항목</th><th>내용</th></tr></thead><tbody><tr><td>과제</td><td>VoxelBench REPRO-001. Three.js 복셀 탑 정원 한 장면을 웹 페이지로 만듭니다.</td></tr><tr><td>사양</td><td>220줄(12,430바이트). A부터 T까지 20개 절이 카메라, 조명, 팔레트, 좌표, 애니메이션 수치를 고정합니다. 산출물은 index.html 과 server.js 두 파일뿐이고 npm 과 package.json 은 금지입니다.</td></tr><tr><td>수용 기준</td><td>사양의 수용 기준 5항목을 세분화해 심사표 7항목으로 정리했습니다. 기본 시점을 탑과 입자로 나누고 독립 재현을 더했습니다.</td></tr><tr><td>참가</td><td>5팀. 설정은 결과 표에 적었습니다.</td></tr><tr><td>심사</td><td>2026-10-13, Chromium 1440×900, 산출물마다 1회 확인. 심사자는 Claude 단독 세션이라 참가자이기도 합니다.</td></tr><tr><td>측정 한계</td><td>반복 없음. 시간은 기록이 있는 팀만 적고, 비용과 창의성은 비교하지 않았습니다.</td></tr></tbody></table>` },
      { id: 'results', title: '결과', html: `<table><thead><tr><th>참가</th><th>설정</th><th>소요(기록)</th><th>체크리스트</th></tr></thead><tbody><tr><td>Claude</td><td>단독, 실행 가능</td><td>3분</td><td>7 / 7</td></tr><tr><td>Claude ultra</td><td>별도 세션</td><td>약 35분</td><td>7 / 7</td></tr><tr><td>Codex</td><td>CLI</td><td>기록 없음</td><td>7 / 7</td></tr><tr><td>Gemini</td><td>웹, 실행 도구 없음</td><td>기록 없음</td><td>7 / 7</td></tr><tr><td>Agent Office</td><td>coding 워크플로, Bash 없음</td><td>약 18분(회의 포함)</td><td>6 / 7</td></tr></tbody></table>${comparison(['voxelbench_claude.png', 'voxelbench_gemini.png', 'voxelbench_codex.png', 'voxelbench_office.png'], ['Claude', 'Gemini', 'Codex', 'Agent Office'])}<p>네 장의 기본 시점이 거의 같습니다. 사양이 카메라 위치와 좌표를 숫자로 고정했기 때문입니다. Claude ultra 는 캡처를 남기지 않았습니다.</p><p>Office 는 꽃잎이 분홍색이 아니라 검은 점으로 보였습니다(ACC-005). 산출물도 두 파일이 아니라 package.json 을 포함한 세 파일이었습니다. Office 는 보고서에 실행 확인 0회를 스스로 적었습니다. 반면 Gemini 는 실행 도구 없이도 7 / 7 을 냈고, 틀렸을 가능성이 있는 곳 3군데를 함께 보고했습니다.</p>` },
      {
        id: 'open', title: '직접 열어 보기',
        html: '<p>다섯 산출물을 그대로 옮겨 두었습니다. three.js 는 CDN 에서 받습니다. 사양에 지정된 좌표와 색상이 결과물에 어떻게 반영됐는지 비교할 수 있습니다.</p>'
          + '<p class="link-row"><a href="demo/voxel/claude/index.html" target="_blank" rel="noreferrer">Fable 5.1 high ↗</a> <a href="demo/voxel/claude_ultra/index.html" target="_blank" rel="noreferrer">Fable 5.1 ultra ↗</a> <a href="demo/voxel/codex/index.html" target="_blank" rel="noreferrer">Codex (GPT 6.1 Astra) ↗</a> <a href="demo/voxel/gemini/index.html" target="_blank" rel="noreferrer">Gemini 3.1 Pro ↗</a> <a href="demo/voxel/office/index.html" target="_blank" rel="noreferrer">Agent Office (Fable 5.1 세션) ↗</a></p>'
      },
      { id: 'conclusion', title: '확인한 점과 후속 조치', html: `<ol><li>이번 과제에서는 네 팀이 7 / 7을 충족했고 기본 화면도 거의 같았습니다.</li><li>이 과제 범위에서는 3분 걸린 쪽과 35분 걸린 쪽의 결과가 같았습니다. 상세 명세가 있는 비슷한 과제에서는 간단한 제작 방식부터 시험해 볼 근거가 됐습니다. 다른 과제에서도 같을지는 확인하지 않았습니다.</li><li>실행 없이도 통과할 수 있었습니다. Gemini 는 코드를 읽어 점검하고 틀렸을 곳 3군데를 적어 냈습니다. 다만 이 결과만으로 자기 점검이 실행 검증을 대신할 수 있다고 보기는 어렵습니다.</li><li>Office 는 꽃잎 색으로 한 항목을 잃었고, 두 파일 조건도 어겼습니다. 당시에는 산출물을 실행해 확인하는 단계도 없었습니다. 이것이 두 오류의 유일한 원인인지는 확인하지 못했습니다. 그래서 회의 전 자기 점검표(BUILD_CHECK.md)를 모든 워크스페이스에 넣었고, 검증팀의 스크립트 실행은 기존 규칙을 그대로 적용했습니다. 참석자에게 실행 권한을 주지는 않았습니다.</li><li>화면이 같다는 것과 체크리스트를 통과했다는 것은 다른 주장입니다. 이 실험에서는 사양 준수 여부를 평가했습니다.</li></ol>` },
      { id: 'relation', title: '실험 1과의 관계', html: `<p><a href="#note/human">실험 1</a>은 한 단락짜리 주제를 주었고, 검수 루프를 공정 안에 둔 팀이 가장 높은 점수(8.5)를 받았습니다. 실험 2는 220줄 사양을 주었고, 실행 여부와 상관없이 단일 에이전트가 모두 통과했습니다. 이를 보고 자유도가 높은 과제에서 검수와 수정의 효과가 더 클 수 있다는 가설을 세웠습니다. 상세 명세에서 검증이 불필요하다는 뜻은 아닙니다. 두 실험 모두 심사자 1인이 1회 평가했으므로, 제작 방식의 우열을 결론 내리려면 조건을 맞춘 반복 실험이 필요합니다.</p>` }
    ],
    gaps: '반복 측정은 하지 않았고, 심사자 1인이 참가자이기도 했습니다. Codex 와 Gemini 의 소요 시간은 같은 기준의 기록이 없어 비교하지 않았습니다. 다음에는 사양의 절을 하나씩 빼 가며 어떤 조건에서 결과가 달라지는지 확인할 계획입니다.',
    thumb: { src: 'media/voxel/cover_gen.jpg', alt: '명세서 더미에서 다섯 제작 방식으로 같은 탑이 세워지는 장면(생성 이미지)' }
  });
})();
