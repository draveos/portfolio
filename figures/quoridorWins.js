/* 코덱스 납품 그림(2026-10-14 FIGKIT 기준으로 재작성). 값과 글자는 그대로. 현재 글은 notes/quoridor.js 의 winChart 를 쓰고 이 그림은 예비입니다. */
window.FIGURES=window.FIGURES||{};
window.FIGURES.quoridorWins=()=>{const K=window.FIGKIT,C=K.C,M='quoridorWins-arrow';
const pts=[[1,0],[2,0],[5,0],[6,0],[8,8],[9,15],[11,52],[12,45],[14,45]],X=r=>100+(r-1)*77,Y=v=>477-v*5.3;
let s=K.open(1200,620,{label:'회의 회차별 관측 승률. 1, 2, 5, 6회차 0%, 8회차 8%, 9회차 15%, 11회차 52%, 12회차와 14회차 45%',marker:M,rx:20});
for(const v of [20,40,60])s+=K.line(85,Y(v),1140,Y(v),{stroke:C.grid});s+=K.line(85,Y(0),1140,Y(0),{stroke:C.axis});
s+=K.line(908,130,908,488,{stroke:C.accent,dash:'5 7',sw:1.5});
pts.forEach(([r,v])=>s+=`<g><title>${r}회차 ${v}%</title>${K.circle(X(r),Y(v),8,{fill:r>=12?C.accent:C.blue,stroke:'#fff',sw:2})}</g>`);
s+='<g class="fg-w">'+K.head('회의 회차별 관측 승률','12회차부터 상대 버전 변경 / 누락된 회차와 두 상대 구간은 연결하지 않음',{size:22,subSize:15,x:40,y:48,gap:26});
for(const v of [0,20,40,60])s+=K.text(65,Y(v)+5,v+'%',{size:15,fill:C.muted,a:'end'});
pts.forEach(([r,v])=>s+=K.text(X(r),Y(v)-16,v+'%',{size:17,w:600,fill:r>=12?C.accentInk:C.blue,a:'middle',halo:true})+K.text(X(r),511,r,{size:15,fill:C.muted,a:'middle'}));
s+=K.pill(916,118,'상대 버전 변경',{size:14,w:600,color:C.accentInk,stroke:'#f0cdb8'})+K.legend(85,560,[{k:'dot',color:C.blue,label:'이전 상대'},{k:'dot',color:C.accent,label:'새 상대(12회차부터)'}],{size:15});
s+=K.text(1140,575,'11회차: 구 Codex 상대 21 / 40승. 각 회차의 표본 수와 조건은 동일하지 않습니다.',{size:15,fill:C.muted,a:'end'})+'</g>';
s+='<g class="fg-m">'+K.text(40,54,'회의 회차별 관측 승률',{size:32,w:700});
for(const v of [0,40])s+=K.text(65,Y(v)+10,v+'%',{size:28,fill:C.muted,a:'end'});
pts.forEach(([r,v])=>s+=K.text(X(r),Y(v)-18,v+'%',{size:28,w:700,fill:r>=12?C.accentInk:C.blue,a:'middle',halo:true}));
for(const r of [1,5,9,12,14])s+=K.text(X(r),520,r+'회차',{size:28,fill:C.muted,a:'middle'});
s+=K.pill(916,118,'상대 교체',{size:28,w:600,color:C.accentInk,stroke:'#f0cdb8',padX:14})+'</g>';
return s+K.close();};
