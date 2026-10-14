/* 코덱스 납품 그림(2026-10-14 FIGKIT 기준으로 재작성). 현재 글은 notes/flora.js 의 memoryTiers 를 쓰고, 이 그림은 예비입니다. */
window.FIGURES=window.FIGURES||{};
window.FIGURES.floraMemory=()=>{const K=window.FIGKIT,C=K.C,M='floraMemory-arrow',W=330,H=100;
const nodes=[['01','입력',40,170],['02','단기 맥락',431,170,1],['03','정리와 요약',822,170],['04','장기 저장',40,378,1],['05','회수 / 검색',431,378],['06','응답',822,378]];
let s=K.open(1200,620,{label:'Flora의 메모리 흐름. 입력, 단기 맥락, 정리와 요약, 장기 저장, 회수와 검색, 응답',marker:M,rx:20});
s+='<g class="fg-w">'+K.head('Flora의 메모리 흐름','대화 맥락과 장기 기억을 연결하는 공개 개념도',{size:22,subSize:15,x:40,y:48,gap:26});
nodes.forEach(([n,t,x,y,hl])=>s+=K.node(x,y,W,H,{n,t,hl:!!hl,size:20,br:13}));
s+=K.path('M370 220h59',{marker:M})+K.path('M761 220h59',{marker:M})+K.path('M370 428h59',{marker:M})+K.path('M761 428h59',{marker:M})+K.path('M987 270V324H205V376',{marker:M});
s+=K.text(40,561,'저장과 요약은 별도 처리됩니다. 한 턴의 실행 순서를 뜻하지 않습니다.',{size:15,fill:C.muted})+'</g>';
s+=K.snake(nodes.map(([n,t,,,hl])=>({n,t,hl:!!hl})),{title:'Flora의 메모리 흐름',marker:M});
return s+K.close();};
