import {branchLock} from '../game/branches.js';
export const NOTEBOOK=[['오늘',[['fortune','달빛 운세 수첩','오늘의 타로·일진·띠·별자리','skills/tarot',s=>!s.ledger.story['ev:fortune']&&'두 번째 영업을 마치면 열려요'],['quests','퀘스트','연이와 오늘의 목표','services/quests']]],
 ['카페 운영',[['staffing','직원 배치','영입 동료 배치','badges/luna'],['branches','지점 관리','본점에서 5호점까지','ui/town-node-expand',s=>branchLock(s)&&'지점 이야기 뒤에 열려요'],['debt','장부와 상환','빚과 이번 달 계획','ui/debt_ledger']]],
 ['친구와 놀이',[['companions','동료와 인연','친구들의 이야기','ui/heart-full'],['outfits','드레스룸','오늘의 옷 고르기','icons/fluff_cape'],['gameroom','게임방','연이·네오 미니게임','ui/game_room']]],
 ['설정',[['audio','달빛 음악실','음악과 효과음','objects/record_player'],['tutorial','튜토리얼','기능 안내 다시 보기','objects/bookshelf'],['more','기타','저장과 그 밖의 설정','services/more']]]];
