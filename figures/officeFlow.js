/* 코덱스 납품 그림(2026-10-14 FIGKIT 기준으로 재작성). 현재 글은 notes/office.js 의 flowSvg 를 쓰고, 이 그림은 예비입니다. */
window.FIGURES=window.FIGURES||{};
window.FIGURES.officeFlow=()=>{const K=window.FIGKIT,C=K.C,M='officeFlow-arrow',W=235,H=96;
const nodes=[['01','프롬프트',45,160],['02','분류',335,160],['03','회의 5막',625,160],['04','하네스 검증',915,160,1],['05','사람 평점',915,370],['06','회고와 처방',625,370,1],['07','다음 회의',335,370]];
let s=K.open(1200,620,{label:'Agent Office의 작업 흐름. 프롬프트, 분류, 회의 5막, 하네스 검증, 사람 평점, 회고와 처방, 다음 회의',marker:M,rx:20});
s+='<g class="fg-w">'+K.head('Agent Office의 작업 흐름','제작에서 검증, 사람의 피드백까지',{size:22,subSize:15,x:40,y:48,gap:26})+K.pill(1150,52,'함정 3',{size:14,w:700,fill:C.accentTint,stroke:'#f0cdb8',color:C.accentInk,a:'end',padX:14});
nodes.forEach(([n,t,x,y,hl])=>s+=K.node(x,y,W,H,{n,t,hl:!!hl,size:20,br:13}));
s+=K.path('M280 208h53',{marker:M})+K.path('M570 208h53',{marker:M})+K.path('M860 208h53',{marker:M})+K.path('M1032 256V368',{marker:M})+K.path('M915 418h-53',{marker:M})+K.path('M625 418h-53',{marker:M})+K.path('M452 466V537H597V236H623',{marker:M,dash:'6 5'});
s+=K.text(600,590,'사람의 평가와 회고를 다음 작업에 반영',{size:15,fill:C.muted,a:'middle'})+'</g>';
s+=K.snake(nodes.map(([n,t,,,hl])=>({n,t,hl:!!hl})),{title:'Agent Office의 작업 흐름',marker:M,loop:true});
return s+K.close();};
