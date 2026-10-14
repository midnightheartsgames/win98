(function (T) {
  'use strict';
  const { IN, clamp, lerp, FONT_H, FONT_T, SCREENS, mv } = T;

  const GOONS = {
    guard: { id: 'f_guard', name: 'Охранник', short: 'ОХРАНА', stance: 'boxer', hp: 45, voice: { pitch: 0.95, kind: 'm' }, score: 100, drop: ['uf+4', 'uf+3', 'run 1+2', 'run 4', 'd+3+4'],
      look: { skin: '#d8a880', hair: '#1a1410', hairStyle: 'short', glasses: true, top: '#161618', sleeves: 'long', pants: '#161618', shoes: '#0a0a0a', belt: '#0a0a0a', gloves: '#101010' }, moves: [], ai: { fav: ['1', '2', 'df+1', 'd+4'] } },
    kicker: { id: 'f_kicker', name: 'Боец в маске', short: 'МАСКА', stance: 'tkd', hp: 60, voice: { pitch: 1.05, kind: 'm' }, score: 200, drop: ['run 1+2'],
      look: { skin: '#d8a880', mask: '#3a3a44', top: '#4a4a52', sleeves: 'long', pants: '#2a2a30', shoes: '#141414', belt: '#b01818' }, moves: [], ai: { fav: ['3', '4', 'db+4', 'df+3'] } },
    brute: { id: 'f_brute', name: 'Громила', short: 'ГРОМИЛА', stance: 'wrestler', hp: 90, voice: { pitch: 0.75, kind: 'm' }, score: 400, bulk: 1.15, body: { size: 1.12 }, walk: 0.85, drop: ['uf+4', 'uf+3', 'run 4'],
      look: { skin: '#c89070', hair: '#1a1410', hairStyle: 'bald', beard: '#2a2018', top: '#6a6a60', sleeves: null, pants: '#2a2a2a', shoes: '#141414', girth: 1.3, armG: 1.3, legG: 1.2, neck: 1.4 },
      moves: [mv('2+4', 'Бросок об пол', 't', 30, 12, 2, 28, 0, 0, { throw: 'slam', brk: 2, r: 0.95 })], ai: { fav: ['2', 'df+2', '2+4', 'f,f+2'] } },
    foreman: { id: 'f_foreman', name: 'Бригадир охраны', short: 'БРИГАДИР', stance: 'wrestler', hp: 150, voice: { pitch: 0.7, kind: 'm' }, score: 2000, bulk: 1.2, body: { size: 1.15 }, walk: 0.9, boss: true,
      look: { skin: '#c89070', hair: '#3a2a1a', hairStyle: 'short', stache: '#2a2018', top: '#e07010', sleeves: 'short', pants: '#2a2a2a', shoes: '#141414', girth: 1.35, armG: 1.35, legG: 1.25, neck: 1.4 },
      moves: [mv('2+4', 'Бросок об пол', 't', 36, 12, 2, 28, 0, 0, { throw: 'slam', brk: 2, r: 0.95 }), mv('f,f+2', 'Таран', 'm', 24, 17, 3, 24, -8, 'B', { a: 'shoulder', r: 0.95, mv: 0.6 })], ai: { fav: ['2+4', 'f,f+2', 'df+2', '4'] } },
    instructor: { id: 'f_instructor', name: 'Инструктор', short: 'ИНСТРУКТОР', stance: 'kung', hp: 150, voice: { pitch: 1.0, kind: 'm' }, score: 2500, boss: true,
      look: { skin: '#e0b090', hair: '#1a1410', hairStyle: 'topknot', top: '#1a1a1a', sleeves: 'long', pants: '#1a1a1a', shoes: '#0a0a0a', belt: '#e8c040', gi: true },
      moves: [mv('f+1+2', 'Двойная ладонь', 'm', 20, 16, 3, 22, -6, 'B', { a: 'palm', r: 1.0 }), mv('b+4', 'Разворот', 'h', 20, 16, 3, 24, -12, 'B', { a: 'spin:r', r: 1.1 })], ai: { fav: ['f+1+2', 'b+4', 'df+2', '1,2', 'db+4'] } }
  };

  const FLOORS = [
    { name: 'ЭТАЖ 1 · ПРОХОДНАЯ', stage: 'docks', len: 40, waves: [[10, ['guard', 'guard']], [20, ['guard', 'kicker', 'guard']], [30, ['brute', 'guard', 'guard']], [38, ['foreman']]], heal: [24] },
    { name: 'ЭТАЖ 2 · ТРЕНИРОВОЧНЫЙ ЦЕХ', stage: 'factory', len: 44, waves: [[10, ['kicker', 'kicker']], [20, ['guard', 'brute', 'kicker']], [32, ['kicker', 'kicker', 'guard', 'guard']], [42, ['instructor']]], heal: [26] },
    { name: 'ЭТАЖ 3 · ЛАБОРАТОРИЯ', stage: 'lab', len: 44, waves: [[10, ['brute', 'guard']], [22, ['kicker', 'brute', 'guard']], [32, ['brute', 'brute', 'kicker']], [42, ['strazh5']]], heal: [16, 36] },
    { name: 'ЭТАЖ 4 · КРЫША', stage: 'roof', len: 36, waves: [[8, ['kicker', 'guard', 'guard']], [20, ['brute', 'kicker', 'kicker']], [34, ['genzo']]], heal: [28] }
  ];

  function goonDef(kind) {
    if (kind === 'strazh5') {
      const base = T.FIGHTER.strazh;
      return Object.assign({}, base, { id: 'f_strazh5', name: 'Страж-5', short: 'СТРАЖ-5', hp: 160, boss: true, score: 3000, compiled: null, look: Object.assign({}, base.look, { top: '#7a5a3a', pants: '#5a4028', skin: '#6a4a30', accent: '#ffb020', eye: '#ffb020' }) });
    }
    if (kind === 'genzo') return Object.assign({}, T.FIGHTER.genzo, { hp: 190, boss: true, score: 5000 });
    return GOONS[kind];
  }

  class Force {
    constructor(ui, a) {
      this.ui = ui; this.a = a;
      this.p = a.p;
      this.floor = 0; this.score = 0; this.t = 0; this.frames = 0;
      this.hp = null;
      this.msgs = [];
      this.over = false; this.win = false; this.endT = 0;
      this.paused = false;
      this.setupFloor();
    }

    setupFloor() {
      const F = FLOORS[this.floor];
      this.F = F;
      this.stage = T.STAGE[F.stage];
      const ui = this.ui;
      ui.scene.setStage(this.stage); ui.scene.parts.length = 0; ui.scene.cam = null;
      ui.audio.music('force');
      const dummy = GOONS.guard;
      this.match = new T.Match([this.p.def, dummy], { noRounds: true, skipIntro: true, fixedCam: 0, time: 0, bounds: [-1, 6, -2.4, 2.4], seed: (Date.now() & 0xffff) + this.floor, fighters: [{ hp: this.hp === null ? undefined : this.hp }, {}] });
      this.match.roundFrames = 0;
      const pl = this.match.fs[0];
      pl.pos = [0, 0, 0]; pl.yaw = 0;
      this.match.fs.length = 1;
      this.marker = { pos: [4, 0, 0], yaw: Math.PI, state: 'idle', vy: 0, hp: 1, maxHp: 1, t: 0, isLying: () => false, isAirborne: () => false, def: dummy };
      pl.opp = this.marker;
      this.anims = new Map();
      this.anims.set(pl, new T.Animator(pl));
      this.wave = 0; this.alive = [];
      this.pickups = F.heal.map(x => ({ x, z: 0, taken: false }));
      if (this.corr && ui.glOk) ui.gl.freeMesh(this.corr);
      this.corr = ui.glOk ? ui.gl.staticMesh(T.corridorProps(this.stage, F.len)) : null;
      this.nextIdx = 1;
      this.floorT = 0;
      this.msg(F.name, 150, '#ffe040', 38);
    }

    msg(text, dur, col, size) { this.msgs.push({ text, d: dur, t: 0, col, size }); }

    leave() { if (this.corr && this.ui.glOk) this.ui.gl.freeMesh(this.corr); this.corr = null; }

    spawnWave() {
      const w = this.F.waves[this.wave];
      const pl = this.match.fs[0];
      w[1].forEach((kind, i) => {
        const def = goonDef(kind);
        const idx = this.nextIdx; this.nextIdx = this.nextIdx % 28 + 1;
        const f = new T.Fighter(def, idx, this.match, { team: 1, dmgMul: def.boss ? 0.85 : 0.55 });
        const side = def.boss ? 1 : (i % 2 ? -1 : 1);
        f.pos = [pl.pos[0] + side * (6 + i * 0.8), 0, (Math.random() - 0.5) * 3];
        f.yaw = side > 0 ? Math.PI : 0;
        f.opp = pl;
        const brain = new T.Brain(clamp(0.8 + this.floor * 0.6 + (def.boss ? 1 : 0), 0, 4), (Date.now() & 0xfff) + idx * 31, { aggro: def.boss ? 1.2 : 1 });
        f.realBrain = brain;
        f.brain = { think: (m, ff) => this.enemyThink(ff) };
        f.state = 'idle';
        this.match.fs.push(f);
        this.anims.set(f, new T.Animator(f));
        this.alive.push(f);
      });
      if (w[1].some(k => goonDef(k).boss)) { this.msg('ГЛАВАРЬ: ' + goonDef(w[1][0]).name.toUpperCase(), 140, '#ff5030', 30); this.ui.audio.play('gong'); }
      this.wave++;
    }

    enemyThink(f) {
      const pl = this.match.fs[0];
      if (f.hp <= 0) return 0;
      const active = this.alive.filter(e => e.hp > 0 && e.active);
      if (!f.active && active.length < (this.floor >= 2 ? 3 : 2) && Math.random() < 0.03) f.active = true;
      if (f.active && Math.random() < 0.002 && active.length > 1) f.active = false;
      if (f.active || f.def.boss) return f.realBrain.think(this.match, f);
      f.realBrain.snaps.push(f.realBrain.snapshot(pl));
      if (f.realBrain.snaps.length > 60) f.realBrain.snaps.shift();
      const d = f.distOpp();
      if (d > 3.0) return IN.F;
      if (d < 2.0) return IN.B;
      return (this.t + f.idx * 13) % 120 < 8 ? (f.idx % 2 ? IN.U : IN.D) : 0;
    }

    input(a) {
      if (this.paused) {
        if (a === 'ok' || a === 'start' || a === 'back') { this.paused = false; if (a === 'back' && this.pauseQuit) this.a.onEnd(); }
        if (a === 'up' || a === 'down') this.pauseQuit = !this.pauseQuit;
        return;
      }
      if (a === 'start') { this.paused = true; this.pauseQuit = false; }
      if ((this.over || this.win) && this.endT > 60 && (a === 'ok' || a === 'start')) this.finish();
    }

    rawKey(code) { if (code === 'Escape') { this.paused = !this.paused; this.pauseQuit = false; return true; } return false; }

    step() {
      if (this.paused) return;
      const ui = this.ui, m = this.match;
      this.t++; this.floorT++;
      const pl = m.fs[0];
      const live = this.alive.filter(e => e.hp > 0);
      let target = null, best = 1e9;
      for (const e of live) { const d = Math.hypot(e.pos[0] - pl.pos[0], e.pos[2] - pl.pos[2]); if (d < best) { best = d; target = e; } }
      if (target) pl.opp = target;
      else { this.marker.pos = [pl.pos[0] + 3, 0, pl.pos[2]]; pl.opp = this.marker; }
      const waves = this.F.waves;
      const gate = this.wave < waves.length ? waves[this.wave][0] + 1.5 : this.F.len + 2;
      const cleared = live.length === 0;
      const xmax = cleared ? gate : Math.min(gate, (this.wave > 0 ? waves[this.wave - 1][0] : 0) + 6);
      m.opts.bounds = [Math.max(-1, pl.pos[0] - 14), xmax, -2.4, 2.4];
      if (cleared && this.wave < waves.length && pl.pos[0] >= waves[this.wave][0] - 2) this.spawnWave();
      const bits = pl.hp > 0 && !this.over ? m.relInput(0, ui.bitsFor(0, true)) : 0;
      m.step([bits]);
      this.frames++;
      this.handleEvents(m.events);
      for (const e of this.alive.slice()) {
        if (e.hp <= 0 && e.state === 'ko' && (e.koLanded || e.pos[1] <= 0)) {
          e.goneT = (e.goneT || 0) + 1;
          if (e.goneT === 1) { this.score += e.def.score || 100; this.msg('+' + (e.def.score || 100), 50, '#ffe040', 18, e); }
          if (e.goneT > 70) {
            this.alive.splice(this.alive.indexOf(e), 1);
            m.fs.splice(m.fs.indexOf(e), 1);
            this.anims.delete(e);
            if (e.def.boss) this.floorDone();
          }
        }
      }
      for (const p of this.pickups) {
        if (!p.taken && Math.abs(pl.pos[0] - p.x) < 0.6 && Math.abs(pl.pos[2] - p.z) < 0.8 && pl.hp > 0) {
          p.taken = true; pl.hp = Math.min(pl.maxHp, pl.hp + 45); ui.audio.play('heal'); this.msg('+45 ЗДОРОВЬЯ', 60, '#80ff90', 20);
        }
      }
      for (const [f, an] of this.anims) an.update();
      ui.scene.tickParts();
      T.ambientTick(ui.scene, this.stage, ui.scene.cam || { at: [0, 1, 0] }, ui.clock);
      const cx = pl.pos[0] + 1.2;
      ui.scene.updateCamera({ eye: [cx, 2.2, 5.6], at: [cx, 1.0, 0], fov: 0.72 }, this.floorT === 1);
      this.msgs = this.msgs.filter(x => ++x.t < x.d);
      if (pl.hp <= 0 && !this.over) { this.over = true; this.endT = 0; ui.audio.say('Game over'); }
      if (this.over || this.win) this.endT++;
      if (this.nextFloorT !== undefined && --this.nextFloorT <= 0) {
        this.nextFloorT = undefined;
        this.hp = Math.min(pl.maxHp, pl.hp + 40);
        this.floor++;
        if (this.floor >= FLOORS.length) { this.win = true; this.endT = 0; this.ui.audio.play('unlock'); }
        else this.setupFloor();
      }
    }

    handleEvents(evs) {
      const au = this.ui.audio, sc = this.ui.scene;
      for (const e of evs) {
        if (e.type === 'hit') { au.play(e.ch ? 'hitCH' : e.heavy ? 'hitH' : 'hitM'); sc.spawn(e.ch ? 'ch' : 'hit', e.pos, { big: e.heavy }); if (e.a.idx === 0) this.score += e.dmg * 2 + (e.d.combo.hits > 2 ? e.d.combo.hits * 5 : 0); if (e.heavy) sc.shake(0.06); }
        else if (e.type === 'block') { au.play('block'); sc.spawn('block', e.pos); }
        else if (e.type === 'whiff') au.play('whoosh', { k: 0.6 });
        else if (e.type === 'grab') au.play('grab');
        else if (e.type === 'throwHit') { au.play('slam'); if (e.a.idx === 0) this.score += e.dmg * 3; }
        else if (e.type === 'thud') { au.play('thud'); sc.spawn('dust', e.f.pos, { big: true }); }
        else if (e.type === 'down') au.voice(e.d.def.voice, 'ko');
        else if (e.type === 'start' && e.m.d >= 15 && Math.random() < 0.5) au.voice(e.f.def.voice, 'big');
        else if (e.type === 'fx' && e.kind === 'steam' && e.f.mf === e.m.st) au.play('steam');
      }
    }

    floorDone() {
      const bonus = Math.max(0, 6000 - Math.floor(this.floorT / 6));
      this.score += bonus;
      this.msg('ЭТАЖ ПРОЙДЕН!', 170, '#ffe040', 44);
      this.msg('БОНУС ЗА ВРЕМЯ: ' + bonus, 170, '#fff', 20);
      this.ui.audio.play('unlock');
      this.nextFloorT = 180;
    }

    finish() {
      if (this.done) return;
      this.done = true;
      const ui = this.ui;
      if (this.win) {
        const evs = T.onForceClear(ui.save, this.score, this.p.def.id);
        ui.persist();
        const liu = evs.find(e => e.kind === 'fighter');
        if (liu) { const d = T.FIGHTER[liu.id]; ui.go('message', { title: 'НОВЫЙ БОЕЦ!', name: d.name, text: d.bio, def: d, sound: 'unlock', onDone: () => this.a.onEnd() }); return; }
      } else {
        T.addRecord(ui.save.records.force, { score: this.score, id: this.p.def.id }, (a, b) => b.score - a.score);
        ui.persist();
      }
      this.a.onEnd();
    }

    items() {
      const out = [];
      for (const [f, an] of this.anims) {
        const look = f.idx === 0 ? T.lookFor(this.p.def, this.p.costume) : f.def.look;
        const fade = f.goneT && f.goneT > 40 ? (Math.floor(f.goneT / 3) % 2 === 0) : false;
        out.push({ key: 'fo' + f.def.id + (f.idx === 0 ? ':' + this.p.costume : ''), look, j: an.j, B: an.B, pos: f.pos, yaw: f.yaw, lying: f.isLying(), size: f.B.size, hidden: fade });
      }
      return out;
    }

    draw(g, W, H) {
      const ui = this.ui, S = ui.S, m = this.match;
      if (ui.glOk) {
        const pick = this.pickups.filter(p => !p.taken);
        const items = this.items();
        if (pick.length) items.push({ key: 'pk', look: {}, j: null, hidden: true, pos: [0, 0, 0], extra: null });
        ui.scene.render(items.filter(i => i.j), {});
        if (this.corr) ui.gl.drawStatic(this.corr, {});
        if (pick.length) {
          const mb = new T.MB(400);
          for (const p of pick) {
            const y = 0.35 + Math.sin(this.t * 0.08) * 0.08;
            mb.box([p.x, y, p.z], [0.22, 0, 0], [0, 0.16, 0], [0, 0, 0.16], [0.95, 0.95, 0.95]);
            mb.box([p.x, y, p.z + 0.17], [0.06, 0, 0], [0, 0.12, 0], [0, 0, 0.005], [0.9, 0.1, 0.1]);
            mb.box([p.x, y, p.z + 0.17], [0.16, 0, 0], [0, 0.04, 0], [0, 0, 0.006], [0.9, 0.1, 0.1]);
          }
          ui.gl.drawDyn(mb, {});
        }
      }
      const pl = m.fs[0];
      ui.panel(10 * S, 10 * S, 300 * S, 56 * S, { fill: 'rgba(0,0,0,0.6)' });
      ui.text(this.p.def.short, 20 * S, 30 * S, 16 * S, '#fff', 'left', FONT_H, { italic: true });
      const bw = 280 * S, r = clamp(pl.hp / pl.maxHp, 0, 1);
      g.fillStyle = '#300'; g.fillRect(20 * S, 38 * S, bw, 14 * S);
      const gr = g.createLinearGradient(0, 38 * S, 0, 52 * S); gr.addColorStop(0, '#fff8a0'); gr.addColorStop(1, '#c08010');
      g.fillStyle = gr; g.fillRect(20 * S, 38 * S, bw * r, 14 * S);
      g.strokeStyle = '#e8a430'; g.strokeRect(20 * S, 38 * S, bw, 14 * S);
      ui.text('ОЧКИ ' + String(this.score).padStart(7, '0'), W - 16 * S, 34 * S, 20 * S, '#ffe040', 'right', FONT_H, { italic: true, stroke: 4 });
      ui.text(this.F.name, W - 16 * S, 54 * S, 12 * S, '#ddd', 'right', FONT_T, { weight: 'bold', stroke: 3 });
      const prog = clamp(pl.pos[0] / this.F.len, 0, 1);
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(W / 2 - 150 * S, 16 * S, 300 * S, 6 * S);
      g.fillStyle = '#e8a430'; g.fillRect(W / 2 - 150 * S, 16 * S, 300 * S * prog, 6 * S);
      if (ui.glOk) for (const e of this.alive) {
        if (e.hp <= 0) continue;
        const p = ui.gl.toScreen([e.pos[0], 2.05 * (e.B.size || 1), e.pos[2]]);
        if (p[2] <= 0) continue;
        const w = (e.def.boss ? 90 : 50) * S;
        g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(p[0] - w / 2, p[1], w, 6 * S);
        g.fillStyle = e.def.boss ? '#ff4020' : '#f0c020'; g.fillRect(p[0] - w / 2, p[1], w * e.hp / e.maxHp, 6 * S);
        if (e.def.boss) ui.text(e.def.name, p[0], p[1] - 4 * S, 12 * S, '#fff', 'center', FONT_T, { weight: 'bold', stroke: 3 });
      }
      this.msgs.forEach((x, k) => {
        const a = clamp(Math.min(x.t / 10, (x.d - x.t) / 20), 0, 1);
        g.globalAlpha = a;
        ui.text(x.text, W / 2, H * 0.36 + k * 40 * S, x.size * S, x.col, 'center', FONT_H, { italic: true, stroke: 5 });
        g.globalAlpha = 1;
      });
      const clear = this.alive.filter(e => e.hp > 0).length === 0 && this.wave < this.F.waves.length && !this.over;
      if (clear && (this.t >> 4) % 2) ui.text('ВПЕРЁД →', W - 30 * S, H * 0.5, 26 * S, '#ffe040', 'right', FONT_H, { italic: true, stroke: 5 });
      if (this.over || this.win) {
        g.fillStyle = `rgba(0,0,0,${clamp(this.endT / 60, 0, 0.7)})`; g.fillRect(0, 0, W, H);
        ui.text(this.win ? 'ШТУРМ ЗАВЕРШЁН!' : 'КОНЕЦ ИГРЫ', W / 2, H * 0.42, 48 * S, this.win ? '#ffe040' : '#ff4030', 'center', FONT_H, { italic: true, stroke: 6 });
        ui.text('Очки: ' + this.score, W / 2, H * 0.52, 26 * S, '#fff', 'center', FONT_H, { italic: true, stroke: 4 });
        if (this.endT > 60) ui.text('Enter — продолжить', W / 2, H * 0.62, 16 * S, '#ccc', 'center', FONT_T);
      }
      if (this.paused) {
        g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, W, H);
        ui.text('ПАУЗА', W / 2, H * 0.4, 40 * S, '#ffe040', 'center', FONT_H, { italic: true, stroke: 5 });
        ui.text(this.pauseQuit ? '▶ Выйти в меню (Esc)' : '▶ Продолжить (Enter)', W / 2, H * 0.5, 18 * S, '#fff', 'center', FONT_T, { weight: 'bold' });
        ui.text('↑ ↓ — выбор', W / 2, H * 0.56, 12 * S, '#aaa', 'center', FONT_T);
      }
      ui.text('W A S D — ходьба (↑↓ — уход в сторону) · U I J K — удары · Enter — пауза', W / 2, H - 10 * S, 11 * S, 'rgba(255,255,255,0.6)', 'center', FONT_T);
    }
  }

  SCREENS.force = Force;
  Object.assign(T, { FORCE_FLOORS: FLOORS, GOONS, goonDef });
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
