(function (AW) {
  'use strict';

  const R = AW.Rules;
  const I = AW.Items;
  const C = AW.Combat = {};

  const DIST_MOD = { PISTOL: [2, 0], MPISTOL: [3, 2], RIFLE: [-3, 3], ARIFLE: [-2, 4] };
  const SOUNDS = {
    Parabellum: 'weapons/parabellum', ParabellumL: 'weapons/parabellum', WaltherPPK: 'weapons/walter', WaltherPPKS: 'weapons/walter+silencer',
    Mauser98k: 'weapons/mauzer', Mauser98kB: 'weapons/mauzer', Mauser98kS: 'weapons/mauzer', Strzelba: 'weapons/dubeltowka', StrzelbaS: 'weapons/obrzyn',
    Sztucer: 'weapons/sztucer', SztucerS: 'weapons/sztucer', TokariewTT33: 'weapons/tt', MP40: 'weapons/mp40-single-2'
  };
  const RELOAD_SND = { PISTOL: 'weapons/parabellum-reload1', RIFLE: 'weapons/mauzer_reload', MPISTOL: 'weapons/load' };

  C.isMelee = function (a) {
    const wc = a.wclass();
    return wc === 'EMPTY' || wc === 'KNIFE' || wc === 'MUG';
  };

  C.range = function (a) {
    if (C.isMelee(a) || !a.weaponReady()) return AW.C.HCLOSE - 8;
    const wc = a.wclass();
    if (wc === 'RIFLE') return 620;
    if (wc === 'PISTOL') return 360;
    return 420;
  };

  C.shotInterval = function (a) {
    const w = a.weapon();
    if (!w || C.isMelee(a)) return 0.2;
    const spd = Math.max(5, w.speed || 30);
    return Math.max(0.25, 60 / spd * (1.2 - a.stat('spd') * 0.03));
  };

  C.skillLevel = function (a, wc) {
    return a.skills[R.WCLASS_SKILL[wc] || 'fist'] || 0;
  };

  C.weaponStrength = function (sh, dist, close) {
    const w = sh.weapon();
    const wc = sh.wclass();
    const mod = DIST_MOD[wc];
    if (mod && dist > mod[1]) dist += mod[0];
    let sila = 0, bhit = 0, melee = false;
    const t = sh.toRoll();
    if (!close && w && w.link && w.link.amount > 0 && !w.jammed && w.dur > 1 && !C.isMelee(sh)) {
      const sub = w.link.sub;
      if (sub === 'CSMO') sila = 0;
      else if (sub === 'CNOR' || sub === 'CSOU') sila = AW.K6(t) + AW.K6(t);
      else if (sub === 'CWAF') { sila = AW.K6(t) + AW.K6(t); bhit = 2; }
      else if (sub === 'CDIS') sila = AW.K4(t) + AW.K4(t) + AW.K4(t) + AW.K4(t);
      else if (sub === 'CDUM') sila = AW.K6(t) * 4;
      else if (sub === 'CFLA') { sila = AW.K6(t) * 4; bhit = 3; }
      else if (sub === 'CEXP') { for (let i = 0; i < 6; i++) sila += AW.K6(t); bhit = 4; }
      else if (sub === 'CARM') { for (let i = 0; i < 6; i++) sila += AW.K6(t); }
      else sila = AW.K6(t) + AW.K6(t);
      sila += w.damage || 0;
    } else {
      const str = sh.stat('str');
      let mult = 0.3;
      if (w && wc !== 'EMPTY' && wc !== 'MUG') {
        if (w.dur > 1) mult = (w.name === 'Mauser98kB' || wc === 'KNIFE') ? 0.7 : 0.4;
        else mult = 0.1;
      }
      sila = AW.random(1, Math.floor(str * mult) + 1) + sh.dmgBonus();
      melee = true;
    }
    return { sila, bhit, dist, melee };
  };

  C.calcShoot = function (target, sh, close, wall) {
    const W = target.world;
    if (target.noHit > 0) return null;
    if (target.team === 1 && W.hero && W.hero.spArmed === 'smoke' && W.hero.smokeT > 0) {
      const lev = (W.hero.sp.smoke || 1) * 25 - 1;
      if (AW.random(100) < lev) return null;
    }
    let AC = target.ac();
    const heroLv = sh.skills.hero || 0;
    if (heroLv > 0) {
      let ac = AC + 5;
      ac = ac - (Math.floor(ac * ((heroLv + 1) / 10)) + 1);
      AC = ac - 5;
    }
    let dist = AW.isoDistM(target.x, target.y, sh.x, sh.y);
    const wc = sh.wclass();
    const dice = R.skillDice(C.skillLevel(sh, wc), sh.toRoll());
    const ws = C.weaponStrength(sh, dist, close);
    dist = ws.dist;
    if (ws.melee) {
      if (AW.isoDist(target.x, target.y, sh.x, sh.y) < AW.C.HCLOSE + 12) dist = 1;
      else return null;
    }
    let zs = 0;
    if (sh.spArmed === 'fury' && sh.furyLeft > 0) zs = 25 + AW.K6() + AW.K6() + AW.K6() + (sh.sp.fury || 1) * 10;
    let surprise = 0;
    const sLv = sh.skills.surprise || 0;
    if (sLv > 0 && !target.alert) surprise = sLv * 3;
    let misAim = sh.chaos > 0 ? -8 : 0;
    const th1 = dice.val + ws.bhit + sh.stat('agi') + 0.3 * sh.stat('lck') + sh.toHit() + zs + surprise + misAim;
    const th2 = dist + AW.K6(target.toRoll()) + target.stat('agi') + 0.3 * target.stat('lck') + target.toMiss() + (target.taunt > 0 ? 1000 : 0);
    let chance = th1 - th2;
    if (wall) chance = -1;
    const sniper = sh.spArmed === 'sniper' && !ws.melee && wc === 'RIFLE';
    if (sniper) chance = 15;
    if (chance <= 0) return null;
    let strength = ws.sila;
    let crit = dice.val >= dice.max;
    if (zs > 0) { strength = zs; crit = true; sh.furyLeft--; if (sh.furyLeft <= 0) sh.spArmed = null; }
    if (sLv > 0 && !target.alert) strength += Math.floor(strength * sLv * 0.5);
    if (sh.flags && sh.flags.officer) strength += 10;
    let dmg = R.damageAfterArmor(strength, AC, chance, crit);
    if (sniper) { dmg += (sh.sp.sniper || 1) * 30; sh.spArmed = null; }
    if (ws.melee && sh.skills.attack) dmg += sh.skills.attack * 3;
    return { dmg, crit, melee: ws.melee, rating: crit ? 4 : chance > 20 ? 3 : chance > 10 ? 2 : 1 };
  };

  C.calcExplosion = function (target, ex) {
    if (target.noHit > 0) return null;
    const d = AW.isoDistM(ex.x, ex.y, target.x, target.y);
    if (d >= ex.area) return null;
    let AC = target.ac();
    if (ex.armor) AC = 0.25 * AC;
    let bonus = 0;
    if (ex.owner && ex.owner.skills && ex.owner.skills.blast && target.world.hostile(ex.owner, target)) bonus = ex.damage * (ex.owner.skills.blast + 1) / 10;
    const damage = ex.damage * (1 - d / ex.area) + bonus;
    const strength = AW.random(Math.max(1, Math.floor(damage / 2)), Math.max(1, Math.floor(damage)));
    return Math.max(1, Math.floor(strength - AC + 0.5));
  };

  C.startAttack = function (a, target, px, py) {
    if (a.dead || a.stun > 0) return false;
    if (a.cooldown > 0) return false;
    if (a.attack) return false;
    const tx = target ? target.x : px, ty = target ? target.y : py;
    const close = C.isMelee(a) || !a.weaponReady() || (target && AW.isoDist(a.x, a.y, tx, ty) < AW.C.HCLOSE);
    if (close && target && AW.isoDist(a.x, a.y, tx, ty) > AW.C.HCLOSE + 14) return false;
    const w = a.weapon();
    if (w && !C.isMelee(a) && !close) {
      if (w.jammed) { a.world.message(a.name + ': ' + (w.dur <= 1 ? 'оружие сломано' : 'перекос патрона'), 'red'); a.cooldown = 1; return false; }
      C.rollJam(a, w);
      if (w.jammed) { a.world.playSound('weapons/empty-magazine', a.x, a.y, 80); a.world.message(a.name + ': перекос патрона', 'red'); a.cooldown = 1; return false; }
    }
    a.stopWalk();
    a.face(tx, ty);
    a.attack = { target: target || null, x: tx, y: ty, close, fired: false };
    const anim = close ? 'cfire1' : 'fire1';
    const hitFrame = close ? 9 : 1;
    a.setAnim(anim, {
      loop: false, count: 1, onEnd: () => {
        if (a.attack && !a.attack.fired) C.fire(a);
        a.attack = null;
        a.cooldown = Math.max(a.cooldown, C.shotInterval(a) * (close ? 0.5 : 0.8));
        if (!a.dead) a.idle();
      }
    });
    a.attack.hitFrame = Math.min(hitFrame, Math.max(0, a.anim.n - 2));
    if (a.isHero && a.fight === 0) a.world.setFight(a, 1);
    return true;
  };

  C.rollJam = function (a, w) {
    if (!w || !w.maxdur || a.enemy === 2 || a.enemy === 3) return;
    if (w.name === 'NozKuch' || w.name === 'NozMys' || w.name === 'Bagnet') return;
    const r = w.dur / w.maxdur;
    let p = 1;
    if (w.dur <= 0) p = 100;
    else if (r < 0.1) p = 75;
    else if (r < 0.3) p = 35;
    else if (r < 0.5) p = 15;
    else if (r < 0.8) p = 5;
    if (AW.random(100) < p) w.jammed = 1;
  };

  C.update = function (a) {
    const at = a.attack;
    if (!at || at.fired) return;
    if (at.target && !at.close) { at.x = at.target.x; at.y = at.target.y; a.face(at.x, at.y); }
    if (a.anim.frame >= at.hitFrame) C.fire(a);
  };

  C.fire = function (a) {
    const at = a.attack;
    if (!at || at.fired) return;
    at.fired = true;
    const W = a.world;
    const w = a.weapon();
    const wc = a.wclass();
    if (!at.close && w && !C.isMelee(a)) {
      if (w.link) w.link.amount = Math.max(0, w.link.amount - (/_INF$/.test(w.link.name) ? 0 : 1));
      if (w.maxdur && a.enemy !== 3) w.dur = Math.max(0, w.dur - 1);
      W.playSound(SOUNDS[w.name] || 'weapons/pistol-single', a.x, a.y, 100);
      W.noise(a, w.name === 'WaltherPPKS' ? 90 : 520);
      if (a.stealth > 0 && w.name !== 'WaltherPPKS') a.stealth = 0;
      W.muzzle(a, at.x, at.y);
    } else {
      if (wc === 'KNIFE') W.playSound('weapons/knife-attack' + AW.random(4), a.x, a.y, 90);
      else W.playSound('impacts/swish' + ['', '2', '3'][AW.random(3) - 1], a.x, a.y, 80);
    }
    let target = at.target;
    if (!target || target.dead) target = W.actorAt(at.x, at.y, a);
    if (a.chaos > 0 && AW.rng.chance(0.6)) target = null;
    if (!target || target.dead) {
      if (!at.close) W.impact(at.x + AW.random(-10, 10), at.y - 40 + AW.random(-20, 20), false);
      return;
    }
    const wall = !at.close && W.walk && W.walk.rayBlocked(a.x, a.y - 4, target.x, target.y - 4, 100);
    C.hit(target, a, at.close, wall);
  };

  C.hit = function (target, sh, close, wall) {
    const W = target.world;
    if (target.dead) return;
    if (W.hostile(target, sh) || target.enemy === 0) target.onAttacked(sh);
    if (target.team === 1 && sh.team !== 1) W.teamAttacked(sh);
    if (target.team !== 1 && sh.team === 1) W.provoke(target, sh);
    const r = C.calcShoot(target, sh, close, wall);
    if (!r) {
      if (!close) W.impact(target.x + AW.random(-18, 18), target.y - 50 + AW.random(-20, 20), false);
      else W.playSound('impacts/swish', target.x, target.y, 60);
      return;
    }
    if (close && sh.weapon() && sh.weapon().maxdur && sh.enemy !== 3) sh.weapon().dur = Math.max(0, sh.weapon().dur - 1);
    if (close) W.playSound(sh.wclass() === 'EMPTY' ? 'impacts/hand-punch' + AW.random(3) : 'impacts/weapon_punch' + AW.random(3), target.x, target.y, 90);
    C.damage(target, r.dmg, sh, { crit: r.crit });
  };

  C.damage = function (target, dmg, from, opts) {
    const W = target.world;
    const o = opts || {};
    if (target.dead) return;
    if (W.cheatGod && target.team === 1) return;
    target.hp -= dmg;
    target.hitFlash = 0.25;
    target.alert = Math.max(target.alert || 0, 1);
    W.floatText(target, 'Здоровье: -' + dmg, '#ff4040');
    W.blood(target, o.explosion);
    if (o.crit && from && from.team === 1) W.message('Критическое попадание', 'yellow');
    if (target.hp <= 0) {
      target.hp = 0;
      W.killActor(target, from, false, o);
      return;
    }
    W.painSound(target);
    if (from && !o.explosion) target.face(from.x, from.y);
    if (!target.attack && !target.path && AW.rng.chance(0.55)) {
      const anim = target.anim.name === 'caim' ? 'chit1' : 'hit1';
      target.setAnim(anim, { loop: false, onEnd: () => { if (!target.dead) target.idle(); } });
    }
    if (o.explosion && o.ex) {
      const dx = target.x - o.ex.x, dy = target.y - o.ex.y;
      const d = Math.hypot(dx, dy) || 1;
      const push = 26;
      const nx = target.x + dx / d * push, ny = target.y + dy / d * push;
      if (W.walk && W.walk.walkable(nx, ny)) { target.x = nx; target.y = ny; }
    }
  };

  C.explode = function (W, x, y, area, damage, owner, kind) {
    W.explosionFx(x, y, kind);
    W.playSound(kind === 'mine' ? 'impacts/mina-explozja' : 'impacts/grenade-explode', x, y, 100);
    W.noise({ x, y, team: owner ? owner.team : 0 }, 700);
    if (kind === 'smoke') { W.smokeCloud(x, y, area); return; }
    for (const t of W.actors.slice()) {
      if (t.dead || !t.visible) continue;
      const dmg = C.calcExplosion(t, { x, y, area, damage, owner, armor: kind === 'at' });
      if (dmg) {
        if (owner && owner !== t) t.onAttacked(owner);
        C.damage(t, dmg, owner, { explosion: true, ex: { x, y } });
      }
    }
    for (const m of W.mines.slice()) {
      if (!m.dead && AW.isoDistM(x, y, m.x, m.y) < area * 0.6) { m.dead = true; setTimeout0(W, () => C.explode(W, m.x, m.y, m.area, m.damage, m.owner, 'mine')); }
    }
  };

  function setTimeout0(W, fn) { W.later(0.15, fn); }

  C.throwGrenade = function (a, item, tx, ty) {
    const W = a.world;
    if (!item) return false;
    const d = AW.isoDistM(a.x, a.y, tx, ty);
    const lv = a.skills.grenade || 0;
    const maxR = 7 + lv * 2 + a.stat('str') * 0.5;
    let x = tx, y = ty;
    if (d > maxR) { const k = maxR / d; x = a.x + (tx - a.x) * k; y = a.y + (ty - a.y) * k; }
    const spread = Math.max(0, 40 - lv * 10 - a.stat('agi') * 2);
    x += AW.random(-spread, spread); y += AW.random(-spread, spread) * 0.5;
    const land = W.walk ? W.walk.nearestWalkable(x, y, 10) : [x, y];
    if (land) { x = land[0]; y = land[1]; }
    a.stopWalk();
    a.face(x, y);
    const kind = /CSMO|Dymny/.test(item.key + item.name) ? 'smoke' : /CARM|Pancer/.test(item.key + item.name) ? 'at' : 'frag';
    a.setAnim('granade', {
      loop: false, onEnd: () => { if (!a.dead) a.idle(); }
    });
    W.later(0.35, () => {
      W.playSound('weapons/zawleczka_' + AW.random(2), a.x, a.y, 80);
      W.projectiles.push({ kind: 'grenade', gk: kind, x0: a.x, y0: a.y - 60, x1: x, y1: y, t: 0, dur: 0.45 + d * 0.05, owner: a, area: item.area || 3, damage: item.damage || 30, fuse: 1.1 });
    });
    return true;
  };

  C.updateProjectiles = function (W, dt) {
    for (const p of W.projectiles) {
      p.t += dt;
      if (p.kind === 'grenade') {
        if (p.t >= p.dur && !p.landed) { p.landed = true; W.playSound('impacts/kick1', p.x1, p.y1, 60); }
        if (p.landed) {
          if (!p.rejected && W.hero && W.hero.spArmed === 'rejection' && AW.isoDistM(p.x1, p.y1, W.hero.x, W.hero.y) < 3 && p.owner && p.owner.team !== 1) {
            p.rejected = true;
            W.hero.spArmed = null;
            W.playSound('specials/rejection', W.hero.x, W.hero.y, 100);
            p.x0 = p.x1; p.y0 = p.y1 - 30; p.x1 = p.owner.x; p.y1 = p.owner.y; p.t = 0; p.dur = 0.5; p.landed = false; p.fuse = p.t + 0.9;
            p.owner = W.hero;
            continue;
          }
          p.fuse -= dt;
          if (p.fuse <= 0 && !p.done) {
            p.done = true;
            C.explode(W, p.x1, p.y1, p.area, p.damage, p.owner, p.gk === 'smoke' ? 'smoke' : p.gk === 'at' ? 'at' : 'frag');
          }
        }
      }
    }
    W.projectiles = W.projectiles.filter(p => !p.done);
  };

  C.updateMines = function (W) {
    for (const m of W.mines) {
      if (m.dead) continue;
      for (const a of W.actors) {
        if (a.dead || !a.visible || a.team === m.team) continue;
        if (AW.isoDist(a.x, a.y, m.x, m.y) < 22) {
          const spot = a.skills.spot || 0;
          if (a.team === 1 && spot && AW.random(100) <= spot * 20) { m.dead = true; W.message('Мина обезврежена', 'green'); W.giveItem(a, 'w.A_mine_CDIS'); break; }
          m.dead = true;
          C.explode(W, m.x, m.y, m.area, m.damage, m.owner, 'mine');
          break;
        }
      }
    }
    W.mines = W.mines.filter(m => !m.dead);
  };

  C.reload = function (a, fromBelt) {
    const w = a.weapon();
    if (!w || C.isMelee(a)) return false;
    const inv = a.inv;
    let src = null, where = null;
    const candidates = [];
    for (let i = 0; i < 7; i++) if (inv.belt[i] && I.ammoFits(w, inv.belt[i]) && inv.belt[i].amount > 0) candidates.push(['belt', i, inv.belt[i]]);
    if (!fromBelt) for (const p of inv.pack) if (I.ammoFits(w, p.item) && p.item.amount > 0) candidates.push(['pack', -1, p.item]);
    if (!candidates.length) {
      if (a.isHero) a.world.message('Нет патронов', 'red');
      return false;
    }
    candidates.sort((x, y) => y[2].amount - x[2].amount);
    [where, , src] = candidates[0];
    const slot = candidates[0][1];
    inv.remove(src);
    const old = w.link;
    w.link = src;
    if (old && old.amount > 0) {
      if (where === 'belt' && slot >= 0 && !inv.belt[slot]) inv.belt[slot] = old;
      else if (!inv.add(old)) a.world.dropItemAt(old, a.x, a.y);
    }
    w.jammed = 0;
    a.world.playSound(RELOAD_SND[a.wclass()] || 'weapons/load', a.x, a.y, 90);
    a.cooldown = Math.max(a.cooldown, 1.2 - a.stat('spd') * 0.05);
    if (a.fight) a.setAnim('reload', { loop: false, onEnd: () => { if (!a.dead) a.idle(); } });
    if (a.isHero) a.world.message('Перезарядить (' + a.name + ')');
    return true;
  };

  C.killXp = function (victim) { return Math.max(2, Math.round(victim.hpMax * 2)); };
})(globalThis.AW = globalThis.AW || {});
