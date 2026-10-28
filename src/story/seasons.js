// 계절 소품(명령서 0.7): 달마다 중순 영업 준비 때 한 번(ledger.story['season:<달 번호>']). 게임 오리지널 외전.
// 달 이야기(months.js·career.js)와 겹치지 않는 작은 장면이다. need 가 붙은 박자는 그 동료가 합류했을 때만 나온다.
// 청토끼·서한비·윤달의 결말은 쓰지 않는다. 연이는 계산대(와 농장)만 맡는다.

const ch = (label, title, bg, l, c, r) => ({ chapter: [label, title], bg, l, c, r });

export const SEASON_STORIES = Object.freeze([
  // 0 · 1년차 3월
  [
    ch('1년차 3월 · 계절 소품', '봄맞이 대청소', 'atelier_lit', 'yeoni:normal', 'luna:smile', 'luna_sis:normal'),
    { s: 'nar', t: '창틀의 겨울 먼지를 털던 루나가 선반 뒤에서 낡은 사진 한 장을 꺼냈다.' },
    { s: 'luna', t: '연이 언니, 이거 봐! 재성의 섬 빵집 앞에서 언니랑 찍은 거야!', c: 'luna:surprised' },
    { s: 'luna_sis', t: '그날도 밀가루투성이였네요. 괜찮아요, 그때도 웃고 있었으니까요.', r: 'luna_sis:smile' },
    { s: 'yeoni', t: '이 사진은 계산대 옆에 붙이자. 장부 보다가 지치면 한 번씩 보게.', l: 'yeoni:smile' },
    { s: 'yeoni', t: '(대청소 진척도 별 둘. 추억 발굴은 별 다섯.)' },
  ],
  // 1 · 1년차 4월
  [
    ch('1년차 4월 · 계절 소품', '벚꽃 도시락', 'river_night', 'yeoni:smile', 'luna_sis:smile', 'neo:normal'),
    { s: 'nar', t: '마감 뒤, 루나 언니가 남은 반죽으로 작은 도시락을 쌌다. 강가 벚나무 아래에는 꽃잎이 소복했다.' },
    { s: 'luna_sis', t: '오늘은 팔다 남은 게 아니라, 처음부터 우리 몫으로 구웠어요.' },
    { s: 'neo', t: '바구니는 내가 들게. 연이는 자리만 골라.', r: 'neo:smile' },
    { s: 'yun', t: '꽃잎이 찻잔에 떨어졌네. 점술가 말로는, 이번 봄 손님 복이 좋다는 뜻이야.', r: 'yun:smile', need: 'yun' },
    { s: 'yeoni', t: '꽃잎 하나에 손님 열 명이면 벌써 백 명은 넘겠다. 꿀악, 장부가 모자라!', l: 'yeoni:surprised' },
    { s: 'yeoni', t: '(벚꽃 도시락 별 다섯. 오늘 장부에는 꽃잎 칸을 하나 더 그렸다.)', l: 'yeoni:smile' },
  ],
  // 2 · 1년차 5월
  [
    ch('1년차 5월 · 계절 소품', '카네이션 한 송이', 'atelier_lit', 'yeoni:normal', 'luna:normal', 'luna_sis:tired'),
    { s: 'nar', t: '단골손님이 두고 간 카네이션 다발에서, 루나가 가장 붉은 한 송이를 몰래 뽑았다.' },
    { s: 'luna', t: '언니! 이거… 맨날 새벽에 굽느라 고생했으니까.', c: 'luna:cry' },
    { s: 'luna_sis', t: '…괜찮아요. 아니, 괜찮은 게 아니라 너무 좋아서 그래요.', r: 'luna_sis:smile' },
    { s: 'yeoni', t: '그 꽃은 판매용 재고에서 빼 둘게. 값은 이미 다 치렀으니까.', l: 'yeoni:smile' },
    { s: 'yeoni', t: '(오늘 재고 장부, 한 송이 오차. 이번 오차는 별 다섯.)' },
  ],
  // 3 · 1년차 6월
  [
    ch('1년차 6월 · 계절 소품', '한 우산, 기울어진 쪽', 'atelier_dark', 'yeoni:normal', null, 'neo:normal'),
    { s: 'nar', t: '장대비가 그치지 않던 마감 길, 우산꽂이에는 손님이 두고 간 우산이 일곱 개나 꽂혀 있었다.' },
    { s: 'yeoni', t: '분실물 장부에 일곱 개 다 적었어. 우리 건… 한 개뿐이네.', l: 'yeoni:sulky' },
    { s: 'neo', t: '그럼 같이 쓰자. 장부는 젖으면 안 되니까 가운데 들고.', r: 'neo:smile' },
    { s: 'nar', t: '집 앞에 닿았을 때, 연이 쪽 어깨는 말라 있었고 네오의 한쪽 소매는 흠뻑 젖어 있었다.' },
    { s: 'yeoni', t: '네오, 우산이 계속 내 쪽으로 기울었잖아. 계산 다 했어.', l: 'yeoni:determined' },
    { s: 'neo', t: '들켰네. 그래도 장부가 무사하면 된 거야.', r: 'neo:flustered' },
    { s: 'yeoni', t: '(우산 공유 별 다섯. 젖은 소매는 내일 내가 다려 준다.)', l: 'yeoni:smile' },
  ],
  // 4 · 1년차 7월
  [
    ch('1년차 7월 · 계절 소품', '별점 빙수', 'atelier_lit', 'yeoni:normal', 'moka:normal', 'neo_cat:normal'),
    { s: 'nar', t: '한낮의 열기에 영냥이는 주방 타일 위에 납작하게 엎드려 움직이지 않았다.' },
    { s: 'neo_cat', t: '움직이지 않는다. 이 타일이 가게에서 가장 시원하다.', r: 'neo_cat:serious' },
    { s: 'moka', t: '시끄러운 고양이는 빼고, 신메뉴 시식이나 해. 이름은 별점 빙수야.', c: 'moka:smug' },
    { s: 'yeoni', t: '얼음 위에 별 모양 젤리가 다섯 개? 자기 메뉴엔 후하네!', l: 'yeoni:surprised' },
    { s: 'moka', t: '맛이 별 다섯이니까. 가격은 네가 정해.', c: 'moka:normal' },
    { s: 'yeoni', t: '(시식 평점 별 다섯. 영냥이 몫은 타일 옆에 한 숟갈 남겼다.)', l: 'yeoni:smile' },
  ],
  // 5 · 1년차 8월
  [
    ch('1년차 8월 · 계절 소품', '수박 반 통의 정산', 'atelier_lit', 'yeoni:determined', 'luna:smile', null),
    { s: 'nar', t: '축제가 끝난 다음 날, 이웃 가게에서 수박 반 통을 나눠 주었다.' },
    { s: 'luna', t: '연이 언니, 내 조각이 제일 작아! 이거 사기야!', c: 'luna:cry' },
    { s: 'yeoni', t: '자, 줄자 가져와. 오늘 수박은 밀리미터 단위로 나눈다.', l: 'yeoni:determined' },
    { s: 'solv', t: '재는 동안 다 녹겠다. 내가 먼저 썰게, 금 맞춰서.', r: 'solv:smile', need: 'solv' },
    { s: 'nar', t: '똑같이 나눈 조각 옆에, 씨가 제일 많은 조각 하나가 남았다. 연이는 그걸 조용히 자기 접시로 옮겼다.' },
    { s: 'yeoni', t: '(공정 분배 별 다섯. 씨 많은 수박은 계산대 담당 몫이다.)', l: 'yeoni:smile' },
  ],
  // 6 · 1년차 9월
  [
    ch('1년차 9월 · 계절 소품', '높은 하늘, 젖은 장부', 'atelier_lit', 'yeoni:sulky', 'luna_sis:normal', 'luna:surprised'),
    { s: 'nar', t: '하늘이 높아진 날, 연이는 장마 때 젖었던 장부를 한 장씩 빨랫줄에 널었다.' },
    { s: 'yeoni', t: '6월 숫자가 번져서 3인지 8인지 모르겠어. 둘 중 하나면 좋겠는데.', l: 'yeoni:sulky' },
    { s: 'luna', t: '언니, 잠자리가 장부 위에 앉았어! 숫자 읽는 거 아니야?', c: 'luna:surprised' },
    { s: 'luna_sis', t: '괜찮아요, 영수증은 제가 따로 모아 뒀어요. 상자째로요.', c: 'luna_sis:smile' },
    { s: 'yeoni', t: '언니는 진짜 가게의 숨은 금고야. 오늘 재정 평가 별 다섯!', l: 'yeoni:smile' },
  ],
  // 7 · 1년차 10월
  [
    ch('1년차 10월 · 계절 소품', '가을 의상 회의', 'dressroom', 'yeoni:normal', 'luna:smile', 'neo:normal'),
    { s: 'nar', t: '드레스룸에 가을 옷감 견본이 도착했다. 단풍색, 밤색, 달빛 금색.' },
    { s: 'luna', t: '네오 오빠는 무조건 단풍색 니트! 손님들이 귀엽다고 할 거야.', c: 'luna:smile' },
    { s: 'neo', t: '나는 아무거나 괜찮아. 연이가 계산대에서 보기 편한 색이면.', r: 'neo:flustered' },
    { s: 'yeoni', t: '옷감값 보면 아무거나가 제일 비싸. 견본 가격표부터 줘 봐.', l: 'yeoni:determined' },
    { s: 'yeoni', t: '(결국 단풍색으로 정했다. 예산 별 셋, 어울림 별 다섯.)', l: 'yeoni:smile' },
  ],
  // 8 · 1년차 11월
  [
    ch('1년차 11월 · 계절 소품', '오븐 구석의 군고구마', 'atelier_dark', 'yeoni:normal', 'luna_sis:smile', null),
    { s: 'nar', t: '다시 살아난 오븐 맨 구석에서, 군고구마 다섯 개가 마감 시간을 기다리고 있었다.' },
    { s: 'luna_sis', t: '빵 굽고 남은 열이 아까워서요. 괜찮아요, 전기세는 안 더 나와요.' },
    { s: 'yeoni', t: '남은 열로 간식까지? 언니, 그거 원가 0골드 메뉴야!', l: 'yeoni:surprised' },
    { s: 'bambi', t: '고구마 껍질 벗기는 소리가 좋다. 박자로 따면 사분의 삼이야.', r: 'bambi:smile', need: 'bambi' },
    { s: 'yeoni', t: '(군고구마 별 다섯. 마지막 하나는 내일 첫 출근하는 사람 몫으로 남긴다.)', l: 'yeoni:smile' },
  ],
  // 9 · 1년차 12월
  [
    ch('1년차 12월 · 계절 소품', '첫눈과 간판', 'river_night', 'yeoni:surprised', 'luna:surprised', 'neo:normal'),
    { s: 'nar', t: '마감 종이 울린 순간, 첫눈이 소리 없이 간판 위에 쌓이기 시작했다.' },
    { s: 'luna', t: '연이 언니, 눈이다! 내 발자국 제일 먼저 찍을래!', c: 'luna:smile' },
    { s: 'nar', t: '네오는 말없이 의자를 끌고 나가, 간판 글자 위의 눈부터 쓸어냈다.' },
    { s: 'neo', t: '연이가 내일 아침 문 열 때, 가게 이름이 제일 먼저 보였으면 해서.', r: 'neo:smile' },
    { s: 'yeoni', t: '그럼 나는 따뜻한 차 값을 장부에서 빼 줄게. 오늘만이야.', l: 'yeoni:smile' },
    { s: 'yeoni', t: '(첫눈 평점 별 다섯. 간판 청소 담당에게 보너스 별 하나 더.)' },
  ],
  // 10 · 1년차 1월
  [
    ch('1년차 1월 · 계절 소품', '떡국 두 그릇', 'atelier_lit', 'yeoni:normal', 'luna:surprised', 'luna_sis:smile'),
    { s: 'nar', t: '새해 첫 아침, 영업 전 테이블에 떡국 그릇이 나란히 놓였다.' },
    { s: 'luna', t: '연이 언니, 떡국 두 그릇 먹으면 두 살 먹어? 그럼 나 언니보다 빨리 어른 된다!', c: 'luna:surprised' },
    { s: 'yeoni', t: '나이는 그릇 수가 아니라 장부 날짜로 센다. 계산은 내가 할게.', l: 'yeoni:determined' },
    { s: 'luna_sis', t: '괜찮아요, 루나는 천천히 커도 돼요. 떡은 더 있어요.', r: 'luna_sis:smile' },
    { s: 'yeoni', t: '(올해 첫 끼 별 다섯. 리필 원가는 새해 기념으로 못 본 척한다.)', l: 'yeoni:smile' },
  ],
  // 11 · 1년차 2월
  [
    ch('1년차 2월 · 계절 소품', '계산서 모양 초콜릿', 'atelier_lit', 'yeoni:sulky', null, 'neo:normal'),
    { s: 'nar', t: '마감 뒤, 연이는 계산대 아래에서 납작한 상자 하나를 꺼냈다.' },
    { s: 'yeoni', t: '네오, 계산서 모양 초콜릿이야. 오해하지 마, 일 년 근무 정산이니까.', l: 'yeoni:sulky' },
    { s: 'neo', t: '합계 칸에 하트가 그려져 있는데. 이것도 정산이야?', r: 'neo:flustered' },
    { s: 'yeoni', t: '그건… 반올림 기호야. 올림으로 계산했다는 뜻이고.', l: 'yeoni:surprised' },
    { s: 'neo', t: '그럼 나도 올림으로 갚을게. 내년에도 계산대 옆에서.', r: 'neo:smile' },
    { s: 'yeoni', t: '(포장 별 넷, 해명 별 하나. 받는 얼굴은 별 다섯.)', l: 'yeoni:smile' },
  ],
  // 12 · 2년차 3월
  [
    ch('2년차 3월 · 계절 소품', '봄비와 첫 새싹', 'farm', 'yeoni:smile', null, 'neo:normal'),
    { s: 'nar', t: '밤새 내린 봄비가 그치자, 가게 뒤 밭에 연둣빛 새싹이 줄지어 올라왔다.' },
    { s: 'yeoni', t: '내가 심은 줄은 똑바로 났어! 한 칸도 안 틀렸다고.', l: 'yeoni:smile' },
    { s: 'neo', t: '물뿌리개는 내가 채워 둘게. 연이는 몇 개 났는지만 세.', r: 'neo:smile' },
    { s: 'museong', t: '새싹은 약속한 자리에서만 자란다. 줄을 지킨 사람이 거두는 법이다.', r: 'museong:normal', need: 'museong' },
    { s: 'yeoni', t: '(새싹 개수 마흔둘, 오차 0. 농장 평점 별 다섯.)', l: 'yeoni:determined' },
  ],
  // 13 · 2년차 4월
  [
    ch('2년차 4월 · 계절 소품', '꽃잎 지폐 소동', 'atelier_lit', 'yeoni:surprised', 'luna:smile', null),
    { s: 'nar', t: '봄바람이 문틈으로 불어 들자, 계산대 위로 꽃잎이 지폐처럼 우수수 쏟아졌다.' },
    { s: 'luna', t: '연이 언니, 돈이 하늘에서 내려와! 이것도 매출이야?', c: 'luna:smile' },
    { s: 'yeoni', t: '꽃잎은 매출 아님! 근데 세어 보니 장부에 적고 싶긴 하네.', l: 'yeoni:surprised' },
    { s: 'yun', t: '꽃잎 지폐는 운으로 계산하는 거야. 오늘 손님들 기분, 이걸로 다 맞췄어.', r: 'yun:smile', need: 'yun' },
    { s: 'yeoni', t: '(꽃잎 매출 0골드, 기분 매출 별 다섯. 비고란에 적어 둔다.)', l: 'yeoni:smile' },
  ],
  // 14 · 2년차 5월
  [
    ch('2년차 5월 · 계절 소품', '스승의 날 쪽지', 'atelier_lit', 'yeoni:normal', 'luna:normal', null),
    { s: 'nar', t: '계산대 서랍 속에서, 삐뚤빼뚤한 글씨의 쪽지 한 장이 나왔다.' },
    { s: 'luna', t: '언니, 읽지 마! 아니, 읽어도 돼… 나 숫자 가르쳐 줘서 고맙다고 쓴 거야.', c: 'luna:cry' },
    { s: 'lune', t: '테두리는 내가 같이 꾸몄어! 별 스티커는 연이 씨 별점 따라서 다섯 개.', r: 'lune:smile', need: 'lune' },
    { s: 'yeoni', t: '제자가 선생한테 별점을 줬네. 이건 액자에 넣는다.', l: 'yeoni:smile' },
    { s: 'yeoni', t: '(받은 평점 별 다섯. 맞춤법은 별 셋, 다음 수업 과제로 남긴다.)' },
  ],
  // 15 · 2년차 6월
  [
    ch('2년차 6월 · 계절 소품', '반딧불이 길', 'river_night', 'yeoni:normal', 'neo_cat:normal', null),
    { s: 'nar', t: '비가 잠깐 그친 밤, 강가 풀숲에서 작은 불빛들이 하나둘 떠올랐다.' },
    { s: 'neo_cat', t: '반딧불이다. 검은 손은 이 빛을 싫어한다.', c: 'neo_cat:serious' },
    { s: 'yeoni', t: '그럼 오늘 퇴근길은 안전하네. 영냥이가 앞장서 줘.', l: 'yeoni:smile' },
    { s: 'neo_cat', t: '앞장서는 것은 원래 내 일이다. 따라오면 된다.', c: 'neo_cat:smug' },
    { s: 'yeoni', t: '(빛 서른하나, 고양이 하나. 퇴근길 평점 별 다섯.)', l: 'yeoni:smile' },
  ],
  // 16 · 2년차 7월
  [
    ch('2년차 7월 · 계절 소품', '여름 감기', 'atelier_dark', 'yeoni:determined', 'luna_sis:serious', 'neo:serious'),
    { s: 'nar', t: '무더운 밤, 마감을 돕던 네오의 목소리가 갈라졌다. 이마가 뜨거웠다.' },
    { s: 'neo', t: '괜찮아. 내일 지명 손님 명단이 길어서, 쉬면 연이가 곤란해져.', r: 'neo:serious' },
    { s: 'yeoni', t: '곤란한 건 내가 계산할 일이야. 너는 오늘 근무표에서 뺐어.', l: 'yeoni:determined' },
    { s: 'luna_sis', t: '죽은 제가 끓일게요. 괜찮아요, 이번엔 제가 돌볼 차례예요.', c: 'luna_sis:smile' },
    { s: 'neo', t: '…그럼 하루만. 그 대신 장부 덮을 때 꼭 나 깨워 줘.', r: 'neo:flustered' },
    { s: 'yeoni', t: '(휴무 처리 완료. 직원 건강 별 다섯이 매출 별 다섯보다 먼저다.)', l: 'yeoni:normal' },
  ],
  // 17 · 2년차 8월
  [
    ch('2년차 8월 · 계절 소품', '옥상 불꽃놀이', 'river_night', 'yeoni:smile', 'luna:smile', 'neo:smile'),
    { s: 'nar', t: '강 건너에서 불꽃이 오르자, 모두가 마감 의자를 하나씩 들고 옥상으로 올라갔다.' },
    { s: 'luna', t: '저거 봐! 금화가 하늘에서 터지는 것 같아!', c: 'luna:smile' },
    { s: 'solv', t: '저 박자면 춤 하나 나오겠다. 다음 무대에 넣자.', r: 'solv:smile', need: 'solv' },
    { s: 'bambi', t: '불꽃 사이 조용한 틈이 좋아. 그 사이에 화음을 넣고 싶어.', r: 'bambi:smile', need: 'bambi' },
    { s: 'neo', t: '연이, 의자 여기 둬. 여기가 제일 잘 보여.', r: 'neo:smile' },
    { s: 'yeoni', t: '(불꽃 입장료 0골드. 이건 장부에 안 적는 쪽이 별 다섯이다.)', l: 'yeoni:smile' },
  ],
  // 18 · 2년차 9월
  [
    ch('2년차 9월 · 계절 소품', '보름달 소원 쪽지', 'river_night', 'yeoni:normal', 'luna_sis:smile', null),
    { s: 'nar', t: '한가위 밤, 가게 앞 나뭇가지에 소원 쪽지가 하나씩 매달렸다.' },
    { s: 'luna_sis', t: '연이 씨 쪽지는요? 괜찮아요, 안 볼게요.' },
    { s: 'raven', t: '빈칸이네. 정확한 한 줄이 안 떠오르면, 비워 둔 채로 걸어도 돼.', r: 'raven:normal', need: 'raven' },
    { s: 'yeoni', t: '빚 0골드라고 쓰려다가… 다른 걸 썼어. 비밀이야.', l: 'yeoni:sulky' },
    { s: 'yeoni', t: '(쪽지 내용: 내년 이맘때도 다 같이. 소원 평점은 아직 매기지 않는다.)', l: 'yeoni:smile' },
  ],
  // 19 · 2년차 10월
  [
    ch('2년차 10월 · 계절 소품', '단풍 책갈피', 'atelier_lit', 'yeoni:surprised', 'luna_sis:smile', 'moka:normal'),
    { s: 'nar', t: '장부를 펼치자, 붉은 단풍잎 하나가 책갈피처럼 끼워져 있었다.' },
    { s: 'luna_sis', t: '제가 넣었어요. 숫자만 보면 눈이 아플 것 같아서요.', c: 'luna_sis:smile' },
    { s: 'moka', t: '단풍은 별 넷. 장부 낙서는 별 하나.', r: 'moka:smug' },
    { s: 'yeoni', t: '낙서 아니야, 이건 이번 달 목표선이야! 단풍잎이 거기 딱 걸쳤잖아.', l: 'yeoni:determined' },
    { s: 'yeoni', t: '(목표선까지 남은 칸, 단풍잎 세 장 반. 가을 평점 별 다섯.)', l: 'yeoni:smile' },
  ],
  // 20 · 2년차 11월
  [
    ch('2년차 11월 · 계절 소품', '겨울잼 저장고', 'atelier_dark', 'yeoni:normal', 'moka:normal', 'luna:smile'),
    { s: 'nar', t: '겨울이 오기 전, 주방에는 사과와 유자가 산처럼 쌓였다.' },
    { s: 'moka', t: '잼은 졸이는 시간이 반이야. 젓는 거 멈추면 별 하나 깎는다.', c: 'moka:smug' },
    { s: 'luna', t: '모카, 팔 아파! 그래도 냄새는 별 다섯이야!', r: 'luna:cry' },
    { s: 'yeoni', t: '병 스물네 개, 겨울 디저트 재고 확보. 라벨은 내가 계산대에서 붙일게.', l: 'yeoni:determined' },
    { s: 'yeoni', t: '(재고 장부가 달콤해졌다. 저장고 평점 별 다섯.)', l: 'yeoni:smile' },
  ],
  // 21 · 2년차 12월
  [
    ch('2년차 12월 · 계절 소품', '이브의 마감', 'atelier_dark', 'yeoni:normal', 'luna:smile', 'neo:normal'),
    { s: 'nar', t: '크리스마스이브, 마지막 손님이 떠나자 작은 트리에 불이 켜졌다.' },
    { s: 'lune', t: '조명은 하나만 켜자. 이 정도가 제일 따뜻해 보여.', c: 'lune:smile', need: 'lune' },
    { s: 'bambi', t: '캐럴은 작게 부를게. 다들 오늘 목 많이 썼잖아.', c: 'bambi:smile', need: 'bambi' },
    { s: 'neo', t: '연이, 이거. 계산대 펜이 다 닳았길래.', r: 'neo:smile' },
    { s: 'yeoni', t: '…펜에 내 이름이 새겨져 있네. 이거 원가 계산 못 하게 만든 거지?', l: 'yeoni:surprised' },
    { s: 'yeoni', t: '(선물 평점 별 다섯. 오늘 장부 마지막 줄은 이 펜으로 쓴다.)', l: 'yeoni:smile' },
  ],
  // 22 · 2년차 1월
  [
    ch('2년차 1월 · 계절 소품', '계산대까지 난 길', 'atelier_lit', 'yeoni:surprised', 'luna:surprised', 'neo:normal'),
    { s: 'nar', t: '밤새 내린 눈에 가게 앞이 하얗게 막혔다. 문을 열자, 계산대 쪽 문까지 좁은 길이 이미 나 있었다.' },
    { s: 'luna', t: '네오 오빠가 해 뜨기 전부터 삽 들고 나갔어! 나 창문으로 다 봤어.', c: 'luna:smile' },
    { s: 'neo', t: '손님 길보다 연이 출근길이 먼저였어. 미끄러우면 장부 떨어뜨리잖아.', r: 'neo:flustered' },
    { s: 'yeoni', t: '그 길, 딱 내 걸음 폭이네. 계산까지 해 놨어?', l: 'yeoni:smile' },
    { s: 'yeoni', t: '(제설 평점 별 다섯. 손님 길은 지금부터 같이 치우자.)', l: 'yeoni:determined' },
  ],
  // 23 · 2년차 2월
  [
    ch('2년차 2월 · 계절 소품', '가격표 없는 초콜릿', 'atelier_lit', 'yeoni:normal', null, 'neo:smile'),
    { s: 'nar', t: '두 번째 2월, 연이가 꺼낸 상자에는 이번엔 계산서도 반올림 기호도 없었다.' },
    { s: 'neo', t: '올해는 정산서 아니야?', r: 'neo:smile' },
    { s: 'yeoni', t: '아니야, 가격표도 안 붙였어. 이건 계산 바깥이니까.', l: 'yeoni:smile' },
    { s: 'neo', t: '그럼 나도 계산 없이 받을게. 고마워, 연이.', r: 'neo:smile' },
    { s: 'yeoni', t: '(두 해 동안 매긴 별 중에서, 값을 안 매긴 게 제일 반짝인다.)', l: 'yeoni:normal' },
  ],
]);

// 합류하지 않은 동료의 박자는 빼고 돌려준다(놓친 합류에도 장면이 이어지게)
export function seasonStory(idx, state) {
  const ep = SEASON_STORIES[idx];
  if (!ep) return null;
  return ep.filter(b => !b.need || state.roster?.[b.need]).map(({ need, ...b }) => b);
}
