(function (HO) {
  'use strict';
  const H = globalThis.Hsr98 = globalThis.Hsr98 || {};
  H.HD = H.HD || {};

  HO.TITLE = 'Star Rail Online';

  HO.TUN = {
    hz: 20,
    run: 6.5,
    back: 4.5,
    turn: 3.2,
    gravity: 22,
    jump: 8,
    radius: 0.4,
    height: 1.8,
    step: 0.4,
    drop: 0.45,
    maxFall: 40,
    voidY: -40,
    seats: 5
  };
  HO.DT = 1 / HO.TUN.hz;

  HO.CMB = {
    gcd: 1.5, melee: 2.6, facing: 0,
    swing: 2.8, swingK: 0.6, rangedSwing: 2, rangedK: 0.45, autoTough: 5,
    crit: 0.05, critD: 0.5, miss: 0.05, missPerLvl: 0.02, missMax: 0.25,
    foeRes: 0.2, unbroken: 0.9, brokenFor: 6, breakStun: 1.5, prepTough: 2,
    freeze: 3, imprison: 4, imprisonSlow: 0.3, bleedPct: 0.015, bleedFor: 6, burnM: 0.6,
    rageMax: 100, rageHit: 8, rageTaken: 50, rageDecay: 2, rageLow: 0.5, rageLowMul: 1.5,
    fiveSec: 5, powerRegen: 0.04,
    energyMax: 100, energyStart: 50, energyCast: 5, energyHit: 2, energyBreak: 10, energyKill: 10, ultLevel: 10,
    oocDelay: 5, hpRegen: 0.015, sitMul: 4, talentHeal: 1.5, talentHealBelow: 0.3,
    foeHp: 90, foeHpLvl: 24, foeAtk: 10, foeAtkLvl: 3, foeK: 0.35, foeSpeed: 4.2, evadeSpeed: 9,
    aggro: 10, aggroMin: 3, aggroMax: 18, social: 8, leash: 40, respawn: 90,
    threatMelee: 1.1, threatRanged: 1.3, healThreat: 0.5,
    dashSpeed: 25, dashFor: 1, foxDash: 8, releaseHp: 0.5, reviveRange: 12, groupRange: 40, talkRange: 4, useRange: 3.5
  };

  HO.XP_TO_NEXT = [400, 900, 1400, 2100, 2800, 3600, 4500, 5400, 6500];
  HO.MAX_LEVEL = HO.XP_TO_NEXT.length + 1;
  HO.xpForKill = level => 45 + 5 * level;

  HO.PI = 3.141592653589793;
  HO.TWO_PI = 6.283185307179586;
  HO.wrapAngle = a => {
    const r = a - Math.floor(a / HO.TWO_PI) * HO.TWO_PI;
    return r >= HO.TWO_PI ? 0 : r;
  };
  HO.sign = v => (typeof v === 'number' && v > 0 ? 1 : typeof v === 'number' && v < 0 ? -1 : 0);
  HO.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  HO.hashText = text => {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  };
  HO.hash = state => HO.hashText(JSON.stringify(state));
  HO.copy = value => JSON.parse(JSON.stringify(value));

  if (typeof module !== 'undefined') module.exports = HO;
})(globalThis.HO = globalThis.HO || {});
