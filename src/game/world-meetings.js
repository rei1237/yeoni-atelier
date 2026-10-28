import {DEST1NOVA_MEMBERS} from '../data/dest1nova-profiles.js';
import {recruitView} from './economy.js';
// 네오는 시작 동료이므로 첫 초대장 해금으로 세지 않는다. 기존 만남 조건만 읽는다.
export function worldMeetingAccess(s){
 if(!s.hostbar?.open)return {unlocked:false,available:[],joined:false,hint:'5월 호스트 개업 이야기를 먼저 만나 주세요'};
 const ids=DEST1NOVA_MEMBERS.filter(x=>x.id!=='neo').map(x=>x.id),rows=recruitView(s).filter(x=>ids.includes(x.id));
 const available=rows.filter(x=>x.status==='available'),joined=ids.some(id=>!!s.roster[id]);
 const next=rows.find(x=>x.status!=='recruited'),c=next?.condition;
 return {unlocked:joined||available.length>0,available,joined,hint:c?`${c.year}년차 ${c.month}월 · 네오 인연 ${c.neoAffinity}에서 초대장이 열려요`:'새로운 초대장을 기다려요'};
}
