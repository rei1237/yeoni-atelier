// 동료(데스티노바 멤버) 데이터.
// 1단계 일반 플레이의 공식 데이터는 네오 한 명이다.
// 다른 멤버의 이름·외형·성격·능력치는 프로젝트에 확정 자료가 없으므로 만들지 않는다.
// 영입 엔진은 아래 RECRUITABLE 목록을 읽는다. 공식 자료가 생기면 여기에 추가한다.

import { NEO_STATS } from '../config/rules.js';

export const PEOPLE = Object.freeze({
  yeoni: { id: 'yeoni', name: '연이', role: 'owner', color: '#f2a1b3', canServe: true, canHost: false },
  neo: {
    id: 'neo', name: '네오', role: 'host', color: '#5b6fb0', canServe: true, canHost: true,
    stats: NEO_STATS,
    forms: { human: { name: '네오', color: '#5b6fb0' }, cat: { name: '영냥이', color: '#3b3f57' } },
  },
});

// 공식 영입 대상 목록(현재 비어 있음). 항목 형식:
// { id, name, stats:{empathy,talk,fun,looks}, color, condition:{shiftsCompleted, repaidAtLeast}, meetEvent:{title, lines[]}, reward:{gold?, items?} }
export const RECRUITABLE = Object.freeze([]);

// 컬렉션 화면에 보일 잠금 칸 수(내용 없음)
export const LOCKED_SLOT_COUNT = 1;
