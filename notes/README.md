# notes/ — 글 한 편 = 파일 하나

작성자는 자기 `notes/<id>.js` 만 고칩니다. `app.js`, `index.html`, `*.css`, `pages/` 는 프레임워크 담당만 만집니다. 새 글을 추가하려면 파일을 만든 뒤 `index.html` 의 `<script defer src="notes/<id>.js">` 한 줄 추가를 프레임워크 담당에게 요청합니다.

## 파일 형식

```js
/* 노트: <제목>. 이 파일만 고치면 됩니다. */
(function () {
  // 이 글만 쓰는 그림 함수나 데이터는 여기(IIFE 안)에 둡니다. 전역으로 새지 않습니다.
  function myChart() { return '<svg viewBox="0 0 600 300">...</svg>'; }

  window.NOTES.push({
    id: 'exaone',                 // 영문 소문자와 하이픈만. 해시(#note/exaone)와 CSS 에 그대로 쓰입니다
    order: 10,                    // 작을수록 앞. 10 단위로 띄워 사이에 끼울 수 있게
    title: '1.49GB를 1.37GB로 줄이기',          // 24자 이하 권장
    summary: '레이어별로 응답을 비교하고, 8비트로 남길 모듈을 골랐습니다.',   // 한 줄
    topic: '모델',                // '모델' | '드론' | '에이전트'  (홈의 장, 분야 필터, 색 틴트가 여기에 묶임)
    category: '프로젝트',         // '프로젝트' | '실험'
    date: '2026.01–02',
    tools: ['PyTorch', 'GPTQ', 'vLLM'],          // 배열 → 칩. 목록 카드엔 앞 3개
    tag: 'EXAONE 경량화',          // 짧은 라벨(빵부스러기, 목록 배지, 홈 장 링크)
    badge: 'LG Aimers 8기 팀 리더보드 72위',    // 선택. 문자열 또는 배열(최대 2개). 사실만, 로고 금지
    hero: { src: 'media/shots/x.png', alt: '…', caption: '…' },   // 선택. 16:9. 또는 { svg: () => '<svg…>', alt, caption }
    shots: [{ src: 'media/shots/a.png', alt: '…', caption: '…' }], // 선택. 캡처 스트립(hero 와 합쳐 2장 이상이면 썸네일 줄이 생김)
    links: [                                                      // 선택. 최대 3개. kind 순서(live → entry → code → doc)와 아이콘은 템플릿이 정함
      { label: '서비스 이용해보기', href: 'https://…', kind: 'live' },
      { label: '출품 페이지', href: 'https://…', kind: 'entry' },
      { label: '코드 보기', href: 'https://github.com/…', kind: 'code' }
    ],
    meta: { period: '2026.01–02', role: '양자화 전략과 실험', members: '2인', contribution: todo('기여도'), env: 'L4 22GB' },  // 선택. 없는 키는 숨김
    points: {                     // 핵심 3줄. 각 한 문장, 45자 이하, "입니다/했습니다"
      shows: '…한 기록입니다.',
      why: '…을 보이기 위해서입니다.',
      matters: '…을 얻었고, …입니다.'
    },
    summary60: [                  // 60초 요약 3~5개, 각 40자 이하, 항목마다 숫자 하나 이상. 숫자는 <b class="num">
      '점수 <b class="num">0.596 → 0.624</b>, 팀 리더보드 <b class="num">72위</b>'
    ],
    sections: [                   // 본문. h2 는 템플릿이 그리므로 html 안에 h2 를 쓰지 않습니다
      { id: 'compare', title: '먼저 비교한 것', html: `<p>…</p>${fig(myChart(), '캡션')}` },
      { id: 'result', title: '최종 제출 결과', html: `<table>…</table>`, collapsed: true }   // collapsed 면 접힌 채 시작
    ],
    gaps: 'AWQ 와 SmoothQuant 는 비교하지 않았습니다. … 다음에는 …합니다.',   // 선택. "못 한 것, 다음" 한 문단 3문장 이하
    evidence: [{ label: '레포', href: 'https://…' }],   // 선택. 레포, 배포, 출품 페이지, 리더보드 캡처, 수료증만
    thumb: () => myChart(),       // 목록 카드와 홈 장의 그림. 또는 { src: 'media/x.png', alt: '…' }. 없으면 hero 를 씀
    // draft: true               // 채우는 동안만. 목록, 홈, 검색에서 숨고 #note/<id> 직접 주소로만 열림
  });
})();
```

