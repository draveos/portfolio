/* 김세진 작업 노트 — 프레임워크 (v5, 2026-10-14)
   노트는 notes/<id>.js 가 window.NOTES.push() 로 등록하고, 홈과 About 문구는 pages/*.js 가 window.PAGES 에 둔다.
   로딩 순서(index.html): app.js → figures/*.js → notes/*.js → pages/*.js → scene.js(module).
   defer 스크립트는 문서 순서로 실행되므로 노트 파일은 여기 정의된 헬퍼를 바로 쓸 수 있고,
   라우팅은 모든 defer 스크립트가 끝난 DOMContentLoaded 에서 시작한다.
   파일로 열어도(file://) 해시 라우팅은 동작한다. */

window.NOTES = window.NOTES || [];
window.PAGES = window.PAGES || {};
window.FIGURES = window.FIGURES || {};

/* ---------- 상수와 헬퍼(전역, 노트 파일에서 그대로 사용) ---------- */
const assets = 'media/shots/';
const el = document.querySelector('#content');
const TOPIC_KEY = { '모델': 'model', '드론': 'drone', '에이전트': 'agent' };
const CATEGORY_LABEL = { '프로젝트': '프로젝트', '실험': '비교 실험', '비교 실험': '비교 실험' };
const LINK_KIND = {
  live: { order: 0, label: '서비스 이용해보기', icon: '<svg class="cta-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>' },
  entry: { order: 1, label: '출품 페이지', icon: '<svg class="cta-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4zM4 11h16"/></svg>' },
  code: { order: 2, label: '코드 보기', icon: '<svg class="cta-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/></svg>' },
  doc: { order: 3, label: '문서 보기', icon: '<svg class="cta-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6"/></svg>' }
};
const META_LABEL = { period: '기간', role: '역할', members: '구성원', contribution: '기여도', env: '환경' };

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const escapeHTML = esc;
/* 확인되지 않은 값의 노란 표시. todo('리더보드 캡처') */
const todo = text => `<mark class="todo" title="확인이 필요한 값">${esc(text)}</mark>`;
/* 그림 블록. content 는 svg 또는 img 만. 표나 iframe 은 넣지 않는다(크게 보기가 svg/img 를 복제한다). */
const fig = (content, caption, style = '') => `<figure class="article-figure"${style ? ` style="${esc(style)}"` : ''}>${content}${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
/* 캡처 비교 격자. names 는 media/shots/ 안의 파일명. */
const comparison = (names, labels) => `<div class="compare-grid">${names.map((n, i) => `<figure><img src="${esc(assets + n)}" alt="${esc(labels[i])}의 결과 화면" loading="lazy"><figcaption>${esc(labels[i])}</figcaption></figure>`).join('')}</div>`;
/* 포스터 + 재생 버튼 facade. 클릭할 때만 iframe 을 만든다. height 는 px 숫자(없으면 16:9). */
function demoBlock({ src, poster, title = '데모', caption = '', height, note = '', autoplay = false }) {
  const style = height ? ` style="--demo-height:${Number(height) || 0}px"` : '';
  return `<div class="demo-block${height ? ' has-height' : ''}" data-demo-src="${esc(src)}" data-demo-title="${esc(title)}"${autoplay ? ' data-demo-autoplay="1"' : ''}${style}><div class="demo-stage">${poster ? `<img class="demo-poster" src="${esc(poster)}" alt="" width="1600" height="900" loading="lazy" decoding="async">` : '<div class="demo-poster demo-poster-empty" aria-hidden="true"></div>'}<button type="button" class="demo-play" aria-label="${esc(title)} 재생"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg><span>체험 시작</span></button></div>${caption ? `<p class="demo-caption">${caption}</p>` : ''}${note ? `<p class="demo-note">${note}</p>` : ''}</div>`;
}

/* ---------- 노트 접근 ---------- */
const posts = window.NOTES;
const findNote = id => posts.find(p => p.id === id);
const visibleNotes = () => posts.filter(p => !p.draft);
const topicKey = p => TOPIC_KEY[p.topic] || 'agent';
const categoryOf = p => p.category === '비교 실험' ? '실험' : (p.category || '프로젝트');
const categoryLabel = p => CATEGORY_LABEL[categoryOf(p)] || categoryOf(p);
const categoryHash = p => categoryOf(p) === '프로젝트' ? '#projects' : '#experiments';
const toolsOf = p => Array.isArray(p.tools) ? p.tools : String(p.tools || '').split(',').map(s => s.trim()).filter(Boolean);
const sectionHTML = s => typeof s.html === 'function' ? s.html() : String(s.html ?? '');
const sectionId = (s, i) => 'sec-' + String(s.id || i).replace(/[^\w-]/g, '-');
function plainText(html) {
  return String(html).replace(/<svg[\s\S]*?<\/svg>/gi, ' ').replace(/<figcaption[\s\S]*?<\/figcaption>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}
/* 읽는 시간: 태그와 그림 설명을 뺀 글자 수(공백 제외)를 500 으로 나눠 올림, 최소 1분. 총합은 전체 글자 수로 다시 계산. */
function readingTime(p) {
  const sections = (p.sections || []).map(s => { const chars = plainText(sectionHTML(s)).replace(/\s/g, '').length; return { chars, min: Math.max(1, Math.ceil(chars / 500)) }; });
  const total = sections.reduce((a, s) => a + s.chars, 0);
  return { sections, total: sections.length ? Math.max(1, Math.ceil(total / 500)) : 0 };
}
function galleryItems(p) {
  const items = [];
  if (p.hero) {
    if (typeof p.hero.svg === 'function') items.push({ svg: p.hero.svg, alt: p.hero.alt || '', caption: p.hero.caption || '' });
    else if (p.hero.src) items.push({ src: p.hero.src, alt: p.hero.alt || '', caption: p.hero.caption || '' });
  }
  for (const s of p.shots || []) if (s && s.src) items.push({ src: s.src, alt: s.alt || '', caption: s.caption || '' });
  return items;
}
const mediaHTML = (item, eager = false) => item.svg ? item.svg() : `<img src="${esc(item.src)}" alt="${esc(item.alt)}" width="1600" height="900" loading="${eager ? 'eager' : 'lazy'}" decoding="async">`;
function thumb(p) {
  if (typeof p.thumb === 'function') return p.thumb();
  if (p.thumb && p.thumb.src) return `<img src="${esc(p.thumb.src)}" alt="${esc(p.thumb.alt || '')}" loading="lazy" decoding="async">`;
  const g = galleryItems(p)[0];
  if (g) return g.svg ? g.svg() : `<img src="${esc(g.src)}" alt="${esc(g.alt)}" loading="lazy" decoding="async">`;
  return '<div class="thumb-empty" aria-hidden="true"></div>';
}
function badgesHTML(p) {
  const list = Array.isArray(p.badge) ? p.badge : (p.badge ? [p.badge] : []);
  return list.length ? `<div class="badge-row">${list.map(b => `<span class="badge" data-topic="${topicKey(p)}">${esc(b)}</span>`).join('')}</div>` : '';
}
function linksHTML(p) {
  const links = (p.links || []).filter(l => l && l.href).map(l => ({ ...l, kind: LINK_KIND[l.kind] ? l.kind : 'doc' }))
    .sort((a, b) => LINK_KIND[a.kind].order - LINK_KIND[b.kind].order).slice(0, 3);
  if (!links.length) return '';
  return `<div class="cta-row">${links.map((l, i) => `<a class="cta ${i === 0 ? 'cta-primary' : 'cta-outline'} cta-${l.kind}" href="${esc(l.href)}" target="_blank" rel="noreferrer">${esc(l.label || LINK_KIND[l.kind].label)}${LINK_KIND[l.kind].icon}</a>`).join('')}</div>`;
}
function metaHTML(p) {
  const meta = p.meta || {}, rows = [];
  for (const key of Object.keys(META_LABEL)) if (meta[key]) rows.push(`<div><dt>${META_LABEL[key]}</dt><dd>${esc(meta[key])}</dd></div>`);
  const tools = toolsOf(p);
  if (tools.length) rows.push(`<div><dt>사용 툴</dt><dd><div class="chip-row">${tools.map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div></dd></div>`);
  return rows.length ? `<dl class="meta-card">${rows.join('')}</dl>` : '';
}
function key3HTML(p) {
  const k = p.points || {};
  const rows = [['작업', k.shows], ['목적', k.why], ['결과', k.matters]].filter(([, v]) => v);
  return rows.length ? `<dl class="key3">${rows.map(([t, v]) => `<div><dt>${t}</dt><dd>${v}</dd></div>`).join('')}</dl>` : '';
}

/* ---------- 목록 ---------- */
let selectedTopic = '전체';
let pendingChapter = null;
const LINK_ICON = '<svg class="card-link-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';
function listRow(p) {
  const shows = (p.points && p.points.shows) || p.summary || '';
  const chips = toolsOf(p).slice(0, 3).map(t => `<span class="chip">${esc(t)}</span>`).join('');
  const hasLink = (p.links || []).some(l => l && l.href);
  return `<a class="note-row node-card" href="#note/${esc(p.id)}" data-kind="${esc(p.id)}" data-topic="${topicKey(p)}"><div class="node-card-media">${thumb(p)}<span class="badge badge-plain media-category">${esc(p.tag)}</span></div><div class="node-card-content"><span class="node-card-meta">${esc(p.date)}<span>${esc(categoryLabel(p))}${hasLink ? LINK_ICON : ''}</span></span><h3><span>${esc(p.title)}</span></h3><p class="clamp-2">${shows}</p></div><div class="node-card-footer"><span class="chip-row">${chips}</span><span class="node-open">열어보기 <b aria-hidden="true">↗</b></span></div></a>`;
}
function filters() {
  return `<div class="tabs" aria-label="노트 주제">${['전체', '모델', '드론', '에이전트'].map(t => `<button class="filter" data-filter="${t}" aria-pressed="${t === selectedTopic}">${t}</button>`).join('')}</div>`;
}
function renderList(category) {
  const collection = visibleNotes().filter(p => (!category || categoryOf(p) === category) && (selectedTopic === '전체' || p.topic === selectedTopic));
  document.querySelector('#notes-list').innerHTML = collection.length ? collection.map(listRow).join('') : '<p class="empty">이 주제에 해당하는 노트가 없습니다. 전체 노트를 선택해 주세요.</p>';
  document.querySelector('#announcement').textContent = `${collection.length}개의 노트`;
  document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === selectedTopic)));
}
function list(category) {
  const label = category === '프로젝트' ? '프로젝트' : '비교 실험';
  el.innerHTML = `<section class="intro"><div><span class="eyebrow">WORK INDEX</span><h1>${label}</h1><p>${category === '프로젝트' ? '구현 과정과 결과를 정리했습니다.' : '조건을 정하고 결과를 비교한 기록입니다.'}</p></div></section><section id="notes"><div class="section-label"><h2>전체 기록</h2>${category === '프로젝트' ? filters() : ''}</div><div class="note-list node-grid" id="notes-list"></div></section>`;
  renderList(category);
  document.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => { selectedTopic = b.dataset.filter; renderList(category); }));
}

/* ---------- 홈 ---------- */
function home() {
  const H = window.PAGES.home || {}, hero = H.hero || {};
  const chapters = (H.chapters || []).map(c => {
    const notes = visibleNotes().filter(p => p.topic === c.topic);
    const lead = findNote(c.lead) && !findNote(c.lead).draft ? findNote(c.lead) : notes[0];
    const metric = typeof c.metric === 'function' ? c.metric(notes) : c.metric;
    if (!lead && !notes.length) return '';   // 공개하지 않은 분야(노트 없음)는 장을 그리지 않는다
    const href = lead ? `#note/${esc(lead.id)}` : '#projects';
    return `<article class="chapter" data-kind="${esc(c.kind)}" data-topic="${esc(c.topic)}"><div class="chapter-spine"><span>${esc(c.n)}</span><i></i></div><div class="chapter-main"><span class="eyebrow">${esc(c.en)}</span><h3><a href="${href}">${esc(c.title)} <span aria-hidden="true">↗</span></a></h3><p>${esc(c.desc)}</p><div class="chapter-links">${notes.map(p => `<a href="#note/${esc(p.id)}"><span>${esc(p.tag)}</span><span aria-hidden="true">↗</span></a>`).join('')}</div></div><a class="chapter-preview" href="${href}" aria-label="${esc(c.title)} 기록 열기"><div class="preview-art">${c.thumb ? `<img src="${esc(c.thumb.src)}" alt="${esc(c.thumb.alt || '')}" loading="lazy">` : lead ? thumb(lead) : ''}</div><div class="preview-caption"><strong>${esc(metric)}</strong><span>${esc(c.unit)}</span></div></a></article>`;
  }).join('');
  el.innerHTML = `<section class="assembly-hero"><div class="hero-copy"><p class="eyebrow">${esc(hero.eyebrow || '')}</p><h1>${hero.title || ''}</h1><p class="hero-description">${hero.description || ''}</p><a href="${esc(hero.ctaHref || '#about')}" class="intro-link">${esc(hero.ctaLabel || 'About me')} <span aria-hidden="true">↗</span></a></div><div class="assembly-stage"><div id="hero-scene" role="img" aria-label="${esc(hero.sceneLabel || '')}"><div class="scene-fallback"><span>◇</span></div></div><div class="assembly-caption"><span id="assembly-label">AGENT ARCHITECTURE</span><span id="assembly-state" hidden aria-hidden="true"></span></div><div class="assembly-select" aria-label="조립할 구조 선택"><button data-assembly="0" aria-pressed="true" aria-label="에이전트 아키텍처">Architecture</button><button data-assembly="1" aria-pressed="false" aria-label="드론 조립">Drone</button><button data-assembly="2" aria-pressed="false" aria-label="Claude 채색 모션">Claude</button><button data-assembly="3" aria-pressed="false" aria-label="Codex 유체 모션">Codex</button><button data-assembly="4" aria-pressed="false" aria-label="Gemini 2D 모션">Gemini</button></div></div></section><section id="notes" class="chapters"><div class="chapter-index-heading"><h2>${esc(H.chaptersTitle || '')}</h2><span>${esc(H.chaptersEyebrow || '')}</span></div>${chapters}</section>`;
  if (pendingChapter) { const topic = pendingChapter; pendingChapter = null; requestAnimationFrame(() => document.querySelector(`.chapter[data-topic="${topic}"]`)?.scrollIntoView({ block: 'start' })); }
}

