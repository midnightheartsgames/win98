(function (H) {
  'use strict';
  const G = H.Gfx, T = H.TUNING;
  const { W, HGT, C, lsSet, OPT_KEY } = H.UI_CONST;
  const BATTLE_SPEEDS = [1, 2, 3];
  const EV_TIME = { act: 0.55, dmg: 0.2, tough: 0, break: 0.75, heal: 0.2, shield: 0.12, status: 0.1, kill: 0.35, text: 1.1, mood: 1.2, summon: 0.45, implant: 0.3, shuhu: 0.05, wave: 0.9, lock: 1.1, recover: 0.3, revive: 0.7, leave: 0.45, flee: 0.8, fusion: 1.0, chaos: 0.55, stance: 0.15, turn: 0.05, win: 0.5, lose: 0.6, fled: 0.3, hecate: 0.7, notes: 0.08, elys: 0.15, seal: 0.25, elysBurst: 0.45, form: 0.7, miss: 0.35, fail: 0.45, chant: 0.55, collapse: 0.4, loot: 0.3, oneMore: 0.9, aoa: 1.4, aoaEnd: 0.4, warn: 0.5, persona: 0.1, stitch: 0.25, gynoids: 0.6, mark: 0.15, shackle: 0.2, shiny: 0.05, steal: 0.35, away: 0.45, back: 0.8, capsule: 0.6, ccForm: 0.45, applause: 0.25 };
  const NOTE = { str: ['Струнные', '#ff5a6e'], wind: ['Духовые', '#b484ff'], cad: ['Каденция', '#ffd060'] };
  const HECATE_AT = { x: 112, y: 330, s: 150 };
  const MOOD_COL = { eager: '#ffd060', happy: '#80ff90', angry: '#ff5050', scared: '#a0a0ff', none: '#c0c0c0' };
  const MOOD_NAME = { eager: 'Интерес', happy: 'Довольство', angry: 'Злость!', scared: 'Страх', none: '...' };
  const TARGET_NAME = { single: 'Одна цель', blast: 'Цель и соседи', all: 'Все враги', bounce: 'Отскоки', ally: 'Союзник', allies: 'Вся команда', self: 'На себя' };
  const SKILL_MODE = ['Кража', 'Связывание', 'Касание'];
  const PIPS = { kazuma: ['luck', 'dLuck', 'luckMax', '#9affb0'], aqua: ['tears', 'dTears', 'tearsMax', '#8ad0ff'], megumin: ['chant', 'dChant', 'chantMax', '#ff6a5a'], darkness: ['ecstasy', 'dEcst', 'ecstasyMax', '#ff8ac8'], blade: ['shuhu', 'dShuhu', 'shuhuMax', '#7affc0'] };

  Object.assign(H.UI.prototype, {
    startBattleUI(e) {
      const g = this.game, b = g.battle;
      this.mode = 'battle';
      this.screens = this.screens.filter(s => s.keep);
      this.bt = { queue: [], cur: null, curT: 0, floats: [], shake: 0, bannerT: 0, banner: null, target: null, allyMode: null, sub: null, auto: this.bt && this.bt.autoSticky ? true : false, autoSticky: this.bt ? this.bt.autoSticky : false, flash: new Map(), lunge: new Map(), fade: new Map(), foes: b.enemies.slice(), intro: 0.8, bg: e.bg, boss: e.boss, big: null, result: null, msg: null, msgT: 0, pick: 'basic', charge: 0, pv: null, dmgBy: new Map(), ult: null, ultSeen: new Set(), fusionSeen: new Set(), skinSeen: new Set(), ward: b.ward ? Object.assign({}, b.ward) : null };
      for (const u of [...b.allies, ...b.enemies]) { u.dHp = u.hp; u.dTough = u.tough; u.dShield = u.shield; }
      this.audio.music(e.music);
      this.sfx('warp');
      const ev = b.start();
      this.bt.order = ev.find(x => x.t === 'order') || null;
      this.bt.queue.push(...ev);
    },

    enemyLayout() {
      const bt = this.bt;
      const list = bt.foes.filter(u => u.appear && (!bt.fade.has(u) || bt.fade.get(u) > 0));
      const out = new Map();
      const size = u => u.data.boss ? 200 : u.data.elite ? 140 : 104;
      const total = list.reduce((a, u) => a + size(u) * 0.8, 0);
      let x = W / 2 + 34 - total / 2;
      for (const u of list) { const s = size(u); out.set(u, { x: x + s * 0.4, y: 290, s }); x += s * 0.8; }
      return out;
    },

    allyPos(u) { return { x: 12 + u.idx * 112 + 54, y: 400 }; },

    unitPos(u) {
      if (u.summon) return u.id === 'gynoids' ? this.gynoidPos() : this.fivesPos(u) || { x: HECATE_AT.x, y: HECATE_AT.y - HECATE_AT.s * 0.55 };
      if (u.side === 'ally') return this.allyPos(u);
      const p = this.enemyLayout().get(u);
      return p ? { x: p.x, y: p.y - p.s * 0.5 } : { x: W / 2, y: 200 };
    },

    updateBattle(dt) {
      const bt = this.bt, g = this.game;
      if (!bt) return;
      const speed = (this.options.battleSpeed || 1) * (this.held.includes('ShiftLeft') || this.held.includes('ShiftRight') ? 2 : 1);
      if (bt.intro > 0) { bt.intro -= dt; return; }
      for (const [u, t] of bt.flash) { if (t - dt <= 0) bt.flash.delete(u); else bt.flash.set(u, t - dt); }
      for (const [u, t] of bt.lunge) { if (t - dt <= 0) bt.lunge.delete(u); else bt.lunge.set(u, t - dt); }
      for (const [u, t] of bt.fade) bt.fade.set(u, Math.max(0, t - dt * 2));
      for (const f of bt.floats) { f.t -= dt; f.y -= dt * 30; }
      bt.floats = bt.floats.filter(f => f.t > 0);
      if (bt.shake > 0) bt.shake = Math.max(0, bt.shake - dt * 30);
      if (bt.bannerT > 0) bt.bannerT -= dt;
      if (bt.msgT > 0) bt.msgT -= dt;
      if (bt.big) { bt.big.t -= dt; if (bt.big.t <= 0) bt.big = null; }
      this.inabaUpdate(dt);
      this.contonUpdate(dt);
      this.haresUpdate(dt);
      this.fivesUpdate(dt);
      if (this.elationUpdate) this.elationUpdate(dt);
      if (bt.hecate) {
        const h = bt.hecate;
        h.t += dt;
        h.noteT = Math.max(0, h.noteT - dt);
        h.a = h.leaving ? Math.max(0, h.a - dt * 2) : Math.min(1, h.a + dt * 2.5);
        if (h.leaving && h.a <= 0) bt.hecate = null;
      }
      if (bt.result || bt.elHelp) return;
      if (bt.ult) {
        bt.ult.tick(dt * speed);
        if (!bt.ult.done) return;
        bt.ult = null;
      }
      if (bt.cur) {
        bt.curT -= dt * speed;
        if (bt.curT > 0) return;
        bt.cur = null;
      }
      while (bt.queue.length) {
        if (bt.queue[0].t === 'wave' && bt.foes.some(u => bt.fade.get(u) > 0)) return;
        const e = bt.queue.shift();
        if (e.t === 'act' && e.kind === 'ult' && this.ultCineOn(e.u)) { bt.ult = this.makeUltShow(e); return; }
        if (e.t === 'act' && e.kind === 'skill' && this.skinCineOn(e.u)) { bt.ult = this.makeSkillShow(e); return; }
        if (e.t === 'fusion' && this.fusionCineOn(e.id)) { bt.ult = this.makeFusionShow(e); return; }
        this.applyEvent(e);
        const d = e.hold || EV_TIME[e.t] || 0;
        if (d > 0) { bt.cur = e; bt.curT = d; return; }
      }
      const b = g.battle;
      if (!b) return;
      if (b.over) { this.finishBattle(); return; }
      bt.order = b.orderSnap(b.current);
      if (b.phase === 'input') {
        if (!bt.target || !H.battleStat.alive(bt.target)) bt.target = b.living[0] || null;
        if (bt.auto && !bt.sub && !bt.allyMode) { b.autoStep(); this.pullEvents(); }
      } else if (b.chainReady() && bt.auto) { b.chain(b.chainAuto()); this.pullEvents(); }
    },

    ultCineOn(u) {
      const mode = this.options.ultCine || 'on', bt = this.bt;
      if (mode === 'off' || !H.Ults || u.side !== 'ally' || !H.Ults.SHOWS[u.charId]) return false;
      if (mode === 'first' && bt.ultSeen.has(u.charId)) return false;
      bt.ultSeen.add(u.charId);
      return true;
    },

    skinCineOn(u) {
      const mode = this.options.skinCine || 'first', bt = this.bt;
      if (mode === 'off' || !H.SkillShow || u.side !== 'ally' || !H.outfitCutOf(H.wornOutfit(u.charId, this.game), 'skill')) return false;
      if (mode === 'first' && bt.skinSeen.has(u.charId)) return false;
      bt.skinSeen.add(u.charId);
      return true;
    },

    fusionCineOn(id) {
      const mode = this.options.fusionCine || 'on', bt = this.bt;
      if (mode === 'off' || !H.Fusions || !H.Fusions.SHOWS[id]) return false;
      if (mode === 'first' && bt.fusionSeen.has(id)) return false;
      bt.fusionSeen.add(id);
      return true;
    },

    cineFoes() {
      const hit = [];
      for (const x of this.bt.queue) {
        if (x.t === 'act' || x.t === 'turn') break;
        if (x.t === 'dmg' && x.u.side === 'enemy' && !hit.includes(x.u)) hit.push(x.u);
      }
      const lay = this.enemyLayout();
      return hit.filter(u => lay.has(u)).map(u => { const p = lay.get(u); return { u, x: p.x / 2, y: p.y / 2, s: p.s / 2 }; });
    },

    makeUltShow(e) {
      const bt = this.bt, b = this.game.battle || this.lastBattle;
      const allies = e.u.kit.ult.target === 'self' ? [e.u] : b.allies.filter(a => !a.dead);
      return new H.Ults.Show(this, e.u, { name: e.name, foes: this.cineFoes(), allies, bg: bt.bg });
    },

    makeSkillShow(e) {
      return new H.SkillShow(this, e.u, { name: e.name, foes: this.cineFoes(), bg: this.bt.bg });
    },

    makeFusionShow(e) {
      const bt = this.bt, b = this.game.battle || this.lastBattle, next = bt.queue[0];
      if (next && next.t === 'act' && next.kind === 'fusion') bt.queue.shift();
      return new H.Fusions.Show(this, e.members, { id: e.id, foes: this.cineFoes(), allies: b.allies.filter(a => !a.dead), bg: bt.bg });
    },

    pullEvents() { const b = this.game.battle; if (b) this.bt.queue.push(...b.drain()); },

    floatAt(u, text, col, size) {
      const p = this.unitPos(u);
      this.bt.floats.push({ x: p.x + (Math.random() - 0.5) * 30, y: p.y - 10, text, col, size: size || 14, t: 1.1 });
    },

    applyEvent(e) {
      const bt = this.bt;
      switch (e.t) {
        case 'act':
          bt.banner = { name: e.name, who: e.u.name, side: e.u.side, kind: e.kind };
          bt.bannerT = 1.2;
          bt.lunge.set(e.u, 0.35);
          if (e.kind === 'summon' && bt.hecate && bt.hecate.u === e.u) { bt.hecate.note = e.note; bt.hecate.noteT = 0.7; }
          this.contonAct(e);
          this.fivesAct(e);
          if (e.kind === 'res') { const P = H.SU.PATHS[this.game.battle.su.path]; bt.big = { text: 'РЕЗОНАНС ПУТИ', sub: P.name + ' · ' + P.aeon, col: P.col, t: 1.1 }; bt.shake = 8; }
          this.sfx(e.kind === 'ult' || e.kind === 'fusion' || e.kind === 'res' ? 'ult' : e.kind === 'contact' ? 'text' : 'swing');
          break;
        case 'dmg': {
          e.u.dHp = e.hp; e.u.dShield = e.shield;
          if (e.src && e.src.side === 'ally' && e.u.side === 'enemy') bt.dmgBy.set(e.src, (bt.dmgBy.get(e.src) || 0) + e.v);
          const ec = H.ELEMENTS[e.e] ? H.ELEMENTS[e.e].col : '#fff';
          this.floatAt(e.u, (e.crit ? '!' : '') + e.v, e.crit ? '#ffe040' : e.dot ? ec : e.u.side === 'ally' ? '#ff8080' : '#ffffff', e.crit ? 20 : e.dot ? 12 : 16);
          if (e.el) bt.floats[bt.floats.length - 1].rainbow = true;
          if (e.label && !(e.el && e.label === 'Радость')) this.floatAt(e.u, e.label, ec, 10);
          bt.flash.set(e.u, 0.2);
          const p = this.unitPos(e.u);
          for (let i = 0; i < 8; i++) this.particles.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 260, vy: (Math.random() - 0.7) * 220, g: 400, t: 0.45, col: ec });
          if (e.crit) bt.shake = 6;
          if (e.u.side === 'ally') bt.shake = Math.max(bt.shake, 3);
          this.sfx(e.crit ? 'crit' : 'hit');
          break;
        }
        case 'tough': e.u.dTough = e.v; break;
        case 'break':
          e.u.dTough = 0;
          bt.big = { text: 'ПРОБИТИЕ!', sub: H.BREAK_EFFECT[e.e], col: H.ELEMENTS[e.e].col, t: 0.9 };
          bt.shake = 10;
          this.sfx('break');
          break;
        case 'heal': e.u.dHp = e.hp; if (e.v > 0) this.floatAt(e.u, '+' + e.v, '#60ff90', 14); this.sfx('heal'); break;
        case 'shield': e.u.dShield = e.v; this.floatAt(e.u, 'Щит ' + e.v, '#80c0ff', 11); this.sfx('shield'); break;
        case 'status': this.floatAt(e.u, e.text, e.col || (e.debuff ? '#ff9090' : '#90ffb0'), 10); this.sfx(e.debuff ? 'debuff' : 'buff'); break;
        case 'kill': bt.fade.set(e.u, 1); if (e.u.side === 'ally') this.floatAt(e.u, 'Повержен', '#ff6060', 12); break;
        case 'text': bt.msg = e.text; bt.msgT = 1.6; bt.msgWarn = !!e.warn; break;
        case 'lock': bt.msg = e.text; bt.msgT = 1.8; bt.msgWarn = true; break;
        case 'mood': bt.msg = e.text; bt.msgT = 1.6; bt.msgWarn = false; if (e.u) this.floatAt(e.u, MOOD_NAME[e.mood], MOOD_COL[e.mood], 13); break;
        case 'summon': bt.foes.push(e.u); e.u.appear = true; e.u.dHp = e.u.hp; e.u.dTough = e.u.tough; e.u.dShield = 0; this.floatAt(e.u, 'Подкрепление', '#ff9090', 11); break;
        case 'wave': bt.foes = e.list.slice(); for (const u of e.list) { u.appear = true; u.dHp = u.hp; u.dTough = u.tough; u.dShield = 0; } bt.big = { text: 'ВОЛНА ' + e.n, sub: '', col: C.gold, t: 0.9 }; break;
        case 'recover': e.u.dTough = e.u.maxTough; this.floatAt(e.u, 'Стойкость восстановлена', '#ffffff', 10); break;
        case 'revive': e.u.dHp = e.hp; bt.fade.delete(e.u); this.floatAt(e.u, e.text || 'Возрождение', '#ffe040', 13); this.sfx('heal'); break;
        case 'miss': this.floatAt(e.u, 'Промах!', '#d8d0ff', 15); this.sfx('swing'); break;
        case 'fail': this.floatAt(e.u, 'Провал!', '#9ad0ff', 15); this.sfx('deny'); break;
        case 'chant': e.u.dChant = e.v; this.floatAt(e.u, 'Напев ' + e.v, '#ff7a6a', 11); bt.msg = e.u.name + ': «' + e.line + '»'; bt.msgT = 1.6; bt.msgWarn = false; this.sfx('buff'); break;
        case 'collapse': e.u.dCollapse = e.v; if (!e.on) e.u.dChant = 0; this.floatAt(e.u, e.on ? 'Без сил' : 'Снова в строю', e.on ? '#ff9090' : '#90ffb0', 12); break;
        case 'loot': this.floatAt(e.u, e.text, C.gold, 11); this.sfx('glint'); break;
        case 'shuhu': e.u.dShuhu = e.v; if (e.v >= (e.u.flags.shuhuMax || T.shuhuMax)) this.floatAt(e.u, 'Дар Шуху!', '#7affc0', 12); break;
        case 'implant': e.u.dImplant = e.e; this.floatAt(e.u, e.text, e.e ? H.ELEMENTS[e.e].col : '#c0c0c0', 11); if (e.e) this.sfx('debuff'); break;
        case 'ecstasy': e.u.dEcst = e.v; if (e.v >= T.ecstasyMax && e.add > 0) this.floatAt(e.u, 'Восторг!', '#ff9ad0', 12); break;
        case 'leave': bt.fade.set(e.u, 1); break;
        case 'flee': bt.fade.set(e.u, 1); bt.msg = e.text; bt.msgT = 1.4; break;
        case 'fusion': bt.big = { text: 'СЛИЯНИЕ', sub: e.name, col: C.pink, t: 1.1, members: e.members }; this.sfx('star4'); break;
        case 'order': bt.order = e; break;
        case 'frost': e.u.dFrost = e.v; if (e.add > 0) this.floatAt(e.u, 'Изморозь +' + e.add, '#bfe8ff', 10); break;
        case 'icefire': e.u.dIce = e.v; if (e.v) this.floatAt(e.u, 'Ледяное пламя ' + e.v, '#8ad8ff', 10); break;
        case 'chaos': bt.big = { text: 'ХАОС', sub: 'Старые аномалии взорвались', col: '#ff78d8', t: 0.6 }; bt.shake = Math.max(bt.shake, 8); this.floatAt(e.u, 'Хаос!', '#ff78d8', 14); this.sfx('break'); break;
        case 'stance': e.u.dStance = e.stance; this.floatAt(e.u, e.text, '#c8b0ff', 11); this.sfx('buff'); break;
        case 'turn': bt.turnU = e.u; bt.pick = this.game.battle && this.game.battle.basicLocked(e.u) ? 'skill' : 'basic'; bt.charge = 0; bt.allyMode = null; if (e.extra) this.floatAt(e.u, 'Доп. ход!', '#ffe040', 13); if (e.keep && !e.oneMore) this.floatAt(e.u, 'Ход продолжается', '#ff9a8a', 11); if (e.oneMore) this.askAllOut(); break;
        case 'notes': e.u.dNotes = e.notes; if (e.add) this.floatAt(e.u, '♪ ' + NOTE[e.add][0], NOTE[e.add][1], 10); break;
        case 'after': e.u.dAfter = e.v; break;
        case 'hecate':
          if (e.on) {
            bt.hecate = { u: e.u, owner: e.owner, t: 0, a: 0, note: null, noteT: 0, leaving: false };
            bt.big = { text: 'ВАЛЬС', sub: 'Геката выходит на сцену', col: '#ff6a96', t: 1 };
            bt.shake = Math.max(bt.shake, 6);
            this.sfx('ult');
          } else if (bt.hecate && bt.hecate.u === e.u) bt.hecate.leaving = true;
          break;
        case 'elys': e.u.dElys = e.elys; break;
        case 'seal': e.u.dElys = e.elys; this.floatAt(e.u, e.left ? 'Печать сломана' : 'Элизиум трещит!', '#ffb070', 11); this.sfx('debuff'); break;
        case 'elysBurst': {
          e.u.dElys = null;
          bt.shake = Math.max(bt.shake, 9);
          const p = this.unitPos(e.u);
          for (let i = 0; i < 18; i++) this.particles.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 380, vy: (Math.random() - 0.6) * 300, g: 380, t: 0.6, col: i % 2 ? '#ff8a3a' : '#ffd8a0' });
          this.floatAt(e.u, 'Разрыв Элизиума!', '#ff9a40', 13);
          this.sfx('break');
          break;
        }
        case 'elysEnd': e.u.dElys = null; this.floatAt(e.u, 'Элизиум рассеялся', '#c8a890', 10); break;
        case 'form':
          e.u.dForm = e.on;
          if (e.on) { bt.big = { text: 'АБЕРРАНТНЫЙ КОШМАР', sub: e.u.name + ' меняет облик', col: '#c890ff', t: 1 }; bt.shake = Math.max(bt.shake, 8); this.sfx('ult'); }
          else this.floatAt(e.u, 'Облик сброшен', '#c8b0ff', 11);
          break;
        case 'cycle': this.fhCycleEvent(e); break;
        case 'win': this.sfx('win'); break;
        case 'lose': this.sfx('lose'); break;
        default: if (e.t === 'ward') this.bt.ward = e; else if (!(this.elationEvent && this.elationEvent(e)) && !this.foursEvent(e) && !this.contonEvent(e) && !this.haresEvent(e) && !this.fivesEvent(e)) this.inabaEvent(e);
      }
    },

    finishBattle() {
      const g = this.game, bt = this.bt;
      this.lastBattle = g.battle;
      const out = g.endBattle();
      bt.result = out;
      if (out.levelUps && out.levelUps.length) setTimeout(() => this.sfx('levelup'), 400);
    },

    closeResult() {
      const g = this.game, out = this.bt.result;
      if (out.lost) return;
      this.mode = 'field';
      this.bt.autoSticky = this.bt.auto;
      this.lastBattle = null;
      this.audio.music(g.mapMusic(g.map.def));
      g.afterBattle();
      if (out.fh) this.fhAfter(out);
    },

    battleKey(k, code) {
      const g = this.game, b = g.battle, bt = this.bt;
      if (!bt) return;
      if (bt.elHelp) { this.elHelpKey(k); return; }
      if (bt.result) {
        const out = bt.result;
        if (out.lost) {
          const n = this.loseOptions(out).length;
          if ((k === 'up' || k === 'down' || k === 'left' || k === 'right') && n > 1) { bt.loseSel = ((bt.loseSel || 0) + 1) % n; this.sfx('select'); }
          if (k === 'ok') this.loseChoice(bt.loseSel || 0);
          return;
        }
        if (k === 'ok' || k === 'back') this.closeResult();
        return;
      }
      if (code === 'KeyV') { bt.auto = !bt.auto; this.sfx('select'); return; }
      if (code === 'KeyX') { this.cycleBattleSpeed(); return; }
      if (bt.ult) { if (k === 'ok' || k === 'back') bt.ult.skip(); return; }
      if (this.chainOpen()) return this.chainKey(k, code);
      if (!b || b.phase !== 'input' || bt.queue.length || bt.cur) return;
      if (bt.sub) return this.subKey(k, code);
      if (code === 'KeyF' && b.su) return this.suResonate();
      if (k === 'left' || k === 'right') {
        const step = k === 'left' ? -1 : 1;
        if (bt.allyMode) {
          const al = this.allyChoices(), i = al.indexOf(bt.allyMode.target);
          bt.allyMode.target = al[(i + step + al.length) % al.length];
        } else {
          const list = [...this.enemyLayout().keys()].filter(x => H.battleStat.alive(x));
          const i = list.indexOf(bt.target);
          bt.target = list[(i + step + list.length) % list.length];
        }
        this.sfx('select');
        return;
      }
      if ((k === 'up' || k === 'down') && b.current && b.current.kit.charged && (bt.pick || 'basic') === 'basic') return this.stepCharge(k === 'up' ? 1 : -1);
      if ((k === 'up' || k === 'down') && b.current && b.current.kit.skills && (bt.pick === 'skill' || b.current.kit.personas)) return this.stepSkill(k === 'up' ? -1 : 1);
      if ((k === 'up' || k === 'down') && b.current && b.current.charId === 'silverwolf' && bt.pick === 'skill') return this.stepImplant(k === 'up' ? -1 : 1);
      if (code === 'KeyQ') return this.pickAct('basic');
      if (code === 'KeyE') return this.pickAct('skill');
      if (k === 'ok') return this.confirmAct();
      if (/^Digit[1-4]$/.test(code)) {
        const a = b.allies[+code.slice(5) - 1];
        if (!a || !b.ultReady(a)) { this.sfx('deny'); return; }
        return this.doUlt(a);
      }
      if (code === 'KeyT') { bt.sub = { type: 'contact', sel: 0 }; this.sfx('confirm'); return; }
      if (code === 'KeyR') { const f = b.availableFusions(); if (!f.length) { this.sfx('deny'); bt.msg = 'Нет пар для слияния в команде.'; bt.msgT = 1.2; return; } bt.sub = { type: 'fusion', sel: 0 }; this.sfx('confirm'); return; }
      if (k === 'back') {
        if (bt.pick === 'skill' && !(b.current && b.basicLocked(b.current))) { this.pickAct('basic'); return; }
        bt.sub = { type: 'pause', sel: 0 }; this.sfx('confirm');
      }
    },

    pickAct(kind) {
      const b = this.game.battle, bt = this.bt, u = b.current;
      if (kind === 'skill' && b.skillLocked(u)) { this.sfx('deny'); bt.msg = 'В Адском пейзаже навык недоступен.'; bt.msgT = 1.2; return; }
      if (kind === 'basic' && b.basicLocked(u)) { this.sfx('deny'); bt.msg = 'В Спектральной трансмиграции доступен только навык.'; bt.msgT = 1.2; return; }
      if (kind === 'skill' && b.sp < b.skillCost(u)) { this.sfx('deny'); bt.msg = 'Не хватает очков навыка!'; bt.msgT = 1; return; }
      if ((bt.pick || 'basic') === kind) return this.confirmAct();
      bt.pick = kind;
      bt.allyMode = null;
      const ab = b.abilityFor(u, kind).ab;
      if (ab.target === 'ally') bt.allyMode = { kind, target: ab.noSelf ? (b.livingAllies.find(a => a !== u) || u) : u };
      this.sfx(kind === 'skill' ? 'confirm' : 'select');
    },

    allyChoices() {
      const b = this.game.battle, bt = this.bt, u = b.current;
      const ab = u && bt.allyMode ? b.abilityFor(u, bt.allyMode.kind).ab : null;
      return ab && ab.revive ? b.allies.filter(a => !a.gone) : b.livingAllies;
    },

    setSkillMode(i) {
      const b = this.game.battle, bt = this.bt, u = b.current;
      if (!u || !u.kit.skills) return;
      if (u.kit.personas) { if (u.flags.personaLock) { this.sfx('deny'); bt.msg = 'Персону можно сменить в начале хода.'; bt.msgT = 1; return; } b.setSkill(u, i); this.sfx('select'); return; }
      b.setSkill(u, i);
      if (bt.pick !== 'skill') { this.pickAct('skill'); return; }
      const ab = b.abilityFor(u, 'skill').ab;
      bt.allyMode = ab.target === 'ally' ? { kind: 'skill', target: ab.noSelf ? (b.livingAllies.find(a => a !== u) || u) : u } : null;
      this.sfx('select');
    },

    stepSkill(d) {
      const u = this.game.battle.current;
      this.setSkillMode((u.flags.skillSel | 0) + d);
    },

    stepImplant(d) {
      const b = this.game.battle, u = b.current, list = b.implantChoices();
      if (!list.length) return;
      const i = Math.max(0, list.indexOf(b.implantElem(u, this.bt.target)));
      b.setImplant(u, list[(i + d + list.length) % list.length]);
      this.sfx('select');
    },

    stepCharge(d) {
      const b = this.game.battle, bt = this.bt, u = b.current, max = b.chargeLevels(u);
      if (!max) { this.sfx('deny'); bt.msg = 'Для Симоцуки нужно 2 Изморози.'; bt.msgT = 1; return; }
      bt.charge = Math.max(0, Math.min(max, (bt.charge || 0) + d));
      b.setCharge(u, bt.charge);
      this.sfx('select');
    },

    setChargeLevel(lv) {
      const b = this.game.battle, bt = this.bt, u = b.current;
      if (bt.pick !== 'basic') this.pickAct('basic');
      bt.charge = Math.max(0, Math.min(b.chargeLevels(u), lv));
      b.setCharge(u, bt.charge);
      this.sfx('select');
    },

    confirmAct() {
      const bt = this.bt, kind = bt.pick || 'basic';
      if (bt.allyMode) { const t = bt.allyMode.target; bt.allyMode = null; return this.doAct(kind, t); }
      return this.doAct(kind);
    },

    subKey(k, code) {
      const bt = this.bt, sub = bt.sub;
      const opts = this.subOptions();
      if (k === 'up') { sub.sel = (sub.sel - 1 + opts.length) % opts.length; this.sfx('select'); return; }
      if (k === 'down') { sub.sel = (sub.sel + 1) % opts.length; this.sfx('select'); return; }
      if (k === 'back') { bt.sub = null; this.sfx('cancel'); return; }
      if (k === 'ok' || (sub.type === 'contact' && code === 'KeyT') || (sub.type === 'fusion' && code === 'KeyR')) {
        const o = opts[sub.sel];
        if (!o || o.disabled) { this.sfx('deny'); return; }
        bt.sub = null;
        o.fn();
      }
    },

    subOptions() {
      const g = this.game, b = g.battle, bt = this.bt, sub = bt.sub, u = b.current;
      if (!sub) return [];
      if (sub.type === 'contact') return u.kit.contact.map((c, i) => ({ label: c.name, right: { joke: 'шутка', cute: 'милота', threat: 'угроза', science: 'наука', kind: 'доброта', sing: 'музыка', bribe: 'выгода', silent: 'молчание', weird: 'странное' }[c.tag], fn: () => { b.contact(i, bt.target); this.pullEvents(); } }));
      if (sub.type === 'fusion') return b.availableFusions().map(f => ({ label: f.f.name, right: f.ready ? 'готово' : 'нужна энергия', rcol: f.ready ? C.ok : C.dim, disabled: !f.ready, members: f.members, fn: () => { b.fusion(f.id, bt.target); this.pullEvents(); } }));
      if (sub.type === 'aoa') return this.aoaOptions();
      if (sub.type === 'pause') return [{ label: 'Продолжить бой', fn: () => { } }, { label: b.noFlee ? 'Отступить нельзя' : 'Отступить', disabled: b.noFlee, fn: () => { b.flee(); this.pullEvents(); } }, { label: 'Авто-бой: ' + (bt.auto ? 'вкл' : 'выкл'), fn: () => { bt.auto = !bt.auto; } }];
      return [];
    },

    doAct(kind, allyTarget) {
      const b = this.game.battle, bt = this.bt;
      const ok = b.act(kind, allyTarget || bt.target);
      if (!ok) {
        this.sfx('deny');
        if (allyTarget && allyTarget.dead && b.current && b.sp < b.skillCost(b.current, allyTarget)) { bt.msg = 'Воскрешению нужно ' + T.reviveSp + ' очка навыка!'; bt.msgT = 1.2; bt.msgWarn = true; }
        return;
      }
      this.pullEvents();
    },

    doUlt(a) {
      const b = this.game.battle, bt = this.bt;
      if (b.ult(a, bt.target)) this.pullEvents();
      else this.sfx('deny');
    },

    loseOptions(out) {
      const g = this.game;
      if (out.su) return this.suLoseOptions(out);
      if (out.fh) return this.fhLoseOptions(out);
      const retry = { label: 'Повторить бой (полное лечение)', fn: () => g.retryBattle() };
      return out.fromScript ? [retry] : [retry, { label: 'Вернуться к якорю', fn: () => g.giveUpBattle() }];
    },

    loseChoice(i) {
      const g = this.game, opts = this.loseOptions(this.bt.result), o = opts[i] || opts[0];
      this.bt.result = null;
      this.bt.loseSel = 0;
      o.fn();
      this.drainGameEvents();
      if (!g.battle) { this.mode = 'field'; this.audio.music(g.mapMusic(g.map.def)); if (g.script) g.advanceScript(); }
    },

    turnOrder(n) {
      const bt = this.bt, o = bt && bt.order;
      if (!o) return [];
      const sp = H.battleStat.spdOf;
      const units = [...o.av.keys()].filter(u => u.appear && !bt.fade.has(u)).map(u => ({ u, av: u === o.cur ? -1 : o.av.get(u) }));
      const out = [];
      for (let i = 0; i < n && units.length; i++) {
        units.sort((a, c) => a.av - c.av);
        const x = units[0];
        out.push({ u: x.u, av: Math.max(0, Math.round(x.av)) });
        x.av += T.avBase / sp(x.u);
      }
      return out;
    },

    drawBattle(c) {
      const g = this.game, b = g.battle || this.lastBattle, bt = this.bt;
      if (!b || !bt) return;
      if (bt.ult && !bt.ult.fading) { bt.ult.draw(c); return; }
      const sx = bt.shake ? (Math.random() - 0.5) * bt.shake : 0, sy = bt.shake ? (Math.random() - 0.5) * bt.shake : 0;
      c.save();
      c.translate(sx, sy);
      c.drawImage(G.bgCanvas(bt.bg, W, HGT), 0, 0);
      const lay = this.enemyLayout();
      const boss = [...lay.keys()].find(u => u.data.boss && !bt.fade.has(u));
      const inputOk = b.phase === 'input' && !bt.queue.length && !bt.cur && !bt.result && !bt.sub;
      if (inputOk && bt.target && !H.battleStat.alive(bt.target)) bt.target = b.living[0] || null;
      bt.pv = inputOk && !bt.auto && b.current && b.current.side === 'ally' ? b.preview(bt.pick || 'basic', bt.allyMode ? bt.allyMode.target : bt.target) : null;
      const aimFoes = bt.pv ? [...bt.pv.rows.keys()].some(t => t.side === 'enemy') : b.phase === 'input' && !bt.allyMode;
      if (bt.hecate) this.drawHecate(c, bt.hecate);
      this.contonBack(c, lay);
      this.haresBack(c, lay);
      this.fivesBack(c, lay);
      for (const [u, p] of lay) {
        const fade = bt.fade.has(u) ? bt.fade.get(u) : 1;
        if ((u.dead || u.gone) && fade <= 0) continue;
        const lunge = bt.lunge.get(u) || 0;
        const bob = Math.sin(this.t * 2 + p.x) * 3;
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(p.x, p.y + 4, p.s * 0.3, 8, 0, 0, Math.PI * 2); c.fill();
        if (aimFoes && u === bt.target) {
          c.strokeStyle = 'rgba(242,220,154,' + (0.6 + 0.4 * Math.sin(this.t * 6)) + ')'; c.lineWidth = 2; c.beginPath(); c.ellipse(p.x, p.y + 4, p.s * 0.35, 10, 0, 0, Math.PI * 2); c.stroke(); c.lineWidth = 1;
        } else if (bt.pv && bt.pv.rows.has(u)) {
          c.strokeStyle = 'rgba(242,220,154,0.45)'; c.beginPath(); c.ellipse(p.x, p.y + 4, p.s * 0.3, 8, 0, 0, Math.PI * 2); c.stroke();
        }
        G.drawEnemy(c, u.data, p.x, p.y + bob + lunge * 40, p.s, { alpha: (u.dead || u.gone) ? fade : 1, flash: bt.flash.has(u) ? 0.7 : 0, t: this.t + p.x * 0.01 });
        if (u.frozen) { c.fillStyle = 'rgba(170,235,255,0.3)'; c.beginPath(); c.ellipse(p.x, p.y - p.s * 0.42, p.s * 0.34, p.s * 0.46, 0, 0, Math.PI * 2); c.fill(); this.text('ЛЁД', p.x, p.y - 14, { align: 'center', size: 10, bold: true, col: '#c0f4ff' }); }
        const el = u.dElys !== undefined ? u.dElys : u.elys ? b.elysSnap(u) : null;
        if (el && !u.dead && !u.gone) this.drawElysium(c, p, el);
        if (!bt.fade.has(u) && u !== boss) this.enemyHud(c, u, p);
        if (!bt.fade.has(u) && !u.dead && !u.gone) this.intentTag(c, u, p);
        if (!u.dead && !u.gone && u === bt.target && aimFoes) this.targetMark(c, u, p);
      }
      for (const [u, p] of lay) if (!u.dead && !u.gone) this.hit(p.x - p.s * 0.35, p.y - p.s * 0.9, p.s * 0.7, p.s * 0.9, () => {
        const t = this.bt;
        if (t.allyMode) return;
        if (t.target === u && t.pv) { this.battleKey('ok', 'Enter'); return; }
        t.target = u; this.sfx('select');
      });
      this.drawStitch(c, lay);
      for (const pa of this.particles) if (!pa.field) { c.fillStyle = pa.col; c.fillRect(pa.x, pa.y, 3, 3); }
      this.drawAoa(c, lay);
      this.contonField(c, lay);
      this.haresField(c, lay);
      this.fivesField(c, lay);
      c.restore();
      if (boss) this.bossHud(c, boss);
      this.drawTurnOrder(c, b);
      this.drawAllies(c, b);
      this.drawCommands(c, b);
      this.drawTopRight(c);
      this.drawDamageBoard(c, b);
      if (this.bt.ward && this.drawWard) this.drawWard(c, this.bt.ward);
      if (this.drawProto) this.drawProto(c, b);
      if (b.fh) this.drawFhHud(c, b);
      for (const f of bt.floats) { c.globalAlpha = Math.min(1, f.t * 2); if (f.rainbow && this.rainbowText) this.rainbowText(f.text, f.x, f.y, f.size); else this.text(f.text, f.x, f.y, { align: 'center', size: f.size, bold: true, col: f.col }); c.globalAlpha = 1; }
      if (bt.bannerT > 0 && bt.banner) {
        const a = Math.min(1, bt.bannerT * 3), ally = bt.banner.side === 'ally';
        c.globalAlpha = a;
        const col = ally ? (bt.banner.kind === 'ult' || bt.banner.kind === 'fusion' ? '#ffc040' : '#80c0ff') : '#ff7070';
        const w = Math.max(220, this.measure(bt.banner.name, 14, true, true) + 60), y = boss ? 66 : 14;
        c.fillStyle = 'rgba(4,6,20,0.82)'; c.fillRect(W / 2 - w / 2, y, w, 36);
        c.fillStyle = col; c.fillRect(W / 2 - w / 2, y, w, 1); c.fillRect(W / 2 - w / 2, y + 35, w, 1);
        this.diamond(W / 2 - w / 2 + 10, y + 18, 4, col); this.diamond(W / 2 + w / 2 - 10, y + 18, 4, col);
        this.text(bt.banner.name, W / 2, y + 3, { align: 'center', bold: true, serif: true, size: 14, col });
        this.text(bt.banner.who, W / 2, y + 21, { align: 'center', size: 10, col: C.sub });
        c.globalAlpha = 1;
      }
      if (bt.msgT > 0 && bt.msg) {
        const lines = this.wrap(bt.msg, 380, 12), y = boss ? 108 : 58;
        this.win(W / 2 - 210, y, 420, 16 + lines.length * 15, { border: bt.msgWarn ? '#ff8080' : C.brass, corners: false });
        lines.forEach((l, i) => this.text(l, W / 2, y + 8 + i * 15, { align: 'center', col: bt.msgWarn ? '#ffb0b0' : C.cream }));
      }
      if (bt.big) {
        const a = Math.min(1, bt.big.t * 2);
        c.globalAlpha = a;
        const gr = c.createLinearGradient(0, 150, 0, 224);
        gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = gr; c.fillRect(0, 150, W, 74);
        if (bt.big.members) { const n = bt.big.members.length; bt.big.members.forEach((m, i) => G.drawBust(c, G.lookOf(m.charId, g), n > 2 ? 22 + i * (W - 172) / (n - 1) : i ? W - 150 : 22, 140, 2)); }
        this.text(bt.big.text, W / 2, 162, { align: 'center', size: 30, bold: true, serif: true, col: bt.big.col });
        if (bt.big.sub) this.text(bt.big.sub, W / 2, 198, { align: 'center', size: 13, col: C.cream });
        c.globalAlpha = 1;
      }
      this.drawOneMore(c);
      this.contonOver(c);
      this.haresOver(c);
      if (this.elationOver) this.elationOver(c);
      if (bt.intro > 0) {
        c.fillStyle = '#000';
        const p = bt.intro / 0.8;
        for (let i = 0; i < 12; i++) { c.fillRect(0, i * 40, W * p, 20); c.fillRect(W - W * p, i * 40 + 20, W * p, 20); }
      }
      if (bt.sub) this.drawSub(c);
      if (bt.result) this.drawResult(c);
      if (bt.ult) bt.ult.draw(c);
    },

    drawHecate(c, h) {
      const { x, y, s } = HECATE_AT, bt = this.bt, bob = Math.sin(h.t * 1.6) * 4, lunge = (bt.lunge.get(h.u) || 0) * 30;
      c.save();
      c.globalAlpha = h.a;
      const gr = c.createRadialGradient(x, y - s * 0.5, 6, x, y - s * 0.5, s * 0.8);
      gr.addColorStop(0, 'rgba(255,70,130,0.32)'); gr.addColorStop(1, 'rgba(255,70,130,0)');
      c.fillStyle = gr; c.fillRect(x - s, y - s * 1.35, s * 2, s * 1.7);
      c.fillStyle = 'rgba(120,20,50,0.4)'; c.beginPath(); c.ellipse(x, y + 4, s * 0.32, 8, 0, 0, Math.PI * 2); c.fill();
      G.drawEnemy(c, { id: 'hecate' }, x + lunge, y + bob, s, { t: h.t, aura: false, flash: bt.flash.has(h.u) ? 0.6 : 0 });
      if (h.noteT > 0) {
        const n = NOTE[h.note], k = Math.min(1, h.noteT * 2), ny = y - s - 6 - (0.7 - h.noteT) * 24;
        c.globalAlpha = h.a * k;
        this.text('♪', x + 22, ny, { align: 'center', size: 26, bold: true, serif: true, col: n ? n[1] : '#ff9ac0' });
        this.text(n ? n[0] : 'Поклон', x + 22, ny + 28, { align: 'center', size: 10, bold: true, col: n ? n[1] : '#ff9ac0' });
      }
      c.restore();
    },

    drawElysium(c, p, el) {
      const cx = p.x, cy = p.y - p.s * 0.45, rx = p.s * 0.42, ry = p.s * 0.56, t = this.t;
      c.save();
      c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      c.fillStyle = 'rgba(255,110,50,' + (0.07 + 0.03 * Math.sin(t * 3)).toFixed(3) + ')'; c.fill();
      c.clip();
      c.strokeStyle = 'rgba(255,150,80,0.45)'; c.lineWidth = 1;
      const hs = Math.max(8, p.s * 0.11);
      for (let row = -6; row <= 6; row++) for (let col = -6; col <= 6; col++) {
        const hx = cx + col * hs * 1.5, hy = cy + row * hs * 1.73 + (col % 2 ? hs * 0.87 : 0);
        c.beginPath();
        for (let k = 0; k <= 6; k++) { const a = k * Math.PI / 3; const px = hx + Math.cos(a) * hs * 0.98, py = hy + Math.sin(a) * hs * 0.98; if (k) c.lineTo(px, py); else c.moveTo(px, py); }
        c.stroke();
      }
      c.restore();
      c.strokeStyle = 'rgba(255,170,90,0.85)'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.stroke(); c.lineWidth = 1;
      const top = p.y + 16, sx = cx - (el.need * 12 + el.embers * 6) / 2;
      c.fillStyle = 'rgba(20,8,4,0.7)'; c.fillRect(sx - 6, top - 7, el.need * 12 + el.embers * 6 + 8, 14);
      for (let i = 0; i < el.need; i++) this.diamond(sx + i * 12, top, 4, i < el.broke ? '#3a2620' : '#ffb060', '#1a0c08');
      for (let i = 0; i < el.embers; i++) {
        const ex = sx + el.need * 12 + i * 6, ey = top;
        c.fillStyle = '#1a0c08'; c.beginPath(); c.moveTo(ex - 2.6, ey + 3); c.lineTo(ex, ey - 4); c.lineTo(ex + 2.6, ey + 3); c.fill();
        c.fillStyle = i % 2 ? '#ff8a3a' : '#ffc060'; c.beginPath(); c.moveTo(ex - 1.8, ey + 2.4); c.lineTo(ex, ey - 3); c.lineTo(ex + 1.8, ey + 2.4); c.fill();
      }
    },

    noteStaff(c, u, cx, cy, ready) {
      const notes = u.dNotes || u.flags.notes || [], maestro = !!u.flags.maestro;
      const x = cx - 21, y = cy - 13, w = 42, h = 26;
      c.fillStyle = 'rgba(0,0,0,0.62)'; c.fillRect(x - 2, y - 2, w + 4, h + 4);
      c.strokeStyle = ready ? 'hsl(' + ((this.t * 200) % 360) + ',90%,65%)' : maestro ? '#ff6a96' : '#5a3a4a';
      c.lineWidth = ready ? 2 : 1; c.strokeRect(x - 1.5, y - 1.5, w + 3, h + 3); c.lineWidth = 1;
      c.fillStyle = 'rgba(242,220,154,0.32)';
      for (let i = 0; i < 5; i++) c.fillRect(x + 1, y + 5 + i * 4, w - 2, 1);
      for (let i = 0; i < T.notesMax; i++) {
        const n = notes[i], nx = Math.round(x + 5 + i * 6.4), ny = y + 15 + (n === 'str' ? 4 : n === 'cad' ? -4 : 0);
        if (!n) { c.fillStyle = 'rgba(242,220,154,0.25)'; c.fillRect(nx - 1, y + 14, 2, 2); continue; }
        c.fillStyle = '#100810'; c.beginPath(); c.ellipse(nx, ny, 3.2, 2.4, -0.4, 0, Math.PI * 2); c.fill();
        c.fillStyle = NOTE[n][1]; c.beginPath(); c.ellipse(nx, ny, 2.5, 1.8, -0.4, 0, Math.PI * 2); c.fill();
        c.fillRect(nx + 2, ny - 8, 1, 8);
      }
      if (maestro) { c.fillStyle = 'rgba(40,6,20,0.72)'; c.fillRect(x, y + h - 8, w, 8); this.text('Маэстро', cx, y + h - 9, { align: 'center', size: 8, bold: true, col: '#ff9ac0', shadow: false }); }
      G.elemIcon(c, u.elem, x - 4, y - 4, 6);
    },

    targetMark(c, u, p) {
      const y = (u.data.boss ? p.y - p.s + 4 : p.y - p.s - 68) + Math.sin(this.t * 5) * 2;
      c.fillStyle = '#1a1208'; c.beginPath(); c.moveTo(p.x - 8, y - 1); c.lineTo(p.x + 8, y - 1); c.lineTo(p.x, y + 9); c.fill();
      c.fillStyle = C.brassHi; c.beginPath(); c.moveTo(p.x - 6, y); c.lineTo(p.x + 6, y); c.lineTo(p.x, y + 7); c.fill();
    },

    enemyHud(c, u, p) {
      const w = Math.max(72, p.s * 0.6), x = p.x - w / 2, y = p.y - p.s - 26;
      const bt = this.bt;
      c.fillStyle = 'rgba(4,6,20,0.55)'; c.fillRect(x - 3, y - 2, w + 6, 26);
      const r = bt.pv && bt.pv.rows.get(u);
      this.bar(x, y + 8, w, 5, u.dHp / u.maxHp, '#e04848');
      if (u.dShield > 0) { c.fillStyle = 'rgba(140,200,255,0.9)'; c.fillRect(x, y + 8, Math.min(1, u.dShield / u.maxHp) * w, 2); }
      this.bar(x, y + 16, w, 3, u.dTough / u.maxTough, u.broken ? '#606060' : '#f4f4f8', '#303038');
      if (r) this.previewOnBars(u, r, x, y + 8, 5, y + 16, 3, w);
      this.weakIcons(c, u, x + 5, y + 1, 13, 5);
      if (r) this.previewLabel(r, p.x, y - 14, 10);
      const tags = [];
      if (u.broken) tags.push('ПРОБИТ');
      for (const d of u.dots) tags.push(H.DOT_NAME[d.type] + (d.stacks > 1 ? '×' + d.stacks : ''));
      for (const bf of u.buffs) if (bf.debuff && !bf.name.startsWith('Анализ:')) tags.push(bf.name);
      if (u.charging != null) tags.push('ЗАРЯД!');
      if (u.flags.bound > 0) tags.unshift('Связан');
      if (u.flags.provoke) tags.push('Вызов');
      if (u.frostbite) tags.unshift('Обморожение');
      this.contonFoeTags(u, tags);
      this.haresFoeTags(u, tags);
      if (tags.length) this.text(tags.slice(0, 3).join(' · '), p.x, y + 26, { align: 'center', size: 9, col: '#ffb0b0' });
      this.icefirePips(u, x + w - 4, y + 4);
      if (u === bt.target) this.text(u.name + ' · ур.' + u.lvl, p.x, r ? y - 28 : y - 13, { align: 'center', size: 10, bold: true, col: C.gold });
      const mv = Object.entries(u.mood).filter(([, v]) => v > 0);
      mv.forEach(([k2, v], i) => { c.fillStyle = MOOD_COL[k2]; c.fillRect(x + i * 14, y + 36, 10, 4 + v * 2); });
    },

    weakIcons(c, u, x, y, step, r) {
      const imp = u.dImplant === undefined ? (u.implant ? u.implant.e : null) : u.dImplant;
      const list = u.data && imp && !u.data.weak.includes(imp) ? u.data.weak.concat(imp) : (u.data ? u.data.weak : u.weak);
      list.forEach((e, i) => {
        G.elemIcon(c, e, x + i * step, y, r);
        if (e !== imp) return;
        const a = 0.55 + 0.45 * Math.sin(this.t * 6);
        c.strokeStyle = 'rgba(200,170,255,' + a.toFixed(2) + ')'; c.strokeRect(Math.round(x + i * step - r - 2) + 0.5, Math.round(y - r - 2) + 0.5, r * 2 + 3, r * 2 + 3);
      });
    },

    bossHud(c, u) {
      const x = 170, y = 8, w = 300;
      c.fillStyle = 'rgba(4,6,20,0.72)'; c.fillRect(x - 8, y - 2, w + 16, 56);
      c.fillStyle = '#c85050'; c.fillRect(x - 8, y + 53, w + 16, 1);
      G.foeIcon(c, u.data, x - 50, y, 40);
      this.text(u.name, W / 2, y, { align: 'center', size: 13, bold: true, serif: true, col: '#ffe0d0' });
      const f = Math.max(0, u.dHp / u.maxHp);
      this.bar(x, y + 20, w, 9, f, '#d83c3c');
      if (u.dShield > 0) { c.fillStyle = 'rgba(140,200,255,0.9)'; c.fillRect(x, y + 20, Math.min(1, u.dShield / u.maxHp) * w, 3); }
      this.text(Math.ceil(f * 100) + '%', W / 2, y + 20, { align: 'center', size: 9, bold: true });
      this.bar(x, y + 34, w, 4, u.dTough / u.maxTough, u.broken ? '#606060' : '#f4f4f8', '#303038');
      const r = this.bt.pv && this.bt.pv.rows.get(u);
      if (r) { this.previewOnBars(u, r, x, y + 20, 9, y + 34, 4, w); this.previewLabel(r, W / 2, y + 41, 10); }
      this.weakIcons(c, u, x + 8, y + 46, 16, 6);
      const tags = [];
      if (u.broken) tags.push('ПРОБИТ');
      if (u.charging != null) tags.push('ЗАРЯД!');
      for (const d of u.dots) tags.push(H.DOT_NAME[d.type]);
      if (u.frostbite) tags.push('Обморожение');
      this.contonFoeTags(u, tags);
      this.haresFoeTags(u, tags);
      if (tags.length) this.text(tags.join(' · '), x + w, y + 41, { align: 'right', size: 10, bold: true, col: '#ffb060' });
      this.icefirePips(u, x + w - 2, y + 49);
      this.text('ур. ' + u.lvl, x - 30, y + 42, { size: 9, align: 'center', col: C.sub });
    },

    icefirePips(u, rx, cy) {
      const b = this.game.battle || this.lastBattle;
      if (!b || !b.allies.some(a => a.charId === 'miyabi')) return;
      const n = u.dIce == null ? u.flags.icefire || 0 : u.dIce;
      for (let i = 0; i < T.icefireMax; i++) this.diamond(rx - i * 9, cy, 3, u.frostbite ? '#ffffff' : i < n ? '#7ad8ff' : '#203048', '#0a1020');
    },

    moonGlyph(c, x, y, r, stance) {
      c.fillStyle = '#1a1430'; c.beginPath(); c.arc(x, y, r + 1, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#e8dcff'; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#2a2050'; c.beginPath(); c.arc(x + (stance === 'ka' ? r * 0.9 : -r * 0.9), y, r, 0, Math.PI * 2); c.fill();
    },

    previewOnBars(u, r, x, hy, hh, ty, th, w) {
      const c = this.ctx, pulse = 0.5 + 0.35 * Math.sin(this.t * 7);
      const at = v => Math.round(x + w * Math.max(0, Math.min(1, v)));
      const now = at(u.hp / u.maxHp), lo = at((u.hp - r.hpLo) / u.maxHp), hi = at((u.hp - r.hpHi) / u.maxHp);
      c.fillStyle = 'rgba(255,236,190,' + (pulse * 0.45).toFixed(2) + ')'; c.fillRect(hi, hy, lo - hi, hh);
      c.fillStyle = 'rgba(255,255,255,' + pulse.toFixed(2) + ')'; c.fillRect(lo, hy, now - lo, hh);
      if (r.tough > 0 && u.maxTough > 0) {
        const tn = at(u.tough / u.maxTough), ta = at(r.toughAfter / u.maxTough);
        c.fillStyle = r.breaks ? 'rgba(255,190,70,' + pulse.toFixed(2) + ')' : 'rgba(120,150,255,' + pulse.toFixed(2) + ')';
        c.fillRect(ta, ty, tn - ta, th);
      }
    },

    previewLabel(r, cx, y, size) {
      if (r.miss || r.bind != null) {
        const txt = r.miss ? 'Промах' : r.bind > 0 ? 'Связать ' + Math.round(r.bind * 100) + '%' : 'Не связать', w = this.measure(txt, size, true);
        this.ctx.fillStyle = 'rgba(4,6,20,0.7)'; this.ctx.fillRect(Math.round(cx - w / 2 - 3), y - 1, Math.round(w + 6), size + 4);
        this.text(txt, cx - w / 2, y, { size, bold: true, col: r.miss ? '#b8b0d8' : r.bind > 0 ? '#e8d890' : '#a09880' });
        return;
      }
      const parts = [], lo = String(r.lo), hi = String(r.hi);
      parts.push([lo, r.kill ? '#ff6a5a' : '#ffffff']);
      if (r.hi > r.lo) parts.push(['~' + hi, r.kill ? '#ff6a5a' : r.mayKill ? '#ffa080' : '#d8d0c0']);
      if (r.tough > 0) parts.push([' ◆', r.breaks ? '#ffc048' : '#a8b8ff']);
      if (r.seal) parts.push([r.burst ? ' ◈' : ' ◇', r.burst ? '#ff9a40' : '#ffd0a0']);
      const ws = parts.map(p => this.measure(p[0], size, true));
      const total = ws.reduce((a, v) => a + v, 0);
      const c = this.ctx;
      c.fillStyle = 'rgba(4,6,20,0.7)'; c.fillRect(Math.round(cx - total / 2 - 3), y - 1, Math.round(total + 6), size + 4);
      let x = cx - total / 2;
      parts.forEach((p, i) => { this.text(p[0], x, y, { size, bold: true, col: p[1] }); x += ws[i]; });
    },

    fitText(str, size, maxW, bold) {
      let s = str;
      while (s.length > 1 && this.measure(s, size, bold) > maxW) s = s.slice(0, -1);
      return s === str ? s : s.slice(0, -1) + '.';
    },

    drawDamageBoard(c, b) {
      const bt = this.bt;
      if (!bt.dmgBy) return;
      const rows = b.allies.map(u => ({ u, v: bt.dmgBy.get(u) || 0 })).sort((a, z) => z.v - a.v || a.u.idx - z.u.idx);
      const top = Math.max(1, rows[0].v), total = rows.reduce((a, r) => a + r.v, 0);
      const w = 100, x = W - w - 8, y = 38, h = 22 + rows.length * 22;
      c.fillStyle = 'rgba(4,6,20,0.7)'; c.fillRect(x, y, w, h);
      c.fillStyle = 'rgba(242,220,154,0.6)'; c.fillRect(x, y, w, 1);
      c.fillStyle = 'rgba(242,220,154,0.25)'; c.fillRect(x, y + h - 1, w, 1);
      this.text('Урон', x + 6, y + 4, { size: 10, bold: true, serif: true, col: C.gold });
      this.text(H.fmt(total), x + w - 6, y + 5, { align: 'right', size: 9, col: C.sub });
      rows.forEach((r, i) => {
        const ry = y + 21 + i * 22, u = r.u, lead = i === 0 && r.v > 0;
        c.globalAlpha = u.dead ? 0.5 : 1;
        c.fillStyle = G.dark(H.ELEMENTS[u.elem].col, 0.6); c.fillRect(x + 4, ry, 18, 18);
        G.drawPortrait(c, G.lookOf(u.charId, this.game), x + 4, ry, 18);
        const val = H.fmt(r.v), vw = this.measure(val, 9, true);
        this.text(this.fitText(u.name, 9, w - 34 - vw, false), x + 26, ry, { size: 9, col: lead ? C.gold : C.cream });
        this.text(val, x + w - 5, ry, { align: 'right', size: 9, bold: true, col: lead ? C.gold : C.cream });
        c.fillStyle = '#141626'; c.fillRect(x + 26, ry + 13, w - 31, 3);
        c.fillStyle = H.ELEMENTS[u.elem].col; c.fillRect(x + 26, ry + 13, Math.round((w - 31) * r.v / top), 3);
        c.globalAlpha = 1;
      });
    },

    drawTurnOrder(c) {
      const list = this.turnOrder(7);
      if (!list.length) return;
      c.fillStyle = 'rgba(242,220,154,0.45)'; c.fillRect(31, 30, 2, 60 + (list.length - 1) * 42);
      list.forEach((o, i) => {
        const u = o.u, cur = i === 0, size = cur ? 48 : 34, x = cur ? 8 : 15, y = cur ? 8 : 26 + i * 42;
        const ally = u.side === 'ally';
        c.fillStyle = '#000'; c.fillRect(x - 1, y - 1, size + 2, size + 2);
        const gr = c.createLinearGradient(0, y, 0, y + size);
        gr.addColorStop(0, ally ? '#2a4a9a' : '#8a2a2a'); gr.addColorStop(1, ally ? '#101a44' : '#3a0c10');
        c.fillStyle = gr; c.fillRect(x, y, size, size);
        if (u.aha && this.ahaIcon) this.ahaIcon(c, x, y, size);
        else if (u.summon && u.id === 'gynoids') this.gynoidIcon(c, x, y, size);
        else if (u.summon) { if (!this.fivesIcon(c, u, x, y, size)) G.foeIcon(c, { id: 'hecate', boss: true }, x, y, size, { border: false }); }
        else if (ally) G.drawPortrait(c, G.lookOf(u.charId, this.game), x, y, size);
        else G.foeIcon(c, u.data, x, y, size, { border: false });
        c.strokeStyle = cur ? C.brassHi : u.summon ? (u.aha ? '#ff9ae0' : u.id === 'gynoids' ? '#7ab4ff' : u.id === 'lord' ? '#b48aff' : u.id === 'numby' ? '#ffd060' : '#ff6a96') : ally ? '#6a8ad8' : '#d86a6a'; c.lineWidth = cur ? 2 : 1; c.strokeRect(x - 0.5, y - 0.5, size + 1, size + 1); c.lineWidth = 1;
        this.contonRail(c, u, x, y, size);
        if (!cur) { c.fillStyle = 'rgba(4,6,20,0.85)'; c.fillRect(x + size - 14, y + size - 10, 16, 10); this.text(String(o.av), x + size + 1, y + size - 10, { align: 'right', size: 9, bold: true, col: C.cream }); }
        else this.diamond(x + size + 6, y + size / 2, 4, C.brassHi, '#1a1208');
      });
      this.contonRailFx(c);
    },

    cycleBattleSpeed() {
      const cur = this.options.battleSpeed || 1;
      this.options.battleSpeed = BATTLE_SPEEDS.find(v => v > cur) || BATTLE_SPEEDS[0];
      lsSet(OPT_KEY, this.options);
      this.sfx('select');
    },

    drawTopRight(c) {
      const bt = this.bt, speed = (this.options.battleSpeed || 1) * (this.held.includes('ShiftLeft') || this.held.includes('ShiftRight') ? 2 : 1);
      const items = [
        { label: '»' + speed, on: speed > 1, fn: () => this.battleKey(null, 'KeyX') },
        { label: 'АВТО', on: bt.auto, fn: () => this.battleKey(null, 'KeyV') },
        { label: 'II', on: false, fn: () => this.battleKey('back', 'Escape') }
      ];
      items.forEach((it, i) => {
        const x = W - 150 + i * 48, y = 8;
        c.fillStyle = it.on ? 'rgba(242,220,154,0.85)' : 'rgba(4,6,20,0.72)'; c.fillRect(x, y, 44, 22);
        c.strokeStyle = it.on ? '#1a1208' : 'rgba(242,220,154,0.6)'; c.strokeRect(x + 0.5, y + 0.5, 43, 21);
        this.text(it.label, x + 22, y + 5, { align: 'center', size: 11, bold: true, col: it.on ? '#1c1208' : C.cream, shadow: !it.on });
        if (it.fn) this.hit(x, y, 44, 22, it.fn);
      });
    },

    drawAllies(c, b) {
      const bt = this.bt;
      b.allies.forEach((u, i) => {
        const x = 8 + i * 112, lift = u === b.current ? 8 : 0, lunge = (bt.lunge.get(u) || 0) * 40;
        const y = 376 - lift - lunge, dead = u.dead, cur = u === b.current;
        const gr = c.createLinearGradient(0, y, 0, y + 100);
        gr.addColorStop(0, cur ? 'rgba(60,72,160,0.95)' : 'rgba(16,22,62,0.9)'); gr.addColorStop(1, 'rgba(6,8,26,0.95)');
        c.fillStyle = '#000'; c.fillRect(x - 1, y - 1, 110, 102);
        c.fillStyle = gr; c.fillRect(x, y, 108, 100);
        const pr = bt.pv && bt.pv.rows.get(u);
        const tab = bt.pv && bt.pv.ab.target;
        const aimed = (!dead && (tab === 'allies' || (tab === 'self' && cur))) || (bt.allyMode && bt.allyMode.target === u && (!dead || (bt.pv && bt.pv.revive)));
        const border = aimed ? '#80ff90' : cur ? C.brassHi : '#3a4a8a';
        c.strokeStyle = border; c.lineWidth = cur || aimed ? 2 : 1; c.strokeRect(x + 0.5, y + 0.5, 107, 99); c.lineWidth = 1;
        const ec = H.ELEMENTS[u.elem];
        c.fillStyle = G.dark(ec.col, 0.6); c.fillRect(x + 3, y + 3, 58, 58);
        const form = u.dForm != null ? u.dForm : u.flags.nightmare > 0;
        if (form) G.foeIcon(c, { id: 'scar_nightmare', boss: true }, x + 3, y + 3, 58, { border: false });
        else if (!this.contonPortrait(c, u, x + 3, y + 3, 58)) G.drawPortrait(c, G.lookOf(u.charId, this.game), x + 3, y + 3, 58);
        if (bt.flash.has(u)) { c.fillStyle = 'rgba(255,80,80,0.5)'; c.fillRect(x + 3, y + 3, 58, 58); }
        const ready = b.ultReady(u), cx2 = x + 84, cy2 = y + 30;
        if (u.kit.notes) this.noteStaff(c, u, cx2, cy2, ready);
        else {
          const ef = u.energy / u.maxEnergy;
          c.fillStyle = 'rgba(0,0,0,0.6)'; c.beginPath(); c.arc(cx2, cy2, 19, 0, Math.PI * 2); c.fill();
          c.strokeStyle = '#1a1c2c'; c.lineWidth = 5; c.beginPath(); c.arc(cx2, cy2, 17, 0, Math.PI * 2); c.stroke();
          c.strokeStyle = ready ? 'hsl(' + ((this.t * 200) % 360) + ',90%,65%)' : ec.col; c.beginPath(); c.arc(cx2, cy2, 17, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ef); c.stroke(); c.lineWidth = 1;
          if (ready) { const gl = c.createRadialGradient(cx2, cy2, 4, cx2, cy2, 24); gl.addColorStop(0, 'rgba(255,240,180,0.45)'); gl.addColorStop(1, 'rgba(255,240,180,0)'); c.fillStyle = gl; c.fillRect(cx2 - 24, cy2 - 24, 48, 48); }
          G.elemIcon(c, u.elem, cx2, cy2, 9);
        }
        if (ready) this.keycap(cx2 - 7, cy2 + 21, String(i + 1));
        this.text(u.name.length > 12 ? (u.kit && u.kit.short) || u.name.slice(0, 12) : u.name, x + 6, y + 63, { size: 11, bold: true, col: cur ? C.gold : C.cream });
        const gain = pr && (pr.heal > 0 || pr.shield > 0);
        if (gain) this.text(pr.heal > 0 ? '+' + H.fmt(pr.heal) : 'Щит ' + H.fmt(pr.shield), x + 102, y + 64, { size: 9, bold: true, align: 'right', col: pr.heal > 0 ? '#80ffa0' : '#9ad0ff' });
        else if (u.trial) this.text('испыт.', x + 102, y + 63, { size: 9, align: 'right', col: '#ffb060' });
        this.bar(x + 6, y + 79, 96, 6, (u.dHp || 0) / u.maxHp, (u.dHp || 0) / u.maxHp < 0.3 ? '#ff4040' : '#52d67a');
        if (u.dShield > 0) { c.fillStyle = 'rgba(140,200,255,0.95)'; c.fillRect(x + 6, y + 77, Math.min(1, u.dShield / u.maxHp) * 96, 3); }
        if (gain) {
          const pulse = (0.5 + 0.35 * Math.sin(this.t * 7)).toFixed(2);
          if (pr.heal > 0) { const a = Math.round(x + 6 + 96 * u.hp / u.maxHp), z = Math.round(x + 6 + 96 * Math.min(1, (u.hp + pr.heal) / u.maxHp)); c.fillStyle = 'rgba(170,255,190,' + pulse + ')'; c.fillRect(a, y + 79, z - a, 6); }
          if (pr.shield > 0) { c.fillStyle = 'rgba(170,220,255,' + pulse + ')'; c.fillRect(x + 6, y + 77, Math.round(Math.min(1, pr.shield / u.maxHp) * 96), 3); }
        }
        this.text(String(Math.max(0, Math.round(u.dHp || 0))), x + 102, y + 87, { size: 10, bold: true, align: 'right', col: C.cream });
        const tags = [];
        if (u.taunt > 0) tags.push('Пров.');
        if (u.frozen) tags.push('Лёд');
        for (const d of u.dots) tags.push(H.DOT_NAME[d.type]);
        if (u.charId === 'trail_p' && u.flags.magma) tags.push('Магма ' + u.flags.magma);
        if (u.charId === 'himeko' && u.flags.charges) tags.push('Заряд ' + u.flags.charges);
        if (u.charId === 'asta' && u.flags.charge) tags.push('Заряд ' + u.flags.charge);
        if (u.charId === 'yanagi' && u.flags.shinra > 0) tags.push('Синрабансё ' + u.flags.shinra);
        if (b.inHell(u)) tags.push('Ад ' + u.buffs.find(x => x.name === 'Адский пейзаж').turns);
        if (u.kit.notes) tags.push('Послезв. ' + (u.dAfter != null ? u.dAfter : u.flags.after || 0));
        if (u.kit.nbasic && u.flags.nightmare > 0) tags.push('Кошмар ' + u.flags.nightmare);
        if (u.flags.collapse > 0) tags.push('Без сил ' + u.flags.collapse);
        if (u.flags.cover > 0) tags.push('Прикрытие');
        this.inabaTags(u, tags);
        let tx = x + 6;
        if (u.kit.charged) {
          const fr = u.dFrost == null ? u.flags.frost || 0 : u.dFrost;
          for (let k = 0; k < T.frostMax; k++) this.diamond(x + 9 + k * 8, y + 93, 3, k < fr ? '#bfe8ff' : '#20263e', '#0a1020');
          tx = x + 58;
        }
        const pip = PIPS[u.charId];
        if (pip) {
          const n = u[pip[1]] == null ? u.flags[pip[0]] || 0 : u[pip[1]], max = u.flags[pip[2]] || T[pip[2]];
          for (let k = 0; k < max; k++) this.diamond(x + 9 + k * 8, y + 93, 3, k < n ? pip[3] : '#20263e', '#0a1020');
          tx = x + 12 + max * 8;
        }
        if (this.elationCard) tx = this.elationCard(c, u, x, y, tx);
        tx = this.foursCard(c, u, x, y, tags, tx);
        tx = this.contonCard(c, u, x, y, tags, tx);
        tx = this.haresCard(c, u, x, y, tags, tx);
        tx = this.fivesCard(c, u, x, y, tags, tx);
        if (u.flags.collapse > 0 && !dead) { c.fillStyle = 'rgba(40,0,12,0.5)'; c.fillRect(x + 3, y + 3, 58, 58); this.text('Без сил', x + 32, y + 25, { align: 'center', size: 10, bold: true, col: '#ffb8b8' }); }
        if (u.charId === 'yanagi') this.moonGlyph(c, x + 12, y + 12, 6, u.dStance || u.flags.stance);
        if (tags.length) this.text(this.fitText(tags.slice(0, 2).join(' '), 9, x + 74 - tx), tx, y + 88, { size: 9, col: C.gold });
        if (dead) { c.fillStyle = 'rgba(0,0,0,0.65)'; c.fillRect(x, y, 108, 100); this.text('Повержен', x + 54, y + 44, { align: 'center', size: 11, bold: true, col: C.bad }); }
        this.hit(x, y, 108, 100, () => {
          if (bt.allyMode) {
            if (dead && !this.allyChoices().includes(u)) return;
            if (bt.allyMode.target === u) this.battleKey('ok', 'Enter');
            else { bt.allyMode.target = u; this.sfx('select'); }
            return;
          }
          if (b.ultReady(u) && b.phase === 'input') this.doUlt(u);
        });
      });
    },

    roundButton(c, x, y, r, key, label, sub, fn, o = {}) {
      const col = o.col || '#6a8ad8';
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.beginPath(); c.arc(x + 2, y + 3, r + 2, 0, Math.PI * 2); c.fill();
      const gr = c.createRadialGradient(x - r * 0.4, y - r * 0.4, 2, x, y, r);
      gr.addColorStop(0, o.disabled ? '#3a3c4c' : G.light(col, 0.35)); gr.addColorStop(1, o.disabled ? '#16182a' : G.dark(col, 0.45));
      c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      c.strokeStyle = o.disabled ? '#4a4c60' : C.brassHi; c.lineWidth = 2; c.stroke(); c.lineWidth = 1;
      if (o.active) {
        const a = 0.55 + 0.35 * Math.sin(this.t * 5);
        c.strokeStyle = 'rgba(255,236,170,' + a.toFixed(2) + ')'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r + 5, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = 'rgba(255,236,170,0.3)'; c.beginPath(); c.arc(x, y, r + 9, this.t * 2, this.t * 2 + Math.PI * 1.2); c.stroke(); c.lineWidth = 1;
      }
      if (o.icon) o.icon(x, y);
      this.keycap(Math.round(x - r - 4), Math.round(y - r - 2), key);
      this.text(label, x, y + r + 3, { align: 'center', size: 10, bold: true, col: o.disabled ? C.dim : C.cream });
      if (sub) this.text(sub, x, y + r + 15, { align: 'center', size: 9, col: C.sub });
      if (fn) this.hit(x - r, y - r, r * 2, r * 2, fn);
    },

    pill(x, y, w, key, label, fn, o = {}) {
      const c = this.ctx;
      c.fillStyle = '#000'; c.fillRect(x, y, w, 20);
      const gr = c.createLinearGradient(0, y, 0, y + 20);
      if (o.active) { gr.addColorStop(0, '#f2dc9a'); gr.addColorStop(1, '#b08a44'); } else if (o.disabled) { gr.addColorStop(0, '#22243a'); gr.addColorStop(1, '#16182a'); } else { gr.addColorStop(0, '#2a3478'); gr.addColorStop(1, '#141a48'); }
      c.fillStyle = gr; c.fillRect(x + 1, y + 1, w - 2, 18);
      this.keycap(x + 4, y + 4, key);
      this.text(label, x + 22 + (w - 22) / 2, y + 4, { align: 'center', size: 10, bold: true, col: o.active ? '#1c1208' : o.disabled ? C.dim : C.cream, shadow: !o.active });
      if (fn) this.hit(x, y, w, 20, fn);
    },

    drawCommands(c, b) {
      const bt = this.bt, u = b.current;
      const x = 462, y = 336;
      const gr = c.createLinearGradient(x, y, W, HGT);
      gr.addColorStop(0, 'rgba(4,6,20,0)'); gr.addColorStop(0.35, 'rgba(4,6,20,0.62)'); gr.addColorStop(1, 'rgba(4,6,20,0.88)');
      c.fillStyle = gr; c.fillRect(x - 4, y - 6, W - x + 4, HGT - y + 6);
      this.text(String(b.sp), x + 8, y, { size: 26, bold: true, serif: true, col: C.gold });
      this.text('очки навыка', x + 32, y + 4, { size: 9, col: C.sub });
      for (let i = 0; i < T.spMax; i++) this.diamond(x + 38 + i * 14, y + 22, 5, i < b.sp ? C.brassHi : '#20263e', '#1a1208');
      if (b.su && b.su.res.on) this.drawSuOrb(c, b, x + 152, y + 14);
      if (this.drawPunch) this.drawPunch(c, b, x, y);
      const inputOk = b.phase === 'input' && !bt.queue.length && !bt.cur && !bt.result;
      if (u && inputOk && u.side === 'ally') {
        const bab = b.abilityFor(u, 'basic').ab, sab = b.abilityFor(u, 'skill').ab;
        const ec = H.ELEMENTS[u.elem].col, noSp = b.sp < b.skillCost(u) || b.skillLocked(u);
        const canFuse = b.availableFusions().some(f => f.ready);
        this.pill(x + 2, y + 38, 84, 'T', 'Контакт', () => this.battleKey(null, 'KeyT'));
        this.pill(x + 90, y + 38, 84, 'R', 'Слияние', () => this.battleKey(null, 'KeyR'), { disabled: !canFuse, active: canFuse && Math.sin(this.t * 4) > 0 });
        const pick = bt.pick || 'basic', onSkill = pick === 'skill';
        const qr = onSkill ? 20 : 27, er = onSkill ? 27 : 20;
        if (u.kit.charged && !onSkill) this.drawChargeGauge(c, b, u, x + 4, y + 62);
        if (u.kit.personas) this.drawPersonaModes(c, u);
        else if (u.kit.skills && onSkill) this.drawSkillModes(c, u);
        if (u.charId === 'silverwolf' && onSkill) this.drawImplantModes(c, b, u);
        this.roundButton(c, x + 40, y + 92, qr, 'Q', bab.lv ? 'Симоцуки' : 'Атака', TARGET_NAME[bab.target], () => this.battleKey(null, 'KeyQ'), { col: '#5a6ab8', active: !onSkill, disabled: b.basicLocked(u), icon: (ix, iy) => G.statIcon(c, 'atk', ix - 8, iy - 8, 16, '#ffffff') });
        this.roundButton(c, x + 128, y + 92, er, 'E', 'Навык', TARGET_NAME[sab.target], () => this.battleKey(null, 'KeyE'), { col: ec, disabled: noSp, active: onSkill, icon: (ix, iy) => G.pathIcon(c, u.kit.path, ix - 10, iy - 10, 20, '#ffffff') });
        this.fivesCommands(c, b, u, x + 4, y + 62);
        if (bt.allyMode) this.text('←→ союзник', W - 8, y + 17, { align: 'right', size: 9, bold: true, col: C.ok });
        this.drawCastPlate(c, b, u, onSkill ? sab : bab, onSkill);
      } else this.text(bt.auto ? 'Авто-бой' : this.chainOpen() ? 'Цепочка атак' : 'Ход противника…', x + 88, y + 84, { align: 'center', size: 12, col: C.sub });
    },

    drawChargeGauge(c, b, u, x, y) {
      const bt = this.bt, max = b.chargeLevels(u);
      for (let lv = 3; lv >= 1; lv--) {
        const yy = y + (3 - lv) * 13, on = lv <= max, sel = (bt.charge || 0) >= lv;
        c.fillStyle = sel ? '#bfe8ff' : on ? '#2a4a7a' : '#14182a'; c.fillRect(x, yy, 12, 10);
        c.strokeStyle = sel ? '#ffffff' : '#3a4a8a'; c.strokeRect(x + 0.5, yy + 0.5, 11, 9);
        this.text(String(lv), x + 6, yy, { align: 'center', size: 8, bold: true, col: sel ? '#0a1020' : on ? C.cream : C.dim });
        if (on) this.hit(x, yy, 12, 10, () => this.setChargeLevel(sel && (bt.charge || 0) === lv ? lv - 1 : lv));
      }
      if (max) this.text('↑↓', x + 6, y + 40, { align: 'center', size: 8, col: C.sub });
    },

    drawSkillModes(c, u) {
      const sel = u.flags.skillSel | 0, w = 112, x = W - 8 - w, y = 248;
      c.fillStyle = 'rgba(4,6,20,0.82)'; c.fillRect(x, y, w, 56);
      c.fillStyle = 'rgba(242,220,154,0.5)'; c.fillRect(x, y, w, 1);
      this.text(u.kit.skillsTitle || 'Навык Казумы', x + 6, y + 3, { size: 9, bold: true, col: C.gold });
      this.text('↑↓', x + w - 6, y + 3, { size: 9, align: 'right', col: C.sub });
      (u.kit.skillsShort || SKILL_MODE).forEach((name, i) => {
        const yy = y + 16 + i * 13, on = i === sel;
        if (on) { c.fillStyle = 'rgba(242,220,154,0.18)'; c.fillRect(x + 2, yy - 1, w - 4, 13); this.diamond(x + 9, yy + 5, 3, C.brassHi); }
        this.text(name, x + 18, yy, { size: 10, bold: on, col: on ? C.gold : C.cream });
        if (this.skillPunchTag) this.skillPunchTag(u, i, x, yy, w);
        this.hit(x, yy - 1, w, 13, () => this.setSkillMode(i));
      });
    },

    drawImplantModes(c, b, u) {
      const list = b.implantChoices(), t = this.bt.target, cur = b.implantElem(u, t), w = 124, x = W - 8 - w, y = 300 - 18 - list.length * 13;
      c.fillStyle = 'rgba(4,6,20,0.82)'; c.fillRect(x, y, w, 18 + list.length * 13);
      c.fillStyle = 'rgba(200,170,255,0.6)'; c.fillRect(x, y, w, 1);
      this.text('Внести уязвимость', x + 6, y + 3, { size: 9, bold: true, col: '#d8c8ff' });
      this.text('↑↓', x + w - 6, y + 3, { size: 9, align: 'right', col: C.sub });
      list.forEach((e, i) => {
        const yy = y + 16 + i * 13, on = e === cur, has = !!(t && t.data && t.data.weak.includes(e));
        if (on) { c.fillStyle = 'rgba(200,170,255,0.2)'; c.fillRect(x + 2, yy - 1, w - 4, 13); }
        G.elemIcon(c, e, x + 10, yy + 5, 4);
        this.text(H.ELEMENTS[e].name, x + 20, yy, { size: 10, bold: on, col: has ? C.dim : on ? '#efe4ff' : C.cream });
        if (has) this.text('уже есть', x + w - 6, yy + 1, { size: 8, align: 'right', col: C.dim });
        this.hit(x, yy - 1, w, 13, () => { b.setImplant(u, e); this.sfx('select'); });
      });
    },

    drawCastPlate(c, b, u, ab, onSkill) {
      const pv = this.bt.pv;
      const kind = onSkill ? 'Навык' : (pv && pv.kind === 'enhanced' ? 'Усиленная атака' : 'Атака');
      const cab = pv ? pv.ab : ab, name = pv && pv.revive ? 'Воскрешение · ' + T.reviveSp + ' очка' : cab.name + (cab.lv ? ' · ур. ' + cab.lv : '');
      const extra = pv && pv.bounce ? ' +' + pv.bounce + ' отск.' : '';
      const capW = Math.max(14, Math.round(this.measure('Пробел', 9, true) + 8));
      const nw = this.measure(name + extra, 10, true), kw = this.measure(kind, 9, false);
      const w = Math.round(Math.min(300, capW + nw + kw + 26)), x = W - 8 - w, y = 308;
      c.fillStyle = 'rgba(4,6,20,0.82)'; c.fillRect(x, y, w, 21);
      c.fillStyle = onSkill ? H.ELEMENTS[u.elem].col : C.brassHi; c.fillRect(x, y, 2, 21);
      c.fillStyle = 'rgba(242,220,154,0.5)'; c.fillRect(x, y + 20, w, 1);
      this.keycap(x + 6, y + 4, 'Пробел');
      this.text(kind, x + capW + 12, y + 5, { size: 9, col: C.sub });
      this.text(this.fitText(name + extra, 10, w - capW - kw - 22, true), x + capW + kw + 18, y + 4, { size: 10, bold: true, col: onSkill ? C.gold : C.cream });
      this.hit(x, y, w, 21, () => this.battleKey('ok', 'Enter'));
    },

    drawSub(c) {
      const bt = this.bt, opts = this.subOptions(), b = this.game.battle;
      const title = { contact: 'Контакт — ' + (bt.target ? bt.target.name : ''), fusion: 'Слияние', pause: 'Пауза', aoa: 'Все враги пробиты!' }[bt.sub.type];
      const h = 48 + opts.length * 26;
      c.fillStyle = 'rgba(2,3,12,0.45)'; c.fillRect(0, 0, W, HGT);
      if (bt.sub.type === 'contact' && b && b.current) G.drawBust(c, G.lookOf(b.current.charId, this.game), 60, 196 - h / 2 - 6, 2);
      this.win(W / 2 - 160, 200 - h / 2, 340, h, { title });
      this.list(W / 2 - 150, 216 - h / 2, 320, opts, bt.sub.sel, { rowH: 26, onClick: i => { bt.sub.sel = i; this.subKey('ok'); } });
      if (bt.sub.type === 'contact') this.text('Исход решают 3 очка одного настроения.', W / 2 + 10, 200 + h / 2 - 18, { align: 'center', size: 10, col: C.sub });
    },

    drawResult(c) {
      const out = this.bt.result, g = this.game;
      if (out.su) { this.drawSuResult(c, out); return; }
      if (out.fh) { this.drawFhResult(c, out); return; }
      c.fillStyle = 'rgba(2,3,12,0.62)'; c.fillRect(0, 0, W, HGT);
      if (out.lost) {
        this.win(W / 2 - 180, 150, 360, 160, { title: 'Поражение', border: '#d86060' });
        this.text('Команда не выдержала…', W / 2, 176, { align: 'center', serif: true, size: 14 });
        this.loseOptions(out).forEach((o, i) => this.button(W / 2 - 150, 212 + i * 34, 300, 26, o.label, () => this.loseChoice(i), { active: (this.bt.loseSel || 0) === i }));
        return;
      }
      if (out.fled) { this.win(W / 2 - 130, 190, 260, 80, { title: 'Отступление' }); this.hints([['Enter', 'Продолжить']], W / 2, 232, { align: 'center' }); this.hit(0, 0, W, HGT, () => this.closeResult()); return; }
      this.win(W / 2 - 230, 60, 460, 360, { title: 'Победа' });
      let mx = W / 2 - 200;
      mx += this.money(mx, 84, 'exp2', 'Опыт +' + out.exp) + 18;
      mx += this.money(mx, 84, 'credits', '+' + H.fmt(out.credits)) + 18;
      if (out.jade) this.money(mx, 84, 'jade', '+' + out.jade);
      g.state.party.slice(0, 4).forEach((k, i) => {
        const x = W / 2 - 212 + i * 106, r = g.state.roster[k], kid = g.kitOf(k);
        this.portraitCard(c, G.lookOf(kid, g), x + 18, 112, 64, { elem: H.CHARS[kid].elem });
        this.text(this.shortName(k), x + 50, 182, { align: 'center', size: 11, bold: true });
        this.text('ур. ' + r.lvl, x + 50, 197, { align: 'center', size: 10, col: C.sub });
        this.rail(x + 12, 216, 76, r.exp / H.expToNext(r.lvl), '#80c0ff');
        if (out.levelUps.some(l => l.key === k)) this.text('▲ Новый уровень', x + 50, 226, { align: 'center', size: 10, bold: true, col: C.ok });
      });
      const items = out.items || [];
      if (items.length) this.text('Добыча', W / 2 - 212, 250, { size: 12, bold: true, serif: true, col: C.gold });
      items.slice(0, 6).forEach((it, i) => this.text('◆ ' + it, W / 2 - 206, 270 + i * 15, { size: 11 }));
      (out.lines || []).forEach((l, i) => this.text(l, W / 2, 364 + i * 14, { align: 'center', size: 11, col: C.pink }));
      this.hints([['Enter', 'Продолжить']], W / 2, 394, { align: 'center' });
      this.hit(0, 0, W, HGT, () => this.closeResult());
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
