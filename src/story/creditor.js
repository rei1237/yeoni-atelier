// 청토끼 이자율 인상 장면(게임 오리지널 외전). 인상 달 상순 준비 때 달 이야기 다음에 한 번(rate:<달>).
// 네오는 연이를 지키려 버틴다(과시 포즈 없음). 청토끼의 결말은 쓰지 않는다.
const GROWTH = { s: 'sys', t: '[ 네오가 버티며 자랐습니다 · 호스트 능력치와 사냥 체력·피해가 조금 오릅니다 ]', fx: 'glow' };

export const RATE_STORIES = Object.freeze({
  5: [
    { chapter: ['1년차 8월', '어머~ 새 이자율 안내문'], bg: 'atelier_dark', l: 'yeoni:normal', c: 'cheongtokki:smile', r: 'neo:normal' },
    { s: 'nar', t: '한여름 마감 직후, 하늘색 비행선이 가게 앞 그림자를 길게 늘였다.' },
    { s: 'rab', t: '어머~ 여름 영업 수고 많으셨어요. 오늘은 새 이자율 안내문을 가져왔답니다~', c: 'cheongtokki:smug' },
    { s: 'sys', t: '[ 청토끼 금융 · 이번 달부터 인수 빚 월 이자 2% → 3%(임시) ]' },
    { s: 'yeoni', t: '3%? 잠깐, 계약서 어디에 그런 말이 있었는데?', l: 'yeoni:surprised' },
    { s: 'rab', t: '뒷면 맨 아래, 개미만 한 글씨로요~ 계산에는 빈틈이 없답니다.', c: 'cheongtokki:smile' },
    { s: 'yeoni', t: '(계약서 뒷면까지 읽는 사람 별 다섯, 안 읽은 나 별 하나.)', l: 'yeoni:sulky' },
    { s: 'nar', t: '네오가 조용히 연이 앞으로 한 걸음 나섰다. 장부를 쥔 연이의 손끝이 조금 떨리고 있었다.', r: 'neo:serious' },
    { s: 'neo', t: '연이는 계산만 해. 손님 앞에서 버티는 건 내가 할게.' },
    { s: 'yeoni', t: '…그럼 나는 그 버팀까지 장부에 넣을게. 한 줄도 안 틀리고.', l: 'yeoni:determined' },
    GROWTH,
  ],
  8: [
    { chapter: ['1년차 11월', '찬바람과 4%'], bg: 'atelier_lit', l: 'yeoni:normal', c: 'cheongtokki:normal', r: 'neo:normal' },
    { s: 'nar', t: '첫 서리가 내린 아침, 청토끼는 따뜻한 차보다 도장을 먼저 꺼냈다.' },
    { s: 'rab', t: '어머~ 날이 추워지니 숫자도 몸을 웅크리네요. 이번 달부터 4%랍니다~', c: 'cheongtokki:smile' },
    { s: 'sys', t: '[ 청토끼 금융 · 인수 빚 월 이자 3% → 4%(임시) ]' },
    { s: 'luna', t: '또 올라? 연이 언니, 우리 겨울 못 나는 거 아니야?', c: 'luna:cry' },
    { s: 'yeoni', t: '못 나긴! 이자는 올라도 우리 손님도 늘었어.', l: 'yeoni:determined' },
    { s: 'rab', t: '저는 최약체랍니다~ 그냥 계산만 하는 토끼예요.', c: 'cheongtokki:smug' },
    { s: 'neo', t: '계산이 정확한 건 알아. 그래도 연이 장부를 비웃게 두진 않아.', r: 'neo:serious' },
    { s: 'nar', t: '네오는 연이 쪽을 돌아보며 목도리를 고쳐 매 주었다. 오늘 밤 지명 명단은 조금 길어질 터였다.' },
    { s: 'yeoni', t: '(따뜻함 별 다섯. 근데 그 목도리는 언제 챙긴 거야?)', l: 'yeoni:smile' },
    GROWTH,
  ],
  14: [
    { chapter: ['2년차 5월', '두 번째 봄의 5%'], bg: 'atelier_lit', l: 'yeoni:normal', c: 'cheongtokki:smile', r: 'neo:normal' },
    { s: 'nar', t: '두 번째 봄, 무대 위로 꽃잎 지폐가 쌓일 무렵 비행선이 다시 내려앉았다.' },
    { s: 'rab', t: '어머~ 무대가 아주 화려해졌네요. 그만큼 이자율도 5%로 화사하게 올려 드릴게요~', c: 'cheongtokki:smug' },
    { s: 'sys', t: '[ 청토끼 금융 · 인수 빚 월 이자 4% → 5%(임시) ]' },
    { s: 'yeoni', t: '화사하게 피는 건 꽃이지 이자가 아니야!', l: 'yeoni:sulky' },
    { s: 'luna_sis', t: '괜찮아요… 오븐 하나 더 돌리면, 괜찮을 거예요.', c: 'luna_sis:tired' },
    { s: 'neo', t: '언니는 좀 쉬어요. 오늘 무대는 내가 한 곡 더 할게.', r: 'neo:serious' },
    { s: 'neo', t: '연이, 무리하는 거 아니야. 네가 웃으면서 계산할 수 있으면 그걸로 돼.', r: 'neo:smile' },
    { s: 'yeoni', t: '…그 말, 장부 맨 앞장에 적어 둔다. 지우기 없기.', l: 'yeoni:smile' },
    GROWTH,
  ],
  18: [
    { chapter: ['2년차 9월', '보름달과 6%'], bg: 'atelier_dark', l: 'yeoni:normal', c: 'cheongtokki:normal', r: 'neo:normal' },
    { s: 'nar', t: '보름달이 뜬 밤, 청토끼는 마지막 인상 안내문을 카운터 위에 반듯하게 펼쳤다.' },
    { s: 'rab', t: '어머~ 이번이 마지막 인상이에요. 월 6%, 계산은 언제나 정확하답니다~', c: 'cheongtokki:smile' },
    { s: 'sys', t: '[ 청토끼 금융 · 인수 빚 월 이자 5% → 6%(임시) · 남은 기간에는 더 오르지 않습니다 ]' },
    { s: 'yeoni', t: '마지막이라는 말, 이번엔 계약서에도 적혀 있지?', l: 'yeoni:determined' },
    { s: 'rab', t: '물론이죠~ 이번엔 큰 글씨로 적어 드렸답니다.', c: 'cheongtokki:smug' },
    { s: 'nar', t: '네오가 연이 옆에 나란히 서서, 펼쳐진 장부 끝을 손끝으로 눌러 주었다.' },
    { s: 'neo', t: '여기까지 같이 왔잖아. 남은 숫자도 같이 줄이자.', r: 'neo:smile' },
    { s: 'yeoni', t: '(위기 별 다섯 개. 그런데 이상하게, 오늘은 하나도 안 무섭다.)', l: 'yeoni:smile' },
    GROWTH,
  ],
});

