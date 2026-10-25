// 달 이야기·결말: 게임 오리지널 외전(원작 사실 아님). 형식은 prologue.js 박자와 같다.
// 매달 상순 영업 준비 때 한 번 나온다(ledger.story['m<번호>']). 결말은 마지막 순을 마친 뒤 한 번.
// 청토끼·서한비·윤달의 결말은 쓰지 않는다. 청토끼는 늘 그렇듯 계산만 하고 떠난다.

export const MONTH_STORIES = Object.freeze([
  // m0 · 3월: 개업 첫 달, 만기와 이자
  [
    { chapter: ['1년차 3월', '개업 첫 달, 작은 글씨'], bg: 'atelier_lit', l: 'yeoni:normal', c: 'cheongtokki:smile', r: null },
    { s: 'rab', t: '어머~ 개업 축하드려요! 축하 화환 대신 이자 안내문을 가져왔답니다~' },
    { s: 'sys', t: '[ 매달 하순 영업을 마치면 남은 빚의 2%(임시)가 이자로 나갑니다. 골드가 모자라면 빚에 붙습니다 ]' },
    { s: 'rab', t: '만기는 내년 2월 하순 결산일이에요~ 그날 남은 빚을 보고 계약서를 다시 쓰죠.', c: 'cheongtokki:smug' },
    { s: 'yeoni', t: '열두 달 안에 12만 골드? 계산해 보니 한 순에 삼천 골드 넘게 남겨야 해!', l: 'yeoni:surprised' },
    { s: 'luna', t: '연이 언니 계산 진짜 빠르다! 근데 그게 좋은 소식이야?', c: 'luna:surprised' },
    { s: 'yeoni', t: '(나쁜 소식을 빨리 아는 것도 실력이다. 계산 속도 별 다섯, 내용 별 하나.)', l: 'yeoni:sulky' },
    { s: 'yeoni', t: '좋아, 나는 계산대를 지킨다! 굽는 건 언니, 나르는 건 루나, 웃는 건 네오!', l: 'yeoni:determined' },
    { s: 'sys', t: '[ 영업 1회 = 한 순. 순마다 행동력 2가 채워지고, 사냥과 동료와의 대화에 씁니다 ]' },
  ],
  // m1 · 4월: 강가 꽃길, 모카의 첫 별점
  [
    { chapter: ['1년차 4월', '꽃길과 별 하나'], bg: 'atelier_lit', l: 'yeoni:smile', c: 'moka:normal', r: null },
    { s: 'nar', t: '사주의 강가에 꽃이 피자, 꽃길을 걷던 손님들이 하나둘 카페 문을 열었다.' },
    { s: 'sys', t: '[ 준비 화면의 동료 메뉴에서 행동력 1로 대화할 수 있습니다. 인연이 쌓이면 새 이야기와 능력이 열립니다 ]' },
    { s: 'moka', t: '손님은 늘었네. 근데 테이블이 다섯 개뿐이야. 이 가게 수용력 별 하나.', c: 'moka:smug' },
    { s: 'yeoni', t: '별 하나는 내 전문 분야인데! 남한테 받으니까 왜 이렇게 아파?', l: 'yeoni:sulky' },
    { s: 'moka', t: '마을 공방에 가 봐. 테이블도 들이고 막힌 벽도 터 줘. 돈은 점점 비싸지지만.', c: 'moka:normal' },
    { s: 'luna_sis', t: '창가 자리를 열면… 꽃 보는 손님이 오래 앉아 있을 거예요.', r: 'luna_sis:normal' },
    { s: 'yeoni', t: '(투자는 빚을 늘리는 게 아니라 빚 갚는 속도를 늘리는 거다. 아마도.)', l: 'yeoni:normal' },
  ],
  // m2 · 5월: 게임 오리지널 호스트 카페 개장
  [
    { chapter: ['1년차 5월', '오늘부터 호스트 카페!'], bg: 'atelier_dark', l: 'yeoni:normal', c: 'luna:cry', r: 'luna_sis:tired' },
    { s: 'nar', t: '마감 후 장부에는 갚은 돈보다 남은 칸이 더 많았다. 루나 언니의 앞치마에는 새벽부터 묻은 밀가루가 말라 있었다.' },
    { s: 'yeoni', t: '이 속도로는 만기까지 어려워. 언니가 더 오래 굽는다고 해결될 일이 아니야.', l: 'yeoni:sulky' },
    { s: 'luna', t: '언니가 어제도 새벽까지 구웠는데… 우리 가게 또 없어지는 거야?', c: 'luna:cry' },
    { s: 'luna_sis', t: '괜찮아요. 조금만 더 구우면… 괜찮을 거예요.', r: 'luna_sis:tired' },
    { s: 'impact', t: '…잠깐. 뭔가 떠올랐다!', l: 'yeoni:determined', fx: 'flash' },
    { s: 'nar', t: '연이의 시선이 장부에서 네오로 천천히 옮겨 갔다.', c: 'neo:flustered', r: null, fx: 'glow' },
    { s: 'neo', t: '…그 눈빛, 3월에 나 사냥터 보낼 때랑 똑같은데.' },
    { s: 'yeoni', t: '오늘부터 호스트 카페! 좋은 커피에, 손님이 고른 동료와 1분 대화를 곁들이는 거야.', l: 'yeoni:smile' },
    { s: 'luna', t: '그럼 메뉴판에 네오 오빠도 적어? 따뜻한 네오, 차가운 네오?', r: 'luna:surprised' },
    { s: 'neo', t: '메뉴판에는 커피만 적자. 나는 데우지도 얼리지도 말고.', c: 'neo:flustered' },
    { s: 'yeoni', t: '좋아, 네오 보관법은 상온! 대화는 손님도 동료도 원할 때만.', l: 'yeoni:smile' },
    { s: 'yeoni', t: '(좋은 커피에 좋은 대화까지. 기획 별 다섯, 직원 동의는 지금부터.)' },
    { s: 'neo', t: '응, 해 볼게. 대신 내가 곤란해 보이면 계산대에서 신호 좀 보내 줘.', c: 'neo:smile' },
    { s: 'luna_sis', t: '…후우, 괜찮아요. 이번에는 진짜로요.', r: 'luna_sis:smile' },
    { s: 'luna', t: '연이 언니! 나도 정장에 어울리는 잔을 가져올게!', r: 'luna:smile' },
    { s: 'sys', t: '[ 호스트 카페 개장 · 이제 지명 손님이 찾아옵니다. 원하는 요청을 수락하면 동료가 한 테이블과 60초 동안 이야기합니다 ]' },
    { s: 'sys', t: '[ SOS에 맞게 대응하면 대화 만족이 오르고 네오의 스트레스가 내려갑니다. 한계에 닿으면 이번 영업의 새 지명은 쉬어 갑니다 ]' },
    { s: 'sys', t: '[ 만족한 접대의 피버 게이지를 모아 팁을 높여 보세요. 드레스룸에 첫 정장 「달빛 첫인사」가 도착했습니다 ]' },
  ],
  // m3 · 6월: 장마와 검은 손
  [
    { chapter: ['1년차 6월', '장마의 강가'], bg: 'river_night', l: null, c: 'neo_cat:serious', r: null },
    { s: 'nar', t: '장대비가 강가를 두드렸다. 물안개 속에서 검은 손들이 전보다 굵게 꿈틀거렸다.' },
    { s: 'neo_cat', t: '비가 오면 녀석들이 불어난다. 달이 갈수록 더 단단해질 것이다.' },
    { s: 'yeoni', t: '영냥이, 무리하지 마. 월정석보다 고양이가 비싸.', l: 'yeoni:normal' },
    { s: 'neo_cat', t: '고양이는 팔지 않는다.', c: 'neo_cat:smug' },
    { s: 'sys', t: '[ 달이 지날수록 사냥터의 적이 강해집니다. 장비와 친밀도로 영냥이를 키워 주세요 ]' },
  ],
  // m4 · 7월: 모카의 비밀 랩
  [
    { chapter: ['1년차 7월', '창고 뒤의 비트'], bg: 'atelier_lit', l: 'yeoni:surprised', c: null, r: 'moka:normal' },
    { s: 'nar', t: '얼음을 가지러 창고에 간 연이는, 창고 뒤에서 흘러나오는 낮은 비트를 들었다.' },
    { s: 'moka', t: '원두는 볶고, 빚은 깎고, 별점은 짜게 그게 나의 플로우…', r: 'moka:normal' },
    { s: 'yeoni', t: '모카, 지금 랩 했어? 가사에 우리 가게 빚 들어갔지?', l: 'yeoni:surprised' },
    { s: 'moka', t: '…못 들은 걸로 해. 들었으면 너희 가게 별 하나 더 깎는다.', r: 'moka:angry' },
    { s: 'yeoni', t: '(협박 실력 별 다섯. 근데 라임은 꽤 좋았다.)', l: 'yeoni:smile' },
  ],
  // m5 · 8월: 강가 축제와 장부 점검
  [
    { chapter: ['1년차 8월', '축제의 밤, 장부의 낮'], bg: 'atelier_lit', l: 'yeoni:normal', c: 'cheongtokki:smile', r: 'neo:normal' },
    { s: 'nar', t: '강가 축제로 마을이 들썩이던 날, 파란 비행선이 장부를 들고 내려왔다.' },
    { s: 'rab', t: '어머~ 중간 점검이에요! 저는 최약체랍니다~ 숫자 말고는 아무것도 못 해요~' },
    { s: 'yeoni', t: '숫자라면 나도 할 줄 알아. 지난달 이자, 반올림 말고 올림으로 계산했지?', l: 'yeoni:determined' },
    { s: 'rab', t: '어머, 계약서 7조 3항에 올림이라고 적혀 있답니다~ 아주 작게요.', c: 'cheongtokki:smug' },
    { s: 'neo', t: '연이는 계산만 하는 게 아니라, 계산으로 지키는 거야.', r: 'neo:smile' },
    { s: 'yeoni', t: '(방금 그 말, 칭찬 평점 별 다섯. 계약서 글씨 크기는 여전히 별 하나.)', l: 'yeoni:smile' },
  ],
  // m6 · 9월: 보름달과 달빵
  [
    { chapter: ['1년차 9월', '보름달 달빵'], bg: 'river_night', l: 'yeoni:smile', c: 'luna_sis:smile', r: 'luna:smile' },
    { s: 'nar', t: '보름달이 뜨자 강가의 월정석이 평소보다 밝게 빛났다.' },
    { s: 'luna_sis', t: '재성의 섬 빵집에서 굽던 달빵이에요. 오늘은 팔지 말고 같이 먹어요.' },
    { s: 'luna', t: '언니가 팔지 말자고 했어! 오늘 진짜 특별한 날이다!', r: 'luna:cry' },
    { s: 'yeoni', t: '원가 계산은 잠깐 접어 둘게. 오늘 달빵은 값을 안 매긴다.', l: 'yeoni:smile' },
    { s: 'yeoni', t: '(값을 안 매긴 빵이 제일 맛있다. 이건 별점 바깥이다.)', l: 'yeoni:normal' },
  ],
  // m7 · 10월: 루나의 저울
  [
    { chapter: ['1년차 10월', '하나, 둘, 정확히'], bg: 'atelier_lit', l: 'yeoni:normal', c: 'luna:normal', r: null },
    { s: 'luna', t: '연이 언니! 나 이제 월정석 백 개까지 셀 수 있어! 많다 말고 백이라고!', c: 'luna:smile' },
    { s: 'yeoni', t: '대단한데? 반년 전엔 하나, 둘, 많다였잖아.', l: 'yeoni:smile' },
    { s: 'luna', t: '언니가 계산하는 거 매일 봤으니까! 나도 이제 사기 안 당해!', c: 'luna:smile' },
    { s: 'yeoni', t: '(제자 육성 평점 별 넷. 하나 뺀 건, 그 자신감이 조금 불안해서.)', l: 'yeoni:normal' },
  ],
  // m8 · 11월: 첫 서리와 오븐
  [
    { chapter: ['1년차 11월', '서리 내린 오븐'], bg: 'atelier_dark', l: 'yeoni:surprised', c: 'luna_sis:serious', r: 'moka:normal' },
    { s: 'nar', t: '첫 서리가 내린 아침, 오븐이 덜컹 소리를 내더니 불꽃이 꺼졌다.', fx: 'shake' },
    { s: 'luna_sis', t: '괜찮…지 않아요. 이번엔 정말로요.', c: 'luna_sis:serious' },
    { s: 'moka', t: '비켜 봐. 이 오븐, 관리 별 하나지만 아직 안 죽었어.', r: 'moka:smug' },
    { s: 'nar', t: '모카가 앞치마 주머니에서 공구를 꺼내자, 오븐이 다시 따뜻한 숨을 쉬었다.', fx: 'glow' },
    { s: 'yeoni', t: '모카, 수리비는 얼마야? 계산서 줘.', l: 'yeoni:normal' },
    { s: 'moka', t: '없어. 대신 다음에 내 랩 들어도 모른 척해.', r: 'moka:normal' },
  ],
  // m9 · 12월: 연말의 운세 라테
  [
    { chapter: ['1년차 12월', '한 해의 끝, 운세 라테'], bg: 'atelier_lit', l: 'yeoni:smile', c: null, r: 'neo:smile' },
    { s: 'nar', t: '연말이 되자 손님들은 한 해의 운을 묻는 것처럼 운세 라테를 주문했다.' },
    { s: 'neo', t: '오늘만 운세 라테가 마흔 잔째야. 다들 내년이 궁금한가 봐.', r: 'neo:smile' },
    { s: 'yeoni', t: '내 내년 운세는 내가 알지. 2월 하순 결산일에 전부 판가름 난다.', l: 'yeoni:determined' },
    { s: 'neo', t: '그럼 그날까지는 내가 홀을 볼게. 연이는 계산대만 봐.', r: 'neo:normal' },
    { s: 'yeoni', t: '(올해 동료 평점, 별 다섯 개로도 모자라다. 계산 오류 아니다.)', l: 'yeoni:smile' },
  ],
  // m10 · 1월: 새해, 남은 두 달
  [
    { chapter: ['2년차 1월', '남은 두 달'], bg: 'atelier_lit', l: 'yeoni:normal', c: 'cheongtokki:smile', r: null },
    { s: 'rab', t: '새해 복 많이 받으세요~ 그리고 만기까지 딱 두 달 남았답니다~' },
    { s: 'yeoni', t: '새해 인사랑 독촉을 한 문장에 넣다니. 효율 별 다섯.', l: 'yeoni:sulky' },
    { s: 'rab', t: '어머~ 칭찬 감사해요! 2월 하순 결산일에 뵐게요~ 총총!', c: 'cheongtokki:smug' },
    { s: 'yeoni', t: '좋아, 남은 순은 여섯 번. 쓸데없는 지출 0, 미소 무제한!', l: 'yeoni:determined' },
  ],
  // m11 · 2월: 마지막 달
  [
    { chapter: ['2년차 2월', '마지막 장부'], bg: 'atelier_lit', l: 'yeoni:determined', c: 'luna_sis:normal', r: 'luna:normal' },
    { s: 'nar', t: '마지막 달. 카운터 위 장부는 처음보다 세 배는 두꺼워져 있었다.' },
    { s: 'luna_sis', t: '연이 씨, 고마워요. 결과가 어떻든… 이번엔 정말 괜찮을 것 같아요.', c: 'luna_sis:smile' },
    { s: 'luna', t: '언니가 처음으로 진짜 괜찮다고 했어! 연이 언니, 들었지?', r: 'luna:cry' },
    { s: 'yeoni', t: '들었어. 그럼 마지막 세 순, 계산대는 내가 지킨다!', l: 'yeoni:determined' },
    { s: 'sys', t: '[ 2월 하순 영업을 마치면 결말이 정해집니다. 그 뒤에도 후일담으로 계속 영업할 수 있습니다 ]' },
  ],
]);

