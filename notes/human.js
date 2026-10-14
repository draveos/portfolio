/* 노트: 짧은 브리프 실험(If I were to be a human). 이 파일만 고치면 됩니다. 계약은 notes/README.md 참고.
   캡처: media/shots/vfx_sontae.png(1280×720), vfx_codex.jpg, vfx_claude_tree.jpg(1440×900 png 를 jpg 품질 82 로), vfx_office.png.
   media/human/sontae_touch.jpg, sontae_fork.jpg 는 ~/IdeaProjects/if_i_were_human/shots/final_2_s2_touch.png, final_4_s4_fork.png 를 jpg 품질 82 로 바꾼 것(자작 출품작 캡처).
   점수 출처: 사용자 채점 8.5/8.4/8.1/7.6 은 2차 기록 3곳, 상호 심사 8.7/8.3/7.4 는 vfx_hackathon/JUDGING_claude.md. 조건 표는 work/dossier_experiments.md 2-2 절. */
(function () {
  const CRITERIA = '보기 좋은가, 복잡한가, 창의적인가, 거슬리는 요소가 없는가, 틀 밖 사고, 기술력, 사람이 좋아할까, AI 가 만든 웹처럼 보이면 감점';

  window.NOTES.push({
    id: 'human',
    order: 60,
    title: '한 단락짜리 주제를 다섯 방식으로 만들면',
    summary: '"If I were to be a human" 한 단락과 1시간 상한을 다섯 제작 방식에 주고, 기준 8개로 채점했습니다.',
    topic: '에이전트',
    category: '실험',
    date: '2026.10.12',
    tools: ['Claude Code', 'Codex CLI', 'Agent Office', '사용자 심사'],
    tag: '짧은 브리프 실험',
    hero: { src: 'media/human/cover_gen.jpg', alt: '콘셉트 조각들이 다섯 제작 방식을 거쳐 서로 다른 작품이 되는 장면(생성 이미지)', caption: '한 단락 주제를 다섯 방식에 준 실험을 그린 생성 이미지입니다. 실제 작품은 아래 캡처와 버튼에 있습니다.' },
    shots: [
      { src: 'media/human/sontae_cover.jpg', alt: '손때 첫 화면. 회벽 질감 위에 제목과 소개 글', caption: '1등 「손때」의 첫 화면(8.5).' },
      { src: 'media/shots/vfx_codex.jpg', alt: 'Codex 출품작 화면', caption: 'Codex 출품작(8.4).' },
      { src: 'media/human/claude_cover.jpg', alt: 'Claude 단독 「한 번뿐인 실행」의 첫 장면, 별빛 궤도 위의 문장', caption: 'Claude 단독 「한 번뿐인 실행」(8.1). 별빛 궤도 위에 한 줄씩 문장이 쌓입니다.' },
      { src: 'media/shots/vfx_office.png', alt: 'Agent Office 출품작 「말로만 본 창밖」 화면', caption: 'Agent Office 「말로만 본 창밖」(7.6).' },
      { src: 'media/human/sontae_touch.jpg', alt: '햇빛 자리 안에 손때 자국과 네 줄 문장이 있는 손때 장면', caption: '손때 4,000번째 아침. 커서가 지나간 자리가 지워지지 않는 자국으로 남습니다.' }
    ],
    meta: { period: '2026.10.12 저녁, 제작 상한 1시간', role: '브리프 작성, 주최, 채점', members: '1인(참가 5팀은 AI 시스템)', env: '로컬 브라우저 1440 과 390 폭' },
    points: {
      shows: '같은 주제를 다섯 제작 방식에 맡기고 웹 결과물을 직접 평가했습니다.',
      why: '자유도가 높은 과제에서 제작 방식에 따라 어떤 차이가 생기는지 궁금했습니다.',
      matters: '검수와 수정 단계를 거친 작품의 점수가 높았습니다. 다만 1인 1회 평가이며 작업 조건도 달랐습니다.'
    },
    summary60: [
      '브리프 <b class="num">1,562자</b>, 과제 원문은 한 단락, 제작 상한 <b class="num">1시간</b>',
      '참가 <b class="num">5팀</b>, 심사 기준 <b class="num">8개</b> 사전 공개, 심사자 1인 10점 만점',
      '사용자 점수 <b class="num">8.5 / 8.4 / 8.1 / 7.6</b>, Gemini 논외',
      '1등 손때는 서브에이전트 <b class="num">10개</b>에 콘셉트 패널 <b class="num">4개</b>, <b class="num">49분</b>',
      '출발 시각이 <b class="num">20:12</b> 부터 <b class="num">21:03</b> 까지 달라 같은 조건의 순위 비교는 어렵습니다'
    ],
    sections: [
      {
        id: 'setup', title: '조건',
        html: `<p>주제 한 단락과 감점용 레퍼런스 한 단락만 주고, 세 페이지(index, main, credit)를 만들게 했습니다. 심사는 main 만 봤습니다.</p><table><thead><tr><th>항목</th><th>값</th></tr></thead><tbody><tr><td>과제</td><td>"If I were to be a human" 웹 작품. 제작 상한 1시간, 회의 시간은 제외</td></tr><tr><td>입력</td><td>브리프 1,562자. 참고 자료 없음, 검색 허용</td></tr><tr><td>규칙</td><td>외부 이미지 허용, 이미지 생성 API 금지, 1440 과 390 폭 넘침 0</td></tr><tr><td>심사</td><td>사용자 1인, 10점 만점. 기준 8개 사전 공개: ${CRITERIA}</td></tr><tr><td>참가</td><td>Claude 단독, Codex CLI, Agent Office 디자인팀, Gemini(웹), 손때(별도 Claude 세션과 서브에이전트)</td></tr><tr><td>출발과 소요</td><td>Claude 단독 20:12 부터 13분, 뒤에 6분 보강. Codex 20:12 부터 42분. Office 20:18 부터 약 25분. Gemini 미상. 손때 21:03 부터 49분</td></tr></tbody></table><p>세 팀이 먼저 작업했고 출발 시각에도 차이가 있었습니다. 손때는 다른 결과를 본 뒤 출발했고, Claude 단독은 제 피드백을 받은 뒤 보강했습니다.</p>`
      },
      {
        id: 'result', title: '결과',
        html: `<table><thead><tr><th>출품작</th><th>제작 방식</th><th>사용자 점수</th><th>상호 심사(참고)</th></tr></thead><tbody><tr><td>손때</td><td>Claude 세션 하나, 서브에이전트 병렬</td><td>8.5</td><td>8.7</td></tr><tr><td>A life not yet lived</td><td>Codex CLI 단독</td><td>8.4</td><td>8.3</td></tr><tr><td>한 번뿐인 실행</td><td>Claude 단독</td><td>8.1</td><td>자기 출품작, 제외</td></tr><tr><td>말로만 본 창밖</td><td>Agent Office 디자인팀</td><td>7.6</td><td>7.4</td></tr><tr><td>Echoes of Sentience</td><td>Gemini 웹</td><td>논외</td><td>보류</td></tr></tbody></table><p>상호 심사 열은 Claude 단독 세션이 다른 팀을 채점한 값이라 참가자 겸 심사자의 참고치입니다. Gemini 는 index 와 credit 없이 main 만 내서 두 심사 모두 논외로 두었습니다.</p>${comparison(['vfx_sontae.png', 'vfx_codex.jpg', 'vfx_claude_tree.jpg', 'vfx_office.png'], ['손때(Claude 협업)', 'Codex', 'Claude 단독', 'Agent Office'])}`
      },
      {
        id: 'open', title: '직접 열어 보기',
        html: '<p>다섯 작품을 그대로 옮겨 두었습니다. 새 창으로 열리고, 글꼴 외에는 외부 의존이 없습니다.</p>'
          + '<p class="link-row"><a href="demo/vfx/sontae/main.html" target="_blank" rel="noreferrer">손때 (Fable 5.1, 서브에이전트 14) ↗</a> <a href="demo/vfx/codex/main.html" target="_blank" rel="noreferrer">Codex (GPT 6.1 Astra) ↗</a> <a href="demo/vfx/claude/main.html" target="_blank" rel="noreferrer">Fable 5.1 단독 ↗</a> <a href="demo/vfx/office/main.html" target="_blank" rel="noreferrer">Agent Office (Fable 5.1 세션) ↗</a> <a href="demo/vfx/gemini/index.html" target="_blank" rel="noreferrer">Gemini 3.1 Pro ↗</a></p>'
      },
      {
        id: 'why', title: '손때는 왜 높았나',
        html: `<p>손때는 세션 하나가 서브에이전트 10개를 단계별로 띄웠습니다. 먼저 셰이더, 문구, 장면 조립, 소개 페이지를 네 작업으로 나눴습니다. 통합 후에는 시각적 완성도, 창의성, 기술을 각각 검수하고, 수정과 최종 확인을 거쳤습니다. 그 앞에 콘셉트 패널(제안 3, 심사 1)이 안을 고르고 22KB 사양 파일로 적어 두었습니다. 제작을 시작할 때 참고한 사양이 다른 팀보다 구체적이었습니다.</p><p>검수 단계의 내부 점수는 시각적 완성도 6.5, 창의성 7, 기술 7 이었고, 수정 뒤 사용자 점수가 8.5 였습니다. 평가자와 기준이 달라서 검수가 점수를 올렸다는 인과까지는 이 실험으로 말할 수 없습니다. 다만 Claude 단독 세션은 회고에 "장면 수를 늘리는 데 시간을 썼고 하나를 깊게 가지 않았다"고 적었습니다. 이번에는 하나의 상호작용에 집중하고 검수와 수정을 거친 작품이 더 높은 점수를 받았습니다. 쓴 시간도 49분과 19분으로 달랐습니다.</p>`
      },
      {
        id: 'boundary', title: '자세한 명세를 준 실험과 비교',
        html: `<p>다음 날 220줄 명세를 다섯 시스템(손때 대신 Claude ultra 가 들어간 Claude 둘, Codex, Gemini, Agent Office)에 준 <a href="#note/voxel">실험 2</a>에서는 단일 에이전트 넷이 실행 도구 유무와 관계없이 수용 기준을 다 채웠습니다. 이번 두 실험에서는 상세 명세를 받은 단일 에이전트들이 기준을 충족했고, 짧은 브리프에서는 검수와 수정을 거친 작품이 가장 높은 점수를 받았습니다. 다만 Agent Office는 두 실험 모두 다른 참가팀보다 낮은 평가를 받았습니다. 협업 여부만으로 결과를 설명하기는 어려우며, 검수 방식의 효과도 같은 조건에서 다시 비교할 필요가 있습니다.</p>`
      }
    ],
    gaps: '심사자는 저 혼자였고 한 번만 평가했으며, 출발 시각도 팀마다 달랐습니다. 다음에는 같은 시각에 출발시키고 심사자를 둘 이상 둘 계획입니다. 손때는 아직 로컬에서만 열리고 레포도 공개 전입니다.',
    thumb: { src: 'media/human/cover_gen.jpg', alt: '콘셉트 조각들이 다섯 제작 방식을 거쳐 서로 다른 작품이 되는 장면(생성 이미지)' }
  });
})();
