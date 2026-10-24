// ⚠ 개발 전용 임시 동료 데이터. 정식 데스티노바 멤버가 아니다.
// 영입 엔진(잠금 → 이벤트 → 보상 1회 → 명단 추가 → 다음 영업 사용 → 저장 유지)을 검증하려고만 쓴다.
// 개발 모드(?dev=1)와 테스트에서만 불러오고, 개발 모드는 별도 저장 키를 쓴다.
// 이름·색·능력치는 의미 없는 자리표시값이다.

export const DEV_RECRUITABLE = Object.freeze([
  {
    id: 'dev_temp_01',
    name: 'DEV 임시 동료 01',
    devOnly: true,
    color: '#9a9a9a',
    stats: { empathy: 5, talk: 5, fun: 9, looks: 5 },
    condition: { shiftsCompleted: 2, repaidAtLeast: 1 },
    meetEvent: {
      title: '[개발용] 만남 이벤트 자리표시',
      lines: ['(개발용 자리표시 대사입니다. 정식 이야기가 아닙니다.)', '영입 흐름 검증용 이벤트를 완료합니다.'],
    },
    reward: { gold: 300 },
  },
]);
