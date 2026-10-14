(function (T) {
  'use strict';
  const { IN, clamp, lerp, FONT_H, FONT_T, SCREENS } = T;

  const ARROW = { f: '→', b: '←', u: '↑', d: '↓', df: '↘', db: '↙', uf: '↗', ub: '↖', n: '☆' };
  const REQ = { ws: 'встав.', ss: 'уход', run: 'бег', air: 'в прыжке', down: 'лёжа', bt: 'спиной', fc: 'присед' };
  const LV = { h: 'В', m: 'С', sm: 'С', l: 'Н', t: 'бр.', u: 'НБ', x: '—' };

  function cmdText(c, def) {
    if (!c) return '';
    let s = c.replace(/^~/, '');
    const m = s.match(/^(ss|ws|run|bt|fc|air|down|st:[a-z0-9]+)\s+/);
    let pre = '';
    if (m) {
      const r = m[1];
      if (r.startsWith('st:')) { const st = r.slice(3); pre = (def && def.stances && def.stances[st] ? stanceName(def, st) : st) + ': '; }
      else pre = (REQ[r] || r) + ' ';
      s = s.slice(m[0].length);
    }
    const parts = s.split(',').map(p => p.split('+').map(x => ARROW[x] || x).join('+'));
    return pre + parts.join(' ');
  }

  function stanceName(def, st) {
    const mv = def.moves.find(m => m.stance === st && m.l === 'x');
    return mv ? mv.n.replace(/^Стойка\s*/i, '').replace(/[«»]/g, '') : st;
  }

  function plural(n, one, few, many) {
    const a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return one;
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
    return many;
  }

  function inputText(bits) {
    const d = T.dirOf(bits);
    const dir = { 5: '', 6: '→', 4: '←', 8: '↑', 2: '↓', 3: '↘', 1: '↙', 9: '↗', 7: '↖' }[d];
    const b = [];
    if (bits & IN.P1) b.push('1'); if (bits & IN.P2) b.push('2'); if (bits & IN.K3) b.push('3'); if (bits & IN.K4) b.push('4');
    return (dir + (b.length ? (dir ? '+' : '') + b.join('+') : '')) || '☆';
  }

  const DUMMY = [['stand', 'Стоит'], ['crouch', 'Сидит'], ['jump', 'Прыгает'], ['guard', 'Блок всего'], ['rguard', 'Случайный блок'], ['cpu', 'Компьютер'], ['p2', 'Игрок 2']];

  class FightScreen {
    constructor(ui, a) {
      this.ui = ui; this.a = a;
      this.mode = a.mode || 'vs';
      this.paused = false; this.pauseSel = 0; this.pauseView = 'menu';
      this.msgs = [];
      this.combo = [null, null];
      this.hpShow = [1, 1]; this.hpLag = [0, 0];
      this.slowTick = 0;
      this.endT = -1;
      this.inputLog = [];
      this.dummy = a.dummy || 'stand';
      this.adv = null; this.advTrack = null;
      this.lastDmg = 0; this.comboDmg = 0;
      this.practiceRefill = 0;
      this.listScroll = 0;
      this.drill = a.drill ? { i: 0, ok: 0, t: 0 } : null;
      this.flash = 0;
      this.introCam = 0;
      this.setup();
    }

    setup() {
      const a = this.a, ui = this.ui;
      const defs = a.p.map(p => p.def);
      const fo = a.p.map(p => ({ hp: p.hp === null ? undefined : p.hp, hpMul: p.hpMul, dmgMul: p.dmgMul }));
      const seed = (a.seed || (Date.now() & 0xffff)) >>> 0;
      this.match = new T.Match(defs, {
        rounds: a.rounds || ui.save.opts.rounds, time: a.time === undefined ? ui.save.opts.time : a.time,
        seed, fighters: fo, mimicPool: T.mimicPool(), skipIntro: !!a.skipIntro || this.mode === 'practice',
        keepHp: !!a.keepHp, maxRounds: a.maxRounds
      });
      if (this.mode === 'practice') { this.match.roundFrames = 0; this.match.timer = 0; }
      this.match.fs.forEach((f, i) => {
        const p = a.p[i];
        if (!p.human) f.brain = new T.Brain(p.level === undefined ? 2 : p.level, seed * (i + 3) + 17, { aggro: p.aggro });
      });
      this.anims = this.match.fs.map(f => new T.Animator(f));
      this.looks = a.p.map(p => T.lookFor(p.def, p.costume || 0));
      this.stage = T.STAGE[a.stage] || T.STAGE.dojo;
      this.ui.scene.setStage(this.stage);
      this.ui.scene.parts.length = 0;
      this.ui.scene.cam = null;
      this.ui.audio.music(this.stage.music);
      this.hpShow = this.match.fs.map(f => f.hp / f.maxHp);
      this.dispHp = this.match.fs.map(f => f.hp);
    }

    leave() { }

    humans() { return this.a.p.map((p, i) => p.human ? i : -1).filter(i => i >= 0); }

    input(act, pl) {
      if (this.paused) return this.pauseInput(act, pl);
      if (act === 'start' || act === 'back' && this.backPauses()) { this.openPause(); return; }
      if (this.mode === 'demo' && (act === 'ok' || act === 'start')) { this.a.onEnd({ demo: true }); }
    }

    backPauses() { return true; }

    rawKey(code) {
      if (code === 'Escape' || code === 'F1') { if (this.paused) this.pauseInput('back'); else this.openPause(); return true; }
      if (this.mode === 'practice' && !this.paused && code === 'Backspace') { this.resetPractice(); return true; }
      return false;
    }

    openPause() {
      if (this.mode === 'demo') { this.a.onEnd({ demo: true }); return; }
      this.paused = true; this.pauseSel = 0; this.pauseView = 'menu';
      this.ui.audio.play('menu');
    }

    pauseItems() {
      const it = [['resume', 'Продолжить'], ['moves', 'Список приёмов']];
      if (this.mode === 'practice') {
        it.push(['dummy', 'Манекен: ' + DUMMY.find(d => d[0] === this.dummy)[1]]);
        it.push(['dlevel', 'Уровень манекена: ' + ((this.a.p[1].level || 2) + 1)]);
        it.push(['drill', this.drill ? 'Разучивание: вкл' : 'Разучивание: выкл']);
        it.push(['reset', 'Сбросить позиции']);
        it.push(['charsel', 'Сменить бойцов']);
      } else if (this.mode === 'vs' || this.mode === 'team') it.push(['restart', 'Начать заново']);
      it.push(['quit', this.mode === 'arcade' || this.mode === 'ta' || this.mode === 'survival' ? 'Сдаться и выйти' : 'Выйти в меню']);
      return it;
    }

    pauseInput(act) {
      const ui = this.ui;
      if (this.pauseView === 'moves') {
        if (act === 'back' || act === 'ok' || act === 'start') { this.pauseView = 'menu'; ui.audio.play('back'); }
        if (act === 'down') this.listScroll++;
        if (act === 'up') this.listScroll = Math.max(0, this.listScroll - 1);
        if (act === 'left' || act === 'right') { this.listSide = this.listSide ? 0 : 1; this.listScroll = 0; }
        return;
      }
      const items = this.pauseItems();
      if (act === 'up') { this.pauseSel = (this.pauseSel + items.length - 1) % items.length; ui.audio.play('menu'); }
      if (act === 'down') { this.pauseSel = (this.pauseSel + 1) % items.length; ui.audio.play('menu'); }
      if (act === 'back' || act === 'start') { this.paused = false; ui.audio.play('back'); return; }
      const id = items[this.pauseSel][0];
      if (act === 'left' || act === 'right') {
        const d = act === 'left' ? -1 : 1;
        if (id === 'dummy') { const i = DUMMY.findIndex(x => x[0] === this.dummy); this.dummy = DUMMY[(i + d + DUMMY.length) % DUMMY.length][0]; this.applyDummy(); ui.audio.play('menu'); }
        if (id === 'dlevel') { this.a.p[1].level = clamp((this.a.p[1].level || 2) + d, 0, 4); this.applyDummy(); ui.audio.play('menu'); }
        return;
      }
      if (act !== 'ok') return;
      ui.audio.play('ok');
      if (id === 'resume') this.paused = false;
      else if (id === 'moves') { this.pauseView = 'moves'; this.listScroll = 0; this.listSide = 0; }
      else if (id === 'dummy') { const i = DUMMY.findIndex(x => x[0] === this.dummy); this.dummy = DUMMY[(i + 1) % DUMMY.length][0]; this.applyDummy(); }
      else if (id === 'dlevel') { this.a.p[1].level = ((this.a.p[1].level || 2) + 1) % 5; this.applyDummy(); }
      else if (id === 'drill') { this.drill = this.drill ? null : { i: 0, ok: 0, t: 0 }; }
      else if (id === 'reset') { this.resetPractice(); this.paused = false; }
      else if (id === 'charsel') this.a.onEnd({ charsel: true });
      else if (id === 'restart') { this.a.restart(); }
      else if (id === 'quit') this.a.onEnd({ quit: true });
    }

    applyDummy() {
      const f = this.match.fs[1];
      f.brain = null;
      if (this.dummy === 'cpu') f.brain = new T.Brain(this.a.p[1].level || 2, 99);
    }

    resetPractice() {
      const m = this.match;
      m.fs.forEach((f, i) => { f.reset(); f.hp = f.maxHp; f.pos = [i ? 1.15 : -1.15, 0, 0]; f.yaw = i ? Math.PI : 0; });
      m.throwS = null; m.camA = 0; m.hitstop = 0;
      this.ui.scene.cam = null;
      this.applyDummy();
    }

    dummyBits(f) {
      const d = this.dummy, t = this.match.frame;
      if (d === 'crouch') return IN.D | IN.B;
      if (d === 'jump') return t % 50 < 3 ? IN.U : 0;
      if (d === 'guard' || d === 'rguard') {
        const o = f.opp;
        if (o.state === 'move' && o.move && o.move.l === 'l' && (d === 'guard' || (this.rg === undefined ? (this.rg = Math.random() < 0.5) : this.rg))) return IN.D | IN.B;
        if (o.state !== 'move') this.rg = undefined;
        return IN.B;
      }
      if (d === 'p2') return this.match.relInput(1, this.ui.bitsFor(1, false));
      return 0;
    }

    step() {
      if (this.paused) return;
      const ui = this.ui, m = this.match;
      this.slowTick++;
      if (m.slow > 0 && m.phase !== 'fight' && this.slowTick % 3 !== 0) { this.tickVisual(false); return; }
      const hs = this.humans();
      const shared = hs.length === 1;
      const inputs = m.fs.map((f, i) => {
        if (!this.a.p[i].human) return 0;
        const pi = shared ? 0 : i;
        return m.relInput(i, ui.bitsFor(pi, shared));
      });
      if (this.mode === 'practice' && this.dummy !== 'cpu') inputs[1] = this.dummyBits(m.fs[1]);
      if (this.mode === 'practice' && hs.length) {
        const b = inputs[0];
        const prev = this.prevIn || 0;
        if (b !== prev && (b & T.BTN || T.dirOf(b) !== T.dirOf(prev))) { this.inputLog.unshift({ s: inputText(b), t: 0 }); if (this.inputLog.length > 14) this.inputLog.pop(); }
        this.prevIn = b;
      }
      m.step(inputs);
      this.events(m.events);
      this.tickVisual(true);
      if (this.mode === 'practice') this.practiceTick();
      if (m.phase === 'over') {
        if (this.endT < 0) this.endT = 0;
        this.endT++;
        if (this.endT === 70) this.finish();
      }
    }

    tickVisual(simStepped) {
      for (const a of this.anims) a.update();
      const sc = this.ui.scene;
      sc.tickParts();
      if (sc.stage) T.ambientTick(sc, sc.stage, sc.cam || { at: [0, 1, 0] }, this.ui.clock);
      this.updateCam();
      const m = this.match;
      m.fs.forEach((f, i) => {
        const r = f.hp / f.maxHp;
        if (r < this.hpShow[i]) {
          const inCombo = f.state === 'hit' || f.state === 'air' || f.state === 'thrown' || f.state === 'crumple' || m.hitstop > 0;
          if (!inCombo) this.hpLag[i]++;
          if (this.hpLag[i] > 30) this.hpShow[i] = Math.max(r, this.hpShow[i] - 0.012);
        } else { this.hpShow[i] = r; this.hpLag[i] = 0; }
      });
      for (const c of this.combo) if (c) c.t++;
      this.msgs = this.msgs.filter(msg => ++msg.t < msg.d);
      if (this.flash > 0) this.flash = Math.max(0, this.flash - 0.08);
      if (this.stage.storm && Math.random() < 0.004) { this.flash = 0.55; setTimeout(() => this.ui.audio.play('quake'), 300); }
    }

    updateCam() {
      const m = this.match, sc = this.ui.scene;
      let cam = sc.cameraFor(m);
      const fs = m.fs;
      if (m.phase === 'intro' && fs.length === 2) {
        const who = m.pt < 65 ? fs[0] : fs[1];
        const k = (m.pt % 65) / 65;
        const ang = who.yaw + (who === fs[0] ? 0.8 : -0.8) + k * 0.6;
        const d = 2.2 - k * 0.4;
        const sz = who.B.size || 1;
        cam = { eye: [who.pos[0] + Math.cos(ang) * d, 1.2 * sz + 0.2 - k * 0.2, who.pos[2] + Math.sin(ang) * d], at: [who.pos[0], 1.05 * sz, who.pos[2]], fov: 0.6 };
        sc.updateCamera(cam, m.pt % 65 === 0);
        return;
      }
      if (m.phase === 'roundEnd' && m.roundWinner >= 0) {
        const w = fs[m.roundWinner];
        const k = Math.min(1, m.pt / 150);
        const ang = w.yaw + 0.9 - k * 0.6;
        const sz = w.B.size || 1;
        cam = { eye: [w.pos[0] + Math.cos(ang) * 2.6, 1.3 * sz, w.pos[2] + Math.sin(ang) * 2.6], at: [w.pos[0], 1.0 * sz, w.pos[2]], fov: 0.62 };
        sc.updateCamera(cam, m.pt === 1);
        return;
      }
      if (m.phase === 'ko' && m.slow > 0) {
        const v = fs.find(f => f.hp <= 0) || fs[0];
        cam.at = [lerp(cam.at[0], v.pos[0], 0.4), cam.at[1], lerp(cam.at[2], v.pos[2], 0.4)];
        cam.fov = 0.6;
      }
      sc.updateCamera(cam);
    }

    events(evs) {
      const ui = this.ui, au = ui.audio, sc = ui.scene, m = this.match;
      for (const e of evs) {
        switch (e.type) {
          case 'hit': {
            au.play(e.ch ? 'hitCH' : e.heavy ? 'hitH' : e.dmg >= 10 ? 'hitM' : 'hitL');
            sc.spawn(e.ch ? 'ch' : 'hit', e.pos, { big: e.heavy });
            if (e.heavy && ui.save.opts.shake) sc.shake(0.05 + e.dmg * 0.003);
            if (e.heavy && Math.random() < 0.6) au.voice(e.d.def.voice, 'hurt');
            const side = e.a.idx;
            const c = this.combo[side];
            if (c && c.t < 80 && e.d.combo.hits > 1) { c.hits = e.d.combo.hits; c.dmg = e.d.combo.dmg; c.t = 0; }
            else this.combo[side] = { hits: e.d.combo.hits, dmg: e.d.combo.dmg, t: 0 };
            if (e.ch && ui.save.opts.chText) this.msg('КОНТРУДАР!', 36, side ? 'r' : 'l', '#ff5040', 16);
            this.lastDmg = e.dmg;
            if (this.mode === 'practice') this.trackAdv(e.a, e.d);
            break;
          }
          case 'block': au.play('block'); sc.spawn('block', e.pos); if (this.mode === 'practice') this.trackAdv(e.a, e.d); break;
          case 'whiff': au.play(e.m.anim && e.m.anim.arch === 'sword' ? 'sword' : 'whoosh', { f: e.m.anim && e.m.anim.arch === 'kick' ? 600 : 1100, k: 0.8 }); break;
          case 'start': {
            const mv = e.m;
            if (mv.l === 'x') break;
            if (mv.anim && mv.anim.arch === 'sword') au.play('sword');
            const big = mv.launch || mv.d >= 20 || mv.l === 'u';
            if (big || (mv.d >= 12 && Math.random() < 0.45) || Math.random() < 0.12) au.voice(e.f.def.voice, big ? 'big' : 'atk');
            break;
          }
          case 'grab': au.play('grab'); au.voice(e.a.def.voice, 'throw'); break;
          case 'chain': au.play('grab'); au.voice(e.a.def.voice, 'big'); this.msg('СВЯЗКА ' + e.part, 40, e.a.idx ? 'r' : 'l', '#ffd040', 18); break;
          case 'throwHit': au.play(e.big ? 'slam' : 'hitM'); if (e.big) sc.spawn('dust', e.d.pos, { big: true }); { const s2 = this.combo[e.a.idx]; this.combo[e.a.idx] = { hits: e.d.combo.hits, dmg: e.d.combo.dmg, t: 0 }; void s2; } break;
          case 'shake': if (ui.save.opts.shake) sc.shake(e.s * 0.012); break;
          case 'break': au.play('break'); this.msg('ВЫРВАЛСЯ!', 50, e.d.idx ? 'r' : 'l', '#80e0ff', 20); break;
          case 'thud': au.play('thud', { k: e.big ? 1.3 : 1 }); sc.spawn('dust', e.f.pos, { big: true, col: this.dustCol() }); break;
          case 'bounce': au.play('land'); sc.spawn('dust', e.f.pos, { col: this.dustCol() }); break;
          case 'land': au.play('land'); break;
          case 'dash': case 'bdash': au.play('step'); break;
          case 'tech': au.play('tech'); sc.spawn('dust', e.f.pos, { col: this.dustCol() }); break;
          case 'parry': au.play('parry'); sc.spawn('parry', e.pos, { big: true }); this.msg('ПАРИРОВАНИЕ', 50, e.f.idx ? 'r' : 'l', '#80ff90', 18); break;
          case 'heal': au.play('heal'); break;
          case 'buff': au.play('buff'); this.msg('СИЛА!', 50, e.f.idx ? 'r' : 'l', '#ffb020', 18); break;
          case 'tele': au.play('tele'); sc.spawn('dust', e.f.pos, { big: true, col: [0.3, 0.3, 0.4] }); break;
          case 'fx': this.fx(e); break;
          case 'round': this.roundMsg(e); break;
          case 'fight': au.play('gong'); au.say('Fight!'); this.msg('БОЙ!', 60, 'c', '#ffe040', 96, true); break;
          case 'ko': au.play('ko'); if (e.d) au.voice(e.d.def.voice, 'ko'); au.say(this.doubleKO() ? 'Double K.O.' : 'K.O.'); this.flash = 0.8; this.msg(this.doubleKO() ? 'ДВОЙНОЙ K.O.' : 'K.O.', 110, 'c', '#ff3020', 120, true); break;
          case 'timeup': au.say('Time up!'); this.msg('ВРЕМЯ!', 90, 'c', '#ffe040', 96, true); break;
          case 'roundEnd': this.roundEndMsg(e.result); break;
        }
      }
    }

    dustCol() { const f = this.stage.floor; return f.kind === 'snow' ? [0.95, 0.95, 1] : f.kind === 'sand' ? [0.85, 0.75, 0.55] : f.kind === 'grass' ? [0.5, 0.55, 0.4] : [0.7, 0.66, 0.6]; }

    doubleKO() { return this.match.fs.every(f => f.hp <= 0); }

    fx(e) {
      const f = e.f, sc = this.ui.scene, au = this.ui.audio;
      const c = Math.cos(f.yaw), s = Math.sin(f.yaw);
      const sz = f.B.size || 1;
      const mf = f.mf - e.m.st;
      if (e.kind === 'fire') {
        if (mf % 2 === 0) for (let i = 0; i < 3; i++) { const d = 0.4 + Math.random() * 0.6 + mf * 0.08; sc.spawn('fire', [f.pos[0] + c * d * sz, 1.5 * sz - d * 0.2 + Math.random() * 0.2, f.pos[2] + s * d * sz], { v: [c * 0.06, 0.004, s * 0.06], s: 0.25 + Math.random() * 0.2 }); }
        if (mf % 6 === 0) au.play('fire');
      } else if (e.kind === 'steam') {
        if (mf === 0) au.play('steam');
        for (let i = 0; i < 4; i++) { const a = Math.random() * 6.28; sc.spawn('dust', [f.pos[0] + Math.cos(a) * 0.4, 0.6 + Math.random(), f.pos[2] + Math.sin(a) * 0.4], { col: [0.95, 0.95, 1] }); }
      } else if (e.kind === 'rocket') {
        if (mf === 0) au.play('rocket');
        sc.spawn('fire', [f.pos[0] + c * (0.5 + mf * 0.4), 1.3 * sz, f.pos[2] + s * (0.5 + mf * 0.4)], { s: 0.2 });
      } else if (e.kind === 'quake') {
        if (mf === 0) { au.play('quake'); if (this.ui.save.opts.shake) sc.shake(0.25); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28; sc.spawn('dust', [f.pos[0] + Math.cos(a) * 1.2, 0.05, f.pos[2] + Math.sin(a) * 1.2], { big: false, col: this.dustCol() }); } }
      } else if (e.kind === 'charge') {
        if (mf === 0) au.play('charge');
      } else if (e.kind === 'spark') {
        if (mf === 0) { au.play('parry'); sc.spawn('hit', [f.pos[0] + c * 0.7 * sz, 1.4 * sz, f.pos[2] + s * 0.7 * sz], { big: true }); }
      }
    }

    roundMsg(e) {
      const au = this.ui.audio;
      if (e.n > 1 || this.match.phase === 'ready') this.ui.scene.cam = null;
      const final = e.final;
      const say = final ? 'Final round' : 'Round ' + ['one', 'two', 'three', 'four', 'five', 'six', 'seven'][Math.min(6, e.n - 1)];
      const delay = this.match.phase === 'intro' ? 130 : 0;
      this.pendingRound = { t: delay, say, text: final ? 'ФИНАЛЬНЫЙ РАУНД' : 'РАУНД ' + e.n };
    }

    roundEndMsg(r) {
      const au = this.ui.audio, m = this.match;
      if (r.draw) { this.msg('НИЧЬЯ', 120, 'c', '#e0e0e0', 90, true); au.say('Draw'); return; }
      const w = m.fs[r.winner];
      if (r.perfect) { this.msg('ИДЕАЛЬНО!', 130, 'c', '#ffe040', 90, true); au.say('Perfect!'); }
      else if (r.great) { this.msg('ОТЛИЧНО!', 130, 'c', '#ffe040', 90, true); au.say('Great!'); }
      setTimeout(() => { au.voice(w.def.voice, 'win'); }, 400);
      this.winText = { name: w.def.short, t: 0 };
    }

    msg(text, dur, pos, col, size, big) { this.msgs.push({ text, d: dur, t: 0, pos, col, size, big }); }

    trackAdv(a, d) { this.advTrack = { a, d, af: -1, df: -1, start: this.match.frame }; }

    practiceTick() {
      const m = this.match;
      const tr = this.advTrack;
      if (tr) {
        const free = f => T.FREE.has(f.state) && f.state !== 'move';
        if (tr.af < 0 && free(tr.a)) tr.af = m.frame;
        if (tr.df < 0 && free(tr.d)) tr.df = m.frame;
        if (tr.af >= 0 && tr.df >= 0) { this.adv = { v: tr.df - tr.af, t: 0, att: tr.a.idx }; this.advTrack = null; }
        if (m.frame - tr.start > 240) this.advTrack = null;
      }
      if (this.adv) this.adv.t++;
      const f0 = m.fs[0], f1 = m.fs[1];
      const quiet = T.FREE.has(f1.state) && T.FREE.has(f0.state);
      this.practiceRefill = quiet ? this.practiceRefill + 1 : 0;
      if (this.practiceRefill > 90) { f0.hp = f0.maxHp; f1.hp = f1.maxHp; }
      if (this.drill) {
        const list = this.drillList();
        const target = list[this.drill.i % list.length];
        this.drill.t++;
        if (f0.state === 'move' && f0.move && f0.move.id === target.id && this.drill.lastSerial !== f0.moveSerial) {
          this.drill.lastSerial = f0.moveSerial;
          this.drill.ok = 60; this.drill.i++; this.ui.audio.play('coin');
        }
        if (this.drill.ok > 0) this.drill.ok--;
      }
    }

    drillList() {
      if (!this._drill) {
        const d = this.match.fs[0].sd;
        this._drill = this.match.fs[0].ms.list.filter(mv => mv.c && !mv.getup && mv.id !== 'ram' && !mv.p.req || mv.c && mv.p.req === 'ws');
        const own = new Set((d.moves || []).map(mv => mv.id));
        this._drill.sort((a, b) => (own.has(b.id) ? 1 : 0) - (own.has(a.id) ? 1 : 0));
      }
      return this._drill;
    }

    finish() {
      const m = this.match;
      const w = m.matchWinner;
      const f = w >= 0 ? m.fs[w] : null;
      this.a.onEnd({ winner: w, hp: f ? f.hp : 0, maxHp: f ? f.maxHp : 1, frames: m.frame, fighters: m.fs });
    }

    items() {
      const m = this.match;
      return this.anims.map((an, i) => {
        const f = m.fs[i];
        return { key: 'f' + i + ':' + (this.a.p[i].costume || 0) + ':' + f.def.id, look: this.looks[i], j: an.j, B: an.B, pos: f.pos, yaw: f.yaw, lying: f.isLying(), size: f.B.size };
      });
    }

    draw(g, W, H) {
      const ui = this.ui;
      if (this.pendingRound) {
        this.pendingRound.t--;
        if (this.pendingRound.t <= 0) {
          ui.audio.say(this.pendingRound.say);
          this.msg(this.pendingRound.text, 70, 'c', '#f0f0f0', 72, true);
          this.pendingRound = null;
        }
      }
      if (ui.glOk) {
        const tint = this.flash > 0 ? [1 + this.flash, 1 + this.flash, 1 + this.flash * 1.2] : null;
        ui.scene.render(this.items(), { tint });
      }
      if (this.mode !== 'demo' || true) this.hud(g, W, H);
      if (this.paused) this.drawPause(g, W, H);
    }

    hud(g, W, H) {
      const ui = this.ui, m = this.match, S = ui.S;
      if (this.mode === 'demo') {
        if ((ui.clock >> 5) % 2) ui.text('ДЕМОНСТРАЦИЯ — НАЖМИТЕ START', W / 2, H - 24 * S, 16 * S, '#ffe040', 'center', FONT_H, { stroke: 4 });
      }
      const top = 14 * S, bh = 20 * S, bw = W * 0.38, gap = W * 0.07;
      for (let i = 0; i < 2 && i < m.fs.length; i++) {
        const f = m.fs[i];
        const x0 = i === 0 ? W / 2 - gap / 2 - bw : W / 2 + gap / 2;
        this.lifeBar(g, x0, top, bw, bh, f, i);
        const nx = i === 0 ? x0 : x0 + bw;
        ui.text(f.def.short, nx, top + bh + 22 * S, 18 * S, '#fff', i === 0 ? 'left' : 'right', FONT_H, { italic: true, stroke: 4 });
        if (f.sd !== f.def) ui.text('стиль: ' + f.sd.short, nx + (i === 0 ? 1 : -1) * 0, top + bh + 38 * S, 11 * S, '#e8c070', i === 0 ? 'left' : 'right', FONT_T, { stroke: 3 });
        const need = m.roundsToWin;
        for (let k = 0; k < need; k++) {
          const cx = i === 0 ? W / 2 - gap / 2 - 14 * S - k * 18 * S : W / 2 + gap / 2 + 14 * S + k * 18 * S;
          const cy = top + bh + 14 * S;
          g.save(); g.translate(cx, cy); g.rotate(Math.PI / 4);
          g.fillStyle = m.wins[i] > k ? '#ffd040' : 'rgba(0,0,0,0.6)'; g.strokeStyle = '#e8a430'; g.lineWidth = 2;
          g.fillRect(-5 * S, -5 * S, 10 * S, 10 * S); g.strokeRect(-5 * S, -5 * S, 10 * S, 10 * S);
          g.restore();
        }
        const c = this.combo[i];
        if (c && c.hits >= 2 && c.t < 90) {
          const x = i === 0 ? 20 * S : W - 20 * S;
          const a = c.t > 70 ? 1 - (c.t - 70) / 20 : 1;
          g.globalAlpha = a;
          ui.text(c.hits + ' ' + plural(c.hits, 'УДАР', 'УДАРА', 'УДАРОВ'), x, H * 0.36, 30 * S, '#ffe040', i === 0 ? 'left' : 'right', FONT_H, { italic: true, stroke: 5 });
          ui.text('УРОН: ' + c.dmg, x, H * 0.36 + 22 * S, 16 * S, '#fff', i === 0 ? 'left' : 'right', FONT_H, { italic: true, stroke: 4 });
          g.globalAlpha = 1;
        }
      }
      if (this.mode !== 'practice') {
        const t = m.roundFrames ? Math.ceil(m.timer / 60) : '∞';
        g.save();
        g.fillStyle = 'rgba(0,0,0,0.55)';
        g.beginPath(); g.moveTo(W / 2 - 34 * S, top - 6 * S); g.lineTo(W / 2 + 34 * S, top - 6 * S); g.lineTo(W / 2 + 26 * S, top + 44 * S); g.lineTo(W / 2 - 26 * S, top + 44 * S); g.closePath(); g.fill();
        g.strokeStyle = '#e8a430'; g.lineWidth = 2; g.stroke();
        g.restore();
        ui.text(String(t), W / 2, top + 36 * S, 38 * S, m.timer < 600 && m.roundFrames && (ui.clock >> 3) % 2 ? '#ff4020' : '#fff', 'center', FONT_H, { stroke: 4, grad: m.timer < 600 && m.roundFrames ? null : [[0, '#fff'], [1, '#ffc040']] });
      } else {
        ui.text('ТРЕНИРОВКА', W / 2, top + 30 * S, 18 * S, '#80e0ff', 'center', FONT_H, { stroke: 4, italic: true });
      }
      for (const msg of this.msgs) {
        const k = msg.t / msg.d;
        const sz = msg.size * S * (msg.big ? (k < 0.12 ? 1.5 - k * 4 : 1) : 1);
        const a = k > 0.8 ? (1 - k) * 5 : 1;
        g.globalAlpha = clamp(a, 0, 1);
        const x = msg.pos === 'l' ? W * 0.18 : msg.pos === 'r' ? W * 0.82 : W / 2;
        const y = msg.pos === 'c' ? H * 0.45 : H * 0.28 - msg.t * 0.3;
        ui.text(msg.text, x, y, sz, msg.col, 'center', FONT_H, { italic: true, stroke: Math.max(3, sz * 0.1), grad: msg.big ? [[0, '#fff'], [0.5, msg.col], [1, msg.col]] : null });
        g.globalAlpha = 1;
      }
      if (this.winText && m.phase === 'roundEnd' && m.pt > 30) {
        ui.text(this.winText.name + ' ПОБЕЖДАЕТ', W / 2, H * 0.82, 34 * S, '#ffe040', 'center', FONT_H, { italic: true, stroke: 5 });
      }
      if (this.mode === 'practice') this.practiceHud(g, W, H);
    }

    lifeBar(g, x, y, w, h, f, i) {
      const S = this.ui.S;
      const r = clamp(f.hp / f.maxHp, 0, 1), lag = clamp(this.hpShow[i], 0, 1);
      const sk = 10 * S;
      const poly = (x0, x1) => { g.beginPath(); g.moveTo(x0 + sk, y); g.lineTo(x1 + sk, y); g.lineTo(x1, y + h); g.lineTo(x0, y + h); g.closePath(); };
      g.save();
      g.fillStyle = 'rgba(0,0,0,0.7)'; poly(x - 3, x + w + 3); g.fill();
      const fillSeg = (from, to, style) => {
        if (to <= from) return;
        const a = i === 0 ? x + w * (1 - to) : x + w * from;
        const b = i === 0 ? x + w * (1 - from) : x + w * to;
        g.fillStyle = style; poly(a, b); g.fill();
      };
      fillSeg(0, lag, '#c01010');
      const low = r < 0.25;
      const gr = g.createLinearGradient(0, y, 0, y + h);
      if (low && (this.ui.clock >> 3) % 2) { gr.addColorStop(0, '#ff9a60'); gr.addColorStop(1, '#c03010'); }
      else { gr.addColorStop(0, '#fff8a0'); gr.addColorStop(0.45, '#f0d020'); gr.addColorStop(1, '#c08010'); }
      const fromR = i === 0 ? 1 - r : 0;
      if (i === 0) fillSeg(1 - r, 1, gr); else fillSeg(0, r, gr);
      void fromR;
      g.strokeStyle = '#e8a430'; g.lineWidth = 2; poly(x - 2, x + w + 2); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.18)'; poly(x, x + w); g.save(); g.clip(); g.fillRect(x, y, w + sk, h * 0.3); g.restore();
      g.restore();
    }

    practiceHud(g, W, H) {
      const ui = this.ui, S = ui.S, m = this.match;
      ui.panel(8 * S, 70 * S, 150 * S, 270 * S, { fill: 'rgba(0,10,20,0.55)', stroke: 'rgba(80,200,255,0.6)' });
      ui.text('ВВОД', 16 * S, 88 * S, 12 * S, '#80e0ff', 'left', FONT_T, { weight: 'bold' });
      this.inputLog.forEach((e, k) => ui.text(e.s, 18 * S, (108 + k * 16) * S, 14 * S, k === 0 ? '#fff' : 'rgba(255,255,255,0.6)', 'left', FONT_T));
      const x = W - 170 * S;
      ui.panel(x, 70 * S, 162 * S, 110 * S, { fill: 'rgba(0,10,20,0.55)', stroke: 'rgba(80,200,255,0.6)' });
      const c = this.combo[0];
      ui.text('Урон: ' + (this.lastDmg || 0), x + 10 * S, 92 * S, 13 * S, '#fff', 'left', FONT_T);
      ui.text('Комбо: ' + (c ? c.hits + ' уд. / ' + c.dmg : '—'), x + 10 * S, 110 * S, 13 * S, '#fff', 'left', FONT_T);
      if (this.adv) {
        const v = this.adv.att === 0 ? this.adv.v : -this.adv.v;
        ui.text('Преимущество: ' + (v > 0 ? '+' : '') + v, x + 10 * S, 128 * S, 13 * S, v >= 0 ? '#80ff90' : '#ff8070', 'left', FONT_T);
      }
      ui.text('Манекен: ' + DUMMY.find(d => d[0] === this.dummy)[1], x + 10 * S, 146 * S, 12 * S, '#9cd', 'left', FONT_T);
      ui.text('Esc — меню, Backspace — сброс', x + 10 * S, 166 * S, 10 * S, '#789', 'left', FONT_T);
      if (this.drill) {
        const list = this.drillList();
        const tgt = list[this.drill.i % list.length];
        const bw = 420 * S, bx = W / 2 - bw / 2, by = H - 96 * S;
        ui.panel(bx, by, bw, 70 * S, { fill: this.drill.ok ? 'rgba(20,80,20,0.8)' : 'rgba(10,10,20,0.8)' });
        ui.text(`Разучивание ${this.drill.i % list.length + 1}/${list.length}: ${tgt.n}`, W / 2, by + 26 * S, 16 * S, '#ffe040', 'center', FONT_H, { italic: true });
        ui.text(cmdText(tgt.c, m.fs[0].sd), W / 2, by + 54 * S, 20 * S, '#fff', 'center', FONT_T, { weight: 'bold' });
      }
    }

    drawPause(g, W, H) {
      const ui = this.ui, S = ui.S;
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 0, W, H);
      if (this.pauseView === 'moves') { this.drawMoves(g, W, H); return; }
      const items = this.pauseItems();
      const w = 360 * S, h = (80 + items.length * 34) * S, x = W / 2 - w / 2, y = H / 2 - h / 2;
      ui.panel(x, y, w, h);
      ui.text('ПАУЗА', W / 2, y + 42 * S, 30 * S, '#ffe040', 'center', FONT_H, { italic: true, stroke: 4 });
      items.forEach(([id, label], k) => {
        const yy = y + (78 + k * 34) * S;
        const on = k === this.pauseSel;
        if (on) { g.fillStyle = 'rgba(232,164,48,0.85)'; g.fillRect(x + 16 * S, yy - 22 * S, w - 32 * S, 30 * S); }
        ui.text(label, W / 2, yy, 18 * S, on ? '#111' : '#eee', 'center', FONT_T, { weight: 'bold' });
        ui.hotspot('p' + k, x + 16 * S, yy - 22 * S, w - 32 * S, 30 * S);
      });
    }

    click(id) {
      if (!this.paused) return;
      if (id.startsWith('p')) { this.pauseSel = +id.slice(1); this.pauseInput('ok'); }
    }

    hover(id) { if (this.paused && id.startsWith('p')) this.pauseSel = +id.slice(1); }

    drawMoves(g, W, H) {
      const ui = this.ui, S = ui.S;
      const side = this.listSide || 0;
      const f = this.match.fs[side];
      const def = f.sd;
      const x = 30 * S, y = 30 * S, w = W - 60 * S, h = H - 60 * S;
      ui.panel(x, y, w, h);
      ui.text('ПРИЁМЫ: ' + def.name.toUpperCase(), x + 20 * S, y + 36 * S, 22 * S, '#ffe040', 'left', FONT_H, { italic: true });
      ui.text('← → другой боец   ↑ ↓ прокрутка   Esc назад', x + w - 20 * S, y + 34 * S, 11 * S, '#aaa', 'right', FONT_T);
      const own = new Set((def.moves || []).map(m => m.id));
      const list = f.ms.list.filter(m => m.c && m.id !== 'ram').sort((a, b) => (own.has(b.id) ? 1 : 0) - (own.has(a.id) ? 1 : 0));
      const rows = Math.floor((h - 70 * S) / (19 * S));
      const maxScroll = Math.max(0, list.length - rows);
      this.listScroll = Math.min(this.listScroll, maxScroll);
      const vis = list.slice(this.listScroll, this.listScroll + rows);
      vis.forEach((m, k) => {
        const yy = y + (64 + k * 19) * S;
        const mine = own.has(m.id);
        ui.text(m.n, x + 20 * S, yy, 13 * S, mine ? '#fff' : '#bbb', 'left', FONT_T, { weight: mine ? 'bold' : 'normal' });
        ui.text(cmdText(m.c, def), x + w * 0.46, yy, 13 * S, '#ffd070', 'left', FONT_T, { weight: 'bold' });
        ui.text(LV[m.l] || '', x + w * 0.76, yy, 12 * S, m.l === 'l' ? '#80c0ff' : m.l === 't' ? '#ff9060' : '#ddd', 'left', FONT_T);
        ui.text(m.d ? String(m.d) : '', x + w * 0.84, yy, 12 * S, '#ddd', 'left', FONT_T);
        const tags = [m.launch ? 'подброс' : '', m.nx ? 'связка' : '', m.p.jf ? 'точный' : ''].filter(Boolean).join(', ');
        ui.text(tags, x + w * 0.89, yy, 10 * S, '#8c8', 'left', FONT_T);
      });
      if (def.tenHit) ui.text('Десять ударов: ' + def.tenHit.split(',').join(' '), x + 20 * S, y + h - 14 * S, 12 * S, '#80e0ff', 'left', FONT_T, { weight: 'bold' });
      ui.text('В — верх, С — середина, Н — низ, НБ — неблокируемый', x + w - 20 * S, y + h - 14 * S, 11 * S, '#999', 'right', FONT_T);
    }
  }

  SCREENS.fight = FightScreen;
  Object.assign(T, { cmdText, inputText, plural, DUMMY_MODES: DUMMY });
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
