/* 코덱스 납품 그림(2026-10-14 FIGKIT 기준으로 재작성). 값은 layer_sensitivity.csv 와 같고(소수 4자리), 글자는 그대로. 현재 글은 notes/exaone.js 의 sensitivityChart 를 쓰고 이 그림은 예비입니다. */
window.FIGURES=window.FIGURES||{};
window.FIGURES.layerSensitivity=()=>{const K=window.FIGKIT,C=K.C,M='layerSensitivity-arrow';
const S=[0.2862,0.7478,0.8421,0.8602,0.8624,0.8602,0.8525,0.8704,0.8344,0.8583,0.8774,0.8769,0.8569,0.8483,0.8653,0.8617,0.8658,0.8644,0.8514,0.8699,0.8503,0.8431,0.8672,0.8669,0.8266,0.8679,0.8527,0.848,0.8554,0.8572];
const L=80,R=50,T=140,yb=470,step=(1200-L-R)/30,y=v=>yb-v*(yb-T);
let s=K.open(1200,620,{label:'레이어별 모사 양자화 응답 유사도. 0번 0.29, 1번 0.75, 나머지 0.83에서 0.88',marker:M,rx:20});
for(const v of [.25,.5,.75,1])s+=K.line(L,y(v),1200-R,y(v),{stroke:C.grid});s+=K.line(L,yb,1200-R,yb,{stroke:C.axis});
S.forEach((v,i)=>s+=`<rect x="${(L+i*step+5).toFixed(1)}" y="${y(v).toFixed(1)}" width="${(step-10).toFixed(1)}" height="${(yb-y(v)).toFixed(1)}" rx="3" fill="${i<2?C.accent:C.soft}"><title>레이어 ${i}: ${v}</title></rect>`);
s+='<g class="fg-w">'+K.head('레이어별 모사 양자화 응답 유사도','낮을수록 원본 응답과의 차이가 큼 / 레이어당 10샘플의 참고 경향',{size:22,subSize:15,x:40,y:48,gap:26});
for(const v of [0,.25,.5,.75,1])s+=K.text(L-12,y(v)+5,v,{size:15,fill:C.muted,a:'end'});
for(const i of [0,5,10,15,20,25,29])s+=K.text(L+i*step+step/2,yb+26,i,{size:15,fill:C.muted,a:'middle'});
s+=K.text(1200-R,yb+54,'레이어 번호',{size:15,fill:C.muted,a:'end'});
s+=K.text(L+step/2,y(S[0])-10,S[0].toFixed(2),{size:15,w:700,fill:C.accentInk,a:'middle'})+K.text(L+step*1.5,y(S[1])-10,S[1].toFixed(2),{size:15,w:700,fill:C.accentInk,a:'middle'});
s+=K.text(40,577,'유사도는 최종 레시피 결정의 참고값입니다. 개별 레이어의 최적 비트 할당을 뜻하지 않습니다.',{size:15,fill:C.muted})+'</g>';
s+='<g class="fg-m">'+K.text(40,54,'레이어별 응답 유사도',{size:32,w:700});
for(const v of [0,.5,1])s+=K.text(L-12,y(v)+10,v,{size:28,fill:C.muted,a:'end'});
for(const i of [0,1,15,29])s+=K.text(L+i*step+step/2,yb+36,i,{size:28,fill:C.muted,a:'middle'});
s+=K.text(L+step/2,y(S[0])-12,S[0].toFixed(2),{size:28,w:700,fill:C.accentInk,a:'middle'})+K.text(L+step*1.5,y(S[1])-12,S[1].toFixed(2),{size:28,w:700,fill:C.accentInk,a:'middle'})+'</g>';
return s+K.close();};
