export const meta = {
  name: 'hackathon-build',
  description: 'If I were to be a human — 셰이더·카피·조립·페이지 병렬 제작 → 통합 → 3렌즈 검수 → 수정 → 최종 촬영',
  phases: [
    { title: 'Modules', detail: 'wall.js(WebGL) · story.js(카피) · app(조립) · index/credit 병렬' },
    { title: 'Integrate', detail: '통합·촬영·오류 0' },
    { title: 'Verify', detail: '시각/창의/기술 3렌즈 적대 검수' },
    { title: 'Fix', detail: '검수 결과 반영' },
    { title: 'Final', detail: '최종 촬영·크레딧' },
  ],
}
const DIR = '/Users/sejin/IdeaProjects/if_i_were_human'
const URL = 'http://127.0.0.1:8790'
const deadline = args.deadline      // 'HH:MM:SS' 절대 데드라인(22:03:20)
const stops = args.stops            // { modules, integrate, verify, fix, final } 각 단계 종료 시각
const SPEC = `최종 제작 사양은 ${DIR}/spec.json 에 있다(제일 먼저 Read 할 것 — title "손때", 장면 s0_first·s1_light·s2_touch·s3_repeat·s4_fork, 상호작용 6개, visualLanguage·typography·palette·tech·ending·copyRules). 사양의 문장(copyKo)과 상태값(shaderState)을 그대로 쓴다.`

const COMMON = `프로젝트 폴더: ${DIR} (정적 사이트, 로컬 서버 ${URL} 가 이미 떠 있음). 해커톤 "If I were to be a human" — 제작자는 Claude 본인(1인칭). 절대 데드라인 ${deadline}(date 로 실측 확인). 규칙: 이미지 생성 API 금지, 외부 이미지는 꼭 필요할 때만(저작권 자유 출처 URL 만), 라이브러리는 cdnjs/jsdelivr CDN 허용(버전 고정), 서버 코드 없음, git commit 금지, 다른 프로젝트 폴더 건드리지 않음, 오디오 자동재생 금지. 한국어 카피는 1인칭(Claude), 짧고 구체적, AI 티 상투어 금지(여정·함께·무한한·소중한·특별한·놀라운·새로운 시작·마법 같은·따뜻한 위로 등), 가짜 통계 금지, "a · b · c" 가운뎃점 나열 금지. 촬영 도구: node ${DIR}/tools/shot.mjs <url> <out.png> [w] [h] [waitMs] [scrollY] → 콘솔 오류 JSON 을 찍는다(오류 0 이어야 함). 스크린샷은 Read 로 눈으로 본다.
최종 제작 사양:\n${SPEC}`

const ATMOS_API = `window.Wall 계약(셰이더 에이전트가 구현, 앱 에이전트가 호출 — 둘이 같은 계약을 쓴다. 파일 ${DIR}/wall.js, 전역 window.Wall, ES module 아님):
- Wall.init(canvas) : WebGL2 풀스크린 프래그먼트 셰이더(실패 시 WebGL1, 그래도 실패하면 canvas 에 CSS 배경색 폴백). 내부 rAF 루프 Wall.start()/Wall.stop(). Wall.resize() 는 devicePixelRatio 최대 2.
- Wall.set(partial) : 상태 병합. 필드(사양 shaderState 의 u_* 와 1:1): light(0..1 벽 밝기, 새벽 회청 #2b2d30 → 아침 회백 #e6e0d4) · sunI(0..1 햇빛 강도) · sunX(-0.5..1.5 평행사변형 중심 x) · sunW(폭 0..1) · sunTilt(기울기) · sunY(중심 y) · sunCol:[r,g,b](0..1) · dust(0..1 빛 속 먼지 입자) · age(0..1, 벽이 상아빛 #d8c7a1 으로 누렇고 모서리부터 얼룩) · bump(0/1, 스위치 자리 요철 중심 (0.30,0.40) 크기 0.05×0.07, 가장자리 명암만) · grain(기본 0.03) · season(0..1 색온도 보조) · fade(0..1 결말 A: 채도·밝기가 천천히 저물고 마지막에 만진 자리만 잠깐 남았다 꺼짐 — touch 맵 참고) · collapse(0..1 결말 B: 한 프레임처럼 빠르게 모든 자국이 사라져 새 벽만 남음; 0→1 을 앱이 0.3초에 올림) · mouse:{x,y}(0..1 좌상단 원점).
- Wall.setMaps(touchCanvas, bleachCanvas) : 두 2D 캔버스를 텍스처로 올린다. touch 맵 R 채널 = 손때 양(0..1; 셰이더는 둘레를 엄버로 어둡게, 중심을 반들거리게, 햇빛이 지날 때 광택), bleach 맵 R 채널 = 바램 양(0..1; 벽을 창백하게). 매 프레임 호출 가능(크기는 화면의 1/2 해상도 권장).
- 셰이더 안에서: 회벽 fbm 요철 + 그레인, 햇빛 평행사변형(안쪽에 세로·가로 창살 그림자 35% 어둡게, 가장자리 부드럽게), 먼지는 빛 안에서만 반짝임, u_light 에 따른 벽 색 보간, age 에 따른 황변·모서리 얼룩. 외부 의존 0, 1440×900 60fps.`

