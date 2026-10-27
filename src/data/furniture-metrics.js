// TEMP: 면적 보너스는 추가 칸마다 15%, 최대 50%. 실제 점유 셀을 기준으로 한다.
export const FURNITURE_SCORE_TEMP=Object.freeze({perExtraCell:.15,maxBonus:.5});
export function furnitureMetrics(def){
 const cells=def.cells,area=new Set(cells.map(c=>c.dx+','+c.dy)).size;
 const width=Math.max(...cells.map(c=>c.dx))-Math.min(...cells.map(c=>c.dx))+1,height=Math.max(...cells.map(c=>c.dy))-Math.min(...cells.map(c=>c.dy))+1;
 const base=def.baseAmbience??(def.ambience>0?({명품:4,고급:3}[def.grade]||2):0),baseScore=base*area;
 const largeBonus=Math.ceil(baseScore*Math.min(FURNITURE_SCORE_TEMP.maxBonus,FURNITURE_SCORE_TEMP.perExtraCell*(area-1)));
 return {width,height,area,baseAmbience:base,baseScore,largeBonus,ambience:baseScore+largeBonus,layer:cells.every(c=>c.kind==='floor')?'floor':'solid'};
}
