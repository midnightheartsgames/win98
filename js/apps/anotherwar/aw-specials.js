(function (AW) {
  'use strict';

  const C = AW.C;
  const SP = AW.Specials = {};

  function enemiesNear(W, h, m) {
    return W.actors.filter(o => !o.dead && o.visible && !o.crate && W.hostile(h, o) && AW.isoDistM(h.x, h.y, o.x, o.y) <= m);
  }

  function nearestEnemy(W, h, m) {
    let best = null, bd = Infinity;
    for (const o of enemiesNear(W, h, m)) {
      const d = AW.isoDist(h.x, h.y, o.x, o.y);
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }

  function fx(W, a, key) { W.fx.push({ kind: key, x: a.x, y: a.y - 90, t: 0, life: 1, add: true, follow: a }); }

  SP.spec = function (h, id) { return AW.Rules.special(h.cls, id); };

  SP.select = function (game, slot) {
    const W = game.W, h = W && W.hero;
    if (!h) return;
    const s = (AW.Rules.SPECIALS[h.cls] || [])[slot];
    game.ui.audio.play('icons/click1');
    if (!s || !h.sp[s.id]) return;
    h.spSel = s.id;
    game.pendingSpecial = null;
    if (game.hud) game.hud.addMessage(s.name, 'yellow');
  };

  SP.ready = function (h, id) {
    const c = h.spCharge[id];
    return (c === undefined ? 100 : c) >= 100;
  };

  SP.use = function (game) {
    const W = game.W, h = W && W.hero;
    if (!h || !game.canControl()) return;
    const id = h.spSel;
    if (!id || !h.sp[id]) { if (game.hud) game.hud.addMessage(AW.TEXT.NoSkills || 'Нет выбранного навыка (F1-F8)', 'red'); return; }
    if (!SP.ready(h, id)) { if (game.hud) game.hud.addMessage('Навык еще не восстановился', 'red'); return; }
    const s = SP.spec(h, id);
    if (s.aim === 'point') {
      game.pendingSpecial = s;
      if (game.hud) game.hud.addMessage(s.name + ': укажите место', 'yellow');
      game.ui.setCursor('AIM_zolty');
      return;
    }
    if (SP.run(W, h, s, null)) h.spCharge[id] = 0;
  };

  SP.aimAt = function (game, wp) {
    const W = game.W, h = W.hero;
    const s = game.pendingSpecial;
    game.pendingSpecial = null;
    if (!s) return;
    if (SP.run(W, h, s, wp)) h.spCharge[s.id] = 0;
  };

  SP.run = function (W, h, s, pt) {
    const lv = h.sp[s.id] || 1;
    const msg = t => W.message(t, 'red');
    switch (s.id) {
      case 'runner': {
        h.noHit = 2 + lv;
        h.seq.reset();
        h.walkTo(pt.x, pt.y, { goalRadius: 20, run: true });
        h.stamina = C.STAMINA_MAX;
        h.runBoost = 2 + lv;
        W.playSound('specials/runner' + AW.random(4), h.x, h.y, 100);
        return true;
      }
      case 'rejection':
        h.spArmed = 'rejection';
        W.playSound('specials/rejection2', h.x, h.y, 90);
        W.message(s.name + ' наготове', 'yellow');
        return true;
      case 'joke': {
        const list = enemiesNear(W, h, lv + 2).filter(e => e.stat('int') > 2);
        W.playSound('specials/joke', h.x, h.y, 100);
        h.noHit = 2;
        h.setAnim('talk2', { loop: false, onEnd: () => h.idle() });
        for (const e of list) {
          e.face(h.x, h.y);
          W.playSound('weapons/smiech_kill' + AW.random(8), e.x, e.y, 90);
        }
        W.later(1.2, () => {
          for (const e of list) {
            if (e.dead) continue;
            AW.Combat.damage(e, Math.max(1, Math.floor(e.hpMax * e.stat('int') * 0.2)), h, {});
          }
        });
        return true;
      }
      case 'hellmill': {
        if (h.wclass() !== 'RIFLE') { msg('Нужна винтовка'); return false; }
        W.playSound(lv < 3 ? 'specials/hellmill-v' : 'specials/hellmill_4sec-v', h.x, h.y, 100);
        h.setAnim('mlyniec', { loop: false, count: lv * 3, onEnd: () => h.idle() });
        for (const e of enemiesNear(W, h, 1 + lv)) {
          AW.Combat.damage(e, 40 + (e.stat('str') - 7) * 4 + lv * 10, h, {});
          SP.knock(W, h, e, 1);
        }
        return true;
      }
      case 'insult': {
        W.playSound('specials/insult2', h.x, h.y, 100);
        h.setAnim('talk2', { loop: false, onEnd: () => h.idle() });
        h.taunt = lv * 3 + 10;
        W.taunter = h;
        for (const e of enemiesNear(W, h, 7)) if (e.ai && e.ai.engage) { e.ai.engage(h); e.ai.target = h; }
        return true;
      }
      case 'fury':
        h.spArmed = 'fury';
        h.furyLeft = lv;
        W.playSound('specials/fury', h.x, h.y, 100);
        fx(W, h, 'furysmall');
        return true;
      case 'push': {
        W.playSound('specials/rejection2', h.x, h.y, 100);
        for (const e of enemiesNear(W, h, 1 + lv)) SP.knock(W, h, e, 3 + lv * 2);
        return true;
      }
      case 'disarm': {
        let n = 0;
        W.playSound('impacts/weapon_punch1', h.x, h.y, 100);
        for (const e of enemiesNear(W, h, 1 + lv)) {
          if (e.stat('str') >= 12) continue;
          if (e.inv.hand && AW.random(100) < 50) {
            const w = e.inv.hand;
            e.inv.hand = null;
            if (!/_B$/.test(w.key)) W.dropItemAt(w, e.x + 20, e.y + 10);
            n++;
          }
          SP.knock(W, h, e, 2);
        }
        if (n) W.message('Выбито оружие: ' + n, 'green');
        return true;
      }
      case 'smoke': {
        const g = h.inv.all().find(it => /CSMO/.test(it.key));
        if (g) h.inv.remove(g);
        W.smokeCloud(h.x, h.y, 3);
        W.playSound('specials/smokescreen', h.x, h.y, 100);
        h.spArmed = 'smoke';
        h.smokeT = 10 + lv * 3;
        return true;
      }
      case 'stealth':
        h.stealth = 15 + lv * 10;
        W.playSound('specials/dodge', h.x, h.y, 80);
        for (const e of enemiesNear(W, h, 12)) if (e.ai && e.ai.lose && e.ai.mode === 'attack' && AW.isoDistM(e.x, e.y, h.x, h.y) > 1.2) e.ai.lose();
        return true;
      case 'miner': {
        const m = h.inv.all().find(it => AW.Items.isMine(it));
        if (!m) { msg('Нужна мина'); return false; }
        h.inv.remove(m);
        W.mines.push({ x: h.x, y: h.y + 4, area: m.area || 3, damage: (m.damage || 30) + lv * 10, team: 1, owner: h });
        W.playSound('weapons/mina-stawianie', h.x, h.y, 90);
        return true;
      }
      case 'sapper': {
        const r = (2 + lv) * C.HMETR;
        let n = 0;
        for (const m of W.mines) {
          if (m.dead || m.team === 1 || AW.isoDist(h.x, h.y, m.x, m.y) > r) continue;
          m.dead = true;
          n++;
          W.giveItem(h, 'w.A_mine_CDIS');
        }
        W.playSound('specials/saper', h.x, h.y, 90);
        W.message(n ? 'Снято мин: ' + n : 'Мин рядом нет', n ? 'green' : '');
        return true;
      }
      case 'panic':
        W.playSound('specials/fury', h.x, h.y, 100);
        for (const e of enemiesNear(W, h, 1 + lv)) e.panic = Math.max(1, 5 + lv * 3 - e.stat('cha') * 0.5);
        return true;
      case 'sniper':
        if (h.wclass() !== 'RIFLE') { msg('Нужна винтовка'); return false; }
        h.spArmed = 'sniper';
        W.playSound('specials/sniper', h.x, h.y, 90);
        return true;
      case 'stun': {
        const list = enemiesNear(W, h, 1 + lv);
        if (!list.length) { msg('Рядом никого нет'); return false; }
        W.playSound('specials/stunning', h.x, h.y, 100);
        for (const e of list) { SP.knock(W, h, e, 3 + lv * 2); fx(W, e, 'wleb'); }
        return true;
      }
      case 'bait': {
        const d = h.inv.all().find(it => it.name === 'kaczuszka');
        if (!d) { msg('Нужна резиновая уточка'); return false; }
        W.playSound('specials/dinks', pt.x, pt.y, 100);
        for (const e of W.actors) {
          if (e.dead || !W.hostile(h, e) || AW.isoDistM(e.x, e.y, pt.x, pt.y) > 4 + lv * 2 || !e.ai) continue;
          e.seq.reset();
          e.walkTo(pt.x + AW.random(-30, 30), pt.y + AW.random(-15, 15), { goalRadius: 20 });
          e.baitT = 6;
        }
        return true;
      }
      case 'scout':
        if (!h.inv.all().some(it => it.name === 'lornetka')) { msg('Нужен бинокль на шее'); return false; }
        W.scoutT = 6 + lv * 2;
        W.scoutDX = (AW.DIR_VEC[h.dir][0]) * 320;
        W.scoutDY = (AW.DIR_VEC[h.dir][1]) * 260;
        W.playSound('specials/scout' + AW.random(2), h.x, h.y, 90);
        return true;
      case 'chaos':
        W.playSound('specials/fury', h.x, h.y, 100);
        for (const e of enemiesNear(W, h, 2 + lv * 2)) e.chaos = 10 + lv * 5;
        return true;
      case 'officer':
        W.playSound('specials/officer', h.x, h.y, 100);
        for (const m of W.teamMembers()) m.officer = 15 + lv * 5;
        h.officer = 15 + lv * 5;
        return true;
      case 'disinfo':
        W.playSound('specials/general', h.x, h.y, 100);
        for (const e of enemiesNear(W, h, 7)) e.disinfo = 8 + lv * 3;
        return true;
      case 'artillery': {
        W.playSound('specials/general', h.x, h.y, 100);
        const n = 3 + lv;
        for (let i = 0; i < n; i++) {
          W.later(1.5 + i * 0.45, () => {
            const x = pt.x + AW.random(-90, 90), y = pt.y + AW.random(-45, 45);
            AW.Combat.explode(W, x, y, 3, 25 + lv * 5, h, 'frag');
          });
        }
        return true;
      }
      case 'drill':
        W.playSound('specials/drill', h.x, h.y, 100);
        for (const m of W.teamMembers()) {
          if (m.dead) W.reviveCompanion(m, 10 + lv * 10);
          else m.heal(10 + lv * 10);
        }
        return true;
      case 'hurricane': {
        const t = h.attack && h.attack.target ? h.attack.target : nearestEnemy(W, h, C.SEE_M + 2);
        if (!t) { msg('Нет цели'); return false; }
        W.playSound('specials/hurricane', h.x, h.y, 100);
        for (const m of W.teamMembers()) if (m.ai && m.ai.constructor === AW.AI.Companion) { m.ai.hurricane = t; m.ai.hurricaneT = 10 + lv * 2; }
        return true;
      }
      case 'retreat':
        W.playSound('specials/retreat', h.x, h.y, 90);
        for (const m of W.teamMembers()) {
          if (m.ai && m.ai.constructor === AW.AI.Companion) m.ai.retreatT = 6;
          m.noHit = 2;
          m.heal(lv * 5 + 5);
        }
        return true;
    }
    return false;
  };

  SP.knock = function (W, from, e, stun) {
    const d = Math.hypot(e.x - from.x, e.y - from.y) || 1;
    const nx = e.x + (e.x - from.x) / d * 50, ny = e.y + (e.y - from.y) / d * 25;
    if (W.walk && W.walk.walkable(nx, ny)) { e.x = nx; e.y = ny; }
    e.stopWalk();
    e.attack = null;
    e.stun = Math.max(e.stun, stun);
    e.knocked = true;
    e.setAnim('death2', { loop: false, hold: true });
    W.later(stun, () => { e.knocked = false; if (!e.dead) { e.stun = 0; e.idle(); } });
  };
})(globalThis.AW = globalThis.AW || {});
