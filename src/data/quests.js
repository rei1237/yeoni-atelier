// 데이터 기반 퀘스트. 진행은 state.stats 카운터를 읽어 판정한다.
// reward: { gold?, items?: {ingredientId: n}, learn?: menuId }  — 보상은 questId 로 1회만 지급한다.

export const QUESTS = Object.freeze([
  { id: 'q_first_serve', title: '첫 서빙', desc: '손님에게 음식을 한 번 서빙하기', stat: 'served', goal: 1, reward: { gold: 200 } },
  { id: 'q_first_shift', title: '첫 영업', desc: '정규 영업을 한 번 마치기', stat: 'shiftsCompleted', goal: 1, reward: { gold: 300 } },
  { id: 'q_first_repay', title: '첫 상환', desc: '빚을 한 번 갚기', stat: 'repayCount', goal: 1, reward: { items: { milk: 5, bean: 5 } } },
  { id: 'q_special_ingredient', title: '특별 재료', desc: '마을 모카 식재료점에서 밤이슬 구하기', stat: 'nightDewObtained', goal: 1, reward: { learn: 'night_dew_latte' } },
  { id: 'q_first_moonstone', title: '첫 월정석', desc: '영냥이 월정석 사냥으로 월정석 10개 모으기', stat: 'moonstonesObtained', goal: 10, reward: { gold: 300 } },
  { id: 'q_first_exchange', title: '루나의 저울', desc: '루나의 저울에서 월정석 환전하기', stat: 'moonstonesExchanged', goal: 1, reward: { items: { sugar: 5, flour: 5 } } },
  { id: 'q_expand', title: '가게 확장', desc: '마을에서 테이블 세트를 하나 더 들이기', stat: 'expansions', goal: 1, reward: { gold: 800 } },
  { id: 'q_special_menu', title: '특별 메뉴', desc: '밤이슬 라테를 한 번 서빙하기', stat: 'servedSpecial', goal: 1, reward: { gold: 500 }, requires: 'q_special_ingredient' },
  { id: 'q_new_companion', title: '새로운 인연', desc: '퀘스트·이벤트로 새 동료 만나기', stat: 'recruited', goal: 1, reward: { gold: 500 }, hiddenUntilRecruitable: true },
]);
