// 인연 이야기: 친밀도 단계가 열릴 때 영업 준비 화면에서 한 번 나온다(ledger.story['bond:<id>:<단계>']).
// 게임 오리지널 외전(원작 사실 아님). 네오의 정체·과거는 다루지 않는다. 형식은 prologue.js 박자와 같다.
// choices 는 분위기용 대답이다. 게임 상태를 바꾸지 않고 고른 답의 beats 만 이어 붙인다(능력은 단계에서 이미 정해짐).

export const BOND_STORIES = Object.freeze({
  neo: [
    [
      { chapter: ['인연 · 네오 ♥1', '달그늘 사냥터의 발자국'], bg: 'river_night', l: 'yeoni:normal', c: 'neo_cat:normal', r: null },
      { s: 'nar', t: '마감 후, 연이는 장부를 품에 안고 영냥이의 작은 발자국을 따라 강가까지 왔다.' },
      { s: 'neo_cat', t: '사냥터까지 따라오다니. 계산대는 비워 둬도 되는 거냐.' },
      { s: 'yeoni', t: '마감했거든! 월정석이 몇 개인지 내 눈으로 세야 마음이 놓여.', l: 'yeoni:determined' },
      { s: 'nar', t: '검은 손이 강 건너 안개 속에서 한 번 꿈틀거렸다. 영냥이의 꼬리가 바짝 섰다.' },
      { s: 'neo_cat', t: '…세는 건 좋다. 대신 내 뒤에서 세라.', c: 'neo_cat:serious' },
      { s: 'nar', t: '연이는 장부를 어떻게 할까?', skipText: '건너뛰기', choices: [
        { id: 'hold', text: '장부를 꼭 안고 뒤에 선다.', beats: [
          { s: 'yeoni', t: '뒤에서 세는 거, 회계 담당의 정석이지. 꿀악.', l: 'yeoni:smile' },
          { s: 'neo_cat', t: '정석이라. 좋은 말이군.', c: 'neo_cat:smug' },
        ] },
        { id: 'lamp', text: '장부 대신 등불을 들어 길을 비춘다.', beats: [
          { s: 'yeoni', t: '세는 건 나중에! 지금은 네 발밑부터 밝혀 줄게.', l: 'yeoni:determined' },
          { s: 'neo_cat', t: '…밝군. 고맙다는 말은 사냥이 끝나고 하지.', c: 'neo_cat:normal' },
        ] },
      ] },
      { s: 'nar', t: '그날 밤, 영냥이는 평소보다 한 번 더 버텼고 연이는 월정석을 두 번 셌다.' },
      { s: 'neo_cat', t: '내일 아침엔 네 농장에 물 정도는 주고 가마. 사냥 가는 길이니까.', c: 'neo_cat:normal' },
      { s: 'yeoni', t: '(가는 길이라면서 농장은 반대 방향인데… 모른 척해 주자.)', l: 'yeoni:smile' },
      { s: 'sys', t: '[ 네오 ♥1 · 사냥 시작 HP +40 · 순마다 한 번 농장 물주기·돌봄 대행 ]' },
    ],
    [
      { chapter: ['인연 · 네오 ♥2', '발톱을 가는 밤'], bg: 'atelier_dark', l: 'yeoni:surprised', c: 'neo:normal', r: null },
      { s: 'nar', t: '마감 후 창가, 네오가 영냥이 장갑의 실밥을 하나하나 다시 꿰매고 있었다.' },
      { s: 'neo', t: '검은 손이 점점 단단해져. 그만큼 우리도 날카로워져야지.' },
      { s: 'yeoni', t: '(바느질 솜씨 별 다섯. 근데 그걸 왜 네오가 하는 거지?)', l: 'yeoni:normal' },
      { s: 'neo', t: '…영냥이가 부탁했어. 걔는 손이 작아서 바늘을 못 잡거든.', c: 'neo:flustered' },
      { s: 'nar', t: '연이는 뭐라고 말할까?', skipText: '건너뛰기', choices: [
        { id: 'help', text: '실 끝을 잡아 줄게.', beats: [
          { s: 'yeoni', t: '둘이 하면 반 시간이면 끝나. 실 끝은 내가 잡을게.', l: 'yeoni:smile' },
          { s: 'neo', t: '…응. 그럼 매듭은 연이가 지어 줘. 그게 더 단단하더라.', c: 'neo:smile' },
        ] },
        { id: 'tease', text: '영냥이한테 고맙다는 말 전해 줄게.', beats: [
          { s: 'yeoni', t: '영냥이 만나면 네오가 밤새 꿰매 줬다고 꼭 말해 줄게!', l: 'yeoni:smile' },
          { s: 'neo', t: '그, 그건 안 해도 돼. 걔도… 다 알아.', c: 'neo:flustered' },
        ] },
      ] },
      { s: 'nar', t: '다음 날 영냥이의 발톱은 장갑 끝에서 달빛처럼 반짝였다.' },
      { s: 'sys', t: '[ 네오 ♥2 · 사냥 무기 피해 +35% ]' },
    ],
    [
      { chapter: ['인연 · 네오 ♥3', '영냥이, 농부가 되다'], bg: 'atelier_lit', l: 'yeoni:surprised', c: 'neo_cat:smug', r: null },
      { s: 'nar', t: '아침. 농장에 나간 연이는 밭 한가운데 서 있는 작은 흙투성이 고양이를 발견했다.' },
      { s: 'neo_cat', t: '늦었군. 1번 밭 수확, 2번 밭 물주기, 3번 밭 잡초. 전부 끝냈다.' },
      { s: 'yeoni', t: '…영냥이? 얼굴에 밀 이삭 붙었어.', l: 'yeoni:surprised' },
      { s: 'neo_cat', t: '훈장이다. 떼지 마라.', c: 'neo_cat:serious' },
      { s: 'nar', t: '물뿌리개는 영냥이보다 컸다. 그래서 반은 밭에, 반은 영냥이에게 뿌려져 있었다.' },
      { s: 'nar', t: '흠뻑 젖은 영냥이에게 연이는…', skipText: '건너뛰기', choices: [
        { id: 'towel', text: '수건부터 가져온다.', beats: [
          { s: 'yeoni', t: '훈장은 둬도 감기는 안 돼! 수건, 수건!', l: 'yeoni:determined' },
          { s: 'neo_cat', t: '…따뜻하군. 이건 계산에 넣지 마라.', c: 'neo_cat:normal' },
        ] },
        { id: 'ledger', text: '장부에 \'영냥이 농장 담당\'이라고 적는다.', beats: [
          { s: 'yeoni', t: '좋아, 오늘부터 장부에 영냥이 농장 담당! 급여는 츄르로 지급!', l: 'yeoni:smile' },
          { s: 'neo_cat', t: '츄르는… 협상 대상이다. 두 개부터 시작하지.', c: 'neo_cat:smug' },
        ] },
      ] },
      { s: 'neo_cat', t: '사냥 안 가는 순에는 내가 밭을 맡겠다. 수확하고, 같은 씨앗을 다시 심고, 물도 주지.' },
      { s: 'neo_cat', t: '대신 씨앗값은 네 장부에서 나간다. 그리고 같은 순에 사냥까지는 못 한다. 발이 네 개뿐이라.', c: 'neo_cat:serious' },
      { s: 'yeoni', t: '(발이 네 개면 오히려 많은 거 아니야…?)', l: 'yeoni:normal' },
      { s: 'neo_cat', t: '그리고 검은 손 말이다. 달빛 닿는 손바닥이 약점이야. 거기 월정석이 뭉쳐 있지.' },
      { s: 'sys', t: '[ 네오 ♥3 · 농장 맡기기 해금(순마다 1회, 씨앗값·농장 행동력 사용, 그 순 사냥 불가) · 보스 월정석 +80% ]' },
    ],
    [
      { chapter: ['인연 · 네오 ♥4', '같은 달을 보는 사이'], bg: 'atelier_lit', l: 'yeoni:smile', c: 'neo:smile', r: null },
      { s: 'nar', t: '장부를 덮은 밤, 계산대 위에 데운 우유 두 잔이 놓여 있었다.' },
      { s: 'neo', t: '연이는 쉬지 않고 계산하지. 그러니까 내가 하루를 조금 길게 만들어 줄게.' },
      { s: 'yeoni', t: '하루를 길게? 그게 무슨…', l: 'yeoni:surprised' },
      { s: 'neo', t: '마을 일, 사냥 준비, 밭. 내가 먼저 움직이면 연이 손이 두 개 더 생기는 거야.' },
      { s: 'nar', t: '연이의 대답은?', skipText: '건너뛰기', choices: [
        { id: 'promise', text: '대신 무리하지 않기로 약속해.', beats: [
          { s: 'yeoni', t: '좋아. 대신 네오도 지치면 지쳤다고 말하기. 약속.', l: 'yeoni:determined' },
          { s: 'neo', t: '응, 약속이야. 연이도 똑같이.', c: 'neo:smile' },
        ] },
        { id: 'milk', text: '우유 잔을 부딪친다.', beats: [
          { s: 'yeoni', t: '그럼 건배! 길어진 하루를 위하여!', l: 'yeoni:smile' },
          { s: 'neo', t: '…우유로 건배하는 건 처음이야. 나쁘지 않네.', c: 'neo:flustered' },
        ] },
      ] },
      { s: 'nar', t: '창밖 달은 두 사람이 같이 올려다볼 만큼 둥글었다.' },
      { s: 'sys', t: '[ 네오 ♥4 · 순마다 행동력 +2 ]' },
    ],
  ],
  luna: [
    [
      { chapter: ['인연 · 루나 ♥1', '쟁반 위의 미소'], bg: 'atelier_lit', l: 'yeoni:normal', c: 'luna:smile', r: null },
      { s: 'luna', t: '연이 언니, 나 손님한테 "조금만 기다려 주세요" 하고 웃는 연습 했어!' },
      { s: 'yeoni', t: '좋아, 웃음은 원가 0골드에 효과는 별 다섯이야.', l: 'yeoni:smile' },
      { s: 'nar', t: '그런데 그날 저녁, 루나는 탕비실 구석에서 쟁반을 안고 훌쩍이고 있었다.' },
      { s: 'luna', t: '웃다가… 우유를 엎었어. 손님은 괜찮다고 했는데, 나는 안 괜찮아.', c: 'luna:cry' },
      { s: 'nar', t: '연이는 루나에게…', skipText: '건너뛰기', choices: [
        { id: 'count', text: '같이 열까지 세어 보자고 한다.', beats: [
          { s: 'yeoni', t: '하나, 둘, 셋… 같이 세자. 열 되면 다시 웃는 거야.', l: 'yeoni:smile' },
          { s: 'luna', t: '…아홉, 열! 헤헤, 진짜 조금 괜찮아졌어.', c: 'luna:smile' },
        ] },
        { id: 'ledger', text: '장부에 \'우유 1잔, 웃음 연습비\'라고 적어 준다.', beats: [
          { s: 'yeoni', t: '봐, 장부에 적었어. 우유 한 잔은 연습비야. 손해 아니야.', l: 'yeoni:determined' },
          { s: 'luna', t: '연습비… 그럼 다음엔 안 엎으면 이득이네!', c: 'luna:surprised' },
        ] },
      ] },
      { s: 'luna', t: '나 이제 바빠도 덜 울 것 같아. 언니들도 내가 웃으면 덜 지치잖아!', c: 'luna:smile' },
      { s: 'sys', t: '[ 루나 ♥1 · 손님이 음식을 10% 더 기다려 줍니다 · 직원 스트레스 증가 −15% ]' },
    ],
    [
      { chapter: ['인연 · 루나 ♥2', '쟁반을 맡겨 줘'], bg: 'atelier_lit', l: 'yeoni:surprised', c: 'luna:cry', r: null },
      { s: 'luna', t: '단골 할머니가 나 보러 온대! 기뻐서 눈물이 멈추질 않아!' },
      { s: 'yeoni', t: '(우는 이유가 기쁨이면 장부에는 매출로 적는다.)', l: 'yeoni:normal' },
      { s: 'luna', t: '그래서 말인데… 연이 언니, 홀은 나한테 맡겨 주면 안 돼?', c: 'luna:normal' },
      { s: 'luna', t: '다 된 접시 나르고, 손님 간 자리 닦고. 언니가 하나하나 안 눌러도 내가 알아서 할게!' },
      { s: 'nar', t: '연이는 홀을…', skipText: '건너뛰기', choices: [
        { id: 'trust', text: '맡긴다. 대신 힘들면 바로 말하기.', beats: [
          { s: 'yeoni', t: '좋아, 맡길게. 대신 지치면 꼭 말해. 숨기면 장부에 빨간 줄이야.', l: 'yeoni:determined' },
          { s: 'luna', t: '빨간 줄은 싫어! 약속할게!', c: 'luna:smile' },
        ] },
        { id: 'half', text: '바쁠 때만 맡긴다.', beats: [
          { s: 'yeoni', t: '평소엔 같이 하고, 바쁠 때 루나가 켜는 걸로 하자. 스위치처럼.', l: 'yeoni:smile' },
          { s: 'luna', t: '스위치 루나! 딸깍 하면 출동!', c: 'luna:surprised' },
        ] },
      ] },
      { s: 'nar', t: '루나는 쟁반을 두 손으로 꼭 쥐고 홀 한가운데서 깡충 뛰었다.' },
      { s: 'sys', t: '[ 루나 ♥2 · 손님이 음식을 15% 더 기다려 줍니다 · 홀 자동(서빙·정리) 해금 — 주방 화면에서 켜고 끌 수 있어요 ]' },
    ],
    [
      { chapter: ['인연 · 루나 ♥3', '백까지 세는 아이'], bg: 'atelier_dark', l: 'yeoni:normal', c: 'luna:surprised', r: null },
      { s: 'luna', t: '연이 언니! 계약서 이자 칸, 내가 백까지 세면서 다시 봤는데 끝자리가 이상해!' },
      { s: 'yeoni', t: '…진짜네, 올림을 두 번 했어!', l: 'yeoni:surprised' },
      { s: 'nar', t: '연이는 계약서를 들고 한참 말이 없었다. 루나는 자기가 또 뭘 잘못했나 싶어 눈가가 붉어졌다.' },
      { s: 'nar', t: '연이는…', skipText: '건너뛰기', choices: [
        { id: 'hug', text: '루나를 꼭 안아 준다.', beats: [
          { s: 'yeoni', t: '루나, 너 방금 우리 가게 살렸어. 진짜로.', l: 'yeoni:smile' },
          { s: 'luna', t: '으앙, 이번엔 좋아서 우는 거야!', c: 'luna:cry' },
        ] },
        { id: 'job', text: '검산 담당을 맡긴다.', beats: [
          { s: 'yeoni', t: '오늘부터 루나는 이자 검산 담당이야. 정식 직함!', l: 'yeoni:determined' },
          { s: 'luna', t: '직함! 나 직함 생겼어! 언니한테 자랑해야지!', c: 'luna:smile' },
        ] },
      ] },
      { s: 'luna', t: '헤헤, 나 이제 숫자 앞에서 안 울어. 아마도!', c: 'luna:smile' },
      { s: 'sys', t: '[ 루나 ♥3 · 루나의 검산으로 월 이자 −10% ]' },
    ],
    [
      { chapter: ['인연 · 루나 ♥4', '연이 언니의 조수'], bg: 'atelier_lit', l: 'yeoni:smile', c: 'luna:smile', r: 'luna_sis:smile' },
      { s: 'luna', t: '나 계산대 옆에서 검산 담당 해도 돼? 연이 언니가 세고, 내가 한 번 더 셀게!' },
      { s: 'luna_sis', t: '루나가 숫자를 좋아하게 될 줄은 몰랐어요. 연이 씨 덕분이에요.' },
      { s: 'yeoni', t: '좋아. 대신 틀려도 울지 말고, 맞아도 울지 마.', l: 'yeoni:determined' },
      { s: 'nar', t: '루나의 다짐을 듣고…', skipText: '건너뛰기', choices: [
        { id: 'pinky', text: '새끼손가락을 건다.', beats: [
          { s: 'luna', t: '약속! 근데 울면… 반만 우는 걸로 할게!', c: 'luna:smile' },
          { s: 'yeoni', t: '반만 우는 건 어떻게 하는 건데?!', l: 'yeoni:surprised' },
        ] },
        { id: 'apron', text: '루나 앞치마에 검산 배지를 달아 준다.', beats: [
          { s: 'luna', t: '배지다! 언니, 이거 봐, 반짝여!', c: 'luna:surprised' },
          { s: 'luna_sis', t: '…괜찮아요. 저 지금 진짜로 괜찮아요.', r: 'luna_sis:smile' },
        ] },
      ] },
      { s: 'sys', t: '[ 루나 ♥4 · 월 이자 추가 −15% ]' },
    ],
  ],
  luna_sis: [
    [
      { chapter: ['인연 · 루나 언니 ♥1', '괜찮아요의 온도'], bg: 'atelier_lit', l: 'yeoni:normal', c: 'luna_sis:tired', r: null },
      { s: 'luna_sis', t: '괜찮아요. 오븐은 제가 계속 볼게요. 괜찮아요.' },
      { s: 'yeoni', t: '(오늘만 괜찮아요 열한 번째. 장부라면 이미 적자야.)', l: 'yeoni:sulky' },
      { s: 'nar', t: '연이는 오븐 온도 그래프를 그려 루나 언니 앞에 내밀었다. 오후 세 시마다 온도가 떨어지고 있었다.' },
      { s: 'luna_sis', t: '…제가 졸 때마다 불이 약해졌네요.', c: 'luna_sis:serious' },
      { s: 'nar', t: '연이는 그래프를 보며…', skipText: '건너뛰기', choices: [
        { id: 'nap', text: '세 시엔 오븐 맡기고 낮잠 자라고 한다.', beats: [
          { s: 'yeoni', t: '세 시는 내가 볼게. 언니는 그때 이십 분만 눈 붙여.', l: 'yeoni:determined' },
          { s: 'luna_sis', t: '이십 분이면… 괜찮을 것 같아요. 아니, 좋을 것 같아요.', c: 'luna_sis:smile' },
        ] },
        { id: 'tea', text: '허브티를 내려 준다.', beats: [
          { s: 'yeoni', t: '졸리면 꿀 허브티. 언니가 늘 우리한테 해 주던 거야.', l: 'yeoni:smile' },
          { s: 'luna_sis', t: '받는 쪽은 처음이에요. 생각보다… 따뜻하네요.', c: 'luna_sis:smile' },
        ] },
      ] },
      { s: 'luna_sis', t: '쉬는 법을 알아야 쉬게 해 줄 수도 있겠죠. 다들 지치면 저한테 와요.' },
      { s: 'sys', t: '[ 루나 언니 ♥1 · 조리 시간 −8% · 휴식·쉼터 회복 +25% ]' },
    ],
    [
      { chapter: ['인연 · 루나 언니 ♥2', '대기 주문은 제가'], bg: 'atelier_dark', l: 'yeoni:surprised', c: 'luna_sis:smile', r: null },
      { s: 'luna_sis', t: '어제는 일찍 잤어요. 그랬더니 반죽이 손에 덜 붙더라고요.' },
      { s: 'luna_sis', t: '그래서 생각했어요. 연이 씨가 계산대에 있는 동안, 들어온 주문은 제가 차례로 구울게요.', c: 'luna_sis:serious' },
      { s: 'yeoni', t: '혼자 다? 또 괜찮아요 하다가 쓰러지는 거 아니야?', l: 'yeoni:sulky' },
      { s: 'luna_sis', t: '재료가 떨어지거나, 제가 지치면 멈출게요. 그때는 꼭 알려 드릴게요.' },
      { s: 'nar', t: '연이는 주방을…', skipText: '건너뛰기', choices: [
        { id: 'trust', text: '맡긴다. 멈춤 신호는 꼭 지키기.', beats: [
          { s: 'yeoni', t: '좋아. 멈출 땐 멈추기, 그게 조건이야.', l: 'yeoni:determined' },
          { s: 'luna_sis', t: '약속할게요. 이번 괜찮아요는… 진짜예요.', c: 'luna_sis:smile' },
        ] },
        { id: 'switch', text: '바쁠 때만 켜기로 한다.', beats: [
          { s: 'yeoni', t: '한가할 땐 내가 직접 굽고, 붐빌 때 언니한테 넘길게.', l: 'yeoni:smile' },
          { s: 'luna_sis', t: '좋아요. 연이 씨 손맛도 손님들이 기다리니까요.', c: 'luna_sis:smile' },
        ] },
      ] },
      { s: 'sys', t: '[ 루나 언니 ♥2 · 조리 시간 추가 −8% · 주방 자동(대기 주문 조리) 해금 — 주방 화면에서 켜고 끌 수 있어요 ]' },
    ],
    [
      { chapter: ['인연 · 루나 언니 ♥3', '저울을 닦는 손'], bg: 'atelier_lit', l: 'yeoni:normal', c: 'luna_sis:serious', r: null },
      { s: 'luna_sis', t: '저울 접시에 밀가루가 끼어 있었어요. 닦았더니 월정석이 제값을 받네요.' },
      { s: 'yeoni', t: '그동안 손해 본 거야?!', l: 'yeoni:surprised' },
      { s: 'luna_sis', t: '조금이요. 그래도 이제부터는 안 봐요.' },
      { s: 'nar', t: '연이는…', skipText: '건너뛰기', choices: [
        { id: 'assign', text: '저울을 루나 언니 담당으로 정한다.', beats: [
          { s: 'yeoni', t: '언니, 앞으로 저울은 언니 담당! 공식 임명!', l: 'yeoni:determined' },
          { s: 'luna_sis', t: '임명이라니… 쑥스럽지만, 맡을게요.', c: 'luna_sis:smile' },
        ] },
        { id: 'calc', text: '지난 손해를 같이 계산해 본다.', beats: [
          { s: 'yeoni', t: '지난달 환전 내역 가져와. 같이 세 보자.', l: 'yeoni:normal' },
          { s: 'luna_sis', t: '연이 씨가 세는 모습은… 이상하게 마음이 놓여요.', c: 'luna_sis:smile' },
        ] },
      ] },
      { s: 'sys', t: '[ 루나 언니 ♥3 · 월정석 환전 +10% ]' },
    ],
    [
      { chapter: ['인연 · 루나 언니 ♥4', '함께 굽는 새벽'], bg: 'atelier_lit', l: 'yeoni:smile', c: 'luna_sis:smile', r: 'luna:smile' },
      { s: 'luna_sis', t: '루나가 반죽을 치대고, 제가 굽고, 연이 씨가 세고. 이 순서가 좋아요.' },
      { s: 'luna', t: '언니가 웃었다! 연이 언니, 방금 봤지?', r: 'luna:surprised' },
      { s: 'nar', t: '연이는…', skipText: '건너뛰기', choices: [
        { id: 'saw', text: '봤어! 장부에 적어 둘게.', beats: [
          { s: 'yeoni', t: '봤어, 봤어! 오늘 날짜 옆에 \'언니 웃음\' 적어 둔다.', l: 'yeoni:smile' },
          { s: 'luna_sis', t: '그런 것까지 적으면… 장부가 금방 꽉 차겠어요.', c: 'luna_sis:smile' },
        ] },
        { id: 'bake', text: '셋이 같이 새벽빵을 굽자고 한다.', beats: [
          { s: 'yeoni', t: '내일 새벽에 셋이 같이 굽자. 첫 판은 우리가 먹는 거야.', l: 'yeoni:determined' },
          { s: 'luna', t: '첫 판! 첫 판은 제일 맛있어!', r: 'luna:smile' },
        ] },
      ] },
      { s: 'sys', t: '[ 루나 언니 ♥4 · 조리 시간 추가 −9% ]' },
    ],
  ],
  moka: [
    [
      { chapter: ['인연 · 모카 ♥1', '별 셋의 단골'], bg: 'atelier_lit', l: 'yeoni:normal', c: 'moka:normal', r: null },
      { s: 'moka', t: '매번 장부 들고 와서 값 깎는 손님, 별 셋. 그래도 꼬박꼬박 오니까 단골 할인.' },
      { s: 'yeoni', t: '별 셋에 할인이면 나한텐 별 다섯이야!', l: 'yeoni:smile' },
      { s: 'sys', t: '[ 모카 ♥1 · 재료값 −5% ]' },
    ],
    [
      { chapter: ['인연 · 모카 ♥2', '오토바이 헬멧'], bg: 'atelier_lit', l: 'yeoni:surprised', c: 'moka:smug', r: null },
      { s: 'moka', t: '영업 중에 급하면 불러, 배달비는 반만 받을게. 내 헬멧 디자인은 별 다섯.' },
      { s: 'yeoni', t: '헬멧에 왜 마이크가 달려 있어?', l: 'yeoni:normal' },
      { s: 'moka', t: '…통화용이야. 질문 별 하나.', c: 'moka:angry' },
      { s: 'sys', t: '[ 모카 ♥2 · 긴급 배달비 반값 ]' },
    ],
    [
      { chapter: ['인연 · 모카 ♥3', '새벽의 밤이슬'], bg: 'river_night', l: 'yeoni:normal', c: 'moka:normal', r: null },
      { s: 'nar', t: '해 뜨기 전 강가, 모카가 작은 병에 밤이슬을 모으며 낮게 흥얼거렸다.' },
      { s: 'moka', t: '…못 들은 걸로 해. 대신 밤이슬은 매번 하나씩 챙겨 줄게.' },
      { s: 'yeoni', t: '(입막음 값, 밤이슬 한 병. 거래 성사, 별 다섯.)', l: 'yeoni:smile' },
      { s: 'sys', t: '[ 모카 ♥3 · 순마다 밤이슬 1개 ]' },
    ],
    [
      { chapter: ['인연 · 모카 ♥4', '별 다섯 개의 파트너'], bg: 'atelier_lit', l: 'yeoni:smile', c: 'moka:smug', r: null },
      { s: 'moka', t: '너희 가게 이제 별 넷 반, 다섯은 빚 다 갚는 날 줄게. 그때까진 찐단골 할인.' },
      { s: 'yeoni', t: '모카가 별 다섯을 예약해 줬다! 이건 이자보다 확실한 약속이야!', l: 'yeoni:determined' },
      { s: 'sys', t: '[ 모카 ♥4 · 재료값 추가 −10% ]' },
    ],
  ],
});
