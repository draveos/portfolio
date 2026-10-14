/* 코덱스 납품 그림(2026-10-14 FIGKIT 기준으로 재작성). 현재 글에는 쓰이지 않는 예비 그림입니다. */
window.FIGURES=window.FIGURES||{};
window.FIGURES.floraSurfaces=()=>{const K=window.FIGKIT,C=K.C,M='floraSurfaces-arrow';
let s=K.open(1200,620,{label:'여러 화면, 같은 상태. 웹과 CLI, 메뉴바가 한 백엔드를 공유하고 로컬 메모리 저장소에 이어집니다',marker:M,rx:20});
s+='<g class="fg-w">'+K.head('여러 화면, 같은 상태','웹과 CLI, 메뉴바가 한 백엔드를 공유하는 구성',{size:22,subSize:15,x:40,y:48,gap:26});
[['01','Web',145],['02','CLI / TUI',292],['03','macOS 메뉴바',439]].forEach(([n,t,y])=>s+=K.node(45,y,235,96,{n,t,size:20,br:13}));
s+=K.node(425,290,300,100,{n:'04',t:'단일 백엔드',hl:true,size:20,br:13})+K.node(845,290,285,100,{n:'05',t:'로컬 메모리 저장',size:20,br:13});
s+=K.path('M280 193H365V340H423',{marker:M})+K.path('M280 340H423',{marker:M})+K.path('M280 487H365V340')+K.path('M725 340H843',{marker:M});
s+=K.pill(575,420,'상태 이벤트를 각 화면에 전달',{size:15,w:500,color:C.muted,a:'middle'})+'</g>';
s+='<g class="fg-m">'+K.text(40,54,'여러 화면, 같은 상태',{size:32,w:700});
[['01','Web',40],['02','CLI / TUI',420],['03','macOS 메뉴바',800]].forEach(([n,t,x])=>s+=K.node(x,100,360,86,{n,t,size:31,br:22,rx:16})+K.path(`M${x+180} 186V226H600V256`,{sw:4,marker:M}));
s+=K.node(40,260,1120,86,{n:'04',t:'단일 백엔드',hl:true,size:31,br:22,rx:16})+K.path('M600 346V386',{sw:4,marker:M})+K.node(40,390,1120,86,{n:'05',t:'로컬 메모리 저장',size:31,br:22,rx:16});
s+=K.text(600,540,'상태 이벤트를 각 화면에 전달',{size:26,fill:C.muted,a:'middle'})+'</g>';
return s+K.close();};
