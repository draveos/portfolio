/* 코덱스 납품 그림(2026-10-14 FIGKIT 기준으로 재작성). 글자와 사실은 그대로, 상자, 화살표, 배지만 공용 스타일. */
window.FIGURES=window.FIGURES||{};
window.FIGURES.exaoneProxy=()=>{const K=window.FIGKIT,C=K.C,M='exaoneProxy-arrow';
let s=K.open(1200,620,{label:'원본과 양자화 모델을 동일 문항으로 비교하는 프록시 평가기',marker:M,rx:20});
s+='<g class="fg-w">'+K.head('제출 전에 비교하는 프록시 평가기','같은 문항으로 성능 변화와 생성 시간을 함께 확인',{size:22,subSize:15,x:40,y:48,gap:26});
s+=K.node(45,150,225,96,{n:'01',t:'원본 모델',size:20,br:13})+K.node(45,300,225,96,{n:'02',t:'양자화 모델',size:20,br:13})+K.node(350,225,200,96,{n:'03',t:'같은 평가 문항',size:20,br:13});
s+=K.rect(620,135,530,280,{rx:12,fill:'#fff',stroke:C.box,sw:1.5})+K.circle(641,157,13,{fill:C.tint})+K.text(641,162,'04',{size:14,w:700,fill:C.blue,a:'middle',cls:'fg-n'})+K.text(662,161,'비교 지표',{size:16,w:700});
[['NLL 차이',650,210],['토큰당 생성 시간',900,210],['수학 exact-match',650,300],['ROUGE-L',900,300]].forEach(([t,x,y])=>s+=K.rect(x,y,230,62,{rx:10,fill:C.tint})+K.text(x+115,y+38,t,{size:18,w:600,a:'middle'}));
s+=K.path('M270 198H315V273H348',{marker:M})+K.path('M270 348H315V273')+K.path('M550 273H618',{marker:M})+K.path('M885 415V445H700V473',{marker:M});
s+=K.node(310,475,780,80,{t:'LG_proxy = perf_ratio × (1 + speed_gain)',hl:true,size:24})+K.text(700,585,'공식 평가 점수를 추정하기 위한 자체 근사 지표',{size:15,fill:C.muted,a:'middle'});
s+='</g><g class="fg-m">'+K.text(40,54,'제출 전에 비교하는 프록시 평가기',{size:32,w:700});
s+=K.node(40,100,540,86,{n:'01',t:'원본 모델',size:31,br:22,rx:16})+K.node(620,100,540,86,{n:'02',t:'양자화 모델',size:31,br:22,rx:16});
s+=K.path('M310 186V220H600V236',{sw:4,marker:M})+K.path('M890 186V220H600')+K.node(40,240,1120,86,{n:'03',t:'같은 평가 문항',size:31,br:22,rx:16});
s+=K.path('M600 326V356',{sw:4,marker:M})+K.node(40,360,1120,86,{n:'04',t:'비교 지표: NLL 차이, 생성 시간, exact-match, ROUGE-L',size:31,br:22,rx:16});
s+=K.path('M600 446V476',{sw:4,marker:M})+K.node(40,480,1120,86,{t:'LG_proxy = perf_ratio × (1 + speed_gain)',hl:true,size:31,rx:16})+'</g>';
return s+K.close();};