/* ---------- 프로젝트 상세 템플릿 ---------- */
function article(p) {
  const items = galleryItems(p), rt = readingTime(p), reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gallery = items.length ? `<div class="project-gallery"><figure class="gallery-main${items[0].svg ? ' is-svg' : ''}" data-topic="${topicKey(p)}"><div class="gallery-media">${mediaHTML(items[0], true)}</div><button type="button" class="gallery-zoom" aria-label="그림 크게 보기">크게 보기</button></figure><p class="gallery-caption" aria-live="polite">${items[0].caption || ''}</p>${items.length > 1 ? `<div class="gallery-strip" role="tablist" aria-label="캡처 선택">${items.map((it, i) => `<button type="button" class="gallery-thumb" role="tab" aria-selected="${i === 0}" aria-label="${esc(it.alt || `캡처 ${i + 1}`)}" data-index="${i}">${it.svg ? it.svg() : `<img src="${esc(it.src)}" alt="" loading="lazy" decoding="async">`}</button>`).join('')}</div>${items.length > 2 ? `<div class="gallery-dots" aria-hidden="true">${Array.from({ length: Math.ceil(items.length / 2) }, (_, i) => `<button type="button" tabindex="-1" data-page="${i}" aria-current="${i === 0}"><span></span></button>`).join('')}</div>` : ''}` : ''}</div>` : '';
  const sections = (p.sections || []).map((s, i) => `<details class="section" id="${sectionId(s, i)}"${s.collapsed ? '' : ' open'}><summary><svg class="section-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg><h2>${esc(s.title)}</h2><small>${rt.sections[i].min}분</small></summary><div class="section-inner">${sectionHTML(s)}</div></details>`).join('');
  const toc = (p.sections || []).length ? `<nav class="body-toc" aria-label="글 목차"><strong>목차, 총 ${rt.total}분</strong>${p.sections.map((s, i) => `<a href="#${sectionId(s, i)}" data-section="${sectionId(s, i)}"><span>${esc(s.title)}</span><small>${rt.sections[i].min}분</small></a>`).join('')}</nav>` : '';
  const related = visibleNotes().filter(o => o.id !== p.id && o.topic === p.topic).slice(0, 2);
  const summary60 = (p.summary60 || []).filter(Boolean);
  el.innerHTML = `<div class="project-page" data-kind="${esc(p.id)}" data-topic="${topicKey(p)}"><a class="project-back" href="${categoryHash(p)}"><span aria-hidden="true">←</span> ${esc(categoryLabel(p))}</a><header class="project-head${items.length ? '' : ' is-textonly'}">${gallery}<div class="project-aside">${badgesHTML(p)}<h1 class="project-title">${esc(p.title)}</h1><p class="project-deck">${esc(p.summary)}</p>${key3HTML(p)}${linksHTML(p)}${metaHTML(p)}</div></header>${summary60.length ? `<section class="brief" aria-labelledby="brief-title"><div class="brief-head"><h2 id="brief-title">60초 요약</h2><span>SUMMARY${rt.total ? ` / ${rt.total}분` : ''}</span></div><ul>${summary60.map(s => `<li>${s}</li>`).join('')}</ul></section>` : ''}<div class="project-body${toc ? '' : ' no-toc'}">${toc}<div class="article-body">${sections}${(p.evidence || []).length ? `<div class="evidence-row"><strong>증빙</strong>${p.evidence.filter(e => e && e.href).map(e => `<a href="${esc(e.href)}" target="_blank" rel="noreferrer">${esc(e.label)} ↗</a>`).join('')}</div>` : ''}${related.length ? `<div class="article-related"><h2>이어 읽기</h2>${related.map(o => `<a href="#note/${esc(o.id)}">${esc(o.title)} ↗</a>`).join('')}</div>` : ''}</div></div></div>`;
  wrapTables(); wireFigures(); wireDemos(); wireGallery(items);
  document.querySelectorAll('[data-section]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const d = document.getElementById(a.dataset.section); if (!d) return;
    if (!d.open) d.open = true;
    d.scrollIntoView({ behavior: reduce() ? 'instant' : 'smooth', block: 'start' });
  }));
  if (toc && 'IntersectionObserver' in window) {
    const links = [...document.querySelectorAll('.body-toc a')], visible = new Set();
    const io = new IntersectionObserver(entries => {
      for (const en of entries) en.isIntersecting ? visible.add(en.target.id) : visible.delete(en.target.id);
      const current = [...document.querySelectorAll('details.section')].find(d => visible.has(d.id));
      links.forEach(a => a.classList.toggle('is-current', !!current && a.dataset.section === current.id));
    }, { rootMargin: '-96px 0px -60% 0px' });
    document.querySelectorAll('details.section').forEach(d => io.observe(d));
    onLeave(() => io.disconnect());
  }
}
function wrapTables() {
  document.querySelectorAll('.article-body table').forEach(t => {
    if (t.parentElement.classList.contains('table-scroll')) return;
    const wrap = document.createElement('div'); wrap.className = 'table-scroll'; t.replaceWith(wrap); wrap.appendChild(t);
  });
}
function about() { el.innerHTML = typeof window.PAGES.about === 'function' ? window.PAGES.about() : '<section class="intro"><h1>About me</h1><p>pages/about.js 를 찾지 못했습니다.</p></section>'; revealRoadmap(); }
/* About 로드맵 점등: 항목이 뷰포트 55% 지점을 지나면 is-lit. 모션 축소나 일시정지면 전부 켜 두고, 라우트 전환 시 onLeave 로 observer 를 해제한다. */
function revealRoadmap() {
  const list = el.querySelector('.roadmap'); if (!list) return;
  const items = [...list.querySelectorAll(':scope > li')];
  const lightAll = () => items.forEach(li => li.classList.add('is-lit'));
  if (motionOff() || !('IntersectionObserver' in window)) { lightAll(); return; }
  list.classList.add('is-reveal');
  const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-lit'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -45% 0px', threshold: 0 });
  items.forEach(li => io.observe(li));
  const onMotion = e => { if (e.detail && e.detail.paused) { lightAll(); io.disconnect(); } };
  const onScroll = () => { if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) { lightAll(); io.disconnect(); } };
  document.addEventListener('portfolio:motion', onMotion);
  addEventListener('scroll', onScroll, { passive: true });
  onLeave(() => { io.disconnect(); document.removeEventListener('portfolio:motion', onMotion); removeEventListener('scroll', onScroll); });
}

