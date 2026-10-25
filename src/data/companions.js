// 동료(데스티노바 멤버)와 가게 일손 데이터.
// 1단계 일반 플레이의 공식 접대 동료는 네오 한 명이다.
// 다른 멤버의 이름·외형·성격·능력치는 프로젝트에 확정 자료가 없으므로 만들지 않는다.
// 영입 엔진은 아래 RECRUITABLE 목록을 읽는다. 공식 자료가 생기면 여기에 추가한다.
// 루나·루나 언니는 원작 재성의 섬 인물이고, 빚을 진 당사자라 처음부터 일한다(일하는 설정은 게임 오리지널).
// work: cashier(계산만) / baker(굽기, 운반 안 함) / runner(서빙·정리). 접대(canHost)는 하지 않는다.

import { NEO_STATS } from '../config/rules.js';
import { MONTHLY_CAST } from './monthly-cast.js';

export const PEOPLE = Object.freeze({
  yeoni: { id: 'yeoni', name: '연이', role: 'owner', work: 'cashier', color: '#f2a1b3', canServe: false, canHost: false },
  neo: {
    id: 'neo', name: '네오', role: 'host', color: '#5b6fb0', canServe: false, canHost: true,
    stats: NEO_STATS,
    forms: { human: { name: '네오', color: '#5b6fb0' }, cat: { name: '영냥이', color: '#3b3f57' } },
  },
  luna_sis: { id: 'luna_sis', name: '루나 언니', role: 'crew', work: 'baker', color: '#f0b0c0', canServe: false, canHost: false },
  luna: { id: 'luna', name: '루나', role: 'crew', work: 'runner', color: '#f4b8c8', canServe: true, canHost: false },
});

// 영업마다 함께 출근하는 일손(로스터·접대 명단과 별개)
export const STAFF_CREW = Object.freeze(['luna_sis', 'luna']);

// 공식 영입 대상 목록(현재 비어 있음). 항목 형식:
// { id, name, stats:{empathy,talk,fun,looks}, color, condition:{shiftsCompleted, repaidAtLeast}, meetEvent:{title, lines[]}, reward:{gold?, items?} }
export const RECRUITABLE = MONTHLY_CAST;

// 컬렉션 화면에 보일 잠금 칸 수(내용 없음)
export const LOCKED_SLOT_COUNT = 1;