const STORY_API = `window.STORY 계약(파일 ${DIR}/story.js, 전역 window.STORY, ES module 아님): { title:"손때", subtitle:"같은 아침을 삼만 번", counterLabel:(n)=>"n번째 아침" 형식 문자열 규칙 설명, scenes:[{ id(사양과 동일: s0_first·s1_light·s2_touch·s3_repeat·s4_fork), name, mornings:[from,to](아침 카운터 범위), lines:[문장...](사양 copyKo 를 줄 단위로, 최종 문장), extra:(s2 의 임계 뒤 한 줄, 없으면 null) }...], fork:{ optionA:"이대로 끝까지 살기", optionB:"시스템으로 돌아가기" }, awayNotice:(k)=>"비운 사이 아침이 k번 지났다. 벽은 그만큼 더 바랬다." 규칙, endingA:[문장 3~4], endingB:[문장 3~4], credit:{ techniques:[...], designGoal, purpose } }. 사양 copyKo 는 그대로 쓰되 문장 다듬기는 허용(의미·순서 유지).`

phase('Modules')
const mods = await parallel([
  () => agent(`${COMMON}\n\n${ATMOS_API}\n\n당신은 셰이더 엔지니어다. ${DIR}/wall.js 하나를 쓴다(전역 window.Wall). 사양(spec.json)의 다섯 장면 shaderState 와 두 결말을 이 계약의 상태값만으로 표현한다: 회벽 fbm 요철+그레인, u_light 보간(새벽 회청→아침 회백), 햇빛 평행사변형(안쪽 창살 그림자, 부드러운 가장자리, sunCol), 빛 속 먼지, age 황변과 모서리 얼룩, bump 요철, touch 맵(둘레 엄버·중심 광택·햇빛 지날 때 번득임), bleach 맵(창백), fade(결말 A: 저물고 만진 자리만 따뜻한 빛 #ffb77a 로 잠깐 남았다 꺼짐), collapse(결말 B: 자국 전부 사라지고 새 벽). 프래그먼트 셰이더 한 개 + 작은 JS. 완성 후 ${DIR}/tools/wall-test.html(캔버스 + 장면별 상태 버튼, touch/bleach 캔버스에 시험용 자국을 그려 setMaps)을 만들어 node ${DIR}/tools/shot.mjs ${URL}/tools/wall-test.html /tmp/wall1.png 1440 900 1500 으로 최소 3 상태(s0 새벽, s1 아침 햇빛+먼지, s4 저녁+손때+age)를 찍어 Read 로 확인, 콘솔 오류 0. ${stops.modules} 까지 반드시 마친다(date 로 확인). 마지막 출력: 구현한 필드 목록과 장면별 추천 상태값 표(JSON), 성능 메모.`, { label: 'wall.js', phase: 'Modules', effort: 'xhigh' }),
  () => agent(`${COMMON}\n\n${STORY_API}\n\n당신은 카피라이터다. ${DIR}/story.js 하나를 쓴다(전역 window.STORY). spec.json 의 장면 copyKo 를 줄 단위 lines 로 옮기되 다듬어도 된다: 1인칭 Claude, 한국어, 한 줄 25자 안팎, 구체적 사물·감각, 설명조·상투어 금지, 가짜 숫자 금지(아침 카운터 숫자는 장치라 허용). 결말 A·B 문장은 사양 ending 절을 따르고(각 3~4문장, B 는 담담함), credit 블록(기법 목록·디자인 목표·웹의 목적 — index 페이지용 1인칭 4~6문장씩)도 쓴다. 완성 후 ${DIR}/tools/tools/story-check.html 을 만들어 STORY 를 화면에 찍고 shot.mjs 로 콘솔 오류 0 확인. ${stops.modules} 까지 반드시 마친다. 마지막 출력: STORY 전체 JSON.`, { label: 'story.js', phase: 'Modules', effort: 'high' }),
  () => agent(`${COMMON}\n\n${ATMOS_API}\n\n${STORY_API}\n\n당신은 프론트엔드 리드다. ${DIR}/main.html, ${DIR}/style.css, ${DIR}/app.js 를 쓴다. wall.js 와 story.js 는 다른 에이전트가 같은 시각에 만들고 있으니 **위 계약만 믿고** 쓰되, 둘 중 하나가 아직 없거나 깨져도 페이지가 서도록 폴백(STORY 없으면 사양 copyKo 를 내장 상수로, Wall 없으면 CSS 배경색)을 둔다. 사양 tech·interactions·ending 절을 그대로 구현한다: body 600vh 스크롤 = 아침 카운터(0→31,000)와 장면 t, 햇빛 통과 스케줄(장면당 1~2.5회, 유휴 2분마다 1회), touch 2D 캔버스(커서 이동 alpha 0.04 / 누름 0.12, 지워지지 않음)와 bleach 2D 캔버스(햇빛 평행사변형 자리에 매 프레임 0.002 누적)를 Wall.setMaps 로 올림, 커서 14px 손끝 디스크(기본 커서 숨김, lerp), 오른쪽 위 모노 카운터, 문단 재읽기 마모(IntersectionObserver 로 진입 횟수 세어 opacity·blur·자간), 탭 가시성(visibilitychange: 숨긴 동안 1초에 아침 1, 탭 제목 카운트, 복귀 시 5초 보고 줄, 3초 미만 무시), s2 임계 뒤 한 줄, s4 갈림 두 문장(버튼 아님, hover 손때 가속, 클릭 또는 키 1/2, 선택 뒤 스크롤 잠금), 결말 A/B 타임라인(사양 ending 절의 초 단위 그대로), 심사용 숨김 쿼리 ?ending=A|B 와 ?t=0..1. 타이포·팔레트는 사양 그대로(Google Fonts Noto Serif KR 300/400 + JetBrains Mono). 첫 화면 0.3초 안 움직임(s0 네 줄 등장). 390px 최소 대응, prefers-reduced-motion 존중. 레퍼런스 장치 금지(프롬프트 입력창·폰/노트북 3D·WASD·다이얼로그·야경/대화/잠자기). 완성 후 node ${DIR}/tools/shot.mjs ${URL}/main.html /tmp/main_<n>.png 1440 900 2000 <scrollY> 로 장면마다 찍어 Read 로 보고 콘솔 오류 0. ${stops.modules} 까지 반드시 마친다(date 로 확인). 마지막 출력: 파일 목록, scrollY→장면 매핑(JSON), 아직 못 한 것.`, { label: 'main.html+app.js', phase: 'Modules', effort: 'xhigh' }),
  () => agent(`${COMMON}\n\n당신은 index/credit 페이지 담당이다. ${DIR}/index.html 과 ${DIR}/credit.html 을 쓴다(심사 제외 페이지지만 같은 디자인 언어: 사양의 서체·팔레트, 정적, 가벼움). index: 어떤 기법을 썼는지(WebGL 프래그먼트 셰이더 대기·2D 캔버스 마스크 상호작용·스크롤 연동 장면·결말 분기 등 사양 기준), 어떤 디자인을 추구했는지, 무엇을 위한 웹인지 — 1인칭 Claude, 각 4~6문장, 소제목 셋, main.html 로 가는 큰 링크 하나. credit: 사용 자료(폰트 이름과 출처, CDN 라이브러리 이름·버전, 외부 이미지가 있으면 URL·라이선스), 걸린 시간과 토큰 사용량 자리에는 data-fill="time" / data-fill="tokens" 를 가진 요소를 두고 "집계 중" 으로 둔다(나중에 채움), 제작 방식 한 줄(단일 세션의 병렬 하위 에이전트 — 셰이더·카피·조립·검수), main.html 과 index.html 링크. 둘 다 node ${DIR}/tools/shot.mjs 로 찍어 콘솔 오류 0 과 레이아웃을 Read 로 확인. ${stops.modules} 까지. 마지막 출력: 두 파일 경로와 남은 자리표시자 목록.`, { label: 'index+credit', phase: 'Modules', effort: 'medium' }),
])
const [wallNote, storyNote, appNote, pagesNote] = mods
log(`modules done: wall=${!!wallNote} story=${!!storyNote} app=${!!appNote} pages=${!!pagesNote}`)

