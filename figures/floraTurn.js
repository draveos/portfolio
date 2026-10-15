/* 코덱스 납품 그림(2026-10-14 FIGKIT 기준으로 재작성). 노트 본문의 사실만 추가: 프로필 강제 포함, 산문 컴파일, 초안 검증과 1회 재작성, 승격 비동기, 선톡 게이트. */
window.FIGURES=window.FIGURES||{};
window.FIGURES.floraTurn=()=>{const K=window.FIGKIT,C=K.C,M='floraTurn-arrow';
const steps=[['01','기억 회수'],['02','상태 반영'],['03','응답 생성'],['04','검증'],['05','저장']],bw=150,bh=96,gap=(1200-90-bw*5)/4,by=170;
const bx=i=>45+i*(bw+gap);
let s=K.open(1200,560,{label:'Flora 기억 회수 상태 반영 응답 생성 검증 저장의 턴 흐름',marker:M,rx:20});
s+='<g class="fg-w">'+K.head('한 턴이 응답으로 이어지는 과정','대화 처리 순서. 각 단계의 진행 상황을 SSE 이벤트로 전달합니다',{size:22,subSize:15,x:40,y:48,gap:26});
steps.forEach(([n,t],i)=>{s+=K.node(bx(i),by,bw,bh,{n,t,hl:i===3,size:20,br:13});if(i<4)s+=K.path(`M${bx(i)+bw} ${by+bh/2}H${bx(i+1)-2}`,{marker:M});});
[['기억과 프로필',0],['상태 설명',1],['초안',2],['최종 답',3]].forEach(([t,i])=>s+=K.pill(bx(i)+bw+gap/2,by+bh/2+8,t,{size:13.5,w:500,color:C.muted,a:'middle'}));
s+=K.path(`M${bx(3)+bw/2} ${by}V126H${(bx(2)+bx(3)+bw)/2+112}`,{dash:'6 5'})+K.path(`M${(bx(2)+bx(3)+bw)/2-112} 126H${bx(2)+bw/2}V${by-2}`,{marker:M,dash:'6 5'})+K.pill((bx(2)+bx(3)+bw)/2,126,'검증 실패 시 한 번 재생성',{size:14.5,w:500,color:C.muted,a:'middle'});
s+=K.node(bx(4),330,bw,70,{t:'승격 (비동기)',size:16,dash:'6 5',stroke:C.gray,color:C.muted})+K.path(`M${bx(4)+bw/2} ${by+bh}V328`,{marker:M,dash:'6 5'})+K.pill(bx(4)+bw/2+10,300,'요약 대상 전달',{size:14.5,w:500,color:C.muted});
s+=K.node(bx(0),330,bw,70,{t:'선톡 게이트',size:16,dash:'6 5',stroke:C.gray,color:C.muted})+K.path(`M${bx(0)+bw/2} 330V${by+bh+2}`,{marker:M,dash:'6 5'})+K.pill(bx(0)+bw/2+10,300,'먼저 말을 걸지 결정',{size:14.5,w:500,color:C.muted});
s+=K.text(45,475,'검색한 기억과 현재 상태를 반영하고, 검증을 거쳐 대화를 남깁니다.',{size:16,fill:C.ink})+K.text(45,503,'점선 상자는 대화 처리와 별도로 실행합니다. 선톡 게이트는 침묵 시간, 일일 상한, 활동 시간대로 정합니다.',{size:15,fill:C.muted});
s+='</g>'+K.snake(steps.map(([n,t],i)=>({n,t,hl:i===3})),{title:'한 턴이 응답으로 이어지는 과정',marker:M});
return s+K.close();};
