(function (HO) {
  'use strict';

  HO.ELEM_SFX = { phys: 'hit', fire: 'steam', ice: 'glint', elec: 'snap', wind: 'whoosh', quant: 'warp', imag: 'sparkle' };

  HO.SFX_GAP = 0.06;
  HO.STEP_EVERY = 0.36;
  HO.STEP_SOUND = { dur: 0.05, vol: 0.3, freq: 1100, to: 500 };

  HO.musicFor = function (world) {
    const zone = world.zone;
    if (zone.id === 'echo') return 'doomsday';
    const heroes = new Set(world.state.actors.filter(a => a.kind === 'hero').map(a => a.uid));
    let elite = false;
    for (const f of world.state.actors) {
      if (f.kind !== 'foe' || f.dead || f.state !== 'fight') continue;
      if (!Object.keys(f.threat || {}).some(u => heroes.has(+u))) continue;
      const d = HO.FOES[f.id];
      if (d.boss) return 'boss';
      if (d.elite) elite = true;
    }
    return elite || zone.instance ? 'crises' : 'station';
  };

  const MINE = {
    levelUp: 'levelup', credits: 'coin', bought: 'coin', sold: 'coin', repaired: 'coin', got: 'select', looted: 'select',
    chest: 'chest', anchorFound: 'anchor', anchorPaid: 'warp', teleport: 'warp', travel: 'warp', death: 'lose', revived: 'heal',
    questAccept: 'confirm', questDone: 'win', learned: 'confirm', equip: 'shuffle', deny: 'deny', gate: 'door', usedItem: 'buff',
    castStart: 'tech', trialStart: 'horn', bound: 'anchor', scanned: 'scan'
  };
  const FIGHT = { prep: 'alarm', phase: 'rumble', summon: 'rift', vanish: 'break_obj', crumble: 'break_obj', chestUp: 'sparkle' };

  HO.eventSfx = function (e, me, party, close) {
    const near = uid => uid === me || party.has(uid);
    if (e.k === 'dmg') {
      if (e.dot || (e.src !== me && e.uid !== me)) return [];
      const out = [e.crit ? 'crit' : 'hit'];
      if (e.src === me && !e.auto && e.elem && e.elem !== 'phys' && HO.ELEM_SFX[e.elem]) out.push(HO.ELEM_SFX[e.elem]);
      return out;
    }
    if (e.k === 'swing') return e.uid === me && e.melee ? ['swing'] : [];
    if (e.k === 'heal') return (e.src === me || e.uid === me) && e.v > 0 ? ['heal'] : [];
    if (e.k === 'break') return near(e.src) ? ['break', HO.ELEM_SFX[e.elem] || 'hit'] : [];
    if (e.k === 'miss') return e.src === me || e.uid === me ? ['whoosh'] : [];
    if (e.k === 'cleanse') return near(e.uid) ? ['buff'] : [];
    if (e.k === 'trialEnd') return e.uid === me ? [e.won ? 'win' : 'lose'] : [];
    if (MINE[e.k]) return e.uid === me ? [MINE[e.k]] : [];
    if (FIGHT[e.k]) return !close || close(e.uid) ? [FIGHT[e.k]] : [];
    return [];
  };
})(globalThis.HO = globalThis.HO || {});