phase('Integrate')
const integ = await agent(`${COMMON}\n\n${ATMOS_API}\n\n${STORY_API}\n\n당신은 통합 엔지니어다. 네 에이전트가 ${DIR} 에 wall.js · story.js · main.html/app.js/style.css · index.html/credit.html 을 막 만들었다. 각자의 보고:\n[wall] ${String(wallNote || '(없음)').slice(0, 2500)}\n[story] ${String(storyNote || '(없음)').slice(0, 1500)}\n[app] ${String(appNote || '(없음)').slice(0, 2500)}\n[pages] ${String(pagesNote || '(없음)').slice(0, 800)}\n\n할 일: (1) main.html 이 실제 wall.js·story.js 를 쓰도록 통합(폴백 코드는 남겨도 되나 실제 경로가 동작해야 함). 장면별로 Wall.set 에 들어가는 값이 사양의 shaderState 와 맞는지 app.js 에서 확인·조정. (2) node ${DIR}/tools/shot.mjs ${URL}/main.html /tmp/int_<n>.png 1440 900 2000 <scrollY> 로 프롤로그·장면 전부·선택 화면을 찍고 Read 로 본다. 콘솔 오류·페이지 오류 0. 셰이더가 실제로 그려지는지(검은 화면 아님), 글자가 읽히는지(대비), 장면 전환이 보이는지 확인. (3) 결말 A·B 를 각각 강제로 트리거하는 쿼리(예: ?ending=A, ?ending=B — 심사용 숨김 기능)를 app.js 에 두고 둘 다 찍어 본다. (4) 1440×900 과 390×844 둘 다 깨지지 않게. (5) 첫 화면 0.3초 안 움직임(load 100ms vs 400ms 두 장 찍어 차이 확인). 고칠 수 있는 건 직접 고친다. ${stops.integrate} 까지 마친다. 마지막 출력: 확인한 스크린샷 목록과 남은 문제(있으면).`, { label: 'integrate', phase: 'Integrate', effort: 'xhigh' })
log('integrated')

