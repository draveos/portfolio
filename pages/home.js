/* 홈 문구. 3D 조립 영역의 마크업은 app.js 의 home() 이 그리고, 글자만 여기서 바꿉니다.
   chapters 는 topic 기준으로 노트를 묶습니다(위치 의존 없음). kind 는 CSS 색 틴트용(exaone, drone, office).
   desc 는 esc() 를 거치므로 HTML 을 쓰지 않습니다. 에이전트 장의 링크 목록은 topic '에이전트' 노트 전부(draft 제외)가 자동으로 들어갑니다. */
window.PAGES = window.PAGES || {};
window.PAGES.home = {
  hero: {
    eyebrow: 'KIM SEJIN / PORTFOLIO',
    title: '모델 경량화부터<br>에이전트 설계까지.',
    description: '제약 있는 환경에서 성능과 구조를<br class="desktop-break"> 같이 고민해 온 AI 전공자입니다.',
    ctaLabel: 'About me',
    ctaHref: '#about',
    sceneLabel: '에이전트의 작업 분배와 검증, 수정 루프, 드론의 조립, Claude의 채색, Codex의 유체 그라디언트, Gemini의 2D 빛 심벌 모션입니다.'
  },
  chaptersTitle: '세 분야의 프로젝트',
  chaptersEyebrow: '2026 / SELECTED WORK',
  chapters: [
    { n: '01', kind: 'exaone', topic: '모델', title: '모델 경량화', desc: '레이어 30개의 양자화 민감도를 측정하고, 일부 모듈을 8비트로 남겨 1.2B 모델을 경량화했습니다. 점수는 0.596에서 0.624로 올랐습니다.', en: 'MODEL OPTIMIZATION', lead: 'exaone', metric: '1.49 → 1.37', unit: 'GB / 모델 크기' },
    { n: '02', kind: 'drone', topic: '드론', title: '드론 자율주행', desc: '시뮬레이터의 3D 공간을 복셀 지도로 바꾸고, 드론이 지정한 지점까지 장애물을 피해 가도록 구현했습니다. 실행 중 생긴 문제와 운영 방법을 문서로 정리해 인계했습니다.', en: 'ROBOTICS', lead: 'drone', metric: '5', unit: 'DAYS / 온보딩 커리큘럼' },
    { n: '03', kind: 'office', topic: '에이전트', title: '에이전트 시스템', desc: '협업 시스템 Agent Office, 개인 컴패니언 Flora, 보드게임 실험 환경 Quoridor Arena를 만들었습니다. 단일 에이전트와 협업 시스템에 같은 과제를 맡긴 비교 실험 2편도 함께 정리했습니다.', en: 'AGENT SYSTEMS', lead: 'office', thumb: { src: 'media/office/agents_iso.jpg', alt: '흰 바닥 위 복셀 사무실에서 에이전트들이 뛰어다니는 장면(생성 이미지)' }, metric: notes => String(notes.length), unit: 'NOTES / 구현과 비교' }
  ]
};
