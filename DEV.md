
## 농장 명령
state.farm: xp, seed, greenhouse, lastAdvancedDay, harvests, plots. 작물 인스턴스 id로 `ledger.rewards['farm:<id>']`에 수확 재료/수량/XP를 기록한다. 오래된 저장은 빈 4밭을 추가하며 이전 날짜 성장·보상을 소급하지 않는다.
`farm.plant {cropId,index}`, `farm.water {index}`, `farm.tend {index}`, `farm.careAll`, `farm.harvest {index,cropInstanceId}`, `farm.expand`, `farm.greenhouse` — 전부 준비 중에만 dispatch. 수확은 stock과 learned를 갱신하므로 실제 조리에 사용된다. `advanceFarm`은 결산 후 달력 진행에서 한 번 호출한다.
