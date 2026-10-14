/* 코덱스 납품 그림(2026-10-14 FIGKIT 기준으로 재작성). 글자는 그대로 두었습니다([채움] 표시 포함). 현재 글에는 쓰이지 않는 예비 그림입니다. */
window.FIGURES=window.FIGURES||{};
window.FIGURES.exaoneRecipes=()=>{const K=window.FIGKIT,C=K.C,M='exaoneRecipes-arrow',bw=172,gap=15,by=170;
const steps=[['01','전체 W4','Linear 전체 양자화','≈ 0.50'],['02','down / o 보호','출력 모듈을 W8로','[채움]'],['03','중간 레이어','11–14번 보호 시도','[채움]'],['04','롤백','W4 blk128로 복귀','[채움]'],['05','이전 최고','세부 레시피 확인 필요','0.596'],['06','최종','q 추가 / up 0–11','0.62422']];
const bx=i=>40+i*(bw+gap);
let s=K.open(1200,620,{label:'바꿔 본 양자화 레시피 여섯 단계와 리더보드 점수',marker:M,rx:20});
s+='<g class="fg-w">'+K.head('바꿔 본 양자화 레시피','모사 양자화 측정과 제출 결과를 참고한 실험 이력',{size:22,subSize:15,x:40,y:48,gap:26});
steps.forEach(([n,t,d,sc],i)=>{const x=bx(i),fill=sc==='[채움]';s+=K.node(x,by,bw,96,{n,t,hl:i===5,size:19,br:13})+K.text(x+bw/2,by+124,d,{size:15,fill:C.muted,a:'middle'})+K.pill(x+bw/2,by+170,sc,{size:16,w:700,a:'middle',fill:fill?'#fff1cc':C.tint,stroke:fill?'#f0d35a':C.tint2,color:fill?'#8a6d00':C.blue,padX:14});if(i<5)s+=K.path(`M${x+bw} ${by+48}h${gap-2}`,{marker:M});});
s+=K.text(40,475,'LB 점수',{size:16,w:700})+K.text(40,510,'기록이 없는 점수는 채움 표시로 남겼습니다. 베이스라인은 근삿값입니다.',{size:15,fill:C.muted})+K.text(40,547,'최종: q / o / down 전 레이어 W8, up 0–11 W8. 나머지 Linear W4.',{size:15,fill:C.muted})+'</g>';
s+=K.snake(steps.map(([n,t],i)=>({n,t,hl:i===5})),{title:'바꿔 본 양자화 레시피',marker:M});
return s+K.close();};
