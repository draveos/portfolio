/* About me 페이지. window.PAGES.about = () => html. 이 파일만 고치면 됩니다.
   사실 근거: work/dossier_experiments.md §1-D, §4, dossier_flora.md §0, OUTLINE.md 3쪽과 13쪽. 순위와 횟수는 OUTLINE.md(이력 개요) 기준이고 증빙 파일은 싣지 않았습니다. 연락처는 사용자 결정 전이라 칸을 뺐습니다(2026-10-14).
   2026-10-14 다듬기: Tech stack 은 분야별 묶음 카드와 아이콘(media/icons, Simple Icons CC0, 출처는 media/icons/LICENSE.md)으로, 로드맵 항목에는 기관 로고(media/logos, 출처는 media/logos/SOURCES.md)를 붙였습니다.
   로드맵의 스크롤 점등(is-lit)은 app.js 의 revealRoadmap() 이 맡고, 스타일은 project.css 끝의 "About 다듬기" 절에 있습니다. */
window.PAGES = window.PAGES || {};
window.PAGES.about = () => {
  // 아이콘은 media/icons/<slug>.svg 를 <use> 로 불러 currentColor 로 칠한다. slug 가 없으면 이니셜 모노그램.
  const icon = slug => `<svg class="stack-icon" viewBox="0 0 24 24" aria-hidden="true"><use href="media/icons/${slug}.svg#i"></use></svg>`;
  const mono = initials => `<span class="stack-mono" aria-hidden="true">${initials}</span>`;
  const groups = [
    { key: 'model', title: '모델', note: '학습, 양자화, 데이터 처리', items: [['Python', 'python'], ['PyTorch', 'pytorch'], ['Transformers', 'huggingface'], ['scikit-learn', 'scikitlearn'], ['Pandas', 'pandas'], ['NumPy', 'numpy'], ['Matplotlib', null, 'Mp']] },
    { key: 'robot', title: '로보틱스', note: '시뮬레이션과 자율주행', items: [['Isaac Sim', null, 'Is'], ['Pegasus', null, 'Pg'], ['ROS 2', 'ros'], ['CesiumJS', 'cesium']] },
    { key: 'web', title: '웹과 에이전트', note: '화면, 서버, 에이전트 도구', items: [['TypeScript', 'typescript'], ['React', 'react'], ['Vite', 'vite'], ['Tailwind CSS', 'tailwindcss'], ['Three.js', 'threedotjs'], ['Node.js', 'nodedotjs'], ['FastAPI', 'fastapi'], ['Claude Code', 'claude']] },
    { key: 'tool', title: '도구', note: '버전 관리, 저장소, 디자인', items: [['Git', 'git'], ['GitHub', 'github'], ['MySQL', 'mysql'], ['SQLite', 'sqlite'], ['Figma', 'figma'], ['Vercel', 'vercel']] }
  ];
  const stack = groups.map(g => `<section class="stack-group" data-group="${g.key}"><h3>${g.title}<span>${g.note}</span></h3><ul class="stack-items">${g.items.map(([name, slug, initials]) => `<li>${slug ? icon(slug) : mono(initials)}<span>${name}</span></li>`).join('')}</ul></section>`).join('');

  // 시간순. link 는 [해시, 라벨], ext 는 [외부 주소, 라벨]. logo 는 { src, w, h, height } 또는 { text }(로고를 못 받은 경우 글자 워드마크).
  const roadmap = [
    { time: '2021.03 — 2027.02', kind: 'EDUCATION', title: '중앙대학교 AI학과', text: '2027년 2월 졸업 예정입니다.', logo: { src: 'media/logos/cau-logo.png', w: 213, h: 54, height: 34 } },
    { time: '2022.01 — 2022.02', kind: 'PEER LEARNING', title: '42서울 La Piscine', text: '6기 2차 교육에 참여해 C 언어 과제와 동료 평가, 그룹 프로젝트를 했습니다.', small: '2022.01.31 — 02.25, 4주', logo: { src: 'media/logos/42seoul-logo.svg', w: 2392, h: 1383, height: 46 } },
    { time: '2026.01 — 2026.02', kind: 'MODEL OPTIMIZATION', title: 'LG Aimers 8기', text: '2인 팀에서 양자화 전략과 실험을 맡았습니다. 레이어별 민감도를 측정하고 일부 모듈을 8비트로 보호하는 혼합 정밀도 전략을 적용해, 팀 리더보드 72위를 기록했습니다.', link: ['#note/exaone', 'EXAONE 실험 기록'], logo: { src: 'media/logos/lgaimers-logo.svg', w: 699, h: 111, height: 22 } },
    { time: '2026.03 — 2026.08', kind: 'RESEARCH INTERNSHIP / 6 MONTHS', title: '마인드포지 연구소 인턴연구원', text: '드론 자율주행 파이프라인과 운영 UI를 구현하고, 후임을 위한 인수인계 자료를 정리했습니다.', link: ['#note/drone', '드론 과제 보기'], ext: ['https://mindforge.kr/', '회사 소개'], cls: 'internship', logo: { src: 'media/logos/mindforge-logo2.png', w: 355, h: 73, height: 40 } },
    { time: '2026.04 — 2026.08', kind: 'INDEPENDENT PROJECT', title: 'Flora', text: '대화를 기억하고 먼저 말을 거는 개인 컴패니언을 만들었습니다. 웹, 터미널, 메뉴바 앱이 같은 백엔드에 연결됩니다.', small: '커밋 295', link: ['#note/flora', '설계 기록 보기'], logo: { src: 'media/logos/flora-wordmark.svg', w: 92, h: 32, height: 32 } },
    { time: '2026.08 — 현재', kind: 'INDEPENDENT PROJECT', title: 'Agent Office', text: '에이전트 11명이 기획, 구현, 검토를 나눠 맡는 시스템을 설계해 운영하고 있습니다. 단일 에이전트와 결과를 비교한 실험 2편을 정리했습니다.', link: ['#note/office', '설계와 검증 기록'], logo: { src: 'media/logos/office-wordmark.svg', w: 156, h: 32, height: 32 } }
  ].map(r => {
    const logo = !r.logo ? '' : r.logo.src
      ? `<span class="roadmap-logo" aria-hidden="true"><img src="${r.logo.src}" alt="" width="${r.logo.w}" height="${r.logo.h}" style="--logo-h:${r.logo.height}px" decoding="async"></span>`
      : `<span class="roadmap-logo roadmap-logo-text" aria-hidden="true">${r.logo.text}</span>`;
    return `<li${r.cls ? ` class="${r.cls}"` : ''}><time>${r.time}</time><div class="roadmap-body">${logo}<span class="timeline-kind">${r.kind}</span><h3>${r.title}</h3><p>${r.text}</p>${r.small ? `<small>${r.small}</small>` : ''}${r.link && (!r.link[0].startsWith('#note/') || (window.NOTES || []).some(n => n.id === r.link[0].slice(6))) ? `<a href="${r.link[0]}">${r.link[1]} ↗</a>` : ''}${r.ext ? ` <a href="${r.ext[0]}" target="_blank" rel="noreferrer">${r.ext[1]} ↗</a>` : ''}</div></li>`;
  }).join('');

  // 그 밖의 실험과 활동. 순위와 횟수는 OUTLINE.md 기준.
  const small = [
    ['GCN, GAT 다중 시드 비교', '2025.10', 'Cora와 PubMed에서 여러 시드로 실험해 평균과 편차를 기록했습니다.', '교과 GAT 부문 1위, PubMed 2위 <a href="media/evidence/gat_leaderboard.jpg" target="_blank" rel="noreferrer">증빙 ↗</a>'],
    ['교내 AI 데이터톤', '2025', '와인 품질 데이터로 정형 데이터 예측 모델을 만들었습니다.', 'Private 3위 <a href="media/evidence/datathon_private.jpg" target="_blank" rel="noreferrer">증빙 ↗</a>'],
    ['42서울 La Piscine 6기', '2022.01.31 — 02.25', 'C 언어 과제와 동료 평가, 그룹 프로젝트를 4주 동안 했습니다.', '2차 교육 참여 <a href="media/evidence/seoul42_mail.jpg" target="_blank" rel="noreferrer">증빙 ↗</a>'],
    ['논문 세미나', '2026.03 — 06', '효과적인 edge device AI 알고리즘 개발을 위한 논문들을 골라 발표했습니다.', '8회'],
    ['토스 NEXT ML CHALLENGE(데이콘, 광고 클릭 예측)', '2025.09 — 10', '4인 팀에서 EDA 와 전처리를 맡았습니다. 클릭 1:2 언더샘플링, 시퀀스 길이와 길이 구간, 시간 주기 변수, OOF 타깃 인코딩을 더한 XGBoost 로 베이스라인 0.3290 을 0.3366 으로 올렸습니다. 시간이 부족해 거기서 멈췄고 팀 최종은 349위(참가 2,911명)였습니다.', '0.3290 → 0.3366'],
    ['Jetson Nano 경량화 실험', '2025.12 — 2026.01', '임베디드 AI 수업 팀 프로젝트입니다. 이미지 분류 모델에 FP16 변환과 비구조적 프루닝을 적용했습니다. 파일 크기는 절반으로 줄었지만 FPS는 12.8에서 9~10으로 떨어졌습니다.', 'FPS 12.8 → 9~10'],
  ].map(([what, when, how, result]) => `<tr><td>${what}</td><td>${when}</td><td>${how}</td><td>${result}</td></tr>`).join('');

  return `<section class="about-intro"><div class="about-intro-text"><span class="eyebrow">THE PERSON BEHIND THE PROJECTS</span><h1>About me<span class="small-star" aria-hidden="true">✳</span></h1><div class="about-lead"><h2>김세진 <span>KIM SEJIN</span></h2><p>제약 있는 환경에서 성능과 구조를 같이 고민해 온 AI 전공자입니다.</p><div class="about-contact"><a href="mailto:draveos20@gmail.com">Email ↗</a><a href="https://github.com/draveos" target="_blank" rel="noreferrer">GitHub ↗</a></div></div></div><figure class="about-photo" aria-label="증명사진"><img src="media/about/photo_id.png" alt="김세진 증명사진" width="110" height="150"></figure></section><section class="stack-section"><div class="section-heading"><h2>Tech stack</h2><span>프로젝트에서 사용한 도구</span></div><div class="stack-groups">${stack}</div></section><section class="roadmap-section"><div class="section-heading"><h2>Roadmap</h2><span>학력과 주요 활동</span></div><ol class="roadmap">${roadmap}</ol></section><section class="stack-section"><div class="section-heading"><h2>그 밖의 실험과 활동</h2><span>수업, 세미나, 개인 도구</span></div><div class="article-body"><p>수업에서 진행한 실험과 세미나, 필요해서 만든 도구를 모았습니다.</p><div class="table-scroll"><table><thead><tr><th>무엇</th><th>시기</th><th>내용</th><th>결과</th></tr></thead><tbody>${small}</tbody></table></div></div></section>`;
};
