// 원작 능력치 계산의 순수 어댑터. 직업 테크·상점 전설 장비는 카페에 이식하지 않는다.
import {WEAPONS,tierPower,CANNON_IMPACT_MULTIPLIER,CANNON_STRAIGHT_POWER,cannonLaneRatio,cannonLaneStack} from '../data/kfp-weapons.js';
import {CANNON_RAY_LIMIT,cannonFocusMultiplier} from './kfp-cannon-targeting.js';
const isCannonBeam=id=>['cannon','lotus_bloom','ember_lance','absolute_bloom'].includes(id);
const INHERITED_DAMAGE_CAP = Object.freeze({ cannon: 800, sword: 1000 });
// 레벨·진화·패시브를 반영한 최종 수치
export function kfpWeaponStats(w, ps) {
    const def = WEAPONS[w.id];
    const b = def.base;
    const acc = { dmg: 0, cd: 0, amount: 0, area: 0, duration: 0, speed: 0, pierce: 0, slow: 0, crit: 0, critBonus: 0, length: 0, width: 0, regrow: 0 };
    for (let i = 0; i < Math.min(8, Math.max(1, w.level)) - 1; i++) {
        const l = def.levels[i];
        for (const k in acc) if (l[k]) acc[k] += l[k];
    }
    const ev = w.evolved && def.evolve ? def.evolve.mods : {};
    const result = {
        dmg: (b.dmg + acc.dmg) * (ev.dmg || 1) * (w.evolved ? 1.35 : 1) * ps.might,
        cd: b.cd * Math.max(0.25, 1 + acc.cd) * (ev.cd || 1) * ps.cooldown,
        amount: Math.max(1, Math.round((b.amount + acc.amount + (ps.amount || 0)) * (ev.amount || 1))),
        area: (1 + acc.area) * (ev.area || 1) * ps.area,
        duration: b.duration * (1 + acc.duration) * (ev.duration || 1) * ps.duration,
        speed: b.speed * (1 + acc.speed) * ps.projSpeed,
        pierce: (b.pierce || 0) + acc.pierce + (ev.pierce || 0) + (b.pierce ? ps.pierce || 0 : 0),
        slow: Math.min(0.85, (b.slow || 0) + acc.slow + (ev.slow || 0)),
        // 무기 고유 치명타: 확률(crit)과 치명타 피해 배율 가산(critBonus, 기본 3배에 더함)
        crit: (b.crit || 0) + acc.crit + (ev.crit || 0), critBonus: (b.critBonus || 0) + acc.critBonus + (ev.critBonus || 0),
        execute: Math.max(ev.execute || 0, b.execute || 0), bleed: Math.max(ev.bleed || 0, b.bleed || 0),
        lifesteal: ev.lifesteal || 0, permanent: !!ev.permanent, trail: !!ev.trail, follow: !!ev.follow,
        spread: b.spread || 0, radius: b.radius || 0, tick: b.tick || 0.3, hitCd: b.hitCd || 0.3,
        length: ((b.length || 0) + acc.length) * ps.projSpeed, width: (b.width || 0) + acc.width,
        bonusAmount: (ps.amount || 0) + Math.round(4 * (ps.amountMul || 0)), durationScale: ps.duration,
    };
    // 탄창 확장(비례): 투사체 수 × (1+보너스). 정수로 늘리지 못한 나머지는 피해 배율로 환산
    if (ps.amountMul) {
        const total = result.amount * (1 + ps.amountMul), n = Math.max(result.amount, Math.floor(total + 1e-9));
        if (!isCannonBeam(w.id)) result.dmg *= total / n;
        result.amount = n;
    }
    // The three-beam limit applies after every source of extra projectiles.
    // No removed or fractional ray is converted into hidden damage.
    if (isCannonBeam(w.id)) {
        result.amount = Math.min(CANNON_RAY_LIMIT, result.amount);
        result.cd = Math.max(0.3, result.cd);
    }
    if (w.sourceId) {
        // Cannon's focused Lv8 base is 4/3 of its former curve; scale only this core's
        // cap proportionally so ordinary might upgrades retain their headroom.
        const absolute = WEAPONS[w.sourceId]?.tier === 'absolute';
        // Absolute Bloom deliberately trades some inherited power/cadence and
        // lifesteal for its three-core composition; other owners are unchanged.
        const restrainedBloom = w.sourceId === 'absolute_bloom';
        // 계승 코어 배율 하향 (최종 무기 하향 조정): 일반 1.35→1.15, 절대 1.65→1.35, 대포 1.95→1.5, 절대 만개 1.6/1.4→1.3/1.15
        const sourcePower = restrainedBloom ? (w.id === 'cannon' ? 1.30 : 1.15) :
            absolute ? (w.id === 'cannon' ? 1.50 : 1.35) : 1.15;
        const sourceGrowth = restrainedBloom ? .05 : .08;
        result.dmg = Math.min(INHERITED_DAMAGE_CAP[w.id] || 600, result.dmg * (sourcePower + sourceGrowth * (Math.min(8, Math.max(1, w.fusionLevel || 1)) - 1)));
        if (restrainedBloom) { result.cd *= 1.15; result.lifesteal *= .5; }
        result.amount = Math.min(20, result.amount); result.area = Math.min(3, result.area);
        result.duration = Math.min(14, result.duration); result.cd = Math.max(0.2, result.cd);
    }
    if (def.fusionOnly) {
        result.dmg = Math.min(def.dmgCap || (def.tier === 'absolute' ? 420 : 220), result.dmg * (1 + 0.08 * (Math.min(8, Math.max(1, w.level)) - 1))); result.cd = Math.max(0.5, result.cd);
        result.amount = Math.min(def.amountCap || (w.id === 'lotus_bloom' ? 3 : w.id === 'plague_fire' ? 5 : 12), result.amount);
        result.area = Math.min(2, result.area); result.duration = Math.min(['lotus_bloom', 'ember_lance', 'absolute_bloom'].includes(w.id) ? 0.7 : 6, result.duration);
        result.pierce = Math.min(12, result.pierce); result.slow = Math.min(0.65, result.slow);
    }
    // 등급 보정: 상위 등급 무기가 하위 등급보다 약해지지 않도록. 피해 상한(220/420/600)은 보정 전 값에 적용된다.
    result.dmg *= tierPower(w);
    // Beam-only: do not double a mixed weapon's orbit, fire field or lifesteal.
    // Derived once after all stat multipliers/caps; inherited cores use this
    // same path without multiplying their owner's already-derived value.
    if (isCannonBeam(w.id)) {
        result.beamDamage = result.dmg * CANNON_IMPACT_MULTIPLIER * CANNON_STRAIGHT_POWER;
        result.focusBeamDamage = result.beamDamage;
        // One straight lane: all rays overlap, so a target on it takes the stacked lane.
        result.beamAutoImpact = result.beamDamage * cannonLaneRatio(w.id, w.level) * cannonLaneStack(result.amount);
        result.beamFocusedImpact = result.focusBeamDamage * cannonFocusMultiplier(result.amount);
    }
    if (w.id === 'thorns') {
        // result.cd already includes player and tech cooldown exactly once.
        result.regrow = Math.max(.35, ((b.regrow || 1.8) + acc.regrow) * (ev.regrow || 1) * result.cd / b.cd);
        result.cd = result.regrow;
        result.permanent = true;
        result.duration = 0; // charges expire on contact, never as an all-petal activation
    }
    result.executeChance = 0;
    return result;
}
