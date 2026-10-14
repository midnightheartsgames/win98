(function (Q) {
  'use strict';
  const SAY = {
    fight: 'Fight!', prepare: 'Prepare to fight!', excellent: 'Excellent!', impressive: 'Impressive!', humiliation: 'Humiliation!', gauntlet: 'Humiliation!',
    taken_lead: 'You have taken the lead.', tied_lead: 'You are tied for the lead.', lost_lead: 'You have lost the lead.',
    '3_frags': 'Three frags left.', '2_frags': 'Two frags left.', '1_frags': 'One frag left.',
    '5_minute': 'Five minute warning.', '1_minute': 'One minute remains.', sudden_death: 'Sudden death!',
    you_win: 'You win!', you_lose: 'You lose.', perfect: 'Perfect!', accuracy: 'Accuracy!', frags: 'Frags!',
    quad: 'Quad damage!', battlesuit: 'Battle suit!', haste: 'Haste!', invis: 'Invisibility!', regen: 'Regeneration!',
    three: 'Three', two: 'Two', one: 'One', red_leads: 'Red leads.', blue_leads: 'Blue leads.', teams_tied: 'Teams are tied.'
  };

  class Audio {
    constructor() {
      this.ctx = null;
      this.vol = 0.8;
      this.musicVol = 0.45;
      this.bufs = {};
      this.loops = new Map();
      this.voice = null;
      this.speechOk = typeof speechSynthesis !== 'undefined';
      this.music = null;
    }

    init() {
      if (this.ctx) return true;
      const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!AC) return false;
      try { this.ctx = new AC(); } catch (e) { return false; }
      this.master = this.ctx.createGain();
      this.master.gain.value = this.vol;
      this.master.connect(this.ctx.destination);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = this.musicVol;
      this.musicBus.connect(this.ctx.destination);
      this.build();
      if (this.speechOk) {
        const pick = () => {
          const vs = speechSynthesis.getVoices();
          this.voice = vs.find(v => /en/i.test(v.lang) && /male|david|george|mark|daniel/i.test(v.name)) || vs.find(v => /en/i.test(v.lang)) || null;
        };
        pick();
        try { speechSynthesis.addEventListener('voiceschanged', pick); } catch (e) { }
      }
      return true;
    }

    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => { }); }
    setVolume(v) { this.vol = v; if (this.master) this.master.gain.value = v; }
    setMusic(v) { this.musicVol = v; if (this.musicBus) this.musicBus.gain.value = v; }

    buf(len, fn) {
      const sr = this.ctx.sampleRate;
      const n = Math.max(1, Math.floor(len * sr));
      const b = this.ctx.createBuffer(1, n, sr);
      const d = b.getChannelData(0);
      let seed = 12345;
      const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff * 2 - 1; };
      const st = { lp: 0, lp2: 0, ph: 0, ph2: 0, hp: 0, prev: 0, sr };
      for (let i = 0; i < n; i++) d[i] = fn(i / sr, rnd, st, i / n);
      let peak = 0;
      for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(d[i]));
      if (peak > 0) for (let i = 0; i < n; i++) d[i] = d[i] / peak * 0.9;
      return b;
    }

    build() {
      const env = (t, a, dcy) => (t < a ? t / a : Math.exp(-(t - a) / dcy));
      const lp = (st, x, k) => (st.lp += (x - st.lp) * k);
      const lp2 = (st, x, k) => (st.lp2 += (x - st.lp2) * k);
      const B = (k, len, fn) => { this.bufs[k] = this.buf(len, fn); };
      B('mg', 0.12, (t, r, s) => (lp(s, r(), 0.5) * 0.7 + Math.sin(t * 2 * Math.PI * 90) * 0.6) * env(t, 0.002, 0.025));
      B('sg', 0.5, (t, r, s) => (lp(s, r(), 0.18) * 1.2 + Math.sin(t * 2 * Math.PI * (70 - t * 40)) * 0.8) * env(t, 0.003, 0.09));
      B('gl', 0.35, (t, r, s) => (Math.sin(s.ph += 2 * Math.PI * (220 * Math.exp(-t * 12) + 50) / s.sr) * 0.9 + lp(s, r(), 0.3) * 0.4 * env(t, 0.001, 0.01)) * env(t, 0.004, 0.08));
      B('rl', 0.7, (t, r, s) => (lp(s, r(), 0.05 + t * 0.2) * 1.2 + Math.sin(t * 2 * Math.PI * 60) * 0.5 * env(t, 0.01, 0.06)) * env(t, 0.02, 0.22));
      B('lg', 0.5, (t, r, s) => (Math.sign(Math.sin(t * 2 * Math.PI * 75)) * 0.35 + lp(s, r(), 0.6) * (Math.random() < 0.02 ? 1 : 0.25)) * 0.8);
      B('rg', 1.0, (t, r, s) => (Math.sin(s.ph += 2 * Math.PI * (3200 * Math.exp(-t * 18) + 140) / s.sr) * 0.8 + lp(s, r(), 0.4) * 0.5 * env(t, 0.001, 0.04) + Math.sin(t * 2 * Math.PI * 180) * 0.2 * env(t, 0.1, 0.3)) * env(t, 0.002, 0.28));
      B('pg', 0.14, (t, r, s) => (Math.sign(Math.sin(s.ph += 2 * Math.PI * (1100 - t * 5000) / s.sr)) * 0.5 + r() * 0.1) * env(t, 0.002, 0.05));
      B('bfg', 1.0, (t, r, s) => (Math.sin(s.ph += 2 * Math.PI * (60 + t * 300) / s.sr) * 0.7 + lp(s, r(), 0.08) * 0.8) * (t < 0.4 ? t / 0.4 : Math.exp(-(t - 0.4) / 0.15)));
      B('gauntlet', 0.5, (t, r, s) => ((t * 130 % 1) * 2 - 1) * 0.5 * (0.7 + 0.3 * Math.sin(t * 60)) + lp(s, r(), 0.3) * 0.2);
      B('gauntlet_hit', 0.25, (t, r, s) => (lp(s, r(), 0.1) + Math.sin(t * 2 * Math.PI * 90)) * env(t, 0.002, 0.06));
      B('explode', 1.4, (t, r, s) => (lp(s, r(), 0.03 + 0.25 * Math.exp(-t * 6)) * 1.3 + Math.sin(t * 2 * Math.PI * (55 - t * 20)) * 0.9 * env(t, 0.005, 0.15)) * env(t, 0.004, 0.35));
      B('plasma_hit', 0.25, (t, r, s) => (Math.sin(s.ph += 2 * Math.PI * (600 - t * 1500) / s.sr) * 0.5 + r() * 0.3) * env(t, 0.002, 0.05));
      for (let k = 0; k < 3; k++) B('ric' + k, 0.25, (t, r, s) => (Math.sin(s.ph += 2 * Math.PI * ((2400 + k * 700) - t * (3000 + k * 1000)) / s.sr) * 0.4 + r() * 0.3 * env(t, 0.001, 0.01)) * env(t, 0.001, 0.07));
      B('jump_m', 0.2, (t, r, s) => (lp(s, r(), 0.12) * 0.6 + Math.sin(t * 2 * Math.PI * (160 - t * 200)) * 0.7) * env(t, 0.01, 0.06));
      B('jump_f', 0.2, (t, r, s) => (lp(s, r(), 0.2) * 0.5 + Math.sin(t * 2 * Math.PI * (300 - t * 300)) * 0.7) * env(t, 0.01, 0.06));
      B('land', 0.15, (t, r, s) => (lp(s, r(), 0.08) + Math.sin(t * 2 * Math.PI * 60) * 0.6) * env(t, 0.002, 0.04));
      B('step', 0.08, (t, r, s) => lp(s, r(), 0.15) * env(t, 0.001, 0.02));
      B('step_metal', 0.12, (t, r, s) => (lp(s, r(), 0.3) * 0.5 + Math.sin(t * 2 * Math.PI * 900) * 0.3) * env(t, 0.001, 0.03));
      for (const g of ['m', 'f', 'n']) {
        const f0 = g === 'm' ? 140 : g === 'f' ? 260 : 90;
        B('pain_' + g, 0.32, (t, r, s) => {
          const f = f0 * (1.2 - t * 0.8) * (1 + 0.08 * Math.sin(t * 50));
          const saw = ((s.ph += f / s.sr) % 1) * 2 - 1;
          return (lp2(s, saw, 0.25) + lp(s, r(), 0.1) * 0.4) * env(t, 0.015, 0.1);
        });
        B('death_' + g, 0.9, (t, r, s) => {
          const f = f0 * (1.4 - t * 0.9) * (1 + 0.12 * Math.sin(t * 35));
          const saw = ((s.ph += f / s.sr) % 1) * 2 - 1;
          return (lp2(s, saw, 0.2) * 0.9 + lp(s, r(), 0.08) * 0.3) * env(t, 0.02, 0.35);
        });
      }
      B('gib', 0.6, (t, r, s) => (lp(s, r(), 0.06) * 1.2 + Math.sin(t * 2 * Math.PI * 70) * 0.5) * env(t, 0.003, 0.15));
      B('pickup_health', 0.35, (t, r, s) => Math.sin(s.ph += 2 * Math.PI * (500 + t * 1800) / s.sr) * env(t, 0.005, 0.12));
      B('pickup_mega', 0.8, (t, r, s) => (Math.sin(s.ph += 2 * Math.PI * (300 + t * 900) / s.sr) + Math.sin(s.ph2 += 2 * Math.PI * (450 + t * 1350) / s.sr) * 0.6) * env(t, 0.01, 0.3));
      B('pickup_armor', 0.4, (t, r, s) => (lp(s, r(), 0.4) * 0.5 * env(t, 0.001, 0.02) + Math.sin(t * 2 * Math.PI * 780) * 0.5 + Math.sin(t * 2 * Math.PI * 1170) * 0.3) * env(t, 0.002, 0.12));
      B('pickup_shard', 0.2, (t) => (Math.sin(t * 2 * Math.PI * 1500) + Math.sin(t * 2 * Math.PI * 2250) * 0.5) * env(t, 0.001, 0.05));
      B('pickup_weapon', 0.35, (t, r, s) => lp(s, r(), 0.5) * (env(t, 0.001, 0.02) + (t > 0.14 ? env(t - 0.14, 0.001, 0.03) : 0)));
      B('pickup_ammo', 0.18, (t, r, s) => lp(s, r(), 0.4) * env(t, 0.001, 0.03));
      B('pickup_powerup', 1.4, (t) => (Math.sin(t * 2 * Math.PI * 220) + Math.sin(t * 2 * Math.PI * 277) + Math.sin(t * 2 * Math.PI * 330) + Math.sin(t * 2 * Math.PI * 440 * (1 + t * 0.2)) * 0.5) * env(t, 0.05, 0.5));
      B('pickup_hold', 0.4, (t, r, s) => Math.sin(s.ph += 2 * Math.PI * (800 - t * 600) / s.sr) * env(t, 0.005, 0.12));
      B('respawn', 0.5, (t, r, s) => (lp(s, r(), 0.05 + t * 0.4) * 0.6 + Math.sin(t * 2 * Math.PI * 1300) * 0.3 * (t > 0.3 ? 1 : 0)) * env(t, 0.1, 0.12));
      B('teleport', 0.7, (t, r, s) => (Math.sin(s.ph += 2 * Math.PI * (200 + t * 1400) * (1 + 0.1 * Math.sin(t * 90)) / s.sr) * 0.6 + lp(s, r(), 0.1) * 0.3) * env(t, 0.02, 0.2));
      B('jumppad', 0.5, (t, r, s) => (Math.sin(s.ph += 2 * Math.PI * (140 + t * 700) / s.sr) * 0.7 + lp(s, r(), 0.1) * 0.5) * env(t, 0.005, 0.15));
      B('hit', 0.09, (t) => Math.sin(t * 2 * Math.PI * 1320) * env(t, 0.001, 0.03));
      B('hit_team', 0.12, (t) => Math.sin(t * 2 * Math.PI * 330) * env(t, 0.001, 0.05));
      B('noammo', 0.08, (t, r, s) => lp(s, r(), 0.6) * env(t, 0.001, 0.012));
      B('change', 0.12, (t, r, s) => lp(s, r(), 0.5) * env(t, 0.001, 0.02));
      B('quad_fire', 0.4, (t, r, s) => Math.sin(s.ph += 2 * Math.PI * (90 + t * 60) / s.sr) * env(t, 0.005, 0.12));
      B('menu', 0.06, (t) => Math.sin(t * 2 * Math.PI * 900) * env(t, 0.001, 0.015));
      B('menu_ok', 0.2, (t, r, s) => (Math.sin(t * 2 * Math.PI * 440) + lp(s, r(), 0.3) * 0.4) * env(t, 0.001, 0.06));
      B('talk', 0.12, (t) => (Math.sin(t * 2 * Math.PI * 1200) * (t < 0.05 ? 1 : 0) + Math.sin(t * 2 * Math.PI * 1600) * (t >= 0.06 ? 1 : 0)) * env(t, 0.001, 0.04));
      B('regen', 0.3, (t, r, s) => Math.sin(s.ph += 2 * Math.PI * (400 + t * 400) / s.sr) * env(t, 0.01, 0.1));
      B('protect', 0.25, (t, r, s) => (Math.sin(t * 2 * Math.PI * 300) * 0.5 + lp(s, r(), 0.2) * 0.5) * env(t, 0.005, 0.08));
      B('wearoff', 0.8, (t, r, s) => Math.sin(s.ph += 2 * Math.PI * (600 - t * 500) / s.sr) * env(t, 0.01, 0.3));
      B('sting', 0.9, (t, r, s) => (Math.sin(t * 2 * Math.PI * 55) + lp(s, r(), 0.05) * 0.6) * env(t, 0.005, 0.25));
      B('drop', 0.5, (t, r, s) => (lp(s, r(), 0.2) * 0.6 + Math.sin(t * 2 * Math.PI * 180) * 0.3) * env(t, 0.002, 0.1));
      B('bounce', 0.12, (t) => Math.sin(t * 2 * Math.PI * 420) * env(t, 0.001, 0.03));
    }

    play(key, o) {
      if (!this.ctx || !this.bufs[key]) return null;
      o = o || {};
      const src = this.ctx.createBufferSource();
      src.buffer = this.bufs[key];
      src.playbackRate.value = o.rate || 1;
      const g = this.ctx.createGain();
      g.gain.value = o.vol === undefined ? 1 : o.vol;
      let node = g;
      if (o.pan && this.ctx.createStereoPanner) {
        const p = this.ctx.createStereoPanner();
        p.pan.value = Q.clamp(o.pan, -1, 1);
        g.connect(p);
        node = p;
      }
      src.connect(g);
      node.connect(this.master);
      if (o.loop) src.loop = true;
      src.start();
      return { src, g };
    }

    at(key, pos, listener, o) {
      if (!this.ctx) return;
      o = o || {};
      let vol = o.vol === undefined ? 1 : o.vol, pan = 0;
      if (pos && listener) {
        const d = Q.vdist(pos, listener.pos);
        vol *= Q.clamp(1.15 - d / 1400, 0, 1);
        if (vol <= 0.01) return;
        const ang = Math.atan2(pos[1] - listener.pos[1], pos[0] - listener.pos[0]);
        pan = -Math.sin(Q.angDiff(listener.yaw, ang)) * Math.min(1, d / 200) * 0.8;
      }
      this.play(key, Object.assign({}, o, { vol, pan }));
    }

    loop(id, key, vol) {
      if (!this.ctx) return;
      let l = this.loops.get(id);
      if (!l) { l = this.play(key, { loop: true, vol }); if (l) this.loops.set(id, l); }
      else l.g.gain.value = vol;
    }

    stopLoop(id) {
      const l = this.loops.get(id);
      if (!l) return;
      try { l.src.stop(); } catch (e) { }
      this.loops.delete(id);
    }

    stopAll() {
      for (const id of [...this.loops.keys()]) this.stopLoop(id);
      this.stopMusic();
    }

    say(key) {
      this.play('sting', { vol: 0.35 });
      if (!this.speechOk || !SAY[key] || this.vol <= 0) return;
      try {
        if (key !== 'hit') speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(SAY[key]);
        if (this.voice) u.voice = this.voice;
        u.pitch = 0.15;
        u.rate = 0.82;
        u.volume = Math.min(1, this.vol * 1.1);
        speechSynthesis.speak(u);
      } catch (e) { }
    }

    startMusic(style) {
      if (!this.ctx) return;
      this.stopMusic();
      const ctx = this.ctx;
      const roots = [[41, 44, 39, 36], [38, 41, 43, 36], [40, 43, 38, 35], [36, 39, 41, 34], [43, 41, 38, 39]];
      const prog = roots[(style || 0) % roots.length];
      const bpm = [126, 118, 134, 110, 140][(style || 0) % 5];
      const step = 60 / bpm / 4;
      const hz = m => 440 * Math.pow(2, (m - 69) / 12);
      let t = ctx.currentTime + 0.1, i = 0;
      const noise = this.bufs.step;
      const sched = () => {
        while (t < ctx.currentTime + 0.25) {
          const bar = Math.floor(i / 16) % 4, s = i % 16;
          const root = prog[bar];
          if (s % 4 === 0) this.note(t, 'sine', hz(root - 12) * 2, 0.22, 0.5, 0.012, true);
          if (s === 4 || s === 12) this.hitNoise(t, noise, 0.35, 1.6);
          if (s % 2 === 1) this.hitNoise(t, noise, 0.08, 3);
          if ([0, 3, 6, 10, 11, 14].includes(s)) this.note(t, 'sawtooth', hz(root), step * 1.6, 0.16, 0.005);
          if (s === 0) this.note(t, 'triangle', hz(root + 12 + (bar % 2 ? 3 : 7)), step * 15, 0.05, 0.3);
          t += step; i++;
        }
      };
      sched();
      this.music = setInterval(sched, 60);
    }

    note(t, type, f, len, vol, att, kick) {
      const ctx = this.ctx;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      if (kick) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * 0.35), t + 0.12);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + att);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      const f2 = ctx.createBiquadFilter();
      f2.type = 'lowpass';
      f2.frequency.value = type === 'sawtooth' ? 900 : 4000;
      o.connect(f2); f2.connect(g); g.connect(this.musicBus);
      o.start(t); o.stop(t + len + 0.05);
    }

    hitNoise(t, buf, vol, rate) {
      const s = this.ctx.createBufferSource();
      s.buffer = buf;
      s.playbackRate.value = rate;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      s.connect(g); g.connect(this.musicBus);
      s.start(t);
    }

    stopMusic() {
      if (this.music) clearInterval(this.music);
      this.music = null;
    }
  }
  Q.Audio = Audio;
})(globalThis.Quake3 = globalThis.Quake3 || {});