## 헬퍼 (app.js 가 먼저 정의, 그대로 호출)

| 헬퍼 | 용도 |
|---|---|
| `fig(content, caption, style)` | 그림 블록. `content` 는 svg 또는 img 문자열만(표, iframe 금지). "크게 보기" 버튼이 자동으로 붙음 |
| `todo(text)` | 확인 안 된 값의 노란 표시 `<mark class="todo">`. 숫자를 지어내지 말고 이걸 남김 |
| `esc(text)` | HTML 이스케이프. 사용자 입력이나 `<`, `&` 가 든 문자열에 |
| `comparison([파일명…], [라벨…])` | `media/shots/` 캡처 비교 격자 |
| `demoBlock({src, poster, title, caption, height, note})` | 포스터 + 재생 버튼. 클릭 시에만 iframe 생성, 글을 떠나면 제거. iframe 에 `postMessage({type:'portfolio:visible', visible})` 를 보냄 |
| `assets` | `'media/shots/'` 문자열 |
| `window.FIGURES.<name>()` | `figures/` 의 코드 그림(layerSensitivity, exaoneRecipes, exaoneProxy, officeFlow, floraMemory, floraSurfaces, floraTurn, quoridorWins). `fig(FIGURES.officeFlow(), '캡션')` 처럼 씀 |

`sections[].html` 은 문자열 대신 `() => '…'` 함수도 됩니다(렌더 시점에 호출).

## 규칙

1. 본문 HTML 은 템플릿 리터럴 안에 들어가므로 본문 글자에 백틱(`)과 `${` 를 쓰지 않습니다.
2. 이미지 경로는 `blog/` 기준(`media/shots/x.png`, `media/x-cover.png`). `../assets` 는 쓰지 않습니다(blog/ 만 배포해도 깨지지 않게). 1MB 넘는 png 는 jpg 품질 82 로 줄입니다.
3. 표는 그냥 `<table>` 로 씁니다. 템플릿이 `.table-scroll` 로 감싸 모바일에서 가로 스크롤됩니다.
4. 접힌 메모는 섹션 안에 `<details><summary>제목</summary><p>…</p></details>`.
5. 회사 내부 정보 0, 남의 로고와 그림 복제 0. 사실은 조사 자료와 레포에서 확인된 것만, 아니면 `todo()`.
6. 문체: 평이한 사무 존댓말, 한 문장 한 생각, 과장 형용사 금지, 가운뎃점 나열 금지(문장이나 표로).
7. 읽는 시간은 템플릿이 글자 수(500자/분)로 계산합니다. 손으로 적지 않습니다.
8. 저장 뒤 반드시 `node --check notes/<id>.js`. 파일 하나의 문법 오류는 그 글만 빠지고 나머지는 삽니다.
9. 홈의 장은 `topic` 으로 묶입니다(에이전트 장에는 topic 이 '에이전트'인 글이 모두 들어감). 순서는 `order`.

## 지금 상태 (2026-10-14)

- exaone, drone, office, quoridor, voxel, human: 기존 본문을 글자 그대로 옮겼습니다. `points.why`, `points.matters` 는 `todo()`, `summary60` 은 기존 summary 한 줄입니다. 작성자가 채웁니다.
- flora: 뼈대만. `draft: true` 를 지우면 목록과 홈에 나옵니다.
- 캡처 파일명 변경: `vfx_claude_orbit.jpg`, `vfx_claude_tree.jpg`, `vfx_codex.jpg` (png 1MB 초과 → jpg). 나머지는 png 그대로.
