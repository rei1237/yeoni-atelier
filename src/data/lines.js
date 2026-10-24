// 짧은 대사. 기획서 p.21의 개그 대사를 쓴다. 대사는 규칙과 능력치를 바꾸지 않는다.

export const GAG_HOSTBAR = Object.freeze([
  { who: '손님', text: '여기 호스트바 아니에요?' },
  { who: '연이', text: '카페예요. 커피가 먼저 나오잖아요.' },
]);

export const GAG_NEO_FUN = Object.freeze([
  { who: '연이', text: '네오야, 손님 좀 웃겨봐.' },
  { who: '네오', text: '웃음은 스트레스 반응을 완화하는 데 도움이 됩니다.' },
  { who: '연이', text: '설명 말고 실행을 해.' },
]);

export const HELP_KINDS = Object.freeze({
  topic: { id: 'topic', label: '대화 주제 고르기' },
  listen: { id: 'listen', label: '이야기 들어주기' },
  photo: { id: 'photo', label: '사진 요청', special: true },
});

// 주제 고르기 선택지: 손님의 가장 높은 선호와 맞으면 '좋음'
export const TOPICS = Object.freeze({
  empathy: '요즘 고민 이야기',
  talk: '재치 있는 말장난',
  fun: '웃긴 에피소드',
  looks: '오늘의 코디 이야기',
});
