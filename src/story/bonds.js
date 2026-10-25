// 인연 이야기: 친밀도 단계가 열릴 때 영업 준비 화면에서 한 번 나온다(ledger.story['bond:<id>:<단계>']).
// 게임 오리지널 외전(원작 사실 아님). 네오의 정체·과거는 다루지 않는다. 형식은 prologue.js 박자와 같다.

export const BOND_STORIES = Object.freeze({
  neo: [
    [
      { chapter: ['인연 · 네오 ♥1', '달그늘 사냥터의 발자국'], bg: 'river_night', l: 'yeoni:normal', c: 'neo_cat:normal', r: null },
      { s: 'neo_cat', t: '사냥터까지 따라오다니. 계산대는 비워 둬도 되는 거냐.' },
      { s: 'yeoni', t: '마감했거든! 월정석이 몇 개인지 내 눈으로 세야 마음이 놓여.', l: 'yeoni:determined' },
      { s: 'neo_cat', t: '…그럼 세어라. 오늘은 조금 더 버텨 주마.', c: 'neo_cat:smug' },
      { s: 'sys', t: '[ 네오 ♥1 · 사냥 시작 HP +40 ]' },
    ],
    [
      { chapter: ['인연 · 네오 ♥2', '발톱을 가는 밤'], bg: 'atelier_dark', l: 'yeoni:surprised', c: 'neo:normal', r: null },
      { s: 'nar', t: '마감 후 창가, 네오가 영냥이 장갑의 실밥을 하나하나 다시 꿰매고 있었다.' },
      { s: 'neo', t: '검은 손이 점점 단단해져. 그만큼 우리도 날카로워져야지.' },
      { s: 'yeoni', t: '(바느질 솜씨 별 다섯. 근데 그걸 왜 네오가 하는 거지?)', l: 'yeoni:normal' },
      { s: 'sys', t: '[ 네오 ♥2 · 사냥 무기 피해 +35% ]' },
    ],
    [
      { chapter: ['인연 · 네오 ♥3', '큰 손의 약점'], bg: 'river_night', l: 'yeoni:determined', c: 'neo_cat:serious', r: null },
      { s: 'neo_cat', t: '거대한 검은 손은 달빛이 닿는 손바닥이 약하다. 그곳엔 월정석이 뭉쳐 있지.' },
      { s: 'yeoni', t: '약점에 보물까지? 그거 완전 이자 내는 날 보너스잖아, 꿀악!', l: 'yeoni:smile' },
      { s: 'neo_cat', t: '욕심은 접어 둬라. 살아서 돌아와야 장부에 적을 수 있다.' },
      { s: 'sys', t: '[ 네오 ♥3 · 보스를 쓰러뜨리면 월정석 +80% ]' },
    ],
    [
      { chapter: ['인연 · 네오 ♥4', '같은 달을 보는 사이'], bg: 'atelier_lit', l: 'yeoni:smile', c: 'neo:smile', r: null },
      { s: 'neo', t: '연이는 쉬지 않고 계산하지. 그러니까 내가 하루를 조금 길게 만들어 줄게.' },
      { s: 'yeoni', t: '하루를 길게? 그게 무슨… 아, 사냥 한 번 더 갈 수 있다는 거구나!', l: 'yeoni:surprised' },
      { s: 'neo', t: '응, 대신 무리하면 안 돼. 약속이야.', c: 'neo:flustered' },
      { s: 'sys', t: '[ 네오 ♥4 · 순마다 행동력 +2 ]' },
    ],
  ],
  luna: [
    [
      { chapter: ['인연 · 루나 ♥1', '쟁반 위의 미소'], bg: 'atelier_lit', l: 'yeoni:normal', c: 'luna:smile', r: null },
      { s: 'luna', t: '연이 언니, 나 손님한테 "조금만 기다려 주세요" 하고 웃는 연습 했어!' },
      { s: 'yeoni', t: '좋아, 웃음은 원가 0골드에 효과는 별 다섯이야.', l: 'yeoni:smile' },
      { s: 'sys', t: '[ 루나 ♥1 · 손님이 음식을 10% 더 기다려 줍니다 ]' },
    ],
    [
      { chapter: ['인연 · 루나 ♥2', '울보의 단골'], bg: 'atelier_lit', l: 'yeoni:surprised', c: 'luna:cry', r: null },
      { s: 'luna', t: '단골 할머니가 나 보러 온대! 기뻐서 눈물이 멈추질 않아!' },
      { s: 'yeoni', t: '(우는 이유가 기쁨이면 장부에는 매출로 적는다.)', l: 'yeoni:normal' },
      { s: 'luna', t: '이제 손님들이 나 기다려 주는 거 하나도 안 아까워한대!', c: 'luna:smile' },
      { s: 'sys', t: '[ 루나 ♥2 · 손님이 음식을 15% 더 기다려 줍니다 ]' },
    ],
    [
      { chapter: ['인연 · 루나 ♥3', '백까지 세는 아이'], bg: 'atelier_dark', l: 'yeoni:normal', c: 'luna:surprised', r: null },
      { s: 'luna', t: '연이 언니! 계약서 이자 칸, 내가 백까지 세면서 다시 봤는데 끝자리가 이상해!' },
      { s: 'yeoni', t: '…진짜네, 올림을 두 번 했어! 루나, 너 방금 우리 가게 살렸다!', l: 'yeoni:surprised' },
      { s: 'luna', t: '헤헤, 나 이제 숫자 앞에서 안 울어. 아마도!', c: 'luna:smile' },
      { s: 'sys', t: '[ 루나 ♥3 · 루나의 검산으로 월 이자 −10% ]' },
    ],
    [
      { chapter: ['인연 · 루나 ♥4', '연이 언니의 조수'], bg: 'atelier_lit', l: 'yeoni:smile', c: 'luna:smile', r: null },
      { s: 'luna', t: '나 계산대 옆에서 검산 담당 해도 돼? 연이 언니가 세고, 내가 한 번 더 셀게!' },
      { s: 'yeoni', t: '좋아. 대신 틀려도 울지 말고, 맞아도 울지 마.', l: 'yeoni:determined' },
      { s: 'luna', t: '그건… 노력해 볼게!', c: 'luna:cry' },
      { s: 'sys', t: '[ 루나 ♥4 · 월 이자 추가 −15% ]' },
    ],
  ],
  luna_sis: [
    [
      { chapter: ['인연 · 루나 언니 ♥1', '오븐의 온도'], bg: 'atelier_lit', l: 'yeoni:normal', c: 'luna_sis:normal', r: null },
      { s: 'luna_sis', t: '오븐 온도를 조금 올리면 쿠키가 더 빨리 구워져요. 연이 씨가 그래프를 그려 줘서 알았어요.' },
      { s: 'yeoni', t: '데이터는 거짓말을 안 하지. 꿀악!', l: 'yeoni:smile' },
      { s: 'sys', t: '[ 루나 언니 ♥1 · 조리 시간 −8% ]' },
    ],
    [
      { chapter: ['인연 · 루나 언니 ♥2', '진짜 괜찮아요'], bg: 'atelier_dark', l: 'yeoni:surprised', c: 'luna_sis:smile', r: null },
      { s: 'luna_sis', t: '어제는 일찍 잤어요. 그랬더니 반죽이 손에 덜 붙더라고요.' },
      { s: 'luna_sis', t: '이번 괜찮아요는… 진짜예요.' },
      { s: 'yeoni', t: '(오늘의 괜찮아요, 신뢰도 별 다섯.)', l: 'yeoni:smile' },
      { s: 'sys', t: '[ 루나 언니 ♥2 · 조리 시간 추가 −8% ]' },
    ],
    [
      { chapter: ['인연 · 루나 언니 ♥3', '저울을 닦는 손'], bg: 'atelier_lit', l: 'yeoni:normal', c: 'luna_sis:serious', r: null },
      { s: 'luna_sis', t: '저울 접시에 밀가루가 끼어 있었어요. 닦았더니 월정석이 제값을 받네요.' },
      { s: 'yeoni', t: '그동안 손해 본 거야?! 언니, 앞으로 저울은 언니 담당!', l: 'yeoni:surprised' },
      { s: 'sys', t: '[ 루나 언니 ♥3 · 월정석 환전 +10% ]' },
    ],
    [
      { chapter: ['인연 · 루나 언니 ♥4', '함께 굽는 새벽'], bg: 'atelier_lit', l: 'yeoni:smile', c: 'luna_sis:smile', r: 'luna:smile' },
      { s: 'luna_sis', t: '루나가 반죽을 치대고, 제가 굽고, 연이 씨가 세고. 이 순서가 좋아요.' },
      { s: 'luna', t: '언니가 웃었다! 연이 언니, 방금 봤지?', r: 'luna:surprised' },
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
