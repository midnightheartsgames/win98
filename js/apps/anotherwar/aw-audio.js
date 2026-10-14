(function (AW) {
  'use strict';

  const MASTER_HEADROOM = 0.65;

  AW.Audio = class {
    constructor() {
      this.ctx = null;
      this.buffers = new Map();
      this.vol = { music: 0.7, sound: 1, speech: 1 };
      this.voices = new Map();
      this.loops = new Map();
      this.musicName = '';
      this.musicNode = null;
      this.muted = false;
      this.listener = { x: 400, y: 300 };
    }

    ensure() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        return this.ctx;
      }
      const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.limiter = this.ctx.createDynamicsCompressor();
      this.limiter.threshold.value = -8;
      this.limiter.knee.value = 4;
      this.limiter.ratio.value = 20;
      this.limiter.attack.value = 0.001;
      this.limiter.release.value = 0.25;
      this.master.connect(this.limiter);
      this.limiter.connect(this.ctx.destination);
      this.gMusic = this.ctx.createGain();
      this.gSound = this.ctx.createGain();
      this.gSpeech = this.ctx.createGain();
      for (const g of [this.gMusic, this.gSound, this.gSpeech]) g.connect(this.master);
      this.applyVolumes();
      return this.ctx;
    }

    applyVolumes() {
      if (!this.ctx) return;
      this.gMusic.gain.value = this.vol.music;
      this.gSound.gain.value = this.vol.sound;
      this.gSpeech.gain.value = this.vol.speech;
      this.master.gain.value = this.muted ? 0 : MASTER_HEADROOM;
    }

    setVolume(kind, v) {
      this.vol[kind] = Math.max(0, Math.min(1, v));
      this.applyVolumes();
    }

    resolve(path) {
      const A = AW.Data.audio || {};
      let p = String(path || '').replace(/\\/g, '/').replace(/\.(wav|ogg|mp3)$/i, '').toLowerCase();
      if (A['sound/' + p] !== undefined) return 'sound/' + p;
      const parts = p.split('/');
      if (parts.length > 2) {
        const alt = parts[0] + '/' + parts[parts.length - 1];
        if (A['sound/' + alt] !== undefined) return 'sound/' + alt;
      }
      return null;
    }

    buffer(rel) {
      let p = this.buffers.get(rel);
      if (p) return p;
      const ctx = this.ensure();
      if (!ctx) return Promise.resolve(null);
      p = fetch(AW.Assets.base + rel + '.ogg').then(r => r.ok ? r.arrayBuffer() : null)
        .then(b => b ? ctx.decodeAudioData(b) : null).catch(() => null);
      this.buffers.set(rel, p);
      p.then(buf => { if (!buf && this.buffers.get(rel) === p) this.buffers.delete(rel); });
      return p;
    }

    spatial(x, y, vol) {
      if (x === undefined || x === null) return { gain: vol, pan: 0 };
      const dx = x - this.listener.x, dy = (y - this.listener.y) * 1.4;
      const d = Math.hypot(dx, dy);
      const g = vol * Math.max(0, 1 - Math.max(0, d - 260) / 700);
      return { gain: g, pan: Math.max(-0.8, Math.min(0.8, dx / 600)) };
    }

    play(path, x, y, vol) {
      const rel = this.resolve(path);
      if (!rel || !this.ensure()) return;
      const sp = this.spatial(x, y, (vol === undefined ? 100 : vol) / 100);
      if (sp.gain < 0.02) return;
      this.buffer(rel).then(buf => {
        if (!buf) return;
        const ctx = this.ctx;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain();
        g.gain.value = sp.gain;
        let node = src;
        node.connect(g);
        if (ctx.createStereoPanner) {
          const pn = ctx.createStereoPanner();
          pn.pan.value = sp.pan;
          g.connect(pn);
          pn.connect(this.gSound);
        } else g.connect(this.gSound);
        src.start();
      });
    }

    voice(key, actor) {
      if (!this.ensure()) return;
      this.stopVoice(actor);
      const rel = 'speech/' + key;
      const token = {};
      this.voices.set(actor, token);
      this.buffer(rel).then(buf => {
        if (!buf || this.voices.get(actor) !== token) return;
        const ctx = this.ctx;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain();
        const sp = actor ? this.spatial(actor.x, actor.y, 1) : { gain: 1 };
        g.gain.value = Math.max(0.35, sp.gain);
        src.connect(g);
        g.connect(this.gSpeech);
        src.start();
        token.src = src;
        src.onended = () => {
          if (this.voices.get(actor) === token) this.voices.delete(actor);
          this.buffers.delete(rel);
        };
      });
    }

    stopVoice(actor) {
      const t = this.voices.get(actor);
      if (!t) return;
      this.voices.delete(actor);
      if (t.src) { try { t.src.stop(); } catch (e) { } }
    }

    stopAllVoices() { for (const a of [...this.voices.keys()]) this.stopVoice(a); }

    music(name) {
      if (!this.ensure()) return;
      const n = String(name || '').toLowerCase();
      if (n === this.musicName) return;
      const prev = this.musicName;
      this.musicName = n;
      for (const k of [...this.buffers.keys()]) if (k.startsWith('music/') && k !== 'music/' + n && k !== 'music/' + prev) this.buffers.delete(k);
      const old = this.musicNode;
      this.musicNode = null;
      if (old) {
        const t = this.ctx.currentTime;
        old.g.gain.setValueAtTime(old.g.gain.value, t);
        old.g.gain.linearRampToValueAtTime(0, t + 1.2);
        setTimeout(() => { try { old.src.stop(); } catch (e) { } }, 1400);
      }
      if (!n) return;
      this.buffer('music/' + n).then(buf => {
        if (!buf || this.musicName !== n) return;
        const ctx = this.ctx;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const g = ctx.createGain();
        g.gain.value = 0;
        g.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5);
        src.connect(g);
        g.connect(this.gMusic);
        src.start();
        this.musicNode = { src, g };
      });
    }

    loop(def) {
      if (!def || this.loops.has(def) || !this.ensure()) return;
      const rel = this.resolve(def.snd);
      if (!rel) return;
      const rec = { def, g: null, src: null };
      this.loops.set(def, rec);
      this.buffer(rel).then(buf => {
        if (!buf || this.loops.get(def) !== rec) return;
        const ctx = this.ctx;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const g = ctx.createGain();
        g.gain.value = 0;
        src.connect(g);
        g.connect(this.gSound);
        src.start();
        rec.src = src;
        rec.g = g;
      });
    }

    stopLoop(def) {
      const rec = this.loops.get(def);
      if (!rec) return;
      this.loops.delete(def);
      if (rec.src) { try { rec.src.stop(); } catch (e) { } }
    }

    stopLoops() { for (const d of [...this.loops.keys()]) this.stopLoop(d); }

    update(cx, cy) {
      this.listener.x = cx;
      this.listener.y = cy;
      if (!this.ctx) return;
      for (const rec of this.loops.values()) {
        if (!rec.g) continue;
        const d = rec.def;
        const sp = d.global ? { gain: (d.vol || 100) / 100 } : this.spatial(d.x, d.y, (d.vol || 100) / 100);
        rec.g.gain.setTargetAtTime(d.active === 0 ? 0 : sp.gain, this.ctx.currentTime, 0.2);
      }
    }

    destroy() {
      this.stopLoops();
      this.stopAllVoices();
      if (this.ctx) this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  };
})(globalThis.AW = globalThis.AW || {});
