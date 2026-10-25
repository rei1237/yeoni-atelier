// 게임 오리지널 외전. 이야기 데이터는 상태를 바꾸지 않고 story.seen 명령만 해금을 담당한다.
export const EVENT_STORIES = Object.freeze({
  'ev:hunt': [
    { chapter: ['3월 · 첫 출발', '가치 있는 돌과 직원 복지'], bg: 'atelier_dark', l: 'yeoni:sulky', c: 'neo:normal', r: null },
    { s: 'yeoni', t: '한 순에 삼천 골드라니… 어떻게든 돈을 벌어야 해!', fx:'ledger' },
    { s: 'neo', t: '강 건너 달그늘에는 검은 손들이 있어. 쓰러지면 월정석을 떨어뜨리는데, 이게 꽤 가치가 있어!', c: 'neo:smile' },
    { s: 'luna_sis', t: '월정석이면 저울에 달아서 골드로 바꿔 드릴 수 있어요. 무게는 정직하게 잴게요.', r: 'luna_sis:normal' },
    { s: 'luna', t: '저울은 내가 볼래! 하나, 둘, 많다!', r: 'luna:smile' },
    { s: 'yeoni', t: '…네오. 방금 꽤 가치가 있다고 했지?', l: 'yeoni:determined', fx: 'glow' },
    { s: 'neo', t: '어, 응… 근데 거긴 밤이고, 검은 손이 꽤 많—', c: 'neo:flustered' },
    { s: 'nar', t: '연이가 도시락 봉투를 쥐여 주며 네오의 등을 문 쪽으로 살짝 밀었다.', fx: 'shake' },
    { s: 'yeoni', t: '(직원 복지 별 하나. 대신 도시락은 별 다섯.)', l: 'yeoni:smile' },
    { s: 'neo', t: '…알았어. 대신 이 모습으로는 못 싸워.', c: 'neo:serious' },
    { s: 'nar', t: '초승달의 금빛이 네오를 감쌌다. 빛이 가라앉자 남색 마법모자를 쓴 흰 고양이가 발을 내디뎠다.', c: 'neo_cat:normal', fx: 'transform' },
    { s: 'neo_cat', t: '다녀오겠다.' },
    { s: 'yeoni', t: '도시락은 네 거야! 월정석만 잘 챙겨 와!', l: 'yeoni:smile' },
    { s: 'sys', t: '[ 영업 준비 → 마을 → 달그늘 사냥터. 행동력 1로 3분 동안 사냥하며 월정석은 루나의 저울에서 골드로 바꿉니다 ]' },
    { s: 'sys', t: '[ 네오는 사냥할 때만 영냥이로 변신합니다. 사냥 중에는 가게에 없고, 돌아오면 사람 모습으로 복귀합니다 ]' },
  ],
});
