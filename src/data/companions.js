// 동료(데스티노바 멤버)와 가게 일손 데이터.
// 1단계 일반 플레이의 공식 접대 동료는 네오 한 명이다.
// 2026-10-25 사용자 요청: 일러스트 이름에 근거한 새 멤버 프로필과 외전 능력치를 추가한다.
// 영입 엔진은 아래 RECRUITABLE 목록을 읽는다. 공식 자료가 생기면 여기에 추가한다.
// 루나·루나 언니는 원작 재성의 섬 인물이고, 빚을 진 당사자라 처음부터 일한다(일하는 설정은 게임 오리지널).
// work: cashier(계산만) / baker(굽기, 운반 안 함) / runner(서빙·정리). 접대(canHost)는 하지 않는다.

import { NEO_STATS } from '../config/rules.js';
import { MONTHLY_CAST } from './monthly-cast.js';
import { DEST1NOVA_CAST } from './dest1nova-cast.js';
import { DEST1NOVA_MEMBERS } from './dest1nova-profiles.js';

export const PEOPLE = Object.freeze({
  yeoni: { id: 'yeoni', name: '연이', role: 'owner', work: 'cashier', color: '#f2a1b3', canServe: false, canHost: false },
  neo: {
    id: 'neo', name: '네오', role: 'host', color: '#5b6fb0', canServe: false, canHost: true,
    stats: NEO_STATS,
    profile: DEST1NOVA_MEMBERS[0].personality,
    specialty: '대화·외모 중심 손님',
    forms: { human: { name: '네오', color: '#5b6fb0' }, cat: { name: '영냥이', color: '#3b3f57' } },
  },
  luna_sis: { id: 'luna_sis', name: '루나 언니', role: 'crew', work: 'baker', color: '#f0b0c0', canServe: false, canHost: false },
  luna: { id: 'luna', name: '루나', role: 'crew', work: 'runner', color: '#f4b8c8', canServe: true, canHost: false },
});

// 영업마다 함께 출근하는 일손(로스터·접대 명단과 별개)
export const STAFF_CREW = Object.freeze(['luna_sis', 'luna']);

// 사용자 승인한 월별 영입 대상. 모두 게임 오리지널 임시 능력치. 항목 형식:
// { id, name, stats:{empathy,talk,fun,looks}, color, condition:{shiftsCompleted, repaidAtLeast}, meetEvent:{title, lines[]}, reward:{gold?, items?} }
export const RECRUITABLE = Object.freeze([...MONTHLY_CAST, ...DEST1NOVA_CAST, {
 id:'cheongtokki', name:'청토끼', role:'host', canHost:true, canServe:false, color:'#7199d2',
 stats:{empathy:4,talk:10,fun:7,looks:2},
 profile:'빚을 지게 한 청토끼 금융의 주인. 장부가 뒤집힌 뒤에는 돈 많은 쪽을 주인님이라 부르며 출근한다.',
 specialty:'담당 접대의 주문 매출·팁 +35% · 외모보다 화술',
 condition:{shiftsCompleted:0,repaidAtLeast:0,debtFree:true,wealth:1000000},
 meetEvent:{title:'장부의 주인이 바뀐 날',lines:['청토끼: 빚은 완납, 보유금은 백만 골드… 돈 많은 쪽이 주인님이지!','연이: 그럼 계약서부터 읽어. 손님에게 숨겨진 비용을 붙이는 건 금지야.','청토끼: 정직한 설명으로 더 주문하게 만들면 되잖아. 내 화술을 보여 주지!','네오: 외상 장부는 맡기지 마. 접대 기록은 내가 확인한다.']},
 followup:{title:'주문서 뒤의 작은 글씨',lines:['청토끼: 오늘은 설명을 듣고 손님이 디저트를 하나 더 주문했어.','연이: 억지로 권하지 않은 거지?','청토끼: 물론이지, 주인님. 다시 올 손님이 가장 큰 재산이니까.']}, reward:{},
}]);

// 컬렉션 화면에 보일 잠금 칸 수(내용 없음)
export const LOCKED_SLOT_COUNT = 0;