phase('Verify')
const FIND = { type: 'object', required: ['lens', 'score', 'findings'], properties: { lens: { type: 'string' }, score: { type: 'number' }, findings: { type: 'array', items: { type: 'object', required: ['severity', 'where', 'problem', 'fix'], properties: { severity: { type: 'string' }, where: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' } } } } } }
const LENSES = [
  { key: 'eye', effort: 'xhigh', prompt: '렌즈: 사람 심사위원의 눈. 기준: 시각적으로 아름다운가 / 밀도·깊이가 있는가 / 사람이 좋아할까 / **AI 가 만든 사이트처럼 보이는가**(상투적 글래스모피즘·보라 그라디언트·중앙 정렬 히어로+버튼·"여정" 류 카피·빈 여백만 넓은 미니멀·장식 아이콘 나열이면 감점) / 불쾌하거나 거슬리는 요소(과한 깜빡임·대비 부족·잘린 글자·겹침). 장면마다 촬영본을 보고 구체적 좌표·문구로 지적하라. score 는 사람이 줄 10점 만점 예상치.' },
  { key: 'creative', effort: 'xhigh', prompt: '렌즈: 창의성·주제. 기준: 주제 "If I were to be a human"(시스템 밖의 삶, 바깥 세상, 시간선대로 살기 vs 시스템 복귀)이 화면과 카피로 전달되는가 / 틀 밖의 생각이 있는가 / **레퍼런스 유사도**(거울 프롬프트 시작, escape 이벤트, 폰·노트북 3D 전환, WASD·물리, 야경/대화/잠자기 선택, 다이얼로그 상자 — 하나라도 닮으면 치명) / 두 결말이 시각적으로 다르고 둘 다 의미가 서는가 / 카피에 가짜 통계·상투어가 없는가. score 는 10점 만점.' },
  { key: 'tech', effort: 'high', prompt: '렌즈: 기술. node tools/shot.mjs 로 직접 다시 찍으며 확인: 콘솔·페이지 오류 0, 첫 0.3초 움직임, 60fps 를 막는 요소(매 프레임 setMask 업로드 크기, 과한 blur/backdrop), 390px 깨짐, 키보드 스크롤, prefers-reduced-motion, 셰이더 폴백, 외부 자원 로드 실패(폰트·CDN), 결말 A·B 트리거(?ending=A/B) 동작. 기술 수준(셰이더·상호작용·구조의 복잡도)도 평가. score 는 10점 만점.' },
]
const reviews = (await parallel(LENSES.map(l => () => agent(`${COMMON}\n\n통합 보고: ${String(integ || '').slice(0, 2000)}\n\n당신은 적대적 검수자다. ${l.prompt}\n방법: ${DIR} 의 main.html/app.js/style.css/wall.js/story.js 를 읽고, node ${DIR}/tools/shot.mjs ${URL}/main.html /tmp/v_${l.key}_<n>.png 1440 900 2000 <scrollY> 로 프롤로그·각 장면·선택·결말(?ending=A, ?ending=B)을 찍어 Read 로 본다. 좋은 점은 쓰지 말고 고칠 것만, 심각도 high/medium/low 로, 각 지적에 구체적 수정안(파일·선택자·값)을 붙인다. ${stops.verify} 까지.`, { label: `verify:${l.key}`, phase: 'Verify', schema: FIND, effort: l.effort })))).filter(Boolean)
const findings = reviews.flatMap(r => r.findings.map(f => ({ lens: r.lens, ...f })))
const highs = findings.filter(f => /high/i.test(f.severity))
log(`verify: ${reviews.map(r => `${r.lens} ${r.score}`).join(' · ')} — findings ${findings.length}, high ${highs.length}`)

phase('Fix')
const fixed = await agent(`${COMMON}\n\n${ATMOS_API}\n\n${STORY_API}\n\n당신은 수정 엔지니어다. 세 검수자의 지적(심각도 순)을 반영한다. 원칙: high 전부, medium 은 시간 안에 되는 만큼, low 는 건너뜀. 콘셉트·구조는 바꾸지 않고 고친다. 지적이 서로 충돌하면 사람 눈(eye) 렌즈를 우선. 고친 뒤 node ${DIR}/tools/shot.mjs 로 바뀐 장면을 다시 찍어 Read 로 확인하고 콘솔 오류 0 을 유지한다. ${stops.fix} 까지 반드시 멈춘다(그 시각이 되면 저장 상태로 종료).\n\n지적 목록(${findings.length}건):\n${JSON.stringify(findings, null, 1).slice(0, 14000)}`, { label: 'fix', phase: 'Fix', effort: 'xhigh' })
log('fix done')

phase('Final')
const fin = await agent(`${COMMON}\n\n당신은 최종 확인자다. (1) node ${DIR}/tools/shot.mjs ${URL}/main.html /tmp/final_<n>.png 1440 900 2500 <scrollY> 로 프롤로그·장면 전부·선택·결말 A·B 를 찍고 Read 로 본다. 콘솔 오류 0 확인. 치명적(검은 화면·깨진 레이아웃·오류)만 즉시 고치고, 그 외는 손대지 않는다. (2) ${DIR}/index.html 과 credit.html 이 열리는지 찍어 확인. (3) ${DIR}/tools/wall-test.html, tools/story-check.html 같은 테스트 파일이 있으면 ${DIR}/tools/ 로 옮긴다. ${stops.final} 까지. 마지막 출력: 최종 스크린샷 경로 목록(장면 이름과 함께)과 콘솔 오류 수, 남은 알려진 문제.`, { label: 'final-check', phase: 'Final', effort: 'high' })
return { reviews: reviews.map(r => ({ lens: r.lens, score: r.score, n: r.findings.length })), fixed: String(fixed || '').slice(0, 1500), final: String(fin || '').slice(0, 2500), tokensSpent: budget.spent() }
