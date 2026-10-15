/* 노트: seminar_pipeline (논문 → 한국어 세미나 자료 폴더). 이 파일만 고치면 됩니다. 계약은 notes/README.md 참고.
   근거: ~/IdeaProjects/seminar_pipeline README.md, outputs/ 17건(2026-04-23 ~ 05-28), 코드 1,422줄(app 559, llm 669, extract 138, seminar 56).
   캡처: media/seminar/ui_summary.jpg, ui_concepts.jpg (2026-10-14 로컬 8765 에서 공개 논문 "Attention Is All You Need" 결과를 연 화면).
   회사 자료(세미나 템플릿, 발표 파일)는 싣지 않습니다. 데모는 로컬 전용이라 링크 없음. */
(function () {
  window.NOTES.push({
    id: 'seminar',
    order: 45,
    title: '논문 한 편을 세미나 자료 한 폴더로',
    summary: 'arXiv 링크나 PDF 하나를 넣으면 한국어 요약, 핵심 정리, 슬라이드 목차, 개념 시각화, 수식 풀이를 한 폴더에 만들어 주는 로컬 도구입니다.',
    topic: '에이전트',
    category: '프로젝트',
    date: '2026.04–05',
    tools: ['Python', 'FastAPI', 'Claude CLI', 'KaTeX'],
    tag: 'Seminar Pipeline',
    hero: { src: 'media/seminar/cover_voxel.jpg', alt: '논문 더미가 요약기와 컨베이어를 지나 슬라이드와 요약 묶음이 되는 복셀 장면(생성 이미지)', caption: '세미나 파이프라인을 그린 생성 이미지입니다. 실제 화면은 아래 캡처에 있습니다.' },
    shots: [
      { src: 'media/seminar/ui_concepts.jpg', alt: '세미나 파이프라인 웹 화면. 개념 시각화 탭과 query 슬라이더', caption: '공개 논문 "Attention Is All You Need" 로 만든 개념 시각화 탭. 슬라이더로 query 위치를 바꾸면 attention 가중치 막대가 따라 움직입니다.' },
      { src: 'media/seminar/ui_summary.jpg', alt: '요약 탭. TL;DR 과 문제 정의, 핵심 아이디어 절이 한국어로 정리된 화면', caption: '요약 탭. TL;DR 뒤에 문제 정의, 핵심 아이디어, 방법, 결과 순으로 7개 절이 생깁니다.' }
    ],
    meta: { period: '2026.04–05', role: '설계와 구현 전부', members: '1인', env: '로컬 macOS, Claude CLI 구독 또는 API 키' },
    points: {
      shows: '논문 한 편을 발표 자료 묶음으로 바꾸는 파이프라인을 만들고 자료 17건을 생성한 기록입니다.',
      why: '세미나 8회를 준비하며 매번 반복하던 초안 작성 작업을 줄이고 싶었습니다.',
      matters: '산출물별 파일 저장과 생성 진행 상황을 보여 주는 스트리밍 UI를 구현했습니다.'
    },
    summary60: [
      '입력 <b class="num">4</b>종(arXiv, PDF, 블로그 URL, 이미지)에서 산출물 <b class="num">5</b>종을 한 폴더로',
      '자료 생성 기록 <b class="num">17</b>건(2026.04.23 ~ 05.28), 코드 <b class="num">1,422</b>줄',
      '요약은 TL;DR 과 <b class="num">7</b>개 절, 슬라이드 목차는 <b class="num">12~15</b>장 구조',
      '발표자 노트는 슬라이드 PDF 를 올리면 페이지 <b class="num">1:1</b> 로 맞춰 생성',
      '로컬 전용, 배포 전. Claude CLI 구독으로 돌고 API 키가 있으면 자동 전환'
    ],
    sections: [
      {
        id: 'what', title: '무엇을 만들었나',
        html: '<p>arXiv 주소나 PDF 경로, 블로그 URL, 이미지 중 하나를 넣으면 폴더 하나가 생깁니다. 안에는 한국어 종합 요약, Q&amp;A 대비 핵심 정리, 추천 슬라이드 목차, 핵심 개념 시각화 HTML, 수식 단계별 유도 HTML 이 들어가고, 발표자 노트는 필요할 때 따로 만듭니다.</p>'
          + '<table><thead><tr><th>산출물</th><th>형식</th><th>내용</th></tr></thead><tbody>'
          + '<tr><td>요약</td><td>md</td><td>TL;DR 과 문제 정의, 아이디어, 방법, 결과, 한계, 관련 연구, 시사점</td></tr>'
          + '<tr><td>핵심 정리</td><td>md</td><td>개념, 예상 질문, 수식, 직관, 흔한 오해</td></tr>'
          + '<tr><td>슬라이드 목차</td><td>md</td><td>12~15장 구조와 장별 한 줄</td></tr>'
          + '<tr><td>개념 시각화</td><td>html</td><td>KaTeX 수식과 Canvas, SVG 로 만든 조작 가능한 그림</td></tr>'
          + '<tr><td>수식 풀이</td><td>html</td><td>변수 색을 맞춘 단계별 유도 카드</td></tr>'
          + '<tr><td>발표자 노트</td><td>md</td><td>추천 목차 기준, 또는 실제 슬라이드 PDF 페이지에 1:1</td></tr>'
          + '</tbody></table>'
      },
      {
        id: 'how', title: '어떻게 돌아가나',
        html: '<p>입력 종류를 자동으로 알아내 본문을 뽑고(arXiv API, pypdf, trafilatura), 산출물마다 다른 프롬프트로 Claude 를 부릅니다. API 키가 있으면 API를 사용하고, 없으면 Claude CLI로 실행합니다. API 경로에서는 adaptive thinking을 사용하며, 이미지 입력도 API 경로에서만 지원합니다. 응답은 SSE로 전달합니다. 마크다운은 생성되는 대로 화면에 표시하고, HTML은 진행률을 보여 준 뒤 iframe에서 엽니다.</p>'
          + '<p>모든 결과는 평범한 md 와 html 파일이라 Finder 에서 열고 고치고 복사할 수 있습니다. 분량은 자동, 짧게, 보통, 길게 네 단계이고 자동은 입력 길이에 맞춰 정합니다.</p>'
      },
      {
        id: 'used', title: '실제로 쓴 결과',
        html: '<p>2026년 4월 23일부터 5월 28일까지 자료 17건을 생성한 기록이 있습니다. Attention Is All You Need와 DDPM 같은 공개 논문을 다뤘으며, 위 화면은 Attention 논문의 결과입니다. 이 도구로 만든 초안을 다듬어 세미나 8회를 준비했습니다. 발표 자료 자체는 싣지 않습니다.</p>'
      },
      {
        id: 'next', title: '배포 상태와 다음',
        html: '<p>현재는 로컬에서만 사용합니다. 제 Claude CLI 구독을 사용하는 구성이라 다른 사람이 접속해 쓰는 서비스로 배포하지 않았습니다. 공개하려면 API 키 모드로 고정하고 호스팅과 사용량 제한을 붙여야 합니다. 그 전까지는 화면 캡처로만 보여 드립니다.</p>'
      }
    ],
    thumb: { src: 'media/seminar/cover_voxel.jpg', alt: '세미나 파이프라인 복셀 장면(생성 이미지)' }
  });
})();
