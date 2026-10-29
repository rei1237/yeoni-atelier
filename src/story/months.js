// 달 이야기·결말: 게임 오리지널 외전(원작 사실 아님). 형식은 prologue.js 박자와 같다.
// 매달 상순 영업 준비 때 한 번 나온다(ledger.story['m<번호>']). 결말은 마지막 순을 마친 뒤 한 번.
// 청토끼·서한비·윤달의 결말은 쓰지 않는다. 청토끼는 늘 그렇듯 계산만 하고 떠난다.

export const MONTH_STORIES = Object.freeze([
  // m0 · 3월: 개업 첫 달, 만기와 이자
  [
    { chapter: ['1년차 3월', '개업 첫 달, 악마의 복리'], bg: 'atelier_lit', l: 'yeoni:normal', c: 'cheongtokki:smile', r: null },
    { s: 'rab', t: '후후.. 개업 축하드려요~ 축하 화환 대신 사랑을 듬뿍 담은 이자 고지서를 가져왔답니다~' },
    { s: 'rab', t: '저는 최약체랍니다~ 손가락에 힘이 없어서 이자율 숫자를 살살 썼어요, 후후.', c: 'cheongtokki:smug' },
    { s: 'sys', t: '[ 매달 하순 영업을 마치면 남은 빚의 2%가 이자로 청구됩니다. 부족하면 빚에 복리로 가산됩니다 ]' },
    { s: 'yeoni', t: '내년 2월 하순 만기까지 36번의 영업… 매달 복리로 불어나면 순이익을 한 순에 최소 3,500골드는 뽑아야 해!', l: 'yeoni:determined' },
    { s: 'luna', t: '연이 언니 계산기 두드리는 소리가 기관총 같아! 근데 우리 진짜 부자 될 수 있는 거지?', c: 'luna:surprised' },
    { s: 'yeoni', t: '부자가 문제가 아니라 내 눈앞에서 단 1골드라도 새어나가는 꼴을 보면 심장마비가 올 것 같아!', l: 'yeoni:determined' },
    { s: 'yeoni', t: '(돈 냄새가 이렇게 향긋한데 포기할 순 없지. 내 탐욕 지수 별 다섯 개 만점!)', l: 'yeoni:smile' },
    { s: 'rab', t: '후후.. 의욕이 넘치시니 보기 좋네요~ 못 갚으시면 가게 뒷마당도 제 소유가 된답니다~ 총총!', c: 'cheongtokki:smile' },
    { s: 'yeoni', t: '소금 뿌려, 소금! 굽는 건 언니, 서빙은 루나, 손님 홀리는 건 네오 얼굴!', l: 'yeoni:determined' },
    { s: 'sys', t: '[ 영업 1회 = 한 순. 순마다 행동력 2가 채워지고, 사냥과 동료와의 대화에 씁니다 ]' },
  ],
  // m1 · 4월: 강가 꽃길, 모카의 첫 별점
  [
    { chapter: ['1년차 4월', '만석 사태와 쫓겨난 손님들'], bg: 'atelier_lit', l: 'yeoni:surprised', c: 'moka:normal', r: null },
    { s: 'nar', t: '사주의 강가에 벚꽃이 흩날리자, 봄나들이를 나온 손님들이 카페 문 앞까지 긴 줄을 늘어섰다.' },
    { s: 'yeoni', t: '으아악! 손님이 스무 명인데 테이블이 고작 세 개뿐이라 절반이 그냥 돌아갔어!', l: 'yeoni:sulky', fx: 'shake' },
    { s: 'yeoni', t: '내 귀때기에서 금화가 굴러서 강물로 풍덩 빠지는 소리가 생생하게 들렸다고!', l: 'yeoni:determined' },
    { s: 'moka', t: '쯧쯧, 손님을 문간에서 쫓아내는 카페라니. 이 가게 공간 활용도 점수, 별 반 개.', c: 'moka:smug' },
    { s: 'yeoni', t: '별점 테러 그만하고 해결책을 내놔요! 내 금화 살려내!', l: 'yeoni:sulky' },
    { s: 'moka', t: '마을 공방 게시판이나 가 봐. 목수한테 돈 쥐여주면 테이블도 짜 주고 막힌 벽도 헐어 준다.', c: 'moka:normal' },
    { s: 'luna_sis', t: '창가 자리를 트면… 꽃을 보며 오래 머무는 손님들이 라테를 두 잔씩 드실 거예요.', r: 'luna_sis:normal' },
    { s: 'yeoni', t: '(공방에 골드를 쓰는 건 지출이 아니다. 미래의 금화를 끌어당기는 미끼다!)', l: 'yeoni:smile' },
  ],
  // m2 · 5월: 괜찮지 않은 "괜찮아요" & 창밖의 검은 우산
  [
    { chapter: ['1년차 5월', '창밖의 시선과 박병하'], bg: 'atelier_dark', l: 'yeoni:determined', c: 'luna_sis:tired', r: 'neo_cat:serious' },
    { s: 'nar', t: '새벽 네 시, 연이의 엄명으로 루나 언니를 침대로 보낸 뒤 고요해진 카페 창밖으로 차가운 봄비가 쏟아졌다.' },
    { s: 'nar', t: '물안개 자욱한 유리창 너머, 검은 우산을 든 장신의 인영이 우두커니 서 있었다.' },
    { s: 'neo_cat', t: '…하악! 네 녀석이 왜 이 사주의 강가까지 흘러들어온 거지?', r: 'neo_cat:serious', fx: 'shake' },
    { s: 'hanbi', t: '오랜만이군요. 그 가련하고 작은 고양이 꼴로 여전히 누군가의 방패막이를 자처하고 있습니까, 박병하 씨.', c: 'hanbi:serious' },
    { s: 'neo_cat', t: '그 이름으로 부르지 마라. 연이에게 다가가면 내 발톱이 네 목을 찢을 것이다.', r: 'neo_cat:serious' },
    { s: 'hanbi', t: '후후… 여전히 멍청하게 고결하군요. 하지만 빚은 남겨 두면 불어나는 법입니다. 이번에야말로 그 빚을 감당할 수 있는지 지켜보죠.', c: 'hanbi:smile' },
    { s: 'yeoni', t: '어라? 거기 빗속에 서 계신 분! 마감했지만 선불 200골드 주시면 따뜻한 차 한 잔 말아드릴 수 있는데요?!', l: 'yeoni:surprised' },
    { s: 'hanbi', t: '…장사 수완이 대단한 사장님이군요. 다음 잔은 제값을 치르고 마시겠습니다.', c: 'hanbi:normal' },
    { s: 'neo_cat', t: '…사라졌군. 저 자는 흑월의 장부를 쥔 자다. 절대로 방심해선 안 돼.', r: 'neo_cat:serious' },
    { s: 'yeoni', t: '(비싼 코트 입은 손님이 그냥 가 버렸네. 아까운 내 200골드…)', l: 'yeoni:sulky' },
    { s: 'sys', t: '[ 영업 준비의 「👥 동료」에서 행동력 1로 대화할 수 있습니다. 친밀도가 오르면 새 능력이 열립니다 ]' },
  ],
  // m3 · 6월: 장마와 검은 손, 그리고 우산
  [
    { chapter: ['1년차 6월', '빗속의 우산과 애증'], bg: 'river_night', l: 'yeoni:normal', c: 'neo_cat:serious', r: 'hanbi:normal' },
    { s: 'nar', t: '장마가 강가를 집어삼킨 밤. 불어난 검은 손 무리가 영냥이를 사방에서 포위했다.' },
    { s: 'neo_cat', t: '큭… 비 때문에 발이 젖어 도약이 늦었다…!', c: 'neo_cat:serious', fx: 'shake' },
    { s: 'nar', t: '검은 손이 덮치려는 찰나, 먹빛 우산 끝이 허공을 가르며 적들을 한순간에 베어 넘겼다.', fx: 'flash' },
    { s: 'hanbi', t: '꼴사납군요. 실패한 시간선에서 함께 문을 넘어왔을 때의 기백은 어디로 갔습니까.', r: 'hanbi:serious' },
    { s: 'neo_cat', t: '…누가 구해달라고 했나. 너에게 빚을 질 생각은 추호도 없다.', c: 'neo_cat:serious' },
    { s: 'hanbi', t: '착각하지 마세요. 당신이 쓰러지면 내 장부의 미수는 누구에게 받습니까. …아직 부러지지 마세요, 병하 씨.', r: 'hanbi:smile' },
    { s: 'yeoni', t: '영냥아! 무사했구나! 앗, 저 멋진 검은 우산 손님은 저번 그분?! 우리 영냥이 구해줘서 고마워요!', l: 'yeoni:smile' },
    { s: 'hanbi', t: '…고마워할 필요 없습니다. 이 고양이의 목숨값은 나중에 아주 비싸게 청구할 테니까요.', r: 'hanbi:normal' },
    { s: 'neo_cat', t: '…서한비. 너는 변하지 않았군.', c: 'neo_cat:smug' },
    { s: 'sys', t: '[ 달이 지날수록 사냥터의 적이 강해집니다. 장비와 친밀도로 영냥이를 키워 주세요 ]' },
  ],
  // m4 · 7월: 모카의 비밀 랩
  [
    { chapter: ['1년차 7월', '창고 뒤의 은밀한 비트'], bg: 'atelier_lit', l: 'yeoni:smile', c: null, r: 'moka:normal' },
    { s: 'nar', t: '얼음 포대를 가지러 창고 뒤편으로 돌아간 연이는, 둔탁하게 울리는 비트 소리를 포착했다.' },
    { s: 'moka', t: '원두는 다크 로스팅~ 청토끼 이자는 복리 슬라이싱~ 별점 테러는 나의 취미, 수달의 플로우는 논스톱 딜리버리~ Yo!', r: 'moka:normal' },
    { s: 'yeoni', t: '오호라! 모카 셰프님, 가사에 우리 카페 빚이랑 청토끼 디스 랩이 아주 찰지게 들어갔는데요?!', l: 'yeoni:smile' },
    { s: 'moka', t: '…큭?! 너, 언제부터 거기 서 있었어?!', r: 'moka:angry', fx: 'shake' },
    { s: 'yeoni', t: '비트 타는 솜씨 별 다섯 개! 이 랩 우리 카페 영업용 배경음악으로 틀면 원두 10% 할인해 주나요?', l: 'yeoni:determined' },
    { s: 'moka', t: '당장 잊어! 머릿속에서 포맷해! 한 글자라도 밖으로 새어 나가면 배달비 열 배로 올린다!', r: 'moka:angry' },
    { s: 'yeoni', t: '(협박 수위는 별점 마이너스지만, 라임이 꽤 중독적이라 흥얼거리게 된다.)', l: 'yeoni:normal' },
  ],
  // m5 · 8월: 강가 축제와 장부 점검
  [
    { chapter: ['1년차 8월', '축제날의 불청객들과 약병'], bg: 'atelier_lit', l: 'yeoni:determined', c: 'cheongtokki:smile', r: 'hanbi:normal' },
    { s: 'nar', t: '한여름 강가 축제로 거리가 붐비는 가운데, 청토끼 비행선이 어김없이 착륙했다.' },
    { s: 'rab', t: '후후.. 어머나~ 축제라니 낭만적이네요! 저는 최약체라 중간 이자 계산서만 성실하게 들고 왔답니다~', c: 'cheongtokki:smug' },
    { s: 'yundal', t: '으악! 저 파란 토끼 귀! 내 卯시를 털어간 시간 도둑 녀석!', l: 'yundal:smug', fx: 'shake' },
    { s: 'yeoni', t: '이자 복리 올림 계산까지 내가 1골드 오차 없이 다 맞춰 놨다! 어서 영수증 찍고 가!', l: 'yeoni:determined' },
    { s: 'nar', t: '카운터 구석에서 서한비가 묵묵히 금화를 내려놓으며, 그 옆에 은빛 약병 하나를 슬그머니 밀어 두었다.' },
    { s: 'neo', t: '…이 약병은 뭐지.', r: 'neo:serious' },
    { s: 'hanbi', t: '당신 왼손 발톱의 상처, 곪았더군요. 빚진 자가 흉터를 달고 다니면 채권자로서 보기가 흉합니다.', c: 'hanbi:serious' },
    { s: 'neo', t: '…동정 따윈 필요 없다고 했을 텐데.', r: 'neo:flustered' },
    { s: 'hanbi', t: '동정이 아닙니다. 선이자일 뿐이죠.', c: 'hanbi:smile' },
    { s: 'yeoni', t: '(두 사람 사이에 흐르는 이 살벌하면서도 애틋한 공기는 대체 뭐지? 아무튼 약값은 아꼈다!)', l: 'yeoni:smile' },
  ],
  // m6 · 9월: 보름달과 달빵
  [
    { chapter: ['1년차 9월', '보름달과 차가운 온기'], bg: 'river_night', l: 'yeoni:smile', c: 'neo:normal', r: 'hanbi:normal' },
    { s: 'nar', t: '보름달이 뜬 밤, 루나 언니의 비법 달빵을 한가득 구워 모두가 웃으며 나누어 먹었다.' },
    { s: 'nar', t: '연이가 계산에 취해 있는 사이, 네오는 달빵 하나를 종이에 싸서 강가 벤치에 홀로 앉아 있는 서한비에게 다가갔다.' },
    { s: 'neo', t: '…받아라. 루나 언니가 구운 거다. 독 안 탔으니 먹든가 버리든가 해.', c: 'neo:normal' },
    { s: 'hanbi', t: '…당신은 여전히 단맛을 기억하고 있군요. 첫 번째 봄에서도 그랬듯.', r: 'hanbi:serious' },
    { s: 'hanbi', t: '그 무른 미련이 언젠가 당신을 다시 부술 겁니다, 병하 씨.', r: 'hanbi:serious' },
    { s: 'neo', t: '부서져도 내가 부서져. 이번엔 연이도, 이 가게도, 그리고… 너도 잃지 않는다.', c: 'neo:smile' },
    { s: 'hanbi', t: '…후, 여전히 감당하지도 못할 말을 쉽게 뱉는군요.', r: 'hanbi:smile' },
    { s: 'yeoni', t: '네오야! 거기서 누구랑 몰래 빵 먹어?! 빵 한 개에 원가 50골드인데!', l: 'yeoni:surprised' },
    { s: 'hanbi', t: '…맛있군요. 50골드의 값어치는 충분합니다.', r: 'hanbi:normal' },
  ],
  // m7 · 10월: 루나의 저울과 서한비의 조언
  [
    { chapter: ['1년차 10월', '장부의 틈새와 우산의 은혜'], bg: 'atelier_lit', l: 'yeoni:normal', c: 'luna:smile', r: 'hanbi:normal' },
    { s: 'nar', t: '가을비가 조용히 내리는 오후, 서한비가 카운터로 다가와 정직하게 5골드를 돌려주었다.' },
    { s: 'hanbi', t: '연이 씨, 거스름돈에 5골드가 더 얹혀 있더군요. 빚은 남겨 두면 불어나는 법입니다.', r: 'hanbi:normal' },
    { s: 'yeoni', t: '어머나! 내 소중한 5골드를 정직하게 돌려주시다니! 손님, 양심 평점 별 다섯 개 만점 드립니다!', l: 'yeoni:smile' },
    { s: 'hanbi', t: '…청토끼는 최약체를 자처하지만 시간의 공백을 먹는 자입니다. 12만 골드의 굴레를 끊으려면 7조 3항의 이중 올림 괄호를 파고드세요.', r: 'hanbi:serious' },
    { s: 'neo', t: '…서한비. 너답지 않게 왜 청토끼의 약점을 알려주는 거지?', c: 'neo:serious' },
    { s: 'hanbi', t: '…어떤 바보가 빗속에서 내게 우산을 먼저 기울여 준 적이 있었거든요. 그 빚을 갚는 것뿐입니다.', r: 'hanbi:smile' },
    { s: 'luna', t: '연이 언니! 저울 환전 손님 왔어! 나 이제 월정석 백 개까지 셀 수 있어! 하나, 둘, 셋… 백!', c: 'luna:smile' },
    { s: 'yeoni', t: '루나야, 방금 넷부터 아흔아홉까지 순간이동으로 스킵한 것 같은데 내 착각이지…?!', l: 'yeoni:surprised' },
    { s: 'hanbi', t: '후후… 참으로 소란스럽고 따뜻한 곳이군요.', r: 'hanbi:smile' },
  ],
  // m8 · 11월: 첫 서리와 오븐
  [
    { chapter: ['1년차 11월', '오븐 심폐소생술'], bg: 'atelier_dark', l: 'yeoni:surprised', c: 'luna_sis:serious', r: 'moka:normal' },
    { s: 'nar', t: '첫 서리가 내린 쌀쌀한 아침, 메인 오븐이 덜컹거리며 검은 연기를 뿜더니 픽 꺼져 버렸다.', fx: 'shake' },
    { s: 'luna_sis', t: '오븐에 불이 안 들어가요… 괜찮… 지 않아요, 이번엔 정말로 손발이 떨려요…!', c: 'luna_sis:serious' },
    { s: 'yeoni', t: '하루 오븐 정지면 디저트 매출 4,000골드가 증발해! 11월 하순 이자가 코앞인데 대참사야!', l: 'yeoni:surprised' },
    { s: 'moka', t: '아침부터 동네 떠나가게 곡소리 내지 마. 비켜 봐, 수달표 정밀 엔지니어링 맛 좀 봐라.', r: 'moka:smug' },
    { s: 'nar', t: '모카가 공구 렌치를 꺼내 밸브를 세 번 두드리자, 오븐 내부가 다시 따스한 주홍빛으로 활활 타올랐다.', fx: 'glow' },
    { s: 'yeoni', t: '살았다! 내 골드가 되살아났어! 모카, 수리비 청구서 당장 끊어 줘요!', l: 'yeoni:smile' },
    { s: 'moka', t: '수리비는 됐고, 내 비밀 랩 가사 한 줄이라도 퍼뜨리면 오븐 나사를 몽땅 풀어 버릴 줄 알아.', r: 'moka:normal' },
  ],
  // m9 · 12월: 연말의 운세 라테
  [
    { chapter: ['1년차 12월', '라테 폭풍과 황금의 연말'], bg: 'atelier_lit', l: 'yeoni:smile', c: null, r: 'neo:smile' },
    { s: 'nar', t: '한 해의 마지막 달, 새해 운세를 점치려는 손님들이 끝없이 밀려들어 운세 라테를 주문했다.' },
    { s: 'neo', t: '연이, 오늘만 운세 라테가 일흔 잔째야… 손님들마다 미소 지어 주느라 입꼬리가 떨려.', r: 'neo:smile' },
    { s: 'yeoni', t: '네오야 조금만 더 버텨! 지금 네 미소 한 방에 팁 상자가 터져 나가고 있어!', l: 'yeoni:determined' },
    { s: 'yeoni', t: '만기 결산일까지 딱 두 달 남았어! 지금 모은 골드가 내년 2월의 운명을 가른다!', l: 'yeoni:smile' },
    { s: 'neo', t: '그래, 연이가 이렇게 눈을 반짝이는데 쓰러질 순 없지. 마감까지 확실하게 모실게.', r: 'neo:smile' },
    { s: 'yeoni', t: '(동료들 활약상 평점, 별 다섯 개로도 모자라 우주를 뚫고 나간다!)', l: 'yeoni:smile' },
  ],
  // m10 · 1월: 새해, 남은 두 달
  [
    { chapter: ['2년차 1월', '눈 내리는 강가, 두 사람의 맹세'], bg: 'atelier_lit', l: 'yeoni:normal', c: 'cheongtokki:smile', r: 'hanbi:normal' },
    { s: 'rab', t: '후후.. 새해 복 많이 받으세요~ 그리고 만기까지 딱 두 달 남았답니다~' },
    { s: 'rab', t: '저는 최약체라 날짜 세는 것만큼은 아주 칼같거든요~ 결산일에 빚이 1골드라도 남으면 계약 연장이랍니다, 후후.', c: 'cheongtokki:smug' },
    { s: 'yeoni', t: '새해 인사 뒤에 비수를 숨겨서 꽂는 실력, 악덕 채권자 랭킹 1위 답네!', l: 'yeoni:sulky' },
    { s: 'nar', t: '청토끼가 떠난 뒤 눈 내리는 테라스. 네오와 서한비가 나란히 서서 강물을 내려다보았다.' },
    { s: 'hanbi', t: '두 달 뒤면 결판이 나겠군요. 당신이 지키려던 이 작은 낙원도 끝날지 모릅니다.', r: 'hanbi:serious' },
    { s: 'neo', t: '끝나지 않아. 이번 봄은… 누구도 소멸하지 않는다. 연이도, 루나 자매도, 그리고 너도.', c: 'neo:serious' },
    { s: 'hanbi', t: '…오만하군요. 하지만 지켜보겠습니다. 당신이 이번에야말로 그 봄을 지켜내는지.', r: 'hanbi:smile' },
    { s: 'yeoni', t: '거기 둘 다 감기 걸리지 말고 들어와서 장부 검산 도와! 1골드라도 새면 국물도 없어!', l: 'yeoni:determined' },
  ],
  // m11 · 2월: 마지막 달
  [
    { chapter: ['2년차 2월', '최후의 장부와 증인'], bg: 'atelier_lit', l: 'yeoni:determined', c: 'luna_sis:normal', r: 'hanbi:normal' },
    { s: 'nar', t: '운명의 2월. 장부는 일 년간 쌓인 전표와 영수증으로 세 배나 두툼해져 있었다.' },
    { s: 'hanbi', t: '마지막 순이군요. 오늘 하루, 저도 이 가게의 마지막 손님이자 증인이 되겠습니다.', r: 'hanbi:smile' },
    { s: 'luna_sis', t: '연이 씨, 서한비 씨, 고마워요. 이제는 어떤 결과가 나오든… 정말로 괜찮아요.', c: 'luna_sis:smile' },
    { s: 'luna', t: '언니가 처음으로 목소리 하나도 안 떨리고 진짜 괜찮다고 했어! 연이 언니, 들었지?!', c: 'luna:cry' },
    { s: 'yeoni', t: '들었어! 하지만 내 목표는 \'괜찮다\'가 아니라 \'완전 무결 승리\'야!', l: 'yeoni:determined' },
    { s: 'neo', t: '그래, 마지막 세 번의 영업. 내 모든 걸 걸고 홀을 지킬게.', c: 'neo:smile' },
    { s: 'yeoni', t: '계산대는 내 목숨을 걸고 지킨다! 전원 출격!', l: 'yeoni:determined' },
    { s: 'sys', t: '[ 2월 하순 영업을 마치면 결말이 정해집니다. 그 뒤에도 후일담으로 계속 영업할 수 있습니다 ]' },
  ],
]);

