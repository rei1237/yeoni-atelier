export function huntAssets(hunterId, enemies) {
 const player = hunterId === 'seohanbi' ? ['actors/seohanbi_tiger'] : hunterId === 'yeoni_pig' ? ['ui/kfp_player'] : ['actors/neo_cat','actors/neo_cat_attack','actors/neo_cat_cast'];
 return [...Object.keys(enemies).map(id=>'enemies/'+id),...player];
}