const ENDING_HEAD = { s: 'sys', t: '[ 「연이의 아틀리에」 게임 오리지널 외전 결말입니다 ]' };

export const ENDINGS = Object.freeze({
  // 빚 완납 + 동료와 깊은 인연
  grand: {
    title: '별 다섯 개의 아틀리에',
    beats: [
      { chapter: ['EPILOGUE', '별 다섯 개의 아틀리에'], bg: 'atelier_lit', l: 'yeoni:smile', c: 'cheongtokki:smile', r: null },
      ENDING_HEAD,
      { s: 'rab', t: '어머~ 남은 빚 0골드. 계산이 딱 맞네요~ 이런 결산은 오랜만이랍니다.' },
      { s: 'yeoni', t: '영수증도 줘. 0이라고 크게, 개미 말고 코끼리만 한 글씨로.', l: 'yeoni:determined' },
      { s: 'rab', t: '그럼 다음 계산에서 뵐게요~ 총총!', c: 'cheongtokki:smug' },
      { s: 'nar', t: '비행선이 떠나자, 문 앞에 모카가 팔짱을 끼고 서 있었다.', c: 'moka:normal' },
      { s: 'moka', t: '…별 다섯. 처음이자 마지막이야. 기념으로 랩도 한 소절 해 줄까.', c: 'moka:smug' },
      { s: 'luna', t: '모카가 별 다섯 줬어! 언니, 우리 카페 이제 진짜 우리 거야!', c: 'luna:cry' },
      { s: 'luna_sis', t: '괜찮아요. 아니, 오늘은 괜찮은 정도가 아니라… 행복해요.', c: 'luna_sis:smile' },
      { s: 'neo', t: '연이, 일 년 동안 계산만 했는데 다들 웃고 있어. 신기하지.', r: 'neo:smile' },
      { s: 'yeoni', t: '계산대가 가게의 심장이거든! 꿀악, 오늘 평점은 별 다섯 개 만점!', l: 'yeoni:smile', fx: 'glow' },
      { s: 'yeoni', t: '(그리고 이 장부의 마지막 줄은, 값을 매기지 않기로 했다.)', l: 'yeoni:normal' },
      { s: 'impact', t: 'THE END · 그리고 아틀리에는 계속된다', bg: 'atelier_lit' },
    ],
  },
  // 빚 완납
  clear: {
    title: '0골드의 아침',
    beats: [
      { chapter: ['EPILOGUE', '0골드의 아침'], bg: 'atelier_lit', l: 'yeoni:smile', c: 'cheongtokki:normal', r: null },
      ENDING_HEAD,
      { s: 'rab', t: '어머~ 다 갚으셨네요. 이자 계산할 게 없으니 조금 심심하답니다~' },
      { s: 'yeoni', t: '심심하면 계약서 글씨나 키워. 다음 손님을 위해서.', l: 'yeoni:determined' },
      { s: 'nar', t: '비행선이 떠난 뒤, 루나는 계약서를 들고 한참을 울었다. 이번엔 기뻐서였다.', c: 'luna:cry' },
      { s: 'luna_sis', t: '연이 씨, 고양이님, 네오 씨. 빵값은 평생 안 받을게요. 괜찮아요.', c: 'luna_sis:smile' },
      { s: 'neo_cat', t: '평생이면, 꽤 많이 먹을 것이다.', r: 'neo_cat:smug' },
      { s: 'yeoni', t: '(빚 0골드. 아직 다 못 나눈 이야기는 많지만, 오늘 평점은 별 넷 반.)', l: 'yeoni:smile' },
      { s: 'impact', t: 'THE END · 다음 회차에는 더 많은 인연을', bg: 'atelier_lit' },
    ],
  },
  // 빚 40% 이하 남음
  close: {
    title: '조금 모자란 봄',
    beats: [
      { chapter: ['EPILOGUE', '조금 모자란 봄'], bg: 'atelier_lit', l: 'yeoni:sulky', c: 'cheongtokki:smile', r: null },
      ENDING_HEAD,
      { s: 'rab', t: '어머~ 아깝네요! 조금만 더 하면 됐을 텐데~ 계약은 일 년 연장이에요.' },
      { s: 'yeoni', t: '이자율은? 혹시 또 아주아주 조금이야?', l: 'yeoni:sulky' },
      { s: 'rab', t: '물론이죠~ 이번엔 글씨를 조금 키워 드렸답니다. 개미에서 무당벌레 정도로요~', c: 'cheongtokki:smug' },
      { s: 'luna', t: '그래도 처음보다 엄청 줄었어! 연이 언니가 계산해 줬잖아!', c: 'luna:smile' },
      { s: 'luna_sis', t: '괜찮아요. 이제는 어떻게 갚는지 아니까요.', r: 'luna_sis:smile' },
      { s: 'yeoni', t: '(완납은 못 했지만 길은 보인다. 올해 평점 별 셋 반, 내년 목표 별 다섯.)', l: 'yeoni:determined' },
      { s: 'impact', t: 'THE END · 봄이 다시 오면', bg: 'atelier_lit' },
    ],
  },
  // 빚이 많이 남음
  extend: {
    title: '계약서 2권',
    beats: [
      { chapter: ['EPILOGUE', '계약서 2권'], bg: 'atelier_dark', l: 'yeoni:surprised', c: 'cheongtokki:smile', r: null },
      ENDING_HEAD,
      { s: 'rab', t: '어머~ 많이 남았네요! 걱정 마세요, 새 계약서를 준비해 왔답니다~' },
      { s: 'sys', t: '[ 새 계약서: 두께 3cm ]' },
      { s: 'impact', t: '계약서가 책이 됐어?!', l: 'yeoni:surprised', fx: 'shake' },
      { s: 'neo_cat', t: '2권이다. 3권도 있을지 모른다.', r: 'neo_cat:serious' },
      { s: 'luna', t: '으아앙! 그래도 언니, 우리 가게 아직 문 열려 있지?', c: 'luna:cry' },
      { s: 'luna_sis', t: '네. 오븐도 따뜻하고, 계산대엔 연이 씨가 있어요. 괜찮아요.', c: 'luna_sis:tired' },
      { s: 'yeoni', t: '(1권 평점 별 하나. 하지만 2권은 주인공이 조금 더 강하다.)', l: 'yeoni:determined' },
      { s: 'impact', t: 'TO BE CONTINUED · 다시 한번, 영업 시작', bg: 'atelier_lit' },
    ],
  },
});
