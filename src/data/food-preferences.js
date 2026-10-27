// 기존 물건 선물은 그대로. 아래 음식 취향은 세계관에 근거한 게임 외전 설정이다.
export const FOOD_PREFERENCES={
 neo:{favorite:['lucky_sand'],liked:['americano','moon_rice_bowl'],reason:'원정 도시락과 차분하게 준비하는 성격',line:'든든하게 준비했네. 도시락 평가는 별 다섯이야.'},
 luna:{favorite:['moon_pudding'],liked:['flower_cookie','fortune_latte'],reason:'밝은 성격과 작은 칭찬을 좋아하는 홀 담당',line:'연이 언니, 나한테 주는 거야? 오늘은 기뻐서 울 것 같아!'},
 luna_sis:{favorite:['starlight_tea'],liked:['moon_milk_tea','golden_pumpkin_soup'],reason:'기존 꿀 허브티 선물과 오븐 앞에서의 휴식',line:'제 몫도 챙겨 주셨네요. 따뜻할 때 함께 쉬어요, 괜찮아요.'},
 moka:{favorite:['fortune_latte'],liked:['americano','lotus_berry_tart'],reason:'기존 라테 평가 대사와 요리사의 향미 관심',line:'향부터 좋네. 오늘은 별 다섯 줄게.'},
 yun:{favorite:['starlight_tea'],liked:['americano','flower_cookie'],reason:'늘 마시던 차와 꼼꼼한 작업 사이의 휴식',line:'도구를 내려놓고 마실 때가 됐구나. 고마워.'},
 seohanbi:{favorite:['white_lotus_healing','starlight_tea'],liked:['moon_milk_tea'],reason:'기존 찻잔 선물과 서두르지 않는 환대',line:'차가 식기 전에 함께 쉬시겠어요? 마음까지 따뜻하네요.'},
 museong:{favorite:['americano'],liked:['lucky_sand','starlight_tea'],reason:'휴식도 근무표에 적는 절제와 정확한 마감',line:'휴식 시간을 지킬 이유가 생겼군. 같이 앉아라.'},
 solv:{favorite:['lucky_sand'],liked:['moon_rice_bowl','fortune_latte'],reason:'활동적인 걸음과 팀 동선에 관심',line:'먹고 나면 발걸음도 가벼워질 것 같아. 같이 쉬자.'},
 bambi:{favorite:['moon_milk_tea'],liked:['moon_pudding','golden_pumpkin_soup'],reason:'따뜻한 목도리와 다정한 쉼의 대사',line:'잔을 잡고 있으니 마음이 편해져. 고마워.'},
 lune:{favorite:['flower_cookie'],liked:['lotus_berry_tart','fortune_latte'],reason:'꽃 장식과 작은 꾸밈을 좋아하는 무대 감각',line:'꽃 모양까지 예쁘다! 잠깐 눈으로도 먹을래.'},
 raven:{favorite:['americano'],liked:['night_dew_latte','starlight_tea'],reason:'가사 노트와 새벽의 문장을 쓰는 습관',line:'다음 문장을 쓰기 전에 한 모금. 오늘 이야기도 남겨 둘게.'}
};
export function foodPreference(id,menuId){const p=FOOD_PREFERENCES[id],rank=p?.favorite.includes(menuId)?'favorite':p?.liked.includes(menuId)?'liked':'normal';return {rank,label:{favorite:'특히 좋아함',liked:'좋아함',normal:'보통'}[rank],gain:{favorite:14,liked:10,normal:6}[rank],reason:p?.reason||'',line:rank==='normal'?(['luna_sis','seohanbi'].includes(id)?'챙겨 주셔서 고마워요. 잠깐 쉬면서 먹을게요.':'챙겨 준 마음, 고맙게 받을게.'):p?.line||'고마워.'};}