// ── 6-1 청토끼 독촉 장면(warn·ultimatum·relief:<달>). 하순 마감 기록(ledger.creditor)의 숫자로 짧게 만든다.
const monthLabel = m => `${1 + Math.floor(m / 12)}년차 ${(m + 2) % 12 + 1}월`;
const gold = n => `${Math.floor(n).toLocaleString('ko-KR')}G`;
const SET = { l: 'yeoni:normal', c: 'cheongtokki:normal', r: 'neo:normal' };

export const CREDITOR_STORIES = Object.freeze({
  warn: (m, rec) => [
    { chapter: [monthLabel(m), '어머~ 하늘색 독촉장'], bg: 'atelier_dark', ...SET },
    { s: 'nar', t: '하순 마감 뒤, 계산대 위에 하늘색 봉투 하나가 반듯하게 놓여 있었다.' },
    { s: 'rab', t: '어머~ 이번 달 장부가 조금 아쉽네요. 오늘은 안내만 드리고 갈게요~', c: 'cheongtokki:smile' },
    { s: 'sys', t: rec?.milestone === false ? '[ 청토끼 경고 1회 · 약속한 누적 상환에 못 미쳤어요 · 다음 하순에도 그대로면 통첩이 옵니다 ]' : '[ 청토끼 경고 1회 · 이번 달 상환이 빚에 붙은 이자보다 적었어요 · 다음 하순에도 그대로면 통첩이 옵니다 ]' },
    { s: 'yeoni', t: '(봉투는 얇은데 무게는 별 다섯 개.) 다음 달엔 숫자로 보여 줄게.', l: 'yeoni:determined' },
    { s: 'neo', t: '손님은 내가 더 붙잡을게. 연이는 장부만 지켜.', r: 'neo:serious' },
  ],
  ultimatum: (m, rec) => [
    { chapter: [monthLabel(m), '붉은 밀랍의 통첩'], bg: 'atelier_dark', ...SET },
    { s: 'nar', t: '이번 봉투는 붉은 밀랍으로 봉해져 있었다. 청토끼는 웃는 얼굴 그대로 도장을 눌렀다.' },
    { s: 'rab', t: '어머~ 두 달 연속이네요. 이번엔 정식 통첩이랍니다~', c: 'cheongtokki:smug' },
    { s: 'sys', t: `[ 청토끼 통첩 · ${monthLabel(rec?.dueMonth ?? m + 3)} 하순 마감까지 ${gold(rec?.need || 0)} 더 갚기 · 못 지키면 가게를 내줘야 합니다 ]` },
    { s: 'luna', t: '가게를 내준다고? 연이 언니, 우리 어디 가?', c: 'luna:cry' },
    { s: 'yeoni', t: '아무 데도 안 가. 기한 안에 갚으면 되는 거잖아.', l: 'yeoni:determined' },
    { s: 'rab', t: '저는 최약체랍니다~ 약속만 지켜 주시면 아무 일도 없어요.', c: 'cheongtokki:smile' },
    { s: 'nar', t: '네오가 연이 곁으로 다가가, 떨리는 장부 끝을 함께 붙잡았다.', r: 'neo:serious' },
    { s: 'neo', t: '석 달이면 할 수 있어. 같이 갚자, 연이.' },
  ],
  relief: m => [
    { chapter: [monthLabel(m), '거둬 간 통첩'], bg: 'atelier_lit', ...SET },
    { s: 'rab', t: '어머~ 약속한 금액이 정확히 들어왔네요. 통첩은 오늘로 거둬 갈게요~', c: 'cheongtokki:smile' },
    { s: 'sys', t: '[ 청토끼 통첩 해제 · 경고가 0회로 돌아갑니다 ]' },
    { s: 'yeoni', t: '(정확히 들어온 건 내 계산이 정확해서야. 별 다섯 개, 나한테.)', l: 'yeoni:smile' },
    { s: 'neo', t: '수고했어, 연이. 오늘 차는 내가 낼게.', r: 'neo:smile' },
  ],
});

// warn:5 → 장면 박자. rec 는 ledger.creditor 기록(없으면 기본 문구)
export function creditorStory(id, ledger) {
  const [kind, m] = id.split(':');
  const make = CREDITOR_STORIES[kind];
  return make ? make(Number(m), ledger?.creditor?.[`m${m}`]) : null;
}
