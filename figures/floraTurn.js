/* 코덱스 납품 그림(2026-10-14 FIGKIT 기준으로 재작성). 2026-10-16: PDF 판(라벨을 선 위가 아니라 전용 여백에 두는 배치)으로 데스크톱 층 교체. 모바일 층은 snake 유지. */
window.FIGURES=window.FIGURES||{};
window.FIGURES.floraTurn=()=>{const K=window.FIGKIT,C=K.C,M='floraTurn-arrow',bw=150,bh=88,by=182,bx=i=>40+i*242;
const titles=['기억 검색','상태 반영','응답 생성','검증','저장'];
let s=K.open(1200,550,{label:'Flora 메시지 처리 과정과 검증 실패 시 한 번의 재작성',marker:M,rx:20});
s+='<g class="fg-w">'+K.head('메시지 한 번의 처리 과정','기억 검색부터 답변 저장까지 진행 상황을 SSE로 전달합니다.',{x:40,y:44,size:23,subSize:16,gap:28});
for(let i=0;i<4;i++){s+=K.path(`M${bx(i)+bw+3} 226H${bx(i+1)-5}`,{marker:M,sw:1.8});s+=K.text(bx(i)+bw+46,207,['기억과 프로필','현재 상태','응답 초안','최종 답변'][i],{size:13.5,fill:C.muted,a:'middle'});}
s+=K.path('M841 182V119H599V182',{marker:M,dash:'7 5',sw:1.6})+K.text(720,105,'검증 실패 시 한 번 재작성',{size:15,fill:C.muted,a:'middle'});
s+=K.path('M115 344V276',{marker:M,dash:'7 5',sw:1.6})+K.text(134,315,'먼저 말을 걸지 결정',{size:15,fill:C.muted});
s+=K.path('M1083 274V344',{marker:M,dash:'7 5',sw:1.6})+K.text(1065,315,'요약할 대화 전달',{size:15,fill:C.muted,a:'end'});
titles.forEach((t,i)=>s+=K.node(bx(i),by,bw,bh,{n:String(i+1).padStart(2,'0'),t,hl:i===3,size:21,br:13}));
s+=K.node(40,350,150,70,{t:'선톡 조건 확인',size:17,dash:'7 5',stroke:C.gray,color:C.muted})+K.node(1008,350,150,70,{t:'기억 요약과 승격',size:16,dash:'7 5',stroke:C.gray,color:C.muted});
s+=K.text(40,479,'점선은 메시지 응답과 별도로 처리하는 작업입니다.',{size:17,fill:C.ink})+K.text(40,509,'침묵 시간, 하루 횟수 제한, 활동 시간대를 확인해 먼저 말을 걸지 정합니다.',{size:16,fill:C.muted});
s+='</g>'+K.snake(titles.map((t,i)=>({n:String(i+1).padStart(2,'0'),t,hl:i===3})),{title:'메시지 한 번의 처리 과정',marker:M});
return s+K.close();};