/* ---------- 뷰 정리(옵저버, iframe) ---------- */
const cleanups = [];
const onLeave = fn => cleanups.push(fn);
function runCleanups() { cleanups.splice(0).forEach(fn => { try { fn(); } catch (e) { console.warn(e); } }); }

/* ---------- 그림 확대 대화상자(index.html 의 #figure-dialog) ---------- */
const figureModal = document.querySelector('#figure-dialog');
function openFigure(html, caption) {
  if (!figureModal) return;
  figureModal.querySelector('.figure-stage').innerHTML = html;
  figureModal.querySelector('.figure-caption').textContent = caption || '';
  figureModal.showModal();
}
function wireFigures() {
  document.querySelectorAll('.article-figure').forEach(figure => {
    const media = figure.querySelector('svg,img');
    if (!media || figure.querySelector('.figure-expand')) return;
    const button = document.createElement('button');
    button.className = 'figure-expand'; button.type = 'button'; button.textContent = '크게 보기'; button.setAttribute('aria-label', '그림 크게 보기');
    button.addEventListener('click', () => openFigure(media.outerHTML, figure.querySelector('figcaption')?.textContent || media.getAttribute('alt') || ''));
    figure.appendChild(button);
  });
}
function wireDemos() {
  document.querySelectorAll('.demo-block').forEach(block => {
    const stage = block.querySelector('.demo-stage'), play = block.querySelector('.demo-play');
    if (!stage || !play) return;
    const start = () => {
      const iframe = document.createElement('iframe');
      iframe.src = block.dataset.demoSrc; iframe.title = block.dataset.demoTitle || '데모'; iframe.loading = 'lazy';
      iframe.setAttribute('allow', 'fullscreen');
      stage.innerHTML = ''; stage.appendChild(iframe); block.classList.add('is-playing');
      const origin = location.origin && location.origin !== 'null' ? location.origin : '*';
      const post = visible => { try { iframe.contentWindow?.postMessage({ type: 'portfolio:visible', visible }, origin); } catch (e) { } };
      iframe.addEventListener('load', () => post(!document.hidden && block.dataset.visible !== 'false'));
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(entries => { const v = entries[0].isIntersecting; block.dataset.visible = String(v); post(v && !document.hidden); }, { threshold: .15 });
        io.observe(block);
        const onHidden = () => post(!document.hidden && block.dataset.visible !== 'false');
        document.addEventListener('visibilitychange', onHidden);
        onLeave(() => { io.disconnect(); document.removeEventListener('visibilitychange', onHidden); iframe.remove(); });
      } else onLeave(() => iframe.remove());
    };
    play.addEventListener('click', start);
    if (block.dataset.demoAutoplay === '1') start();
  });
}
function wireGallery(items) {
  const main = document.querySelector('.gallery-main'); if (!main) return;
  const media = main.querySelector('.gallery-media'), caption = document.querySelector('.gallery-caption'), strip = document.querySelector('.gallery-strip'), dots = document.querySelector('.gallery-dots');
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('motion-paused');
  let current = 0, swapToken = 0;
  const zoom = () => { const it = items[current]; openFigure(it.svg ? it.svg() : `<img src="${esc(it.src)}" alt="${esc(it.alt)}">`, it.caption || it.alt || ''); };
  main.querySelector('.gallery-zoom').addEventListener('click', zoom);
  media.addEventListener('click', zoom);
  function show(i) {
    if (i === current || !items[i]) return;
    current = i; const token = ++swapToken, it = items[i];
    strip?.querySelectorAll('.gallery-thumb').forEach((b, j) => b.setAttribute('aria-selected', String(j === i)));
    if (caption) caption.textContent = it.caption || '';
    main.classList.toggle('is-svg', !!it.svg);
    const apply = () => { if (token !== swapToken) return; media.innerHTML = mediaHTML(it, true); const img = media.querySelector('img'); const done = () => media.classList.remove('is-swapping'); if (img && !img.complete) img.addEventListener('load', done, { once: true }); else done(); };
    if (reduce()) apply(); else { media.classList.add('is-swapping'); setTimeout(apply, 160); }
  }
  strip?.querySelectorAll('.gallery-thumb').forEach(b => b.addEventListener('click', () => show(Number(b.dataset.index))));
  strip?.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const next = (current + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length; e.preventDefault(); show(next); strip.querySelectorAll('.gallery-thumb')[next]?.focus();
  });
  if (strip && dots) {
    const thumbs = [...strip.querySelectorAll('.gallery-thumb')];
    const sync = () => { const page = Math.round(strip.scrollLeft / Math.max(1, strip.clientWidth)); dots.querySelectorAll('button').forEach((d, i) => d.setAttribute('aria-current', String(i === page))); };
    let raf = 0; strip.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(sync); });
    dots.querySelectorAll('button').forEach(d => d.addEventListener('click', () => { const t = thumbs[Number(d.dataset.page) * 2]; if (t) strip.scrollTo({ left: t.offsetLeft - strip.offsetLeft, behavior: reduce() ? 'instant' : 'smooth' }); }));
  }
}

