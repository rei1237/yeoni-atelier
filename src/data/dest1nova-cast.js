import { DEST1NOVA_MEMBERS } from './dest1nova-profiles.js';
const STORIES = {
  solv: { title: '8월 · 멈추는 박자', lines: ['솔브: 무대가 작네. 세 걸음이면 끝이야.', '연이: 네 걸음째엔 손님 차가 있어. 오늘은 멈추는 것도 안무야.', '솔브: 좋아. 그럼 세 걸음 안에서 제대로 보여 줄게.'], follow: ['솔브: 느리게 추니까 뒤에서 누가 따라오는지 보이더라.', '연이: 루나도 네 박자에 맞춰 접시를 내려놨어.', '솔브: 다음엔 같이 해 보자. 속도는 내가 맞출게.'] },
  bambi: { title: '10월 · 첫 소절의 주인', lines: ['밤비: 오늘은 누가 먼저 불러? 나는 뒤에서 맞출게.', '연이: 네 목소리 듣고 싶다는 쪽지가 왔어. 첫 소절 맡아 줄래?', '밤비: …응. 오늘은 내가 먼저 시작해 볼게.'], follow: ['밤비: 내 목소리가 너무 크게 들리지 않았어?', '연이: 끝자리 손님도 조용히 듣더라. 딱 좋았어.', '밤비: 다음 곡도 불러도 되지? 이번엔 내가 고를게.'] },
  lune: { title: '11월 · 불이 꺼져도', lines: ['루네: 리본은 세 가지 색, 별은 일곱 개! 아니, 아홉 개가 좋을까?', '연이: 우선 노래부터 들려줘. 별은 손님 눈에서도 반짝이거든.', '루네: 그 말 좋다. 오늘 무대 제목으로 써도 돼?'], follow: ['루네: 조명이 잠깐 꺼졌는데 다들 같이 불러 줬어.', '연이: 리본보다 그 순간을 오래 기억할 것 같아.', '루네: 다음엔 꾸미지 않은 한 소절도 남겨 둘래.'] },
  raven: { title: '12월 · 지우지 않은 한 줄', lines: ['레이븐: 아직 가사가 덜 끝났어. 오늘 무대는 빼도 돼.', '연이: 끝나지 않은 이야기도 듣는 사람은 있어. 마감 뒤에 읽어 줘.', '레이븐: …그럼 한 줄만. 고치기 전의 말로.'], follow: ['레이븐: 어제 읽은 부분, 지우지 않기로 했어.', '연이: 다들 다음 줄을 기다리더라.', '레이븐: 혼자 끝내야 하는 줄 알았는데, 빈칸도 괜찮네.'] },
};
export const DEST1NOVA_CAST = Object.freeze(DEST1NOVA_MEMBERS.filter(p => p.id !== 'neo').map(p => ({
  ...p, profile: p.personality, specialty: `${p.position} · ${p.charm}`, role: 'host', canHost: true, canServe: false, temp: true,
  condition: { shiftsCompleted: 0, repaidAtLeast: 0, month: p.month },
  meetEvent: { title: STORIES[p.id].title, lines: STORIES[p.id].lines },
  followup: { title: `${p.name} · 무대 다음 날`, lines: STORIES[p.id].follow }, reward: {},
})));
