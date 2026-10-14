(function (T) {
  'use strict';
  const { IN, clamp, lerp, FONT_H, FONT_T, SCREENS } = T;

  const BALL_R = 0.2;
  const G = 9.0;
  const BANDS = { h: [1.05, 2.2], m: [0.55, 1.7], sm: [0.2, 1.3], l: [0.0, 0.85], u: [0.0, 2.2] };

  class BallGame {
    constructor(seed) {
      this.pos = [-1.8, 2.6, 0]; this.vel = [0, 0, 0];
      this.power = 0; this.owner = -1; this.live = false; this.serveT = 60; this.server = 0;
      this.hitBy = new Map();
      this.rng = new T.RNG(seed || 5);
      this.events = [];
    }

    serve(side) {
      this.server = side;
      this.pos = [side === 0 ? -1.8 : 1.8, 2.8, 0];
      this.vel = [0, 0, 0]; this.power = 8; this.owner = -1; this.live = true; this.touches = 0;
    }

    step(m) {
      this.events.length = 0;
      if (!this.live) {
        if (--this.serveT <= 0) this.serve(this.server);
        return;
      }
      const dt = T.DT;
      this.vel[1] -= G * dt;
      for (let i = 0; i < 3; i++) this.pos[i] += this.vel[i] * dt;
      if (Math.abs(this.pos[2]) > 2.6) { this.pos[2] = Math.sign(this.pos[2]) * 2.6; this.vel[2] *= -0.7; }
      if (Math.abs(this.pos[0]) > 6.5) { this.pos[0] = Math.sign(this.pos[0]) * 6.5; this.vel[0] *= -0.6; }
      if (Math.abs(this.pos[0]) < 0.15 && this.pos[1] < 0.9 && Math.sign(this.vel[0]) === -Math.sign(this.pos[0] || 1)) {
        this.vel[0] *= -0.5; this.pos[0] = Math.sign(this.pos[0] || 1) * 0.16; this.events.push({ type: 'net' });
      }
      for (const f of m.fs) {
        if (f.state !== 'move' || !f.move) continue;
        const mv = f.move;
        if (f.mf < mv.st || f.mf >= mv.st + mv.act || mv.l === 't' || mv.l === 'x') continue;
        if (this.hitBy.get(f) === f.moveSerial) continue;
        const dx = this.pos[0] - f.pos[0], dz = this.pos[2] - f.pos[2];
        const c = Math.cos(f.yaw), s = Math.sin(f.yaw);
        const fwd = dx * c + dz * s, lat = -dx * s + dz * c;
        const band = BANDS[mv.l] || BANDS.m;
        const y = this.pos[1] - f.pos[1];
        if (fwd < -0.3 || fwd > mv.r + 0.45 || Math.abs(lat) > mv.w + 0.55 || y < band[0] - 0.2 || y > band[1] + 0.2) continue;
        this.hitBy.set(f, f.moveSerial);
        const dir = f.team === 0 ? 1 : -1;
        const strength = 3.2 + mv.d * 0.16;
        let vy = mv.launch ? 7.2 : mv.l === 'l' ? 2.4 : mv.l === 'h' ? 3.2 : 4.2;
        if (mv.kd && !mv.launch) vy -= 0.8;
        this.vel = [dir * strength * (mv.launch ? 0.55 : 1), vy, -lat * 0.8 + (this.rng.next() - 0.5) * 0.6];
        this.power = Math.min(99, this.power + mv.d * 0.8 + 2);
        this.owner = f.team; this.touches++;
        this.events.push({ type: 'kick', f, pos: this.pos.slice(), power: this.power, m: mv });
      }
      for (const f of m.fs) {
        if (f.team === this.owner || this.owner < 0) continue;
        const dx = this.pos[0] - f.pos[0], dz = this.pos[2] - f.pos[2];
        const y = this.pos[1] - f.pos[1];
        const sz = f.B.size || 1;
        if (Math.hypot(dx, dz) > 0.38 * sz + BALL_R || y < -0.1 || y > 1.85 * sz) continue;
        const speed = Math.hypot(this.vel[0], this.vel[1], this.vel[2]);
        if (speed < 2.5) continue;
        const g = f.guardLevel();
        const facing = Math.cos(f.yaw) * -dx + Math.sin(f.yaw) * -dz < 0;
        const blocked = g && facing && (g === 'high' ? y > 0.6 : y < 1.0);
        const dmg = Math.round(blocked ? this.power * 0.25 : this.power);
        this.events.push({ type: blocked ? 'blocked' : 'smash', f, dmg, pos: this.pos.slice() });
        this.vel = [-this.vel[0] * 0.25, 4.5, this.vel[2] * 0.3];
        if (!blocked) this.power = Math.max(6, this.power * 0.4); else this.power = Math.max(6, this.power * 0.6);
        this.owner = -1;
      }
      if (this.pos[1] <= BALL_R && this.vel[1] < 0) {
        this.pos[1] = BALL_R;
        const side = this.pos[0] < 0 ? 0 : 1;
        this.events.push({ type: 'floor', side, dmg: Math.round(Math.max(6, this.power * 0.6)), pos: this.pos.slice() });
        this.live = false; this.serveT = 70; this.server = side;
        this.vel = [0, 0, 0];
      }
    }

    predict(side) {
      const p = this.pos.slice(), v = this.vel.slice();
      for (let i = 0; i < 180; i++) {
        v[1] -= G * T.DT;
        for (let k = 0; k < 3; k++) p[k] += v[k] * T.DT;
        if (p[1] <= 1.1 && v[1] < 0) return p;
      }
      return p;
    }
  }

  class Ball {
    constructor(ui, a) {
      this.ui = ui; this.a = a;
      this.p = a.p;
      this.wins = [0, 0]; this.round = 1; this.need = 2;
      this.msgs = []; this.t = 0; this.paused = false; this.over = false; this.endT = 0;
      this.p2Human = false;
      this.setupRound();
    }

    setupRound() {
      const ui = this.ui;
      this.stage = T.STAGE.beach;
      ui.scene.setStage(this.stage); ui.scene.parts.length = 0; ui.scene.cam = null;
      ui.audio.music('ball');
      this.match = new T.Match([this.p[0].def, this.p[1].def], { noRounds: true, skipIntro: true, fixedCam: 0, time: 0, bounds: [-6, 6, -2.6, 2.6], seed: Date.now() & 0xffff, rounds: 1 });
      this.match.roundFrames = 0;
      const [a, b] = this.match.fs;
      a.pos = [-2, 0, 0]; b.pos = [2, 0, 0]; a.yaw = 0; b.yaw = Math.PI;
      this.anims = this.match.fs.map(f => new T.Animator(f));
      this.looks = this.p.map(p => T.lookFor(p.def, p.costume));
      this.ball = new BallGame(Date.now() & 0xffff);
      this.ball.server = (this.round + 1) % 2;
      this.ball.serveT = 110;
      this.ai = { tgt: 2, cool: 0 };
      this.msg('РАУНД ' + this.round, 90, '#fff', 60);
      this.roundOver = false;
    }

    msg(text, d, col, size) { this.msgs.push({ text, d, t: 0, col, size }); }

    input(a, pl, pad) {
      if (pl === 1 && !this.p2Human && (a === 'ok' || a === 'up' || a === 'down' || a === 'left' || a === 'right')) { this.p2Human = true; this.msg('ИГРОК 2 В ИГРЕ', 80, '#ff6060', 24); }
      if (this.paused) { if (a === 'ok' || a === 'start') this.paused = false; if (a === 'back') this.a.onEnd(); return; }
      if (a === 'start') this.paused = true;
      if (this.over && this.endT > 60 && (a === 'ok' || a === 'start')) this.a.onEnd();
    }

    rawKey(code) { if (code === 'Escape') { if (this.paused) this.a.onEnd(); else this.paused = true; return true; } return false; }

    aiBits(f) {
      const b = this.ball, o = this.ai;
      let bits = 0;
      const side = f.team === 0 ? -1 : 1;
      let tx = side * 2.2, tz = 0;
      if (b.live && (b.pos[0] * side > 0 || b.vel[0] * side > 0)) { const p = b.predict(); if (p[0] * side > 0.3) { tx = p[0]; tz = p[2]; } }
      const dx = tx - f.pos[0];
      const towardOpp = Math.sign(-side);
      if (Math.abs(dx) > 0.35) bits |= Math.sign(dx) === towardOpp ? IN.F : IN.B;
      if (Math.abs(tz - f.pos[2]) > 0.6 && (this.t % 40 < 2)) bits |= (tz - f.pos[2]) * side > 0 ? IN.U : IN.D;
      if (o.cool > 0) o.cool--;
      const d = Math.hypot(b.pos[0] - f.pos[0], b.pos[2] - f.pos[2]);
      if (b.live && d < 1.35 && o.cool <= 0 && f.state !== 'move') {
        const y = b.pos[1];
        o.cool = 25;
        if (y > 1.4) return IN.P2;
        if (y > 0.9) return Math.random() < 0.4 ? IN.D | IN.F | IN.P2 : IN.K4;
        if (y > 0.4) return IN.D | IN.F | IN.K3;
        return IN.D | IN.K4;
      }
      return bits;
    }

    step() {
      if (this.paused) return;
      const ui = this.ui, m = this.match;
      this.t++;
      const [a, b] = m.fs;
      const inA = m.relInput(0, ui.bitsFor(0, !this.p2Human));
      const inB = this.p2Human ? m.relInput(1, ui.bitsFor(1, false)) : this.aiBits(b);
      if (!this.roundOver) m.step([inA, inB]); else m.step([0, 0]);
      a.pos[0] = Math.min(a.pos[0], -0.35); b.pos[0] = Math.max(b.pos[0], 0.35);
      if (!this.roundOver) this.ball.step(m);
      for (const e of this.ball.events) this.ballEvent(e);
      for (const e of m.events) {
        if (e.type === 'thud') { ui.audio.play('thud'); ui.scene.spawn('dust', e.f.pos, { col: [0.9, 0.8, 0.6] }); }
        if (e.type === 'whiff') ui.audio.play('whoosh', { k: 0.6 });
        if (e.type === 'hit') { ui.audio.play('hitM'); ui.scene.spawn('hit', e.pos); }
      }
      for (const an of this.anims) an.update();
      ui.scene.tickParts();
      ui.scene.updateCamera({ eye: [2.6, 3.4, 8.2], at: [0, 1.0, 0], fov: 0.72 }, this.t === 1);
      this.msgs = this.msgs.filter(x => ++x.t < x.d);
      if (!this.roundOver) {
        const dead = m.fs.find(f => f.hp <= 0);
        if (dead) {
          this.roundOver = true; this.rT = 0;
          const w = 1 - dead.idx;
          this.wins[w]++;
          ui.audio.play('ko'); ui.audio.say('K.O.');
          this.msg((w === 0 ? this.p[0].def.short : this.p[1].def.short) + ' ПОБЕЖДАЕТ', 160, '#ffe040', 40);
          m.fs[w].set('win');
        }
      } else if (++this.rT > 170) {
        if (this.wins.some(x => x >= this.need)) { this.over = true; this.endT = 0; }
        else { this.round++; this.setupRound(); }
      }
      if (this.over) this.endT++;
    }

    ballEvent(e) {
      const ui = this.ui, m = this.match;
      if (e.type === 'kick') { ui.audio.play(e.power > 50 ? 'hitH' : 'hitM'); ui.scene.spawn(e.power > 50 ? 'ch' : 'hit', e.pos, { big: e.power > 40 }); }
      else if (e.type === 'net') ui.audio.play('block');
      else if (e.type === 'blocked') { ui.audio.play('block'); ui.scene.spawn('block', e.pos); this.hurt(e.f, e.dmg, false); }
      else if (e.type === 'smash') { ui.audio.play('hitH'); ui.scene.spawn('ch', e.pos, { big: true }); ui.scene.shake(0.12); this.hurt(e.f, e.dmg, true); }
      else if (e.type === 'floor') {
        ui.audio.play('thud'); ui.scene.spawn('dust', e.pos, { big: true, col: [0.9, 0.8, 0.6] });
        const f = m.fs[e.side];
        this.hurt(f, e.dmg, false);
        this.msg('МЯЧ НА СТОРОНЕ ' + (e.side === 0 ? '1P' : '2P') + ': −' + e.dmg, 70, '#ffb040', 22);
      }
    }

    hurt(f, dmg, knock) {
      if (this.roundOver) return;
      f.hp = Math.max(0, f.hp - dmg);
      if (knock) {
        f.set('air'); f.vy = 3.5; f.face = 'up'; f.spinKind = 'blow'; f.lastFall = 'air';
        const dir = f.team === 0 ? -1 : 1;
        f.vel = [dir * 2.5, 0, 0]; f.pos[1] = 0.05;
        this.ui.audio.voice(f.def.voice, 'hurt');
      }
      this.combo = { f, dmg };
    }

    draw(g, W, H) {
      const ui = this.ui, S = ui.S, m = this.match;
      if (ui.glOk) {
        const items = this.anims.map((an, i) => { const f = m.fs[i]; return { key: 'b' + i + ':' + this.p[i].def.id + this.p[i].costume, look: this.looks[i], j: an.j, B: an.B, pos: f.pos, yaw: f.yaw, lying: f.isLying(), size: f.B.size }; });
        ui.scene.render(items, {});
        const mb = new T.MB(3000);
        for (let z = -2.6; z < 2.6; z += 0.4) mb.prism([0, 0, z], [0, 0.9, z], 0.02, 0.02, 4, [1, 0, 0], [0.9, 0.9, 0.85]);
        mb.prism([0, 0.9, -2.7], [0, 0.9, 2.7], 0.025, 0.025, 4, [0, 1, 0], [0.95, 0.95, 0.95]);
        mb.box([0, 0.65, 0], [0.005, 0, 0], [0, 0.25, 0], [0, 0, 2.6], [0.7, 0.7, 0.65]);
        mb.box([0, 0.012, 0], [0.04, 0, 0], [0, 0.004, 0], [0, 0, 2.8], [0.95, 0.95, 0.9]);
        for (const x of [-6.5, 6.5]) mb.box([x, 0.012, 0], [0.04, 0, 0], [0, 0.004, 0], [0, 0, 2.8], [0.95, 0.95, 0.9]);
        for (const z of [-2.7, 2.7]) mb.box([0, 0.012, z], [6.5, 0, 0], [0, 0.004, 0], [0, 0, 0.04], [0.95, 0.95, 0.9]);
        const b = this.ball;
        if (b.live) {
          const k = clamp(b.power / 80, 0, 1);
          const col = k < 0.5 ? T.mixc([1, 1, 1], [1, 0.7, 0.1], k * 2) : T.mixc([1, 0.7, 0.1], [1, 0.1, 0.05], (k - 0.5) * 2);
          mb.ellipsoid(b.pos, T.rotY(this.t * 0.2), BALL_R, BALL_R, BALL_R, col, 10, 6, 0, 6, (i, r) => (i + r) % 2 ? col : T.shade(col, 0.75));
          mb.alpha = 0.5;
          mb.box([b.pos[0], 0.015, b.pos[2]], [BALL_R, 0, 0], [0, 0.002, 0], [0, 0, BALL_R], [0, 0, 0]);
          mb.alpha = 1;
        }
        ui.gl.drawDyn(mb, {});
      }
      const bw = W * 0.36;
      m.fs.forEach((f, i) => {
        const x = i === 0 ? 20 * S : W - 20 * S - bw;
        g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x, 16 * S, bw, 16 * S);
        const r = clamp(f.hp / f.maxHp, 0, 1);
        const gr = g.createLinearGradient(0, 16 * S, 0, 32 * S); gr.addColorStop(0, '#fff8a0'); gr.addColorStop(1, '#c08010');
        g.fillStyle = gr;
        if (i === 0) g.fillRect(x + bw * (1 - r), 16 * S, bw * r, 16 * S); else g.fillRect(x, 16 * S, bw * r, 16 * S);
        g.strokeStyle = '#e8a430'; g.strokeRect(x, 16 * S, bw, 16 * S);
        ui.text(this.p[i].def.short + (i === 1 ? (this.p2Human ? ' (2P)' : ' (CPU)') : ''), i === 0 ? x : x + bw, 50 * S, 16 * S, '#fff', i === 0 ? 'left' : 'right', FONT_H, { italic: true, stroke: 4 });
        for (let k = 0; k < this.need; k++) { g.fillStyle = this.wins[i] > k ? '#ffd040' : 'rgba(0,0,0,0.5)'; g.fillRect(i === 0 ? x + bw - (k + 1) * 16 * S : x + k * 16 * S, 38 * S, 10 * S, 10 * S); }
      });
      const pw = this.ball.power;
      ui.text('СИЛА МЯЧА', W / 2, 22 * S, 12 * S, '#fff', 'center', FONT_T, { weight: 'bold', stroke: 3 });
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(W / 2 - 60 * S, 28 * S, 120 * S, 10 * S);
      g.fillStyle = pw > 50 ? '#ff4020' : '#ffc020'; g.fillRect(W / 2 - 60 * S, 28 * S, 120 * S * clamp(pw / 99, 0, 1), 10 * S);
      this.msgs.forEach((x, k) => {
        g.globalAlpha = clamp(Math.min(x.t / 8, (x.d - x.t) / 15), 0, 1);
        ui.text(x.text, W / 2, H * 0.38 + k * 36 * S, x.size * S, x.col, 'center', FONT_H, { italic: true, stroke: 5 });
        g.globalAlpha = 1;
      });
      if (!this.p2Human && this.t < 400) ui.text('Игрок 2 может вступить в игру: стрелки + Num 4 5 1 2', W / 2, H - 30 * S, 12 * S, '#ddd', 'center', FONT_T, { stroke: 3 });
      ui.text('Бейте по мячу! Мяч на вашей стороне или в корпус — урон. Блок снижает урон.', W / 2, H - 12 * S, 11 * S, 'rgba(255,255,255,0.7)', 'center', FONT_T);
      if (this.over) {
        g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, 0, W, H);
        const w = this.wins[0] > this.wins[1] ? 0 : 1;
        ui.text((w === 0 ? '1P' : this.p2Human ? '2P' : 'CPU') + ' ВЫИГРЫВАЕТ МАТЧ', W / 2, H * 0.45, 40 * S, '#ffe040', 'center', FONT_H, { italic: true, stroke: 6 });
        if (this.endT > 60) ui.text('Enter — в меню', W / 2, H * 0.55, 16 * S, '#ccc', 'center', FONT_T);
      }
      if (this.paused) {
        g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, W, H);
        ui.text('ПАУЗА', W / 2, H * 0.44, 40 * S, '#ffe040', 'center', FONT_H, { italic: true, stroke: 5 });
        ui.text('Enter — продолжить · Esc — выход', W / 2, H * 0.52, 16 * S, '#fff', 'center', FONT_T);
      }
    }
  }

  SCREENS.ball = Ball;
  Object.assign(T, { BallGame });
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