const ENDING_HEAD = { s: 'sys', t: '[ 「연이의 아틀리에」 게임 오리지널 외전 결말입니다 ]' };

export const ENDINGS = Object.freeze({
  // 빚 완납 + 동료와 깊은 인연
  grand: {
    title: '별 다섯 개의 아틀리에',
    beats: [
      { chapter: ['EPILOGUE', '별 다섯 개의 아틀리에'], bg: 'atelier_lit', l: 'yeoni:smile', c: 'cheongtokki:smile', r: 'hanbi:smile' },
      ENDING_HEAD,
      { s: 'rab', t: '후후.. 어머나 세상에… 남은 빚이 0골드? 복리 이자까지 한 푼 남김없이 전부 상환하셨다고요?!' },
      { s: 'rab', t: '저는 최약체라 이런 말도 안 되는 결산서를 보면 심장이 덜컥 내려앉는답니다… 후후.', c: 'cheongtokki:smug' },
      { s: 'yeoni', t: '자, 영수증 줘! 0이라고 대문짝만하게 코끼리만 한 글씨로 인쇄해서 뽑아내!', l: 'yeoni:determined' },
      { s: 'rab', t: '후후.. 완패네요~ 청토끼 금융 역사상 가장 지독한 사장님이셨어요. 그럼 다음 기회에 뵙죠~ 총총!', c: 'cheongtokki:smile' },
      { s: 'nar', t: '파란 비행선이 도망치듯 떠나가자, 서한비가 네오를 바라보며 조용히 미소 지었다.', r: 'hanbi:smile' },
      { s: 'hanbi', t: '…해냈군요. 이번 봄은 참으로 따뜻합니다, 박병하 씨.', r: 'hanbi:smile' },
      { s: 'neo', t: '…그래. 너도 이제 그 무거운 우산을 조금은 내려놓아도 돼.', c: 'neo:smile' },
      { s: 'moka', t: '…별 다섯 개 만점. 내 평생 남의 가게에 이 점수 주는 건 처음이자 마지막이다! 랩이나 들어라!', c: 'moka:smug' },
      { s: 'luna', t: '와아아앙! 모카가 별 다섯 줬어! 언니, 우리 가게 이제 진짜 빚 없는 우리 집이야!', c: 'luna:cry', fx: 'shake' },
      { s: 'luna_sis', t: '괜찮아요… 아니, 오늘은 하늘을 날아갈 것만큼 행복해요!', c: 'luna_sis:smile' },
      { s: 'yeoni', t: '계산대가 바로 카페의 심장이자 승리의 지휘석이니까! 오늘 우리 팀 평점, 별 백만 개 만점!', l: 'yeoni:smile', fx: 'glow' },
      { s: 'yeoni', t: '(그리고 장부의 맨 마지막 페이지에는… 영원히 함께할 인연들을 기록하기로 했다.)', l: 'yeoni:normal' },
      { s: 'impact', t: 'THE END · 찬란한 아틀리에는 영원히 계속된다', bg: 'atelier_lit' },
    ],
  },
  // 빚 완납
  clear: {
    title: '0골드의 아침',
    beats: [
      { chapter: ['EPILOGUE', '0골드의 아침'], bg: 'atelier_lit', l: 'yeoni:smile', c: 'cheongtokki:normal', r: 'hanbi:normal' },
      ENDING_HEAD,
      { s: 'rab', t: '후후.. 어머~ 원금 십이만 골드를 정말로 깔끔하게 다 갚으셨네요.' },
      { s: 'rab', t: '더 이상 뜯어낼 이자가 없으니 최약체인 저는 너무 심심해서 눈물이 날 지경이랍니다~ 총총!', c: 'cheongtokki:smug' },
      { s: 'yeoni', t: '심심하면 다음엔 계약서 글씨나 돋보기 없이 보이게 키워 놔! 두 번 다시 우리 마주치지 말자고!', l: 'yeoni:determined' },
      { s: 'hanbi', t: '빚은 남겨 두면 불어나는 법이지만… 다 털어낸 자의 아침은 눈부시군요.', r: 'hanbi:smile' },
      { s: 'neo_cat', t: '너도 이제 그 낡은 장부 따윈 태워 버려라.', c: 'neo_cat:smug' },
      { s: 'hanbi', t: '후후, 생각해 보죠. 다음에 오면 커피값은 정가로 내겠습니다.', r: 'hanbi:normal' },
      { s: 'luna_sis', t: '연이 씨, 네오 씨, 고양이님. 이제 평생 빵값은 안 받을게요. 진짜로 괜찮아요.', c: 'luna_sis:smile' },
      { s: 'yeoni', t: '평생 빵 무료?! 그 엄청난 식비 절감 가치… 계산해 보니 별 다섯 개짜리 특권이야!', l: 'yeoni:smile' },
      { s: 'impact', t: 'THE END · 다음 회차에는 동료들과 더 깊은 인연을', bg: 'atelier_lit' },
    ],
  },
  // 빚 40% 이하 남음
  close: {
    title: '조금 모자란 봄',
    beats: [
      { chapter: ['EPILOGUE', '조금 모자란 봄'], bg: 'atelier_lit', l: 'yeoni:sulky', c: 'cheongtokki:smile', r: 'hanbi:normal' },
      ENDING_HEAD,
      { s: 'rab', t: '후후.. 어머~ 정말 아깝네요! 거의 다 갚으셨는데 손톱만큼 남았답니다~' },
      { s: 'rab', t: '저는 최약체라 규칙을 바꿀 힘이 없어요~ 계약은 딱 일 년 더 연장됩니다, 후후.', c: 'cheongtokki:smug' },
      { s: 'yeoni', t: '이자율은 설마 또 올림 복리야?! 그 사기 계약서 글씨는 여전히 벼룩 눈알만 하고?!', l: 'yeoni:sulky' },
      { s: 'hanbi', t: '조급해하지 마세요, 연이 씨. 빚의 60%를 깎아낸 것만으로도 기적입니다.', r: 'hanbi:normal' },
      { s: 'neo', t: '그래, 서한비 말대로야. 1년만 더 있으면 완벽하게 청토끼를 털어낼 수 있어.', c: 'neo:smile' },
      { s: 'luna_sis', t: '괜찮아요. 빚 갚는 요령을 배웠으니, 내년 봄엔 반드시 끝낼 수 있어요.', r: 'luna_sis:smile' },
      { s: 'yeoni', t: '(비록 완납은 못 했지만 흑자 전환의 길은 열렸다! 내년엔 코끼리만 한 글씨로 영수증을 꽂아주마!)', l: 'yeoni:determined' },
      { s: 'impact', t: 'THE END · 다시 돌아올 봄을 향하여', bg: 'atelier_lit' },
    ],
  },
  // 빚이 많이 남음
  extend: {
    title: '계약서 2권',
    beats: [
      { chapter: ['EPILOGUE', '계약서 2권'], bg: 'atelier_dark', l: 'yeoni:surprised', c: 'cheongtokki:smile', r: 'hanbi:serious' },
      ENDING_HEAD,
      { s: 'rab', t: '후후.. 어머~ 빚이 꽤 많이 남았네요! 실망하지 마세요, 특별히 2권을 준비해 왔답니다~' },
      { s: 'sys', t: '[ 새 계약서: 두께 3cm, 백과사전 양장본 에디션 ]' },
      { s: 'impact', t: '계약서가 둔기가 됐잖아?!', l: 'yeoni:surprised', fx: 'shake' },
      { s: 'hanbi', t: '…묵직한 빚이군요. 하지만 빚이 남아 있는 한, 당신들이 포기하지 않는 모습도 계속 볼 수 있겠지요.', r: 'hanbi:serious' },
      { s: 'neo_cat', t: '서한비, 비꼬지 마라. 2권이든 3권이든 다 갚을 때까지 내가 곁에 있을 테니까.', c: 'neo_cat:serious' },
      { s: 'luna_sis', t: '네. 오븐도 따뜻하고, 계산대엔 연이 씨가 있어요. 괜찮아요.', c: 'luna_sis:tired' },
      { s: 'yeoni', t: '맞아! 2권의 주인공은 훨씬 더 지독하게 돈독이 오른 악마 사장으로 각성한다! 다시 시작이다!', l: 'yeoni:determined' },
      { s: 'impact', t: 'TO BE CONTINUED · 독기를 품고, 다시 한번 영업 개시!', bg: 'atelier_lit' },
    ],
  },
]);