/* ---------- 라우터와 뷰 전환 ---------- */
function renderView(h) {
  runCleanups();
  let view = 'home', crumb = '전체', title = 'Portfolio', isProject = false;
  if (h.startsWith('note/')) {
    const p = findNote(h.slice(5));
    if (p) { article(p); isProject = true; crumb = `${categoryLabel(p)} / ${p.tag}`; title = `${p.title} / Portfolio`; view = categoryOf(p) === '프로젝트' ? 'projects' : 'experiments'; }
    else { el.innerHTML = '<section class="intro"><div><h1>노트를 찾을 수 없습니다.</h1><p><a href="#projects">프로젝트 목록으로 돌아가기</a></p></div></section>'; crumb = '없는 노트'; title = '노트를 찾을 수 없습니다 / Portfolio'; view = ''; }
  } else if (h === 'about') { about(); view = 'about'; crumb = 'About me'; title = 'About me / Portfolio'; }
  else if (h === 'projects' || h === 'experiments') { const category = h === 'projects' ? '프로젝트' : '실험'; list(category); view = h; crumb = CATEGORY_LABEL[category]; title = `${crumb} / Portfolio`; }
  else { home(); }
  document.body.classList.toggle('project-view', isProject);
  document.body.classList.remove('post-view');
  document.querySelector('#breadcrumb').textContent = crumb;
  document.title = title;
  document.querySelectorAll('[data-view]').forEach(a => { const active = a.dataset.view === view; a.classList.toggle('active', active); if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.dispatchEvent(new Event('portfolio:route'));
}
let routeToken = 0, firstRoute = true;
const motionOff = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('motion-paused');
function currentHash() { try { return decodeURIComponent(location.hash.slice(1)); } catch (e) { return location.hash.slice(1); } }
function route() {
  const h = currentHash(), token = ++routeToken;
  if (firstRoute || motionOff()) { firstRoute = false; el.classList.remove('is-leaving', 'is-entering', 'is-entered'); renderView(h); return; }
  el.classList.add('is-leaving');
  setTimeout(() => {
    if (token !== routeToken) return;
    renderView(h);
    el.classList.remove('is-leaving'); el.classList.add('is-entering');
    void el.offsetWidth;
    requestAnimationFrame(() => {
      if (token !== routeToken) return;
      el.classList.remove('is-entering'); el.classList.add('is-entered');
      setTimeout(() => { if (token === routeToken) el.classList.remove('is-entered'); }, 180);
    });
  }, 120);
}
addEventListener('hashchange', route);
document.addEventListener('DOMContentLoaded', () => {
  posts.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  const seen = new Set();
  for (const p of posts) {
    if (seen.has(p.id)) console.warn('중복 노트 id', p.id); seen.add(p.id);
    for (const key of ['id', 'title', 'summary', 'topic', 'category', 'date', 'tag', 'sections']) if (p[key] === undefined) console.warn('노트 필드 누락', p.id, key);
  }
  const counts = { projects: visibleNotes().filter(p => categoryOf(p) === '프로젝트').length, experiments: visibleNotes().filter(p => categoryOf(p) === '실험').length };
  const pSmall = document.querySelector('[data-view=projects] small'), eSmall = document.querySelector('[data-view=experiments] small');
  if (pSmall) pSmall.textContent = `구현한 작업 ${counts.projects}개`;
  if (eSmall) eSmall.textContent = `실험 기록 ${counts.experiments}개`;
  route();
});

/* ---------- 사이드바 분야 버튼: 홈의 해당 장으로 ---------- */
document.querySelectorAll('[data-topic]').forEach(b => b.addEventListener('click', () => {
  const topic = b.dataset.topic;
  const chapter = document.querySelector(`.chapter[data-topic="${topic}"]`);
  if ((location.hash === '' || location.hash === '#') && chapter) { chapter.scrollIntoView({ block: 'start' }); return; }
  pendingChapter = topic;
  if (location.hash === '' || location.hash === '#') route(); else location.hash = '';
}));

/* ---------- 검색: 제목, 요약, 분야, 도구, 태그, 핵심 3줄, 60초 요약, 본문 ---------- */
const dialog = document.querySelector('#search-dialog'), input = document.querySelector('#search-input'), results = document.querySelector('#search-results');
const textCache = new WeakMap();
function noteText(p) {
  if (textCache.has(p)) return textCache.get(p);
  const k = p.points || {};
  const text = plainText([p.title, p.summary, p.topic, toolsOf(p).join(' '), p.tag, Array.isArray(p.badge) ? p.badge.join(' ') : p.badge, k.shows, k.why, k.matters, ...(p.summary60 || []), ...(p.sections || []).map(s => `${s.title} ${sectionHTML(s)}`), p.gaps].filter(Boolean).join(' ')).toLowerCase();
  textCache.set(p, text); return text;
}
function search() {
  const query = input.value.trim().toLowerCase();
  const matches = visibleNotes().filter(p => noteText(p).includes(query));
  results.innerHTML = matches.length ? matches.map(p => `<a class="search-result" href="#note/${esc(p.id)}"><strong>${esc(p.title)}</strong><span>${esc(p.tag)} / ${esc(p.date)}</span></a>`).join('') : '<p class="empty">일치하는 노트가 없습니다.<br>다른 주제나 도구 이름으로 찾아보세요.</p>';
  results.querySelectorAll('a').forEach(a => a.addEventListener('click', () => dialog.close()));
}
function openSearch() { if (!dialog.open) { dialog.showModal(); input.value = ''; search(); input.focus(); } }
const outsideClick = (d, e) => { if (e.target !== d) return false; const r = d.getBoundingClientRect(); return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom; };
document.querySelector('#open-search').addEventListener('click', openSearch);
document.querySelector('#close-search').addEventListener('click', () => dialog.close());
input.addEventListener('input', search);
input.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); dialog.close(); } });
dialog.addEventListener('click', e => { if (outsideClick(dialog, e)) dialog.close(); });
addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); } });
if (figureModal) {
  figureModal.querySelector('#close-figure').addEventListener('click', () => figureModal.close());
  figureModal.addEventListener('click', e => { if (outsideClick(figureModal, e)) figureModal.close(); });
  figureModal.addEventListener('close', () => { figureModal.querySelector('.figure-stage').innerHTML = ''; });
}

/* ---------- 모션 토글 ---------- */
const motionButton = document.querySelector('#motion-toggle');
let motionPaused = matchMedia('(prefers-reduced-motion: reduce)').matches;
function syncMotion() {
  document.documentElement.classList.toggle('motion-paused', motionPaused);
  motionButton.setAttribute('aria-pressed', String(motionPaused));
  motionButton.textContent = motionPaused ? '모션 꺼짐' : '모션 켜짐';
  motionButton.setAttribute('aria-label', motionPaused ? '모션 재생' : '모션 일시정지');
  document.dispatchEvent(new CustomEvent('portfolio:motion', { detail: { paused: motionPaused } }));
}
motionButton.addEventListener('click', () => { motionPaused = !motionPaused; syncMotion(); });
syncMotion();

document.querySelector('.skip').addEventListener('click', e => { e.preventDefault(); el.focus(); el.scrollIntoView({ block: 'start', behavior: 'instant' }); });
